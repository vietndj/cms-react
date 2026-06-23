import React from "react";

export default function FilterNav({ cms: { state, data, actions } }) {
  return (
    <nav className="bg-[var(--bg-body)] border-b border-[var(--border)] py-2 px-4 md:px-8 sticky top-0 z-[150] flex flex-col gap-2 shadow-sm">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0 mr-2">
          VIEW
        </span>
        <div className="flex bg-[var(--bg-hover)] p-1 rounded-lg border cms-border gap-1">
          {[
            { id: "grid", i: "#icon-grid", t: "Grid" },
            { id: "kanban", i: "#icon-kanban", t: "Kanban" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => actions.setCurrentView(v.id)}
              className={`px-3 py-1 rounded-md transition text-[11px] font-bold flex items-center gap-1.5 ${state.currentView === v.id || (state.currentView === "trash" && v.id === "grid") ? "bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm border border-[var(--border)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent"}`}
            >
              <svg className="w-3.5 h-3.5">
                <use href={v.i}></use>
              </svg>
              <span className="hidden md:block">{v.t}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0">
          KHO
        </span>
        {data.repoKeysList.map((r) => (
          <button
            key={r}
            onClick={() =>
              actions.setActiveRepo(state.activeRepo === r ? "all" : r)
            }
            className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${state.activeRepo === r ? "bg-[var(--accent)] text-white shadow-sm" : "bg-[var(--bg-hover)] text-[var(--text-main)] border cms-border"}`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0">
          TAG
        </span>
        {data.allUniqueTags.map((t) => (
          <button
            key={t}
            onClick={() =>
              actions.setActiveTag(state.activeTag === t ? "all" : t)
            }
            className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${state.activeTag === t ? "bg-[var(--accent)] text-white shadow-sm" : "bg-[var(--bg-hover)] text-[var(--text-main)] border cms-border"}`}
          >
            {t}
          </button>
        ))}
      </div>
    </nav>
  );
}
