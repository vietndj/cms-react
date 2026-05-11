import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  username, SECRET_PIN, safeEnc, encodeBase64UTF8Async, getContrastYIQ, 
  fetchRawJSON, fetchText, getFileShaSafe, getLastContextFromDB, 
  removeAccents, getStringColor, getTimelineLabel, generateSlug 
} from './utils.js';

// ==========================================
// KHU VỰC 1: TỐI ƯU CSS (GIẢI PHÓNG CODE RÁC TRONG JSX)
// ==========================================
const UI = {
  card: "cms-card flex flex-col relative transition border cms-border hover:border-[var(--accent)] cursor-pointer group shadow-sm bg-[var(--bg-card)] rounded-2xl overflow-hidden",
  input: "px-4 py-3 bg-[var(--bg-hover)] rounded-xl text-sm font-bold outline-none text-[var(--text-main)] border cms-border focus:border-[var(--accent)] transition w-full",
  btnTool: "px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border)] flex items-center gap-1",
  btnSave: "bg-[var(--accent)] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition disabled:opacity-50",
  tagBase: "text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-tight border border-[var(--border)]",
  iconBtn: "p-1.5 opacity-50 hover:opacity-100 hover:bg-[var(--bg-hover)] rounded transition"
};

// ==========================================
// KHU VỰC 2: SVG ICONS
// ==========================================
const SVGIcons = () => (
  <svg style={{ display: 'none' }}>
    <symbol id="icon-folder" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></symbol>
    <symbol id="icon-edit" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></symbol>
    <symbol id="icon-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="2" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="m21 21-4.3-4.3" /></symbol>
    <symbol id="icon-pin" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 17v5"/><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></symbol>
    <symbol id="icon-pin-filled" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 17v5"/><path fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></symbol>
    <symbol id="icon-palette" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" /></symbol>
    <symbol id="icon-link" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></symbol>
    <symbol id="icon-list" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></symbol>
    <symbol id="icon-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/></symbol>
    <symbol id="icon-kanban" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2"/><line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="2"/></symbol>
    <symbol id="icon-feed" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/><line x1="9" y1="21" x2="9" y2="9" stroke="currentColor" strokeWidth="2"/></symbol>
  </svg>
);

