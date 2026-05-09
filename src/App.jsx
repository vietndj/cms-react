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
const getGradient = (str) => { const colors = ['from-blue-500 to-indigo-500', 'from-emerald-400 to-teal-500', 'from-amber-400 to-orange-500', 'from-rose-400 to-red-500', 'from-fuchsia-500 to-purple-600', 'from-cyan-400 to-blue-500', 'from-violet-500 to-fuchsia-500', 'from-lime-400 to-emerald-500', 'from-pink-400 to-rose-500']; let hash = 0; if (str) { for(let i=0; i<str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash); } return colors[Math.abs(hash) % colors.length]; };

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
    <symbol id="icon-link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></symbol>
    <symbol id="icon-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></symbol>
    <symbol id="icon-folder" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></symbol>
    <symbol id="icon-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></symbol>
    <symbol id="icon-timer" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></symbol>
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
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [currentView, setCurrentView] = useState('list');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeRepo, setActiveRepo] = useState('all');
  const [activeTag, setActiveTag] = useState('all');
  const [tableSort, setTableSort] = useState({ by: 'date', dir: 'desc' });
  
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [nativeTaskInput, setNativeTaskInput] = useState('');

  // POMODORO & EXPORT
  const [isPomoOpen, setIsPomoOpen] = useState(false);
  const [pomoTime, setPomoTime] = useState(1500); 
  const [isPomoActive, setIsPomoActive] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState('all');
  const [exportResult, setExportResult] = useState(null);

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
  const editorInputRef = useRef(null); // Focus vào mã HTML

  // Tự động focus vào ô NHẬP HTML khi bật Editor (Yêu cầu mới)
  useEffect(() => {
    if (isEditorOpen && editorInputRef.current) {
        setTimeout(() => editorInputRef.current.focus(), 150);
    }
  }, [isEditorOpen]);

  // Thiết lập Phím Tắt Toàn Cầu
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
        const isCmd = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? e.metaKey : e.ctrlKey;
        if (isCmd && e.key.toLowerCase() === 'e') {
            e.preventDefault(); setIsEditorOpen(prev => !prev);
        }
        if (isCmd && e.key.toLowerCase() === 's') {
            e.preventDefault(); const btnSave = document.getElementById('btn-save-article'); if (btnSave && !btnSave.disabled) btnSave.click();
        }
    };
    window.addEventListener('keydown', handleGlobalKeyDown); return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => { if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target)) setIsToolsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("cms_auth") === "granted") setIsAuthenticated(true);
    const savedToken = localStorage.getItem('github_pat'); if (savedToken) setToken(savedToken);
    try { const localDb = JSON.parse(localStorage.getItem('cms_repo_data')); if (localDb && localDb.files) setDb(localDb); } catch(e){}
  }, []);

  useEffect(() => { if (isAuthenticated && token && db.files.length === 0) loadDatabase(); }, [isAuthenticated, token]);

  const handleLogin = () => { if (pin.trim() === SECRET_PIN) { localStorage.setItem("cms_auth", "granted"); setIsAuthenticated(true); } else alert("Mã PIN sai."); };
  const handleSaveToken = (val) => { setToken(val); try { localStorage.setItem('github_pat', val); } catch(err){} };
  const changeTheme = (theme) => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('cms_theme', theme); setIsToolsOpen(false); };
  const saveLocalDb = (newDb) => { try { localStorage.setItem('cms_repo_data', JSON.stringify(newDb)); setDb(newDb); } catch(e) { setDb(newDb); } };

  // ==========================================
  // CORE FUNCTIONS
  // ==========================================
  const loadDatabase = async () => {
    if (!token || isSyncing) return;
    setIsSyncing(true); setStatus({ text: 'Đang tải Database...', type: 'loading' });
    try {
      const meta = await fetchRawJSON(`${username}/${username}.github.io`, 'metadata.json', token);
      const dbData = await fetchRawJSON(`${username}/${username}.github.io`, 'cms_db.json', token);
      if (dbData && dbData.allFiles) {
        const reposMap = {}; dbData.allFiles.forEach(f => { if(!reposMap[f.repoName]) reposMap[f.repoName] = []; reposMap[f.repoName].push(f); });
        saveLocalDb({ files: dbData.allFiles, repos: reposMap, tags: meta?.tags || {}, pinned: meta?.pinned || [], links: meta?.links || {}, colors: meta?.colors || {}, titles: meta?.titles || {}, tasks: meta?.tasks || [], customCol: meta?.customCol || [] });
        setStatus({ text: '✅ Đã đồng bộ!', type: 'success' }); setTimeout(() => setStatus({ text: '', type: '' }), 3000);
      }
    } catch (e) { setStatus({ text: `❌ Lỗi: ${e.message}`, type: 'error' }); } finally { setIsSyncing(false); }
  };

  const syncMetaAndDB = async (dbState) => {
      const metaContent = await encodeBase64UTF8Async(JSON.stringify({ _version: 8, tags: dbState.tags, links: dbState.links, tasks: dbState.tasks, pinned: dbState.pinned, colors: dbState.colors, customCol: dbState.customCol, titles: dbState.titles }, null, 2));
      const metaSha = await getFileShaSafe(`${username}/${username}.github.io`, 'metadata.json', token);
      await fetch(`https://api.github.com/repos/${username}/${username}.github.io/contents/metadata.json`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Sync Meta', content: metaContent, sha: metaSha || undefined }) });

      const dbContent = await encodeBase64UTF8Async(JSON.stringify({ allFiles: dbState.files }));
      const dbSha = await getFileShaSafe(`${username}/${username}.github.io`, 'cms_db.json', token);
      await fetch(`https://api.github.com/repos/${username}/${username}.github.io/contents/cms_db.json`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Sync DB', content: dbContent, sha: dbSha || undefined }) });
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
        if (match && match[1]) { const extractedTitle = match[1].trim(); if (extractedTitle) autoSlugify(extractedTitle, tags); }
    }
  };

  const handleSaveArticle = async () => {
    if (!token) return alert("Cần Token PAT!");
    if (!repo || !title || !slug || !content) return alert("Thiếu dữ liệu!");
    setIsSaving(true); setStatus({ text: '⏳ Đang lưu...', type: 'loading' });
    try {
      let filename = slug.endsWith('.html') ? slug : slug + '.html';
      let rName = repo.includes('/') ? (repo.split('/')[1] || repo.split('/')[0]) : repo;
      let rOwner = repo.includes('/') ? repo.split('/')[0] : username;
      let fileKey = `${rName}/${filename}`;

      const encodedContent = await encodeBase64UTF8Async(content);
      let fileSha = await getFileShaSafe(`${rOwner}/${rName}`, filename, token);

      const resHTML = await fetch(`https://api.github.com/repos/${rOwner}/${rName}/contents/${safeEnc(filename)}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Tạo/Sửa: ${title}`, content: encodedContent, sha: fileSha || undefined }) });
      if (!resHTML.ok) throw new Error("Lỗi khi ghi HTML");
      const resHTMLData = await resHTML.json();

      if (editorOriginal.filename && (editorOriginal.filename !== filename || editorOriginal.repo !== `${rOwner}/${rName}`) && editorOriginal.sha) {
        await fetch(`https://api.github.com/repos/${editorOriginal.repo}/contents/${safeEnc(editorOriginal.filename)}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Xóa file cũ`, sha: editorOriginal.sha }) });
        const oldKey = `${editorOriginal.repo.split('/')[1]||editorOriginal.repo.split('/')[0]}/${editorOriginal.filename}`;
        delete db.tags[oldKey]; delete db.links[oldKey]; delete db.colors[oldKey]; delete db.titles[oldKey];
        db.pinned = db.pinned.filter(x => x !== oldKey);
      }

      let newTags = { ...db.tags }; let tagArr = tags.split(',').map(x => x.trim()).filter(Boolean);
      if (tagArr.length) newTags[fileKey] = tagArr; else delete newTags[fileKey];
      let newTitles = { ...db.titles }; newTitles[fileKey] = title;
      
      let newFiles = [...db.files];
      if (editorOriginal.sha) newFiles = newFiles.filter(x => x.sha !== editorOriginal.sha);
      let fileIndex = newFiles.findIndex(f => f.sha === (resHTMLData.content?.sha || fileSha));
      const dDate = new Date();
      const newFileObj = { repoName: rName, name: title, fileName: filename, sha: resHTMLData.content?.sha || fileSha, url: `https://${rOwner}.github.io/${rName === `${rOwner}.github.io` ? '' : rName + '/'}${filename}`, timestamp: dDate.getTime(), fullDate: dDate.toLocaleString('vi-VN') };
      if (fileIndex !== -1) newFiles[fileIndex] = newFileObj; else newFiles.unshift(newFileObj);

      const newDbState = { ...db, files: newFiles, tags: newTags, titles: newTitles };
      await syncMetaAndDB(newDbState); saveLocalDb(newDbState);
      
      localStorage.setItem('cms_last_repo', `${rOwner}/${rName}`);
      localStorage.setItem('cms_last_tags', tags);

      setStatus({ text: '✅ Đăng thành công!', type: 'success' });
      setTitle(''); setSlug(''); setContent(''); setEditorOriginal({ repo:'', filename:'', sha:'' });
      setTimeout(() => setStatus({ text: '', type: '' }), 3000);
    } catch (error) { setStatus({ text: `❌ Lỗi: ${error.message}`, type: 'error' }); } finally { setIsSaving(false); }
  };

  const repoKeysList = useMemo(() => { const keys = Object.keys(db.repos || {}); if (!keys.includes(`${username}.github.io`)) keys.unshift(`${username}.github.io`); return keys; }, [db.repos]);
  const allUniqueTags = useMemo(() => { const tagsSet = new Set(); Object.values(db.tags).forEach(arr => arr.forEach(t => tagsSet.add(t))); return Array.from(tagsSet).sort(); }, [db.tags]);
  const getFileTags = (r, f) => db.tags[`${r}/${f}`] || [];

  const processedFiles = useMemo(() => {
    let filtered = db.files.filter(f => {
      const matchRepo = activeRepo === 'all' || f.repoName === activeRepo;
      const matchTag = activeTag === 'all' || getFileTags(f.repoName, f.fileName).includes(activeTag);
      const sq = searchQuery.toLowerCase();
      const matchSearch = !sq || (f.name || "").toLowerCase().includes(sq) || (f.repoName || "").toLowerCase().includes(sq);
      return matchRepo && matchTag && matchSearch;
    });
    filtered.sort((a, b) => sortOrder === 'desc' ? (b.timestamp || 0) - (a.timestamp || 0) : (a.timestamp || 0) - (b.timestamp || 0));
    return filtered;
  }, [db.files, activeRepo, activeTag, searchQuery, sortOrder, db.tags]);

  // ==========================================
  // RENDER CARD (TỐI ƯU CHI TIẾT THEO YÊU CẦU)
  // ==========================================
  const renderCard = (file) => {
    const isPinned = db.pinned.includes(`${file.repoName}/${file.fileName}`);
    const col = db.colors[`${file.repoName}/${file.fileName}`];
    const isDark = col && getContrastYIQ(col) === '#FFFFFF';
    const stl = col ? { backgroundColor: col, borderColor: 'transparent', color: isDark ? '#FFF' : '#1D1D1F' } : {};

    return (
      <div key={file.sha} className="cms-card p-3 flex flex-col relative group transition border cms-border hover:border-[var(--accent)]" style={stl}>
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] text-muted uppercase font-bold tracking-tight opacity-70 mb-0.5 flex items-center gap-1">
              <svg className="w-2.5 h-2.5"><use href="#icon-folder"></use></svg>{file.repoName}
            </div>
            <a href={file.url} target="_blank" rel="noreferrer" className="font-bold text-[14px] leading-tight hover:underline line-clamp-2 block">
                {file.name}
            </a>
            {/* Render nhãn rất nhỏ để tiết kiệm chỗ */}
            <div className="flex flex-wrap gap-1 mt-1">
               {getFileTags(file.repoName, file.fileName).map(t => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 opacity-60 font-bold border border-black/5">{t}</span>)}
            </div>
          </div>
          
          {/* NÚT EDIT LUÔN HIỂN THỊ - MỜ (CHO IPAD) */}
          <button 
            onClick={(e)=>{e.stopPropagation(); editFileContent(file.repoName, file.fileName, file.sha);}} 
            className="shrink-0 cms-input px-3 py-1.5 rounded-lg text-[10px] font-black opacity-40 hover:opacity-100 transition uppercase border cms-border bg-white dark:bg-gray-800"
          >
            Sửa
          </button>
        </div>
        
        <div className="flex justify-between items-center mt-2 pt-2 border-t cms-border-faint opacity-50">
            <span className="text-[9px] font-mono">{file.fullDate ? file.fullDate.split(' ')[0] : ''}</span>
            <div className="flex gap-1">
                <button onClick={(e)=>{e.stopPropagation(); togglePin(file.repoName, file.fileName);}} className={isPinned ? 'text-[#FF9500]' : ''}><svg className="w-3.5 h-3.5"><use href={isPinned ? "#icon-pin-filled" : "#icon-pin"}></use></svg></button>
                <button onClick={(e)=>{e.stopPropagation(); setActiveModal({type: 'tag', data: file});}}><svg className="w-3.5 h-3.5"><use href="#icon-tag"></use></svg></button>
            </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) return ( <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[var(--bg-body)]"><div className="cms-card p-10 max-w-sm w-full mx-4 text-center shadow-2xl border cms-border"><h2 className="text-2xl font-bold mb-2">Workspace</h2><input type="password" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-center text-3xl font-bold px-4 py-4 cms-input rounded-2xl mb-6 border cms-border" /><button onClick={handleLogin} className="w-full py-4 text-base cms-btn-primary rounded-xl shadow-md">Mở Khóa</button></div></div> );

  return (
    <div className="flex-col w-full min-h-screen fade-in flex bg-[var(--bg-body)]">
      <SVGIcons />
      {/* HEADER */}
      <div className="bg-[var(--bg-card)] border-b cms-border pt-4 pb-3">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--accent)]">vietndj</h1>
          <div className="flex-1 flex w-full items-center gap-2">
            <div className="flex-1 flex items-center bg-[var(--bg-hover)] rounded-xl px-4 py-2 border border-transparent focus-within:border-[var(--accent)]"><svg className="svg-icon text-muted"><use href="#icon-search"></use></svg><input id="search-input-main" type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Tìm kiếm... (Ctrl K)" className="bg-transparent border-none outline-none text-sm w-full ml-3 font-bold" /></div>
          </div>
          <div className="flex items-center gap-2 relative" ref={toolsMenuRef}>
            <button onClick={loadDatabase} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold transition">↻ Tải DB</button>
            <button onClick={()=>setIsTasksOpen(!isTasksOpen)} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold transition">📝 Việc</button>
            <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold transition">Công cụ ▾</button>
            {isToolsOpen && ( 
                <div className="absolute right-0 top-full mt-2 w-56 cms-card shadow-2xl flex flex-col p-2 z-[100] border cms-border fade-in">
                  <div className="flex gap-1 px-1 mb-3">
                    <button onClick={() => changeTheme('light')} className="flex-1 py-1.5 rounded text-[11px] font-bold cms-input border cms-border">Sáng</button>
                    <button onClick={() => changeTheme('dark')} className="flex-1 py-1.5 rounded text-[11px] font-bold cms-input border cms-border">Tối</button>
                  </div>
                  <button onClick={() => setIsPomoOpen(!isPomoOpen)} className="text-left px-3 py-2.5 text-xs font-bold hover:bg-[var(--bg-hover)] rounded-lg">🍅 Pomodoro</button>
                  <button onClick={() => window.open('https://vietndj.github.io/tin.html', '_blank')} className="text-left px-3 py-2.5 text-xs font-bold hover:bg-[var(--bg-hover)] rounded-lg">📖 Mở Reader</button>
                  <hr className="cms-border my-1 border-t" />
                  <button onClick={() => {localStorage.removeItem("cms_auth"); setIsAuthenticated(false);}} className="text-left px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-[var(--bg-hover)] rounded-lg">🔒 Khóa App</button>
                </div> 
              )}
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-body)] border-b cms-border py-3 mb-6 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 flex flex-col gap-3">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
             <span className="text-[10px] font-bold text-muted uppercase shrink-0">KHO</span>
             <div className="flex gap-1.5"><button onClick={() => setActiveRepo('all')} className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition ${activeRepo === 'all' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-hover)]'}`}>Tất cả</button>{Object.keys(db.repos).map(r => (<button key={r} onClick={() => setActiveRepo(r)} className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition whitespace-nowrap ${activeRepo === r ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-hover)]'}`}>{r}</button>))}</div>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
             <span className="text-[10px] font-bold text-muted uppercase shrink-0">NHÃN</span>
             <div className="flex gap-1.5"><button onClick={() => setActiveTag('all')} className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition ${activeTag === 'all' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-hover)]'}`}>Tất cả</button>{allUniqueTags.map(t => (<button key={t} onClick={() => setActiveTag(t)} className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition whitespace-nowrap ${activeTag === t ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-hover)]'}`}>{t}</button>))}</div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto items-start w-full relative pb-20">
        <main className="flex-1 w-full min-w-0 flex flex-col gap-6">
          
          {/* EDITOR TỐI ƯU UX TỘT ĐỘ */}
          <section className="cms-card overflow-hidden shadow-sm">
            <button onClick={() => setIsEditorOpen(!isEditorOpen)} className="w-full px-6 py-3 flex justify-between items-center hover:bg-[var(--bg-hover)] font-semibold text-[var(--accent)] outline-none border-b cms-border">
                <span className="flex items-center gap-2">
                    <svg className="svg-icon"><use href="#icon-edit"></use></svg> Soạn thảo HTML <span className="text-[10px] text-muted border px-1.5 py-0.5 rounded font-mono ml-2 uppercase bg-white dark:bg-gray-800">Ctrl E</span>
                </span>
                <span>▼</span>
            </button>
            {isEditorOpen && (
              <div className="p-5 bg-[var(--bg-card)] fade-in flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                    {repoKeysList.map(r => { const fullPath = `${username}/${r}`; const isActive = repo === fullPath; return (<button key={r} onClick={() => { setRepo(fullPath); }} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition border ${isActive ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-hover)] text-muted'}`}>{r}</button>) })}
                </div>
                {/* TEXTAREA LÀ NƠI FOCUS ĐẦU TIÊN (Ctrl E -> Paste luôn) */}
                <textarea 
                    ref={editorInputRef}
                    id="html-content-editor" rows="12" 
                    value={content} onChange={handleContentChange} 
                    className="w-full px-4 py-4 bg-[#1D1D1F] text-[#34C759] border-none rounded-xl focus:ring-2 focus:ring-[var(--accent)] font-mono text-sm shadow-inner" 
                    placeholder="Mở soạn thảo (Ctrl E) -> Dán HTML (Ctrl V) -> Lưu (Ctrl S)... Tiêu đề tự bóc từ HTML."
                ></textarea>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" value={title} onChange={(e)=>autoSlugify(e.target.value, tags)} className="px-4 py-3 text-sm font-bold bg-[var(--bg-hover)] rounded-xl outline-none" placeholder="Tiêu đề (có thể sửa sau)" />
                    <input type="text" value={tags} onChange={(e)=>setTags(e.target.value)} className="px-4 py-3 text-sm font-bold bg-[var(--bg-hover)] text-[var(--accent)] rounded-xl outline-none" placeholder="Nhãn (cách bằng dấu phẩy)..." />
                </div>
                <div className="flex pt-2 justify-between items-center">
                   <button id="btn-save-article" onClick={handleSaveArticle} disabled={isSaving} className="cms-btn-primary px-10 py-3.5 rounded-xl shadow-lg text-sm font-bold disabled:opacity-50">
                      {isSaving ? '⏳...' : '🚀 Lưu Bài Lên GitHub (Ctrl S)'}
                   </button>
                   {editorOriginal.sha && (<button onClick={()=>setEditorOriginal({repo:'',filename:'',sha:''})} className="text-red-500 font-bold px-4 py-2">✕ Hủy Sửa</button>)}
                </div>
              </div>
            )}
          </section>

          {/* MAIN GRID - HIỂN THỊ CHẶT CHẼ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
             {processedFiles.map(f => renderCard(f))}
          </div>
        </main>

        {/* SIDEBAR TASK */}
        {isTasksOpen && (
          <aside className="w-full lg:w-[300px] shrink-0 sticky top-[120px] h-[calc(100vh-140px)] fade-in">
             <div className="cms-card p-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest">Ghi chú</h2><button onClick={()=>setIsTasksOpen(false)}>✕</button></div>
                <div className="flex gap-2 mb-4"><input type="text" value={nativeTaskInput} onChange={e=>setNativeTaskInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && nativeTaskInput){const n=[{id:Date.now(),title:nativeTaskInput,completed:false},...db.tasks]; saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n}); setNativeTaskInput('');}}} className="flex-1 cms-input border px-3 py-2 rounded-lg text-xs" placeholder="Ghi chú nhanh..." /></div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {db.tasks.map(t => <div key={t.id} className="cms-card p-2 flex gap-2 border text-[11px] font-medium"><input type="checkbox" checked={t.completed} onChange={()=>{const n=db.tasks.map(x=>x.id===t.id?{...x,completed:!x.completed}:x); saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n});}} /><span>{t.title}</span></div>)}
                </div>
             </div>
          </aside>
        )}
      </div>

      {status.text && (<div className="fixed bottom-6 left-6 z-[9999] cms-card px-4 py-2 rounded-xl shadow-lg text-sm font-bold border-l-4 border-l-[var(--accent)] fade-in bg-[var(--bg-card)]">{status.text}</div>)}
    </div>
  );
}
