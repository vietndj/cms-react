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

const parsePreview = (html) => {
  try { const doc = new DOMParser().parseFromString(html, 'text/html'); return (doc.body.textContent || "").replace(/\s+/g,' ').trim().substring(0, 150) + '...'; } catch(e) { return "..."; }
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
  const [activeRepo, setActiveRepo] = useState('all');
  const [activeTag, setActiveTag] = useState('all');
  
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [nativeTaskInput, setNativeTaskInput] = useState('');

  // EXPORT AI & MODAL
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

  // Focus ô NHẬP HTML khi mở Editor
  useEffect(() => {
    if (isEditorOpen && editorInputRef.current) {
        setTimeout(() => editorInputRef.current.focus(), 100);
    }
  }, [isEditorOpen]);

  // Phím Tắt Toàn Cầu
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
        const isCmd = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? e.metaKey : e.ctrlKey;
        if (isCmd && e.key.toLowerCase() === 'e') {
            e.preventDefault(); setIsEditorOpen(prev => !prev);
        }
        if (isCmd && e.key.toLowerCase() === 's') {
            e.preventDefault(); document.getElementById('btn-save-article')?.click();
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

  // --- LƯU MÀU SẮC THẺ ---
  const handleSetColor = async (fileKey, color) => {
      const newColors = { ...db.colors, [fileKey]: color };
      const newState = { ...db, colors: newColors };
      setDb(newState);
      await syncMetaAndDB(newState);
      saveLocalDb(newState);
      setActiveModal({ type: null, data: null });
  };

  // --- XUẤT SÁCH AI ---
  const handleExportAI = async () => {
      if (!token) return alert("Cần Token PAT!");
      setStatus({ text: "Đang đóng gói sách...", type: "loading" });
      try {
          let targets = db.files.filter(f => (exportTarget === 'all' || f.repoName === exportTarget) && !['index.html', 'tin.html', 'cms_db.json', 'metadata.json'].includes(f.fileName));
          let ct = `SIÊU SÁCH KIẾN THỨC: ${username.toUpperCase()}\n===========================\n\n`;
          
          for (let i = 0; i < targets.length; i++) {
              const f = targets[i];
              setStatus({ text: `Đang nạp (${i+1}/${targets.length}): ${f.name}`, type: "loading" });
              
              let rC = null;
              // Lấy qua API chuẩn để đảm bảo lấy được content, bỏ qua link public
              rC = await fetchText(`https://api.github.com/repos/${username}/${f.repoName}/contents/${safeEnc(f.fileName)}?t=${Date.now()}`, token);
              
              if (rC) {
                  const d = new DOMParser().parseFromString(rC, 'text/html');
                  d.querySelectorAll('script,style,button,nav').forEach(x => x.remove());
                  const textContent = (d.body.innerText || d.body.textContent || "").replace(/\n{3,}/g, '\n\n').trim();
                  ct += `BÀI: ${db.titles[`${f.repoName}/${f.fileName}`] || f.name}\n${textContent}\n\n------------------------\n\n`;
              }
              await new Promise(r => setTimeout(r, 20)); // Tránh limit API
          }
          
          const blob = new Blob([ct], { type: 'text/plain;charset=utf-8' });
          setExportResult({ url: URL.createObjectURL(blob), filename: `notebooklm_${exportTarget}_${Date.now()}.txt`, count: targets.length });
          setStatus({ text: "✅ Hoàn tất đóng gói!", type: "success" });
          setTimeout(() => setStatus({ text: '', type: '' }), 3000);
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
    // Bóc tách nhanh Tiêu đề từ HTML
    if (!title.trim() && val.includes('<title>')) {
        const match = val.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (match && match[1]) autoSlugify(match[1].trim(), tags);
    }
  };

  const handleSaveArticle = async () => {
    if (!token || !repo || !title || !slug || !content) return alert("Thiếu dữ liệu (Kho, Tiêu đề, Slug, Nội dung)!");
    setIsSaving(true); setStatus({ text: '⏳ Đang lưu HTML...', type: 'loading' });
    try {
      let filename = slug.endsWith('.html') ? slug : slug + '.html';
      let rName = repo.includes('/') ? repo.split('/')[1] : repo;
      let rOwner = repo.includes('/') ? repo.split('/')[0] : username;
      let fileKey = `${rName}/${filename}`;

      const encodedContent = await encodeBase64UTF8Async(content);
      let fileSha = await getFileShaSafe(`${rOwner}/${rName}`, filename, token);

      const resHTML = await fetch(`https://api.github.com/repos/${rOwner}/${rName}/contents/${safeEnc(filename)}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Save: ${title}`, content: encodedContent, sha: fileSha || undefined }) });
      if (!resHTML.ok) throw new Error("Lỗi khi ghi HTML");
      const resHTMLData = await resHTML.json();

      if (editorOriginal.filename && (editorOriginal.filename !== filename || editorOriginal.repo !== `${rOwner}/${rName}`) && editorOriginal.sha) {
        await fetch(`https://api.github.com/repos/${editorOriginal.repo}/contents/${safeEnc(editorOriginal.filename)}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Xóa file cũ`, sha: editorOriginal.sha }) });
        const oldKey = `${editorOriginal.repo.split('/')[1]||editorOriginal.repo.split('/')[0]}/${editorOriginal.filename}`;
        delete db.tags[oldKey]; delete db.titles[oldKey]; delete db.colors[oldKey];
        db.pinned = db.pinned.filter(x => x !== oldKey);
      }

      setStatus({ text: 'Đang đồng bộ Metadata & CMS DB...', type: 'loading' });
      let newTags = { ...db.tags }; let tagArr = tags.split(',').map(x => x.trim()).filter(Boolean);
      if (tagArr.length) newTags[fileKey] = tagArr; else delete newTags[fileKey];
      let newTitles = { ...db.titles }; newTitles[fileKey] = title;
      
      let newFiles = [...db.files].filter(f => f.sha !== (resHTMLData.content?.sha || fileSha));
      const dDate = new Date();
      newFiles.unshift({ repoName: rName, name: title, fileName: filename, sha: resHTMLData.content?.sha || fileSha, url: `https://${rOwner}.github.io/${rName === `${rOwner}.github.io` ? '' : rName + '/'}${filename}`, timestamp: dDate.getTime(), fullDate: dDate.toLocaleString('vi-VN') });

      const newState = { ...db, files: newFiles, tags: newTags, titles: newTitles };
      await syncMetaAndDB(newState); saveLocalDb(newState);
      
      localStorage.setItem('cms_last_repo', `${rOwner}/${rName}`);
      localStorage.setItem('cms_last_tags', tags);

      setStatus({ text: '✅ Đăng bài thành công!', type: 'success' });
      setTitle(''); setSlug(''); setContent(''); setEditorOriginal({ repo:'', filename:'', sha:'' });
      setTimeout(() => setStatus({ text: '', type: '' }), 4000);
    } catch (error) { setStatus({ text: `❌ Lỗi lưu bài`, type: 'error' }); } finally { setIsSaving(false); }
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

  // ==========================================
  // DATA FILTERING & SORTING
  // ==========================================
  const repoKeysList = useMemo(() => { const keys = Object.keys(db.repos || {}); if (!keys.includes(`${username}.github.io`)) keys.unshift(`${username}.github.io`); return keys; }, [db.repos]);
  const allUniqueTags = useMemo(() => { const s = new Set(); Object.values(db.tags).forEach(a => a.forEach(t => s.add(t))); return Array.from(s).sort(); }, [db.tags]);
  const getFileTags = (r, f) => db.tags[`${r}/${f}`] || [];

  const processedFiles = useMemo(() => {
    let f = db.files.filter(f => (activeRepo === 'all' || f.repoName === activeRepo) && (activeTag === 'all' || getFileTags(f.repoName, f.fileName).includes(activeTag)) && (!searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())));
    return f.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Luôn Mới nhất trước
  }, [db.files, activeRepo, activeTag, searchQuery, db.tags]);

  const recentFiles = useMemo(() => (activeTag==='all' && activeRepo==='all' && !searchQuery) ? [...db.files].sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)).slice(0, 8) : [], [db.files, activeRepo, activeTag, searchQuery]);
  const pinnedFiles = useMemo(() => processedFiles.filter(f => db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  const unpinnedFiles = useMemo(() => processedFiles.filter(f => !db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  
  // Sắp xếp các Repo: Repo nào có bài viết mới nhất sẽ được đẩy lên trên cùng
  const groupedFilesByRepo = useMemo(() => { 
    const groups = {}; 
    unpinnedFiles.forEach(f => { if (!groups[f.repoName]) groups[f.repoName] = []; groups[f.repoName].push(f); }); 
    const sortedRepoNames = Object.keys(groups).sort((a, b) => {
        const maxA = Math.max(...groups[a].map(f => f.timestamp || 0));
        const maxB = Math.max(...groups[b].map(f => f.timestamp || 0));
        return maxB - maxA;
    });
    const sortedGroups = {}; sortedRepoNames.forEach(r => sortedGroups[r] = groups[r]);
    return sortedGroups; 
  }, [unpinnedFiles]);

  // ==========================================
  // RENDER THẺ BÀI VIẾT (CARD) - SIÊU NÉN
  // ==========================================
  const renderCard = (file, isRecent = false) => {
    const isP = db.pinned.includes(`${file.repoName}/${file.fileName}`);
    const col = db.colors[`${file.repoName}/${file.fileName}`];
    // Xác định màu chữ phụ thuộc vào màu nền (Light/Dark)
    const isDark = col && getContrastYIQ(col) === '#FFFFFF';
    const textColor = col ? (isDark ? '#FFF' : '#1D1D1F') : 'var(--text-main)';
    const textMutedColor = col ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)') : 'var(--text-muted)';
    const borderColor = col ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'var(--border)';
    const btnBg = col ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'var(--bg-hover)';

    const tagsList = getFileTags(file.repoName, file.fileName);
    const dateFmt = file.fullDate?.split(' ')[0] || '';

    return (
      <div key={file.sha} className="cms-card p-4 flex flex-col relative transition bg-[var(--bg-card)] cursor-pointer group hover:scale-[1.01] shadow-sm hover:shadow-md" onClick={() => window.open(file.url, '_blank')} style={{backgroundColor: col || 'var(--bg-card)', color: textColor, border: `1px solid ${borderColor}`}}>
        
        {/* TIÊU ĐỀ LÀ VUA */}
        <div className="flex-1 min-w-0 mb-3">
            <h4 className="font-bold text-[16px] leading-snug line-clamp-3" style={{color: textColor}}>
                {file.name}
            </h4>
        </div>
        
        {/* FOOTER NÉN: KHO + NGÀY + TAGS -> TRÊN CÙNG 1 HOẶC 2 DÒNG */}
        <div className="mt-auto pt-3 border-t flex justify-between items-end gap-2" style={{borderColor: borderColor}}>
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                {/* Dòng 1: Kho & Ngày */}
                <div className="flex items-center gap-2" style={{color: textMutedColor}}>
                    <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <svg className="w-2.5 h-2.5"><use href="#icon-folder"></use></svg> {file.repoName}
                    </span>
                    <span className="text-[9px] font-mono flex items-center gap-1">
                        {dateFmt} {isP && <svg className="w-2 h-2 text-[#FF9500]"><use href="#icon-pin-filled"></use></svg>}
                    </span>
                </div>
                
                {/* Dòng 2: Tags (Nén sát) */}
                {tagsList.length > 0 && (
                   <div className="flex flex-wrap gap-1">
                       {tagsList.map(t => <span key={t} className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold" style={{backgroundColor: btnBg, color: textColor}}>{t}</span>)}
                   </div>
                )}
            </div>

            {/* NÚT THAO TÁC GÓC PHẢI */}
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={(e)=>{e.stopPropagation(); togglePin(file.repoName, file.fileName);}} className="transition hover:scale-110" style={{color: isP ? '#FF9500' : textMutedColor}}><svg className="w-4 h-4"><use href={isP ? "#icon-pin-filled" : "#icon-pin"}></use></svg></button>
                <button onClick={(e)=>{e.stopPropagation(); setActiveModal({type: 'color', data: file});}} className="hover:scale-110 transition" style={{color: textMutedColor}}><svg className="w-4 h-4"><use href="#icon-palette"></use></svg></button>
                {/* NÚT SỬA MỜ, LUÔN HIỂN THỊ */}
                <button onClick={(e)=>{e.stopPropagation(); editFileContent(file.repoName, file.fileName, file.sha);}} className="text-[10px] font-black uppercase transition px-2.5 py-1.5 rounded-md flex items-center gap-1 opacity-50 hover:opacity-100" style={{backgroundColor: btnBg, color: textColor}}><svg className="w-3 h-3"><use href="#icon-edit"></use></svg>Sửa</button>
            </div>
        </div>
      </div>
    );
  };

  // --- RENDER GIAO DIỆN CHÍNH LÕI ---
  const renderViews = () => {
    if (processedFiles.length === 0) return <div className="text-center py-20 text-muted font-bold text-sm">Trống</div>;
    return (
      <div className="flex flex-col gap-8">
        {pinnedFiles.length > 0 && (
            <details open className="mb-2 outline-none">
                <summary className="font-bold text-lg mb-4 border-b border-gray-200 dark:border-gray-800 pb-2 cursor-pointer outline-none text-[#FF9500] flex items-center gap-2">
                    <svg className="w-5 h-5"><use href="#icon-pin-filled"></use></svg> 📌 Đã ghim <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-[var(--text-main)] ml-2">{pinnedFiles.length}</span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{pinnedFiles.map(f => renderCard(f))}</div>
            </details>
        )}
        
        {Object.keys(groupedFilesByRepo).map(r => (
            <details key={r} open className="mb-2 outline-none">
                <summary className="font-bold text-lg mb-4 border-b border-gray-200 dark:border-gray-800 pb-2 cursor-pointer outline-none flex items-center gap-2 text-[var(--text-main)]">
                    <svg className="w-5 h-5 opacity-70"><use href="#icon-folder"></use></svg> {r} <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-[var(--text-muted)] ml-2">{groupedFilesByRepo[r].length}</span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{groupedFilesByRepo[r].map(f => renderCard(f))}</div>
            </details>
        ))}
      </div>
    );
  };

  if (!isAuthenticated) return ( <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[#FDFCF9] dark:bg-[#1D1D1F]"><div className="bg-white dark:bg-gray-900 p-10 max-w-sm w-full mx-4 text-center rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800"><h2 className="text-2xl font-bold mb-6 text-black dark:text-white">Workspace</h2><input type="password" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-center text-3xl font-bold px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-6 border border-gray-200 dark:border-gray-700 outline-none text-black dark:text-white" /><button onClick={handleLogin} className="w-full py-4 bg-[#007AFF] text-white rounded-xl font-bold">Mở Khóa</button></div></div> );

  return (
    <div className="flex-col w-full min-h-screen fade-in flex bg-[var(--bg-body)]">
      <SVGIcons />
      {/* HEADER */}
      <header className="bg-[var(--bg-card)] border-b border-[var(--border)] pt-4 pb-3 px-4 md:px-8 flex flex-col md:flex-row items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--accent)]">vietndj</h1>
        <div className="flex-1 flex w-full items-center bg-[var(--bg-hover)] rounded-xl px-4 py-2"><svg className="svg-icon text-[var(--text-muted)]"><use href="#icon-search"></use></svg><input id="search-input-main" type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Tìm kiếm... (Ctrl K)" className="bg-transparent border-none outline-none text-sm w-full ml-3 font-bold text-[var(--text-main)] placeholder-[var(--text-muted)]" /></div>
        <div className="flex items-center gap-2 relative" ref={toolsMenuRef}>
          <button onClick={loadDatabase} className="px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)]">↻ Tải DB</button>
          <button onClick={()=>setIsTasksOpen(!isTasksOpen)} className="px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)]">📝 Việc</button>
          <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)]">Công cụ ▾</button>
          {isToolsOpen && ( <div className="absolute right-0 top-full mt-2 w-56 p-2 z-[100] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 fade-in"><div className="flex gap-1 px-1 mb-3"><button onClick={() => changeTheme('light')} className="flex-1 py-1.5 rounded text-[11px] font-bold border border-gray-200 dark:border-gray-700 text-black dark:text-white">Sáng</button><button onClick={() => changeTheme('dark')} className="flex-1 py-1.5 rounded text-[11px] font-bold border border-gray-200 dark:border-gray-700 text-black dark:text-white">Tối</button></div><button onClick={() => window.open('https://vietndj.github.io/tin.html', '_blank')} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-black dark:text-white">📖 Mở Reader</button><button onClick={() => { setIsExportModalOpen(true); setIsToolsOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-[#8E44AD] hover:bg-gray-100 dark:hover:bg-gray-800 rounded">🤖 Xuất Sách AI</button><hr className="my-1 border-t border-gray-200 dark:border-gray-700"/><button onClick={() => {localStorage.removeItem("cms_auth"); setIsAuthenticated(false);}} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">🔒 Khóa App</button></div> )}
        </div>
      </header>

      {/* BỘ LỌC */}
      <nav className="bg-[var(--bg-body)] border-b border-[var(--border)] py-2 px-4 md:px-8 sticky top-0 z-40 flex flex-col gap-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">KHO</span>{repoKeysList.map(r => <button key={r} onClick={() => setActiveRepo(activeRepo===r?'all':r)} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${activeRepo===r?'bg-[var(--accent)] text-white':'bg-[var(--bg-hover)] text-[var(--text-main)]'}`}>{r}</button>)}</div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">TAG</span>{allUniqueTags.map(t => <button key={t} onClick={() => setActiveTag(activeTag===t?'all':t)} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${activeTag===t?'bg-[var(--accent)] text-white':'bg-[var(--bg-hover)] text-[var(--text-main)]'}`}>{t}</button>)}</div>
      </nav>
      
      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto items-start w-full relative pb-20 mt-6">
        <main className="flex-1 w-full min-w-0 flex flex-col gap-8">
          
          {/* EDITOR TỐI ƯU UX TỘT ĐỘ */}
          <section className="cms-card overflow-hidden border border-[var(--border)]">
            <button onClick={() => setIsEditorOpen(!isEditorOpen)} className="w-full px-6 py-3 flex justify-between items-center bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] font-bold text-[var(--accent)] outline-none">
                <span className="flex items-center gap-2">
                    <svg className="svg-icon"><use href="#icon-edit"></use></svg> Soạn thảo HTML <span className="text-[9px] text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono ml-2 uppercase bg-[var(--bg-body)]">Ctrl E</span>
                </span>
                <span>{isEditorOpen?'▲':'▼'}</span>
            </button>
            {isEditorOpen && (
              <div className="p-5 flex flex-col gap-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
                <div className="flex flex-wrap gap-2">{repoKeysList.map(r => <button key={r} onClick={() => setRepo(`${username}/${r}`)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border ${repo===`${username}/${r}`?'bg-[var(--accent)] text-white border-transparent':'bg-[var(--bg-hover)] text-[var(--text-muted)] border-transparent hover:opacity-80'}`}>{r}</button>)}</div>
                
                {/* TEXTAREA FOCUS ĐẦU TIÊN */}
                <textarea 
                    ref={editorInputRef} rows="10" 
                    value={content} onChange={handleContentChange} 
                    className="w-full p-4 bg-[#1D1D1F] text-[#34C759] rounded-xl font-mono text-sm outline-none shadow-inner" 
                    placeholder="Mở soạn thảo (Ctrl E) -> Dán HTML (Ctrl V) -> Lưu (Ctrl S)... Tiêu đề tự bóc từ thẻ <title>..."
                ></textarea>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" value={title} onChange={(e)=>setTitle(e.target.value)} className="px-4 py-3 bg-[var(--bg-hover)] rounded-xl text-sm font-bold outline-none text-[var(--text-main)] placeholder-[var(--text-muted)]" placeholder="Tiêu đề (có thể sửa sau)" />
                    <input type="text" value={tags} onChange={(e)=>setTags(e.target.value)} className="px-4 py-3 bg-[var(--bg-hover)] rounded-xl text-sm font-bold text-[var(--accent)] outline-none placeholder-[var(--text-muted)]" placeholder="Nhãn (cách bằng dấu phẩy)..." />
                </div>
                
                <div className="flex justify-between items-center pt-2">
                   <button id="btn-save-article" onClick={handleSaveArticle} disabled={isSaving} className="bg-[var(--accent)] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg text-sm transition hover:scale-105 disabled:opacity-50">
                      {isSaving?'⏳ Đang lưu...':'🚀 LƯU BÀI LÊN GITHUB (Ctrl S)'}
                   </button>
                   {editorOriginal.sha && <button onClick={()=>setEditorOriginal({repo:'',filename:'',sha:''})} className="text-red-500 text-xs font-bold px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">✕ HỦY SỬA</button>}
                </div>
              </div>
            )}
          </section>

          {/* MAIN GRID */}
          {renderViews()}
        </main>

        {/* CỘT TASK (GHI CHÚ NHANH) */}
        {isTasksOpen && (
          <aside className="w-full lg:w-[300px] shrink-0 sticky top-[120px] h-[calc(100vh-140px)] fade-in">
             <div className="bg-[var(--bg-card)] p-4 flex flex-col h-full border border-[var(--border)] rounded-2xl">
                <div className="flex justify-between items-center mb-4"><h2 className="text-[11px] font-black text-[var(--accent)] uppercase tracking-widest">📝 Ghi chú</h2><button onClick={()=>setIsTasksOpen(false)} className="text-[var(--text-muted)] font-bold">✕</button></div>
                <div className="flex gap-2 mb-4"><input type="text" value={nativeTaskInput} onChange={e=>setNativeTaskInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && nativeTaskInput){const n=[{id:Date.now(),title:nativeTaskInput,completed:false},...db.tasks]; saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n}); setNativeTaskInput('');}}} className="flex-1 bg-[var(--bg-hover)] text-[var(--text-main)] px-3 py-2 rounded-lg text-xs outline-none" placeholder="Nhập ghi chú nhanh..." /></div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {db.tasks.map(t => <div key={t.id} className="p-2.5 flex gap-2 rounded-xl text-[11px] font-medium leading-snug bg-[var(--bg-hover)] text-[var(--text-main)] group"><input type="checkbox" checked={t.completed} onChange={()=>{const n=db.tasks.map(x=>x.id===t.id?{...x,completed:!x.completed}:x); saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n});}} className="mt-0.5 accent-[var(--accent)] w-3.5 h-3.5" /><span className="flex-1">{t.title}</span><button onClick={()=>{const n=db.tasks.filter(x=>x.id!==t.id); saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n});}} className="text-red-500 font-bold opacity-0 group-hover:opacity-100 px-1">✕</button></div>)}
                </div>
             </div>
          </aside>
        )}
      </div>

      {/* MODAL MÀU SẮC LÕI (Bắt buộc dùng màu Solid Trắng/Đen) */}
      {activeModal.type === 'color' && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={()=>setActiveModal({type:null,data:null})}>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-xs shadow-2xl border border-gray-200 dark:border-gray-800" onClick={e=>e.stopPropagation()}>
                <h4 className="font-bold mb-4 text-gray-900 dark:text-white text-center text-sm">Gắn màu cho thẻ bài viết</h4>
                <div className="grid grid-cols-5 gap-3">
                    {[null, '#F2F2F7', '#FFD8BF', '#FFE58F', '#D9F7BE', '#BAE7FF', '#D6E4FF', '#EFDBFF', '#FFD6E7', '#1D1D1F'].map((c, i) => (
                        <button key={i} onClick={()=>handleSetColor(`${activeModal.data.repoName}/${activeModal.data.fileName}`, c)} className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 shadow-inner flex items-center justify-center transition hover:scale-110" style={{backgroundColor: c || '#F9FAFB'}}>
                            {c === null && <span className="text-gray-500 text-[10px] font-bold">Xóa</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* MODAL XUẤT SÁCH AI LÕI (Bắt buộc dùng màu Solid Trắng/Đen) */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={()=>{if(!status.text) {setIsExportModalOpen(false); setExportResult(null);}}}>
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-800" onClick={e=>e.stopPropagation()}>
            <h3 className="text-xl font-black mb-2 text-gray-900 dark:text-white flex items-center gap-2">🤖 XUẤT SÁCH AI</h3>
            
            {!exportResult ? (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">Tính năng này sẽ quét trực tiếp mã nguồn để gom tất cả bài viết thành 1 file .txt sạch. Hoàn hảo để dùng với NotebookLM.</p>
                  
                  <select value={exportTarget} onChange={(e)=>setExportTarget(e.target.value)} className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold mb-6 outline-none">
                      <option value="all">📚 Xuất Toàn Bộ Các Kho</option>
                      {repoKeysList.map(r => <option key={r} value={r}>📁 Chỉ xuất Kho: {r}</option>)}
                  </select>
                  
                  <div className="flex gap-2">
                     <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-3.5 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-sm transition hover:opacity-80">Hủy</button>
                     <button onClick={handleExportAI} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg transition hover:bg-blue-700">BẮT ĐẦU ĐÓNG GÓI</button>
                  </div>
                </>
            ) : (
                <div className="text-center py-4">
                    <div className="text-5xl mb-4 text-green-500">🎉</div>
                    <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Thành công!</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Đã gom thành công <b className="text-gray-900 dark:text-white">{exportResult.count}</b> bài viết vào 1 file.</p>
                    <a href={exportResult.url} download={exportResult.filename} className="block w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-base shadow-xl transition hover:scale-105" onClick={() => { setTimeout(()=>{setIsExportModalOpen(false); setExportResult(null)}, 500) }}>
                        ⬇️ TẢI FILE SÁCH (.TXT)
                    </a>
                </div>
            )}
          </div>
        </div>
      )}

      {status.text && <div className="fixed bottom-6 left-6 z-[99999] bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-2xl border-l-4 border-[#007AFF] font-bold text-xs fade-in text-gray-900 dark:text-white">{status.text}</div>}
      
    </div>
  );
}
