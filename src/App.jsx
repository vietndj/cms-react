import React, { useState, useEffect, useMemo, useRef } from 'react';

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

const encodeBase64UTF8Async = async (str) => {
  const bytes = new TextEncoder().encode(str); let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 16384) { binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 16384)); }
  return btoa(binary);
};

const getFileShaSafe = async (repoPath, file, token) => { 
  try {
      let d = await fetch(`https://api.github.com/repos/${repoPath}/contents/${safeEnc(file)}?t=${Date.now()}`, { headers: getHeaders(token) }).then(r => r.ok ? r.json() : null); 
      if(d && !Array.isArray(d)) return d.sha; 
      let d2 = await fetch(`https://api.github.com/repos/${repoPath}/contents/?t=${Date.now()}`, { headers: getHeaders(token) }).then(r => r.ok ? r.json() : null); 
      if(d2 && Array.isArray(d2)) { const f = d2.find(x => x.name === file); if(f) return f.sha; } 
      return null;
  } catch(e) { return null; }
};

const parsePreview = (html) => {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || "").replace(/\s+/g,' ').trim().substring(0, 150) + '...';
  } catch(e) { return "..."; }
};

// ==========================================
// 2. ICON SVG COMPONENT
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
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [token, setToken] = useState('');
  
  // Tự động load Repo cuối cùng từ localStorage, nếu không có thì mặc định lấy vietndj.github.io
  const [repo, setRepo] = useState(() => localStorage.getItem('cms_last_repo') || `${username}/${username}.github.io`);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  
  // --- STATE DATABASE & BỘ LỌC ---
  const [db, setDb] = useState({ files: [], repos: {}, tags: {}, pinned: [], links: {}, colors: {}, titles: {}, tasks: [], customCol: [] });
  const [status, setStatus] = useState({ text: '', type: '' });
  const [isSyncing, setIsSyncing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [currentView, setCurrentView] = useState('list');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeRepo, setActiveRepo] = useState('all');
  const [activeTag, setActiveTag] = useState('all');

  // Khởi tạo
  useEffect(() => {
    if (localStorage.getItem("cms_auth") === "granted") setIsAuthenticated(true);
    const savedToken = localStorage.getItem('github_pat');
    if (savedToken) setToken(savedToken);
  }, []);

  useEffect(() => {
    if (isAuthenticated && token && db.files.length === 0) loadDatabase();
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

  const autoSlugify = (val, currentTags) => {
    setTitle(val);
    let s = val.toLowerCase().replace(/[áàảạãăắằẳẵặâấầẩẫậ]/gi,'a').replace(/[éèẻẽẹêếềểễệ]/gi,'e').replace(/[iíìỉĩị]/gi,'i').replace(/[óòỏõọôốồổỗộơớờởỡợ]/gi,'o').replace(/[úùủũụưứừửữự]/gi,'u').replace(/[ýỳỷỹỵ]/gi,'y').replace(/đ/gi,'d').replace(/\s+/g,'-').replace(/[^\w\-]+/g,'').replace(/\-\-+/g,'-').replace(/^-+|-+$/g,'');
    let tagArr = currentTags.split(',').map(x=>x.trim()).filter(Boolean);
    if(tagArr.length && s) { 
        let ts = tagArr.join('-').toLowerCase().replace(/\s+/g,'-'); 
        if(!s.includes(ts)) s += '-' + ts; 
    }
    setSlug(s);
  };

  // Nút bấm Tag bật/tắt
  const toggleTag = (t) => {
    let currentTags = tags.split(',').map(x => x.trim()).filter(Boolean);
    if (currentTags.includes(t)) {
        currentTags = currentTags.filter(x => x !== t); // Tắt tag
    } else {
        currentTags.push(t); // Bật tag
    }
    const newTagsStr = currentTags.join(', ');
    setTags(newTagsStr);
    autoSlugify(title, newTagsStr);
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
          pinned: meta?.pinned || [],
          links: meta?.links || {},
          colors: meta?.colors || {},
          titles: meta?.titles || {},
          tasks: meta?.tasks || [],
          customCol: meta?.customCol || []
        });
        setStatus({ text: '✅ Đã đồng bộ Database!', type: 'success' });
        setTimeout(() => setStatus({ text: '', type: '' }), 3000);
      }
    } catch (e) { setStatus({ text: `❌ Lỗi DB: ${e.message}`, type: 'error' }); } 
    finally { setIsSyncing(false); }
  };

  // ==========================================
  // HÀM LƯU BÀI VIẾT
  // ==========================================
  const handleSaveArticle = async () => {
    if (!token) return alert("Vui lòng nhập Token GitHub PAT (Ở phần Cài đặt nâng cao)!");
    if (!repo || !title || !slug || !content) return alert("Vui lòng điền đủ Tiêu đề, Slug và Nội dung!");

    setIsSaving(true);
    setStatus({ text: '⏳ Đang lưu file HTML...', type: 'loading' });

    try {
      let filename = slug.endsWith('.html') ? slug : slug + '.html';
      let rName = repo.includes('/') ? (repo.split('/')[1] || repo.split('/')[0]) : repo;
      let rOwner = repo.includes('/') ? repo.split('/')[0] : username;
      let fileKey = `${rName}/${filename}`;

      const encodedContent = await encodeBase64UTF8Async(content);
      let fileSha = await getFileShaSafe(`${rOwner}/${rName}`, filename, token);

      const bodyHTML = { message: `Tạo/Sửa bài: ${title}`, content: encodedContent };
      if (fileSha) bodyHTML.sha = fileSha;

      const resHTML = await fetch(`https://api.github.com/repos/${rOwner}/${rName}/contents/${safeEnc(filename)}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyHTML)
      });
      if (!resHTML.ok) throw new Error("Lỗi khi ghi file HTML lên GitHub");
      const resHTMLData = await resHTML.json();

      setStatus({ text: 'Đang đồng bộ Metadata & CMS DB...', type: 'loading' });
      
      let newTags = { ...db.tags };
      let tagArr = tags.split(',').map(x => x.trim()).filter(Boolean);
      if (tagArr.length) newTags[fileKey] = tagArr; else delete newTags[fileKey];

      let newTitles = { ...db.titles };
      newTitles[fileKey] = title;

      let newFiles = [...db.files];
      let fileIndex = newFiles.findIndex(f => f.sha === fileSha || (f.repoName === rName && f.fileName === filename));
      
      const dDate = new Date();
      const newFileObj = {
          repoName: rName,
          name: title,
          fileName: filename,
          sha: resHTMLData.content?.sha || fileSha,
          url: `https://${rOwner}.github.io/${rName === `${rOwner}.github.io` ? '' : rName + '/'}${filename}`,
          timestamp: dDate.getTime(),
          fullDate: dDate.toLocaleString('vi-VN'),
          preview: parsePreview(content),
      };

      if (fileIndex !== -1) newFiles[fileIndex] = { ...newFiles[fileIndex], ...newFileObj };
      else newFiles.unshift(newFileObj);

      const newDbState = { ...db, files: newFiles, tags: newTags, titles: newTitles };
      
      const metaContent = await encodeBase64UTF8Async(JSON.stringify({
          _version: 8, tags: newDbState.tags, links: newDbState.links, tasks: newDbState.tasks,
          pinned: newDbState.pinned, colors: newDbState.colors, customCol: newDbState.customCol, titles: newDbState.titles
      }, null, 2));
      const metaSha = await getFileShaSafe(`${username}/${username}.github.io`, 'metadata.json', token);
      await fetch(`https://api.github.com/repos/${username}/${username}.github.io/contents/metadata.json`, {
          method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Sync Meta (React)', content: metaContent, sha: metaSha || undefined })
      });

      const dbContent = await encodeBase64UTF8Async(JSON.stringify({ allFiles: newDbState.files }));
      const dbSha = await getFileShaSafe(`${username}/${username}.github.io`, 'cms_db.json', token);
      await fetch(`https://api.github.com/repos/${username}/${username}.github.io/contents/cms_db.json`, {
          method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Sync DB (React)', content: dbContent, sha: dbSha || undefined })
      });

      setDb(newDbState);
      setStatus({ text: '✅ Đăng bài thành công!', type: 'success' });
      setTitle(''); setSlug(''); setContent(''); setTags(''); // Clear form
      setTimeout(() => setStatus({ text: '', type: '' }), 4000);
      
    } catch (error) {
      setStatus({ text: `❌ Lỗi: ${error.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // XỬ LÝ LỌC VÀ HIỂN THỊ DỮ LIỆU
  // ==========================================
  const repoKeysList = useMemo(() => {
      const keys = Object.keys(db.repos);
      if (!keys.includes(`${username}.github.io`)) keys.unshift(`${username}.github.io`);
      return keys;
  }, [db.repos]);

  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set();
    Object.values(db.tags).forEach(tagArray => tagArray.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet).sort();
  }, [db.tags]);

  const getFileTags = (r, f) => db.tags[`${r}/${f}`] || [];

  const processedFiles = useMemo(() => {
    let filtered = db.files.filter(f => {
      const matchRepo = activeRepo === 'all' || f.repoName === activeRepo;
      const matchTag = activeTag === 'all' || getFileTags(f.repoName, f.fileName).includes(activeTag);
      const sq = searchQuery.toLowerCase();
      const matchSearch = !sq || (f.name || "").toLowerCase().includes(sq) || (f.repoName || "").toLowerCase().includes(sq) || (isDeepSearch && (f.preview || "").toLowerCase().includes(sq));
      return matchRepo && matchTag && matchSearch;
    });
    filtered.sort((a, b) => sortOrder === 'desc' ? (b.timestamp || 0) - (a.timestamp || 0) : (a.timestamp || 0) - (b.timestamp || 0));
    return filtered;
  }, [db.files, activeRepo, activeTag, searchQuery, isDeepSearch, sortOrder, db.tags]);

  const recentFiles = useMemo(() => {
    if (activeTag !== 'all' || activeRepo !== 'all' || searchQuery.trim() !== '') return [];
    return [...db.files].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);
  }, [db.files, activeRepo, activeTag, searchQuery]);

  const pinnedFiles = useMemo(() => processedFiles.filter(f => db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  
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
  // RENDER UI
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

  const renderCard = (file, isRecent = false) => {
    const tagsList = getFileTags(file.repoName, file.fileName);
    if (isRecent) {
      return (
        <div key={file.sha} className="cms-card p-3 min-w-[240px] max-w-[240px] flex flex-col group hover:border-[var(--accent)] transition cursor-pointer border cms-border" onClick={() => window.open(file.url, '_blank')}>
          <div className="text-[10px] text-muted mb-1 flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-folder"></use></svg>{file.repoName}</div>
          <h4 className="font-bold text-sm line-clamp-2 mb-2 group-hover:text-[var(--accent)] transition">{file.name}</h4>
          <div className="flex justify-between items-center mt-auto border-t cms-border pt-2">
            <span className="text-[10px] opacity-70">{file.fullDate ? file.fullDate.split(' ')[1] || file.fullDate.split(' ')[0] : ''}</span>
            <button className="text-[10px] bg-[var(--bg-hover)] text-[var(--accent)] px-2 py-1 rounded font-bold hover:opacity-80 transition">Sửa</button>
          </div>
        </div>
      );
    }
    return (
      <div key={file.sha} className="cms-card p-4 flex flex-col relative group hover:scale-[1.01] transition border cms-border">
        <div className="pl-2">
          <div className="text-[10px] text-muted flex items-center gap-1 mb-2 font-bold uppercase tracking-wide"><svg className="w-3 h-3"><use href="#icon-folder"></use></svg> {file.repoName}</div>
          <a href={file.url} target="_blank" rel="noreferrer" className="font-bold text-[15px] hover:text-[var(--accent)] mb-2 line-clamp-2">{file.name}</a>
          {tagsList.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tagsList.map(t => <span key={t} className="cms-input text-[10px] px-2 py-0.5 rounded font-bold border cms-border flex items-center gap-1 opacity-90"><svg className="w-2.5 h-2.5 opacity-60"><use href="#icon-tag"></use></svg>{t}</span>)}
            </div>
          )}
          <div className="text-xs text-muted line-clamp-2 mb-4">{file.preview || '...'}</div>
        </div>
        <div className="flex justify-between items-center mt-auto pt-3 border-t cms-border">
          <span className="text-[10px] opacity-60">{file.fullDate}</span>
          <button className="cms-btn px-4 py-1.5 rounded-lg text-xs font-bold transition">Sửa</button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-col w-full min-h-screen fade-in flex bg-[var(--bg-body)]">
      <SVGIcons />
      <header className="cms-glass sticky top-0 z-[60] py-3 px-4 md:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all border-b cms-border shadow-sm">
        <h1 className="text-xl font-bold tracking-tight shrink-0 text-[var(--accent)] hidden sm:block">vietndj</h1>
        <div className="flex-1 w-full max-w-2xl flex items-center gap-2">
          <div className="flex-1 flex items-center bg-[var(--bg-card)] rounded-xl px-4 py-2 w-full border cms-border shadow-sm">
            <svg className="svg-icon text-muted"><use href="#icon-search"></use></svg>
            <input type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Tìm bài viết, repo... (Ctrl K)" className="bg-transparent border-none outline-none text-sm w-full ml-3 font-bold placeholder-[var(--text-muted)]" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => {localStorage.removeItem("cms_auth"); setIsAuthenticated(false)}} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold text-red-500">🔒 Khóa App</button>
        </div>
      </header>

      <div className="sticky top-[60px] lg:top-[68px] z-40 bg-[var(--bg-body)]/95 backdrop-blur-md border-b cms-border py-2 mb-6">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-muted uppercase mr-2">View</span>
              <div className="flex bg-[var(--bg-card)] p-1 rounded-lg border cms-border shadow-sm">
                <button onClick={() => setCurrentView('list')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${currentView === 'list' ? 'bg-[var(--bg-body)] shadow-sm border cms-border text-[var(--text-main)]' : 'text-muted hover:text-[var(--text-main)]'}`}>List</button>
                <button onClick={() => setCurrentView('grid')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${currentView === 'grid' ? 'bg-[var(--bg-body)] shadow-sm border cms-border text-[var(--text-main)]' : 'text-muted hover:text-[var(--text-main)]'}`}>Grid</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-[var(--bg-card)] p-1 rounded-lg border cms-border shadow-sm">
                <button onClick={() => setSortOrder('desc')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${sortOrder === 'desc' ? 'bg-[var(--bg-body)] shadow-sm border cms-border' : 'text-muted'}`}>Mới ↓</button>
                <button onClick={() => setSortOrder('asc')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${sortOrder === 'asc' ? 'bg-[var(--bg-body)] shadow-sm border cms-border' : 'text-muted'}`}>Cũ ↑</button>
              </div>
              <button onClick={loadDatabase} className="cms-btn bg-[var(--bg-card)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--accent)] shadow-sm">{isSyncing ? '⏳...' : '↻ Tải lại'}</button>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-1 scrollbar-hide">
             <span className="text-[10px] font-bold text-muted uppercase shrink-0 mr-2 flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-folder"></use></svg> Kho</span>
             <button onClick={() => setActiveRepo('all')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${activeRepo === 'all' ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border)] hover:bg-[var(--bg-hover)]'}`}>Tất cả</button>
             {Object.keys(db.repos).map(r => (<button key={r} onClick={() => setActiveRepo(r)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${activeRepo === r ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border)] hover:bg-[var(--bg-hover)]'}`}>{r} <span className="opacity-60 font-normal">({db.repos[r].length})</span></button>))}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
             <span className="text-[10px] font-bold text-muted uppercase shrink-0 mr-2 flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-tag"></use></svg> Nhãn</span>
             <button onClick={() => setActiveTag('all')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${activeTag === 'all' ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border)] hover:bg-[var(--bg-hover)]'}`}>Tất cả</button>
             {allUniqueTags.map(t => (<button key={t} onClick={() => setActiveTag(t)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${activeTag === t ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border)] hover:bg-[var(--bg-hover)]'}`}>{t}</button>))}
          </div>
        </div>
      </div>
      
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pb-20">
        
        {/* ========================================= */}
        {/* KHỐI SOẠN THẢO HTML (UX ĐƯỢC TỐI ƯU MỚI)  */}
        {/* ========================================= */}
        <section className="cms-card overflow-hidden mb-8 shadow-sm">
          <button onClick={() => setIsEditorOpen(!isEditorOpen)} className="w-full px-6 py-4 flex justify-between items-center hover:bg-[var(--bg-hover)] font-semibold text-[var(--accent)] outline-none border-b cms-border">
            <span className="flex items-center gap-2"><svg className="svg-icon"><use href="#icon-edit"></use></svg> Soạn thảo HTML</span>
            <span style={{ transform: isEditorOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} className="transition-transform">▼</span>
          </button>

          {isEditorOpen && (
            <div className="p-6 bg-[var(--bg-card)] fade-in flex flex-col gap-5">
              
              {/* 1. CHỌN KHO (Nhấn nhanh dạng nút, nhớ lịch sử) */}
              <div>
                 <label className="block text-[11px] font-bold text-muted mb-2 uppercase">📁 Lưu vào Kho</label>
                 <div className="flex flex-wrap gap-2">
                    {repoKeysList.map(r => {
                       const fullPath = `${username}/${r}`;
                       const isActive = repo === fullPath;
                       return (
                          <button
                             key={r}
                             onClick={() => { setRepo(fullPath); localStorage.setItem('cms_last_repo', fullPath); }}
                             className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border ${isActive ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'bg-[var(--bg-hover)] text-[var(--text-main)] border-transparent hover:opacity-80'}`}
                          >
                             {r}
                          </button>
                       )
                    })}
                 </div>
              </div>

              {/* 2. TIÊU ĐỀ (To, Rõ ràng, Enter để xuống dòng) */}
              <div>
                 <input
                    type="text"
                    value={title}
                    onChange={(e)=>autoSlugify(e.target.value, tags)}
                    onKeyDown={(e) => { 
                        if(e.key === 'Enter') { 
                            e.preventDefault(); 
                            document.getElementById('html-content-editor')?.focus(); 
                        } 
                    }}
                    className="w-full px-4 py-4 text-2xl font-black text-[var(--text-main)] bg-[var(--bg-hover)] border-2 border-transparent focus:border-[var(--accent)] rounded-xl outline-none transition-all placeholder:text-gray-400"
                    placeholder="Nhập tiêu đề bài viết... (Enter để viết nội dung)"
                 />
              </div>

              {/* 3. NHÃN (Bấm nhanh các Tag cũ + Gõ thêm tag mới) */}
              <div className="bg-[var(--bg-hover)] p-4 rounded-xl border border-transparent focus-within:border-[var(--accent)] transition-all">
                 <div className="flex items-center gap-2 mb-2">
                     <svg className="w-4 h-4 text-muted"><use href="#icon-tag"></use></svg>
                     <input
                         type="text"
                         value={tags}
                         onChange={(e)=>{setTags(e.target.value); autoSlugify(title, e.target.value);}}
                         className="flex-1 bg-transparent text-sm font-bold text-[var(--accent)] outline-none placeholder:text-muted placeholder:font-normal"
                         placeholder="Gõ tag mới (cách bằng dấu phẩy)..."
                     />
                 </div>
                 {/* Khung hiển thị Tag có sẵn để bấm */}
                 {allUniqueTags.length > 0 && (
                     <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[var(--border)]">
                        {allUniqueTags.map(t => {
                            const isSelected = tags.split(',').map(x=>x.trim()).includes(t);
                            return (
                                <button
                                   key={t}
                                   onClick={() => toggleTag(t)}
                                   className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition border ${isSelected ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--bg-card)] text-muted border-[var(--border)] hover:opacity-80 shadow-sm'}`}
                                >
                                  {t}
                                </button>
                            )
                        })}
                     </div>
                 )}
              </div>

              {/* 4. NỘI DUNG HTML */}
              <div>
                 <textarea
                    id="html-content-editor"
                    rows="10"
                    value={content}
                    onChange={(e)=>setContent(e.target.value)}
                    className="w-full px-4 py-4 bg-[#1D1D1F] text-[#34C759] border-none rounded-xl focus:ring-2 focus:ring-[var(--accent)] font-mono text-sm leading-relaxed outline-none shadow-inner"
                    placeholder="Nhập mã HTML vào đây..."
                 ></textarea>
              </div>

              {/* 5. CÀI ĐẶT NÂNG CAO (PAT, SLUG) - Đã được gộp vào Menu Accordion ẩn */}
              <details className="group border cms-border rounded-xl bg-[var(--bg-hover)]">
                 <summary className="px-4 py-3 text-xs font-bold text-muted cursor-pointer flex items-center gap-2 outline-none hover:text-[var(--text-main)]">
                    <span className="group-open:rotate-90 transition-transform">▶</span> Cài đặt nâng cao (Token PAT, URL Slug)
                 </summary>
                 <div className="p-4 border-t cms-border grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-bold text-muted mb-1 uppercase">Mã Github PAT</label>
                        <input type="password" value={token} onChange={(e)=>handleSaveToken(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg-card)] border cms-border rounded-lg text-xs outline-none focus:border-[var(--accent)]" placeholder="Nhập Token GitHub..." />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-muted mb-1 uppercase">Slug (URL)</label>
                        <input type="text" value={slug} onChange={(e)=>setSlug(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg-card)] border cms-border rounded-lg text-xs font-mono text-[var(--accent)] outline-none focus:border-[var(--accent)]" placeholder="kien-thuc..." />
                     </div>
                 </div>
              </details>

              {/* 6. NÚT LƯU BÀI */}
              <div className="flex pt-2">
                 <button onClick={handleSaveArticle} disabled={isSaving} className="cms-btn-primary w-full md:w-auto px-10 py-4 rounded-xl shadow-lg text-sm disabled:opacity-50 hover:scale-[1.02] transition-transform">
                    {isSaving ? '⏳ Đang lưu...' : '🚀 Lưu Bài Lên GitHub'}
                 </button>
              </div>
            </div>
          )}
        </section>
        {/* ========================================= */}

        {recentFiles.length > 0 && (
          <details open className="mb-8">
            <summary className="font-bold text-lg mb-3 cursor-pointer outline-none flex items-center gap-2 text-[var(--accent)]"><svg className="w-5 h-5"><use href="#icon-timer"></use></svg> Vừa thao tác gần đây</summary>
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">{recentFiles.map(f => renderCard(f, true))}</div>
          </details>
        )}
        {pinnedFiles.length > 0 && (
          <details open className="mb-6">
            <summary className="font-bold text-xl mb-4 border-b cms-border pb-2 cursor-pointer outline-none text-[#FF9500] flex items-center gap-2"><svg className="w-6 h-6"><use href="#icon-pin-filled"></use></svg> 📌 Đã ghim <span className="cms-input text-xs px-2 py-0.5 rounded-full border cms-border text-[var(--text-main)]">{pinnedFiles.length}</span></summary>
            <div className={currentView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'}>{pinnedFiles.map(f => renderCard(f, false))}</div>
          </details>
        )}
        {Object.keys(groupedFiles).length > 0 ? (
          Object.keys(groupedFiles).map(repoName => (
            <details key={repoName} open className="mb-8">
              <summary className="font-bold text-xl mb-4 border-b cms-border pb-2 cursor-pointer outline-none flex items-center gap-2"><svg className="w-6 h-6"><use href="#icon-folder"></use></svg> {repoName} <span className="cms-input text-xs px-2 py-0.5 rounded-full border cms-border text-muted">{groupedFiles[repoName].length}</span></summary>
              <div className={currentView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'}>{groupedFiles[repoName].map(f => renderCard(f, false))}</div>
            </details>
          ))
        ) : (<div className="text-center py-20 text-muted font-bold text-sm">Không tìm thấy bài viết nào phù hợp.</div>)}
      </main>
      
      {status.text && (<div className="fixed bottom-6 left-6 z-[9999] cms-card px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold border-l-4 border-l-[var(--accent)] fade-in bg-[var(--bg-card)]">{status.text}</div>)}
    </div>
  );
}