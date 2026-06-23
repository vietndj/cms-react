import { safeEnc } from "../utils/helpers";

export const encodeBase64UTF8Async = async (str) => {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 16384) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 16384));
  }
  return btoa(binary);
};

export const getHeaders = (token) => {
  return token
    ? {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      }
    : { Accept: "application/vnd.github.v3+json" };
};

// Phá cache bằng ?t=Date.now(), TUYỆT ĐỐI KHÔNG dùng Cache-Control để tránh lỗi Preflight CORS
export const fetchJSON = async (url, token) => {
  try {
    const res = await fetch(url, { headers: getHeaders(token) });
    return res.ok ? await res.json() : null;
  } catch (e) {
    return null;
  }
};

export const fetchText = async (url, token) => {
  try {
    const headers = {
      ...getHeaders(token),
      Accept: "application/vnd.github.v3.raw",
    };
    const res = await fetch(url, { headers });
    return res.ok ? await res.text() : null;
  } catch (e) {
    return null;
  }
};

export const getFileShaSafe = async (repoPath, file, token) => {
  try {
    let d = await fetchJSON(
      `https://api.github.com/repos/${repoPath}/contents/${safeEnc(file)}?t=${Date.now()}`,
      token,
    );
    if (d && !Array.isArray(d)) return d.sha;
    let d2 = await fetchJSON(
      `https://api.github.com/repos/${repoPath}/contents/?t=${Date.now()}`,
      token,
    );
    if (d2 && Array.isArray(d2)) {
      const f = d2.find((x) => x.name === file);
      if (f) return f.sha;
    }
    return null;
  } catch (e) {
    return null;
  }
};
