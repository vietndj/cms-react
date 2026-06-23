import React, { useState } from "react";
import { UI } from "../../constants/theme";
import { USERNAME } from "../../constants/config";
import { generateSlug } from "../../utils/helpers";
import { saveTokenToCloud } from "../../services/supabase";

export default function EditorCard({ cms: { state, actions, data } }) {
  const [sTk, setSTk] = useState(!state.token);
  const [tkStatus, setTkStatus] = useState("idle");
  const SECRET_PIN_LOCAL = "0070";

  const hC = (e) => {
    const v = e.target.value;
    actions.setContent(v);
    if (!state.title.trim() && v.includes("<title>")) {
      const m = v.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (m && m[1]) {
        const x = m[1].trim();
        actions.setTitle(x);
        if (!state.isSlugEdited) actions.setSlug(generateSlug(x, state.tags));
      }
    }
  };

  const handleTokenBlur = async (val) => {
    if (!val || val.length < 10) return;
    setTkStatus("saving");
    const ok = await saveTokenToCloud(val, SECRET_PIN_LOCAL);
    setTkStatus(ok ? "saved" : "error");
    setTimeout(() => setTkStatus("idle"), 3000);
  };

  const tokenBadge = state.token
    ? tkStatus === "saving"
      ? {
          label: "⏳ Đang lưu...",
          cls: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
        }
      : tkStatus === "saved"
        ? {
            label: "✅ Đã lưu Cloud",
            cls: "text-green-500 border-green-500/30 bg-green-500/10",
          }
        : tkStatus === "error"
          ? {
              label: "❌ Lỗi lưu Cloud",
              cls: "text-red-500 border-red-500/30 bg-red-500/10",
            }
          : {
              label: "🔑 Token sẵn sàng",
              cls: "text-[var(--accent)] border-[var(--accent)]/30 bg-[var(--accent)]/10",
            }
    : {
        label: "⚠️ Chưa có Token",
        cls: "text-yellow-600 border-yellow-600/30 bg-yellow-600/10",
      };

  const cTg = state.tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const aTg = data.allUniqueTags.filter((t) => !cTg.includes(t.toLowerCase()));

  return (
    <section className="cms-card overflow-hidden border border-[var(--border)] shadow-sm rounded-xl">
      <button
        onClick={() => actions.setIsEditorOpen(!state.isEditorOpen)}
        className="w-full px-6 py-4 flex justify-between items-center bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] font-bold text-[var(--accent)] outline-none transition"
      >
        <span className="flex items-center gap-2 text-base">
          <svg className="w-5 h-5">
            <use href="#icon-edit"></use>
          </svg>{" "}
          Soạn thảo HTML
        </span>
        <span className="flex items-center gap-3">
          {
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tokenBadge.cls}`}
            >
              {tokenBadge.label}
            </span>
          }
          {state.isEditorOpen ? "▲" : "▼"}
        </span>
      </button>
      {state.isEditorOpen && (
        <div className="p-6 flex flex-col gap-5 border-t border-[var(--border)] bg-[var(--bg-card)]">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex flex-wrap gap-2">
                {data.repoKeysList.map((r) => (
                  <button
                    key={r}
                    onClick={() => actions.setRepo(`${USERNAME}/${r}`)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border ${state.repo === `${USERNAME}/${r}` ? "bg-[var(--accent)] text-white border-transparent" : "bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border)]"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSTk(!sTk)}
                className={`shrink-0 px-3 py-1.5 text-[10px] font-bold rounded-lg border transition ${sTk ? "bg-[var(--accent)] text-white border-transparent" : "bg-[var(--bg-hover)] text-[var(--text-main)] border-[var(--border)]"}`}
              >
                🔑 Token
              </button>
            </div>
            {sTk && (
              <div className="flex flex-col gap-2">
                <input
                  type="password"
                  value={state.token}
                  onChange={(e) => {
                    actions.setToken(e.target.value);
                    localStorage.setItem("github_pat", e.target.value);
                  }}
                  onBlur={(e) => handleTokenBlur(e.target.value)}
                  className={UI.input}
                  placeholder="Dán GitHub Personal Access Token (ghp_...) — tự lưu Cloud khi rời ô..."
                />
                <p className="text-[10px] text-[var(--text-muted)] px-1">
                  💡 Token sẽ tự động lưu lên Cloud (mã hóa). Máy mới nhập mã
                  0070 sẽ tự nhận token.
                </p>
              </div>
            )}
          </div>
          <textarea
            ref={state.editorInputRef}
            rows="12"
            value={state.content}
            onChange={hC}
            className="w-full p-5 bg-[#1D1D1F] text-[#34C759] rounded-xl font-mono text-sm outline-none shadow-inner"
            placeholder="Dán HTML..."
          ></textarea>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input
              type="text"
              value={state.title}
              onChange={(e) => {
                actions.setTitle(e.target.value);
                if (!state.isSlugEdited)
                  actions.setSlug(generateSlug(e.target.value, state.tags));
              }}
              className={UI.input}
              placeholder="Tiêu đề..."
            />
            <input
              type="text"
              value={state.slug}
              onChange={(e) => {
                actions.setSlug(e.target.value);
                actions.setIsSlugEdited(true);
              }}
              className={`${UI.input} font-mono text-[var(--accent)]`}
              placeholder="slug..."
            />
          </div>
          <div className="flex flex-col gap-3">
            <input
              id="tags-input"
              type="text"
              value={state.tags}
              onChange={(e) => actions.setTags(e.target.value)}
              className={UI.input}
              placeholder="Nhập tags (phân cách bằng dấu phẩy)..."
            />
            {aTg.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aTg.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      const a = state.tags
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean);
                      a.push(t);
                      actions.setTags(a.join(", ") + ", ");
                      document.getElementById("tags-input").focus();
                    }}
                    className="px-3 py-1.5 text-[11px] font-bold bg-[var(--bg-hover)] text-[var(--text-main)] rounded-lg border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center pt-4 border-t cms-border">
            <button
              id="btn-save-article"
              onClick={actions.handleSaveArticle}
              disabled={state.isSaving}
              className={UI.btnSave}
            >
              LƯU BÀI
            </button>
            {state.editorOriginal.sha && (
              <div className="flex items-center gap-2">
                <button
                  onClick={actions.handleDeleteArticle}
                  disabled={state.isSaving}
                  className="text-red-500 font-bold px-4 py-2 hover:bg-red-500/10 rounded-xl transition text-xs uppercase tracking-wider"
                >
                  🗑️ Xóa Bài
                </button>
                <button
                  onClick={() => {
                    actions.setTitle("");
                    actions.setSlug("");
                    actions.setContent("");
                    actions.setTags(
                      localStorage.getItem("cms_last_tags") || "",
                    );
                    actions.setEditorOriginal({
                      repo: "",
                      filename: "",
                      sha: "",
                    });
                    actions.setIsSlugEdited(false);
                  }}
                  className="text-[var(--text-muted)] font-bold px-4 py-2 hover:bg-[var(--bg-hover)] rounded-xl transition text-xs uppercase tracking-wider"
                >
                  ✕ Hủy Sửa
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
