import { useState, useRef, useEffect } from "react";
import { USERNAME } from "../constants/config";
import { useAuth } from "./useAuth";
import { useDatabase } from "./useDatabase";
import { useSearch } from "./useSearch";
import { useSync } from "./useSync";
import { fetchText, getFileShaSafe, encodeBase64UTF8Async } from "../services/github";
import { getPreviewText, safeEnc } from "../utils/helpers";
import { fetchSupabaseDB } from "../services/supabase";

export function useCMS() {
  const auth = useAuth();
  const db = useDatabase(auth.isAuthenticated);
  const search = useSearch(db.db);
  
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [nativeTaskInput, setNativeTaskInput] = useState("");
  const [activeColorPickerCard, setActiveColorPickerCard] = useState(null);
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [repo, setRepo] = useState(
    () => localStorage.getItem("cms_last_repo") || `${USERNAME}/${USERNAME}.github.io`,
  );
  const [tags, setTags] = useState(() => localStorage.getItem("cms_last_tags") || "");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [uploadLinks, setUploadLinks] = useState([]);
  const [content, setContent] = useState("");
  const [editorOriginal, setEditorOriginal] = useState({
    repo: "",
    filename: "",
    sha: "",
  });

  const toolsMenuRef = useRef(null);
  const editorInputRef = useRef(null);

  const sync = useSync({
    db: db.db,
    token: auth.token,
    setStatus: db.setStatus,
    setIsSaving,
    mergeDBs: db.mergeDBs,
    saveLocalDb: db.saveLocalDb,
    syncMetaAndDB: db.syncMetaAndDB,
  });

  useEffect(() => {
    if (isEditorOpen && editorInputRef.current)
      setTimeout(() => editorInputRef.current.focus(), 100);
  }, [isEditorOpen]);

  useEffect(() => {
    const h = (e) => {
      const c = navigator.platform.toUpperCase().indexOf("MAC") >= 0 ? e.metaKey : e.ctrlKey;
      if (c && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setIsEditorOpen((p) => !p);
      }
      if (c && e.key.toLowerCase() === "s") {
        e.preventDefault();
        document.getElementById("btn-save-article")?.click();
      }
      if (c && e.key.toLowerCase() === "k") {
        const t = e.target;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
        e.preventDefault();
        document.getElementById("search-input-main")?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target))
        setIsToolsOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (auth.isAuthenticated) db.loadDatabase();
  }, [auth.isAuthenticated]);

  const handleSaveArticle = async () => {
    if (!auth.token) return alert("Cần nhập GitHub Token để xuất bản bài viết!");
    if (!repo || !title || !content) return alert("Thiếu dữ liệu bài viết!");
    
    setIsSaving(true);
    db.setStatus({ text: "Đang xử lý & Gộp dữ liệu...", type: "loading" });
    try {
      let fn = slug.endsWith(".html") ? slug : slug + ".html",
        rn = repo.includes("/") ? repo.split("/")[1] : repo,
        ro = repo.includes("/") ? repo.split("/")[0] : USERNAME,
        fk = `${rn}/${fn}`,
        or = editorOriginal.repo
          ? editorOriginal.repo.includes("/")
            ? editorOriginal.repo.split("/")[1]
            : editorOriginal.repo
          : null;
          
      let nt = { ...(db.db.tags || {}) },
        ta = tags
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      if (ta.length) nt[fk] = ta;
      else delete nt[fk];
      
      let nti = { ...(db.db.titles || {}) };
      nti[fk] = title;
      
      let nl = { ...(db.db.links || {}) },
        vl = uploadLinks.filter((l) => l.title.trim() && l.url.trim());
      if (vl.length) nl[fk] = vl;
      else delete nl[fk];
      
      let nf = [...(db.db.files || [])].filter(
        (f) =>
          !(f.repoName === rn && f.fileName === fn) &&
          !(or && f.repoName === or && f.fileName === editorOriginal.filename),
      );
      
      const d = new Date(),
        tempSha = editorOriginal.sha || `temp_${Date.now()}`;
        
      nf.unshift({
        repoName: rn,
        name: title,
        fileName: fn,
        sha: tempSha,
        url: `https://fedu.vn/${rn === `${ro}.github.io` ? "" : rn + "/"}${fn}`,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        fullDate: d.toLocaleString("vi-VN"),
        preview: getPreviewText(content),
      });
      
      const rm = {};
      nf.forEach((f) => {
        if (!rm[f.repoName]) rm[f.repoName] = [];
        rm[f.repoName].push(f);
      });
      
      const ns = {
        ...db.db,
        files: nf,
        tags: nt,
        titles: nti,
        links: nl,
        repos: rm,
      };
      
      await db.syncMetaAndDB(ns);
      
      localStorage.setItem("cms_last_repo", repo);
      localStorage.setItem("cms_last_tags", tags);
      
      const bgContent = content,
        bgTitle = title,
        bgEditor = editorOriginal;
        
      setTitle("");
      setSlug("");
      setContent("");
      setUploadLinks([]);
      setIsSlugEdited(false);
      setEditorOriginal({ repo: "", filename: "", sha: "" });
      
      (async () => {
        try {
          const ec = await encodeBase64UTF8Async(bgContent);
          let fs = await getFileShaSafe(`${ro}/${rn}`, fn, auth.token);
          const rh = await fetch(
            `https://api.github.com/repos/${ro}/${rn}/contents/${safeEnc(fn)}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${auth.token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: `Save: ${bgTitle}`,
                content: ec,
                sha: fs || undefined,
              }),
            },
          );
          
          let realSha = tempSha;
          if (rh.ok) {
            const rd = await rh.json();
            realSha = rd.content?.sha || fs;
            db.setStatus({
              text: "Đã xuất bản mã nguồn GitHub!",
              type: "success",
            });
            setTimeout(() => db.setStatus({ text: "", type: "" }), 3000);
          }
          
          if (
            bgEditor.filename &&
            (or !== rn || bgEditor.filename !== fn) &&
            bgEditor.sha
          ) {
            const oo = bgEditor.repo.split("/")[0] || USERNAME;
            let os = await getFileShaSafe(
              `${oo}/${or}`,
              bgEditor.filename,
              auth.token,
            );
            if (os)
              await fetch(
                `https://api.github.com/repos/${oo}/${or}/contents/${safeEnc(bgEditor.filename)}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${auth.token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ message: `Xóa cũ`, sha: os }),
                },
              );
          }
          
          if (realSha !== tempSha) {
            db.setDb((cd) => {
              const uF = cd.files.map((f) =>
                  f.repoName === rn && f.fileName === fn
                    ? { ...f, sha: realSha }
                    : f,
                ),
                uD = { ...cd, files: uF };
              db.syncMetaAndDB(uD);
              return uD;
            });
          }
        } catch (e) {
          db.setStatus({ text: "Lỗi đồng bộ GitHub", type: "error" });
          setTimeout(() => db.setStatus({ text: "", type: "" }), 3000);
        }
      })();
    } catch (e) {
      db.setStatus({ text: "Lỗi lưu", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!editorOriginal.sha || !editorOriginal.filename) return;
    if (!window.confirm("Chuyển bài viết này vào thùng rác?")) return;
    setIsSaving(true);
    db.setStatus({ text: "Đang xóa & Gộp...", type: "loading" });
    try {
      const r = editorOriginal.repo.split("/")[1],
        fk = `${r}/${editorOriginal.filename}`,
        nd = { ...db.db, deleted: [...(db.db.deleted || []), fk] };
      await db.syncMetaAndDB(nd);
      db.setStatus({ text: "Đã chuyển vào thùng rác!", type: "success" });
      setTitle("");
      setSlug("");
      setContent("");
      setTags(localStorage.getItem("cms_last_tags") || "");
      setUploadLinks([]);
      setIsSlugEdited(false);
      setEditorOriginal({ repo: "", filename: "", sha: "" });
      setIsEditorOpen(false);
      setTimeout(() => db.setStatus({ text: "", type: "" }), 2000);
    } catch (e) {
      db.setStatus({ text: "Lỗi", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreArticle = async (fk) => {
    const nd = { ...db.db, deleted: (db.db.deleted || []).filter((x) => x !== fk) };
    await db.syncMetaAndDB(nd);
  };

  const handleHardDelete = async (f) => {
    if (!auth.token) return alert("Cần Token Github để xóa!");
    if (!window.confirm("XÓA VĨNH VIỄN? Không thể khôi phục!")) return;
    db.setStatus({ text: "Đang dọn DB...", type: "loading" });
    try {
      const o = USERNAME,
        fk = `${f.repoName}/${f.fileName}`,
        nf = db.db.files.filter(
          (x) => !(x.repoName === f.repoName && x.fileName === f.fileName),
        ),
        rm = {};
      nf.forEach((x) => {
        if (!rm[x.repoName]) rm[x.repoName] = [];
        rm[x.repoName].push(x);
      });
      const nd = {
        ...db.db,
        files: nf,
        repos: rm,
        deleted: (db.db.deleted || []).filter((x) => x !== fk),
      };
      await db.syncMetaAndDB(nd);
      db.setStatus({ text: "Đã xóa vĩnh viễn!", type: "success" });
      setTimeout(() => db.setStatus({ text: "", type: "" }), 2000);
      (async () => {
        try {
          let os = await getFileShaSafe(
            `${o}/${f.repoName}`,
            f.fileName,
            auth.token,
          );
          if (os)
            await fetch(
              `https://api.github.com/repos/${o}/${f.repoName}/contents/${safeEnc(f.fileName)}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${auth.token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  message: `Delete permanently`,
                  sha: os,
                }),
              },
            );
        } catch (e) {}
      })();
    } catch (e) {
      db.setStatus({ text: "Lỗi", type: "error" });
    }
  };

  const editFileContent = async (rn, f, s) => {
    setIsEditorOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    db.setStatus({ text: "Đang nạp...", type: "loading" });
    try {
      const r = await fetchText(
        `https://api.github.com/repos/${USERNAME}/${rn}/contents/${safeEnc(f)}?t=${Date.now()}`,
        auth.token,
      );
      if (r) {
        setContent(r);
        const p =
            rn === USERNAME || rn === `${USERNAME}.github.io`
              ? `${USERNAME}/${USERNAME}.github.io`
              : `${USERNAME}/${rn}`,
          k = `${rn}/${f}`;
        setRepo(p);
        setTitle(db.db.titles?.[k] || f.replace(".html", ""));
        setSlug(f.replace(".html", ""));
        setIsSlugEdited(true);
        setTags((db.db.tags?.[k] || []).join(", "));
        setUploadLinks(
          db.db.links?.[k] ? JSON.parse(JSON.stringify(db.db.links[k])) : [],
        );
        setEditorOriginal({ repo: p, filename: f, sha: s });
        const nf = db.db.files.map((x) =>
            x.repoName === rn && x.fileName === f
              ? { ...x, lastAccessed: Date.now() }
              : x,
          ),
          nd = { ...db.db, files: nf };
        db.setDb(nd);
        db.saveLocalDb(nd);
        db.setStatus({ text: "Xong!", type: "success" });
        setTimeout(() => db.setStatus({ text: "", type: "" }), 1000);
        db.syncMetaAndDB(nd);
      }
    } catch (e) {
      db.setStatus({ text: "Lỗi nạp", type: "error" });
    }
  };

  const togglePin = async (r, f) => {
    const k = `${r}/${f}`;
    let np = [...(db.db.pinned || [])];
    if (np.includes(k)) np = np.filter((x) => x !== k);
    else np.push(k);
    const nd = { ...db.db, pinned: np };
    db.setDb(nd);
    db.saveLocalDb(nd);
    db.syncMetaAndDB(nd);
  };

  const handleSetColor = async (k, c) => {
    const nc = { ...(db.db.colors || {}) };
    if (c) nc[k] = c;
    else delete nc[k];
    const ns = { ...db.db, colors: nc };
    setActiveColorPickerCard(null);
    db.syncMetaAndDB(ns);
  };

  const changeTheme = (t) => {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("cms_theme", t);
  };

  const handleReadArticle = async (f) => {
    const k = `${f.repoName}/${f.fileName}`,
      nv = { ...(db.db.views || {}), [k]: ((db.db.views || {})[k] || 0) + 1 },
      nf = db.db.files.map((x) =>
        x.repoName === f.repoName && x.fileName === f.fileName
          ? { ...x, lastAccessed: Date.now() }
          : x,
      ),
      nd = { ...db.db, views: nv, files: nf };
    db.setDb(nd);
    db.saveLocalDb(nd);
    window.open(f.url, "_blank");
    db.syncMetaAndDB(nd);
  };

  const hardScrapeRepo = async () => {
    if (!auth.token) return alert("Cần Token GitHub!");
    let qStr = localStorage.getItem("cms_scan_queue");
    if (qStr) {
      try {
        const q = JSON.parse(qStr);
        if (q && q.files && q.currentIndex < q.files.length) {
          if (
            window.confirm(
              `Phát hiện tiến trình quét kho "${q.repo}" đang dở dang (${q.currentIndex}/${q.files.length} bài).\nBạn có muốn QUÉT TIẾP KHÔNG?`,
            )
          ) {
            return sync.processScanQueue(q);
          } else localStorage.removeItem("cms_scan_queue");
        } else localStorage.removeItem("cms_scan_queue");
      } catch (e) {
        localStorage.removeItem("cms_scan_queue");
      }
    }
    const tR = window.prompt(
      "Nhập tên Repo muốn quét (VD: vietndj.github.io):",
      `${USERNAME}.github.io`,
    );
    if (!tR) return;
    const isForce = window.confirm(
      "CHẾ ĐỘ ĐỐI SOÁT THÔNG MINH:\n\n- Chọn [CANCEL] (Khuyên dùng): Đối soát cấu trúc GitHub, tự bỏ qua bài đã chuẩn và giữ nguyên bài của thiết bị khác.\n- Chọn [OK]: Ép tải lại toàn bộ từ đầu.",
    );
    setIsSaving(true);
    db.setStatus({
      text: `Đang đối soát danh sách file với GitHub Tree...`,
      type: "loading",
    });
    try {
      const rInfo = await fetch(
        `https://api.github.com/repos/${USERNAME}/${tR}`,
        { headers: { Authorization: `Bearer ${auth.token}` } },
      );
      if (!rInfo.ok) throw new Error("Không lấy được thông tin repo");
      const dInfo = await rInfo.json();
      const defaultBranch = dInfo.default_branch || "main";

      const r1 = await fetch(
        `https://api.github.com/repos/${USERNAME}/${tR}/branches/${defaultBranch}`,
        { headers: { Authorization: `Bearer ${auth.token}` } },
      );
      if (!r1.ok) throw new Error(`Không thấy nhánh ${defaultBranch}`);
      const d1 = await r1.json(),
        r2 = await fetch(
          `https://api.github.com/repos/${USERNAME}/${tR}/git/trees/${d1.commit.commit.tree.sha}?recursive=1`,
          { headers: { Authorization: `Bearer ${auth.token}` } },
        ),
        d2 = await r2.json();
      const htmlFiles = d2.tree.filter(
        (i) =>
          i.type === "blob" &&
          i.path.endsWith(".html") &&
          !["index.html", "tin.html", "export.html"].includes(i.path),
      );
      if (htmlFiles.length === 0) {
        db.setStatus({ text: "Không có HTML!", type: "error" });
        setTimeout(() => db.setStatus({ text: "", type: "" }), 3000);
        setIsSaving(false);
        return;
      }
      
      const cloudDb = await fetchSupabaseDB();
      const lStr = localStorage.getItem("cms_repo_data");
      const lDb = lStr ? JSON.parse(lStr) : { files: [] };
      const latestDb = db.mergeDBs(lDb, cloudDb);
      const gitPaths = new Set(htmlFiles.map((f) => f.path));
      let cleanFiles = latestDb.files.filter(
        (f) => f.repoName !== tR || gitPaths.has(f.fileName),
      );
      let pending = [];
      for (let i = 0; i < htmlFiles.length; i++) {
        const f = htmlFiles[i];
        if (isForce) {
          pending.push({ path: f.path, sha: f.sha, index: i });
          continue;
        }
        const ex = cleanFiles.find(
            (x) => x.repoName === tR && x.fileName === f.path,
          ),
          hasValidPreview =
            ex &&
            ex.preview &&
            ex.preview.length > 50 &&
            !ex.preview.includes("Lỗi") &&
            !ex.preview.includes("Đang xử lý");
        if (!hasValidPreview)
          pending.push({ path: f.path, sha: f.sha, index: i });
      }
      
      const rm = {};
      cleanFiles.forEach((f) => {
        if (!rm[f.repoName]) rm[f.repoName] = [];
        rm[f.repoName].push(f);
      });
      const initialDb = { ...latestDb, files: cleanFiles, repos: rm };
      db.saveLocalDb(initialDb);
      
      if (pending.length === 0) {
        db.setStatus({
          text: `Đối soát xong! Toàn bộ bài viết đã khớp cấu trúc GitHub.`,
          type: "success",
        });
        await db.syncMetaAndDB(initialDb);
        setTimeout(() => db.setStatus({ text: "", type: "" }), 3000);
        setIsSaving(false);
        return;
      }
      const qd = { repo: tR, files: pending, currentIndex: 0, isForce };
      localStorage.setItem("cms_scan_queue", JSON.stringify(qd));
      sync.processScanQueue(qd);
    } catch (e) {
      db.setStatus({ text: "Lỗi: " + e.message, type: "error" });
      setTimeout(() => db.setStatus({ text: "", type: "" }), 3000);
      setIsSaving(false);
    }
  };

  return {
    state: {
      isAuthenticated: auth.isAuthenticated,
      pin: auth.pin,
      token: auth.token,
      db: db.db,
      status: db.status,
      isSyncing: db.isSyncing,
      searchQuery: search.searchQuery,
      isDeepSearch: search.isDeepSearch,
      activeRepo: search.activeRepo,
      activeTag: search.activeTag,
      currentView: search.currentView,
      isTasksOpen,
      isToolsOpen,
      nativeTaskInput,
      activeColorPickerCard,
      isEditorOpen,
      isSaving,
      repo,
      tags,
      title,
      slug,
      isSlugEdited,
      uploadLinks,
      content,
      editorOriginal,
      toolsMenuRef,
      editorInputRef,
    },
    data: {
      repoKeysList: search.repoKeysList,
      allUniqueTags: search.allUniqueTags,
      processedFiles: search.processedFiles,
      groupedFilesByRepo: search.groupedFilesByRepo,
      getFileTags: search.getFileTags,
      getFileLinks: search.getFileLinks,
    },
    actions: {
      setIsAuthenticated: auth.setIsAuthenticated,
      setPin: auth.setPin,
      setToken: auth.setToken,
      setDb: db.setDb,
      setStatus: db.setStatus,
      setIsSyncing: db.setIsSyncing,
      setSearchQuery: search.setSearchQuery,
      setIsDeepSearch: search.setIsDeepSearch,
      setActiveRepo: search.setActiveRepo,
      setActiveTag: search.setActiveTag,
      setCurrentView: search.setCurrentView,
      setIsTasksOpen,
      setIsToolsOpen,
      setNativeTaskInput,
      setActiveColorPickerCard,
      setIsEditorOpen,
      setIsSaving,
      setRepo,
      setTags,
      setTitle,
      setSlug,
      setIsSlugEdited,
      setUploadLinks,
      setContent,
      setEditorOriginal,
      loadDatabase: db.loadDatabase,
      syncMetaAndDB: db.syncMetaAndDB,
      handleSaveArticle,
      handleDeleteArticle,
      handleRestoreArticle,
      handleHardDelete,
      handleReadArticle,
      hardScrapeRepo,
      editFileContent,
      togglePin,
      handleSetColor,
      saveLocalDb: db.saveLocalDb,
      changeTheme,
      handleLogin: auth.handleLogin,
      syncSupabaseToGithubJSON: sync.syncSupabaseToGithubJSON,
      processScanQueue: sync.processScanQueue,
    },
  };
}
