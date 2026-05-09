import React, { useState, useEffect, useMemo, useRef } from 'react';

// ==========================================
// 1. TIỆN ÍCH GITHUB API & CORE LOGIC
// ==========================================
const username = 'vietndj';
const SECRET_PIN = "0070";
const safeEnc = (fn) => { try { fn = decodeURIComponent(fn); } catch(e){} return encodeURIComponent(fn); };
const encodeBase64UTF8Async = async (str) => { const bytes = new TextEncoder().encode(str); let binary = ''; for (let i = 0; i < bytes.byteLength; i += 16384) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 16384)); return btoa(binary); };
const getHeaders = (token) => token ? { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' } : { 'Accept': 'application/vnd.github.v3+json' };
const getContrastYIQ = hex => { if(!hex)return '#1D1D1F'; hex=hex.replace("#",""); const yiq=((parseInt(hex.substr(0,2),16)*299)+(parseInt(hex.substr(2,2),16)*587)+(parseInt(hex.substr(4,2),16)*114))/1000; return (yiq>=128)?'#1D1D1F':'#FFFFFF'; };

const fetchRawJSON = async (repoPath, file, token) => {
  try { const res = await fetch(`https://api.github.com/repos/${repoPath}/contents/${safeEnc(file)}?t=${Date.now()}`, { headers: { ...getHeaders(token), 'Accept': 'application/vnd.github.v3.raw' } }); if (res.ok) return await res.json(); } catch(e) {}
  try { const r2 = await fetch(`https://${repoPath.split('/')[0]}.github.io/${file}?t=${Date.now()}`); if(r2.ok) return await r2.json(); } catch(e){} return null;
};
const fetchText = async (url, token) => { try { const res = await fetch(url, { headers: { ...getHeaders(token), 'Accept': 'application/vnd.github.v3.raw' }}); return res.ok ? await res.text() : null; } catch(e) { return null; } };
const getFileShaSafe = async (repoPath, file, token) => { 
  try { let d = await fetch(`https://api.github.com/repos/${repoPath}/contents/${safeEnc(file)}?t=${Date.now()}`, { headers: getHeaders(token) }).then(r => r.ok ? r.json() : null); if(d && !Array.isArray(d)) return d.sha; 
  let d2 = await fetch(`https://api.github.com/repos/${repoPath}/contents/?t=${Date.now()}`, { headers: getHeaders(token) }).then(r => r.ok ? r.json() : null); if(d2 && Array.isArray(d2)) { const f = d2.find(x => x.name === file); if(f) return f.sha; } return null; } catch(e) { return null; }
};

// ==========================================
// 2. COMPONENT SVG
// ==========================================
const SVGIcons = () => (
  <svg style={{ display: 'none' }}>
    <symbol id="icon-tag" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></symbol>
    <symbol id="icon-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></symbol>
    <symbol id="icon-folder" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></symbol>
    <symbol id="icon-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></symbol>
    <symbol id="icon-palette" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></symbol>
    <symbol id="icon-pin" viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></symbol>
    <symbol id="icon-pin-filled" viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22" stroke="currentColor"></line><path fill="currentColor" stroke="none" d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></symbol>
  </svg>
);

// ==========================================
// 3. MAIN APP
// ==========================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [token, setToken] = useState('');
  
  const [db, setDb] = useState({ files: [], repos: {}, tags: {}, pinned: [], links: {}, colors: {}, titles: {}, tasks: [], customCol: [] });
  const [status, setStatus] = useState({ text: '', type: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRepo, setActiveRepo] = useState('all');
  const [activeTag, setActiveTag] = useState('all');
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [nativeTaskInput, setNativeTaskInput] = useState('');

  // EXPORT AI & COLOR
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState('all');
  const [exportResult, setExportResult] = useState(null);
  const [activeModal, setActiveModal] = useState({ type: null, data: null });

  // EDITOR STATES
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [repo, setRepo] = useState(() => localStorage.getItem('cms_last_repo') || `${username}/${username}.github.io`);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tags, setTags] = useState(() => localStorage.getItem('cms_last_tags') || ''); 
  const [content, setContent] = useState('');
  const [editorOriginal, setEditorOriginal] = useState({ repo: '', filename: '', sha: '' });

  const toolsMenuRef = useRef(null);
  const editorInputRef = useRef(null);

  // Phím tắt & Focus
  useEffect(() => {
    if (isEditorOpen && editorInputRef.current) setTimeout(() => editorInputRef.current.focus(), 150);
    const handleKeys = (e) => {
        const isCmd = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? e.metaKey : e.ctrlKey;
        if (isCmd && e.key.toLowerCase() === 'e') { e.preventDefault(); setIsEditorOpen(prev => !prev); }
        if (isCmd && e.key.toLowerCase() === 's') { e.preventDefault(); document.getElementById('btn-save-article')?.click(); }
    };
    window.addEventListener('keydown', handleKeys); return () => window.removeEventListener('keydown', handleKeys);
  }, [isEditorOpen]);

  useEffect(() => {
    if (localStorage.getItem("cms_auth") === "granted") setIsAuthenticated(true);
    const savedToken = localStorage.getItem('github_pat'); if (savedToken) setToken(savedToken);
    try { const localDb = JSON.parse(localStorage.getItem('cms_repo_data')); if (localDb && localDb.files) setDb(localDb); } catch(e){}
  }, []);

  useEffect(() => { if (isAuthenticated && token && db.files.length === 0) loadDatabase(); }, [isAuthenticated, token]);

  // --- HÀM LÕI ---
  const loadDatabase = async () => {
    if (!token || isSyncing) return;
    setIsSyncing(true); setStatus({ text: 'Đang tải DB...', type: 'loading' });
    try {
      const meta = await fetchRawJSON(`${username}/${username}.github.io`, 'metadata.json', token);
      const dbData = await fetchRawJSON(`${username}/${username}.github.io`, 'cms_db.json', token);
      if (dbData && dbData.allFiles) {
        const reposMap = {}; dbData.allFiles.forEach(f => { if(!reposMap[f.repoName]) reposMap[f.repoName] = []; reposMap[f.repoName].push(f); });
        saveLocalDb({ files: dbData.allFiles, repos: reposMap, tags: meta?.tags || {}, pinned: meta?.pinned || [], links: meta?.links || {}, colors: meta?.colors || {}, titles: meta?.titles || {}, tasks: meta?.tasks || [], customCol: meta?.customCol || [] });
        setStatus({ text: '✅ Đã đồng bộ!', type: 'success' }); setTimeout(() => setStatus({ text: '', type: '' }), 3000);
      }
    } catch (e) { setStatus({ text: '❌ Lỗi DB', type: 'error' }); } finally { setIsSyncing(false); }
  };

  const syncAll = async (newState) => {
      saveLocalDb(newState);
      await syncMetaAndDB(newState);
  };

  const handleSetColor = async (fileKey, color) => {
      const newColors = { ...db.colors, [fileKey]: color };
      const newState = { ...db, colors: newColors };
      setDb(newState);
      await syncAll(newState);
      setActiveModal({ type: null, data: null });
  };

  const handleExportAI = async () => {
      if (!token) return alert("Cần PAT!");
      setStatus({ text: "Đang đóng gói sách...", type: "loading" });
      try {
          let targets = db.files.filter(f => (exportTarget === 'all' || f.repoName === exportTarget) && !['index.html', 'tin.html', 'cms_db.json', 'metadata.json'].includes(f.fileName));
          let ct = `SIÊU SÁCH: ${username.toUpperCase()}\n\n`;
          for (let i = 0; i < targets.length; i++) {
              const f = targets[i];
              setStatus({ text: `Đang nạp (${i+1}/${targets.length}): ${f.name}`, type: "loading" });
              const rC = await fetchText(`https://api.github.com/repos/${username}/${f.repoName}/contents/${safeEnc(f.fileName)}?t=${Date.now()}`, token);
              if (rC) {
                  const d = new DOMParser().parseFromString(rC, 'text/html');
                  d.querySelectorAll('script,style,button,nav').forEach(x => x.remove());
                  ct += `BÀI: ${db.titles[`${f.repoName}/${f.fileName}`] || f.name}\n${d.body.innerText.trim()}\n\n---\n\n`;
              }
              await new Promise(r => setTimeout(r, 30));
          }
          const blob = new Blob([ct], { type: 'text/plain;charset=utf-8' });
          setExportResult({ url: URL.createObjectURL(blob), filename: `book_${exportTarget}_${Date.now()}.txt`, count: targets.length });
          setStatus({ text: "✅ Xong!", type: "success" });
      } catch (e) { setStatus({ text: "❌ Lỗi xuất file", type: "error" }); }
  };

  const autoSlugify = (val, currentTags) => {
    setTitle(val);
    let s = val.toLowerCase().replace(/[áàảạãăắằẳẵặâấầẩẫậ]/gi,'a').replace(/[éèẻẽẹêếềểễệ]/gi,'e').replace(/[iíìỉĩị]/gi,'i').replace(/[óòỏõọôốồổỗộơớờởỡợ]/gi,'o').replace(/[úùủũụưứừửữự]/gi,'u').replace(/[ýỳỷỹỵ]/gi,'y').replace(/đ/gi,'d').replace(/\s+/g,'-').replace(/[^\w\-]+/g,'').replace(/\-\-+/g,'-').replace(/^-+|-+$/g,'');
    let tagArr = currentTags.split(',').map(x=>x.trim()).filter(Boolean);
    if(tagArr.length && s) { let ts = tagArr.join('-').toLowerCase().replace(/\s+/g,'-'); if(!s.includes(ts)) s += '-' + ts; }
    setSlug(s);
  };

  const handleContentChange = (e) => {
    const val = e.target.value; setContent(val);
    if (!title.trim() && val.includes('<title>')) {
        const match = val.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (match && match[1]) autoSlugify(match[1].trim(), tags);
    }
  };

  const handleSaveArticle = async () => {
    if (!token || !repo || !title || !slug || !content) return alert("Thiếu dữ liệu!");
    setIsSaving(true); setStatus({ text: '⏳ Đang lưu...', type: 'loading' });
    try {
      let filename = slug.endsWith('.html') ? slug : slug + '.html';
      let rName = repo.includes('/') ? repo.split('/')[1] : repo;
      let fileKey = `${rName}/${filename}`;
      let fileSha = await getFileShaSafe(`${username}/${rName}`, filename, token);
      const resHTML = await fetch(`https://api.github.com/repos/${username}/${rName}/contents/${safeEnc(filename)}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Save: ${title}`, content: await encodeBase64UTF8Async(content), sha: fileSha || undefined }) });
      if (!resHTML.ok) throw new Error();
      const resHTMLData = await resHTML.json();
      
      let newTags = { ...db.tags }; let tagArr = tags.split(',').map(x => x.trim()).filter(Boolean);
      if (tagArr.length) newTags[fileKey] = tagArr; else delete newTags[fileKey];
      let newTitles = { ...db.titles }; newTitles[fileKey] = title;
      let newFiles = [...db.files].filter(f => f.sha !== (resHTMLData.content?.sha || fileSha));
      const dDate = new Date();
      newFiles.unshift({ repoName: rName, name: title, fileName: filename, sha: resHTMLData.content?.sha, url: `https://${username}.github.io/${rName === `${username}.github.io` ? '' : rName + '/'}${filename}`, timestamp: dDate.getTime(), fullDate: dDate.toLocaleString('vi-VN') });
      
      const newState = { ...db, files: newFiles, tags: newTags, titles: newTitles };
      await syncAll(newState);
      localStorage.setItem('cms_last_repo', `${username}/${rName}`);
      localStorage.setItem('cms_last_tags', tags);
      setTitle(''); setSlug(''); setContent(''); setStatus({ text: '✅ Thành công!', type: 'success' });
      setTimeout(() => setStatus({ text: '', type: '' }), 3000);
    } catch (e) { setStatus({ text: '❌ Lỗi lưu bài', type: 'error' }); } finally { setIsSaving(false); }
  };

  // --- SẮP XẾP DỮ LIỆU ---
  const allUniqueTags = useMemo(() => { const s = new Set(); Object.values(db.tags).forEach(a => a.forEach(t => s.add(t))); return Array.from(s).sort(); }, [db.tags]);
  const processedFiles = useMemo(() => {
    let f = db.files.filter(f => (activeRepo === 'all' || f.repoName === activeRepo) && (activeTag === 'all' || (db.tags[`${f.repoName}/${f.fileName}`] || []).includes(activeTag)) && (!searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())));
    return f.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [db.files, activeRepo, activeTag, searchQuery, db.tags]);

  const recentFiles = useMemo(() => (activeTag==='all' && activeRepo==='all' && !searchQuery) ? [...db.files].sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)).slice(0, 8) : [], [db.files, activeRepo, activeTag, searchQuery]);
  const pinnedFiles = useMemo(() => processedFiles.filter(f => db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  const groupedFilesByRepo = useMemo(() => { 
    const groups = {}; 
    processedFiles.filter(f => !db.pinned.includes(`${f.repoName}/${f.fileName}`)).forEach(f => { if (!groups[f.repoName]) groups[f.repoName] = []; groups[f.repoName].push(f); }); 
    return Object.keys(groups).sort((a, b) => Math.max(...groups[b].map(x=>x.timestamp||0)) - Math.max(...groups[a].map(x=>x.timestamp||0))).reduce((acc, r) => ({...acc, [r]: groups[r]}), {});
  }, [processedFiles, db.pinned]);

  // --- RENDER CARD (SIÊU PHẲNG - CHẶT CHẼ) ---
  const renderCard = (file) => {
    const isP = db.pinned.includes(`${file.repoName}/${file.fileName}`);
    const col = db.colors[`${file.repoName}/${file.fileName}`];
    const isDark = col && getContrastYIQ(col) === '#FFFFFF';
    const tagsList = db.tags[`${file.repoName}/${file.fileName}`] || [];

    return (
      <div key={file.sha} className="cms-card p-3 flex flex-col border cms-border transition bg-[var(--bg-card)] group" style={col ? {backgroundColor: col, color: isDark?'#FFF':'#1D1D1F', borderColor:'transparent'} : {}}>
        <a href={file.url} target="_blank" rel="noreferrer" className="font-bold text-[15px] leading-tight mb-2 line-clamp-2 hover:underline">{file.name}</a>
        
        <div className="flex justify-between items-center mt-auto pt-2 border-t border-black/5 dark:border-white/5">
          <div className="flex flex-wrap items-center gap-2 opacity-60 overflow-hidden">
            <span className="text-[9px] font-mono shrink-0">{file.fullDate?.split(' ')[0]}</span>
            <span className="text-[9px] font-black uppercase tracking-tighter shrink-0 flex items-center gap-0.5"><svg className="w-2 h-2"><use href="#icon-folder"></use></svg>{file.repoName}</span>
            <div className="flex gap-1">
              {tagsList.map(t => <span key={t} className="text-[8px] px-1 bg-black/5 rounded uppercase font-bold">#{t}</span>)}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={(e)=>{e.stopPropagation(); togglePin(file.repoName, file.fileName);}} className={isP ? 'text-[#FF9500] opacity-100' : 'opacity-30'}><svg className="w-3.5 h-3.5"><use href={isP ? "#icon-pin-filled" : "#icon-pin"}></use></svg></button>
            <button onClick={(e)=>{e.stopPropagation(); setActiveModal({type: 'color', data: file});}} className="opacity-30 hover:opacity-100"><svg className="w-3.5 h-3.5"><use href="#icon-palette"></use></svg></button>
            <button onClick={(e)=>{e.stopPropagation(); editFileContent(file.repoName, file.fileName, file.sha);}} className="text-[10px] font-black uppercase opacity-40 group-hover:opacity-100 hover:text-[var(--accent)] transition">Sửa</button>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) return ( <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[var(--bg-body)]"><div className="cms-card p-10 max-w-sm w-full mx-4 text-center border cms-border"><h2 className="text-2xl font-bold mb-6">Workspace</h2><input type="password" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-center text-3xl font-bold px-4 py-4 cms-input rounded-2xl mb-6 border cms-border" /><button onClick={handleLogin} className="w-full py-4 cms-btn-primary rounded-xl">Mở Khóa</button></div></div> );

  return (
    <div className="flex-col w-full min-h-screen fade-in flex bg-[var(--bg-body)]">
      <SVGIcons />
      <header className="bg-[var(--bg-card)] border-b cms-border pt-4 pb-3 px-4 md:px-8 flex flex-col md:flex-row items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--accent)]">vietndj</h1>
        <div className="flex-1 flex w-full items-center bg-[var(--bg-hover)] rounded-xl px-4 py-2"><svg className="svg-icon text-muted"><use href="#icon-search"></use></svg><input id="search-input-main" type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Tìm kiếm... (Ctrl K)" className="bg-transparent border-none outline-none text-sm w-full ml-3 font-bold" /></div>
        <div className="flex items-center gap-2 relative" ref={toolsMenuRef}>
          <button onClick={loadDatabase} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold transition">↻ Tải DB</button>
          <button onClick={()=>setIsTasksOpen(!isTasksOpen)} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold transition">📝 Việc</button>
          <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold transition">Công cụ ▾</button>
          {isToolsOpen && ( <div className="absolute right-0 top-full mt-2 w-56 cms-card shadow-2xl flex flex-col p-2 z-[100] border cms-border bg-white dark:bg-gray-900"><button onClick={() => changeTheme('light')} className="text-left px-3 py-2 text-xs font-bold hover:bg-gray-100 rounded">☀️ Sáng</button><button onClick={() => changeTheme('dark')} className="text-left px-3 py-2 text-xs font-bold hover:bg-gray-100 rounded">🌙 Tối</button><button onClick={() => { setIsExportModalOpen(true); setIsToolsOpen(false); }} className="text-left px-3 py-2 text-xs font-bold text-[#8E44AD] hover:bg-gray-100 rounded">🤖 Xuất Sách AI</button><hr className="my-1"/><button onClick={() => {localStorage.removeItem("cms_auth"); setIsAuthenticated(false);}} className="text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded">🔒 Khóa App</button></div> )}
        </div>
      </header>

      <nav className="bg-[var(--bg-body)] border-b cms-border py-2 px-4 md:px-8 sticky top-0 z-40 flex flex-col gap-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="text-[9px] font-bold text-muted uppercase">KHO</span>{repoKeysList.map(r => <button key={r} onClick={() => setActiveRepo(activeRepo===r?'all':r)} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${activeRepo===r?'bg-[var(--accent)] text-white':'bg-[var(--bg-hover)]'}`}>{r}</button>)}</div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="text-[9px] font-bold text-muted uppercase">TAG</span>{allUniqueTags.slice(0, 15).map(t => <button key={t} onClick={() => setActiveTag(activeTag===t?'all':t)} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${activeTag===t?'bg-[var(--accent)] text-white':'bg-[var(--bg-hover)]'}`}>{t}</button>)}</div>
      </nav>
      
      <main className="flex-1 px-4 md:px-8 py-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        {/* EDITOR TỐI ƯU */}
        <section className="cms-card overflow-hidden border cms-border">
          <button onClick={() => setIsEditorOpen(!isEditorOpen)} className="w-full px-6 py-3 flex justify-between items-center hover:bg-[var(--bg-hover)] font-bold text-[var(--accent)]"><span>✍️ SOẠN THẢO <small className="ml-2 opacity-50 font-mono">Ctrl E</small></span><span>{isEditorOpen?'▲':'▼'}</span></button>
          {isEditorOpen && (
            <div className="p-5 flex flex-col gap-4 border-t cms-border">
              <div className="flex flex-wrap gap-2">{repoKeysList.map(r => <button key={r} onClick={() => setRepo(`${username}/${r}`)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border ${repo===`${username}/${r}`?'bg-[var(--accent)] text-white':'bg-[var(--bg-hover)]'}`}>{r}</button>)}</div>
              <textarea ref={editorInputRef} rows="12" value={content} onChange={handleContentChange} className="w-full p-4 bg-[#1D1D1F] text-[#34C759] rounded-xl font-mono text-sm outline-none" placeholder="Ctrl + E -> Paste HTML -> Ctrl + S. Tiêu đề tự bóc từ thẻ <title>..."></textarea>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" value={title} onChange={(e)=>setTitle(e.target.value)} className="px-4 py-2 bg-[var(--bg-hover)] rounded-lg text-sm font-bold" placeholder="Tiêu đề..." /><input type="text" value={tags} onChange={(e)=>setTags(e.target.value)} className="px-4 py-2 bg-[var(--bg-hover)] rounded-lg text-sm font-bold text-[var(--accent)]" placeholder="Nhãn (cách bằng dấu phẩy)..." /></div>
              <div className="flex justify-between items-center pt-2"><button id="btn-save-article" onClick={handleSaveArticle} disabled={isSaving} className="cms-btn-primary px-10 py-3 rounded-xl font-bold shadow-lg">{isSaving?'⏳...':'🚀 LƯU BÀI (Ctrl S)'}</button>{editorOriginal.sha && <button onClick={()=>setEditorOriginal({repo:'',filename:'',sha:''})} className="text-red-500 text-xs font-bold">HỦY SỬA</button>}</div>
            </div>
          )}
        </section>

        {recentFiles.length > 0 && <div className="mb-2"><h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-3 ml-1">🔥 Gần đây</h3><div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">{recentFiles.map(f => renderCard(file, true))}</div></div>}

        {pinnedFiles.length > 0 && <section>
            <h3 className="text-[10px] font-black text-[#FF9500] uppercase tracking-widest mb-3 ml-1">📌 Đã ghim</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{pinnedFiles.map(f => renderCard(f))}</div>
        </section>}

        {Object.keys(groupedFilesByRepo).map(r => (
            <section key={r} className="mb-4">
                <h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-3 ml-1 flex items-center gap-2"><svg className="w-3 h-3"><use href="#icon-folder"></use></svg> {r} <span className="opacity-40">{groupedFilesByRepo[r].length}</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{groupedFilesByRepo[r].map(f => renderCard(f))}</div>
            </section>
        ))}
      </main>

      {/* MODAL MÀU SẮC */}
      {activeModal.type === 'color' && (
        <div className="fixed inset-0 bg-black/60 z-[999999] flex items-center justify-center p-4" onClick={()=>setActiveModal({type:null,data:null})}>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-xs shadow-2xl" onClick={e=>e.stopPropagation()}>
                <h4 className="font-bold mb-4">Chọn màu thẻ</h4>
                <div className="grid grid-cols-5 gap-3">
                    {[null, '#F2F2F7', '#FFE58F', '#D9F7BE', '#BAE7FF', '#EFDBFF', '#FFD8BF', '#FFCCC7', '#1D1D1F', '#B85042'].map(c => (
                        <button key={c} onClick={()=>handleSetColor(`${activeModal.data.repoName}/${activeModal.data.fileName}`, c)} className="w-10 h-10 rounded-full border cms-border shadow-inner" style={{backgroundColor: c || 'white'}}></button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* MODAL XUẤT SÁCH AI (FIXED) */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999999] flex items-center justify-center p-4" onClick={()=>{setIsExportModalOpen(false); setExportResult(null);}}>
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl w-full max-w-sm shadow-2xl border cms-border" onClick={e=>e.stopPropagation()}>
            <h3 className="text-xl font-black mb-2 text-[var(--text-main)]">🤖 XUẤT SÁCH AI</h3>
            {!exportResult ? (
                <>
                  <p className="text-xs text-muted mb-6">Gom tất cả nội dung thành file .txt sạch để nạp NotebookLM.</p>
                  <select value={exportTarget} onChange={(e)=>setExportTarget(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold mb-6 outline-none">
                      <option value="all">📚 Tất cả các Kho</option>
                      {repoKeysList.map(r => <option key={r} value={r}>📁 Kho: {r}</option>)}
                  </select>
                  <button onClick={handleExportAI} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition">BẮT ĐẦU ĐÓNG GÓI</button>
                </>
            ) : (
                <div className="text-center py-4">
                    <div className="text-5xl mb-4 text-green-500">✅</div>
                    <h4 className="font-bold text-lg mb-6">Đã xử lý {exportResult.count} bài viết!</h4>
                    <a href={exportResult.url} download={exportResult.filename} className="block w-full py-4 bg-green-500 text-white rounded-2xl font-bold shadow-xl animate-bounce">TẢI FILE SÁCH (.TXT)</a>
                </div>
            )}
          </div>
        </div>
      )}

      {status.text && <div className="fixed bottom-6 left-6 z-[9999] bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl border-l-4 border-[var(--accent)] font-bold text-xs fade-in">{status.text}</div>}
    </div>
  );
}
