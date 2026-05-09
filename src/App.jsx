import React, { useState, useEffect, useMemo } from 'react';

// ==========================================
// 1. TIỆN ÍCH GITHUB API (Self-healing)
// ==========================================
const username = 'vietndj'; // Hardcode theo hệ thống cũ
const safeEnc = (fn) => { try { fn = decodeURIComponent(fn); } catch(e){} return encodeURIComponent(fn); };
const getHeaders = (token) => token ? { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' } : { 'Accept': 'application/vnd.github.v3+json' };

const fetchRawJSON = async (repoPath, file, token) => {
  try {
    const headers = { ...getHeaders(token), 'Accept': 'application/vnd.github.v3.raw' };
    const res = await fetch(`https://api.github.com/repos/${repoPath}/contents/${safeEnc(file)}?t=${Date.now()}`, { headers });
    if (res.ok) return await res.json();
  } catch(e) {}
  return null;
};

// ==========================================
// 2. ICON SVG COMPONENT
// ==========================================
const SVGIcons = () => (
  <svg style={{ display: 'none' }}>
    <symbol id="icon-tag" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></symbol>
    <symbol id="icon-folder" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></symbol>
    <symbol id="icon-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></symbol>
  </svg>
);

export default function App() {
  // --- STATE AUTH ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  // --- STATE EDITOR ---
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState(`${username}/${username}.github.io`);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  
  // --- STATE DATABASE & LỌC ---
  const [db, setDb] = useState({ files: [], repos: {}, tags: {}, pinned: [] });
  const [activeRepo, setActiveRepo] = useState('all');
  const [status, setStatus] = useState({ text: '', type: '' });
  const [isSyncing, setIsSyncing] = useState(false);

  // Khởi tạo Auth & Load Token
  useEffect(() => {
    if (localStorage.getItem("cms_auth") === "granted") setIsAuthenticated(true);
    const savedToken = localStorage.getItem('github_pat');
    if (savedToken) setToken(savedToken);
  }, []);

  // Tự động tải DB khi đã đăng nhập và có Token
  useEffect(() => {
    if (isAuthenticated && token) {
      loadDatabase();
    }
  }, [isAuthenticated, token]);

  const handleLogin = () => {
    if (pin.trim() === "0070") {
      localStorage.setItem("cms_auth", "granted");
      setIsAuthenticated(true);
    } else alert("Mã PIN sai.");
  };

  const handleSaveToken = (val) => {
    setToken(val);
    try { localStorage.setItem('github_pat', val); } catch(err){}
  };

  // --- HÀM TẢI DATABASE CỐT LÕI ---
  const loadDatabase = async () => {
    if (!token || isSyncing) return;
    setIsSyncing(true);
    setStatus({ text: 'Đang tải Database lõi...', type: 'loading' });
    
    try {
      // 1. Tải Metadata (chứa tags, pinned, links)
      const meta = await fetchRawJSON(`${username}/${username}.github.io`, 'metadata.json', token);
      // 2. Tải DB bài viết
      const dbData = await fetchRawJSON(`${username}/${username}.github.io`, 'cms_db.json', token);
      
      if (dbData && dbData.allFiles) {
        // Nhóm bài viết theo Repo
        const reposMap = {};
        dbData.allFiles.forEach(f => {
          if(!reposMap[f.repoName]) reposMap[f.repoName] = [];
          reposMap[f.repoName].push(f);
        });

        setDb({
          files: dbData.allFiles,
          repos: reposMap,
          tags: meta?.tags || {},
          pinned: meta?.pinned || []
        });
        setStatus({ text: '✅ Đã đồng bộ Database!', type: 'success' });
        setTimeout(() => setStatus({ text: '', type: '' }), 3000);
      } else {
        throw new Error("Dữ liệu trống hoặc không hợp lệ");
      }
    } catch (e) {
      setStatus({ text: `❌ Lỗi DB: ${e.message}`, type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Lọc bài viết hiển thị
  const filteredFiles = useMemo(() => {
    if (activeRepo === 'all') return db.files;
    return db.files.filter(f => f.repoName === activeRepo);
  }, [db.files, activeRepo]);

  // ==========================================
  // GIAO DIỆN LOGIN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[var(--bg-body)]">
        <div className="cms-card p-10 max-w-sm w-full mx-4 text-center shadow-2xl border cms-border">
          <h2 className="text-2xl font-bold mb-2">Workspace React</h2>
          <input type="password" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-center text-3xl font-bold px-4 py-4 cms-input rounded-2xl mb-6 border cms-border" />
          <button onClick={handleLogin} className="w-full py-4 text-base cms-btn-primary rounded-xl shadow-md">Mở Khóa</button>
        </div>
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN CHÍNH
  // ==========================================
  return (
    <div className="flex-col w-full min-h-screen fade-in flex">
      <SVGIcons />
      
      {/* HEADER */}
      <header className="cms-glass sticky top-0 z-[60] py-3 px-4 md:px-6 lg:px-8 flex justify-between items-center transition-all">
        <h1 className="text-xl font-bold tracking-tight text-[var(--accent)]">vietndj React</h1>
        <div className="flex items-center gap-3">
          <button onClick={loadDatabase} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold text-[var(--accent)]">
            {isSyncing ? '⏳ Đang tải...' : '↻ Tải DB'}
          </button>
          <button onClick={() => {localStorage.removeItem("cms_auth"); setIsAuthenticated(false)}} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold text-red-500">
            🔒 Khóa App
          </button>
        </div>
      </header>

      {/* HIỂN THỊ TRẠNG THÁI TOAST */}
      {status.text && (
        <div className="fixed bottom-6 left-6 z-[9999] cms-card px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold border-l-4 border-l-[var(--accent)] fade-in bg-[var(--bg-card)]">
           {status.text}
        </div>
      )}
      
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        
        {/* KHỐI EDITOR */}
        <section className="cms-card overflow-hidden mb-6">
          <button onClick={() => setIsEditorOpen(!isEditorOpen)} className="w-full px-6 py-4 flex justify-between items-center hover:bg-[var(--bg-hover)] font-semibold text-[var(--accent)] outline-none">
            <span className="flex items-center gap-2">
              <svg className="svg-icon"><use href="#icon-edit"></use></svg> Soạn thảo HTML 
            </span>
            <span style={{ transform: isEditorOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} className="transition-transform">▼</span>
          </button>
          
          {isEditorOpen && (
            <div className="p-6 border-t cms-border bg-[var(--bg-card)] fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <div>
                    <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">Mã Github PAT</label>
                    <input type="password" value={token} onChange={(e)=>handleSaveToken(e.target.value)} className="w-full px-4 py-2.5 cms-input rounded-xl text-sm" placeholder="Nhập Token..." />
                 </div>
                 <div>
                    <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">Kho (Repo)</label>
                    <input type="text" value={repo} onChange={(e)=>setRepo(e.target.value)} className="w-full px-4 py-2.5 cms-input rounded-xl text-sm font-bold text-[var(--accent)]" />
                 </div>
              </div>
              <div className="mb-4">
                 <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">Tiêu đề bài viết</label>
                 <input type="text" value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full px-4 py-2.5 cms-input rounded-xl text-sm font-bold" />
              </div>
              <div className="mb-5">
                 <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">Nội dung HTML</label>
                 <textarea rows="6" value={content} onChange={(e)=>setContent(e.target.value)} className="w-full px-4 py-3 bg-[#1D1D1F] text-[#34C759] border-none rounded-xl font-mono text-xs outline-none"></textarea>
              </div>
            </div>
          )}
        </section>

        {/* KHỐI LỌC REPO */}
        <div className="mb-6 overflow-x-auto pb-2 flex gap-2 items-center">
          <span className="text-[10px] font-bold text-muted uppercase shrink-0 mr-2 flex items-center gap-1">
             <svg className="w-3 h-3"><use href="#icon-folder"></use></svg> Lọc Kho
          </span>
          <button 
             onClick={() => setActiveRepo('all')} 
             className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${activeRepo === 'all' ? 'bg-[var(--accent)] text-white border-transparent' : 'cms-input hover:opacity-80'}`}>
             Tất cả
          </button>
          {Object.keys(db.repos).map(r => (
            <button 
              key={r} onClick={() => setActiveRepo(r)} 
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${activeRepo === r ? 'bg-[var(--accent)] text-white border-transparent' : 'cms-input hover:opacity-80'}`}>
              {r} ({db.repos[r].length})
            </button>
          ))}
        </div>

        {/* DANH SÁCH BÀI VIẾT (GRID VIEW CƠ BẢN) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file, idx) => (
              <div key={idx} className="cms-card p-4 flex flex-col relative group hover:scale-[1.01] transition border cms-border">
                <span className="text-[10px] text-muted flex items-center gap-1 mb-2">
                  <svg className="w-3 h-3"><use href="#icon-folder"></use></svg> {file.repoName}
                </span>
                <a href={file.url} target="_blank" rel="noreferrer" className="font-bold text-[15px] hover:underline mb-2 line-clamp-2">
                  {file.name}
                </a>
                <div className="text-xs text-muted line-clamp-3 mb-4 flex-1">
                  {file.preview || 'Không có mô tả...'}
                </div>
                <div className="flex justify-between items-center pt-3 border-t cms-border">
                  <span className="text-[10px] opacity-60">{file.fullDate}</span>
                  <button className="cms-btn px-3 py-1 rounded text-[10px] font-bold text-[var(--accent)]">
                    Sửa
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-muted font-bold text-sm">
              Không có bài viết nào để hiển thị.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}