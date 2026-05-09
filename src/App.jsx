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

// Hàm tạo Gradient động cho Grid View
const getGradient = (str) => {
  const colors = [
    'from-blue-500 to-indigo-500', 'from-emerald-400 to-teal-500', 'from-amber-400 to-orange-500',
    'from-rose-400 to-red-500', 'from-fuchsia-500 to-purple-600', 'from-cyan-400 to-blue-500',
    'from-violet-500 to-fuchsia-500', 'from-lime-400 to-emerald-500', 'from-pink-400 to-rose-500'
  ];
  let hash = 0;
  if (str) { for(let i=0; i<str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash); }
  return colors[Math.abs(hash) % colors.length];
};

const fetchRawJSON = async (repoPath, file, token) => {
  try { const res = await fetch(`https://api.github.com/repos/${repoPath}/contents/${safeEnc(file)}?t=${Date.now()}`, { headers: { ...getHeaders(token), 'Accept': 'application/vnd.github.v3.raw' } }); if (res.ok) return await res.json(); } catch(e) {}
  try { const r2 = await fetch(`https://${repoPath.split('/')[0]}.github.io/${file}?t=${Date.now()}`); if(r2.ok) return await r2.json(); } catch(e){} return null;
};
const fetchText = async (url, token) => { try { const res = await fetch(url, { headers: { ...getHeaders(token), 'Accept': 'application/vnd.github.v3.raw' }}); return res.ok ? await res.text() : null; } catch(e) { return null; } };
const getFileShaSafe = async (repoPath, file, token) => { 
  try { let d = await fetch(`https://api.github.com/repos/${repoPath}/contents/${safeEnc(file)}?t=${Date.now()}`, { headers: getHeaders(token) }).then(r => r.ok ? r.json() : null); if(d && !Array.isArray(d)) return d.sha; 
  let d2 = await fetch(`https://api.github.com/repos/${repoPath}/contents/?t=${Date.now()}`, { headers: getHeaders(token) }).then(r => r.ok ? r.json() : null); if(d2 && Array.isArray(d2)) { const f = d2.find(x => x.name === file); if(f) return f.sha; } return null; } catch(e) { return null; }
};

const parsePreview = (html) => {
  try { const doc = new DOMParser().parseFromString(html, 'text/html'); return (doc.body.textContent || "").replace(/\s+/g,' ').trim().substring(0, 150) + '...'; } catch(e) { return "..."; }
};

