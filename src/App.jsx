import React, { useState, useEffect, useMemo } from 'react';

// ==========================================
// 1. TIỆN ÍCH GITHUB API (Self-healing)
// ==========================================
const username = 'vietndj';
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
// 2. ICON SVG COMPONENT (Bổ sung icon mới)
// ==========================================
const SVGIcons = () => (
  <svg style={{ display: 'none' }}>
    <symbol id="icon-tag" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></symbol>
    <symbol id="icon-folder" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></symbol>
    <symbol id="icon-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></symbol>
    <symbol id="icon-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></symbol>
    <symbol id="icon-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></symbol>
    <symbol id="icon-timer" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></symbol>
    <symbol id="icon-pin-filled" viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22" stroke="currentColor"></line><path fill="currentColor" stroke="none" d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></symbol>
  </svg>
);

export default function App() {
  // --- STATE AUTH ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  // --- STATE EDITOR ---
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [token, setToken] = useState('');
  
  // --- STATE DATABASE ---
  const [db, setDb] = useState({ files: [], repos: {}, tags: {}, pinned: [] });
  const [status, setStatus] = useState({ text: '', type: '' });
  const [isSyncing, setIsSyncing] = useState(false);

  // --- STATE BỘ LỌC & UI ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // list, grid
  const [sortOrder, setSortOrder] = useState('desc'); // desc (mới), asc (cũ)
  const [activeRepo, setActiveRepo] = useState('all');
  const [activeTag, setActiveTag] = useState('all');

  // Khởi tạo Auth & Load Token
  useEffect(() => {
    if (localStorage.getItem("cms_auth") === "granted") setIsAuthenticated(true);
    const savedToken = localStorage.getItem('github_pat');
    if (savedToken) setToken(savedToken);
  }, []);

  // Tự động tải DB
  useEffect(() => {
    if (isAuthenticated && token && db.files.length === 0) loadDatabase();
  }, [isAuthenticated, token]);

  const handleLogin = () => {
    if (pin.trim() === "0070") {
      localStorage.setItem("cms_auth", "granted");
      setIsAuthenticated(true);
    } else alert("Mã PIN sai.");
  };

  const loadDatabase = async () => {
    if (!token || isSyncing) return;
    setIsSyncing(true);
    setStatus({ text: 'Đang tải Database lõi...', type: 'loading' });
    
    try {
      const meta = await fetchRawJSON(`${username}/${username}.github.io`, 'metadata.json', token);
      const dbData = await fetchRawJSON(`${username}/${username}.github.io`, 'cms_db.json', token);
      
      if (dbData && dbData.allFiles) {
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
      }
    } catch (e) { setStatus({ text: `❌ Lỗi DB: ${e.message}`, type: 'error' }); } 
    finally { setIsSyncing(false); }
  };

  // ==========================================
  // XỬ LÝ DỮ LIỆU (LỌC, TÌM KIẾM, SẮP XẾP)
  // ==========================================

  // 1. Lấy danh sách tất cả các nhãn (tags) duy nhất từ metadata
  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set();
    Object.values(db.tags).forEach(tagArray => {
      tagArray.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [db.tags]);

  // Hàm helper lấy tag của 1 file cụ thể
  const getFileTags = (repo, file) => db.tags[`${repo}/${file}`] || [];

  // 2. Lọc và Sắp xếp files
  const processedFiles = useMemo(() => {
    let filtered = db.files.filter(f => {
      // Lọc theo Repo
      const matchRepo = activeRepo === 'all' || f.repoName === activeRepo;
      // Lọc theo Nhãn
      const matchTag = activeTag === 'all' || getFileTags(f.repoName, f.fileName).includes(activeTag);
      // Lọc theo Search
      const sq = searchQuery.toLowerCase();
      const matchSearch = !sq || 
        (f.name || "").toLowerCase().includes(sq) || 
        (f.repoName || "").toLowerCase().includes(sq) || 
        (isDeepSearch && (f.preview || "").toLowerCase().includes(sq));

      return matchRepo && matchTag && matchSearch;
    });

    // Sắp xếp (Cũ / Mới)
    filtered.sort((a, b) => {
      return sortOrder === 'desc' 
        ? (b.timestamp || 0) - (a.timestamp || 0) 
        : (a.timestamp || 0) - (b.timestamp || 0);
    });

    return filtered;
  }, [db.files, activeRepo, activeTag, searchQuery, isDeepSearch, sortOrder, db.tags]);

  // 3. Phân tách Dữ liệu hiển thị
  const recentFiles = useMemo(() => {
    if (activeTag !== 'all' || activeRepo !== 'all' || searchQuery.trim() !== '') return [];
    return [...db.files].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);
  }, [db.files, activeRepo, activeTag, searchQuery]);

  const pinnedFiles = useMemo(() => {
    return processedFiles.filter(f => db.pinned.includes(`${f.repoName}/${f.fileName}`));
  }, [processedFiles, db.pinned]);

  const groupedFiles = useMemo(() => {
    const groups = {};
    processedFiles.forEach(f => {
      if (!db.pinned.includes(`${f.repoName}/${f.fileName}`)) {
        if (!groups[f.repoName]) groups[f.repoName] = [];
        groups[f.repoName].push(f);
      }
    });
    return groups;
  }, [processedFiles, db.pinned]);


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
  // COMPONENT RENDER BÀI VIẾT (CARD)
  // ==========================================
  const renderCard = (file, isRecent = false) => {
    const tags = getFileTags(file.repoName, file.fileName);
    
    // Giao diện Recent (Hình vuông nhỏ nhắn)
    if (isRecent) {
      return (
        <div key={file.sha} className="cms-card p-3 min-w-[240px] max-w-[240px] flex flex-col group hover:border-[var(--accent)] transition cursor-pointer border cms-border" onClick={() => window.open(file.url, '_blank')}>
          <div className="text-[10px] text-muted mb-1 flex items-center gap-1">
            <svg className="w-3 h-3"><use href="#icon-folder"></use></svg>{file.repoName}
          </div>
          <h4 className="font-bold text-sm line-clamp-2 mb-2 group-hover:text-[var(--accent)] transition">{file.name}</h4>
          <div className="flex justify-between items-center mt-auto border-t cms-border pt-2">
            <span className="text-[10px] opacity-70">{file.fullDate ? file.fullDate.split(' ')[1] || file.fullDate.split(' ')[0] : ''}</span>
            <button className="text-[10px] bg-[var(--bg-hover)] text-[var(--accent)] px-2 py-1 rounded font-bold hover:opacity-80 transition">Sửa</button>
          </div>
        </div>
      );
    }

    // Giao diện List/Grid thông thường
    return (
      <div key={file.sha} className="cms-card p-4 flex flex-col relative group hover:scale-[1.01] transition border cms-border">
        {/* Nút check góc trái */}
        <input type="checkbox" className="absolute top-5 left-4 w-4 h-4 z-10 cursor-pointer accent-[var(--accent)]" />
        
        <div className="pl-6">
          <div className="text-[10px] text-muted flex items-center gap-1 mb-2 font-bold uppercase tracking-wide">
            <svg className="w-3 h-3"><use href="#icon-folder"></use></svg> {file.repoName}
          </div>
          <a href={file.url} target="_blank" rel="noreferrer" className="font-bold text-[15px] hover:text-[var(--accent)] mb-2 line-clamp-2">
            {file.name}
          </a>
          
          {/* Render Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map(t => (
                <span key={t} className="cms-input text-[10px] px-2 py-0.5 rounded font-bold border cms-border flex items-center gap-1 opacity-90 bg-gray-100">
                  <svg className="w-2.5 h-2.5 opacity-60"><use href="#icon-tag"></use></svg>{t}
                </span>
              ))}
            </div>
          )}

          <div className="text-xs text-muted line-clamp-2 mb-4">
            {file.preview || '...'}
          </div>
        </div>

        <div className="flex justify-between items-center mt-auto pt-3 border-t cms-border">
          <span className="text-[10px] opacity-60">{file.fullDate}</span>
          <button className="cms-btn px-4 py-1.5 rounded-lg text-xs font-bold transition">Sửa</button>
        </div>
      </div>
    );
  };

  // ==========================================
  // GIAO DIỆN CHÍNH
  // ==========================================
  return (
    <div className="flex-col w-full min-h-screen fade-in flex bg-[var(--bg-body)]">
      <SVGIcons />
      
      {/* 1. HEADER CHÍNH */}
      <header className="cms-glass sticky top-0 z-[60] py-3 px-4 md:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all border-b cms-border shadow-sm">
        <h1 className="text-xl font-bold tracking-tight shrink-0 text-[var(--accent)] hidden sm:block">vietndj</h1>
        
        {/* Thanh tìm kiếm */}
        <div className="flex-1 w-full max-w-2xl flex items-center gap-2">
          <div className="flex-1 flex items-center bg-[var(--bg-card)] rounded-xl px-4 py-2 w-full border cms-border shadow-sm">
            <svg className="svg-icon text-muted"><use href="#icon-search"></use></svg>
            <input type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Tìm bài viết, repo... (Ctrl K)" className="bg-transparent border-none outline-none text-sm w-full ml-3 font-bold placeholder-[var(--text-muted)]" />
          </div>
          <button onClick={() => setIsDeepSearch(!isDeepSearch)} className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${isDeepSearch ? 'bg-[var(--accent)] text-white border-transparent' : 'cms-btn border-[var(--border)]'}`}>
            <svg className="w-4 h-4"><use href="#icon-grid"></use></svg> <span className="hidden sm:inline-block">Sâu</span>
          </button>
        </div>

        {/* Nút tác vụ phải */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="hidden lg:block cms-btn px-3 py-1.5 rounded-xl text-xs font-bold">↻ Tải DB Lõi</button>
          <button className="cms-btn px-3 py-1.5 rounded-xl text-xs font-bold">📝 Việc</button>
          <button className="cms-btn px-3 py-1.5 rounded-xl text-xs font-bold">Công cụ ▾</button>
        </div>
      </header>

      {/* 2. SUB-HEADER (VIEWS & FILTERS) */}
      <div className="sticky top-[60px] lg:top-[68px] z-40 bg-[var(--bg-body)]/95 backdrop-blur-md border-b cms-border py-2 mb-6">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 flex flex-col gap-2">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* View Mode */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-muted uppercase mr-2">View</span>
              <div className="flex bg-[var(--bg-card)] p-1 rounded-lg border cms-border shadow-sm">
                <button onClick={() => setCurrentView('list')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${currentView === 'list' ? 'bg-[var(--bg-body)] shadow-sm border cms-border text-[var(--text-main)]' : 'text-muted hover:text-[var(--text-main)]'}`}>List</button>
                <button onClick={() => setCurrentView('grid')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${currentView === 'grid' ? 'bg-[var(--bg-body)] shadow-sm border cms-border text-[var(--text-main)]' : 'text-muted hover:text-[var(--text-main)]'}`}>Grid</button>
                <button className="px-3 py-1 rounded-md text-xs font-bold text-muted hover:text-[var(--text-main)] transition">Kanban</button>
                <button className="px-3 py-1 rounded-md text-xs font-bold text-muted hover:text-[var(--text-main)] transition">Table</button>
                <button className="px-3 py-1 rounded-md text-xs font-bold text-muted hover:text-[var(--text-main)] transition">Feed</button>
              </div>
            </div>

            {/* Sort & Reload */}
            <div className="flex items-center gap-2">
              <div className="flex bg-[var(--bg-card)] p-1 rounded-lg border cms-border shadow-sm">
                <button onClick={() => setSortOrder('desc')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${sortOrder === 'desc' ? 'bg-[var(--bg-body)] shadow-sm border cms-border' : 'text-muted'}`}>Mới ↓</button>
                <button onClick={() => setSortOrder('asc')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${sortOrder === 'asc' ? 'bg-[var(--bg-body)] shadow-sm border cms-border' : 'text-muted'}`}>Cũ ↑</button>
              </div>
              <button onClick={loadDatabase} className="cms-btn bg-[var(--bg-card)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--accent)] shadow-sm">
                 {isSyncing ? '⏳...' : '↻ Tải lại'}
              </button>
            </div>
          </div>

          {/* Lọc KHO */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-1 scrollbar-hide">
             <span className="text-[10px] font-bold text-muted uppercase shrink-0 mr-2 flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-folder"></use></svg> Kho</span>
             <button onClick={() => setActiveRepo('all')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${activeRepo === 'all' ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border)] hover:bg-[var(--bg-hover)]'}`}>Tất cả</button>
             {Object.keys(db.repos).map(r => (
               <button key={r} onClick={() => setActiveRepo(r)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${activeRepo === r ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border)] hover:bg-[var(--bg-hover)]'}`}>
                 {r} <span className="opacity-60 font-normal">({db.repos[r].length})</span>
               </button>
             ))}
          </div>

          {/* Lọc NHÃN */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
             <span className="text-[10px] font-bold text-muted uppercase shrink-0 mr-2 flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-tag"></use></svg> Nhãn</span>
             <button onClick={() => setActiveTag('all')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${activeTag === 'all' ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border)] hover:bg-[var(--bg-hover)]'}`}>Tất cả</button>
             {allUniqueTags.map(t => (
               <button key={t} onClick={() => setActiveTag(t)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${activeTag === t ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border)] hover:bg-[var(--bg-hover)]'}`}>
                 {t}
               </button>
             ))}
             {allUniqueTags.length > 0 && <button className="ml-2 px-3 py-1 text-xs font-bold rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition shrink-0">⚙ Sửa</button>}
          </div>

        </div>
      </div>
      
      {/* 3. MAIN CONTENT */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pb-20">
        
        {/* Editor Toggle */}
        <div className="cms-card mb-8 overflow-hidden">
           <button onClick={() => setIsEditorOpen(!isEditorOpen)} className="w-full px-6 py-4 flex justify-between items-center bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition font-semibold text-[var(--accent)]">
              <span className="flex items-center gap-2"><svg className="svg-icon"><use href="#icon-edit"></use></svg> Soạn thảo HTML</span>
              <span style={{ transform: isEditorOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} className="transition-transform">▼</span>
           </button>
           {isEditorOpen && <div className="p-6 border-t cms-border text-center text-sm font-bold text-muted">Khối soạn thảo đang ẩn để tối ưu góc nhìn.</div>}
        </div>

        {/* Khối Gần Đây (Chỉ hiện khi không có filter) */}
        {recentFiles.length > 0 && (
          <details open className="mb-8">
            <summary className="font-bold text-lg mb-3 cursor-pointer outline-none flex items-center gap-2 text-[var(--accent)]">
              <svg className="w-5 h-5"><use href="#icon-timer"></use></svg> Vừa thao tác gần đây
            </summary>
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
              {recentFiles.map(f => renderCard(f, true))}
            </div>
          </details>
        )}

        {/* Khối Pinned */}
        {pinnedFiles.length > 0 && (
          <details open className="mb-6">
            <summary className="font-bold text-xl mb-4 border-b cms-border pb-2 cursor-pointer outline-none text-[#FF9500] flex items-center gap-2">
              <svg className="w-6 h-6"><use href="#icon-pin-filled"></use></svg> 📌 Đã ghim 
              <span className="cms-input text-xs px-2 py-0.5 rounded-full border cms-border text-[var(--text-main)]">{pinnedFiles.length}</span>
            </summary>
            <div className={currentView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'}>
              {pinnedFiles.map(f => renderCard(f, false))}
            </div>
          </details>
        )}

        {/* Khối List theo Repo */}
        {Object.keys(groupedFiles).length > 0 ? (
          Object.keys(groupedFiles).map(repoName => (
            <details key={repoName} open className="mb-8">
              <summary className="font-bold text-xl mb-4 border-b cms-border pb-2 cursor-pointer outline-none flex items-center gap-2">
                <svg className="w-6 h-6"><use href="#icon-folder"></use></svg> {repoName}
                <span className="cms-input text-xs px-2 py-0.5 rounded-full border cms-border text-muted">{groupedFiles[repoName].length}</span>
              </summary>
              <div className={currentView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'}>
                {groupedFiles[repoName].map(f => renderCard(f, false))}
              </div>
            </details>
          ))
        ) : (
          <div className="text-center py-20 text-muted font-bold text-sm">Không tìm thấy bài viết nào phù hợp.</div>
        )}

      </main>

      {/* Toast */}
      {status.text && (
        <div className="fixed bottom-6 left-6 z-[9999] cms-card px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold border-l-4 border-l-[var(--accent)] fade-in">
           {status.text}
        </div>
      )}
    </div>
  );
}