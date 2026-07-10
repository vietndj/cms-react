import { useState, useRef, useEffect } from "react";
import { fetchSupabaseDB, updateSupabaseDB } from "../services/supabase";

export function useDatabase(isAuthenticated) {
  const [db, setDb] = useState({
    files: [],
    repos: {},
    tags: {},
    pinned: [],
    links: {},
    colors: {},
    titles: {},
    tasks: [],
    views: {},
    deleted: [],
    jsonSyncInfo: "",
  });
  const [status, setStatus] = useState({ text: "", type: "" });
  const [isSyncing, setIsSyncing] = useState(false);
  const dbRef = useRef(null);

  // Fix #3: giữ dbRef luôn trỏ tới state mới nhất (tránh stale closure)
  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  const mergeDBs = (loc, cld) => {
    if (!cld) return loc;
    if (!loc) return cld;
    const m = new Map();
    (cld.files || []).forEach((f) => m.set(`${f.repoName}/${f.fileName}`, f));
    (loc.files || []).forEach((f) => {
      const k = `${f.repoName}/${f.fileName}`,
        ex = m.get(k);
      if (
        !ex ||
        Math.max(f.lastScanned || 0, f.timestamp || 0) >
          Math.max(ex.lastScanned || 0, ex.timestamp || 0) ||
        (f.preview &&
          f.preview.length > 50 &&
          (!ex.preview || ex.preview.length < 50))
      )
        m.set(k, f);
    });
    const nF = Array.from(m.values()).sort((a, b) => b.timestamp - a.timestamp);
    const rM = {};
    nF.forEach((f) => {
      if (!rM[f.repoName]) rM[f.repoName] = [];
      rM[f.repoName].push(f);
    }); // Fix #2: Metadata — bên có _updatedAt mới hơn thắng
    const locTime = loc._updatedAt || 0,
      cldTime = cld._updatedAt || 0;
    const newer = locTime >= cldTime ? loc : cld;
    const older = newer === loc ? cld : loc;
    // Views: luôn lấy max per-key
    const mergedViews = {};
    [older.views || {}, newer.views || {}].forEach((vs) =>
      Object.keys(vs).forEach((k) => {
        mergedViews[k] = Math.max(mergedViews[k] || 0, vs[k] || 0);
      }),
    );
    // Tags/titles/links/colors: newer wins per-key
    const mO = (a, b) => ({ ...b, ...a });
    return {
      ...older,
      ...newer,
      files: nF,
      repos: rM,
      pinned: newer.pinned || older.pinned || [],
      deleted: Array.from(
        new Set([...(loc.deleted || []), ...(cld.deleted || [])]),
      ),
      tasks: newer.tasks || older.tasks || [],
      tags: mO(newer.tags || {}, older.tags || {}),
      titles: mO(newer.titles || {}, older.titles || {}),
      links: mO(newer.links || {}, older.links || {}),
      colors: mO(newer.colors || {}, older.colors || {}),
      views: mergedViews,
    };
  };

  const saveLocalDb = (nd) => {
    try {
      localStorage.setItem("cms_repo_data", JSON.stringify(nd));
      setDb(nd);
    } catch (e) {
      setDb(nd);
    }
  };

  const syncMetaAndDB = async (newState) => {
    setStatus({ text: "Đang hợp nhất Cloud...", type: "loading" });
    try {
      const cloudDb = await fetchSupabaseDB();
      const withTs = { ...newState, _updatedAt: Date.now() };
      const mergedDb = mergeDBs(withTs, cloudDb);
      const ok = await updateSupabaseDB(mergedDb);
      if (!ok) throw new Error("Cloud Reject");
      saveLocalDb(mergedDb);
      setStatus({ text: "Lưu Cloud thành công!", type: "success" });
      setTimeout(() => setStatus({ text: "", type: "" }), 2000);
      return mergedDb;
    } catch (e) {
      setStatus({ text: "Lỗi Cloud! Chỉ lưu tạm trên máy.", type: "error" });
      alert(
        "⛔ LỖI ĐỒNG BỘ CLOUD!\n\nMạng lag hoặc Data quá lớn khiến Supabase từ chối.\nDữ liệu hiện CHỈ LƯU TẠM trên máy này.\nHãy ấn nút 'Tải Lại & Hợp Nhất DB' để đẩy lại!",
      );
      saveLocalDb(newState);
      return newState;
    }
  };

  const loadDatabase = async (forcePush = false, currentTitle = "", currentContent = "", currentSha = "") => {
    if (isSyncing) return;
    setIsSyncing(true);
    setStatus({ text: "Đang tải DB Cloud và Hợp nhất...", type: "loading" });
    try {
      const cDbRaw = await fetchSupabaseDB();
      const cDb = cDbRaw ? (({ _encToken, ...rest }) => rest)(cDbRaw) : null;
      const lStr = localStorage.getItem("cms_repo_data");
      let lDb = null;
      try {
        lDb = lStr ? JSON.parse(lStr) : null;
        if (lDb && (!Array.isArray(lDb.files) || !lDb.files)) {
          lDb = null;
          localStorage.removeItem("cms_repo_data");
        }
      } catch (e) {
        lDb = null;
        localStorage.removeItem("cms_repo_data");
      }
      if (!cDb && !lDb) {
        setStatus({
          text: "⚠️ Không kết nối được Cloud DB. Kiểm tra mạng!",
          type: "error",
        });
        setTimeout(() => setStatus({ text: "", type: "" }), 5000);
        setIsSyncing(false);
        return null;
      }
      const finalDb =
        lDb && cDb
          ? mergeDBs({ ...lDb, _updatedAt: Date.now() }, cDb)
          : lDb || cDb || { files: [] };
      saveLocalDb(finalDb);
      setStatus({
        text: `Đã Gộp & Đồng bộ: ${finalDb.files?.length || 0} bài!`,
        type: "success",
      });
      setTimeout(() => setStatus({ text: "", type: "" }), 3000);

      const hasChanges =
        !cDb ||
        cDb.files?.length !== finalDb.files?.length ||
        (cDb._updatedAt || 0) < (finalDb._updatedAt || 0) ||
        JSON.stringify(cDb.pinned) !== JSON.stringify(finalDb.pinned) ||
        JSON.stringify(cDb.tasks) !== JSON.stringify(finalDb.tasks) ||
        JSON.stringify(cDb.deleted) !== JSON.stringify(finalDb.deleted);

      if (forcePush || hasChanges) {
        await updateSupabaseDB(finalDb);
      }
      return finalDb;
    } catch (e) {
      setStatus({
        text: "⚠️ Lỗi nạp DB: " + (e.message || "Không xác định"),
        type: "error",
      });
      setTimeout(() => setStatus({ text: "", type: "" }), 5000);
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  // Polling 30s + Page Visibility để nhận thay đổi từ browser khác
  useEffect(() => {
    if (!isAuthenticated) return;
    let tid = null;
    const poll = async () => {
      try {
        const cloudDb = await fetchSupabaseDB();
        if (!cloudDb || !dbRef.current) return;
        const cur = dbRef.current;
        if ((cloudDb._updatedAt || 0) <= (cur._updatedAt || 0)) return;
        const merged = mergeDBs(cur, cloudDb);
        try {
          localStorage.setItem("cms_repo_data", JSON.stringify(merged));
        } catch (e) {}
        setDb(merged);
      } catch (e) {}
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") poll();
    };
    tid = setInterval(poll, 30000);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(tid);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAuthenticated]);

  return {
    db,
    setDb,
    dbRef,
    status,
    setStatus,
    isSyncing,
    saveLocalDb,
    mergeDBs,
    loadDatabase,
    syncMetaAndDB,
  };
}