// ==========================================
// KHU VỰC 3: BỘ NÃO (DATA & STATE HOOK)
// ==========================================
function useCMS() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [token, setToken] = useState('');
  const [db, setDb] = useState({ files: [], repos: {}, tags: {}, pinned: [], links: {}, colors: {}, titles: {}, tasks: [] });
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
    if (localStorage.getItem("cms_auth") === "granted") setIsAuthenticated(true);
    const savedToken = localStorage.getItem('github_pat'); if (savedToken) setToken(savedToken);
    try { const localDb = JSON.parse(localStorage.getItem('cms_repo_data')); if (localDb && localDb.files) setDb(localDb); } catch(e){}
  }, []);

  useEffect(() => { if (isAuthenticated && token && db.files.length === 0) loadDatabase(); }, [isAuthenticated, token]);

  const loadDatabase = async () => {
    if (!token) { setStatus({ text: 'Cần có Token!', type: 'error' }); setTimeout(() => setStatus({ text: '', type: '' }), 3000); return; }
    if (isSyncing) return;
    setIsSyncing(true); setStatus({ text: 'Đang tải DB...', type: 'loading' });
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
        const loadedDb = { files: cleanFiles, repos: reposMap, tags: meta?.tags || {}, pinned: meta?.pinned || [], links: meta?.links || {}, colors: meta?.colors || {}, titles: meta?.titles || {}, tasks: meta?.tasks || [] };
        saveLocalDb(loadedDb);
        if (!title && !content && !editorOriginal.sha) { const ctx = getLastContextFromDB(loadedDb); setRepo(ctx.repo); setTags(ctx.tags); }
        setStatus({ text: 'Xong!', type: 'success' }); setTimeout(() => setStatus({ text: '', type: '' }), 2000);
      }
    } catch (e) { setStatus({ text: 'Lỗi DB', type: 'error' }); } finally { setIsSyncing(false); }
  };

  const syncMetaAndDB = async (dbState) => {
      const metaContent = await encodeBase64UTF8Async(JSON.stringify({ _version: 8, tags: dbState.tags, links: dbState.links, tasks: dbState.tasks, pinned: dbState.pinned, colors: dbState.colors, titles: dbState.titles }, null, 2));
      const metaSha = await getFileShaSafe(`${username}/${username}.github.io`, 'metadata.json', token);
      await fetch(`https://api.github.com/repos/${username}/${username}.github.io/contents/metadata.json`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Sync Meta', content: metaContent, sha: metaSha || undefined }) });
      const dbContent = await encodeBase64UTF8Async(JSON.stringify({ allFiles: dbState.files }));
      const dbSha = await getFileShaSafe(`${username}/${username}.github.io`, 'cms_db.json', token);
      await fetch(`https://api.github.com/repos/${username}/${username}.github.io/contents/cms_db.json`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Sync DB', content: dbContent, sha: dbSha || undefined }) });
  };

  const handleSaveArticle = async () => {
    if (!token || !repo || !title || !content) return alert("Thiếu dữ liệu!");
    setIsSaving(true); setStatus({ text: 'Đang lưu...', type: 'loading' });
    try {
      let filename = slug.endsWith('.html') ? slug : slug + '.html';
      let rName = repo.includes('/') ? repo.split('/')[1] : repo;
      let rOwner = repo.includes('/') ? repo.split('/')[0] : username;
      let fileKey = `${rName}/${filename}`;
      const encodedContent = await encodeBase64UTF8Async(content);
      let fileSha = await getFileShaSafe(`${rOwner}/${rName}`, filename, token);
      
      const resHTML = await fetch(`https://api.github.com/repos/${rOwner}/${rName}/contents/${safeEnc(filename)}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Save: ${title}`, content: encodedContent, sha: fileSha || undefined }) });
      if (!resHTML.ok) throw new Error("Ghi HTML thất bại");
      const resHTMLData = await resHTML.json();

      const oldRepoName = editorOriginal.repo ? (editorOriginal.repo.includes('/') ? editorOriginal.repo.split('/')[1] : editorOriginal.repo) : null;
      if (editorOriginal.filename && (oldRepoName !== rName || editorOriginal.filename !== filename) && editorOriginal.sha) {
        const oldOwner = editorOriginal.repo.split('/')[0] || username;
        let currentOldSha = await getFileShaSafe(`${oldOwner}/${oldRepoName}`, editorOriginal.filename, token);
        if (currentOldSha) await fetch(`https://api.github.com/repos/${oldOwner}/${oldRepoName}/contents/${safeEnc(editorOriginal.filename)}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Xóa file cũ`, sha: currentOldSha }) });
      }

      let newTags = { ...db.tags }; let tagArr = tags.split(',').map(x => x.trim()).filter(Boolean);
      if (tagArr.length) newTags[fileKey] = tagArr; else delete newTags[fileKey];
      let newTitles = { ...db.titles }; newTitles[fileKey] = title;
      let newLinksDb = { ...db.links }; let validLinks = uploadLinks.filter(l => l.title.trim() && l.url.trim());
      if (validLinks.length) newLinksDb[fileKey] = validLinks; else delete newLinksDb[fileKey];
      
      let newFiles = [...db.files].filter(f => !(f.repoName === rName && f.fileName === filename) && !(oldRepoName && f.repoName === oldRepoName && f.fileName === editorOriginal.filename));
      const dDate = new Date();
      newFiles.unshift({ repoName: rName, name: title, fileName: filename, sha: resHTMLData.content?.sha || fileSha, url: `https://${rOwner}.github.io/${rName === `${rOwner}.github.io` ? '' : rName + '/'}${filename}`, timestamp: dDate.getTime(), fullDate: dDate.toLocaleString('vi-VN'), preview: content.substring(0, 150).replace(/<[^>]*>?/gm, '') });
      
      const newState = { ...db, files: newFiles, tags: newTags, titles: newTitles, links: newLinksDb };
      await syncMetaAndDB(newState); saveLocalDb(newState);
      setStatus({ text: 'Thành công!', type: 'success' });
      setTitle(''); setSlug(''); setContent(''); setUploadLinks([]); setIsSlugEdited(false); setEditorOriginal({ repo:'', filename:'', sha:'' });
      setTimeout(() => setStatus({ text: '', type: '' }), 3000);
    } catch (e) { setStatus({ text: 'Lỗi lưu bài', type: 'error' }); } finally { setIsSaving(false); }
  };

  const editFileContent = async (rName, f, sha) => {
    setIsEditorOpen(true); window.scrollTo({top:0,behavior:'smooth'}); setStatus({ text: 'Đang nạp...', type: 'loading' });
    try {
      const res = await fetchText(`https://api.github.com/repos/${username}/${rName}/contents/${safeEnc(f)}?t=${Date.now()}`, token);
      if(res) {
        setContent(res);
        const rp = rName === username || rName === `${username}.github.io` ? `${username}/${username}.github.io` : `${username}/${rName}`;
        const fileKey = `${rName}/${f}`;
        setRepo(rp); setTitle(db.titles[fileKey] || f.replace('.html','')); setSlug(f.replace('.html','')); setIsSlugEdited(true);
        setTags((db.tags[fileKey] || []).join(', ')); setUploadLinks(db.links[fileKey] ? JSON.parse(JSON.stringify(db.links[fileKey])) : []);
        setEditorOriginal({ repo: rp, filename: f, sha: sha });
        setStatus({ text: 'Xong!', type: 'success' }); setTimeout(() => setStatus({ text: '', type: '' }), 1000);
      }
    } catch(e) { setStatus({ text: 'Lỗi nạp', type: 'error' }); }
  };

  const togglePin = async (r, f) => {
    const k = `${r}/${f}`; let newPinned = [...db.pinned];
    if(newPinned.includes(k)) newPinned = newPinned.filter(x => x !== k); else newPinned.push(k);
    const newDb = { ...db, pinned: newPinned }; saveLocalDb(newDb); syncMetaAndDB(newDb);
  };
  const handleSetColor = async (fileKey, color) => {
      const newColors = { ...db.colors };
      if (color) newColors[fileKey] = color; else delete newColors[fileKey];
      const newState = { ...db, colors: newColors };
      setDb(newState); await syncMetaAndDB(newState); saveLocalDb(newState); setActiveColorPickerCard(null); 
  };
  const saveLocalDb = (newDb) => { try { localStorage.setItem('cms_repo_data', JSON.stringify(newDb)); setDb(newDb); } catch(e) { setDb(newDb); } };
  const changeTheme = (theme) => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('cms_theme', theme); setIsToolsOpen(false); };
  const handleLogin = () => { if (pin.trim() === SECRET_PIN) { localStorage.setItem("cms_auth", "granted"); setIsAuthenticated(true); } else alert("Mã PIN sai."); };
  
  const getFileTags = (r, f) => db.tags[`${r}/${f}`] || [];
  const getFileLinks = (r, f) => db.links[`${r}/${f}`] || []; 
  const repoKeysList = useMemo(() => { const keys = Object.keys(db.repos || {}); if (!keys.includes(`${username}.github.io`)) keys.unshift(`${username}.github.io`); return keys; }, [db.repos]);
  const allUniqueTags = useMemo(() => { const s = new Set(); Object.values(db.tags).forEach(a => a.forEach(t => s.add(t))); return Array.from(s).sort(); }, [db.tags]);

  const processedFiles = useMemo(() => {
    let query = removeAccents(searchQuery);
    return db.files.filter(f => {
        let matchTag = activeTag === 'all' || getFileTags(f.repoName, f.fileName).includes(activeTag);
        let matchRepo = activeRepo === 'all' || f.repoName === activeRepo;
        let matchQuery = !query || removeAccents(f.name).includes(query) || (isDeepSearch && removeAccents(f.preview).includes(query));
        return matchTag && matchRepo && matchQuery;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [db.files, activeRepo, activeTag, searchQuery, isDeepSearch, db.tags]);

  const groupedFilesByRepo = useMemo(() => { 
    const groups = {}; 
    processedFiles.filter(f => !db.pinned.includes(`${f.repoName}/${f.fileName}`)).forEach(f => { if (!groups[f.repoName]) groups[f.repoName] = []; groups[f.repoName].push(f); }); 
    const sortedGroups = {}; 
    Object.keys(groups).sort((a,b) => Math.max(...groups[b].map(x=>x.timestamp)) - Math.max(...groups[a].map(x=>x.timestamp))).forEach(r => {
        if (currentView === 'grid' && groups[r].length > 10) {
            const sub = {}; groups[r].forEach(f => { const l = getTimelineLabel(f.timestamp); if (!sub[l]) sub[l] = []; sub[l].push(f); });
            sortedGroups[r] = { isSub: true, data: sub };
        } else sortedGroups[r] = { isSub: false, data: groups[r] };
    });
    return sortedGroups; 
  }, [processedFiles, currentView, db.pinned]);

  return {
    state: { isAuthenticated, pin, token, db, status, isSyncing, searchQuery, isDeepSearch, activeRepo, activeTag, currentView, isTasksOpen, isToolsOpen, nativeTaskInput, activeColorPickerCard, isEditorOpen, isSaving, repo, tags, title, slug, isSlugEdited, uploadLinks, content, editorOriginal, toolsMenuRef, editorInputRef },
    data: { repoKeysList, allUniqueTags, processedFiles, groupedFilesByRepo, getFileTags, getFileLinks },
    actions: { setIsAuthenticated, setPin, setToken, setDb, setStatus, setIsSyncing, setSearchQuery, setIsDeepSearch, setActiveRepo, setActiveTag, setCurrentView, setIsTasksOpen, setIsToolsOpen, setNativeTaskInput, setActiveColorPickerCard, setIsEditorOpen, setIsSaving, setRepo, setTags, setTitle, setSlug, setIsSlugEdited, setUploadLinks, setContent, setEditorOriginal, loadDatabase, syncMetaAndDB, handleSaveArticle, editFileContent, togglePin, handleSetColor, saveLocalDb, changeTheme, handleLogin }
  };
}

// ==========================================
// KHU VỰC 4: KHUNG XƯƠNG CHÍNH (APP)
// ==========================================
export default function App() {
  const cms = useCMS();
  const { state, actions } = cms;

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
        const isCmd = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? e.metaKey : e.ctrlKey;
        if (isCmd && e.key.toLowerCase() === 'k') { 
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
            e.preventDefault(); document.getElementById('search-input-main')?.focus(); 
        }
    };
    window.addEventListener('keydown', handleGlobalKeyDown); return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  if (!state.isAuthenticated) return <LoginScreen cms={cms} />;

  return (
    <div className="flex-col w-full min-h-screen fade-in flex bg-[var(--bg-body)] pb-20" onClick={() => actions.setActiveColorPickerCard(null)}>
      <SVGIcons />
      <Header cms={cms} />
      <FilterNav cms={cms} />
      
      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto items-start w-full relative mt-6">
        <main className="flex-1 w-full min-w-0 flex flex-col gap-8">
          <EditorCard cms={cms} />
          <RecentFiles cms={cms} />
          <MasterViews cms={cms} />
        </main>
        {state.isTasksOpen && <TasksSidebar cms={cms} />}
      </div>

      <Toast status={state.status} />
    </div>
  );
}

// ==========================================
// KHU VỰC 5: CÁC COMPONENT GIAO DIỆN ẢO (UI)
// ==========================================

const LoginScreen = ({ cms }) => (
    <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[var(--bg-body)]">
        <div className="cms-card p-10 max-w-sm w-full mx-4 text-center rounded-3xl shadow-2xl border cms-border">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-main)]">Workspace</h2>
            <input type="password" placeholder="••••" value={cms.state.pin} onChange={(e) => cms.actions.setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && cms.actions.handleLogin()} className="w-full text-center text-3xl font-bold px-4 py-4 bg-[var(--bg-hover)] rounded-2xl mb-6 border cms-border outline-none text-[var(--text-main)] tracking-widest" />
            <button onClick={cms.actions.handleLogin} className="w-full py-4 bg-[var(--accent)] text-white rounded-xl font-bold hover:opacity-90 transition">Mở Khóa</button>
        </div>
    </div>
);

