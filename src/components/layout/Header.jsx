import React from "react";
import { UI } from "../../constants/theme";

export default function Header({ cms: { state, actions } }) {
  return (
    <header className="bg-[var(--bg-card)] border-b border-[var(--border)] pt-4 pb-3 px-4 md:px-8 flex flex-col md:flex-row items-center gap-4 relative z-[200]">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--accent)]">
        vietndj
      </h1>
      <div className="flex-1 flex w-full items-center gap-2">
        <div className="flex-1 flex items-center bg-[var(--bg-hover)] rounded-xl px-4 py-2 border cms-border">
          <svg className="w-4 h-4 text-[var(--text-muted)]">
            <use href="#icon-search"></use>
          </svg>
          <input
            id="search-input-main"
            type="text"
            value={state.searchQuery}
            onChange={(e) => actions.setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm... (Ctrl K)"
            className="bg-transparent border-none outline-none text-sm w-full ml-3 font-bold text-[var(--text-main)] placeholder-[var(--text-muted)]"
          />
        </div>
        <button
          onClick={() => actions.setIsDeepSearch(!state.isDeepSearch)}
          className={`shrink-0 ${UI.btnTool} ${state.isDeepSearch ? "bg-[var(--accent)] text-white border-transparent" : "cms-border"}`}
        >
          <svg className="w-4 h-4">
            <use href="#icon-search"></use>
          </svg>{" "}
          Sâu
        </button>
      </div>
      <div className="flex items-center gap-2 relative" ref={state.toolsMenuRef}>
        <button
          onClick={() => actions.setIsTasksOpen(!state.isTasksOpen)}
          className={UI.btnTool}
        >
          Việc
        </button>
        <button
          onClick={() => actions.setIsToolsOpen(!state.isToolsOpen)}
          className={UI.btnTool}
        >
          Công cụ ▾
        </button>
        {state.isToolsOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 p-2 z-[100] cms-card rounded-xl shadow-2xl border cms-border fade-in">
            <div className="flex gap-1 px-1 mb-3">
              <button
                onClick={() => actions.changeTheme("light")}
                className="flex-1 py-1.5 rounded text-[11px] font-bold border cms-border hover:bg-[var(--bg-hover)]"
              >
                Sáng
              </button>
              <button
                onClick={() => actions.changeTheme("dark")}
                className="flex-1 py-1.5 rounded text-[11px] font-bold border cms-border hover:bg-[var(--bg-hover)]"
              >
                Tối
              </button>
            </div>
            <button
              onClick={() => {
                actions.setCurrentView("trash");
                actions.setIsToolsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-yellow-500 hover:bg-[var(--bg-hover)] rounded"
            >
              🗑️ Mở Thùng Rác
            </button>
            <hr className="my-2 border-[var(--border)]" />
            <button
              onClick={() => {
                actions.hardScrapeRepo();
                actions.setIsToolsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-blue-500 hover:bg-[var(--bg-hover)] rounded"
            >
              🔄 Quét lại Github Repository
            </button>
            <button
              onClick={() => {
                actions.syncSupabaseToGithubJSON();
                actions.setIsToolsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-green-500 hover:bg-[var(--bg-hover)] rounded"
            >
              🚀 Đẩy DB thành JSON Public
            </button>
            <hr className="my-2 border-[var(--border)]" />
            <button
              onClick={() => {
                actions.setIsAuthenticated(false);
                actions.setPin("");
                actions.setToken("");
                localStorage.removeItem("cms_auth");
                localStorage.removeItem("github_pat");
              }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-[var(--bg-hover)] rounded"
            >
              Đăng xuất
            </button>
          </div>
        )}
        <button
          onClick={() => {
            actions.setIsEditorOpen(true);
            actions.setEditorOriginal({ repo: "", filename: "", sha: "" });
            actions.setTitle("");
            actions.setSlug("");
            actions.setContent("");
            actions.setIsSlugEdited(false);
            actions.setUploadLinks([]);
          }}
          className={UI.btnAccent}
        >
          <svg className="w-4 h-4">
            <use href="#icon-plus"></use>
          </svg>{" "}
          VIẾT
        </button>
      </div>
    </header>
  );
}
