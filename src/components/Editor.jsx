// src/components/Editor.jsx
import { useState, useEffect } from "react";

export default function Editor() {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState("");
  const [repo, setRepo] = useState("vietndj/");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  // Load token từ localStorage khi khởi tạo
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("github_pat");
      if (savedToken) setToken(savedToken);
    } catch (e) {}
  }, []);

  const handleSaveToken = (e) => {
    const val = e.target.value;
    setToken(val);
    try {
      localStorage.setItem("github_pat", val);
    } catch (err) {}
  };

  return (
    <section className="cms-card overflow-hidden mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex justify-between items-center hover:bg-[var(--bg-hover)] transition outline-none"
      >
        <span className="flex items-center gap-2 font-semibold text-[var(--accent)]">
          <svg className="svg-icon">
            <use href="#icon-edit"></use>
          </svg>{" "}
          Soạn thảo HTML
          <span className="text-[10px] text-muted cms-input border cms-border px-1.5 py-0.5 rounded font-mono ml-2 uppercase hidden sm:inline-block">
            Ctrl E
          </span>
        </span>
        <span
          className="text-muted transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="p-6 border-t cms-border bg-[var(--bg-card)] fade-in">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="cms-btn px-4 py-2 text-xs font-bold rounded-lg shadow-sm"
              >
                Sửa Root
              </button>
              <button
                type="button"
                className="cms-btn-primary px-4 py-2 text-xs rounded-lg shadow-sm"
              >
                Sửa Index Repo
              </button>
            </div>
            {token ? (
              <div className="text-green-500 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-200 dark:border-transparent">
                ✓ API Connected{" "}
                <button
                  onClick={() => {
                    setToken("");
                    localStorage.removeItem("github_pat");
                  }}
                  className="underline ml-1"
                >
                  Xóa
                </button>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {!token && (
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">
                  Mã Github (PAT)
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={handleSaveToken}
                  className="w-full px-4 py-2.5 cms-input rounded-xl text-sm"
                  placeholder="Nhập Token GitHub..."
                />
              </div>
            )}
            <div className={token ? "md:col-span-2" : ""}>
              <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">
                Kho (Repo)
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="w-full px-4 py-2.5 cms-input rounded-xl text-sm font-bold text-[var(--accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">
                Tiêu đề bài viết
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Vd: Kiến thức..."
                className="w-full px-4 py-2.5 cms-input rounded-xl text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">
                Slug (URL)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="kien-thuc..."
                className="w-full px-4 py-2.5 cms-input rounded-xl text-sm font-mono text-[var(--accent)]"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">
              Nội dung HTML
            </label>
            <textarea
              rows="12"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 bg-[#1D1D1F] text-[#34C759] border-none rounded-xl focus:ring-2 focus:ring-[var(--accent)] font-mono text-xs leading-relaxed outline-none"
              placeholder="Nhập mã HTML vào đây..."
            ></textarea>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              className="cms-btn-primary px-8 py-3 rounded-xl shadow-md"
            >
              Lưu Bài
            </button>
            <button
              type="button"
              className="cms-btn px-6 py-3 rounded-xl font-bold flex items-center gap-2"
            >
              <svg className="w-4 h-4">
                <use href="#icon-copy"></use>
              </svg>{" "}
              Copy Substack
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
