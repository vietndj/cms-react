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
    <symbol id="icon-link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></symbol>
    <symbol id="icon-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></symbol>
    <symbol id="icon-folder" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></symbol>
    <symbol id="icon-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></symbol>
    <symbol id="icon-pin" viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></symbol>
    <symbol id="icon-pin-filled" viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22" stroke="currentColor"></line><path fill="currentColor" stroke="none" d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></symbol>
    <symbol id="icon-palette" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></symbol>
  </svg>
);

// ==========================================
// Hàm hỗ trợ tự động bốc Repo & Tag gần nhất
// ==========================================
const getLastContextFromDB = (currentDb) => {
    const files = currentDb.files || [];
    const tagsDb = currentDb.tags || {};
    const latestNormal = files.find(f => f.repoName !== `${username}.github.io` && f.repoName !== username);
    if (latestNormal) {
        return {
            repo: `${username}/${latestNormal.repoName}`,
            tags: (tagsDb[`${latestNormal.repoName}/${latestNormal.fileName}`] || []).join(', ')
        };
    }
    return { repo: `${username}/${username}.github.io`, tags: '' };
};

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

  const [activeColorPickerCard, setActiveColorPickerCard] = useState(null); 

  // EDITOR STATES 
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [repo, setRepo] = useState(() => localStorage.getItem('cms_last_repo') || `${username}/${username}.github.io`);
  const [tags, setTags] = useState(() => localStorage.getItem('cms_last_tags') || ''); 
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugEdited, setIsSlugEdited] = useState(false); 
  const [uploadLinks, setUploadLinks] = useState([]); 
  const [content, setContent] = useState('');
  const [editorOriginal, setEditorOriginal] = useState({ repo: '', filename: '', sha: '' });

  const toolsMenuRef = useRef(null);
  const editorInputRef = useRef(null); 

  useEffect(() => {
    if (isEditorOpen && editorInputRef.current) setTimeout(() => editorInputRef.current.focus(), 100);
  }, [isEditorOpen]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
        const isCmd = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? e.metaKey : e.ctrlKey;
        if (isCmd && e.key.toLowerCase() === 'e') { e.preventDefault(); setIsEditorOpen(prev => !prev); }
        if (isCmd && e.key.toLowerCase() === 's') { e.preventDefault(); document.getElementById('btn-save-article')?.click(); }
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
  const changeTheme = (theme) => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('cms_theme', theme); setIsToolsOpen(false); };
  const saveLocalDb = (newDb) => { try { localStorage.setItem('cms_repo_data', JSON.stringify(newDb)); setDb(newDb); } catch(e) { setDb(newDb); } };

  const loadDatabase = async () => {
    if (!token || isSyncing) return;
    setIsSyncing(true); setStatus({ text: 'Đang tải Database...', type: 'loading' });
    try {
      const meta = await fetchRawJSON(`${username}/${username}.github.io`, 'metadata.json', token);
      const dbData = await fetchRawJSON(`${username}/${username}.github.io`, 'cms_db.json', token);
      if (dbData && dbData.allFiles) {
        const reposMap = {}; dbData.allFiles.forEach(f => { if(!reposMap[f.repoName]) reposMap[f.repoName] = []; reposMap[f.repoName].push(f); });
        const loadedDb = { files: dbData.allFiles, repos: reposMap, tags: meta?.tags || {}, pinned: meta?.pinned || [], links: meta?.links || {}, colors: meta?.colors || {}, titles: meta?.titles || {}, tasks: meta?.tasks || [], customCol: meta?.customCol || [] };
        saveLocalDb(loadedDb);
        
        if (!title && !content && !editorOriginal.sha) {
            const ctx = getLastContextFromDB(loadedDb);
            setRepo(ctx.repo);
            setTags(ctx.tags);
        }

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

  const handleSetColor = async (fileKey, color) => {
      const newColors = { ...db.colors };
      if (color) newColors[fileKey] = color; else delete newColors[fileKey];
      const newState = { ...db, colors: newColors };
      setDb(newState);
      await syncMetaAndDB(newState);
      saveLocalDb(newState);
      setActiveColorPickerCard(null); 
  };

  // --- LOGIC TITLE, SLUG & NHÃN ---
  const generateSlug = (val, currentTags) => {
    let s = val.toLowerCase().replace(/[áàảạãăắằẳẵặâấầẩẫậ]/gi,'a').replace(/[éèẻẽẹêếềểễệ]/gi,'e').replace(/[iíìỉĩị]/gi,'i').replace(/[óòỏõọôốồổỗộơớờởỡợ]/gi,'o').replace(/[úùủũụưứừửữự]/gi,'u').replace(/[ýỳỷỹỵ]/gi,'y').replace(/đ/gi,'d').replace(/\s+/g,'-').replace(/[^\w\-]+/g,'').replace(/\-\-+/g,'-').replace(/^-+|-+$/g,'');
    let tagArr = currentTags.split(',').map(x=>x.trim()).filter(Boolean);
    if(tagArr.length && s) { let ts = tagArr.join('-').toLowerCase().replace(/\s+/g,'-'); if(!s.includes(ts)) s += '-' + ts; }
    return s;
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!isSlugEdited) setSlug(generateSlug(val, tags));
  };

  const handleSlugChange = (e) => {
    setSlug(e.target.value);
    setIsSlugEdited(true); 
  };

  const toggleTagEditor = (t) => {
    let currentTags = tags.split(',').map(x => x.trim()).filter(Boolean);
    if (currentTags.includes(t)) {
        currentTags = currentTags.filter(x => x !== t);
    } else {
        currentTags.push(t);
    }
    const newTagsStr = currentTags.join(', ');
    setTags(newTagsStr);
    if (!isSlugEdited) setSlug(generateSlug(title, newTagsStr));
  };

  const handleContentChange = (e) => {
    const val = e.target.value; setContent(val);
    if (!title.trim() && val.includes('<title>')) {
        const match = val.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (match && match[1]) {
            const extractedTitle = match[1].trim();
            setTitle(extractedTitle);
            if (!isSlugEdited) setSlug(generateSlug(extractedTitle, tags));
        }
    }
  };

  const handleUpdateLink = (index, field, value) => {
      const newLinks = [...uploadLinks];
      newLinks[index][field] = value;
      setUploadLinks(newLinks);
  };
  const handleRemoveLink = (index) => setUploadLinks(uploadLinks.filter((_, i) => i !== index));
  const handleAddLink = () => setUploadLinks([...uploadLinks, { title: `Link ${uploadLinks.length + 1}`, url: '' }]);

  // --- HỦY SỬA BÀI (TRỞ VỀ TRẠNG THÁI RỖNG, KHÔI PHỤC TAG & REPO GẦN NHẤT) ---
  const cancelEdit = () => {
    setTitle('');
    setSlug('');
    setContent('');
    setUploadLinks([]);
    setIsSlugEdited(false);
    setEditorOriginal({ repo: '', filename: '', sha: '' });
    applyLatestTagAndRepo();
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
        delete db.tags[oldKey]; delete db.titles[oldKey]; delete db.colors[oldKey]; delete db.links[oldKey];
        db.pinned = db.pinned.filter(x => x !== oldKey);
      }

      setStatus({ text: 'Đang đồng bộ Metadata & CMS DB...', type: 'loading' });
      
      let newTags = { ...db.tags }; let tagArr = tags.split(',').map(x => x.trim()).filter(Boolean);
      if (tagArr.length) newTags[fileKey] = tagArr; else delete newTags[fileKey];
      
      let newTitles = { ...db.titles }; newTitles[fileKey] = title;

      let newLinksDb = { ...db.links };
      let validLinks = uploadLinks.filter(l => l.title.trim() && l.url.trim());
      if (validLinks.length) newLinksDb[fileKey] = validLinks; else delete newLinksDb[fileKey];
      
      let newFiles = [...db.files].filter(f => f.sha !== (resHTMLData.content?.sha || fileSha));
      const dDate = new Date();
      newFiles.unshift({ repoName: rName, name: title, fileName: filename, sha: resHTMLData.content?.sha || fileSha, url: `https://${rOwner}.github.io/${rName === `${rOwner}.github.io` ? '' : rName + '/'}${filename}`, timestamp: dDate.getTime(), fullDate: dDate.toLocaleString('vi-VN') });

      const newState = { ...db, files: newFiles, tags: newTags, titles: newTitles, links: newLinksDb };
      await syncMetaAndDB(newState); saveLocalDb(newState);

      // CẬP NHẬT BỘ NHỚ
      localStorage.setItem('cms_last_repo', `${rOwner}/${rName}`);
      localStorage.setItem('cms_last_tags', tags);

      setStatus({ text: '✅ Đăng bài thành công!', type: 'success' });
      
      setTitle(''); setSlug(''); setContent(''); setUploadLinks([]); setIsSlugEdited(false); setEditorOriginal({ repo:'', filename:'', sha:'' });
      applyLatestTagAndRepo(newState); 
      
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
        const fileKey = `${rName}/${f}`;
        
        setRepo(rp); 
        setTitle(db.titles[fileKey] || f.replace('.html','')); 
        setSlug(f.replace('.html','')); 
        setIsSlugEdited(true);
        setTags((db.tags[fileKey] || []).join(', '));
        setUploadLinks(db.links[fileKey] ? JSON.parse(JSON.stringify(db.links[fileKey])) : []);

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

  const repoKeysList = useMemo(() => { const keys = Object.keys(db.repos || {}); if (!keys.includes(`${username}.github.io`)) keys.unshift(`${username}.github.io`); return keys; }, [db.repos]);
  const allUniqueTags = useMemo(() => { const s = new Set(); Object.values(db.tags).forEach(a => a.forEach(t => s.add(t))); return Array.from(s).sort(); }, [db.tags]);
  const getFileTags = (r, f) => db.tags[`${r}/${f}`] || [];
  const getFileLinks = (r, f) => db.links[`${r}/${f}`] || []; 

  const processedFiles = useMemo(() => {
    let f = db.files.filter(f => (activeRepo === 'all' || f.repoName === activeRepo) && (activeTag === 'all' || getFileTags(f.repoName, f.fileName).includes(activeTag)) && (!searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())));
    return f.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [db.files, activeRepo, activeTag, searchQuery, db.tags]);

  const recentFiles = useMemo(() => (activeTag==='all' && activeRepo==='all' && !searchQuery) ? [...db.files].sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)).slice(0, 8) : [], [db.files, activeRepo, activeTag, searchQuery]);
  const pinnedFiles = useMemo(() => processedFiles.filter(f => db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  const unpinnedFiles = useMemo(() => processedFiles.filter(f => !db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  
  const groupedFilesByRepo = useMemo(() => { 
    const groups = {}; 
    unpinnedFiles.forEach(f => { if (!groups[f.repoName]) groups[f.repoName] = []; groups[f.repoName].push(f); }); 
    const sortedRepoNames = Object.keys(groups).sort((a, b) => Math.max(...groups[b].map(f => f.timestamp || 0)) - Math.max(...groups[a].map(f => f.timestamp || 0)));
    const sortedGroups = {}; sortedRepoNames.forEach(r => sortedGroups[r] = groups[r]);
    return sortedGroups; 
  }, [unpinnedFiles]);

  const renderCard = (file, isRecent = false) => {
    const fileKey = `${file.repoName}/${file.fileName}`;
    const isP = db.pinned.includes(fileKey);
    const col = db.colors[fileKey];
    const isColorPickerOpen = activeColorPickerCard === fileKey;
    
    const isDark = col && getContrastYIQ(col) === '#FFFFFF';
    const textColor = col ? (isDark ? '#FFF' : '#1D1D1F') : 'var(--text-main)';
    const textMutedColor = col ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)') : 'var(--text-muted)';
    const borderColor = col ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'var(--border)';
    const btnBg = col ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'var(--bg-hover)';

    const tagsList = getFileTags(file.repoName, file.fileName);
    const linksList = getFileLinks(file.repoName, file.fileName);
    const dateFmt = file.fullDate?.split(' ')[0] || '';

    if (isRecent) {
      return (
        <div key={file.sha} className="cms-card p-3 min-w-[220px] max-w-[220px] flex flex-col transition border cms-border hover:border-[var(--accent)] bg-[var(--bg-card)] cursor-pointer" onClick={() => window.open(file.url, '_blank')}>
          <h4 className="font-bold text-sm leading-snug line-clamp-2 mb-3 text-[var(--text-main)] flex-1">{file.name}</h4>
          <div className="flex justify-between items-center mt-auto border-t border-black/5 dark:border-white/5 pt-2">
             <div className="flex items-center gap-1.5 opacity-60">
                 <svg className="w-2.5 h-2.5"><use href="#icon-folder"></use></svg>
                 <span className="text-[9px] uppercase font-bold tracking-tight">{file.repoName}</span>
             </div>
             <button onClick={(e)=>{e.stopPropagation(); editFileContent(file.repoName, file.fileName, file.sha)}} className="text-[9px] font-black uppercase text-[var(--text-main)] px-2 py-1 rounded border cms-border opacity-50 hover:opacity-100 transition">Sửa</button>
          </div>
        </div>
      );
    }

    return (
      <div key={file.sha} className="cms-card p-4 flex flex-col relative transition border cms-border hover:border-[var(--accent)] bg-[var(--bg-card)] cursor-pointer group shadow-sm" onClick={() => window.open(file.url, '_blank')} style={{backgroundColor: col || 'var(--bg-card)', color: textColor, border: `1px solid ${borderColor}`}}>
        <div className="flex-1 min-w-0 mb-4">
            <h4 className="font-bold text-[16px] leading-[1.3] line-clamp-3" style={{color: textColor}}>{file.name}</h4>
        </div>

        {linksList.length > 0 && (
            <div className="flex flex-col gap-1 mb-3">
                {linksList.map((lnk, idx) => (
                    <a key={idx} href={lnk.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] font-bold py-1 px-2 rounded-lg flex items-center gap-1.5 hover:opacity-80 transition truncate" style={{backgroundColor: btnBg, color: 'var(--accent)'}}>
                        <svg className="w-3 h-3"><use href="#icon-link"></use></svg> {lnk.title}
                    </a>
                ))}
            </div>
        )}
        
        <div className="mt-auto pt-3 border-t flex justify-between items-end gap-2" style={{borderColor: borderColor}}>
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{color: textMutedColor}}>
                    <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <svg className="w-2.5 h-2.5"><use href="#icon-folder"></use></svg> {file.repoName}
                    </span>
                    <span className="text-[9px] font-mono flex items-center gap-1 opacity-80">
                        {dateFmt} {isP && <svg className="w-2 h-2 text-[#FF9500]"><use href="#icon-pin-filled"></use></svg>}
                    </span>
                </div>
                {tagsList.length > 0 && (
                   <div className="flex flex-wrap gap-1">
                       {tagsList.map(t => <span key={t} className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold" style={{backgroundColor: btnBg, color: textColor}}>{t}</span>)}
                   </div>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={(e)=>{e.stopPropagation(); togglePin(file.repoName, file.fileName);}} className="transition hover:scale-110" style={{color: isP ? '#FF9500' : textMutedColor}}><svg className="w-4 h-4"><use href={isP ? "#icon-pin-filled" : "#icon-pin"}></use></svg></button>
                <button onClick={(e)=>{e.stopPropagation(); setActiveColorPickerCard(isColorPickerOpen ? null : fileKey);}} className={`transition opacity-40 hover:opacity-100 ${isColorPickerOpen ? 'scale-110 opacity-100' : 'hover:scale-110'}`} style={{color: isColorPickerOpen ? 'var(--accent)' : textMutedColor}}><svg className="w-4 h-4"><use href="#icon-palette"></use></svg></button>
                <button onClick={(e)=>{e.stopPropagation(); editFileContent(file.repoName, file.fileName, file.sha);}} className="text-[10px] font-black uppercase transition px-2.5 py-1.5 rounded-md flex items-center gap-1 opacity-40 hover:opacity-100 hover:scale-105" style={{backgroundColor: btnBg, color: textColor}}><svg className="w-3 h-3"><use href="#icon-edit"></use></svg>Sửa</button>
            </div>
        </div>

        {isColorPickerOpen && (
            <div className="mt-4 pt-4 border-t fade-in" style={{borderColor: borderColor}} onClick={e => e.stopPropagation()}>
               <div className="flex flex-wrap gap-2 justify-center">
                  {[null, '#F2F2F7', '#FFD8BF', '#FFE58F', '#D9F7BE', '#BAE7FF', '#D6E4FF', '#EFDBFF', '#FFD6E7', '#1D1D1F'].map((c, i) => (
                    <button key={i} onClick={() => handleSetColor(fileKey, c)} className="w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer hover:scale-125 transition" style={{ backgroundColor: c || 'var(--bg-hover)', borderColor: c ? 'transparent' : 'var(--border)' }}>
                      {c === null && <span className="text-[8px] font-bold text-[var(--text-muted)] leading-none">✕</span>}
                    </button>
                  ))}
               </div>
            </div>
        )}
      </div>
    );
  };

  const renderViews = () => {
    if (processedFiles.length === 0) return <div className="text-center py-20 text-[var(--text-muted)] font-bold text-sm">Trống</div>;
    return (
      <div className="flex flex-col gap-8">
        {pinnedFiles.length > 0 && (
            <details open className="mb-2 outline-none">
                <summary className="font-bold text-lg mb-4 border-b border-[var(--border)] pb-2 cursor-pointer outline-none text-[#FF9500] flex items-center gap-2">
                    <svg className="w-5 h-5"><use href="#icon-pin-filled"></use></svg> 📌 Đã ghim <span className="text-xs px-2 py-0.5 rounded-full border cms-border text-[var(--text-main)] ml-2">{pinnedFiles.length}</span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{pinnedFiles.map(f => renderCard(f))}</div>
            </details>
        )}
        {Object.keys(groupedFilesByRepo).map(r => (
            <details key={r} open className="mb-2 outline-none">
                <summary className="font-bold text-lg mb-4 border-b border-[var(--border)] pb-2 cursor-pointer outline-none flex items-center gap-2 text-[var(--text-main)]">
                    <svg className="w-5 h-5 opacity-70"><use href="#icon-folder"></use></svg> {r} <span className="text-xs px-2 py-0.5 rounded-full border cms-border text-[var(--text-muted)] ml-2">{groupedFilesByRepo[r].length}</span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{groupedFilesByRepo[r].map(f => renderCard(f))}</div>
            </details>
        ))}
      </div>
    );
  };

  if (!isAuthenticated) return ( 
    <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[var(--bg-body)]">
        <div className="cms-card p-10 max-w-sm w-full mx-4 text-center rounded-3xl shadow-2xl border cms-border">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-main)]">Workspace</h2>
            <input 
              type="password" placeholder="••••" value={pin} 
              onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} 
              className="w-full text-center text-3xl font-bold px-4 py-4 bg-[var(--bg-hover)] rounded-2xl mb-6 border cms-border outline-none text-[var(--text-main)] tracking-widest" 
            />
            <button onClick={handleLogin} className="w-full py-4 bg-[var(--accent)] text-white rounded-xl font-bold shadow-md hover:opacity-90 transition">Mở Khóa</button>
        </div>
    </div> 
  );

  return (
    <div className="flex-col w-full min-h-screen fade-in flex bg-[var(--bg-body)]" onClick={() => setActiveColorPickerCard(null)}>
      <SVGIcons />
      {/* HEADER */}
      <header className="bg-[var(--bg-card)] border-b border-[var(--border)] pt-4 pb-3 px-4 md:px-8 flex flex-col md:flex-row items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--accent)]">vietndj</h1>
        <div className="flex-1 flex w-full items-center bg-[var(--bg-hover)] rounded-xl px-4 py-2"><svg className="svg-icon text-[var(--text-muted)]"><use href="#icon-search"></use></svg><input id="search-input-main" type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Tìm kiếm... (Ctrl K)" className="bg-transparent border-none outline-none text-sm w-full ml-3 font-bold text-[var(--text-main)] placeholder-[var(--text-muted)]" /></div>
        <div className="flex items-center gap-2 relative" ref={toolsMenuRef}>
          <button onClick={loadDatabase} className="px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border)]">↻ Tải DB</button>
          <button onClick={()=>setIsTasksOpen(!isTasksOpen)} className="px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border)]">📝 Việc</button>
          <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border)]">Công cụ ▾</button>
          {isToolsOpen && ( 
              <div className="absolute right-0 top-full mt-2 w-56 p-2 z-[100] cms-card rounded-xl shadow-2xl border cms-border fade-in">
                  <div className="flex gap-1 px-1 mb-3">
                      <button onClick={() => changeTheme('light')} className="flex-1 py-1.5 rounded text-[11px] font-bold border cms-border text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition">Sáng</button>
                      <button onClick={() => changeTheme('dark')} className="flex-1 py-1.5 rounded text-[11px] font-bold border cms-border text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition">Tối</button>
                  </div>
                  <button onClick={() => window.open('https://vietndj.github.io/tin.html', '_blank')} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-[var(--bg-hover)] rounded text-[var(--text-main)] transition">📖 Mở Reader</button>
                  
                  {/* NÚT MỞ TAB XUẤT SÁCH MỚI CÓ LINK TUYỆT ĐỐI */}
                  <button onClick={() => { window.open('https://vietndj.github.io/export.html', '_blank'); setIsToolsOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-[#8E44AD] hover:bg-[var(--bg-hover)] rounded transition">🤖 Xuất Sách AI</button>
                  
                  <hr className="my-1 border-t cms-border"/>
                  <button onClick={() => {localStorage.removeItem("cms_auth"); setIsAuthenticated(false);}} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-[var(--bg-hover)] rounded transition">🔒 Khóa App</button>
              </div> 
          )}
        </div>
      </header>

      {/* BỘ LỌC */}
      <nav className="bg-[var(--bg-body)] border-b border-[var(--border)] py-2 px-4 md:px-8 sticky top-0 z-40 flex flex-col gap-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0">KHO</span>{repoKeysList.map(r => <button key={r} onClick={() => setActiveRepo(activeRepo===r?'all':r)} className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${activeRepo===r?'bg-[var(--accent)] text-white shadow-sm border border-transparent':'bg-[var(--bg-hover)] text-[var(--text-main)] border cms-border hover:opacity-80'}`}>{r}</button>)}</div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0">TAG</span>{allUniqueTags.map(t => <button key={t} onClick={() => setActiveTag(activeTag===t?'all':t)} className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${activeTag===t?'bg-[var(--accent)] text-white shadow-sm border border-transparent':'bg-[var(--bg-hover)] text-[var(--text-main)] border cms-border hover:opacity-80'}`}>{t}</button>)}</div>
      </nav>
      
      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto items-start w-full relative pb-20 mt-6">
        <main className="flex-1 w-full min-w-0 flex flex-col gap-8">
          
          {/* EDITOR SOẠN THẢO */}
          <section className="cms-card overflow-hidden border border-[var(--border)]">
            <button onClick={() => {
                setIsEditorOpen(!isEditorOpen); 
                if (!isEditorOpen && !title && !content && !editorOriginal.sha) {
                    applyLatestTagAndRepo();
                }
            }} className="w-full px-6 py-3 flex justify-between items-center bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] font-bold text-[var(--accent)] outline-none">
                <span className="flex items-center gap-2">
                    <svg className="svg-icon"><use href="#icon-edit"></use></svg> Soạn thảo HTML <span className="text-[9px] text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono ml-2 uppercase bg-[var(--bg-body)]">Ctrl E</span>
                </span>
                <span>{isEditorOpen?'▲':'▼'}</span>
            </button>
            {isEditorOpen && (
              <div className="p-5 flex flex-col gap-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
                <div className="flex flex-wrap gap-2">{repoKeysList.map(r => <button key={r} onClick={() => setRepo(`${username}/${r}`)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border ${repo===`${username}/${r}`?'bg-[var(--accent)] text-white border-transparent':'bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border)] hover:opacity-80'}`}>{r}</button>)}</div>
                
                <textarea 
                    ref={editorInputRef} rows="10" 
                    value={content} onChange={handleContentChange} 
                    className="w-full p-4 bg-[#1D1D1F] text-[#34C759] rounded-xl font-mono text-sm outline-none shadow-inner" 
                    placeholder="Mở soạn thảo (Ctrl E) -> Dán HTML (Ctrl V) -> Lưu (Ctrl S)... Tiêu đề tự bóc từ thẻ <title>..."
                ></textarea>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] ml-1">Tiêu đề</label>
                        <input type="text" value={title} onChange={handleTitleChange} className="px-4 py-3 bg-[var(--bg-hover)] rounded-xl text-sm font-bold outline-none text-[var(--text-main)] border cms-border placeholder-[var(--text-muted)]" placeholder="Tiêu đề bài viết..." />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] ml-1">Slug (URL)</label>
                        <input type="text" value={slug} onChange={handleSlugChange} className="px-4 py-3 bg-[var(--bg-hover)] rounded-xl text-sm font-bold font-mono outline-none text-[var(--accent)] border cms-border placeholder-[var(--text-muted)]" placeholder="slug-cua-bai-viet..." />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl border cms-border bg-[var(--bg-body)]">
                        <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] ml-1">Nhãn (Tags)</label>
                        <input type="text" value={tags} onChange={(e)=>{setTags(e.target.value); if(!isSlugEdited) setSlug(generateSlug(title, e.target.value));}} className="px-3 py-2 bg-[var(--bg-hover)] rounded-lg text-sm font-bold text-[var(--text-main)] outline-none border cms-border placeholder-[var(--text-muted)]" placeholder="AI, React, Note..." />
                        
                        {allUniqueTags.length > 0 && (
                            <div className="mt-2">
                                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-1 block px-1">Gợi ý nhãn có sẵn:</span>
                                <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-24 pr-1">
                                    {allUniqueTags.map(t => {
                                        const isSelected = tags.split(',').map(x=>x.trim()).includes(t);
                                        return (
                                            <button 
                                                key={t} type="button" onClick={() => toggleTagEditor(t)}
                                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition border ${isSelected ? 'bg-[var(--accent)] text-white border-transparent shadow-sm' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]'}`}
                                            >
                                                {t}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl border cms-border bg-[var(--bg-body)]">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] ml-1 flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-link"></use></svg> Link tham khảo</label>
                            <button onClick={handleAddLink} className="text-[10px] font-bold text-[var(--accent)] bg-[var(--bg-hover)] px-2 py-1 rounded border cms-border hover:bg-[var(--bg-card)]">+ Thêm Link</button>
                        </div>
                        {uploadLinks.length === 0 ? (
                             <div className="text-xs text-[var(--text-muted)] italic text-center py-4 opacity-70">Chưa có link đính kèm</div>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
                                {uploadLinks.map((link, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-[var(--bg-card)] border cms-border p-1.5 rounded-lg">
                                        <input type="text" value={link.title} onChange={e => handleUpdateLink(idx, 'title', e.target.value)} placeholder="Tên Link" className="w-1/3 bg-transparent text-xs font-bold outline-none text-[var(--text-main)] px-1" />
                                        <input type="text" value={link.url} onChange={e => handleUpdateLink(idx, 'url', e.target.value)} placeholder="https://..." className="flex-1 bg-transparent text-xs outline-none text-[var(--text-muted)] px-1 border-l cms-border" />
                                        <button onClick={() => handleRemoveLink(idx)} className="text-red-500 font-bold px-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition">✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                   <button id="btn-save-article" onClick={handleSaveArticle} disabled={isSaving} className="bg-[var(--accent)] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg text-sm transition hover:scale-105 disabled:opacity-50 border border-transparent">
                      {isSaving?'⏳ Đang lưu...':'🚀 LƯU BÀI LÊN GITHUB (Ctrl S)'}
                   </button>
                   {editorOriginal.sha && <button onClick={cancelEdit} className="text-red-500 text-xs font-bold px-4 py-2 hover:bg-[var(--bg-hover)] rounded-lg transition">✕ HỦY SỬA (VIẾT BÀI MỚI)</button>}
                </div>
              </div>
            )}
          </section>

          {/* MAIN GRID */}
          {recentFiles.length > 0 && <div className="mb-2"><h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 ml-1">🔥 Vừa Thao Tác</h3><div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">{recentFiles.map(f => renderCard(f, true))}</div></div>}

          {renderViews()}
        </main>

        {/* CỘT TASK */}
        {isTasksOpen && (
          <aside className="w-full lg:w-[300px] shrink-0 sticky top-[120px] h-[calc(100vh-140px)] fade-in">
             <div className="bg-[var(--bg-card)] p-4 flex flex-col h-full border border-[var(--border)] rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4"><h2 className="text-[11px] font-black text-[var(--accent)] uppercase tracking-widest">📝 Ghi chú</h2><button onClick={()=>setIsTasksOpen(false)} className="text-[var(--text-muted)] font-bold hover:text-red-500 transition">✕</button></div>
                <div className="flex gap-2 mb-4"><input type="text" value={nativeTaskInput} onChange={e=>setNativeTaskInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && nativeTaskInput){const n=[{id:Date.now(),title:nativeTaskInput,completed:false},...db.tasks]; saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n}); setNativeTaskInput('');}}} className="flex-1 bg-[var(--bg-hover)] border cms-border text-[var(--text-main)] px-3 py-2 rounded-lg text-xs outline-none" placeholder="Nhập ghi chú nhanh..." /></div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {db.tasks.map(t => <div key={t.id} className="p-2.5 flex gap-2 rounded-xl text-[11px] font-medium leading-snug bg-[var(--bg-hover)] border cms-border text-[var(--text-main)] group hover:border-[var(--accent)] transition"><input type="checkbox" checked={t.completed} onChange={()=>{const n=db.tasks.map(x=>x.id===t.id?{...x,completed:!x.completed}:x); saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n});}} className="mt-0.5 accent-[var(--accent)] w-3.5 h-3.5 cursor-pointer" /><span className={`flex-1 ${t.completed ? 'opacity-50 line-through' : ''}`}>{t.title}</span><button onClick={()=>{const n=db.tasks.filter(x=>x.id!==t.id); saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n});}} className="text-red-500 font-bold opacity-0 group-hover:opacity-100 px-1 transition">✕</button></div>)}
                </div>
             </div>
          </aside>
        )}
      </div>

      {/* TOAST THÔNG BÁO CHUNG */}
      {status.text && (
          <div className={`fixed bottom-6 left-6 z-[999999] cms-card px-5 py-4 shadow-2xl flex items-center gap-3 border-l-4 font-bold text-sm text-[var(--text-main)] fade-in ${status.type === 'error' ? 'border-l-red-500' : 'border-l-[var(--accent)]'}`}>
              <span className="text-lg">{status.type === 'loading' ? '⏳' : status.type === 'error' ? '❌' : '✅'}</span>
              <span>{status.text}</span>
          </div>
      )}
    </div>
  );
}
