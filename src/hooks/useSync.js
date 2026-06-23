import { USERNAME, REPO_DOMAIN } from "../constants/config";
import { fetchText, getFileShaSafe, encodeBase64UTF8Async } from "../services/github";
import { fetchSupabaseDB, updateSupabaseDB } from "../services/supabase";
import { getPreviewText, safeEnc } from "../utils/helpers";

export function useSync({ db, token, setStatus, setIsSaving, mergeDBs, saveLocalDb, syncMetaAndDB }) {
  
  const processScanQueue = async (queueData) => {
    setIsSaving(true);
    let { repo: tR, files, currentIndex, isForce } = queueData;
    const chunk = files.slice(currentIndex, currentIndex + 3);
    
    if (chunk.length === 0) {
      localStorage.removeItem("cms_scan_queue");
      setStatus({ text: "Hoàn tất quét toàn bộ!", type: "success" });
      setTimeout(() => setStatus({ text: "", type: "" }), 3000);
      setIsSaving(false);
      return;
    }
    
    setStatus({
      text: `Đang quét: ${currentIndex + 1} - ${Math.min(currentIndex + 3, files.length)} / ${files.length} bài...`,
      type: "loading",
    });
    
    let updates = [];
    for (let i = 0; i < chunk.length; i++) {
      const it = chunk[i];
      let nm = it.path.replace(".html", "").split("/").pop(),
        prev = "Lỗi trích xuất...";
      try {
        let ct = null;
        const encodedPath = it.path.split("/").map(encodeURIComponent).join("/");
        const urlPage = `https://${REPO_DOMAIN}/${tR === `${USERNAME}.github.io` ? "" : tR + "/"}${encodedPath}?t=${Date.now()}`;
        
        try {
          const rPage = await fetch(urlPage, { cache: "no-store" });
          if (rPage.ok) ct = await rPage.text();
        } catch (e) {}
        
        if (!ct) {
          const curToken = token || localStorage.getItem("github_pat");
          ct = await fetchText(
            `https://api.github.com/repos/${USERNAME}/${tR}/contents/${safeEnc(it.path)}?t=${Date.now()}`,
            curToken,
          );
        }
        if (ct) {
          prev = getPreviewText(ct);
          const m = ct.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (m && m[1]) nm = m[1].trim();
        }
      } catch (err) {}
      updates.push({ path: it.path, sha: it.sha, index: it.index, prev, nm });
    }
    
    try {
      const cloudDb = await fetchSupabaseDB();
      const localDbStr = localStorage.getItem("cms_repo_data");
      let currDb = localDbStr ? JSON.parse(localDbStr) : { files: [] };
      let mergedDb = mergeDBs(currDb, cloudDb);
      let cFiles = [...mergedDb.files];
      
      updates.forEach((u) => {
        const ts = Date.now() - 1000 * 60 * 60 * 24 * u.index;
        const idx = cFiles.findIndex(
          (x) => x.repoName === tR && x.fileName === u.path,
        );
        if (idx >= 0) {
          cFiles[idx] = {
            ...cFiles[idx],
            preview: u.prev,
            sha: u.sha,
            name: u.nm.replace(/-/g, " "),
            lastScanned: Date.now(),
          };
        } else {
          cFiles.unshift({
            repoName: tR,
            name: u.nm.replace(/-/g, " "),
            fileName: u.path,
            sha: u.sha,
            url: `https://${REPO_DOMAIN}/${tR === `${USERNAME}.github.io` ? "" : tR + "/"}${u.path}`,
            timestamp: ts,
            fullDate: new Date(ts).toLocaleString("vi-VN"),
            preview: u.prev,
            lastScanned: Date.now(),
          });
        }
      });
      cFiles.sort((a, b) => b.timestamp - a.timestamp);
      const rm = {};
      cFiles.forEach((f) => {
        if (!rm[f.repoName]) rm[f.repoName] = [];
        rm[f.repoName].push(f);
      });
      const nd = { ...mergedDb, files: cFiles, repos: rm };
      saveLocalDb(nd);
      await updateSupabaseDB(nd);
    } catch (e) {
      console.error("Lỗi sync scan:", e);
    }
    
    queueData.currentIndex += 3;
    localStorage.setItem("cms_scan_queue", JSON.stringify(queueData));
    setTimeout(() => processScanQueue(queueData), 1000);
  };

  const syncSupabaseToGithubJSON = async () => {
    if (!token) return alert("Cần Token GitHub!");
    setIsSaving(true);
    setStatus({ text: "Đang kiểm tra JSON...", type: "loading" });
    try {
      const rP = `${USERNAME}.github.io`,
        fN = "cms_db.json";
      let oldC = 0;
      try {
        const chk = await fetch(`https://${REPO_DOMAIN}/${fN}?_t=${Date.now()}`, {
          cache: "no-store",
        });
        if (chk.ok) {
          const od = await chk.json();
          oldC = od.allFiles ? od.allFiles.length : 0;
        }
      } catch (e) {}
      
      if (
        !window.confirm(
          `Sổ cái (JSON) trên GitHub đang có: ${oldC} bài.\nDB hiện tại của bạn: ${db.files.length} bài.\nBạn có muốn ghi đè để xuất bản mới không?`,
        )
      ) {
        setStatus({ text: "", type: "" });
        setIsSaving(false);
        return;
      }
      
      setStatus({ text: "Đang tiến hành xuất bản ngầm...", type: "loading" });
      const nd = {
        ...db,
        jsonSyncInfo: `${new Date().toLocaleString("vi-VN")} - ${db.files.length} bài`,
      };
      const merged = await syncMetaAndDB(nd);
      
      (async () => {
        try {
          const fC = JSON.stringify({ allFiles: merged.files, ...merged }),
            eC = await encodeBase64UTF8Async(fC);
          let cS = await getFileShaSafe(`${USERNAME}/${rP}`, fN, token);
          const r = await fetch(
            `https://api.github.com/repos/${USERNAME}/${rP}/contents/${fN}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: `Sync Supabase DB to JSON`,
                content: eC,
                sha: cS || undefined,
              }),
            },
          );
          if (!r.ok) throw new Error("Ghi thất bại");
          setStatus({ text: "Đã xuất JSON ngầm thành công!", type: "success" });
          setTimeout(() => setStatus({ text: "", type: "" }), 3000);
        } catch (e) {
          setStatus({ text: "Lỗi xuất JSON ngầm", type: "error" });
          setTimeout(() => setStatus({ text: "", type: "" }), 3000);
        }
      })();
    } catch (e) {
      setStatus({ text: "Lỗi khởi tạo", type: "error" });
      setIsSaving(false);
    }
  };

  return {
    processScanQueue,
    syncSupabaseToGithubJSON
  };
}
