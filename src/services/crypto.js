// ── Cloud Token Crypto (AES-GCM + PBKDF2) ──────────────────────────────────
const buf2b64 = (b) => btoa(String.fromCharCode(...new Uint8Array(b)));
const b642buf = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;

const deriveKey = async (pin) => {
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("cms-fedu-salt-v1"),
      iterations: 100000,
      hash: "SHA-256",
    },
    km,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

export const encryptToken = async (token, pin) => {
  try {
    const key = await deriveKey(pin);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(token),
    );
    return { iv: buf2b64(iv.buffer), ct: buf2b64(enc) };
  } catch (e) {
    console.error("Encrypt error:", e);
    return null;
  }
};

export const decryptToken = async (data, pin) => {
  try {
    if (!data?.iv || !data?.ct) return null;
    const key = await deriveKey(pin);
    const dec = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(b642buf(data.iv)) },
      key,
      b642buf(data.ct),
    );
    return new TextDecoder().decode(dec);
  } catch (e) {
    console.error("Decrypt error:", e);
    return null;
  }
};
