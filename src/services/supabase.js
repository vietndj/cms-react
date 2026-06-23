import { SUPA_URL, SUPA_KEY } from "../constants/config";
import { encryptToken } from "./crypto";

export const getSupaHeaders = () => ({
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
});

export const fetchSupabaseDB = async () => {
  try {
    const r = await fetch(`${SUPA_URL}cms_store?id=eq.1&select=data`, {
      headers: {
        ...getSupaHeaders(),
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
      cache: "no-store",
    });
    if (r.ok) {
      const res = await r.json();
      if (!res || res.length === 0) {
        console.warn("Supabase: bảng cms_store trống hoặc không có row id=1");
        return null;
      }
      return res[0]?.data || null;
    }
    const errBody = await r.text().catch(() => "");
    console.error(`Supabase lỗi HTTP ${r.status}:`, errBody);
  } catch (e) {
    console.error("Lỗi fetch DB:", e.message);
  }
  return null;
};

export const updateSupabaseDB = async (d) => {
  try {
    // Đính kèm _encToken đã cache từ localStorage để không bị mất khi sync
    const cachedEnc = localStorage.getItem("_enc_token_cache");
    const encToken = cachedEnc ? JSON.parse(cachedEnc) : null;
    const payload = encToken ? { ...d, _encToken: encToken } : d;
    const r = await fetch(`${SUPA_URL}cms_store?id=eq.1`, {
      method: "PATCH",
      headers: getSupaHeaders(),
      body: JSON.stringify({ data: payload }),
    });
    if (!r.ok) {
      throw new Error(await r.text());
    }
    return true;
  } catch (e) {
    console.error("Lỗi update DB:", e);
    return false;
  }
};

export const fetchTokenFromCloud = async () => {
  try {
    const r = await fetch(`${SUPA_URL}cms_store?id=eq.1&select=data`, {
      headers: { ...getSupaHeaders(), "Cache-Control": "no-store" },
      cache: "no-store",
    });
    if (r.ok) {
      const res = await r.json();
      const d = res[0]?.data;
      return d?._encToken || null;
    }
  } catch (e) {
    console.error("Fetch token error:", e);
  }
  return null;
};

export const saveTokenToCloud = async (token, pin) => {
  try {
    const enc = await encryptToken(token, pin);
    if (!enc) return false;
    // Đọc data hiện tại để merge, tránh mất dữ liệu
    const r0 = await fetch(`${SUPA_URL}cms_store?id=eq.1&select=data`, {
      headers: getSupaHeaders(),
    });
    const existing = (r0.ok ? await r0.json() : [])[0]?.data || {};
    const merged = { ...existing, _encToken: enc };
    const r = await fetch(`${SUPA_URL}cms_store?id=eq.1`, {
      method: "PATCH",
      headers: getSupaHeaders(),
      body: JSON.stringify({ data: merged }),
    });
    if (r.ok) {
      try {
        localStorage.setItem("_enc_token_cache", JSON.stringify(enc));
      } catch (e) {}
      return true;
    }
  } catch (e) {
    console.error("Save token error:", e);
  }
  return false;
};
