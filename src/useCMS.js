import { useState, useEffect, useMemo, useRef } from 'react';
import { username, SECRET_PIN, safeEnc, encodeBase64UTF8Async, fetchRawJSON, fetchText, getFileShaSafe, getLastContextFromDB, removeAccents, getTimelineLabel, generateSlug } from './utils.js';

export default function useCMS() {
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
    if (localStorage.getItem("cms_auth") === "granted") setIsAuthenticated(true);
    const savedToken = localStorage.getItem('github_pat'); if (savedToken) setToken(savedToken);
    try { const localDb = JSON.parse(localStorage.getItem('cms_repo_data')); if (localDb && localDb.files) setDb(localDb); } catch(e){}
  }, []);

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
            if (!uniqueFilesMap.has(key) || uniqueFilesMap.get(key).timestamp < f.timestamp) uniqueFilesMap.set(key, f);
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

  const handleTitleChange = (val) => { setTitle(val); if (!isSlugEdited) setSlug(generateSlug(val, tags)); };
  const handleSlugChange = (val) => { setSlug(val); setIsSlugEdited(true); };
  const toggleTagEditor = (t) => {
    let currentTags = tags.split(',').map(x => x.trim()).filter(Boolean);
    if (currentTags.includes(t)) currentTags = currentTags.filter(x => x !== t); else currentTags.push(t);
    const newTagsStr = currentTags.join(', '); setTags(newTagsStr);
    if (!isSlugEdited) setSlug(generateSlug(title, newTagsStr));
  };
  const handleContentChange = (val) => {
    setContent(val);
    if (!title.trim() && val.includes('<title>')) {
        const match = val.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (match && match[1]) { const extractedTitle = match[1].trim(); setTitle(extractedTitle); if (!isSlugEdited) setSlug(generateSlug(extractedTitle, tags)); }
    }
  };

  const handleSaveArticle = async () => {
    if (!token) { setStatus({ text: 'Cần Token GitHub!', type: 'error' }); setTimeout(() => setStatus({ text: '', type: '' }), 3000); return; }
    if (!repo || !title || !slug || !content) return alert("Thiếu dữ liệu!");
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
      if (editorOriginal.filename && (oldRepoName !== rName || editorOriginal.filename !== filename) && editorOriginal.sha) {
        const oldOwner = editorOriginal.repo.split('/')[0] || username;
        let currentOldSha = await getFileShaSafe(`${oldOwner}/${oldRepoName}`, editorOriginal.filename, token);
        if (currentOldSha) {
            await fetch(`https://api.github.com/repos/${oldOwner}/${oldRepoName}/contents/${safeEnc(editorOriginal.filename)}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Xóa file cũ`, sha: currentOldSha }) });
            const oldKey = `${oldRepoName}/${editorOriginal.filename}`;
            delete db.tags[oldKey]; delete db.titles[oldKey]; delete db.colors[oldKey]; delete db.links[oldKey];
            db.pinned = db.pinned.filter(x => x !== oldKey);
        }
      }
      
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
    setIsEditorOpen(true); window.scrollTo({top:0,behavior:'smooth'}); setStatus({ text: 'Đang nạp file...', type: 'loading' });
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

  const cancelEdit = () => { setTitle(''); setSlug(''); setContent(''); setUploadLinks([]); setIsSlugEdited(false); setEditorOriginal({ repo: '', filename: '', sha: '' }); const ctx = getLastContextFromDB(db); setRepo(ctx.repo); setTags(ctx.tags); };

  // === TÍNH TOÁN DATA HIỂN THỊ ===
  const getFileTags = (r, f) => db.tags[`${r}/${f}`] || [];
  const getFileLinks = (r, f) => db.links[`${r}/${f}`] || []; 
  const repoKeysList = useMemo(() => { const keys = Object.keys(db.repos || {}); if (!keys.includes(`${username}.github.io`)) keys.unshift(`${username}.github.io`); return keys; }, [db.repos]);
  const allUniqueTags = useMemo(() => { const s = new Set(); Object.values(db.tags).forEach(a => a.forEach(t => s.add(t))); return Array.from(s).sort(); }, [db.tags]);

  const processedFiles = useMemo(() => {
    let query = removeAccents(searchQuery);
    let f = db.files.filter(f => {
        let matchTag = activeTag === 'all' || getFileTags(f.repoName, f.fileName).includes(activeTag);
        let matchRepo = activeRepo === 'all' || f.repoName === activeRepo;
        let matchQuery = !query || removeAccents(f.name).includes(query) || (isDeepSearch && (removeAccents(f.preview).includes(query) || removeAccents(f.fullText).includes(query)));
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
        if (currentView === 'grid' && groups[r].length > 10) { 
            const subGroups = {};
            groups[r].forEach(f => { const tlLabel = getTimelineLabel(f.timestamp); if (!subGroups[tlLabel]) subGroups[tlLabel] = []; subGroups[tlLabel].push(f); });
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

  return {
      state: { isAuthenticated, pin, token, db, status, searchQuery, isDeepSearch, activeRepo, activeTag, currentView, isTasksOpen, isToolsOpen, nativeTaskInput, activeColorPickerCard, isEditorOpen, isSaving, repo, tags, title, slug, isSlugEdited, uploadLinks, content, editorOriginal, toolsMenuRef, editorInputRef, repoKeysList, allUniqueTags, recentFiles, pinnedFiles, groupedFilesByRepo, processedFiles },
      actions: { setIsAuthenticated, setPin, setToken, setStatus, setSearchQuery, setIsDeepSearch, setActiveRepo, setActiveTag, setCurrentView, setIsTasksOpen, setIsToolsOpen, setNativeTaskInput, setActiveColorPickerCard, setIsEditorOpen, setRepo, setTags, handleTitleChange, handleSlugChange, toggleTagEditor, handleContentChange, handleAddLink, handleUpdateLink, handleRemoveLink, handleLogin, loadDatabase, handleSaveArticle, editFileContent, togglePin, cancelEdit, handleSetColor, changeTheme, getFileTags, getFileLinks, saveLocalDb, syncMetaAndDB }
  };
}