// ==========================================
// 2. COMPONENT SVG
// ==========================================
const SVGIcons = () => (
  <svg style={{ display: 'none' }}>
    <symbol id="icon-tag" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></symbol>
    <symbol id="icon-link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></symbol>
    <symbol id="icon-move" viewBox="0 0 24 24"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></symbol>
    <symbol id="icon-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></symbol>
    <symbol id="icon-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></symbol>
    <symbol id="icon-trash" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></symbol>
    <symbol id="icon-folder" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></symbol>
    <symbol id="icon-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></symbol>
    <symbol id="icon-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></symbol>
    <symbol id="icon-timer" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></symbol>
    <symbol id="icon-pin" viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></symbol>
    <symbol id="icon-pin-filled" viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22" stroke="currentColor"></line><path fill="currentColor" stroke="none" d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></symbol>
    <symbol id="icon-palette" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></symbol>
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
  const [isPomoOpen, setIsPomoOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [nativeTaskInput, setNativeTaskInput] = useState('');
  const [bulkSet, setBulkSet] = useState(new Set());

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [repo, setRepo] = useState(() => localStorage.getItem('cms_last_repo') || `${username}/${username}.github.io`);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [editorOriginal, setEditorOriginal] = useState({ repo: '', filename: '', sha: '' });

  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  const toolsMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target)) setIsToolsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("cms_auth") === "granted") setIsAuthenticated(true);
    const savedToken = localStorage.getItem('github_pat'); if (savedToken) setToken(savedToken);
    try { const localDb = JSON.parse(localStorage.getItem('cms_repo_data')); if (localDb && localDb.files) setDb(localDb); } catch(e){}
  }, []);

  useEffect(() => { if (isAuthenticated && token) loadDatabase(); }, [isAuthenticated, token]);

  const handleLogin = () => { if (pin.trim() === SECRET_PIN) { localStorage.setItem("cms_auth", "granted"); setIsAuthenticated(true); } else alert("Mã PIN sai."); };
  const handleSaveToken = (val) => { setToken(val); try { localStorage.setItem('github_pat', val); } catch(err){} };
  const changeTheme = (theme) => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('cms_theme', theme); setIsToolsOpen(false); };
  const saveLocalDb = (newDb) => { try { localStorage.setItem('cms_repo_data', JSON.stringify(newDb)); setDb(newDb); } catch(e) { setDb(newDb); } };

  // ==========================================
  // CORE FUNCTIONS
  // ==========================================
  const loadDatabase = async () => {
    if (!token || isSyncing) return;
    setIsSyncing(true); setStatus({ text: 'Đang tải Database lõi...', type: 'loading' });
    try {
      const meta = await fetchRawJSON(`${username}/${username}.github.io`, 'metadata.json', token);
      const dbData = await fetchRawJSON(`${username}/${username}.github.io`, 'cms_db.json', token);
      if (dbData && dbData.allFiles) {
        const reposMap = {}; dbData.allFiles.forEach(f => { if(!reposMap[f.repoName]) reposMap[f.repoName] = []; reposMap[f.repoName].push(f); });
        saveLocalDb({ files: dbData.allFiles, repos: reposMap, tags: meta?.tags || {}, pinned: meta?.pinned || [], links: meta?.links || {}, colors: meta?.colors || {}, titles: meta?.titles || {}, tasks: meta?.tasks || [], customCol: meta?.customCol || [] });
        setStatus({ text: '✅ Đã đồng bộ Database!', type: 'success' }); setTimeout(() => setStatus({ text: '', type: '' }), 3000);
      }
    } catch (e) { setStatus({ text: `❌ Lỗi DB: ${e.message}`, type: 'error' }); } finally { setIsSyncing(false); }
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

  const toggleTagEditor = (t) => {
    let currentTags = tags.split(',').map(x => x.trim()).filter(Boolean);
    if (currentTags.includes(t)) currentTags = currentTags.filter(x => x !== t); else currentTags.push(t); 
    const newTagsStr = currentTags.join(', '); setTags(newTagsStr); autoSlugify(title, newTagsStr);
  };

  const handleSaveArticle = async () => {
    if (!token) return alert("Vui lòng nhập Token GitHub PAT (Ở phần Cài đặt nâng cao)!");
    if (!repo || !title || !slug || !content) return alert("Thiếu dữ liệu (Kho, Tiêu đề, Slug, Nội dung)!");
    setIsSaving(true); setStatus({ text: '⏳ Đang lưu file HTML...', type: 'loading' });
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

      setStatus({ text: 'Đang đồng bộ Metadata & CMS DB...', type: 'loading' });
      let newTags = { ...db.tags }; let tagArr = tags.split(',').map(x => x.trim()).filter(Boolean);
      if (tagArr.length) newTags[fileKey] = tagArr; else delete newTags[fileKey];
      let newTitles = { ...db.titles }; newTitles[fileKey] = title;
      
      let newFiles = [...db.files];
      if (editorOriginal.sha) newFiles = newFiles.filter(x => x.sha !== editorOriginal.sha);
      let fileIndex = newFiles.findIndex(f => f.sha === (resHTMLData.content?.sha || fileSha));
      const dDate = new Date();
      const newFileObj = { repoName: rName, name: title, fileName: filename, sha: resHTMLData.content?.sha || fileSha, url: `https://${rOwner}.github.io/${rName === `${rOwner}.github.io` ? '' : rName + '/'}${filename}`, timestamp: dDate.getTime(), fullDate: dDate.toLocaleString('vi-VN'), preview: parsePreview(content) };
      if (fileIndex !== -1) newFiles[fileIndex] = newFileObj; else newFiles.unshift(newFileObj);

      const newDbState = { ...db, files: newFiles, tags: newTags, titles: newTitles };
      await syncMetaAndDB(newDbState); saveLocalDb(newDbState);
      
      setStatus({ text: '✅ Đăng bài thành công!', type: 'success' });
      setTitle(''); setSlug(''); setContent(''); setTags(''); setEditorOriginal({ repo:'', filename:'', sha:'' });
      setTimeout(() => setStatus({ text: '', type: '' }), 4000);
    } catch (error) { setStatus({ text: `❌ Lỗi: ${error.message}`, type: 'error' }); } finally { setIsSaving(false); }
  };

  const editFileContent = async (rName, f, sha) => {
    if(!token) return alert("Cần Token ở mục Cài đặt nâng cao!"); setIsEditorOpen(true); window.scrollTo({top:0,behavior:'smooth'});
    setStatus({ text: 'Đang nạp file...', type: 'loading' });
    try {
      const res = await fetchText(`https://api.github.com/repos/${username}/${rName}/contents/${safeEnc(f)}?t=${Date.now()}`, token);
      if(res) {
        setContent(res);
        const rp = rName === username || rName === `${username}.github.io` ? `${username}/${username}.github.io` : `${username}/${rName}`;
        setRepo(rp); setTitle(db.titles[`${rName}/${f}`] || f.replace('.html','')); setSlug(f.replace('.html',''));
        setTags((db.tags[`${rName}/${f}`] || []).join(', '));
        setEditorOriginal({ repo: rp, filename: f, sha: sha });
        setStatus({ text: '✅ Đã nạp thành công!', type: 'success' }); setTimeout(() => setStatus({ text: '', type: '' }), 2000);
      } else throw new Error("Không tìm thấy file");
    } catch(e) { setStatus({ text: `❌ Lỗi: ${e.message}`, type: 'error' }); }
  };

  const togglePin = async (r, f) => {
    if(!token) return; const k = `${r}/${f}`; let newPinned = [...db.pinned];
    if(newPinned.includes(k)) newPinned = newPinned.filter(x => x !== k); else newPinned.push(k);
    const newDb = { ...db, pinned: newPinned }; saveLocalDb(newDb); syncMetaAndDB(newDb);
  };

  const toggleFileSelection = (r, f, sha, e) => {
    e.stopPropagation(); const k = `${r}|${f}|${sha}`; const newSet = new Set(bulkSet);
    if(newSet.has(k)) newSet.delete(k); else newSet.add(k); setBulkSet(newSet);
  };

  // ==========================================
  // DATA FILTERING
  // ==========================================
  const repoKeysList = useMemo(() => { const keys = Object.keys(db.repos); if (!keys.includes(`${username}.github.io`)) keys.unshift(`${username}.github.io`); return keys; }, [db.repos]);
  const allUniqueTags = useMemo(() => { const tagsSet = new Set(); Object.values(db.tags).forEach(arr => arr.forEach(t => tagsSet.add(t))); return Array.from(tagsSet).sort(); }, [db.tags]);
  const getFileTags = (r, f) => db.tags[`${r}/${f}`] || [];
  const getFileLinks = (r, f) => db.links[`${r}/${f}`] || [];

  const processedFiles = useMemo(() => {
    let filtered = db.files.filter(f => {
      const matchRepo = activeRepo === 'all' || f.repoName === activeRepo;
      const matchTag = activeTag === 'all' || getFileTags(f.repoName, f.fileName).includes(activeTag);
      const sq = searchQuery.toLowerCase();
      const matchSearch = !sq || (f.name || "").toLowerCase().includes(sq) || (f.repoName || "").toLowerCase().includes(sq) || (isDeepSearch && (f.preview || "").toLowerCase().includes(sq));
      return matchRepo && matchTag && matchSearch;
    });
    if(currentView === 'table') {
        filtered.sort((a,b)=> tableSort.by==='name' ? (tableSort.dir==='asc'?(a.name||"").localeCompare(b.name||""):(b.name||"").localeCompare(a.name||"")) : (tableSort.dir==='asc'?(a.timestamp||0)-(b.timestamp||0):(b.timestamp||0)-(a.timestamp||0)));
    } else {
        filtered.sort((a, b) => sortOrder === 'desc' ? (b.timestamp || 0) - (a.timestamp || 0) : (a.timestamp || 0) - (b.timestamp || 0));
    }
    return filtered;
  }, [db.files, activeRepo, activeTag, searchQuery, isDeepSearch, sortOrder, currentView, tableSort, db.tags]);

  const recentFiles = useMemo(() => { if (activeTag !== 'all' || activeRepo !== 'all' || searchQuery.trim() !== '') return []; return [...db.files].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 6); }, [db.files, activeRepo, activeTag, searchQuery]);
  const pinnedFiles = useMemo(() => processedFiles.filter(f => db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  const unpinnedFiles = useMemo(() => processedFiles.filter(f => !db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  const groupedFilesByRepo = useMemo(() => { const groups = {}; unpinnedFiles.forEach(f => { if (!groups[f.repoName]) groups[f.repoName] = []; groups[f.repoName].push(f); }); return groups; }, [unpinnedFiles]);

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  
  // Nút hành động dùng chung
  const ActionIcons = ({ file, isPinned, isFeed }) => {
    if (isFeed) {
      return (
        <div className="flex flex-wrap gap-2 ml-auto">
          <button onClick={(e)=>{e.stopPropagation(); editFileContent(file.repoName, file.fileName, file.sha);}} className="cms-btn-primary px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm flex items-center gap-1 hover:opacity-90 transition"><svg className="w-4 h-4"><use href="#icon-edit"></use></svg> Sửa bài</button>
          <button onClick={(e)=>{e.stopPropagation(); togglePin(file.repoName, file.fileName);}} className={`cms-btn px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 ${isPinned ? 'text-[#FF9500]' : ''}`}><svg className="w-4 h-4"><use href={isPinned ? "#icon-pin-filled" : "#icon-pin"}></use></svg> Ghim</button>
          <button onClick={(e)=>{e.stopPropagation(); setActiveModal({type: 'color', data: file});}} className="cms-btn px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5"><svg className="w-4 h-4"><use href="#icon-palette"></use></svg> Màu</button>
          <button onClick={(e)=>{e.stopPropagation(); setActiveModal({type: 'tag', data: file});}} className="cms-btn px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5"><svg className="w-4 h-4"><use href="#icon-tag"></use></svg> Nhãn</button>
          <button onClick={(e)=>{e.stopPropagation(); setActiveModal({type: 'link', data: file});}} className="cms-btn px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 text-[var(--accent)]"><svg className="w-4 h-4"><use href="#icon-link"></use></svg> Link</button>
        </div>
      );
    }
    return (
      <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition duration-300">
        <button onClick={(e)=>{e.stopPropagation(); togglePin(file.repoName, file.fileName);}} className={`icon-btn ${isPinned ? 'text-[#FF9500]' : ''}`}><svg className="svg-icon"><use href={isPinned ? "#icon-pin-filled" : "#icon-pin"}></use></svg></button>
        <button onClick={(e)=>{e.stopPropagation(); setActiveModal({type: 'color', data: file});}} className="icon-btn"><svg className="svg-icon"><use href="#icon-palette"></use></svg></button>
        <button onClick={(e)=>{e.stopPropagation(); setActiveModal({type: 'tag', data: file});}} className="icon-btn"><svg className="svg-icon"><use href="#icon-tag"></use></svg></button>
        <button onClick={(e)=>{e.stopPropagation(); setActiveModal({type: 'link', data: file});}} className="icon-btn text-[var(--accent)]"><svg className="svg-icon"><use href="#icon-link"></use></svg></button>
        <button onClick={(e)=>{e.stopPropagation(); setActiveModal({type: 'move', data: file});}} className="icon-btn"><svg className="svg-icon"><use href="#icon-move"></use></svg></button>
        <button onClick={(e)=>{e.stopPropagation(); editFileContent(file.repoName, file.fileName, file.sha);}} className="icon-btn text-[var(--accent)] cms-input ml-1"><svg className="svg-icon"><use href="#icon-edit"></use></svg></button>
      </div>
    );
  };

  const renderTagsAndLinks = (r, f) => {
    const tags = getFileTags(r, f); const links = getFileLinks(r, f);
    return (
      <>
        {tags.length > 0 && (<div className="flex flex-wrap gap-1.5 mb-2 empty:hidden">{tags.map(t => <span key={t} className="cms-input text-[10px] px-2.5 py-1 rounded font-bold border cms-border flex items-center gap-1 opacity-90"><svg className="w-2.5 h-2.5 opacity-60"><use href="#icon-tag"></use></svg>{t}</span>)}</div>)}
        {links.length > 0 && (<div className="flex flex-wrap gap-1.5 mb-3 empty:hidden">{links.map((l,i) => <a key={i} href={l.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="bg-[#007AFF]/10 text-[var(--accent)] text-[10px] px-2 py-0.5 rounded font-bold border border-transparent hover:border-[#007AFF]/30 transition flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-link"></use></svg>{l.title}</a>)}</div>)}
      </>
    );
  };

  const renderCard = (file, viewType) => {
    const isPinned = db.pinned.includes(`${file.repoName}/${file.fileName}`);
    const dateFmt = file.fullDate ? (viewType === 'kanban' ? (file.fullDate.split(' ')[1] || file.fullDate) : file.fullDate) : '';
    const col = db.colors[`${file.repoName}/${file.fileName}`];
    const isDark = col && getContrastYIQ(col) === '#FFFFFF';
    const stl = col ? { backgroundColor: col, borderColor: 'transparent', color: isDark ? '#FFF' : '#1D1D1F' } : {};
    const isChecked = bulkSet.has(`${file.repoName}|${file.fileName}|${file.sha}`);

    if (viewType === 'recent') return (
        <div key={file.sha} className="cms-card p-3 min-w-[240px] max-w-[240px] flex flex-col group hover:border-[var(--accent)] transition cursor-pointer border cms-border" onClick={() => window.open(file.url, '_blank')}>
          <div className="text-[10px] text-muted mb-1 flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-folder"></use></svg>{file.repoName}</div>
          <h4 className="font-bold text-sm line-clamp-2 mb-2 group-hover:text-[var(--accent)] transition">{file.name}</h4>
          <div className="flex justify-between items-center mt-auto border-t cms-border pt-2"><span className="text-[10px] opacity-70">{dateFmt}</span><button onClick={(e)=>{e.stopPropagation(); editFileContent(file.repoName, file.fileName, file.sha)}} className="text-[10px] bg-[var(--bg-hover)] text-[var(--accent)] px-3 py-1 rounded font-bold hover:opacity-80 transition">Sửa</button></div>
        </div>
    );

    // GIAO DIỆN FEED (Chuẩn theo ảnh của bạn)
    if (viewType === 'feed') return (
        <article key={file.sha} className="cms-card p-8 flex flex-col relative mb-8 border cms-border" style={stl}>
          <input type="checkbox" checked={isChecked} onChange={(e) => toggleFileSelection(file.repoName, file.fileName, file.sha, e)} className="absolute top-8 left-8 w-4 h-4 z-10 cursor-pointer accent-[#007AFF]" />
          <div className="flex items-center gap-3 mb-4 pl-10">
             <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl cms-input border cms-border"><svg className="w-5 h-5"><use href="#icon-folder"></use></svg></div>
             <div><p className="text-sm font-bold cursor-pointer hover:underline opacity-80" onClick={()=>setActiveRepo(file.repoName)}>{file.repoName}</p><p className="text-[11px] font-semibold opacity-70 mt-0.5">{dateFmt}</p></div>
          </div>
          <h2 className="text-3xl font-bold mb-4 pl-10"><a href={file.url} target="_blank" rel="noreferrer" className="hover:underline opacity-90">{file.name}</a></h2>
          <div className="pl-10">{renderTagsAndLinks(file.repoName, file.fileName)}</div>
          
          <div className="w-full h-64 cms-input mt-4 mb-6 rounded-xl flex items-center justify-center overflow-hidden border cms-border bg-gray-100">
             <div className="opacity-40 font-bold text-xl px-4 text-center">{file.name}</div>
          </div>
          
          <div className="text-[16px] leading-relaxed mb-8 opacity-90" dangerouslySetInnerHTML={{__html: (file.preview||'')}}></div>
          <div className="flex flex-wrap gap-2 pt-5 border-t cms-border mt-auto items-center">
             <a href={file.url} target="_blank" rel="noreferrer" className="cms-btn px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm bg-[var(--bg-card)]">Đọc bài</a>
             <ActionIcons file={file} isPinned={isPinned} isFeed={true} />
          </div>
        </article>
    );

    // GIAO DIỆN GRID (Thumbnails Gradient)
    if (viewType === 'grid') {
      const gradClass = getGradient(file.sha || file.name);
      return (
        <div key={file.sha} className="cms-card flex flex-col relative overflow-hidden group hover:scale-[1.02] transition border cms-border" style={stl}>
          <input type="checkbox" checked={isChecked} onChange={(e) => toggleFileSelection(file.repoName, file.fileName, file.sha, e)} className="absolute top-3 left-3 w-4 h-4 z-10 cursor-pointer accent-[#007AFF] opacity-0 group-hover:opacity-100 transition" />
          <div className={`h-28 flex items-center justify-center border-b cms-border overflow-hidden opacity-90 font-bold text-center p-4 text-sm text-white bg-gradient-to-br ${gradClass}`}>
             {file.name}
          </div>
          <div className="p-5 flex flex-col flex-1">
            <span className="text-[10px] uppercase font-bold text-muted mb-2 flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-folder"></use></svg> {file.repoName}</span>
            <a href={file.url} target="_blank" rel="noreferrer" className="font-bold text-lg mb-3 line-clamp-2 hover:underline">{file.name}</a>
            {renderTagsAndLinks(file.repoName, file.fileName)}
            <div className="text-sm opacity-70 line-clamp-4 flex-1 mb-4" dangerouslySetInnerHTML={{__html: (file.preview||'')}}></div>
            <div className="flex justify-between items-center pt-3 border-t cms-border"><span className="text-[10px] opacity-60">{dateFmt}</span><ActionIcons file={file} isPinned={isPinned} /></div>
          </div>
        </div>
      );
    }

    if (viewType === 'kanban') return (
        <div key={file.sha} className="cms-card p-4 flex flex-col relative group hover:scale-[1.01] transition border cms-border mb-3" style={stl}>
          <input type="checkbox" checked={isChecked} onChange={(e) => toggleFileSelection(file.repoName, file.fileName, file.sha, e)} className="absolute top-4 left-4 w-4 h-4 z-10 cursor-pointer accent-[#007AFF] opacity-0 group-hover:opacity-100 transition" />
          <div className="pl-6"><a href={file.url} target="_blank" rel="noreferrer" className="font-bold text-[15px] hover:underline mb-2 line-clamp-2">{file.name}</a>{renderTagsAndLinks(file.repoName, file.fileName)}</div>
          <div className="flex justify-between items-center mt-auto pt-3 border-t cms-border"><span className="text-[10px] opacity-60">{dateFmt}</span><ActionIcons file={file} isPinned={isPinned} /></div>
        </div>
    );

    // GIAO DIỆN TABLE (Hover hiện nút)
    if (viewType === 'table') return (
        <tr key={file.sha} className={`group border-b cms-border hover:bg-[var(--bg-hover)] transition ${isDark ? 'text-white' : ''}`} style={stl}>
          <td className="p-3 text-center"><input type="checkbox" checked={isChecked} onChange={(e) => toggleFileSelection(file.repoName, file.fileName, file.sha, e)} className="accent-[#007AFF] w-4 h-4 cursor-pointer" /></td>
          <td className="p-3"><a href={file.url} target="_blank" rel="noreferrer" className="font-bold hover:text-[var(--accent)] text-[15px] block mb-1">{file.name}</a>{renderTagsAndLinks(file.repoName, file.fileName)}</td>
          <td className="p-3 text-xs opacity-70 line-clamp-2 max-w-[200px] leading-relaxed">{file.preview||''}</td>
          <td className="p-3 text-xs opacity-80 whitespace-nowrap">{dateFmt}</td>
          <td className="p-3"><div className="flex gap-1 justify-center"><ActionIcons file={file} isPinned={isPinned} /></div></td>
        </tr>
    );

    // GIAO DIỆN LIST (Mặc định)
    return (
      <div key={file.sha} className="cms-card p-4 flex flex-col relative group hover:scale-[1.01] transition border cms-border" style={stl}>
        <input type="checkbox" checked={isChecked} onChange={(e) => toggleFileSelection(file.repoName, file.fileName, file.sha, e)} className="absolute top-5 left-4 w-4 h-4 z-10 cursor-pointer accent-[#007AFF] opacity-0 group-hover:opacity-100 transition" />
        <div className="pl-6">
          <div className="text-[10px] text-muted flex items-center gap-1 mb-2 font-bold uppercase tracking-wide"><svg className="w-3 h-3"><use href="#icon-folder"></use></svg> {file.repoName}</div>
          <a href={file.url} target="_blank" rel="noreferrer" className="font-bold text-[15px] hover:text-[var(--accent)] mb-2 line-clamp-2">{file.name}</a>
          {renderTagsAndLinks(file.repoName, file.fileName)}
          <div className="text-xs text-muted line-clamp-2 mb-4">{file.preview || '...'}</div>
        </div>
        <div className="flex justify-between items-center mt-auto pt-3 border-t cms-border">
          <span className="text-[10px] opacity-60">{dateFmt}</span>
          <div className="flex items-center gap-2">
             <ActionIcons file={file} isPinned={isPinned} />
             <button onClick={(e)=>{e.stopPropagation(); editFileContent(file.repoName, file.fileName, file.sha)}} className="cms-btn px-4 py-1.5 rounded-lg text-xs font-bold transition sm:hidden group-hover:block">Sửa</button>
          </div>
        </div>
      </div>
    );
  };

  const renderViews = () => {
    if (processedFiles.length === 0) return <div className="text-center py-20 text-muted font-bold text-sm">Trống</div>;
    
    if (currentView === 'feed') return <div className="flex flex-col max-w-4xl mx-auto w-full">{pinnedFiles.length > 0 && <h3 className="font-bold mb-4 text-[#FF9500] text-xl border-b cms-border pb-2">📌 Đã ghim</h3>}{pinnedFiles.map(f => renderCard(f, 'feed'))}{unpinnedFiles.length > 0 && <h3 className="font-bold mt-4 mb-4 text-xl border-b cms-border pb-2">Khác</h3>}{unpinnedFiles.map(f => renderCard(f, 'feed'))}</div>;
    
    if (currentView === 'grid') return <div className="flex flex-col gap-6">{pinnedFiles.length > 0 && <><h3 className="font-bold mb-2 text-[#FF9500] text-lg border-b cms-border pb-2">📌 Đã ghim</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{pinnedFiles.map(f => renderCard(f, 'grid'))}</div></>}{unpinnedFiles.length > 0 && <><h3 className="font-bold mt-4 mb-2 text-lg border-b cms-border pb-2">Khác</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{unpinnedFiles.map(f => renderCard(f, 'grid'))}</div></>}</div>;

    if (currentView === 'kanban') return <div className="flex overflow-x-auto gap-6 pb-6 items-start min-h-[70vh] kanban-scroll">{pinnedFiles.length > 0 && <div className="w-[320px] shrink-0 bg-[var(--bg-hover)] rounded-2xl flex flex-col h-full max-h-[70vh] border cms-border p-2"><div className="px-3 py-2 flex justify-between items-center font-bold text-sm mb-2 text-[#FF9500]"><span>📌 Đã ghim</span><span className="cms-card px-2 py-0.5 rounded-full text-[10px] shadow-sm">{pinnedFiles.length}</span></div><div className="overflow-y-auto kanban-scroll px-1 pb-2 flex-1">{pinnedFiles.map(f => renderCard(f, 'kanban'))}</div></div>}{Object.keys(groupedFilesByRepo).map(r => <div key={r} className="w-[320px] shrink-0 bg-[var(--bg-hover)] rounded-2xl flex flex-col h-full max-h-[70vh] border cms-border p-2"><div className="px-3 py-2 flex justify-between items-center font-bold text-sm mb-2 cursor-pointer hover:opacity-70 transition" onClick={() => setActiveRepo(r)}><span>{r}</span><span className="cms-card px-2 py-0.5 rounded-full text-[10px] shadow-sm">{groupedFilesByRepo[r].length}</span></div><div className="overflow-y-auto kanban-scroll px-1 pb-2 flex-1">{groupedFilesByRepo[r].map(f => renderCard(f, 'kanban'))}</div></div>)}</div>;

    if (currentView === 'table') return <div className="flex flex-col gap-6">{pinnedFiles.length > 0 && <details open className="mb-4"><summary className="font-bold text-lg mb-2 cursor-pointer border-b cms-border pb-2 flex items-center gap-2 outline-none text-[#FF9500]">📌 Đã ghim <span className="text-sm text-muted">({pinnedFiles.length})</span></summary><div className="cms-card overflow-x-auto"><table className="w-full text-left text-sm min-w-[800px]"><tr className="cms-input text-muted text-[10px] uppercase tracking-wider border-b cms-border"><th className="p-3 w-8"></th><th className="p-3 cursor-pointer hover:underline" onClick={()=>setTableSort({by:'name',dir:tableSort.dir==='asc'?'desc':'asc'})}>Bài viết</th><th className="p-3">Mô tả</th><th className="p-3 w-32 cursor-pointer hover:underline" onClick={()=>setTableSort({by:'date',dir:tableSort.dir==='asc'?'desc':'asc'})}>Cập nhật</th><th className="p-3 text-center w-40">Thao tác</th></tr>{pinnedFiles.map(f => renderCard(f, 'table'))}</table></div></details>}{Object.keys(groupedFilesByRepo).map(r => <details key={r} open className="mb-4"><summary className="font-bold text-lg mb-2 cursor-pointer border-b cms-border pb-2 flex items-center gap-2 outline-none">{r} <span className="text-sm text-muted">({groupedFilesByRepo[r].length})</span></summary><div className="cms-card overflow-x-auto"><table className="w-full text-left text-sm min-w-[800px]"><tr className="cms-input text-muted text-[10px] uppercase tracking-wider border-b cms-border"><th className="p-3 w-8"></th><th className="p-3 cursor-pointer hover:underline" onClick={()=>setTableSort({by:'name',dir:tableSort.dir==='asc'?'desc':'asc'})}>Bài viết</th><th className="p-3">Mô tả</th><th className="p-3 w-32 cursor-pointer hover:underline" onClick={()=>setTableSort({by:'date',dir:tableSort.dir==='asc'?'desc':'asc'})}>Cập nhật</th><th className="p-3 text-center w-40">Thao tác</th></tr>{groupedFilesByRepo[r].map(f => renderCard(f, 'table'))}</table></div></details>)}</div>;

    // List
    return <div className="flex flex-col gap-6">{pinnedFiles.length > 0 && <details open className="mb-6"><summary className="font-bold text-xl mb-4 border-b cms-border pb-2 cursor-pointer outline-none text-[#FF9500] flex items-center gap-2"><svg className="w-6 h-6"><use href="#icon-pin-filled"></use></svg> 📌 Đã ghim <span className="cms-input text-xs px-2 py-0.5 rounded-full border cms-border text-[var(--text-main)]">{pinnedFiles.length}</span></summary><div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">{pinnedFiles.map(f => renderCard(f, 'list'))}</div></details>}{Object.keys(groupedFilesByRepo).map(r => <details key={r} open className="mb-6"><summary className="font-bold text-xl mb-4 border-b cms-border pb-2 cursor-pointer outline-none flex items-center gap-2"><svg className="w-6 h-6"><use href="#icon-folder"></use></svg> {r} <span className="cms-input text-xs px-2 py-0.5 rounded-full border cms-border text-muted">{groupedFilesByRepo[r].length}</span></summary><div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">{groupedFilesByRepo[r].map(f => renderCard(f, 'list'))}</div></details>)}</div>;
  };

  if (!isAuthenticated) return ( <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[var(--bg-body)]"><div className="cms-card p-10 max-w-sm w-full mx-4 text-center shadow-2xl border cms-border"><h2 className="text-2xl font-bold mb-2">Workspace React</h2><input type="password" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-center text-3xl font-bold px-4 py-4 cms-input rounded-2xl mb-6 border cms-border" /><button onClick={handleLogin} className="w-full py-4 text-base cms-btn-primary rounded-xl shadow-md">Mở Khóa</button></div></div> );

  return (
    <div className="flex-col w-full min-h-screen fade-in flex bg-[var(--bg-body)]">
      <SVGIcons />
      {/* HEADER BẢN CŨ */}
      <div className="bg-[var(--bg-card)] border-b cms-border pt-4 pb-3">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--accent)] w-full md:w-[120px] text-center md:text-left">vietndj</h1>
          <div className="flex-1 flex w-full items-center gap-2">
            <div className="flex-1 flex items-center bg-[var(--bg-hover)] rounded-xl px-4 py-2 border border-transparent focus-within:border-[var(--accent)] transition-all"><svg className="svg-icon text-muted"><use href="#icon-search"></use></svg><input type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Tìm bài viết, repo... (Ctrl K)" className="bg-transparent border-none outline-none text-sm w-full ml-3 font-bold placeholder-[var(--text-muted)]" /></div>
            <button onClick={() => setIsDeepSearch(!isDeepSearch)} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 border cms-border ${isDeepSearch ? 'bg-[var(--accent)] text-white' : 'bg-transparent text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}><svg className="w-4 h-4"><use href="#icon-grid"></use></svg> Sâu</button>
          </div>
          <div className="flex items-center gap-2 shrink-0 relative w-full md:w-auto justify-center" ref={toolsMenuRef}>
            <button onClick={loadDatabase} className="hidden lg:block cms-btn px-3 py-2 rounded-xl text-xs font-bold transition outline-none">↻ Tải DB Lõi</button>
            <button onClick={()=>setIsTasksOpen(!isTasksOpen)} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 outline-none">📝 Việc</button>
            <div className="relative">
              <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 outline-none">Công cụ ▾</button>
              {isToolsOpen && ( <div className="absolute right-0 top-full mt-2 w-56 cms-card shadow-2xl flex flex-col p-2 z-[100] border cms-border fade-in"><div className="px-2 py-1 text-[10px] uppercase text-muted font-bold tracking-wider mb-1">Giao diện</div><div className="flex gap-1 px-1 mb-3"><button onClick={() => changeTheme('light')} className="flex-1 py-1.5 rounded text-[11px] font-bold cms-input hover:opacity-80 transition border cms-border">Sáng</button><button onClick={() => changeTheme('dark')} className="flex-1 py-1.5 rounded text-[11px] font-bold cms-input hover:opacity-80 transition border cms-border">Tối</button><button onClick={() => changeTheme('read')} className="flex-1 py-1.5 rounded text-[11px] font-bold cms-input hover:opacity-80 transition border cms-border text-[#D35400]">Sách</button></div><hr className="cms-border my-1 border-t" /><button onClick={()=>setIsPomoOpen(!isPomoOpen)} className="text-left px-3 py-2.5 text-xs font-bold hover:bg-[var(--bg-hover)] rounded-lg transition">🍅 Pomodoro</button><button onClick={() => {localStorage.removeItem("cms_auth"); setIsAuthenticated(false);}} className="text-left px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-[var(--bg-hover)] rounded-lg transition">🔒 Khóa App</button></div> )}
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS BẢN CŨ */}
      <div className="bg-[var(--bg-body)] border-b cms-border py-4 mb-6 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-muted uppercase w-[40px]">VIEW</span>
              <div className="flex bg-[var(--bg-hover)] p-1 rounded-lg border cms-border overflow-x-auto scrollbar-hide">
                {['List', 'Grid', 'Kanban', 'Table', 'Feed'].map(v => <button key={v} onClick={() => setCurrentView(v.toLowerCase())} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${currentView === v.toLowerCase() ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-main)]' : 'text-muted hover:text-[var(--text-main)]'}`}>{v}</button>)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-[var(--bg-hover)] p-1 rounded-lg border cms-border"><button onClick={() => setSortOrder('desc')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${sortOrder === 'desc' ? 'bg-[var(--bg-card)] shadow-sm' : 'text-muted'}`}>Mới ↓</button><button onClick={() => setSortOrder('asc')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${sortOrder === 'asc' ? 'bg-[var(--bg-card)] shadow-sm' : 'text-muted'}`}>Cũ ↑</button></div>
              <button onClick={loadDatabase} className="cms-btn px-4 py-2 rounded-lg text-xs font-bold text-[var(--accent)] border cms-border shadow-sm bg-[var(--bg-card)]">{isSyncing ? '⏳...' : '↻ Tải lại'}</button>
            </div>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
             <span className="text-[10px] font-bold text-muted uppercase w-[40px] shrink-0 flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-folder"></use></svg> KHO</span>
             <div className="flex gap-2"><button onClick={() => setActiveRepo('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${activeRepo === 'all' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-hover)] hover:bg-gray-200 dark:hover:bg-gray-800'}`}>Tất cả</button>{Object.keys(db.repos).map(r => (<button key={r} onClick={() => setActiveRepo(r)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${activeRepo === r ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-hover)] hover:bg-gray-200 dark:hover:bg-gray-800'}`}>{r} <span className="opacity-60 font-normal">({db.repos[r].length})</span></button>))}</div>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
             <span className="text-[10px] font-bold text-muted uppercase w-[40px] shrink-0 flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-tag"></use></svg> NHÃN</span>
             <div className="flex gap-2"><button onClick={() => setActiveTag('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${activeTag === 'all' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-hover)] hover:bg-gray-200 dark:hover:bg-gray-800'}`}>Tất cả</button>{allUniqueTags.map(t => (<button key={t} onClick={() => setActiveTag(t)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${activeTag === t ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-hover)] hover:bg-gray-200 dark:hover:bg-gray-800'}`}>{t}</button>))}</div>
          </div>
        </div>
      </div>
      
      {/* MAIN CONTAINER */}
      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto items-start w-full relative pb-20">
        <main className="flex-1 w-full min-w-0 flex flex-col gap-6">
          
          {/* EDITOR (Tối ưu giao diện gõ) */}
          <section className="cms-card overflow-hidden shadow-sm">
            <button onClick={() => setIsEditorOpen(!isEditorOpen)} className="w-full px-6 py-4 flex justify-between items-center hover:bg-[var(--bg-hover)] font-semibold text-[var(--accent)] outline-none border-b cms-border"><span className="flex items-center gap-2"><svg className="svg-icon"><use href="#icon-edit"></use></svg> Soạn thảo HTML</span><span style={{ transform: isEditorOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} className="transition-transform">▼</span></button>
            {isEditorOpen && (
              <div className="p-6 bg-[var(--bg-card)] fade-in flex flex-col gap-5">
                <div>
                   <label className="block text-[11px] font-bold text-muted mb-2 uppercase">📁 Lưu vào Kho</label>
                   <div className="flex flex-wrap gap-2">{repoKeysList.map(r => { const fullPath = `${username}/${r}`; const isActive = repo === fullPath; return (<button key={r} onClick={() => { setRepo(fullPath); localStorage.setItem('cms_last_repo', fullPath); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border ${isActive ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'bg-[var(--bg-hover)] text-[var(--text-main)] border-transparent hover:opacity-80'}`}>{r}</button>) })}</div>
                </div>
                <div><input type="text" value={title} onChange={(e)=>autoSlugify(e.target.value, tags)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); document.getElementById('html-content-editor')?.focus(); } }} className="w-full px-4 py-4 text-2xl font-black text-[var(--text-main)] bg-[var(--bg-hover)] border-2 border-transparent focus:border-[var(--accent)] rounded-xl outline-none transition-all placeholder:text-gray-400" placeholder="Nhập tiêu đề bài viết... (Enter để viết nội dung)" /></div>
                <div className="bg-[var(--bg-hover)] p-4 rounded-xl border border-transparent focus-within:border-[var(--accent)] transition-all">
                   <div className="flex items-center gap-2 mb-2"><svg className="w-4 h-4 text-muted"><use href="#icon-tag"></use></svg><input type="text" value={tags} onChange={(e)=>{setTags(e.target.value); autoSlugify(title, e.target.value);}} className="flex-1 bg-transparent text-sm font-bold text-[var(--accent)] outline-none placeholder:text-muted placeholder:font-normal" placeholder="Gõ tag mới (cách bằng dấu phẩy)..." /></div>
                   {allUniqueTags.length > 0 && (<div className="flex flex-wrap gap-1.5 pt-3 border-t border-[var(--border)]">{allUniqueTags.map(t => { const isSelected = tags.split(',').map(x=>x.trim()).includes(t); return (<button key={t} onClick={() => toggleTagEditor(t)} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition border ${isSelected ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--bg-card)] text-muted border-[var(--border)] hover:opacity-80 shadow-sm'}`}>{t}</button>) })}</div>)}
                </div>
                <div><textarea id="html-content-editor" rows="10" value={content} onChange={(e)=>setContent(e.target.value)} className="w-full px-4 py-4 bg-[#1D1D1F] text-[#34C759] border-none rounded-xl focus:ring-2 focus:ring-[var(--accent)] font-mono text-sm leading-relaxed outline-none shadow-inner" placeholder="Nhập mã HTML vào đây..."></textarea></div>
                <details className="group border cms-border rounded-xl bg-[var(--bg-hover)]"><summary className="px-4 py-3 text-xs font-bold text-muted cursor-pointer flex items-center gap-2 outline-none hover:text-[var(--text-main)]"><span className="group-open:rotate-90 transition-transform">▶</span> Cài đặt nâng cao (Token PAT, URL Slug)</summary><div className="p-4 border-t cms-border grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-[10px] font-bold text-muted mb-1 uppercase">Mã Github PAT</label><input type="password" value={token} onChange={(e)=>handleSaveToken(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg-card)] border cms-border rounded-lg text-xs outline-none focus:border-[var(--accent)]" placeholder="Nhập Token GitHub..." /></div><div><label className="block text-[10px] font-bold text-muted mb-1 uppercase">Slug (URL)</label><input type="text" value={slug} onChange={(e)=>setSlug(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg-card)] border cms-border rounded-lg text-xs font-mono text-[var(--accent)] outline-none focus:border-[var(--accent)]" placeholder="kien-thuc..." /></div></div></details>
                <div className="flex pt-2 justify-between items-center">
                   <button onClick={handleSaveArticle} disabled={isSaving} className="cms-btn-primary w-full md:w-auto px-10 py-4 rounded-xl shadow-lg text-sm disabled:opacity-50 hover:scale-[1.02] transition-transform">{isSaving ? '⏳ Đang lưu...' : '🚀 Lưu Bài Lên GitHub'}</button>
                   {editorOriginal.sha && (<button onClick={()=>setEditorOriginal({repo:'',filename:'',sha:''})} className="text-red-500 font-bold px-4 py-2 hover:bg-red-50 rounded-xl transition">✕ Hủy Sửa</button>)}
                </div>
              </div>
            )}
          </section>

          {/* RECENT FILES */}
          {recentFiles.length > 0 && (<div className="mb-8"><h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-[var(--accent)]"><svg className="w-5 h-5"><use href="#icon-timer"></use></svg> Vừa thao tác gần đây</h3><div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">{recentFiles.map(f => renderCard(f, 'recent'))}</div></div>)}
          
          {/* MAIN VIEWS */}
          {renderViews()}
        </main>

        {/* CỘT SIDEBAR TASK */}
        {isTasksOpen && (
          <aside className="w-full lg:w-[320px] shrink-0 sticky top-[150px] h-[calc(100vh-160px)] fade-in">
             <div className="cms-card p-4 flex flex-col h-full shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b cms-border pb-3"><h2 className="text-sm font-bold text-[var(--accent)] flex items-center gap-1.5"><svg className="svg-icon w-4 h-4"><use href="#icon-edit"></use></svg> Ghi chú Nhanh</h2><button onClick={()=>setIsTasksOpen(false)} className="text-muted hover:text-red-500 font-bold px-1">✕</button></div>
                <div className="flex gap-2 mb-4"><input type="text" value={nativeTaskInput} onChange={e=>setNativeTaskInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){const n=[{id:Date.now(),title:nativeTaskInput,completed:false},...db.tasks]; saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n}); setNativeTaskInput('');}}} className="flex-1 cms-input border cms-border px-3 py-2 rounded-lg text-sm font-medium outline-none" placeholder="Nhập ghi chú..." /><button onClick={()=>{if(!nativeTaskInput)return; const n=[{id:Date.now(),title:nativeTaskInput,completed:false},...db.tasks]; saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n}); setNativeTaskInput('');}} className="cms-btn-primary w-9 h-9 rounded-lg">+</button></div>
                <div className="flex-1 overflow-y-auto kanban-scroll space-y-2 pr-1">
                  {db.tasks.map(t => <div key={t.id} className={`cms-card p-3 flex gap-2 border cms-border shadow-sm group ${t.completed?'opacity-50':''}`}><input type="checkbox" checked={t.completed} onChange={()=>{const n=db.tasks.map(x=>x.id===t.id?{...x,completed:!x.completed}:x); saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n});}} className="mt-1 accent-[#007AFF] w-4 h-4" /><span className="flex-1 text-sm font-medium">{t.title}</span><button onClick={()=>{const n=db.tasks.filter(x=>x.id!==t.id); saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n});}} className="text-red-500 font-bold opacity-0 group-hover:opacity-100">✕</button></div>)}
                </div>
             </div>
          </aside>
        )}
      </div>

      {/* CÁC WIDGET & MODAL PHỤ */}
      {bulkSet.size > 0 && (<div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[100] cms-card px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 fade-in"><span className="text-sm font-bold whitespace-nowrap"><span className="text-[var(--accent)] text-base">{bulkSet.size}</span> chọn</span><div className="h-4 w-px bg-[var(--border)]"></div><button onClick={() => setActiveModal({type: 'bulkMove'})} className="text-sm font-bold text-[var(--accent)] hover:opacity-80">Chuyển Repo</button><button onClick={() => setBulkSet(new Set())} className="text-sm font-bold text-muted hover:text-red-500 ml-2">Hủy</button></div>)}
      {isPomoOpen && (<div className="fixed bottom-6 right-6 w-72 cms-card z-[100] p-4 shadow-2xl border cms-border fade-in"><div className="flex justify-between items-center font-bold text-sm mb-4 border-b cms-border pb-2"><span><svg className="w-4 h-4 inline pb-0.5 text-[#FF9500]"><use href="#icon-timer"></use></svg> Pomodoro</span><span onClick={()=>setIsPomoOpen(false)} className="cursor-pointer text-red-500 font-bold">✕</span></div><div className="text-4xl font-black text-center mb-4 font-mono text-[var(--accent)]">25:00</div><button className="w-full cms-btn-primary py-2 rounded-xl text-xs font-bold">BẮT ĐẦU</button></div>)}
      {status.text && (<div className="fixed bottom-6 left-6 z-[9999] cms-card px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold border-l-4 border-l-[var(--accent)] fade-in bg-[var(--bg-card)]">{status.text}</div>)}
      {activeModal.type && (<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999999] flex items-center justify-center fade-in"><div className="cms-card p-6 max-w-sm w-full mx-4 border cms-border"><h3 className="text-xl font-bold mb-4 capitalize">Tác vụ: {activeModal.type}</h3><p className="text-sm text-muted mb-6">Tính năng này đang được React hóa trong bản cập nhật sau.</p><div className="flex justify-end gap-3"><button onClick={() => setActiveModal({type: null, data: null})} className="cms-btn px-5 py-2 rounded-lg text-sm font-bold">Đóng</button></div></div></div>)}

    </div>
  );
}