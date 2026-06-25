import React, { useState } from "react";
import { getContrastYIQ, getStringColor, getTimelineLabel } from "./utils/helpers";
import { UI } from "./constants/theme";
import { useCMS } from "./hooks/useCMS";
import LoginScreen from "./components/auth/LoginScreen";
import Header from "./components/layout/Header";
import FilterNav from "./components/layout/FilterNav";
import TasksSidebar from "./components/layout/TasksSidebar";
import EditorCard from "./components/editor/EditorCard";



export default function App() {
  const cms = useCMS();
  const { state, actions } = cms;
  if (!state.isAuthenticated)
    return <LoginScreen pin={state.pin} setPin={actions.setPin} handleLogin={actions.handleLogin} />;
  return (
    <div
      className="flex-col w-full min-h-screen fade-in flex bg-[var(--bg-body)] pb-20"
      onClick={() => actions.setActiveColorPickerCard(null)}
    >
      <Header cms={cms} />
      <FilterNav cms={cms} />
      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto items-start w-full relative mt-6">
        <main className="flex-1 w-full min-w-0 flex flex-col gap-8">
          <EditorCard cms={cms} />
          {state.currentView === "trash" ? (
            <TrashBin cms={cms} />
          ) : (
            <>
              <RecentFiles cms={cms} />
              <StatisticsBoard cms={cms} />
              <MasterViews cms={cms} />
            </>
          )}
        </main>
        {state.isTasksOpen && <TasksSidebar cms={cms} />}
      </div>
      {state.status.text && (
        <div className="fixed top-[80px] left-1/2 transform -translate-x-1/2 z-[9999999] pointer-events-none fade-in">
          <div
            className={`bg-[var(--bg-card)] px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 border-2 font-bold text-sm text-[var(--text-main)] ${state.status.type === "error" ? "border-red-500" : state.status.type === "loading" ? "border-[var(--accent)]" : "border-green-500"}`}
          >
            {state.status.type === "loading" && (
              <div className="animate-spin h-5 w-5 border-2 border-[var(--accent)] border-t-transparent rounded-full"></div>
            )}
            <span className="whitespace-nowrap">{state.status.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}


const StatisticsBoard = ({ cms: { state, data, actions } }) => {
  const [t, setT] = useState(1);
  const [op, setOp] = useState(false);
  const fs = data.processedFiles;
  const l = useMemo(() => {
    if (t === 1)
      return [...fs]
        .sort(
          (a, b) =>
            ((state.db.views || {})[`${b.repoName}/${b.fileName}`] || 0) -
            ((state.db.views || {})[`${a.repoName}/${a.fileName}`] || 0),
        )
        .slice(0, 10);
    if (t === 2)
      return fs
        .filter((f) => {
          const v = (state.db.views || {})[`${f.repoName}/${f.fileName}`] || 0;
          return v <= 1;
        })
        .slice(0, 10);
    return [...fs].sort(() => 0.5 - Math.random()).slice(0, 10);
  }, [fs, t, state.db.views]);
  if (fs.length === 0) return null;
  return (
    <div className="mb-6 bg-[var(--bg-card)] border cms-border rounded-2xl shadow-sm p-4">
      <h3
        onClick={() => setOp(!op)}
        className="font-bold text-[14px] flex items-center gap-2 cursor-pointer hover:opacity-80 text-[var(--text-main)] mb-2"
      >
        📊 Thống kê{" "}
        <span className="ml-auto text-[10px] text-[var(--text-muted)]">
          {op ? "THU GỌN ▲" : "MỞ RA ▼"}
        </span>
      </h3>
      {op && (
        <div className="animate-fade-in">
          <div className="flex flex-wrap items-center gap-2 mb-4 border-b cms-border pb-2 pt-2">
            {[1, 2, 3].map((x) => (
              <button
                key={x}
                onClick={() => setT(x)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${t === x ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-hover)] text-[var(--text-main)] hover:bg-[var(--border)]"}`}
              >
                {x === 1
                  ? "🔥 Đọc Nhiều"
                  : x === 2
                    ? "🧊 Cần Chăm Sóc"
                    : "🎲 Đọc Ngẫu Nhiên"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {l.map((f) => {
              const k = `${f.repoName}/${f.fileName}`;
              return (
                <div
                  key={f.sha}
                  onClick={() => actions.handleReadArticle(f)}
                  className={`${UI.card} p-3 flex flex-col gap-2 hover:bg-[var(--bg-hover)]`}
                >
                  <h4 className="font-bold text-xs leading-snug line-clamp-2">
                    {f.name}
                  </h4>
                  <div className="text-[10px] text-[var(--text-muted)] italic line-clamp-2">
                    {f.preview}
                  </div>
                  <div className="flex justify-between items-center opacity-60 mt-auto pt-1 border-t cms-border">
                    <span className="text-[9px] font-bold uppercase">
                      {f.repoName}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#FF9500]">
                      <svg className="w-3 h-3">
                        <use href="#icon-eye"></use>
                      </svg>{" "}
                      {(state.db.views || {})[k] || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const TrashBin = ({ cms: { state, actions } }) => {
  const tFs = (state.db.files || []).filter((f) =>
    (state.db.deleted || []).includes(`${f.repoName}/${f.fileName}`),
  );
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
        <h3 className="font-bold text-[18px] flex items-center gap-2 text-red-500">
          <svg className="w-5 h-5">
            <use href="#icon-trash"></use>
          </svg>{" "}
          Thùng Rác ({tFs.length})
        </h3>
        <button
          onClick={() => actions.setCurrentView("grid")}
          className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]"
        >
          Quay lại
        </button>
      </div>
      {tFs.length === 0 ? (
        <div className="text-center py-20 font-bold opacity-50">
          Thùng rác trống
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 w-full">
          {tFs.map((f) => {
            const k = `${f.repoName}/${f.fileName}`;
            return (
              <div
                key={f.sha}
                className={`${UI.card} p-4 bg-[var(--bg-hover)] opacity-80 hover:opacity-100`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-red-500">
                    <svg className="w-4 h-4">
                      <use href="#icon-trash"></use>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold leading-snug text-[14px] line-clamp-2">
                      {f.name}
                    </h4>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2 italic">
                      {f.preview}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono opacity-50 mb-3 block">
                  {f.fullDate}
                </span>
                <div className="flex justify-between items-center pt-3 border-t cms-border">
                  <button
                    onClick={() => actions.handleRestoreArticle(k)}
                    className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 font-bold text-xs hover:bg-green-500 hover:text-white transition"
                  >
                    Khôi phục
                  </button>
                  <button
                    onClick={() => actions.handleHardDelete(f)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 font-bold text-xs hover:bg-red-500 hover:text-white transition"
                  >
                    Xóa vĩnh viễn
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const RecentFiles = ({ cms: { state, actions } }) => {
  const r =
    state.activeTag === "all" &&
    state.activeRepo === "all" &&
    !state.searchQuery
      ? [...(state.db.files || [])]
          .filter(
            (f) =>
              !(state.db.deleted || []).includes(`${f.repoName}/${f.fileName}`),
          )
          .sort(
            (a, b) =>
              Math.max(b.timestamp, b.lastAccessed || 0) -
              Math.max(a.timestamp, a.lastAccessed || 0),
          )
          .slice(0, 8)
      : [];
  if (r.length === 0) return null;
  return (
    <div className="mb-2">
      <div className="flex items-center mb-2 gap-2 ml-1">
        <div className="w-2 h-2 bg-[var(--text-main)] rounded-full"></div>
        <h3 className="font-bold text-[14px] text-[var(--accent)]">
          Vừa thao tác gần đây
        </h3>
      </div>
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x">
        {r.map((f) => {
          const k = `${f.repoName}/${f.fileName}`;
          return (
            <div
              key={f.sha}
              onClick={() => actions.handleReadArticle(f)}
              className={`${UI.card} p-2.5 min-w-[240px] max-w-[240px] snap-start flex flex-col justify-between hover:z-50 z-10 hover:z-[60]`}
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <div className="relative group/title flex-1 min-w-0">
                  <h4 className="font-bold text-[13px] leading-tight line-clamp-2 text-[var(--text-main)]">
                    {f.name}
                  </h4>
                  <div className="text-[10px] text-[var(--text-muted)] line-clamp-2 italic mt-1 opacity-90">
                    {f.preview}
                  </div>
                  <div className="absolute top-[-8px] left-[-8px] w-[calc(100%+40px)] p-2.5 bg-[var(--bg-card)] border cms-border rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover/title:opacity-100 transition-all z-[110] font-bold text-[13px] leading-tight text-[var(--text-main)]">
                    {f.name}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.editFileContent(f.repoName, f.fileName, f.sha);
                  }}
                  className="text-[#3B82F6] bg-[#3B82F6]/10 font-bold text-[9px] px-2 py-1 rounded shrink-0 transition hover:bg-[#3B82F6] hover:text-white relative z-50"
                >
                  Sửa
                </button>
              </div>
              <div className="flex items-center gap-1.5 opacity-60 mt-auto pt-1.5 border-t cms-border">
                <svg className="w-2.5 h-2.5">
                  <use href="#icon-folder"></use>
                </svg>
                <span className="text-[9px] font-bold uppercase">
                  {f.repoName}
                </span>
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-[var(--accent)] ml-auto">
                  <svg className="w-2.5 h-2.5">
                    <use href="#icon-eye"></use>
                  </svg>{" "}
                  {(state.db.views || {})[k] || 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const MasterViews = ({ cms }) => {
  const { state, data, actions } = cms,
    pFs = data.processedFiles.filter((f) =>
      (state.db.pinned || []).includes(`${f.repoName}/${f.fileName}`),
    );
  const [col, setCol] = useState({ pinned: true, rnd: false });
  const tCol = (k) => setCol((p) => ({ ...p, [k]: !p[k] }));

  const Acts = ({ f, k, iP, tM }) => (
    <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition relative z-50">
      <button
        onClick={(e) => {
          e.stopPropagation();
          actions.togglePin(f.repoName, f.fileName);
        }}
        className={UI.iconBtn}
        style={{ color: iP ? "#FF9500" : tM }}
      >
        <svg className="w-3.5 h-3.5">
          <use href={iP ? "#icon-pin-filled" : "#icon-pin"}></use>
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          actions.setActiveColorPickerCard(
            state.activeColorPickerCard === k ? null : k,
          );
        }}
        className={UI.iconBtn}
        style={{
          color: state.activeColorPickerCard === k ? "var(--accent)" : tM,
        }}
      >
        <svg className="w-3.5 h-3.5">
          <use href="#icon-palette"></use>
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          actions.editFileContent(f.repoName, f.fileName, f.sha);
        }}
        className={UI.iconBtn}
        style={{ color: tM }}
      >
        <svg className="w-3.5 h-3.5">
          <use href="#icon-edit"></use>
        </svg>
      </button>
    </div>
  );
  const TLs = ({ tg, lk, bg, tc }) =>
    tg.length > 0 || lk.length > 0 ? (
      <div
        className="absolute top-[calc(100%-8px)] left-0 right-0 flex flex-wrap gap-1.5 p-3 rounded-xl shadow-2xl border cms-border backdrop-blur-xl bg-[var(--bg-body)]/95 opacity-0 translate-y-[-10px] pointer-events-none group-hover:translate-y-0 group-hover:pointer-events-auto group-hover:opacity-100 transition-all duration-300 z-[99]"
        onClick={(e) => e.stopPropagation()}
      >
        {tg.map((t) => (
          <span
            key={t}
            className={UI.tagBase}
            style={{ backgroundColor: bg, color: tc }}
          >
            {t}
          </span>
        ))}
        {lk.map((l, i) => (
          <a
            key={i}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`${UI.tagBase} flex items-center gap-1 hover:opacity-80`}
            style={{ backgroundColor: bg, color: "var(--accent)" }}
          >
            <svg className="w-2.5 h-2.5">
              <use href="#icon-link"></use>
            </svg>{" "}
            {l.title}
          </a>
        ))}
      </div>
    ) : null;

  const Grid = ({ fs }) => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 w-full">
      {fs.map((f) => {
        const k = `${f.repoName}/${f.fileName}`,
          iP = (state.db.pinned || []).includes(k),
          c = (state.db.colors || {})[k] || "var(--bg-card)",
          iD = c !== "var(--bg-card)" && getContrastYIQ(c) === "#FFFFFF",
          tc = iD ? "#FFF" : "var(--text-main)",
          tl = data.getFileTags(f.repoName, f.fileName),
          tgc = tl.length > 0 ? getStringColor(tl[0]) : "var(--border)";
        return (
          <div
            key={f.sha}
            className={`${UI.card} !overflow-visible hover:z-50 p-4`}
            onClick={() => actions.handleReadArticle(f)}
            style={{
              backgroundColor: c,
              color: tc,
              borderTop: c === "var(--bg-card)" ? `3px solid ${tgc}` : "",
            }}
          >
            <div className="flex items-start gap-3 mb-1">
              {c === "var(--bg-card)" && (
                <div
                  className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: tgc }}
                >
                  {f.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="relative flex-1 w-full min-w-0">
                <h4
                  className="font-bold leading-snug text-[15px] line-clamp-2 peer cursor-default"
                  title={f.name}
                >
                  {f.name}
                </h4>
                <div
                  className="absolute top-[-8px] left-[-8px] w-[calc(100%+16px)] p-2.5 border cms-border rounded-xl shadow-2xl opacity-0 pointer-events-none peer-hover:opacity-100 hover:opacity-100 transition-all z-[9999] font-bold leading-snug text-[14px]"
                  style={{
                    backgroundColor:
                      c === "var(--bg-card)" ? "var(--bg-body)" : c,
                    color: tc,
                  }}
                >
                  {f.name}
                </div>
              </div>
            </div>
            <div
              className="text-[12px] mt-2 mb-2 leading-relaxed italic opacity-80 whitespace-pre-line"
              style={{ color: tc }}
            >
              {f.preview}
            </div>
            <TLs
              tg={tl}
              lk={data.getFileLinks(f.repoName, f.fileName)}
              bg={iD ? "rgba(255,255,255,0.1)" : "var(--bg-hover)"}
              tc={tc}
            />
            <div className="mt-auto pt-3 border-t cms-border flex justify-between items-center opacity-90 transition">
              <span className="flex items-center gap-2">
                <span className="text-[10px] font-mono">
                  {f.fullDate?.split(" ")[0]}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-[var(--accent)]">
                  <svg className="w-3 h-3">
                    <use href="#icon-eye"></use>
                  </svg>{" "}
                  {(state.db.views || {})[k] || 0}
                </span>
              </span>
              <Acts
                f={f}
                k={k}
                iP={iP}
                tM={iD ? "rgba(255,255,255,0.9)" : "var(--text-muted)"}
              />
            </div>
            {state.activeColorPickerCard === k && (
              <div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[var(--bg-body)] border cms-border p-1.5 rounded-xl shadow-xl flex gap-1 z-[100] fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                {[
                  null,
                  "#F2F2F7",
                  "#FFD8BF",
                  "#FFE58F",
                  "#D9F7BE",
                  "#BAE7FF",
                  "#D6E4FF",
                  "#EFDBFF",
                  "#FFD6E7",
                  "#1D1D1F",
                ].map((x, i) => (
                  <button
                    key={i}
                    onClick={() => actions.handleSetColor(k, x)}
                    className="w-6 h-6 rounded-full border hover:scale-125 transition"
                    style={{
                      backgroundColor: x || "var(--bg-card)",
                      borderColor: x ? "transparent" : "var(--border)",
                    }}
                  ></button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const Kan = () => {
    const randomFs = useMemo(
      () =>
        [...data.processedFiles].sort(() => 0.5 - Math.random()).slice(0, 15),
      [data.processedFiles],
    );
    return (
      <div className="flex overflow-x-auto gap-4 pb-4 w-full items-start kanban-scroll min-h-[70vh]">
        {pFs.length > 0 && (
          <div className="w-[300px] shrink-0 bg-[#F9FAFB] dark:bg-[#121212] border cms-border rounded-xl flex flex-col max-h-[80vh]">
            <div
              onClick={() => tCol("pinned")}
              className="p-3 flex justify-between items-center cursor-pointer hover:bg-[var(--bg-hover)] transition rounded-t-xl border-b cms-border mb-2 bg-[var(--bg-card)]"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                <svg className="w-4 h-4 shrink-0 text-[#FF9500]">
                  <use href="#icon-pin-filled"></use>
                </svg>
                <h3
                  className="truncate uppercase tracking-widest text-xs font-bold text-[#FF9500]"
                  title="Đã ghim"
                >
                  Đã ghim
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="bg-[var(--bg-body)] text-[var(--text-main)] text-[10px] px-2 py-1 rounded-full border cms-border shadow-sm font-mono">
                  {pFs.length}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {col.pinned ? "▼" : "▲"}
                </span>
              </div>
            </div>
            {!col.pinned && (
              <div className="overflow-y-auto px-2 pb-2 space-y-2 kanban-scroll flex-1">
                {pFs.map((f) => {
                  const k = `${f.repoName}/${f.fileName}`,
                    c = (state.db.colors || {})[k] || "var(--bg-card)",
                    iD =
                      c !== "var(--bg-card)" && getContrastYIQ(c) === "#FFFFFF",
                    tc = iD ? "#FFF" : "var(--text-main)";
                  return (
                    <div
                      key={f.sha}
                      className={`${UI.card} !overflow-visible hover:z-50 p-3`}
                      onClick={() => actions.handleReadArticle(f)}
                      style={{ backgroundColor: c, color: tc }}
                    >
                      <div className="relative mb-1 min-w-0">
                        <h4
                          className="font-bold text-[13px] leading-snug line-clamp-2 peer cursor-default"
                          title={f.name}
                        >
                          {f.name}
                        </h4>
                        <div
                          className="absolute top-[-8px] left-[-8px] w-[calc(100%+16px)] p-2.5 border cms-border rounded-xl shadow-2xl opacity-0 pointer-events-none peer-hover:opacity-100 hover:opacity-100 transition-all z-[9999] font-bold text-[13px] leading-snug"
                          style={{
                            backgroundColor:
                              c === "var(--bg-card)" ? "var(--bg-body)" : c,
                            color: tc,
                          }}
                        >
                          {f.name}
                        </div>
                      </div>
                      <div
                        className="text-[10px] mt-1 mb-2 leading-relaxed italic opacity-80 whitespace-pre-line"
                        style={{ color: tc }}
                      >
                        {f.preview}
                      </div>
                      <TLs
                        tg={data.getFileTags(f.repoName, f.fileName)}
                        lk={data.getFileLinks(f.repoName, f.fileName)}
                        bg={iD ? "rgba(255,255,255,0.1)" : "var(--bg-hover)"}
                        tc={tc}
                      />
                      <div className="flex justify-between items-center mt-2.5 pt-2 border-t cms-border opacity-90 transition">
                        <span className="flex items-center gap-2">
                          <span className="text-[9px] font-mono">
                            {f.fullDate?.split(" ")[0]}
                          </span>
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-[var(--accent)]">
                            <svg className="w-2.5 h-2.5">
                              <use href="#icon-eye"></use>
                            </svg>{" "}
                            {(state.db.views || {})[k] || 0}
                          </span>
                        </span>
                        <Acts
                          f={f}
                          k={k}
                          iP={true}
                          tM={
                            iD ? "rgba(255,255,255,0.8)" : "var(--text-muted)"
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {Object.keys(data.groupedFilesByRepo).map((r) => {
          const g = data.groupedFilesByRepo[r],
            fs = g.isSub ? Object.values(g.data).flat() : g.data;
          return (
            <div
              key={r}
              className="w-[300px] shrink-0 bg-[#F9FAFB] dark:bg-[#121212] border cms-border rounded-xl flex flex-col max-h-[80vh]"
            >
              <div
                onClick={() => tCol(r)}
                className="p-3 flex justify-between items-center cursor-pointer hover:bg-[var(--bg-hover)] transition rounded-t-xl border-b cms-border mb-2 bg-[var(--bg-card)]"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                  <svg className="w-4 h-4 opacity-50 shrink-0">
                    <use href="#icon-folder"></use>
                  </svg>
                  <h3
                    className="truncate uppercase tracking-widest text-xs font-bold text-[var(--text-main)]"
                    title={r}
                  >
                    {r}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-[var(--bg-body)] text-[var(--text-main)] text-[10px] px-2 py-1 rounded-full border cms-border shadow-sm font-mono">
                    {fs.length}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {col[r] ? "▼" : "▲"}
                  </span>
                </div>
              </div>
              {!col[r] && (
                <div className="overflow-y-auto px-2 pb-2 space-y-2 kanban-scroll flex-1">
                  {fs.map((f) => {
                    const k = `${f.repoName}/${f.fileName}`,
                      c = (state.db.colors || {})[k] || "var(--bg-card)",
                      iD =
                        c !== "var(--bg-card)" &&
                        getContrastYIQ(c) === "#FFFFFF",
                      tc = iD ? "#FFF" : "var(--text-main)";
                    return (
                      <div
                        key={f.sha}
                        className={`${UI.card} !overflow-visible hover:z-50 p-3`}
                        onClick={() => actions.handleReadArticle(f)}
                        style={{ backgroundColor: c, color: tc }}
                      >
                        <div className="relative mb-1 min-w-0">
                          <h4
                            className="font-bold text-[13px] leading-snug line-clamp-2 peer cursor-default"
                            title={f.name}
                          >
                            {f.name}
                          </h4>
                          <div
                            className="absolute top-[-8px] left-[-8px] w-[calc(100%+16px)] p-2.5 border cms-border rounded-xl shadow-2xl opacity-0 pointer-events-none peer-hover:opacity-100 hover:opacity-100 transition-all z-[9999] font-bold text-[13px] leading-snug"
                            style={{
                              backgroundColor:
                                c === "var(--bg-card)" ? "var(--bg-body)" : c,
                              color: tc,
                            }}
                          >
                            {f.name}
                          </div>
                        </div>
                        <div
                          className="text-[10px] mt-1 mb-2 leading-relaxed italic opacity-80 whitespace-pre-line"
                          style={{ color: tc }}
                        >
                          {f.preview}
                        </div>
                        <TLs
                          tg={data.getFileTags(f.repoName, f.fileName)}
                          lk={data.getFileLinks(f.repoName, f.fileName)}
                          bg={iD ? "rgba(255,255,255,0.1)" : "var(--bg-hover)"}
                          tc={tc}
                        />
                        <div className="flex justify-between items-center mt-2.5 pt-2 border-t cms-border opacity-90 transition">
                          <span className="flex items-center gap-2">
                            <span className="text-[9px] font-mono">
                              {f.fullDate?.split(" ")[0]}
                            </span>
                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-[var(--accent)]">
                              <svg className="w-2.5 h-2.5">
                                <use href="#icon-eye"></use>
                              </svg>{" "}
                              {(state.db.views || {})[k] || 0}
                            </span>
                          </span>
                          <Acts
                            f={f}
                            k={k}
                            iP={false}
                            tM={
                              iD ? "rgba(255,255,255,0.8)" : "var(--text-muted)"
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div className="w-[300px] shrink-0 bg-[#F9FAFB] dark:bg-[#121212] border cms-border rounded-xl flex flex-col max-h-[80vh] border-dashed border-[#8E44AD]">
          <div
            onClick={() => tCol("rnd")}
            className="p-3 flex justify-between items-center cursor-pointer hover:bg-[var(--bg-hover)] transition rounded-t-xl border-b cms-border mb-2 bg-[var(--bg-card)]"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
              <span className="text-sm">🎲</span>
              <h3
                className="truncate uppercase tracking-widest text-xs font-bold text-[#8E44AD]"
                title="Khám phá ngẫu nhiên"
              >
                Khám phá ngẫu nhiên
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-[var(--bg-body)] text-[var(--text-main)] text-[10px] px-2 py-1 rounded-full border cms-border shadow-sm font-mono">
                {randomFs.length}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {col.rnd ? "▼" : "▲"}
              </span>
            </div>
          </div>
          {!col.rnd && (
            <div className="overflow-y-auto px-2 pb-2 space-y-2 kanban-scroll flex-1">
              {randomFs.map((f) => {
                const k = `${f.repoName}/${f.fileName}`;
                return (
                  <div
                    key={`rnd-${f.sha}`}
                    className={`${UI.card} !overflow-visible hover:z-50 p-3`}
                    onClick={() => actions.handleReadArticle(f)}
                  >
                    <div className="relative mb-1 min-w-0">
                      <h4
                        className="font-bold text-[13px] leading-snug line-clamp-2 peer cursor-default"
                        title={f.name}
                      >
                        {f.name}
                      </h4>
                      <div className="absolute top-[-8px] left-[-8px] w-[calc(100%+16px)] p-2.5 border cms-border rounded-xl shadow-2xl opacity-0 pointer-events-none peer-hover:opacity-100 hover:opacity-100 transition-all z-[9999] font-bold text-[13px] leading-snug bg-[var(--bg-body)] text-[var(--text-main)]">
                        {f.name}
                      </div>
                    </div>
                    <div className="text-[10px] mt-1 mb-2 leading-relaxed italic opacity-80 whitespace-pre-line text-[var(--text-muted)]">
                      {f.preview}
                    </div>
                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t cms-border opacity-90 transition">
                      <span className="flex items-center gap-2">
                        <span className="text-[9px] font-mono">
                          {f.fullDate?.split(" ")[0]}
                        </span>
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-[var(--accent)]">
                          <svg className="w-2.5 h-2.5">
                            <use href="#icon-eye"></use>
                          </svg>{" "}
                          {(state.db.views || {})[k] || 0}
                        </span>
                      </span>
                      <Acts
                        f={f}
                        k={k}
                        iP={(state.db.pinned || []).includes(k)}
                        tM="var(--text-muted)"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const RenderView = ({ fs }) => {
    return <Grid fs={fs} />;
  };

  if (data.processedFiles.length === 0)
    return <div className="text-center py-20 font-bold opacity-50">Trống</div>;
  if (state.currentView === "kanban") return <Kan />;
  return (
    <div className="flex flex-col gap-8 w-full">
      {pFs.length > 0 && (
        <div>
          <h3
            onClick={() => tCol("pinned")}
            className="font-bold text-[16px] mb-3 border-b border-[var(--border)] pb-2 flex items-center gap-2 text-[#FF9500] cursor-pointer hover:opacity-80"
          >
            <svg className="w-4 h-4">
              <use href="#icon-pin-filled"></use>
            </svg>{" "}
            Đã ghim{" "}
            <span className="bg-[var(--bg-hover)] text-[var(--text-main)] text-[11px] px-2 py-0.5 rounded-full border cms-border shadow-sm ml-1 font-mono">
              {pFs.length}
            </span>
            <span className="ml-auto text-[10px] text-[var(--text-muted)]">
              {col.pinned ? "MỞ RA ▼" : "THU GỌN ▲"}
            </span>
          </h3>
          {!col.pinned && <Grid fs={pFs} />}
        </div>
      )}
      {Object.keys(data.groupedFilesByRepo).map((r) => {
        const fL = data.groupedFilesByRepo[r].isSub
          ? Object.values(data.groupedFilesByRepo[r].data).flat().length
          : data.groupedFilesByRepo[r].data.length;
        return (
          <div key={r}>
            <h3
              onClick={() => tCol(r)}
              className="font-bold text-[18px] mb-3 border-b border-[var(--border)] pb-2 flex items-center gap-2 cursor-pointer hover:opacity-80"
            >
              <svg className="w-5 h-5 opacity-70">
                <use href="#icon-folder"></use>
              </svg>{" "}
              <span className="truncate">{r}</span>{" "}
              <span className="bg-[var(--bg-hover)] text-[var(--text-main)] text-[11px] px-2 py-0.5 rounded-full border cms-border shadow-sm ml-1 font-mono">
                {fL}
              </span>
              <span className="ml-auto text-[10px] text-[var(--text-muted)] shrink-0">
                {col[r] ? "MỞ RA ▼" : "THU GỌN ▲"}
              </span>
            </h3>
            {!col[r] &&
              (data.groupedFilesByRepo[r].isSub ? (
                <div className="flex flex-col gap-6">
                  {Object.keys(data.groupedFilesByRepo[r].data).map((tl) => (
                    <div
                      key={tl}
                      className="ml-3 border-l-2 border-[var(--border)] pl-4"
                    >
                      <h4 className="font-bold text-xs text-[var(--text-muted)] mb-3">
                        {tl}
                      </h4>
                      <Grid fs={data.groupedFilesByRepo[r].data[tl]} />
                    </div>
                  ))}
                </div>
              ) : (
                <Grid fs={data.groupedFilesByRepo[r].data} />
              ))}
          </div>
        );
      })}
    </div>
  );
};
