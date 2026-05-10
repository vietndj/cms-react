import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  username, SECRET_PIN, safeEnc, encodeBase64UTF8Async, getContrastYIQ, 
  fetchRawJSON, fetchText, getFileShaSafe, getLastContextFromDB, 
  removeAccents, getStringColor, getTimelineLabel, generateSlug 
} from './utils.js'; // Import toàn bộ logic từ file utils.js

// ==========================================
// COMPONENT SVG ICONS
// ==========================================
const SVGIcons = () => (
  <svg style={{ display: 'none' }}>
    <symbol id="icon-folder" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></symbol>
    <symbol id="icon-edit" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></symbol>
    <symbol id="icon-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="2" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="m21 21-4.3-4.3" /></symbol>
    <symbol id="icon-pin" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 17v5"/><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></symbol>
    <symbol id="icon-pin-filled" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 17v5"/><path fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></symbol>
    <symbol id="icon-tag" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M7 7h.01" /></symbol>
    <symbol id="icon-palette" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" /></symbol>
    <symbol id="icon-link" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></symbol>
    <symbol id="icon-list" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></symbol>
    <symbol id="icon-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/></symbol>
    <symbol id="icon-kanban" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2"/><line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="2"/></symbol>
    <symbol id="icon-feed" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/><line x1="9" y1="21" x2="9" y2="9" stroke="currentColor" strokeWidth="2"/></symbol>
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
  const [activeRepo, setActiveRepo] = useState('all');
  const [activeTag, setActiveTag] = useState('all');
  const [currentView, setCurrentView] = useState('grid'); 
  
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [nativeTaskInput, setNativeTaskInput] = useState('');
  const [activeColorPickerCard, setActiveColorPickerCard] = useState(null); 

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
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23007AFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='18' height='18' x='3' y='3' rx='2' ry='2'></rect><path d='M9 15v-6l4 3-4 3Z'></path></svg>";
  }, []);

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
    if (!token) { setStatus({ text: 'Cần có Token GitHub!', type: 'error' }); setTimeout(() => setStatus({ text: '', type: '' }), 3000); return; }
    if (isSyncing) return;
    setIsSyncing(true); setStatus({ text: 'Đang tải Database...', type: 'loading' });
    
    try {
      const meta = await fetchRawJSON(`${username}/${username}.github.io`, 'metadata.json', token);
      const dbData = await fetchRawJSON(`${username}/${username}.github.io`, 'cms_db.json', token);
      
      if (dbData && dbData.allFiles) {
        const uniqueFilesMap = new Map();
        
        dbData.allFiles.forEach(f => {
            const key = `${f.repoName}/${f.fileName}`;
            if (!uniqueFilesMap.has(key) || uniqueFilesMap.get(key).timestamp < f.timestamp) {
                uniqueFilesMap.set(key, f);
            }
        });
        
        const cleanFiles = Array.from(uniqueFilesMap.values()).sort((a, b) => b.timestamp - a.timestamp);
        const reposMap = {}; cleanFiles.forEach(f => { if(!reposMap[f.repoName]) reposMap[f.repoName] = []; reposMap[f.repoName].push(f); });
        
        const loadedDb = { files: cleanFiles, repos: reposMap, tags: meta?.tags || {}, pinned: meta?.pinned || [], links: meta?.links || {}, colors: meta?.colors || {}, titles: meta?.titles || {}, tasks: meta?.tasks || [], customCol: meta?.customCol || [] };
        
        saveLocalDb(loadedDb);
        if (!title && !content && !editorOriginal.sha) { const ctx = getLastContextFromDB(loadedDb); setRepo(ctx.repo); setTags(ctx.tags); }

        if (cleanFiles.length < dbData.allFiles.length) {
            const dbContent = await encodeBase64UTF8Async(JSON.stringify({ allFiles: cleanFiles }));
            const dbSha = await getFileShaSafe(`${username}/${username}.github.io`, 'cms_db.json', token);
            await fetch(`https://api.github.com/repos/${username}/${username}.github.io/contents/cms_db.json`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Auto-Clean Duplicates', content: dbContent, sha: dbSha || undefined }) });
        }

        setStatus({ text: 'Đã đồng bộ xong!', type: 'success' }); setTimeout(() => setStatus({ text: '', type: '' }), 3000);
      }
    } catch (e) { setStatus({ text: `Lỗi DB: ${e.message}`, type: 'error' }); setTimeout(() => setStatus({ text: '', type: '' }), 5000); } finally { setIsSyncing(false); }
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
      setDb(newState); await syncMetaAndDB(newState); saveLocalDb(newState); setActiveColorPickerCard(null); 
  };

  const handleTitleChange = (e) => { setTitle(e.target.value); if (!isSlugEdited) setSlug(generateSlug(e.target.value, tags)); };
  const handleSlugChange = (e) => { setSlug(e.target.value); setIsSlugEdited(true); };
  const toggleTagEditor = (t) => {
    let currentTags = tags.split(',').map(x => x.trim()).filter(Boolean);
    if (currentTags.includes(t)) currentTags = currentTags.filter(x => x !== t); else currentTags.push(t);
    const newTagsStr = currentTags.join(', '); setTags(newTagsStr);
    if (!isSlugEdited) setSlug(generateSlug(title, newTagsStr));
  };

  const handleContentChange = (e) => {
    const val = e.target.value; setContent(val);
    if (!title.trim() && val.includes('<title>')) {
        const match = val.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (match && match[1]) { const extractedTitle = match[1].trim(); setTitle(extractedTitle); if (!isSlugEdited) setSlug(generateSlug(extractedTitle, tags)); }
    }
  };

  const handleUpdateLink = (index, field, value) => { const newLinks = [...uploadLinks]; newLinks[index][field] = value; setUploadLinks(newLinks); };
  const handleRemoveLink = (index) => setUploadLinks(uploadLinks.filter((_, i) => i !== index));
  const handleAddLink = () => setUploadLinks([...uploadLinks, { title: `Link ${uploadLinks.length + 1}`, url: '' }]);

  const cancelEdit = () => {
    setTitle(''); setSlug(''); setContent(''); setUploadLinks([]); setIsSlugEdited(false); setEditorOriginal({ repo: '', filename: '', sha: '' });
    const ctx = getLastContextFromDB(db); setRepo(ctx.repo); setTags(ctx.tags);
  };

  const handleSaveArticle = async () => {
    if (!token) { setStatus({ text: 'Cần Token GitHub!', type: 'error' }); setTimeout(() => setStatus({ text: '', type: '' }), 3000); return; }
    if (!repo || !title || !slug || !content) return alert("Thiếu dữ liệu (Kho, Tiêu đề, Slug, Nội dung)!");
    setIsSaving(true); setStatus({ text: 'Đang lưu lên GitHub...', type: 'loading' });
    
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

      const oldRepoName = editorOriginal.repo ? (editorOriginal.repo.includes('/') ? editorOriginal.repo.split('/')[1] : editorOriginal.repo) : null;
      const isMovingRepo = oldRepoName && oldRepoName !== rName;
      const isRenaming = editorOriginal.filename && editorOriginal.filename !== filename;

      if (editorOriginal.filename && (isMovingRepo || isRenaming) && editorOriginal.sha) {
        const oldOwner = editorOriginal.repo.split('/')[0] || username;
        let currentOldSha = await getFileShaSafe(`${oldOwner}/${oldRepoName}`, editorOriginal.filename, token);
        if (currentOldSha) {
            await fetch(`https://api.github.com/repos/${oldOwner}/${oldRepoName}/contents/${safeEnc(editorOriginal.filename)}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Xóa file cũ`, sha: currentOldSha }) });
            const oldKey = `${oldRepoName}/${editorOriginal.filename}`;
            delete db.tags[oldKey]; delete db.titles[oldKey]; delete db.colors[oldKey]; delete db.links[oldKey];
            db.pinned = db.pinned.filter(x => x !== oldKey);
        }
      }

      setStatus({ text: 'Đang đồng bộ Metadata...', type: 'loading' });
      
      let newTags = { ...db.tags }; let tagArr = tags.split(',').map(x => x.trim()).filter(Boolean);
      if (tagArr.length) newTags[fileKey] = tagArr; else delete newTags[fileKey];
      let newTitles = { ...db.titles }; newTitles[fileKey] = title;
      let newLinksDb = { ...db.links }; let validLinks = uploadLinks.filter(l => l.title.trim() && l.url.trim());
      if (validLinks.length) newLinksDb[fileKey] = validLinks; else delete newLinksDb[fileKey];
      
      let newFiles = [...db.files].filter(f => {
          const isSameNewFile = f.repoName === rName && f.fileName === filename;
          const isSameOldFile = oldRepoName && f.repoName === oldRepoName && f.fileName === editorOriginal.filename;
          return !(isSameNewFile || isSameOldFile);
      });

      const dDate = new Date();
      newFiles.unshift({ repoName: rName, name: title, fileName: filename, sha: resHTMLData.content?.sha || fileSha, url: `https://${rOwner}.github.io/${rName === `${rOwner}.github.io` ? '' : rName + '/'}${filename}`, timestamp: dDate.getTime(), fullDate: dDate.toLocaleString('vi-VN'), preview: content.substring(0, 150).replace(/<[^>]*>?/gm, '') });

      const newState = { ...db, files: newFiles, tags: newTags, titles: newTitles, links: newLinksDb };
      await syncMetaAndDB(newState); saveLocalDb(newState);

      localStorage.setItem('cms_last_repo', `${rOwner}/${rName}`); localStorage.setItem('cms_last_tags', tags);
      setStatus({ text: 'Đăng bài thành công!', type: 'success' });
      setTitle(''); setSlug(''); setContent(''); setUploadLinks([]); setIsSlugEdited(false); setEditorOriginal({ repo:'', filename:'', sha:'' });
      const ctx = getLastContextFromDB(newState); setRepo(ctx.repo); setTags(ctx.tags);
      setTimeout(() => setStatus({ text: '', type: '' }), 4000);
    } catch (error) { setStatus({ text: `Lỗi: ${error.message}`, type: 'error' }); setTimeout(() => setStatus({ text: '', type: '' }), 5000); } finally { setIsSaving(false); }
  };

  const editFileContent = async (rName, f, sha) => {
    if(!token) { setStatus({ text: 'Cần Token!', type: 'error' }); setTimeout(() => setStatus({ text: '', type: '' }), 3000); return; }
    setIsEditorOpen(true); window.scrollTo({top:0,behavior:'smooth'});
    setStatus({ text: 'Đang nạp file...', type: 'loading' });
    try {
      const res = await fetchText(`https://api.github.com/repos/${username}/${rName}/contents/${safeEnc(f)}?t=${Date.now()}`, token);
      if(res) {
        setContent(res);
        const rp = rName === username || rName === `${username}.github.io` ? `${username}/${username}.github.io` : `${username}/${rName}`;
        const fileKey = `${rName}/${f}`;
        setRepo(rp); setTitle(db.titles[fileKey] || f.replace('.html','')); setSlug(f.replace('.html','')); setIsSlugEdited(true);
        setTags((db.tags[fileKey] || []).join(', ')); setUploadLinks(db.links[fileKey] ? JSON.parse(JSON.stringify(db.links[fileKey])) : []);
        setEditorOriginal({ repo: rp, filename: f, sha: sha });
        setStatus({ text: 'Đã nạp thành công!', type: 'success' }); setTimeout(() => setStatus({ text: '', type: '' }), 2000);
      } else throw new Error("Không tìm thấy file");
    } catch(e) { setStatus({ text: `Lỗi nạp bài: ${e.message}`, type: 'error' }); setTimeout(() => setStatus({ text: '', type: '' }), 4000); }
  };

  const togglePin = async (r, f) => {
    if(!token) { setStatus({ text: 'Cần Token!', type: 'error' }); setTimeout(() => setStatus({ text: '', type: '' }), 3000); return; }
    const k = `${r}/${f}`; let newPinned = [...db.pinned];
    if(newPinned.includes(k)) newPinned = newPinned.filter(x => x !== k); else newPinned.push(k);
    const newDb = { ...db, pinned: newPinned }; saveLocalDb(newDb); syncMetaAndDB(newDb);
  };

  // ==========================================
  // XỬ LÝ VIEW & FILTER
  // ==========================================
  const repoKeysList = useMemo(() => { const keys = Object.keys(db.repos || {}); if (!keys.includes(`${username}.github.io`)) keys.unshift(`${username}.github.io`); return keys; }, [db.repos]);
  const allUniqueTags = useMemo(() => { const s = new Set(); Object.values(db.tags).forEach(a => a.forEach(t => s.add(t))); return Array.from(s).sort(); }, [db.tags]);
  const getFileTags = (r, f) => db.tags[`${r}/${f}`] || [];
  const getFileLinks = (r, f) => db.links[`${r}/${f}`] || []; 

  const processedFiles = useMemo(() => {
    let query = removeAccents(searchQuery);
    let f = db.files.filter(f => {
        let matchTag = activeTag === 'all' || getFileTags(f.repoName, f.fileName).includes(activeTag);
        let matchRepo = activeRepo === 'all' || f.repoName === activeRepo;
        let matchQuery = !query || 
                         removeAccents(f.name).includes(query) || 
                         (isDeepSearch && (removeAccents(f.preview).includes(query) || removeAccents(f.fullText).includes(query)));
        return matchTag && matchRepo && matchQuery;
    });
    return f.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [db.files, activeRepo, activeTag, searchQuery, isDeepSearch, db.tags]);

  const recentFiles = useMemo(() => (activeTag==='all' && activeRepo==='all' && !searchQuery) ? [...db.files].sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)).slice(0, 8) : [], [db.files, activeRepo, activeTag, searchQuery]);
  const pinnedFiles = useMemo(() => processedFiles.filter(f => db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  const unpinnedFiles = useMemo(() => processedFiles.filter(f => !db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  
  const groupedFilesByRepo = useMemo(() => { 
    const groups = {}; 
    unpinnedFiles.forEach(f => { if (!groups[f.repoName]) groups[f.repoName] = []; groups[f.repoName].push(f); }); 
    const sortedRepoNames = Object.keys(groups).sort((a, b) => Math.max(...groups[b].map(f => f.timestamp || 0)) - Math.max(...groups[a].map(f => f.timestamp || 0)));
    const sortedGroups = {}; 
    
    sortedRepoNames.forEach(r => {
        if (currentView === 'grid' && groups[r].length > 10) { // Giảm xuống 10 bài là kích hoạt gom nhóm Grid cho dễ nhìn
            const subGroups = {};
            groups[r].forEach(f => {
                const tlLabel = getTimelineLabel(f.timestamp);
                if (!subGroups[tlLabel]) subGroups[tlLabel] = [];
                subGroups[tlLabel].push(f);
            });
            const orderedSubGroups = {};
            ['📍 Hôm nay', '🔥 Tuần này', '📅 Tuần trước'].forEach(k => { if (subGroups[k]) orderedSubGroups[k] = subGroups[k]; });
            Object.keys(subGroups).forEach(k => { if (!['📍 Hôm nay', '🔥 Tuần này', '📅 Tuần trước'].includes(k)) orderedSubGroups[k] = subGroups[k]; });
            sortedGroups[r] = { isSubGrouped: true, data: orderedSubGroups };
        } else {
            sortedGroups[r] = { isSubGrouped: false, data: groups[r] };
        }
    });
    return sortedGroups; 
  }, [unpinnedFiles, currentView]);

  // ==========================================
  // RENDER CÁC CHẾ ĐỘ XEM
  // ==========================================
  const renderActionIcons = (fileKey, rName, fName, sha, isP, textMutedColor) => {
    const isColorPickerOpen = activeColorPickerCard === fileKey;
    return (
      <div className="flex items-center gap-1 shrink-0">
          <button onClick={(e)=>{e.stopPropagation(); togglePin(rName, fName);}} className="p-1.5 transition hover:scale-110 hover:bg-[var(--bg-hover)] rounded" style={{color: isP ? '#FF9500' : textMutedColor}}><svg className="w-4 h-4"><use href={isP ? "#icon-pin-filled" : "#icon-pin"}></use></svg></button>
          <button onClick={(e)=>{e.stopPropagation(); setActiveColorPickerCard(isColorPickerOpen ? null : fileKey);}} className={`p-1.5 transition hover:bg-[var(--bg-hover)] rounded opacity-50 hover:opacity-100 ${isColorPickerOpen ? 'scale-110 opacity-100' : 'hover:scale-110'}`} style={{color: isColorPickerOpen ? 'var(--accent)' : textMutedColor}}><svg className="w-4 h-4"><use href="#icon-palette"></use></svg></button>
          <button onClick={(e)=>{e.stopPropagation(); editFileContent(rName, fName, sha);}} className="p-1.5 opacity-50 hover:opacity-100 hover:bg-[var(--bg-hover)] rounded transition" style={{color: textMutedColor}}><svg className="w-4 h-4"><use href="#icon-edit"></use></svg></button>
      </div>
    );
  };

  const renderTagsAndLinks = (tagsList, linksList, btnBg, textColor) => (
      <div className="flex flex-wrap gap-1.5 mt-2">
          {tagsList.map(t => <span key={t} className="text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-tight border border-[var(--border)]" style={{backgroundColor: btnBg, color: textColor}}>{t}</span>)}
          {linksList.map((lnk, idx) => (
              <a key={idx} href={lnk.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] font-bold py-0.5 px-2 rounded flex items-center gap-1 hover:opacity-80 transition border border-[var(--border)]" style={{backgroundColor: btnBg, color: 'var(--accent)'}}>
                  <svg className="w-3 h-3"><use href="#icon-link"></use></svg> {lnk.title}
              </a>
          ))}
      </div>
  );

  const renderListView = (files) => (
      <div className="flex flex-col gap-[1px] bg-[var(--border)] border cms-border rounded-xl overflow-hidden shadow-sm w-full">
          {files.map(f => {
              const fileKey = `${f.repoName}/${f.fileName}`;
              const isP = db.pinned.includes(fileKey);
              const col = db.colors[fileKey];
              const isDark = col && getContrastYIQ(col) === '#FFFFFF';
              const textColor = col ? (isDark ? '#FFF' : '#1D1D1F') : 'var(--text-main)';
              const textMutedColor = col ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)') : 'var(--text-muted)';
              const bg = col || 'var(--bg-card)';
              
              return (
                <div key={f.sha} onClick={() => window.open(f.url, '_blank')} className="flex items-center justify-between p-3 cursor-pointer group hover:opacity-90 transition relative" style={{backgroundColor: bg, color: textColor}}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor: isP ? '#FF9500' : 'transparent'}}></span>
                        <h4 className="font-bold text-sm truncate">{f.name}</h4>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[10px] font-mono opacity-60 hidden md:block">{f.fullDate?.split(' ')[0]}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-card)] rounded shadow-sm border border-[var(--border)] px-1">
                            {renderActionIcons(fileKey, f.repoName, f.fileName, f.sha, isP, textMutedColor)}
                        </div>
                    </div>
                </div>
              )
          })}
      </div>
  );

  const renderGridView = (files) => (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 w-full">
          {files.map(f => {
              const fileKey = `${f.repoName}/${f.fileName}`;
              const isP = db.pinned.includes(fileKey);
              const col = db.colors[fileKey];
              const isDark = col && getContrastYIQ(col) === '#FFFFFF';
              const textColor = col ? (isDark ? '#FFF' : '#1D1D1F') : 'var(--text-main)';
              const textMutedColor = col ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)') : 'var(--text-muted)';
              const borderColor = col ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'var(--border)';
              const btnBg = col ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'var(--bg-hover)';

              return (
                  <div key={f.sha} className="cms-card p-5 flex flex-col relative transition border cms-border hover:border-[var(--accent)] cursor-pointer group shadow-sm bg-[var(--bg-card)]" onClick={() => window.open(f.url, '_blank')} style={{backgroundColor: col || 'var(--bg-card)', color: textColor, border: `1px solid ${borderColor}`}}>
                      <div className="flex-1 min-w-0 mb-4">
                          <h4 className="font-bold leading-[1.4] text-[16px] line-clamp-3" style={{color: textColor}}>{f.name}</h4>
                          {renderTagsAndLinks(getFileTags(f.repoName, f.fileName), getFileLinks(f.repoName, f.fileName), btnBg, textColor)}
                      </div>
                      
                      <div className="mt-auto pt-3 border-t flex justify-between items-center gap-2" style={{borderColor: borderColor}}>
                          <div className="flex flex-col gap-1 min-w-0">
                              <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1" style={{color: textMutedColor}}><svg className="w-3 h-3"><use href="#icon-folder"></use></svg> {f.repoName}</span>
                              <span className="text-[9px] font-mono opacity-60" style={{color: textMutedColor}}>{f.fullDate?.split(' ')[0]}</span>
                          </div>
                          {renderActionIcons(fileKey, f.repoName, f.fileName, f.sha, isP, textMutedColor)}
                      </div>

                      {activeColorPickerCard === fileKey && (
                          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[var(--bg-body)] border cms-border p-2 rounded-xl shadow-xl flex gap-1 z-50 fade-in" onClick={e => e.stopPropagation()}>
                              {[null, '#F2F2F7', '#FFD8BF', '#FFE58F', '#D9F7BE', '#BAE7FF', '#D6E4FF', '#EFDBFF', '#FFD6E7', '#1D1D1F'].map((c, i) => (
                                <button key={i} onClick={() => handleSetColor(fileKey, c)} className="w-5 h-5 rounded-full border hover:scale-125 transition" style={{ backgroundColor: c || 'var(--bg-card)', borderColor: c ? 'transparent' : 'var(--border)' }}></button>
                              ))}
                          </div>
                      )}
                  </div>
              )
          })}
      </div>
  );

  const renderTableView = (files) => (
      <div className="cms-card overflow-x-auto border cms-border rounded-xl shadow-sm w-full">
          <table className="w-full text-left text-sm min-w-[800px]">
              <thead>
                  <tr className="bg-[var(--bg-hover)] text-[var(--text-muted)] text-[10px] uppercase tracking-wider border-b cms-border">
                      <th className="p-3 w-8 text-center">📌</th>
                      <th className="p-3 w-[40%]">Bài viết</th>
                      <th className="p-3">Kho</th>
                      <th className="p-3 w-32">Cập nhật</th>
                      <th className="p-3 text-center w-32">Thao tác</th>
                  </tr>
              </thead>
              <tbody>
                  {files.map(f => {
                      const fileKey = `${f.repoName}/${f.fileName}`;
                      const isP = db.pinned.includes(fileKey);
                      const col = db.colors[fileKey];
                      const isDark = col && getContrastYIQ(col) === '#FFFFFF';
                      const textColor = col ? (isDark ? '#FFF' : '#1D1D1F') : 'var(--text-main)';
                      const textMutedColor = col ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)') : 'var(--text-muted)';
                      
                      return (
                          <tr key={f.sha} className="border-b cms-border hover:opacity-80 transition cursor-pointer" style={{backgroundColor: col || 'transparent', color: textColor}} onClick={() => window.open(f.url, '_blank')}>
                              <td className="p-3 text-center" onClick={e=>e.stopPropagation()}>
                                  <button onClick={()=>togglePin(f.repoName, f.fileName)} style={{color: isP ? '#FF9500' : 'transparent'}} className="hover:text-[#FF9500] transition"><svg className="w-4 h-4"><use href="#icon-pin-filled"></use></svg></button>
                              </td>
                              <td className="p-3">
                                  <h4 className="font-bold text-[14px] leading-snug">{f.name}</h4>
                                  <div className="mt-1 flex flex-wrap gap-1 opacity-80">
                                      {(db.tags[fileKey]||[]).map(t => <span key={t} className="text-[9px] border border-[var(--border)] px-1.5 rounded">{t}</span>)}
                                  </div>
                              </td>
                              <td className="p-3 text-xs opacity-80 uppercase font-bold tracking-widest text-[10px]">{f.repoName}</td>
                              <td className="p-3 text-xs opacity-70 whitespace-nowrap font-mono">{f.fullDate?.split(' ')[0]}</td>
                              <td className="p-3" onClick={e=>e.stopPropagation()}>
                                  <div className="flex justify-center bg-[var(--bg-card)] rounded-lg shadow-sm border border-[var(--border)]">
                                      {renderActionIcons(fileKey, f.repoName, f.fileName, f.sha, isP, textMutedColor)}
                                  </div>
                              </td>
                          </tr>
                      )
                  })}
              </tbody>
          </table>
      </div>
  );

  const renderFeedView = (files) => (
      <div className="flex flex-col max-w-3xl mx-auto gap-10 w-full">
          {files.map(f => {
              const fileKey = `${f.repoName}/${f.fileName}`;
              const isP = db.pinned.includes(fileKey);
              const col = db.colors[fileKey];
              const isDark = col && getContrastYIQ(col) === '#FFFFFF';
              const textColor = col ? (isDark ? '#FFF' : '#1D1D1F') : 'var(--text-main)';
              const borderColor = col ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'var(--border)';
              
              return (
                  <article key={f.sha} className="cms-card p-6 md:p-8 flex flex-col relative border cms-border shadow-md rounded-2xl bg-[var(--bg-card)]" style={{backgroundColor: col || 'var(--bg-card)', color: textColor, border: `1px solid ${borderColor}`}}>
                      <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl bg-[var(--bg-hover)] border cms-border text-[var(--text-main)]"><svg className="w-5 h-5 opacity-70"><use href="#icon-folder"></use></svg></div>
                          <div>
                              <p className="text-xs font-black uppercase tracking-widest opacity-80">{f.repoName}</p>
                              <p className="text-[11px] font-mono opacity-60 mt-0.5">{f.fullDate}</p>
                          </div>
                      </div>
                      <h2 className="text-3xl font-bold leading-tight mb-4">{f.name}</h2>
                      {renderTagsAndLinks(getFileTags(f.repoName, f.fileName), getFileLinks(f.repoName, f.fileName), 'var(--bg-hover)', textColor)}
                      <div className="mt-6 mb-8 text-[16px] leading-relaxed opacity-90 whitespace-pre-line border-l-4 pl-4" style={{borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'var(--border)'}}>{f.preview}</div>
                      <div className="flex flex-wrap gap-2 pt-6 border-t" style={{borderColor: borderColor}}>
                          <a href={f.url} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-[var(--bg-hover)] rounded-xl text-sm font-bold shadow-sm border cms-border hover:opacity-80 transition" style={{color: textColor}}>Đọc bài</a>
                          <button onClick={() => editFileContent(f.repoName, f.fileName, f.sha)} className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 hover:opacity-90 transition ml-auto"><svg className="w-4 h-4"><use href="#icon-edit"></use></svg> Sửa bài</button>
                          <button onClick={() => togglePin(f.repoName, f.fileName)} className="px-4 py-2.5 bg-[var(--bg-hover)] rounded-xl border cms-border transition flex items-center gap-2 text-sm font-bold hover:opacity-80" style={{color: isP ? '#FF9500' : textColor}}><svg className="w-4 h-4"><use href={isP ? "#icon-pin-filled" : "#icon-pin"}></use></svg> Ghim</button>
                      </div>
                  </article>
              )
          })}
      </div>
  );

  const renderKanbanView = () => {
    const columns = Object.keys(groupedFilesByRepo);
    if (columns.length === 0 && pinnedFiles.length === 0) return <div className="text-center py-20 text-[var(--text-muted)] font-bold text-sm">Trống</div>;

    return (
        <div className="flex overflow-x-auto gap-6 pb-6 w-full items-start kanban-scroll min-h-[70vh]">
            {pinnedFiles.length > 0 && (
                <div className="w-[320px] shrink-0 bg-[#F9FAFB] dark:bg-[#121212] border cms-border rounded-2xl flex flex-col max-h-[80vh]">
                    <div className="p-4 flex justify-between items-center font-bold text-sm text-[#FF9500]">
                        <span className="flex items-center gap-2"><svg className="w-4 h-4"><use href="#icon-pin-filled"></use></svg> Đã ghim</span>
                        <span className="bg-[var(--bg-card)] text-[var(--text-main)] text-xs px-2 py-0.5 rounded-full border cms-border shadow-sm">{pinnedFiles.length}</span>
                    </div>
                    <div className="overflow-y-auto px-3 pb-3 space-y-3 kanban-scroll flex-1">
                        {pinnedFiles.map(f => {
                            const fileKey = `${f.repoName}/${f.fileName}`;
                            const col = db.colors[fileKey] || 'var(--bg-card)';
                            const isDark = col !== 'var(--bg-card)' && getContrastYIQ(col) === '#FFFFFF';
                            const textColor = isDark ? '#FFF' : 'var(--text-main)';
                            
                            return (
                                <div key={f.sha} className="p-4 rounded-xl shadow-sm border cms-border cursor-pointer hover:shadow-md transition group bg-[var(--bg-card)]" onClick={() => window.open(f.url, '_blank')} style={{backgroundColor: col, color: textColor}}>
                                    <h4 className="font-bold text-[14px] leading-[1.4] mb-3 line-clamp-3">{f.name}</h4>
                                    {renderTagsAndLinks(getFileTags(f.repoName, f.fileName), getFileLinks(f.repoName, f.fileName), isDark?'rgba(255,255,255,0.1)':'var(--bg-hover)', textColor)}
                                    <div className="flex justify-between items-center mt-4 pt-3 border-t cms-border opacity-60 group-hover:opacity-100 transition">
                                        <span className="text-[10px] font-mono">{f.fullDate?.split(' ')[0]}</span>
                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                                           <button onClick={(e)=>{e.stopPropagation(); togglePin(f.repoName, f.fileName);}} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded" style={{color: '#FF9500'}}><svg className="w-3.5 h-3.5"><use href="#icon-pin-filled"></use></svg></button>
                                           <button onClick={(e)=>{e.stopPropagation(); editFileContent(f.repoName, f.fileName, f.sha);}} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded"><svg className="w-3.5 h-3.5"><use href="#icon-edit"></use></svg></button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })} 
                    </div>
                </div>
            )}
            
            {columns.map(repoName => {
                const groupInfo = groupedFilesByRepo[repoName];
                const files = groupInfo.isSubGrouped ? Object.values(groupInfo.data).flat() : groupInfo.data;
                
                return (
                    <div key={repoName} className="w-[320px] shrink-0 bg-[#F9FAFB] dark:bg-[#121212] border cms-border rounded-2xl flex flex-col max-h-[80vh]">
                        <div className="p-4 flex justify-between items-center font-bold text-sm text-[var(--text-main)]">
                            <span className="flex items-center gap-2 uppercase tracking-widest"><svg className="w-4 h-4 opacity-50"><use href="#icon-folder"></use></svg> {repoName}</span>
                            <span className="bg-[var(--bg-card)] text-[var(--text-main)] text-xs px-2 py-0.5 rounded-full border cms-border shadow-sm">{files.length}</span>
                        </div>
                        <div className="overflow-y-auto px-3 pb-3 space-y-3 kanban-scroll flex-1">
                            {files.map(f => {
                                const fileKey = `${f.repoName}/${f.fileName}`;
                                const col = db.colors[fileKey] || 'var(--bg-card)';
                                const isDark = col !== 'var(--bg-card)' && getContrastYIQ(col) === '#FFFFFF';
                                const textColor = isDark ? '#FFF' : 'var(--text-main)';

                                return (
                                    <div key={f.sha} className="p-4 rounded-xl shadow-sm border cms-border cursor-pointer hover:shadow-md transition group bg-[var(--bg-card)]" onClick={() => window.open(f.url, '_blank')} style={{backgroundColor: col, color: textColor}}>
                                        <h4 className="font-bold text-[14px] leading-[1.4] mb-3 line-clamp-3">{f.name}</h4>
                                        {renderTagsAndLinks(getFileTags(f.repoName, f.fileName), getFileLinks(f.repoName, f.fileName), isDark?'rgba(255,255,255,0.1)':'var(--bg-hover)', textColor)}
                                        <div className="flex justify-between items-center mt-4 pt-3 border-t cms-border opacity-60 group-hover:opacity-100 transition">
                                            <span className="text-[10px] font-mono">{f.fullDate?.split(' ')[0]}</span>
                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                                               <button onClick={(e)=>{e.stopPropagation(); togglePin(f.repoName, f.fileName);}} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded"><svg className="w-3.5 h-3.5"><use href="#icon-pin"></use></svg></button>
                                               <button onClick={(e)=>{e.stopPropagation(); editFileContent(f.repoName, f.fileName, f.sha);}} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded"><svg className="w-3.5 h-3.5"><use href="#icon-edit"></use></svg></button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
  };

  const renderViews = () => {
    if (processedFiles.length === 0) return <div className="text-center py-20 text-[var(--text-muted)] font-bold text-sm">Trống</div>;
    if (currentView === 'kanban') return renderKanbanView();

    return (
      <div className="flex flex-col gap-8 w-full">
        {pinnedFiles.length > 0 && (
            <div className="mb-2 outline-none">
                <h3 className="font-bold text-lg mb-4 border-b border-[var(--border)] pb-2 flex items-center gap-2 text-[#FF9500]">
                    <svg className="w-5 h-5"><use href="#icon-pin-filled"></use></svg> Đã ghim <span className="text-xs px-2 py-0.5 rounded-full border cms-border text-[var(--text-main)] ml-2 bg-[var(--bg-hover)]">{pinnedFiles.length}</span>
                </h3>
                {currentView === 'list' && renderListView(pinnedFiles)}
                {currentView === 'grid' && renderGridView(pinnedFiles)}
                {currentView === 'table' && renderTableView(pinnedFiles)}
                {currentView === 'feed' && renderFeedView(pinnedFiles)}
            </div>
        )}
        
        {Object.keys(groupedFilesByRepo).map(r => {
            const groupInfo = groupedFilesByRepo[r];
            return (
                <div key={r} className="mb-6 outline-none w-full">
                    <h3 className="font-bold text-xl mb-4 border-b border-[var(--border)] pb-2 flex items-center gap-2 text-[var(--text-main)]">
                        <svg className="w-6 h-6 opacity-70"><use href="#icon-folder"></use></svg> {r} 
                        <span className="text-xs px-2 py-0.5 rounded-full border cms-border text-[var(--text-muted)] ml-2 bg-[var(--bg-hover)]">
                            {groupInfo.isSubGrouped ? Object.values(groupInfo.data).flat().length : groupInfo.data.length}
                        </span>
                    </h3>
                    
                    {/* Gom nhóm Timeline chỉ cho Grid */}
                    {groupInfo.isSubGrouped ? (
                        <div className="flex flex-col gap-6">
                            {['📍 Hôm nay', '🔥 Tuần này', '📅 Tuần trước'].concat(Object.keys(groupInfo.data).filter(k => !['📍 Hôm nay','🔥 Tuần này','📅 Tuần trước'].includes(k))).map(timeline => {
                                if (!groupInfo.data[timeline] || groupInfo.data[timeline].length === 0) return null;
                                return (
                                    <div key={timeline} className="ml-2 md:ml-4 border-l-2 border-[var(--border)] pl-4">
                                        <h4 className="font-bold text-sm text-[var(--text-muted)] mb-4 flex items-center gap-2 py-1">
                                            {timeline} <span className="text-[10px] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full text-[var(--text-main)] border cms-border">{groupInfo.data[timeline].length}</span>
                                        </h4>
                                        {renderGridView(groupInfo.data[timeline])}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <>
                            {currentView === 'list' && renderListView(groupInfo.data)}
                            {currentView === 'grid' && renderGridView(groupInfo.data)}
                            {currentView === 'table' && renderTableView(groupInfo.data)}
                            {currentView === 'feed' && renderFeedView(groupInfo.data)}
                        </>
                    )}
                </div>
            )
        })}
      </div>
    );
  };

  if (!isAuthenticated) return ( 
    <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[var(--bg-body)]">
        <div className="cms-card p-10 max-w-sm w-full mx-4 text-center rounded-3xl shadow-2xl border cms-border">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-main)]">Workspace</h2>
            <input type="password" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-center text-3xl font-bold px-4 py-4 bg-[var(--bg-hover)] rounded-2xl mb-6 border cms-border outline-none text-[var(--text-main)] tracking-widest" />
            <button onClick={handleLogin} className="w-full py-4 bg-[var(--accent)] text-white rounded-xl font-bold shadow-md hover:opacity-90 transition">Mở Khóa</button>
        </div>
    </div> 
  );

  return (
    <>
      <div className="flex-col w-full min-h-screen fade-in flex bg-[var(--bg-body)]" onClick={() => setActiveColorPickerCard(null)}>
        <SVGIcons />
        <header className="bg-[var(--bg-card)] border-b border-[var(--border)] pt-4 pb-3 px-4 md:px-8 flex flex-col md:flex-row items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--accent)]">vietndj</h1>
          <div className="flex-1 flex w-full items-center gap-2">
              <div className="flex-1 flex items-center bg-[var(--bg-hover)] rounded-xl px-4 py-2 border cms-border">
                  <svg className="w-4 h-4 text-[var(--text-muted)]"><use href="#icon-search"></use></svg>
                  <input id="search-input-main" type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Tìm kiếm không dấu... (Ctrl K)" className="bg-transparent border-none outline-none text-sm w-full ml-3 font-bold text-[var(--text-main)] placeholder-[var(--text-muted)]" />
              </div>
              <button onClick={() => setIsDeepSearch(!isDeepSearch)} className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${isDeepSearch ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--bg-hover)] text-[var(--text-main)] cms-border hover:opacity-80'}`} title="Bật/Tắt tìm kiếm sâu trong nội dung">
                  <svg className="w-4 h-4"><use href="#icon-search"></use></svg> <span className="hidden sm:inline-block">Sâu</span>
              </button>
          </div>
          <div className="flex items-center gap-2 relative" ref={toolsMenuRef}>
            <button onClick={loadDatabase} className="px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border)] flex items-center gap-1">Tải DB</button>
            <button onClick={()=>setIsTasksOpen(!isTasksOpen)} className="px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border)] flex items-center gap-1">Việc</button>
            <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border)] flex items-center gap-1">Công cụ ▾</button>
            {isToolsOpen && ( 
                <div className="absolute right-0 top-full mt-2 w-56 p-2 z-[100] cms-card rounded-xl shadow-2xl border cms-border fade-in">
                    <div className="flex gap-1 px-1 mb-3">
                        <button onClick={() => changeTheme('light')} className="flex-1 py-1.5 rounded text-[11px] font-bold border cms-border text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition">Sáng</button>
                        <button onClick={() => changeTheme('dark')} className="flex-1 py-1.5 rounded text-[11px] font-bold border cms-border text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition">Tối</button>
                    </div>
                    <button onClick={() => window.open('https://vietndj.github.io/tin.html', '_blank')} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-[var(--bg-hover)] rounded text-[var(--text-main)] transition">Mở Reader</button>
                    <button onClick={() => { window.open('https://vietndj.github.io/export.html', '_blank'); setIsToolsOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-[#8E44AD] hover:bg-[var(--bg-hover)] rounded transition">Xuất Sách AI</button>
                    <hr className="my-1 border-t cms-border"/>
                    <button onClick={() => {localStorage.removeItem("cms_auth"); setIsAuthenticated(false);}} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-[var(--bg-hover)] rounded transition">Khóa App</button>
                </div> 
            )}
          </div>
        </header>

        <div className="bg-[var(--bg-body)] border-b border-[var(--border)] py-2 px-4 md:px-8 sticky top-0 z-40 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0 mr-2">VIEW</span>
                <div className="flex bg-[var(--bg-hover)] p-1 rounded-lg border cms-border gap-1 mr-4">
                    {[ { id: 'list', icon: '#icon-list', title: 'List' }, { id: 'grid', icon: '#icon-grid', title: 'Grid' }, { id: 'kanban', icon: '#icon-kanban', title: 'Kanban' }, { id: 'table', icon: '#icon-list', title: 'Table' }, { id: 'feed', icon: '#icon-feed', title: 'Feed' } ].map(v => (
                        <button key={v.id} onClick={() => setCurrentView(v.id)} className={`px-3 py-1 rounded-md transition text-xs font-bold flex items-center gap-1.5 ${currentView === v.id ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent'}`} title={v.title}>
                            <svg className="w-3.5 h-3.5"><use href={v.icon}></use></svg> <span className="hidden md:block capitalize">{v.title}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0">KHO</span>{repoKeysList.map(r => <button key={r} onClick={() => setActiveRepo(activeRepo===r?'all':r)} className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${activeRepo===r?'bg-[var(--accent)] text-white shadow-sm border border-transparent':'bg-[var(--bg-hover)] text-[var(--text-main)] border cms-border hover:opacity-80'}`}>{r}</button>)}</div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0">TAG</span>{allUniqueTags.map(t => <button key={t} onClick={() => setActiveTag(activeTag===t?'all':t)} className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${activeTag===t?'bg-[var(--accent)] text-white shadow-sm border border-transparent':'bg-[var(--bg-hover)] text-[var(--text-main)] border cms-border hover:opacity-80'}`}>{t}</button>)}</div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto items-start w-full relative pb-20 mt-6">
          <main className="flex-1 w-full min-w-0 flex flex-col gap-8">
            <section className="cms-card overflow-hidden border border-[var(--border)] shadow-sm rounded-xl">
              <button onClick={() => {
                  setIsEditorOpen(!isEditorOpen); 
                  if (!isEditorOpen && !title && !content && !editorOriginal.sha) {
                      const ctx = getLastContextFromDB(db); setRepo(ctx.repo); setTags(ctx.tags);
                  }
              }} className="w-full px-6 py-4 flex justify-between items-center bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] font-bold text-[var(--accent)] outline-none transition">
                  <span className="flex items-center gap-2 text-base">
                      <svg className="w-5 h-5"><use href="#icon-edit"></use></svg> Soạn thảo HTML <span className="text-[9px] text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono ml-2 uppercase bg-[var(--bg-body)] hidden sm:inline-block">Ctrl E</span>
                  </span>
                  <span>{isEditorOpen?'▲':'▼'}</span>
              </button>
              {isEditorOpen && (
                <div className="p-6 flex flex-col gap-5 border-t border-[var(--border)] bg-[var(--bg-card)]">
                  <div className="flex flex-wrap gap-2">{repoKeysList.map(r => <button key={r} onClick={() => setRepo(`${username}/${r}`)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border ${repo===`${username}/${r}`?'bg-[var(--accent)] text-white border-transparent':'bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border)] hover:opacity-80'}`}>{r}</button>)}</div>
                  
                  <textarea ref={editorInputRef} rows="12" value={content} onChange={handleContentChange} className="w-full p-5 bg-[#1D1D1F] text-[#34C759] rounded-xl font-mono text-sm outline-none shadow-inner leading-relaxed" placeholder="Mở soạn thảo (Ctrl E) -> Dán HTML (Ctrl V) -> Lưu (Ctrl S)... Tiêu đề tự bóc từ thẻ <title>..."></textarea>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold uppercase text-[var(--text-muted)] ml-1">Tiêu đề</label><input type="text" value={title} onChange={handleTitleChange} className="px-4 py-3 bg-[var(--bg-hover)] rounded-xl text-sm font-bold outline-none text-[var(--text-main)] border cms-border placeholder-[var(--text-muted)] focus:border-[var(--accent)] transition" placeholder="Tiêu đề bài viết..." /></div>
                      <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold uppercase text-[var(--text-muted)] ml-1">Slug (URL)</label><input type="text" value={slug} onChange={handleSlugChange} className="px-4 py-3 bg-[var(--bg-hover)] rounded-xl text-sm font-bold font-mono outline-none text-[var(--accent)] border cms-border placeholder-[var(--text-muted)] focus:border-[var(--accent)] transition" placeholder="slug-cua-bai-viet..." /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5 p-4 rounded-xl border cms-border bg-[var(--bg-body)]">
                          <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] ml-1">Nhãn (Tags)</label>
                          <input type="text" value={tags} onChange={(e)=>{setTags(e.target.value); if(!isSlugEdited) setSlug(generateSlug(title, e.target.value));}} className="px-4 py-2 bg-[var(--bg-hover)] rounded-lg text-sm font-bold text-[var(--text-main)] outline-none border cms-border placeholder-[var(--text-muted)] focus:border-[var(--accent)] transition" />
                          {allUniqueTags.length > 0 && (<div className="mt-3"><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-2 block px-1">Gợi ý nhãn có sẵn:</span><div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-32 pr-1">{allUniqueTags.map(t => { const isSelected = tags.split(',').map(x=>x.trim()).includes(t); return <button key={t} type="button" onClick={() => toggleTagEditor(t)} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition border ${isSelected ? 'bg-[var(--accent)] text-white border-transparent shadow-sm' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]'}`}>{t}</button>})}</div></div>)}
                      </div>
                      
                      <div className="flex flex-col gap-1.5 p-4 rounded-xl border cms-border bg-[var(--bg-body)]">
                          <div className="flex justify-between items-center mb-2"><label className="text-[10px] font-bold uppercase text-[var(--text-muted)] ml-1 flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-link"></use></svg> Link tham khảo</label><button onClick={handleAddLink} className="text-[10px] font-bold text-[var(--accent)] bg-[var(--bg-hover)] px-3 py-1.5 rounded-lg border cms-border hover:bg-[var(--bg-card)] transition">+ Thêm Link</button></div>
                          {uploadLinks.length === 0 ? <div className="text-xs text-[var(--text-muted)] italic text-center py-6 opacity-70 bg-[var(--bg-card)] rounded-lg border cms-border">Chưa có link đính kèm</div> : (<div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">{uploadLinks.map((link, idx) => (<div key={idx} className="flex items-center gap-2 bg-[var(--bg-card)] border cms-border p-2 rounded-lg"><input type="text" value={link.title} onChange={e => handleUpdateLink(idx, 'title', e.target.value)} placeholder="Tên Link" className="w-1/3 bg-transparent text-xs font-bold outline-none text-[var(--text-main)] px-2" /><input type="text" value={link.url} onChange={e => handleUpdateLink(idx, 'url', e.target.value)} placeholder="https://..." className="flex-1 bg-transparent text-xs outline-none text-[var(--text-muted)] px-2 border-l cms-border" /><button onClick={() => handleRemoveLink(idx)} className="text-red-500 font-bold px-3 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition">✕</button></div>))}</div>)}
                      </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 mt-2 border-t cms-border">
                     <button id="btn-save-article" onClick={handleSaveArticle} disabled={isSaving} className="bg-[var(--accent)] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg text-sm transition hover:scale-105 disabled:opacity-50 border border-transparent">
                        {isSaving?'Đang lưu...':'LƯU BÀI LÊN GITHUB (Ctrl S)'}
                     </button>
                     {editorOriginal.sha && <button onClick={cancelEdit} className="text-red-500 text-xs font-bold px-5 py-3 hover:bg-[var(--bg-hover)] rounded-xl transition">✕ HỦY SỬA BÀI NÀY</button>}
                  </div>
                </div>
              )}
            </section>

            {/* KHỐI VỪA THAO TÁC GẦN ĐÂY */}
            {recentFiles.length > 0 && (
              <div className="mb-8 mt-4 pl-1">
                  <div className="flex items-center mb-5 gap-2">
                      <div className="w-3 h-3 bg-[var(--text-main)] rounded-full"></div>
                      <h3 className="font-bold text-lg text-[var(--accent)]">Vừa thao tác gần đây</h3>
                  </div>
                  <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x">
                    {recentFiles.map(f => (
                      <div key={f.sha} onClick={() => window.open(f.url, '_blank')} className="bg-[var(--bg-card)] border cms-border p-4 rounded-2xl min-w-[280px] max-w-[280px] flex flex-col cursor-pointer hover:shadow-md transition snap-start">
                         <div className="flex items-center gap-1.5 mb-2 opacity-60">
                             <svg className="w-3 h-3"><use href="#icon-folder"></use></svg>
                             <span className="text-[10px] font-bold uppercase">{f.repoName}</span>
                         </div>
                         <h4 className="font-bold text-[15px] leading-[1.4] mb-6 line-clamp-2 text-[var(--text-main)]">{f.name}</h4>
                         <div className="mt-auto flex justify-between items-center pt-3 border-t cms-border">
                             <span className="text-[11px] text-[var(--text-muted)] font-mono">{f.fullDate?.split(' ')[0]}</span>
                             <button onClick={(e)=>{e.stopPropagation(); editFileContent(f.repoName, f.fileName, f.sha)}} className="bg-[#3B82F6]/10 text-[#3B82F6] font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-[#3B82F6]/20 transition">Sửa</button>
                         </div>
                      </div>
                    ))}
                  </div>
              </div>
            )}

            {/* HIỂN THỊ DỮ LIỆU CHÍNH */}
            {renderViews()}
          </main>

          {isTasksOpen && (
            <aside className="w-full lg:w-[320px] shrink-0 sticky top-[130px] h-[calc(100vh-150px)] fade-in">
               <div className="bg-[var(--bg-card)] p-5 flex flex-col h-full border border-[var(--border)] rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-5"><h2 className="text-xs font-black text-[var(--accent)] uppercase tracking-widest flex items-center gap-2"><svg className="w-4 h-4"><use href="#icon-edit"></use></svg> Ghi chú</h2><button onClick={()=>setIsTasksOpen(false)} className="text-[var(--text-muted)] font-bold hover:text-red-500 transition px-2">✕</button></div>
                  <div className="flex gap-2 mb-5"><input type="text" value={nativeTaskInput} onChange={e=>setNativeTaskInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && nativeTaskInput){const n=[{id:Date.now(),title:nativeTaskInput,completed:false},...db.tasks]; saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n}); setNativeTaskInput('');}}} className="flex-1 bg-[var(--bg-hover)] border cms-border text-[var(--text-main)] px-4 py-3 rounded-xl text-sm outline-none focus:border-[var(--accent)] transition" placeholder="Gõ rồi Enter..." /></div>
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                    {db.tasks.map(t => <div key={t.id} className="p-3 flex gap-3 rounded-xl text-xs font-medium leading-relaxed bg-[var(--bg-hover)] border cms-border text-[var(--text-main)] group hover:border-[var(--accent)] transition"><input type="checkbox" checked={t.completed} onChange={()=>{const n=db.tasks.map(x=>x.id===t.id?{...x,completed:!x.completed}:x); saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n});}} className="mt-1 accent-[var(--accent)] w-4 h-4 cursor-pointer" /><span className={`flex-1 ${t.completed ? 'opacity-50 line-through' : ''}`}>{t.title}</span><button onClick={()=>{const n=db.tasks.filter(x=>x.id!==t.id); saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n});}} className="text-red-500 font-bold opacity-0 group-hover:opacity-100 px-2 transition">✕</button></div>)}
                  </div>
               </div>
            </aside>
          )}
        </div>
      </div>

      {/* TOAST THÔNG BÁO TÁCH RỜI */}
      {status.text && (
          <div className="fixed top-[80px] left-1/2 transform -translate-x-1/2 z-[9999999] pointer-events-none transition-all duration-300 w-max max-w-[90%] fade-in">
              <div className={`bg-[var(--bg-card)] px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 border-2 font-bold text-sm text-[var(--text-main)] ${status.type === 'error' ? 'border-red-500' : status.type === 'loading' ? 'border-[var(--accent)]' : 'border-green-500'}`}>
                  {status.type === 'loading' && <svg className="animate-spin h-5 w-5 text-[var(--accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  {status.type === 'error' && <span className="text-red-500 text-lg">✕</span>}
                  {status.type === 'success' && <span className="text-green-500 text-lg">✓</span>}
                  <span className="whitespace-nowrap">{status.text}</span>
              </div>
          </div>
      )}
    </>
  );
}