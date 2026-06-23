import React from "react";
import { UI } from "../../constants/theme";

export default function TasksSidebar({ cms: { state, actions } }) {
  return (
    <aside className="w-full lg:w-[320px] shrink-0 sticky top-[130px] h-[calc(100vh-150px)] fade-in">
      <div className="bg-[var(--bg-card)] p-5 flex flex-col h-full border border-[var(--border)] rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xs font-black text-[var(--accent)] uppercase tracking-widest flex items-center gap-2">
            <svg className="w-4 h-4">
              <use href="#icon-edit"></use>
            </svg>{" "}
            Ghi chú
          </h2>
          <button
            onClick={() => actions.setIsTasksOpen(false)}
            className="text-[var(--text-muted)] font-bold hover:text-red-500 px-2"
          >
            ✕
          </button>
        </div>
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={state.nativeTaskInput}
            onChange={(e) => actions.setNativeTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && state.nativeTaskInput) {
                const n = [
                  {
                    id: Date.now(),
                    title: state.nativeTaskInput,
                    completed: false,
                  },
                  ...(state.db.tasks || []),
                ];
                actions.saveLocalDb({ ...state.db, tasks: n });
                actions.syncMetaAndDB({ ...state.db, tasks: n });
                actions.setNativeTaskInput("");
              }
            }}
            className={UI.input}
            placeholder="Gõ rồi Enter..."
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
          {(state.db.tasks || []).map((t) => (
            <div
              key={t.id}
              className="p-3 flex gap-3 rounded-xl text-xs font-medium leading-relaxed bg-[var(--bg-hover)] border cms-border text-[var(--text-main)] group hover:border-[var(--accent)] transition"
            >
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => {
                  const n = (state.db.tasks || []).map((x) =>
                    x.id === t.id ? { ...x, completed: !x.completed } : x,
                  );
                  actions.saveLocalDb({ ...state.db, tasks: n });
                  actions.syncMetaAndDB({ ...state.db, tasks: n });
                }}
                className="mt-1 accent-[var(--accent)] w-4 h-4 cursor-pointer"
              />
              <span
                className={`flex-1 ${t.completed ? "opacity-50 line-through" : ""}`}
              >
                {t.title}
              </span>
              <button
                onClick={() => {
                  const n = (state.db.tasks || []).filter((x) => x.id !== t.id);
                  actions.saveLocalDb({ ...state.db, tasks: n });
                  actions.syncMetaAndDB({ ...state.db, tasks: n });
                }}
                className="text-red-500 font-bold opacity-0 group-hover:opacity-100 px-2 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
