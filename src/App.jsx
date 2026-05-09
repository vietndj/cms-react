import React, { useState, useEffect, useMemo, useRef } from 'react';

// ==========================================
// 1. TIỆN ÍCH GITHUB API & CORE LOGIC
// ==========================================
const username = 'vietndj';
const SECRET_PIN = "0070";
const safeEnc = (fn) => { try { fn = decodeURIComponent(fn); } catch(e){} return encodeURIComponent(fn); };
const encodeBase64UTF8Async = async (str) => { const bytes = new TextEncoder().encode(str); let binary = ''; for (let i = 0; i < bytes.byteLength; i += 16384) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 16384)); return btoa(binary); };
const getHeaders = (token) => token ? { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' } : { 'Accept': 'application/vnd.github.v3+json' };

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
    <symbol id="icon-move" viewBox="0 0 24 24"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></symbol>
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
  const [activeRepo, setActiveRepo] = useState('all');
  const [activeTag, setActiveTag] = useState('all');
  
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
            e.preventDefault(); const btnSave = document.getElementById('btn-save-article'); if (btnSave && !btnSave.disabled) btnSave.click();
        }
        if (isCmd && e.key.toLowerCase() === 'k') {
            e.preventDefault(); document.getElementById('search-input-main')?.focus();
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

  // Pomodoro Timer Logic
  useEffect(() => {
    let interval = null;
    if (isPomoActive) {
      interval = setInterval(() => {
        setPomoTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval); setIsPomoActive(false);
            setTimeout(() => { alert("Hết giờ Pomodoro!"); try { new Audio('https://vietndj.github.io/1.mp3').play(); } catch(e){} }, 100);
            return 1500; 
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPomoActive]);

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

  const compileAllForNotebookLM = async () => {
      if (!token) return alert("Cần nhập Token PAT!");
      setIsExportModalOpen(false);
      setStatus({ text: "Bắt đầu trích xuất...", type: "loading" });
      try {
          let targetFiles = db.files;
          if (exportTarget !== 'all') targetFiles = db.files.filter(f => f.repoName === exportTarget);
          targetFiles = targetFiles.filter(f => !['index.html', 'fix-url.html', 'tin.html', 'cms_db.json', 'metadata.json'].includes(f.fileName));
          
          let ct = `SIÊU SÁCH KIẾN THỨC: ${username.toUpperCase()}\n====================================\n\n`; let tc = 0;
          const grouped = {}; targetFiles.forEach(f => { if(!grouped[f.repoName]) grouped[f.repoName] = []; grouped[f.repoName].push(f); });
          
          for (let rName in grouped) {
              ct += `\n\n[KHO: ${rName.toUpperCase()}]\n\n`;
              for (let f of grouped[rName]) {
                  tc++; 
                  if (tc % 3 === 0 || tc === targetFiles.length) setStatus({ text: `Đang trích xuất (${tc}/${targetFiles.length})...`, type: "loading" });
                  
                  let sN = f.fileName; try { sN = decodeURIComponent(f.fileName); } catch(e){}
                  let rC = null;
                  try { const res = await fetch(`${f.url}?t=${Date.now()}`); if (res.ok) rC = await res.text(); } catch(e) {}
                  if (!rC) rC = await fetchText(`https://api.github.com/repos/${username}/${rName}/contents/${safeEnc(sN)}?t=${Date.now()}`, token);

                  if (rC) {
                      const d = new DOMParser().parseFromString(rC, 'text/html'); d.querySelectorAll('script,style,nav,header,footer,iframe,svg,button').forEach(x => x.remove());
                      const contentText = (d.body.innerText || d.body.textContent || "").replace(/\n{3,}/g, '\n\n').trim();
                      const ti = db.titles[`${rName}/${f.fileName}`] || f.name;
                      ct += `BÀI: ${ti}\n[Nội dung]\n${contentText}\n------------------------\n\n`;
                  }
                  await new Promise(r => setTimeout(r, 20)); 
              }
          }
          ct = ct.replace('====================================', `Tổng số bài: ${tc}\n====================================`);
          
          const blob = new Blob([ct], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob); 
          
          setExportResult({ url: url, filename: `notebooklm_${exportTarget}_${Date.now()}.txt`, count: tc });
          setStatus({ text: "✅ Hoàn tất!", type: "success" }); setTimeout(() => setStatus({ text: '', type: '' }), 3000);
      } catch (e) { setStatus({ text: `❌ Lỗi: ${e.message}`, type: "error" }); }
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
        delete db.tags[oldKey]; delete db.titles[oldKey];
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
      const newFileObj = { repoName: rName, name: title, fileName: filename, sha: resHTMLData.content?.sha || fileSha, url: `https://${rOwner}.github.io/${rName === `${rOwner}.github.io` ? '' : rName + '/'}${filename}`, timestamp: dDate.getTime(), fullDate: dDate.toLocaleString('vi-VN') };
      if (fileIndex !== -1) newFiles[fileIndex] = newFileObj; else newFiles.unshift(newFileObj);

      const newDbState = { ...db, files: newFiles, tags: newTags, titles: newTitles };
      await syncMetaAndDB(newDbState); saveLocalDb(newDbState);
      
      localStorage.setItem('cms_last_repo', `${rOwner}/${rName}`);
      localStorage.setItem('cms_last_tags', tags);

      setStatus({ text: '✅ Đăng bài thành công!', type: 'success' });
      setTitle(''); setSlug(''); setContent(''); setEditorOriginal({ repo:'', filename:'', sha:'' });
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

  // ==========================================
  // DATA FILTERING & SORTING
  // ==========================================
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
    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Luôn Mới nhất trước
    return filtered;
  }, [db.files, activeRepo, activeTag, searchQuery, db.tags]);

  const recentFiles = useMemo(() => { if (activeTag !== 'all' || activeRepo !== 'all' || searchQuery.trim() !== '') return []; return [...db.files].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 8); }, [db.files, activeRepo, activeTag, searchQuery]);
  const pinnedFiles = useMemo(() => processedFiles.filter(f => db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  const unpinnedFiles = useMemo(() => processedFiles.filter(f => !db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  
  // Sắp xếp các Repo có bài viết mới cập nhật lên đầu
  const groupedFilesByRepo = useMemo(() => { 
    const groups = {}; 
    unpinnedFiles.forEach(f => { if (!groups[f.repoName]) groups[f.repoName] = []; groups[f.repoName].push(f); }); 
    
    const sortedRepoNames = Object.keys(groups).sort((a, b) => {
        const maxA = Math.max(...groups[a].map(f => f.timestamp || 0));
        const maxB = Math.max(...groups[b].map(f => f.timestamp || 0));
        return maxB - maxA;
    });

    const sortedGroups = {};
    sortedRepoNames.forEach(r => sortedGroups[r] = groups[r]);
    return sortedGroups; 
  }, [unpinnedFiles]);

  // ==========================================
  // RENDER THẺ BÀI VIẾT TỐI GIẢN
  // ==========================================
  const renderCard = (file, isRecent = false) => {
    const isPinned = db.pinned.includes(`${file.repoName}/${file.fileName}`);
    const dateFmt = file.fullDate ? file.fullDate.split(' ')[0] : '';
    const tagsList = getFileTags(file.repoName, file.fileName);

    if (isRecent) {
      return (
        <div key={file.sha} className="cms-card p-4 min-w-[240px] max-w-[240px] flex flex-col group transition border cms-border hover:border-[var(--accent)] bg-[var(--bg-card)] cursor-pointer" onClick={() => window.open(file.url, '_blank')}>
          <div className="text-[10px] text-muted mb-1.5 flex items-center gap-1 uppercase font-bold tracking-tight opacity-70"><svg className="w-3 h-3"><use href="#icon-folder"></use></svg>{file.repoName}</div>
          <h4 className="font-bold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-[var(--accent)] transition text-[var(--text-main)]">{file.name}</h4>
          <div className="flex justify-between items-center mt-auto border-t cms-border-faint pt-2">
             <span className="text-[10px] opacity-60 font-mono text-muted">{dateFmt}</span>
             <button onClick={(e)=>{e.stopPropagation(); editFileContent(file.repoName, file.fileName, file.sha)}} className="text-[10px] text-[var(--accent)] px-2 py-1 rounded font-bold opacity-60 hover:opacity-100 transition">Sửa</button>
          </div>
        </div>
      );
    }

    // MAIN CARD (Không có Checkbox, Focus Tiêu đề, Mật độ cao)
    return (
      <div key={file.sha} className="cms-card p-4 flex flex-col relative group transition border cms-border hover:border-[var(--accent)] bg-[var(--bg-card)]">
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] text-muted font-bold uppercase tracking-widest mb-1.5 opacity-60">
                <svg className="w-3 h-3"><use href="#icon-folder"></use></svg> {file.repoName}
            </div>
            <a href={file.url} target="_blank" rel="noreferrer" className="block font-bold text-base text-[var(--text-main)] leading-snug mb-2 hover:text-[var(--accent)] line-clamp-3">
                {file.name}
            </a>
            {tagsList.length > 0 && (
               <div className="flex flex-wrap gap-1 mb-2">
                   {tagsList.map(t => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-muted font-medium border cms-border">{t}</span>)}
               </div>
            )}
        </div>
        
        <div className="flex justify-between items-center mt-3 pt-3 border-t cms-border-faint">
            <span className="text-[10px] text-muted font-mono opacity-60 flex items-center gap-2">
                {dateFmt} {isPinned && <svg className="w-2.5 h-2.5 text-[#FF9500]"><use href="#icon-pin-filled"></use></svg>}
            </span>
            <div className="flex items-center gap-3">
                <button onClick={(e)=>{e.stopPropagation(); togglePin(file.repoName, file.fileName);}} className="opacity-40 hover:opacity-100 transition text-muted"><svg className="w-3.5 h-3.5"><use href={isPinned ? "#icon-pin-filled" : "#icon-pin"}></use></svg></button>
                <button onClick={(e)=>{e.stopPropagation(); editFileContent(file.repoName, file.fileName, file.sha);}} className="text-[11px] font-bold text-[var(--accent)] opacity-60 hover:opacity-100 transition flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-edit"></use></svg> Sửa</button>
            </div>
        </div>
      </div>
    );
  };

  const renderViews = () => {
    if (processedFiles.length === 0) return <div className="text-center py-20 text-muted font-bold text-sm">Trống</div>;
    return (
      <div className="flex flex-col gap-8">
        {pinnedFiles.length > 0 && (
            <details open className="mb-2">
                <summary className="font-bold text-lg mb-4 border-b cms-border pb-2 cursor-pointer outline-none text-[#FF9500] flex items-center gap-2">
                    <svg className="w-5 h-5"><use href="#icon-pin-filled"></use></svg> 📌 Đã ghim <span className="text-xs px-2 py-0.5 rounded-full border cms-border text-[var(--text-main)] ml-2">{pinnedFiles.length}</span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{pinnedFiles.map(f => renderCard(f))}</div>
            </details>
        )}
        
        {Object.keys(groupedFilesByRepo).map(r => (
            <details key={r} open className="mb-2">
                <summary className="font-bold text-lg mb-4 border-b cms-border pb-2 cursor-pointer outline-none flex items-center gap-2">
                    <svg className="w-5 h-5 opacity-70"><use href="#icon-folder"></use></svg> {r} <span className="text-xs px-2 py-0.5 rounded-full border cms-border text-muted ml-2">{groupedFilesByRepo[r].length}</span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{groupedFilesByRepo[r].map(f => renderCard(f))}</div>
            </details>
        ))}
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
                  <button onClick={() => { setIsPomoOpen(!isPomoOpen); setIsToolsOpen(false); }} className="text-left px-3 py-2.5 text-xs font-bold hover:bg-[var(--bg-hover)] rounded-lg">🍅 Pomodoro</button>
                  <button onClick={() => window.open('https://vietndj.github.io/tin.html', '_blank')} className="text-left px-3 py-2.5 text-xs font-bold hover:bg-[var(--bg-hover)] rounded-lg">📖 Mở Reader</button>
                  <button onClick={() => { setIsExportModalOpen(true); setIsToolsOpen(false); }} className="text-left px-3 py-2.5 text-xs font-bold text-[#8E44AD] hover:bg-[var(--bg-hover)] rounded-lg transition">🤖 Xuất Sách AI</button>
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
          
          {/* EDITOR */}
          <section className="cms-card overflow-hidden shadow-sm">
            <button onClick={() => setIsEditorOpen(!isEditorOpen)} className="w-full px-6 py-3 flex justify-between items-center hover:bg-[var(--bg-hover)] font-semibold text-[var(--accent)] outline-none border-b cms-border">
                <span className="flex items-center gap-2">
                    <svg className="svg-icon"><use href="#icon-edit"></use></svg> Soạn thảo HTML <span className="text-[10px] text-muted border px-1.5 py-0.5 rounded font-mono ml-2 uppercase bg-white dark:bg-gray-800">Ctrl E</span>
                </span>
                <span style={{ transform: isEditorOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} className="transition-transform">▼</span>
            </button>
            {isEditorOpen && (
              <div className="p-5 bg-[var(--bg-card)] fade-in flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                    {repoKeysList.map(r => { const fullPath = `${username}/${r}`; const isActive = repo === fullPath; return (<button key={r} onClick={() => { setRepo(fullPath); }} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition border ${isActive ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-hover)] text-muted'}`}>{r}</button>) })}
                </div>
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

          {recentFiles.length > 0 && (<div className="mb-6"><h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-muted uppercase tracking-wider px-2"><svg className="w-4 h-4"><use href="#icon-timer"></use></svg> Vừa thao tác</h3><div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide px-2">{recentFiles.map(f => renderCard(f, true))}</div></div>)}
          
          {/* MAIN VIEWS */}
          {renderViews()}
        </main>

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

      {/* POMODORO */}
      {isPomoOpen && (
        <div className="fixed bottom-6 right-6 w-72 cms-card z-[100] p-4 shadow-2xl border cms-border fade-in">
           <div className="flex justify-between items-center font-bold text-sm mb-4 border-b cms-border pb-2">
              <span><svg className="w-4 h-4 inline pb-0.5 text-[#FF9500]"><use href="#icon-timer"></use></svg> Pomodoro</span>
              <span onClick={()=>setIsPomoOpen(false)} className="cursor-pointer text-red-500 font-bold">✕</span>
           </div>
           <div className="flex gap-2 mb-4">
              <button onClick={() => setPomoTime(1500)} className="flex-1 cms-btn-primary py-1.5 rounded-lg text-xs font-bold">25 Phút</button>
              <button onClick={() => setPomoTime(300)} className="flex-1 cms-input border cms-border py-1.5 rounded-lg text-xs font-bold text-muted">5 Phút</button>
           </div>
           <div className="text-4xl font-black text-center mb-4 font-mono text-[var(--accent)]">
              {Math.floor(pomoTime / 60).toString().padStart(2, '0')}:{(pomoTime % 60).toString().padStart(2, '0')}
           </div>
           <div className="flex gap-2">
              <button onClick={() => setIsPomoActive(!isPomoActive)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${isPomoActive ? 'bg-[#FF9500] text-white' : 'cms-btn-primary'}`}>
                {isPomoActive ? 'DỪNG LẠI' : 'BẮT ĐẦU'}
              </button>
              <button onClick={() => { setIsPomoActive(false); setPomoTime(1500); }} className="px-4 py-2 cms-input border cms-border rounded-xl text-xs font-bold transition hover:opacity-80">Reset</button>
           </div>
        </div>
      )}

      {/* MODAL XUẤT SÁCH AI */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center fade-in" onClick={() => { setIsExportModalOpen(false); setExportResult(null); }}>
          <div className="p-6 max-w-sm w-full mx-4 border cms-border shadow-2xl rounded-2xl bg-[var(--bg-card)] dark:bg-[#1D1D1F]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-[var(--text-main)]">🤖 Xuất Sách AI</h3>
            {!exportResult ? (
                <>
                  <p className="text-sm text-muted mb-4">Chọn kho dữ liệu để tải về máy dưới dạng file .txt. Tối ưu định dạng cho NotebookLM.</p>
                  <select value={exportTarget} onChange={(e) => setExportTarget(e.target.value)} className="w-full px-4 py-3 cms-input bg-[var(--bg-hover)] border cms-border rounded-xl text-sm mb-6 font-bold cursor-pointer outline-none text-[var(--text-main)]">
                      <option value="all">📚 Tất cả các Kho</option>
                      {repoKeysList.map(r => ( <option key={r} value={r}>📁 Kho: {r}</option> ))}
                  </select>
                  <div className="flex justify-end gap-3 pt-4 border-t cms-border">
                      <button onClick={() => setIsExportModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition hover:opacity-80">Hủy</button>
                      <button onClick={compileAllForNotebookLM} className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-md bg-[#007AFF] text-white transition hover:bg-blue-600">🚀 Bắt Đầu Quét</button>
                  </div>
                </>
            ) : (
                <div className="py-6 text-center">
                    <div className="text-4xl mb-2">🎉</div>
                    <h4 className="font-bold text-lg text-green-500 mb-1">Thành công!</h4>
                    <p className="text-sm text-muted mb-6">Đã gom thành công <b>{exportResult.count}</b> bài viết thành 1 file duy nhất.</p>
                    <a href={exportResult.url} download={exportResult.filename} className="block w-full px-6 py-4 rounded-xl text-base font-bold shadow-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white transition hover:scale-105" onClick={() => { setTimeout(()=>{setIsExportModalOpen(false); setExportResult(null)}, 1000) }}>
                        ⬇️ Tải File Sách (.txt)
                    </a>
                </div>
            )}
          </div>
        </div>
      )}

      {status.text && (<div className="fixed bottom-6 left-6 z-[9999] cms-card px-4 py-2 rounded-xl shadow-lg text-sm font-bold border-l-4 border-l-[var(--accent)] fade-in bg-[var(--bg-card)]">{status.text}</div>)}
    </div>
  );
}