const Header = ({ cms: { state, actions } }) => (
    <header className="bg-[var(--bg-card)] border-b border-[var(--border)] pt-4 pb-3 px-4 md:px-8 flex flex-col md:flex-row items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--accent)]">vietndj</h1>
        <div className="flex-1 flex w-full items-center gap-2">
            <div className="flex-1 flex items-center bg-[var(--bg-hover)] rounded-xl px-4 py-2 border cms-border">
                <svg className="w-4 h-4 text-[var(--text-muted)]"><use href="#icon-search"></use></svg>
                <input id="search-input-main" type="text" value={state.searchQuery} onChange={(e)=>actions.setSearchQuery(e.target.value)} placeholder="Tìm kiếm... (Ctrl K)" className="bg-transparent border-none outline-none text-sm w-full ml-3 font-bold text-[var(--text-main)] placeholder-[var(--text-muted)]" />
            </div>
            <button onClick={() => actions.setIsDeepSearch(!state.isDeepSearch)} className={`shrink-0 ${UI.btnTool} ${state.isDeepSearch ? 'bg-[var(--accent)] text-white border-transparent' : 'cms-border'}`}><svg className="w-4 h-4"><use href="#icon-search"></use></svg> Sâu</button>
        </div>
        <div className="flex items-center gap-2 relative" ref={state.toolsMenuRef}>
            <button onClick={actions.loadDatabase} className={UI.btnTool}>Tải DB</button>
            <button onClick={()=>actions.setIsTasksOpen(!state.isTasksOpen)} className={UI.btnTool}>Việc</button>
            <button onClick={() => actions.setIsToolsOpen(!state.isToolsOpen)} className={UI.btnTool}>Công cụ ▾</button>
            {state.isToolsOpen && ( 
                <div className="absolute right-0 top-full mt-2 w-56 p-2 z-[100] cms-card rounded-xl shadow-2xl border cms-border fade-in">
                    <div className="flex gap-1 px-1 mb-3">
                        <button onClick={() => actions.changeTheme('light')} className="flex-1 py-1.5 rounded text-[11px] font-bold border cms-border hover:bg-[var(--bg-hover)]">Sáng</button>
                        <button onClick={() => actions.changeTheme('dark')} className="flex-1 py-1.5 rounded text-[11px] font-bold border cms-border hover:bg-[var(--bg-hover)]">Tối</button>
                    </div>
                    <button onClick={() => window.open('https://vietndj.github.io/tin.html', '_blank')} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-[var(--bg-hover)] rounded text-[var(--text-main)]">📖 Mở Reader</button>
                    <button onClick={() => { window.open('https://vietndj.github.io/export.html', '_blank'); actions.setIsToolsOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-[#8E44AD] hover:bg-[var(--bg-hover)] rounded">🤖 Xuất Sách AI</button>
                    <hr className="my-1 border-t cms-border"/><button onClick={() => {localStorage.removeItem("cms_auth"); actions.setIsAuthenticated(false);}} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-[var(--bg-hover)] rounded">🔒 Khóa App</button>
                </div> 
            )}
        </div>
    </header>
);

const FilterNav = ({ cms: { state, data, actions } }) => (
    <nav className="bg-[var(--bg-body)] border-b border-[var(--border)] py-2 px-4 md:px-8 sticky top-0 z-40 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0 mr-2">VIEW</span>
            <div className="flex bg-[var(--bg-hover)] p-1 rounded-lg border cms-border gap-1">
                {[ {id:'list',i:'#icon-list',t:'List'}, {id:'grid',i:'#icon-grid',t:'Grid'}, {id:'kanban',i:'#icon-kanban',t:'Kanban'}, {id:'table',i:'#icon-list',t:'Table'}, {id:'feed',i:'#icon-feed',t:'Feed'} ].map(v => (
                    <button key={v.id} onClick={() => actions.setCurrentView(v.id)} className={`px-3 py-1 rounded-md transition text-[11px] font-bold flex items-center gap-1.5 ${state.currentView === v.id ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent'}`}>
                        <svg className="w-3.5 h-3.5"><use href={v.i}></use></svg> <span className="hidden md:block">{v.t}</span>
                    </button>
                ))}
            </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0">KHO</span>{data.repoKeysList.map(r => <button key={r} onClick={() => actions.setActiveRepo(state.activeRepo===r?'all':r)} className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${state.activeRepo===r?'bg-[var(--accent)] text-white shadow-sm':'bg-[var(--bg-hover)] text-[var(--text-main)] border cms-border'}`}>{r}</button>)}</div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0">TAG</span>{data.allUniqueTags.map(t => <button key={t} onClick={() => actions.setActiveTag(state.activeTag===t?'all':t)} className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${state.activeTag===t?'bg-[var(--accent)] text-white shadow-sm':'bg-[var(--bg-hover)] text-[var(--text-main)] border cms-border'}`}>{t}</button>)}</div>
    </nav>
);

const EditorCard = ({ cms: { state, actions, data } }) => {
    const handleContentChange = (e) => {
        const val = e.target.value; actions.setContent(val);
        if (!state.title.trim() && val.includes('<title>')) {
            const match = val.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            if (match && match[1]) { const extractedTitle = match[1].trim(); actions.setTitle(extractedTitle); if (!state.isSlugEdited) actions.setSlug(generateSlug(extractedTitle, state.tags)); }
        }
    };
    
    return (
        <section className="cms-card overflow-hidden border border-[var(--border)] shadow-sm rounded-xl">
            <button onClick={() => actions.setIsEditorOpen(!state.isEditorOpen)} className="w-full px-6 py-4 flex justify-between items-center bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] font-bold text-[var(--accent)] outline-none transition">
                <span className="flex items-center gap-2 text-base"><svg className="w-5 h-5"><use href="#icon-edit"></use></svg> Soạn thảo HTML</span><span>{state.isEditorOpen?'▲':'▼'}</span>
            </button>
            {state.isEditorOpen && (
            <div className="p-6 flex flex-col gap-5 border-t border-[var(--border)] bg-[var(--bg-card)]">
                <div className="flex flex-wrap gap-2">{data.repoKeysList.map(r => <button key={r} onClick={() => actions.setRepo(`${username}/${r}`)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border ${state.repo===`${username}/${r}`?'bg-[var(--accent)] text-white border-transparent':'bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border)]'}`}>{r}</button>)}</div>
                <textarea ref={state.editorInputRef} rows="12" value={state.content} onChange={handleContentChange} className="w-full p-5 bg-[#1D1D1F] text-[#34C759] rounded-xl font-mono text-sm outline-none shadow-inner" placeholder="Dán HTML vào đây..."></textarea>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <input type="text" value={state.title} onChange={e => {actions.setTitle(e.target.value); if(!state.isSlugEdited) actions.setSlug(generateSlug(e.target.value, state.tags))}} className={UI.input} placeholder="Tiêu đề..." />
                    <input type="text" value={state.slug} onChange={e => {actions.setSlug(e.target.value); actions.setIsSlugEdited(true)}} className={`${UI.input} font-mono text-[var(--accent)]`} placeholder="slug..." />
                </div>
                <div className="flex justify-between items-center pt-4 border-t cms-border">
                    <button onClick={actions.handleSaveArticle} disabled={state.isSaving} className={UI.btnSave}>LƯU BÀI (Ctrl S)</button>
                    {state.editorOriginal.sha && <button onClick={()=>{ actions.setTitle(''); actions.setSlug(''); actions.setContent(''); actions.setEditorOriginal({repo:'',filename:'',sha:''}); actions.setIsSlugEdited(false); }} className="text-red-500 font-bold px-4 py-2 hover:bg-[var(--bg-hover)] rounded-xl">✕ HỦY SỬA</button>}
                </div>
            </div>
            )}
        </section>
    );
};

