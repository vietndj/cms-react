import { useState, useMemo } from "react";
import { USERNAME } from "../constants/config";
import { removeAccents, getTimelineLabel } from "../utils/helpers";

export function useSearch(db) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [activeRepo, setActiveRepo] = useState("all");
  const [activeTag, setActiveTag] = useState("all");
  const [currentView, setCurrentView] = useState("grid");

  const getFileTags = (r, f) => (db.tags || {})[`${r}/${f}`] || [];
  const getFileLinks = (r, f) => (db.links || {})[`${r}/${f}`] || [];

  const repoKeysList = useMemo(() => {
    const k = Object.keys(db.repos || {});
    if (!k.includes(`${USERNAME}.github.io`)) k.unshift(`${USERNAME}.github.io`);
    return k;
  }, [db.repos]);

  const allUniqueTags = useMemo(() => {
    const s = new Set();
    Object.values(db.tags || {}).forEach((a) => a.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [db.tags]);

  const processedFiles = useMemo(() => {
    let q = removeAccents(searchQuery);
    return (db.files || [])
      .filter((f) => {
        const k = `${f.repoName}/${f.fileName}`;
        if ((db.deleted || []).includes(k)) return false;
        let mt =
            activeTag === "all" ||
            getFileTags(f.repoName, f.fileName).includes(activeTag),
          mr = activeRepo === "all" || f.repoName === activeRepo,
          mq =
            !q ||
            removeAccents(f.name).includes(q) ||
            (isDeepSearch && removeAccents(f.preview).includes(q));
        return mt && mr && mq;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [db.files, activeRepo, activeTag, searchQuery, isDeepSearch, (db.tags || {}), db.deleted]);

  const groupedFilesByRepo = useMemo(() => {
    const g = {};
    processedFiles
      .filter((f) => !(db.pinned || []).includes(`${f.repoName}/${f.fileName}`))
      .forEach((f) => {
        if (!g[f.repoName]) g[f.repoName] = [];
        g[f.repoName].push(f);
      });
    const sg = {};
    Object.keys(g)
      .sort(
        (a, b) =>
          Math.max(...g[b].map((x) => x.timestamp)) -
          Math.max(...g[a].map((x) => x.timestamp)),
      )
      .forEach((r) => {
        if (currentView === "grid" && g[r].length > 10) {
          const s = {};
          g[r].forEach((f) => {
            const l = getTimelineLabel(f.timestamp);
            if (!s[l]) s[l] = [];
            s[l].push(f);
          });
          sg[r] = { isSub: true, data: s };
        } else sg[r] = { isSub: false, data: g[r] };
      });
    return sg;
  }, [processedFiles, currentView, db.pinned]);

  return {
    searchQuery, setSearchQuery,
    isDeepSearch, setIsDeepSearch,
    activeRepo, setActiveRepo,
    activeTag, setActiveTag,
    currentView, setCurrentView,
    repoKeysList,
    allUniqueTags,
    processedFiles,
    groupedFilesByRepo,
    getFileTags,
    getFileLinks
  };
}