const RecentFiles = ({ cms: { state, actions } }) => {
    const recent = (state.activeTag==='all' && state.activeRepo==='all' && !state.searchQuery) ? [...state.db.files].sort((a,b)=>b.timestamp-a.timestamp).slice(0, 8) : [];
    if(recent.length === 0) return null;
    return (
        <div className="mb-4">
            <div className="flex items-center mb-5 gap-2 ml-1"><div className="w-3 h-3 bg-[var(--text-main)] rounded-full"></div><h3 className="font-bold text-lg text-[var(--accent)]">Vừa thao tác gần đây</h3></div>
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x">
            {recent.map(f => (
                <div key={f.sha} onClick={() => window.open(f.url, '_blank')} className={`${UI.card} p-4 min-w-[280px] max-w-[280px] snap-start`}>
                    <div className="flex items-center gap-1.5 mb-2 opacity-60"><svg className="w-3 h-3"><use href="#icon-folder"></use></svg><span className="text-[10px] font-bold uppercase">{f.repoName}</span></div>
                    <h4 className="font-bold text-[15px] leading-[1.4] mb-6 line-clamp-2 text-[var(--text-main)]">{f.name}</h4>
                    <div className="mt-auto flex justify-between items-center pt-3 border-t cms-border">
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">{f.fullDate?.split(' ')[0]}</span>
                        <button onClick={(e)=>{e.stopPropagation(); actions.editFileContent(f.repoName, f.fileName, f.sha)}} className="bg-[#3B82F6]/10 text-[#3B82F6] font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-[#3B82F6]/20 transition">Sửa</button>
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
};

const TasksSidebar = ({ cms: { state, actions } }) => (
    <aside className="w-full lg:w-[320px] shrink-0 sticky top-[130px] h-[calc(100vh-150px)] fade-in">
        <div className="bg-[var(--bg-card)] p-5 flex flex-col h-full border border-[var(--border)] rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-5"><h2 className="text-xs font-black text-[var(--accent)] uppercase tracking-widest flex items-center gap-2"><svg className="w-4 h-4"><use href="#icon-edit"></use></svg> Ghi chú</h2><button onClick={()=>actions.setIsTasksOpen(false)} className="text-[var(--text-muted)] font-bold hover:text-red-500 px-2">✕</button></div>
            <div className="flex gap-2 mb-5"><input type="text" value={state.nativeTaskInput} onChange={e=>actions.setNativeTaskInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && state.nativeTaskInput){const n=[{id:Date.now(),title:state.nativeTaskInput,completed:false},...state.db.tasks]; actions.saveLocalDb({...state.db,tasks:n}); actions.syncMetaAndDB({...state.db,tasks:n}); actions.setNativeTaskInput('');}}} className={UI.input} placeholder="Gõ rồi Enter..." /></div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
            {state.db.tasks.map(t => <div key={t.id} className="p-3 flex gap-3 rounded-xl text-xs font-medium leading-relaxed bg-[var(--bg-hover)] border cms-border text-[var(--text-main)] group hover:border-[var(--accent)] transition"><input type="checkbox" checked={t.completed} onChange={()=>{const n=state.db.tasks.map(x=>x.id===t.id?{...x,completed:!x.completed}:x); actions.saveLocalDb({...state.db,tasks:n}); actions.syncMetaAndDB({...state.db,tasks:n});}} className="mt-1 accent-[var(--accent)] w-4 h-4 cursor-pointer" /><span className={`flex-1 ${t.completed ? 'opacity-50 line-through' : ''}`}>{t.title}</span><button onClick={()=>{const n=state.db.tasks.filter(x=>x.id!==t.id); actions.saveLocalDb({...state.db,tasks:n}); actions.syncMetaAndDB({...state.db,tasks:n});}} className="text-red-500 font-bold opacity-0 group-hover:opacity-100 px-2 transition">✕</button></div>)}
            </div>
        </div>
    </aside>
);

const Toast = ({ status }) => status.text && (
    <div className="fixed top-[80px] left-1/2 transform -translate-x-1/2 z-[9999999] pointer-events-none fade-in">
        <div className={`bg-[var(--bg-card)] px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 border-2 font-bold text-sm text-[var(--text-main)] ${status.type === 'error' ? 'border-red-500' : status.type === 'loading' ? 'border-[var(--accent)]' : 'border-green-500'}`}>
            {status.type === 'loading' && <div className="animate-spin h-5 w-5 border-2 border-[var(--accent)] border-t-transparent rounded-full"></div>}
            <span className="whitespace-nowrap">{status.text}</span>
        </div>
    </div>
);

// === MASTER VIEWS CHỨA CÁC KIỂU RENDER ===
const MasterViews = ({ cms }) => {
    const { state, data, actions } = cms;
    const pinnedFiles = data.processedFiles.filter(f => state.db.pinned.includes(`${f.repoName}/${f.fileName}`));

    const CardActions = ({ f, fileKey, isP, textMutedColor }) => (
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
            <button onClick={(e)=>{e.stopPropagation(); actions.togglePin(f.repoName, f.fileName);}} className={UI.iconBtn} style={{color: isP ? '#FF9500' : textMutedColor}}><svg className="w-4 h-4"><use href={isP ? "#icon-pin-filled" : "#icon-pin"}></use></svg></button>
            <button onClick={(e)=>{e.stopPropagation(); actions.setActiveColorPickerCard(state.activeColorPickerCard === fileKey ? null : fileKey);}} className={UI.iconBtn} style={{color: state.activeColorPickerCard === fileKey ? 'var(--accent)' : textMutedColor}}><svg className="w-4 h-4"><use href="#icon-palette"></use></svg></button>
            <button onClick={(e)=>{e.stopPropagation(); actions.editFileContent(f.repoName, f.fileName, f.sha);}} className={UI.iconBtn} style={{color: textMutedColor}}><svg className="w-4 h-4"><use href="#icon-edit"></use></svg></button>
        </div>
    );

    const TagsAndLinks = ({ tags, links, btnBg, textColor }) => (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map(t => <span key={t} className={UI.tagBase} style={{backgroundColor: btnBg, color: textColor}}>{t}</span>)}
            {links.map((lnk, i) => <a key={i} href={lnk.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className={`${UI.tagBase} flex items-center gap-1 hover:opacity-80`} style={{backgroundColor: btnBg, color: 'var(--accent)'}}><svg className="w-3 h-3"><use href="#icon-link"></use></svg> {lnk.title}</a>)}
        </div>
    );

    const GridView = ({ files }) => (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 w-full">
        {files.map(f => {
          const fileKey = `${f.repoName}/${f.fileName}`;
          const isP = state.db.pinned.includes(fileKey);
          const col = state.db.colors[fileKey] || 'var(--bg-card)';
          const isDark = col !== 'var(--bg-card)' && getContrastYIQ(col) === '#FFFFFF';
          const textColor = isDark ? '#FFF' : 'var(--text-main)';
          const tagsList = data.getFileTags(f.repoName, f.fileName);
          const tagCol = tagsList.length > 0 ? getStringColor(tagsList[0]) : 'var(--border)';
          return (
            <div key={f.sha} className={`${UI.card} p-5`} onClick={() => window.open(f.url, '_blank')} style={{backgroundColor: col, color: textColor, borderTop: col==='var(--bg-card)'?`3px solid ${tagCol}`:''}}>
               <div className="flex items-start gap-4 mb-4">
                  {col==='var(--bg-card)' && <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{backgroundColor: tagCol}}>{f.name.charAt(0).toUpperCase()}</div>}
                  <h4 className="font-bold leading-[1.4] text-[16px] line-clamp-3">{f.name}</h4>
               </div>
               <TagsAndLinks tags={tagsList} links={data.getFileLinks(f.repoName, f.fileName)} btnBg={isDark?'rgba(255,255,255,0.1)':'var(--bg-hover)'} textColor={textColor} />
               <div className="mt-auto pt-3 border-t cms-border flex justify-between items-center opacity-60 group-hover:opacity-100 transition">
                  <span className="text-[9px] font-mono">{f.fullDate?.split(' ')[0]}</span>
                  <CardActions f={f} fileKey={fileKey} isP={isP} textMutedColor={isDark?'rgba(255,255,255,0.7)':'var(--text-muted)'} />
               </div>
               {state.activeColorPickerCard === fileKey && (
                  <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[var(--bg-body)] border cms-border p-2 rounded-xl shadow-xl flex gap-1 z-50 fade-in" onClick={e => e.stopPropagation()}>
                      {[null, '#F2F2F7', '#FFD8BF', '#FFE58F', '#D9F7BE', '#BAE7FF', '#D6E4FF', '#EFDBFF', '#FFD6E7', '#1D1D1F'].map((c, i) => <button key={i} onClick={() => actions.handleSetColor(fileKey, c)} className="w-5 h-5 rounded-full border hover:scale-125 transition" style={{ backgroundColor: c || 'var(--bg-card)', borderColor: c ? 'transparent' : 'var(--border)' }}></button>)}
                  </div>
               )}
            </div>
          )
        })}
      </div>
    );

    const KanbanView = () => {
        const columns = Object.keys(data.groupedFilesByRepo);
        if (columns.length === 0 && pinnedFiles.length === 0) return <div className="text-center py-20 text-[var(--text-muted)] font-bold text-sm">Trống</div>;
        return (
            <div className="flex overflow-x-auto gap-6 pb-6 w-full items-start kanban-scroll min-h-[70vh]">
                {pinnedFiles.length > 0 && (
                    <div className="w-[320px] shrink-0 bg-[#F9FAFB] dark:bg-[#121212] border cms-border rounded-2xl flex flex-col max-h-[80vh]">
                        <div className="p-4 flex justify-between items-center font-bold text-sm text-[#FF9500]"><span className="flex items-center gap-2"><svg className="w-4 h-4"><use href="#icon-pin-filled"></use></svg> Đã ghim</span><span className="bg-[var(--bg-card)] text-[var(--text-main)] text-xs px-2 py-0.5 rounded-full border cms-border shadow-sm">{pinnedFiles.length}</span></div>
                        <div className="overflow-y-auto px-3 pb-3 space-y-3 kanban-scroll flex-1">
                            {pinnedFiles.map(f => {
                                const fileKey = `${f.repoName}/${f.fileName}`; const col = state.db.colors[fileKey] || 'var(--bg-card)'; const isDark = col !== 'var(--bg-card)' && getContrastYIQ(col) === '#FFFFFF'; const textColor = isDark ? '#FFF' : 'var(--text-main)';
                                return (
                                    <div key={f.sha} className={`${UI.card} p-4`} onClick={() => window.open(f.url, '_blank')} style={{backgroundColor: col, color: textColor}}>
                                        <h4 className="font-bold text-[14px] leading-[1.4] mb-3 line-clamp-3">{f.name}</h4>
                                        <TagsAndLinks tags={data.getFileTags(f.repoName, f.fileName)} links={data.getFileLinks(f.repoName, f.fileName)} btnBg={isDark?'rgba(255,255,255,0.1)':'var(--bg-hover)'} textColor={textColor} />
                                        <div className="flex justify-between items-center mt-4 pt-3 border-t cms-border opacity-60 group-hover:opacity-100 transition"><span className="text-[10px] font-mono">{f.fullDate?.split(' ')[0]}</span><CardActions f={f} fileKey={fileKey} isP={true} textMutedColor={isDark?'rgba(255,255,255,0.7)':'var(--text-muted)'} /></div>
                                    </div>
                                )
                            })} 
                        </div>
                    </div>
                )}
                {columns.map(repoName => {
                    const groupInfo = data.groupedFilesByRepo[repoName]; const files = groupInfo.isSub ? Object.values(groupInfo.data).flat() : groupInfo.data;
                    return (
                        <div key={repoName} className="w-[320px] shrink-0 bg-[#F9FAFB] dark:bg-[#121212] border cms-border rounded-2xl flex flex-col max-h-[80vh]">
                            <div className="p-4 flex justify-between items-center font-bold text-sm text-[var(--text-main)]"><span className="flex items-center gap-2 uppercase tracking-widest"><svg className="w-4 h-4 opacity-50"><use href="#icon-folder"></use></svg> {repoName}</span><span className="bg-[var(--bg-card)] text-[var(--text-main)] text-xs px-2 py-0.5 rounded-full border cms-border shadow-sm">{files.length}</span></div>
                            <div className="overflow-y-auto px-3 pb-3 space-y-3 kanban-scroll flex-1">
                                {files.map(f => {
                                    const fileKey = `${f.repoName}/${f.fileName}`; const col = state.db.colors[fileKey] || 'var(--bg-card)'; const isDark = col !== 'var(--bg-card)' && getContrastYIQ(col) === '#FFFFFF'; const textColor = isDark ? '#FFF' : 'var(--text-main)';
                                    return (
                                        <div key={f.sha} className={`${UI.card} p-4`} onClick={() => window.open(f.url, '_blank')} style={{backgroundColor: col, color: textColor}}>
                                            <h4 className="font-bold text-[14px] leading-[1.4] mb-3 line-clamp-3">{f.name}</h4>
                                            <TagsAndLinks tags={data.getFileTags(f.repoName, f.fileName)} links={data.getFileLinks(f.repoName, f.fileName)} btnBg={isDark?'rgba(255,255,255,0.1)':'var(--bg-hover)'} textColor={textColor} />
                                            <div className="flex justify-between items-center mt-4 pt-3 border-t cms-border opacity-60 group-hover:opacity-100 transition"><span className="text-[10px] font-mono">{f.fullDate?.split(' ')[0]}</span><CardActions f={f} fileKey={fileKey} isP={false} textMutedColor={isDark?'rgba(255,255,255,0.7)':'var(--text-muted)'} /></div>
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

    if (data.processedFiles.length === 0) return <div className="text-center py-20 font-bold opacity-50">Trống</div>;
    if (state.currentView === 'kanban') return <KanbanView />;

    return (
      <div className="flex flex-col gap-10 w-full">
        {pinnedFiles.length > 0 && (
          <div><h3 className="font-bold text-lg mb-4 border-b border-[var(--border)] pb-2 flex items-center gap-2 text-[#FF9500]"><svg className="w-5 h-5"><use href="#icon-pin-filled"></use></svg> Đã ghim</h3><GridView files={pinnedFiles} /></div>
        )}
        {Object.keys(data.groupedFilesByRepo).map(r => (
          <div key={r}><h3 className="font-bold text-xl mb-4 border-b border-[var(--border)] pb-2 flex items-center gap-2"><svg className="w-6 h-6 opacity-70"><use href="#icon-folder"></use></svg> {r}</h3>
            {data.groupedFilesByRepo[r].isSub ? (
                <div className="flex flex-col gap-8">
                    {Object.keys(data.groupedFilesByRepo[r].data).map(tl => (
                        <div key={tl} className="ml-4 border-l-2 border-[var(--border)] pl-6">
                            <h4 className="font-bold text-sm text-[var(--text-muted)] mb-4">{tl}</h4>
                            <GridView files={data.groupedFilesByRepo[r].data[tl]} />
                        </div>
                    ))}
                </div>
            ) : <GridView files={data.groupedFilesByRepo[r].data} />}
          </div>
        ))}
      </div>
    );
};