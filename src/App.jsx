import React, { useState, useEffect, useMemo, useRef } from 'react';

// ==========================================
// 1. TIỆN ÍCH CORE & GITHUB API
// ==========================================
const username = 'vietndj';
const SECRET_PIN = "0070";

const safeEnc = (fn) => { try { return encodeURIComponent(decodeURIComponent(fn)); } catch(e){ return encodeURIComponent(fn); } };
const encodeBase64UTF8Async = async (str) => {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i += 16384) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 16384));
    return btoa(binary);
};
const getHeaders = (token) => token ? { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' } : { 'Accept': 'application/vnd.github.v3+json' };
const getContrastYIQ = hex => {
    if(!hex) return '#1D1D1F'; hex = hex.replace("#","");
    const yiq = ((parseInt(hex.substr(0,2),16)*299)+(parseInt(hex.substr(2,2),16)*587)+(parseInt(hex.substr(4,2),16)*114))/1000;
    return (yiq >= 128) ? '#1D1D1F' : '#FFFFFF';
};

// HÀM QUAN TRỌNG: KHỬ TRÙNG LẶP & LỌC FILE RÁC
const deduplicateFiles = (filesArray) => {
    const map = new Map();
    const sorted = [...filesArray].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    sorted.forEach(f => {
        // Loại bỏ các file hệ thống, file thừa như export.html và các file text do AI tạo ra
        if (!['export.html', 'index.html', 'cms_db.json', 'metadata.json', 'tin.html'].includes(f.fileName) && !f.fileName.endsWith('.txt')) {
            map.set(`${f.repoName}/${f.fileName}`, f); // File sau cùng sẽ đè file cũ (chống lặp)
        }
    });
    return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

const extractFullText = (html) => {
    try { const doc = new DOMParser().parseFromString(html, 'text/html'); doc.querySelectorAll('script,style,nav,header,footer,svg').forEach(x=>x.remove()); return (doc.body.textContent || "").replace(/\s+/g,' ').trim(); } catch(e) { return ""; }
};

const fetchRawJSON = async (repoPath, file, token) => {
    try { const res = await fetch(`https://api.github.com/repos/${repoPath}/contents/${safeEnc(file)}?t=${Date.now()}`, { headers: { ...getHeaders(token), 'Accept': 'application/vnd.github.v3.raw' } }); if (res.ok) return await res.json(); } catch(e) {}
    try { const r2 = await fetch(`https://${repoPath.split('/')[0]}.github.io/${file}?t=${Date.now()}`); if(r2.ok) return await r2.json(); } catch(e){} return null;
};
const fetchText = async (url, token) => {
    try { const res = await fetch(url, { headers: { ...getHeaders(token), 'Accept': 'application/vnd.github.v3.raw' }}); return res.ok ? await res.text() : null; } catch(e) { return null; }
};
const getFileShaSafe = async (repoPath, file, token) => { 
    try { let d = await fetch(`https://api.github.com/repos/${repoPath}/contents/${safeEnc(file)}?t=${Date.now()}`, { headers: getHeaders(token) }).then(r => r.ok ? r.json() : null); if(d && !Array.isArray(d)) return d.sha; 
    let d2 = await fetch(`https://api.github.com/repos/${repoPath}/contents/?t=${Date.now()}`, { headers: getHeaders(token) }).then(r => r.ok ? r.json() : null); if(d2 && Array.isArray(d2)) { const f = d2.find(x => x.name === file); if(f) return f.sha; } return null; } catch(e) { return null; }
};

// ==========================================
// 2. COMPONENT SVG ICONS (Chuẩn Lucide Tối giản)
// ==========================================
const Icon = ({ name, className = "w-4 h-4", filled = false }) => {
    const paths = {
        search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
        folder: <><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></>,
        edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></>,
        pin: <><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></>,
        palette: <><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>,
        grid: <><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></>,
        list: <><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></>,
        kanban: <><path d="M8 7v7"/><path d="M16 7v10"/><rect width="18" height="18" x="3" y="3" rx="2"/></>,
        table: <><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></>,
        feed: <><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></>,
        tag: <><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></>,
        check: <polyline points="20 6 9 17 4 12" />,
        download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
        robot: <><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></>,
        refresh: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></>,
        close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
        deep: <><path d="M10 21h4"/><path d="M12 17v4"/><path d="M12 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/></>
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {paths[name] || paths.folder}
        </svg>
    );
};

// ==========================================
// 3. SUB-COMPONENTS (Giúp file App sạch sẽ)
// ==========================================

// --- Modal Đổi Màu ---
const ColorModal = ({ activeModal, setActiveModal, handleSetColor }) => {
    if (activeModal.type !== 'color') return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 transition-opacity fade-in" onClick={() => setActiveModal({type: null, data: null})}>
            <div className="cms-card p-8 rounded-3xl w-full max-w-sm shadow-2xl relative bg-white dark:bg-[#1C1C1E]" onClick={e => e.stopPropagation()}>
                <h4 className="font-bold mb-6 text-center text-xl flex items-center justify-center gap-2">
                    <Icon name="palette" className="w-6 h-6 text-[#007AFF]"/> Đổi màu thẻ
                </h4>
                <div className="grid grid-cols-5 gap-4">
                    {[null, '#F2F2F7', '#FFD8BF', '#FFE58F', '#D9F7BE', '#BAE7FF', '#D6E4FF', '#EFDBFF', '#FFD6E7', '#1D1D1F'].map((c, i) => (
                        <button key={i} onClick={()=>handleSetColor(`${activeModal.data.repoName}/${activeModal.data.fileName}`, c)} className="w-12 h-12 rounded-full border shadow-sm hover:scale-110 transition flex items-center justify-center mx-auto" style={{ backgroundColor: c || 'var(--bg-card)', borderColor: c ? 'transparent' : 'var(--border)' }}>
                            {c === null && <span className="text-[10px] font-bold text-[var(--text-muted)]">Xóa</span>}
                            {c === '#1D1D1F' && <span className="text-[10px] font-bold text-white">Tối</span>}
                        </button>
                    ))}
                </div>
                <div className="mt-8">
                    <button onClick={() => setActiveModal({type: null, data: null})} className="w-full cms-btn py-3.5 rounded-xl font-bold text-sm">Đóng lại</button>
                </div>
            </div>
        </div>
    );
};

// --- Modal Xuất AI (Thiết kế chính xác theo ảnh đính kèm) ---
const AIExportModal = ({ isOpen, onClose, db, token, repoKeysList, getFileTags, setStatus }) => {
    const [exportTarget, setExportTarget] = useState('all');
    const [progress, setProgress] = useState({ current: 0, total: 0, isScanning: false });
    const [result, setResult] = useState(null);

    if (!isOpen) return null;

    const handleExportAI = async () => {
        if (!token) return alert("Cần Token PAT Github!");
        
        let targets = db.files.filter(f => (exportTarget === 'all' || f.repoName === exportTarget) && !HIDDEN_FILES.includes(f.fileName) && !f.fileName.endsWith('.txt'));
        if (targets.length === 0) return alert("Không có bài viết nào!");
        
        setProgress({ current: 0, total: targets.length, isScanning: true });
        
        try {
            let ct = `SIÊU SÁCH KIẾN THỨC\nNguồn: ${exportTarget}\nTổng bài: ${targets.length}\nNgày xuất: ${new Date().toLocaleString('vi-VN')}\n===========================\n\n`;
            
            for (let i = 0; i < targets.length; i++) {
                const f = targets[i];
                let rC = await fetchText(`https://api.github.com/repos/${username}/${f.repoName}/contents/${safeEnc(f.fileName)}?t=${Date.now()}`, token);
                if (rC) {
                    const tags = getFileTags(f.repoName, f.fileName).join(', ');
                    ct += `BÀI: ${db.titles[`${f.repoName}/${f.fileName}`] || f.name}\n[KHO: ${f.repoName}]${tags ? `\n[TAGS: ${tags}]` : ''}\n${extractFullText(rC)}\n\n------------------------\n\n`;
                }
                setProgress(p => ({ ...p, current: i + 1 }));
                await new Promise(r => setTimeout(r, 40)); // Tránh limit Github API
            }
            
            const fileName = `${exportTarget === 'all' ? 'ALL' : exportTarget}.txt`;
            const encodedContent = await encodeBase64UTF8Async(ct);
            const sha = await getFileShaSafe(`${username}/${username}.github.io`, fileName, token);
            
            // Ghi file txt đè vào thư mục gốc của Github Pages
            await fetch(`https://api.github.com/repos/${username}/${username}.github.io/contents/${fileName}`, {
                method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Export AI Book: ${fileName}`, content: encodedContent, sha: sha || undefined })
            });

            const link = `https://${username}.github.io/${fileName}`;
            const blob = new Blob([ct], { type: 'text/plain;charset=utf-8' });
            
            setResult({ githubUrl: link, blobUrl: URL.createObjectURL(blob), filename: fileName, count: targets.length });
        } catch (e) { 
            setStatus({ text: "❌ Lỗi xuất file: " + e.message, type: "error" }); 
        } finally {
            setProgress(p => ({ ...p, isScanning: false }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 transition-opacity fade-in" onClick={() => !progress.isScanning && onClose()}>
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative border cms-border text-gray-800" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-3 flex items-center gap-2 text-gray-900">
                    <Icon name="robot" className="w-6 h-6 text-[#007AFF]"/> Xuất Sách AI
                </h3>
                
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">Đóng gói dữ liệu thành file Text, tự động lưu lên GitHub (ghi đè file cũ) để chia sẻ link cho AI.</p>

                {!progress.isScanning && !result ? (
                    <>
                        <select value={exportTarget} onChange={(e)=>setExportTarget(e.target.value)} className="w-full px-4 py-4 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-sm font-bold outline-none mb-6 cursor-pointer focus:border-[#007AFF] transition">
                            <option value="all">📚 Xuất Toàn bộ Workspace</option>
                            {repoKeysList.map(r => <option key={r} value={r}>📁 Chỉ xuất Kho: {r}</option>)}
                        </select>
                        <div className="flex justify-end gap-3">
                            <button onClick={onClose} className="px-6 py-4 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold text-sm transition">Hủy</button>
                            <button onClick={handleExportAI} className="flex-1 bg-[#007AFF] hover:bg-blue-600 text-white px-6 py-4 rounded-xl font-bold text-[15px] transition shadow-md">BẮT ĐẦU ĐÓNG GÓI</button>
                        </div>
                    </>
                ) : progress.isScanning ? (
                    <div className="py-2">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-bold text-[#007AFF] animate-pulse">Đang xử lý dữ liệu...</span>
                            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-xs font-bold border border-gray-200">{progress.current} / {progress.total}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#007AFF] transition-all duration-300" style={{width: `${(progress.current/progress.total)*100}%`}}></div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in mt-2">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[#22c55e] font-bold flex items-center gap-2 text-base"><span className="bg-[#22c55e] text-white rounded w-5 h-5 flex items-center justify-center"><Icon name="check" className="w-4 h-4" strokeWidth="3"/></span> Lưu GitHub hoàn tất!</span>
                            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm font-bold border">{result.count} / {result.count}</span>
                        </div>
                        
                        <div className="w-full h-2 bg-[#007AFF] rounded-full mb-6"></div>
                        <p className="text-[13px] text-gray-500 font-mono mb-6">Đã sẵn sàng tải xuống hoặc sao chép link.</p>

                        <div className="border-t border-gray-100 pt-6 mb-6">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">LINK CHIA SẺ (ĐÃ LƯU LÊN GITHUB):</label>
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1.5">
                                <input type="text" readOnly value={result.githubUrl} className="flex-1 pl-3 bg-transparent text-gray-700 text-xs font-mono outline-none truncate" />
                                <button onClick={() => {navigator.clipboard.writeText(result.githubUrl); setStatus({text:'Đã Copy Link!', type:'success'});}} className="bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 px-4 py-2.5 rounded-lg font-bold text-xs shadow-sm transition">Copy</button>
                            </div>
                        </div>

                        <a href={result.blobUrl} download={result.filename} className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white p-4 rounded-xl font-bold text-[15px] text-center transition shadow-md flex justify-center items-center gap-2" onClick={() => setTimeout(onClose, 500)}>
                            <span className="bg-white/20 p-1 rounded"><Icon name="download" className="w-4 h-4"/></span> TẢI SÁCH (.TXT) VỀ MÁY
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// 4. MAIN APP COMPONENT
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
  const [viewMode, setViewMode] = useState('grid'); // grid, list, kanban, table, feed
  
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [nativeTaskInput, setNativeTaskInput] = useState('');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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

  useEffect(() => { if (isEditorOpen && editorInputRef.current) setTimeout(() => editorInputRef.current.focus(), 100); }, [isEditorOpen]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
        const isCmd = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? e.metaKey : e.ctrlKey;
        if (isCmd && e.key.toLowerCase() === 'e') { e.preventDefault(); setIsEditorOpen(prev => !prev); }
        if (isCmd && e.key.toLowerCase() === 's') { e.preventDefault(); document.getElementById('btn-save-article')?.click(); }
        if (isCmd && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('search-input-main')?.focus(); }
        if (e.key === 'Escape') { setIsExportModalOpen(false); setActiveModal({type: null, data: null}); }
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

  const showToast = (text, type = 'success') => { setStatus({text, type}); setTimeout(() => setStatus({text:'', type:''}), 3000); };
  const handleLogin = () => { if (pin.trim() === SECRET_PIN) { localStorage.setItem("cms_auth", "granted"); setIsAuthenticated(true); } else alert("Mã PIN sai."); };
  const changeTheme = (theme) => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('cms_theme', theme); setIsToolsOpen(false); };
  
  // LƯU CƠ SỞ DỮ LIỆU & LỌC FILE TRÙNG LẶP
  const saveLocalDb = (newDb) => { 
      newDb.files = deduplicateFiles(newDb.files);
      try { localStorage.setItem('cms_repo_data', JSON.stringify(newDb)); setDb(newDb); } catch(e) { setDb(newDb); } 
  };

  const loadDatabase = async () => {
    if (!token || isSyncing) return;
    setIsSyncing(true); setStatus({ text: 'Đang tải Database...', type: 'loading' });
    try {
      const meta = await fetchRawJSON(`${username}/${username}.github.io`, 'metadata.json', token);
      const dbData = await fetchRawJSON(`${username}/${username}.github.io`, 'cms_db.json', token);
      if (dbData && dbData.allFiles) {
        const cleanFiles = deduplicateFiles(dbData.allFiles);
        const reposMap = {}; cleanFiles.forEach(f => { if(!reposMap[f.repoName]) reposMap[f.repoName] = []; reposMap[f.repoName].push(f); });
        saveLocalDb({ files: cleanFiles, repos: reposMap, tags: meta?.tags || {}, pinned: meta?.pinned || [], links: meta?.links || {}, colors: meta?.colors || {}, titles: meta?.titles || {}, tasks: meta?.tasks || [], customCol: meta?.customCol || [] });
        showToast('✅ Đã đồng bộ thành công!');
      }
    } catch (e) { showToast(`❌ Lỗi DB: ${e.message}`, 'error'); } finally { setIsSyncing(false); }
  };

  const syncMetaAndDB = async (dbState) => {
      const cleanFiles = deduplicateFiles(dbState.files); 
      const metaContent = await encodeBase64UTF8Async(JSON.stringify({ _version: 9, tags: dbState.tags, links: dbState.links, tasks: dbState.tasks, pinned: dbState.pinned, colors: dbState.colors, customCol: dbState.customCol, titles: dbState.titles }, null, 2));
      const metaSha = await getFileShaSafe(`${username}/${username}.github.io`, 'metadata.json', token);
      await fetch(`https://api.github.com/repos/${username}/${username}.github.io/contents/metadata.json`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Sync Meta', content: metaContent, sha: metaSha || undefined }) });

      const dbContent = await encodeBase64UTF8Async(JSON.stringify({ allFiles: cleanFiles }));
      const dbSha = await getFileShaSafe(`${username}/${username}.github.io`, 'cms_db.json', token);
      await fetch(`https://api.github.com/repos/${username}/${username}.github.io/contents/cms_db.json`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Sync DB', content: dbContent, sha: dbSha || undefined }) });
  };

  const handleSetColor = async (fileKey, color) => {
      const newColors = { ...db.colors, [fileKey]: color };
      if (color === null) { delete newColors[fileKey]; }
      const newState = { ...db, colors: newColors };
      setDb(newState); await syncMetaAndDB(newState); saveLocalDb(newState);
      setActiveModal({ type: null, data: null });
  };

  // EDITOR LOGIC
  const autoSlugify = (val, currentTags) => {
    setTitle(val);
    if (editorOriginal.filename) return; // Không tự đổi tên nếu đang sửa file
    let s = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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
    if (!token || !repo || !title || !slug || !content) return alert("Thiếu dữ liệu (Kho, Tiêu đề, Slug, Nội dung)!");
    setIsSaving(true); setStatus({ text: '⏳ Đang kiểm tra Database...', type: 'loading' });
    try {
      let rName = repo.includes('/') ? repo.split('/')[1] : repo;
      let rOwner = repo.includes('/') ? repo.split('/')[0] : username;
      
      let finalSlug = slug.endsWith('.html') ? slug.replace('.html','') : slug;
      let filename = finalSlug + '.html';
      let fileKey = `${rName}/${filename}`;

      setStatus({ text: '⏳ Đang lưu HTML...', type: 'loading' });
      const encodedContent = await encodeBase64UTF8Async(content);
      
      let fileSha = editorOriginal.sha; 
      if (!fileSha || editorOriginal.filename !== filename) {
          fileSha = await getFileShaSafe(`${rOwner}/${rName}`, filename, token);
      }

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
      
      const dDate = new Date();
      const newFileObj = { repoName: rName, name: title, fileName: filename, sha: resHTMLData.content?.sha || fileSha, url: `https://${rOwner}.github.io/${rName === `${rOwner}.github.io` ? '' : rName + '/'}${filename}`, timestamp: dDate.getTime(), fullDate: dDate.toLocaleString('vi-VN'), preview: content.replace(/<[^>]+>/g, '').substring(0, 150), fullText: extractFullText(content) };
      
      // Xóa bản cũ trong state để thêm bản mới
      let newFiles = db.files.filter(f => !(f.repoName === rName && f.fileName === filename));
      if (editorOriginal.filename) {
          const oldRName = editorOriginal.repo.split('/')[1]||editorOriginal.repo.split('/')[0];
          newFiles = newFiles.filter(f => !(f.repoName === oldRName && f.fileName === editorOriginal.filename));
      }
      newFiles.unshift(newFileObj);

      const newState = { ...db, files: deduplicateFiles(newFiles), tags: newTags, titles: newTitles };
      saveLocalDb(newState); await syncMetaAndDB(newState); 
      
      localStorage.setItem('cms_last_repo', `${rOwner}/${rName}`);
      localStorage.setItem('cms_last_tags', tags);

      showToast('✅ Đăng bài thành công!');
      setTitle(''); setSlug(''); setContent(''); setEditorOriginal({ repo:'', filename:'', sha:'' }); setIsEditorOpen(false);
    } catch (error) { showToast(`❌ Lỗi lưu bài: ${error.message}`, 'error'); } finally { setIsSaving(false); }
  };

  const editFileContent = async (rName, f, sha) => {
    if(!token) return alert("Cần Token!"); setIsEditorOpen(true); window.scrollTo({top:0,behavior:'smooth'});
    setStatus({ text: 'Đang nạp file...', type: 'loading' });
    try {
      const res = await fetchText(`https://api.github.com/repos/${username}/${rName}/contents/${safeEnc(f)}?t=${Date.now()}`, token);
      if(res) {
        setContent(res);
        const rp = rName === username || rName === `${username}.github.io` ? `${username}/${username}.github.io` : `${username}/${rName}`;
        setRepo(rp); setTitle(db.titles[`${rName}/${f}`] || f.replace('.html','')); setSlug(f.replace('.html',''));
        setTags((db.tags[`${rName}/${f}`] || []).join(', '));
        setEditorOriginal({ repo: rp, filename: f, sha: sha });
        showToast('✅ Đã nạp thành công!');
      } else throw new Error("Không tìm thấy file");
    } catch(e) { showToast(`❌ Lỗi: ${e.message}`, 'error'); }
  };

  const togglePin = async (r, f) => {
    if(!token) return; const k = `${r}/${f}`; let newPinned = [...db.pinned];
    if(newPinned.includes(k)) newPinned = newPinned.filter(x => x !== k); else newPinned.push(k);
    const newDb = { ...db, pinned: newPinned }; saveLocalDb(newDb); syncMetaAndDB(newDb);
  };

  // ==========================================
  // LỌC, SẮP XẾP & AUTO-GROUPING (>20 BÀI)
  // ==========================================
  const repoKeysList = useMemo(() => { const keys = Object.keys(db.repos || {}); if (!keys.includes(`${username}.github.io`)) keys.unshift(`${username}.github.io`); return keys; }, [db.repos]);
  const allUniqueTags = useMemo(() => { const s = new Set(); Object.values(db.tags).forEach(a => a.forEach(t => s.add(t))); return Array.from(s).sort(); }, [db.tags]);
  const getFileTags = (r, f) => db.tags[`${r}/${f}`] || [];

  const processedFiles = useMemo(() => {
    let list = db.files.filter(f => !HIDDEN_FILES.includes(f.fileName) && (activeRepo === 'all' || f.repoName === activeRepo) && (activeTag === 'all' || getFileTags(f.repoName, f.fileName).includes(activeTag)));
    
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(f => {
            let match = (f.name||"").toLowerCase().includes(q) || (f.repoName||"").toLowerCase().includes(q);
            // DEEP SEARCH BẬT
            if (!match && isDeepSearch) {
                 match = (f.preview || f.fullText || "").toLowerCase().includes(q);
            }
            return match;
        });
    }
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); 
  }, [db.files, activeRepo, activeTag, searchQuery, isDeepSearch, db.tags]);

  const recentFiles = useMemo(() => (activeTag==='all' && activeRepo==='all' && !searchQuery) ? [...processedFiles].slice(0, 8) : [], [processedFiles, activeRepo, activeTag, searchQuery]);
  const pinnedFiles = useMemo(() => processedFiles.filter(f => db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  const unpinnedFiles = useMemo(() => processedFiles.filter(f => !db.pinned.includes(`${f.repoName}/${f.fileName}`)), [processedFiles, db.pinned]);
  
  const groupedDataByRepo = useMemo(() => { 
    const groups = {}; 
    unpinnedFiles.forEach(f => { if (!groups[f.repoName]) groups[f.repoName] = []; groups[f.repoName].push(f); }); 
    const sortedRepoNames = Object.keys(groups).sort((a, b) => Math.max(...groups[b].map(f=>f.timestamp||0)) - Math.max(...groups[a].map(f=>f.timestamp||0)));
    
    const result = [];
    sortedRepoNames.forEach(r => {
        const fArray = groups[r];
        if (fArray.length > 20 && (viewMode === 'grid' || viewMode === 'list')) {
            const groupedByTag = { 'Chưa phân loại': [] };
            fArray.forEach(f => {
                const tags = getFileTags(f.repoName, f.fileName);
                if (tags.length === 0) groupedByTag['Chưa phân loại'].push(f);
                else { const t = tags[0]; if (!groupedByTag[t]) groupedByTag[t] = []; groupedByTag[t].push(f); }
            });
            if (groupedByTag['Chưa phân loại'].length === 0) delete groupedByTag['Chưa phân loại'];
            result.push({ repo: r, isGrouped: true, items: groupedByTag, total: fArray.length });
        } else {
            result.push({ repo: r, isGrouped: false, items: fArray, total: fArray.length });
        }
    });
    return result;
  }, [unpinnedFiles, viewMode]);

  // ==========================================
  // RENDER THẺ BÀI VIẾT (CARDS)
  // ==========================================
  const renderCard = (file, isRecent = false, mode = 'grid') => {
    const isP = db.pinned.includes(`${file.repoName}/${file.fileName}`);
    const col = db.colors[`${file.repoName}/${file.fileName}`];
    const isDark = col && getContrastYIQ(col) === '#FFFFFF';
    const textColor = col ? (isDark ? '#FFF' : '#1D1D1F') : 'var(--text-main)';
    const textMutedColor = col ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)') : 'var(--text-muted)';
    const borderColor = col ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') : 'var(--border)';
    const btnBg = col ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)') : 'var(--bg-hover)';
    const tagsList = getFileTags(file.repoName, file.fileName);
    const dateFmt = file.fullDate?.split(' ')[0] || '';

    const ActionButtons = () => (
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => togglePin(file.repoName, file.fileName)} className="p-1.5 hover:bg-black/5 rounded-lg transition" style={{color: isP ? '#FF9500' : textMutedColor}}><Icon name={isP?"pin-filled":"pin"} /></button>
            <button onClick={() => setActiveModal({type: 'color', data: file})} className="p-1.5 hover:bg-black/5 rounded-lg transition opacity-60 hover:opacity-100" style={{color: textMutedColor}}><Icon name="palette" /></button>
            <button onClick={() => editFileContent(file.repoName, file.fileName, file.sha)} className="text-[10px] font-bold px-2.5 py-1.5 ml-1 rounded-md flex items-center gap-1 hover:opacity-80 transition shadow-sm" style={{backgroundColor: btnBg, color: textColor}}><Icon name="edit" className="w-3 h-3"/>Sửa</button>
        </div>
    );

    if (isRecent) {
      return (
        <div key={file.sha} className="cms-card p-3.5 min-w-[220px] max-w-[220px] flex flex-col transition border cms-border hover:border-[var(--accent)] bg-[var(--bg-card)] cursor-pointer snap-start" onClick={() => window.open(file.url, '_blank')}>
          <h4 className="font-bold text-sm leading-snug line-clamp-2 mb-3 text-[var(--text-main)] flex-1">{file.name}</h4>
          <div className="flex justify-between items-center mt-auto border-t border-black/5 dark:border-white/5 pt-2.5">
             <div className="flex items-center gap-1.5 opacity-60 text-[var(--text-main)]"><Icon name="folder" className="w-3 h-3"/><span className="text-[9px] uppercase font-bold tracking-tight">{file.repoName}</span></div>
             <button onClick={(e)=>{e.stopPropagation(); editFileContent(file.repoName, file.fileName, file.sha)}} className="text-[9px] font-black uppercase text-[var(--text-main)] px-2.5 py-1.5 rounded-md border cms-border hover:opacity-80 transition bg-[var(--bg-hover)]">Sửa</button>
          </div>
        </div>
      );
    }

    if (mode === 'table') {
        return (
            <tr key={file.sha} className="border-b transition hover:bg-[var(--bg-hover)] cursor-pointer" style={{backgroundColor: col || 'transparent', color: textColor, borderColor: borderColor}} onClick={() => window.open(file.url, '_blank')}>
                <td className="p-4 text-center">{isP && <Icon name="pin-filled" className="w-3 h-3 text-[#FF9500] mx-auto" />}</td>
                <td className="p-4">
                    <span className="font-bold text-[14.5px] line-clamp-1">{file.name}</span>
                    {tagsList.length > 0 && <div className="mt-1.5 flex gap-1">{tagsList.map(t => <span key={t} className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase" style={{backgroundColor: btnBg}}>{t}</span>)}</div>}
                </td>
                <td className="p-4 text-[11px] font-bold uppercase tracking-wider" style={{color: textMutedColor}}>{file.repoName}</td>
                <td className="p-4 text-[11px] whitespace-nowrap font-mono" style={{color: textMutedColor}}>{dateFmt}</td>
                <td className="p-4 w-32"><ActionButtons /></td>
            </tr>
        );
    }

    if (mode === 'list') {
        return (
            <div key={file.sha} className="cms-card p-3 flex items-center justify-between gap-4 transition hover:-translate-y-0.5 shadow-sm mb-2 cursor-pointer" onClick={() => window.open(file.url, '_blank')} style={{backgroundColor: col || 'var(--bg-card)', color: textColor, border: `1px solid ${borderColor}`}}>
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 opacity-80" style={{backgroundColor: btnBg}}><Icon name="folder" className="w-4 h-4" /></div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-[14.5px] truncate mb-0.5" style={{color: textColor}}>{file.name}</h4>
                        <div className="text-[10px] flex items-center gap-2 opacity-70">
                            <span className="font-bold uppercase">{file.repoName}</span> <span className="w-1 h-1 rounded-full bg-current opacity-30"></span> <span className="font-mono">{dateFmt}</span>
                        </div>
                    </div>
                </div>
                <ActionButtons />
            </div>
        )
    }

    if (mode === 'feed') {
        return (
            <article key={file.sha} className="cms-card p-6 md:p-8 flex flex-col mb-8 border cms-border cursor-pointer transition hover:-translate-y-1 shadow-sm hover:border-[var(--accent)]" onClick={() => window.open(file.url, '_blank')} style={{backgroundColor: col || 'var(--bg-card)', color: textColor, borderColor: borderColor}}>
                <div className="flex items-center gap-3 mb-4 opacity-80" style={{color: textColor}}>
                   <div className="w-10 h-10 rounded-full flex items-center justify-center border" style={{borderColor: borderColor, backgroundColor: btnBg}}><Icon name="folder" className="w-5 h-5"/></div>
                   <div><p className="text-[11px] font-black uppercase tracking-widest">{file.repoName}</p><p className="text-[10px] font-mono opacity-80 mt-0.5">{file.fullDate}</p></div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{file.name}</h2>
                {tagsList.length > 0 && <div className="flex flex-wrap gap-2 mb-4">{tagsList.map(t => <span key={t} className="text-[10px] px-2 py-1 rounded font-bold uppercase" style={{backgroundColor: btnBg, color: textColor}}>{t}</span>)}</div>}
                <div className="text-[15px] leading-relaxed mb-6 opacity-90 line-clamp-5">{file.preview}...</div>
                <div className="flex justify-between border-t pt-5 mt-auto items-center" style={{borderColor: borderColor}}>
                   <button className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:opacity-80 transition" style={{backgroundColor: btnBg, color: textColor}}>Đọc bài</button>
                   <ActionButtons />
                </div>
            </article>
        )
    }

    // Default: GRID / KANBAN
    return (
      <div key={file.sha} className={`cms-card p-4 flex flex-col relative transition border hover:border-[var(--accent)] cursor-pointer group hover:-translate-y-0.5 shadow-sm ${mode==='kanban'?'mb-3 w-full':'h-full'}`} onClick={() => window.open(file.url, '_blank')} style={{backgroundColor: col || 'var(--bg-card)', color: textColor, border: `1px solid ${borderColor}`}}>
        <div className="flex-1 min-w-0 mb-4">
            <h4 className="font-bold text-[15px] leading-[1.4] line-clamp-3" style={{color: textColor}}>{file.name}</h4>
            {mode==='grid' && file.preview && <p className="text-xs opacity-70 mt-2 line-clamp-2 leading-relaxed" style={{color: textColor}}>{file.preview}</p>}
        </div>
        <div className="mt-auto pt-3 border-t flex justify-between items-end gap-2" style={{borderColor: borderColor}}>
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{color: textMutedColor}}>
                    <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><Icon name="folder" className="w-2.5 h-2.5"/> {file.repoName}</span>
                    <span className="text-[9px] font-mono flex items-center gap-1 opacity-80">{dateFmt}</span>
                </div>
                {tagsList.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{tagsList.slice(0, 3).map(t => <span key={t} className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border" style={{backgroundColor: 'transparent', borderColor: borderColor, color: textColor}}>{t}</span>)}</div>}
            </div>
            <ActionButtons />
        </div>
      </div>
    );
  };

  const renderViewsLayout = () => {
    if (processedFiles.length === 0) return <div className="text-center py-20 text-[var(--text-muted)] font-bold text-sm flex flex-col items-center"><Icon name="search" className="w-10 h-10 mb-2 opacity-20"/> Trống</div>;
    
    // KANBAN VIEW
    if (viewMode === 'kanban') {
        return (
            <div className="flex overflow-x-auto gap-6 pb-6 items-start min-h-[70vh] w-full snap-x">
                {pinnedFiles.length > 0 && (
                    <div className="w-[320px] shrink-0 cms-card p-3 bg-[var(--bg-hover)] border-none snap-center">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span className="font-bold text-sm text-[#FF9500] flex items-center gap-1.5"><Icon name="pin-filled" /> Đã ghim</span>
                            <span className="text-xs font-mono font-bold opacity-50 bg-[var(--bg-card)] px-2 py-0.5 rounded-full">{pinnedFiles.length}</span>
                        </div>
                        <div className="flex flex-col gap-0 max-h-[75vh] overflow-y-auto pr-1 kanban-scroll">{pinnedFiles.map(f => renderCard(f, false, 'kanban'))}</div>
                    </div>
                )}
                {groupedDataByRepo.map(group => (
                    <div key={group.repo} className="w-[320px] shrink-0 cms-card p-3 bg-[var(--bg-hover)] border-none snap-center">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span className="font-bold text-sm text-[var(--text-main)] flex items-center gap-1.5 uppercase tracking-wider"><Icon name="folder" className="opacity-50" /> {group.repo}</span>
                            <span className="text-xs font-mono font-bold opacity-50 bg-[var(--bg-card)] px-2 py-0.5 rounded-full shadow-sm">{group.total}</span>
                        </div>
                        <div className="flex flex-col gap-0 max-h-[75vh] overflow-y-auto pr-1 kanban-scroll">
                            {group.isGrouped ? Object.values(group.items).flat().map(f => renderCard(f, false, 'kanban')) : group.items.map(f => renderCard(f, false, 'kanban'))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // TABLE VIEW
    if (viewMode === 'table') {
       return (
         <div className="cms-card overflow-x-auto border cms-border shadow-sm">
           <table className="w-full text-left text-sm min-w-[800px]">
             <thead>
               <tr className="bg-[var(--bg-hover)] text-[var(--text-muted)] text-[10px] uppercase tracking-wider border-b cms-border">
                 <th className="p-4 w-10"></th><th className="p-4">Bài viết</th><th className="p-4 w-40">Kho</th><th className="p-4 w-32">Ngày</th><th className="p-4 w-32 text-right">Tác vụ</th>
               </tr>
             </thead>
             <tbody>{[...pinnedFiles, ...unpinnedFiles].map(f => renderCard(f, false, 'table'))}</tbody>
           </table>
         </div>
       )
    }

    // GRID, LIST, FEED
    const gridClass = viewMode === 'list' ? 'flex flex-col gap-0 cms-card overflow-hidden border cms-border' : viewMode === 'feed' ? 'flex flex-col max-w-3xl mx-auto w-full' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

    return (
      <div className="flex flex-col gap-8">
        {pinnedFiles.length > 0 && (
            <details open className="outline-none group">
                <summary className="font-bold text-lg mb-4 border-b border-[var(--border)] pb-2 cursor-pointer outline-none text-[#FF9500] flex items-center gap-2 select-none">
                    <Icon name="pin-filled" className="w-5 h-5" /> 📌 Đã ghim <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-main)] ml-2">{pinnedFiles.length}</span>
                </summary>
                <div className={gridClass}>{pinnedFiles.map(f => renderCard(f, false, viewMode))}</div>
            </details>
        )}
        
        {groupedDataByRepo.map(group => (
            <details key={group.repo} open className="outline-none group">
                <summary className="font-bold text-lg mb-4 border-b border-[var(--border)] pb-2 cursor-pointer outline-none flex items-center gap-2 text-[var(--text-main)] uppercase tracking-wide select-none">
                    <Icon name="folder" className="w-5 h-5 opacity-50" /> {group.repo} <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] ml-2">{group.total}</span>
                </summary>
                
                {group.isGrouped ? (
                    <div className="flex flex-col gap-6 pl-3 md:pl-5 border-l-2 border-[var(--border)] ml-2">
                        {Object.entries(group.items).map(([tagKey, files]) => (
                            <div key={tagKey}>
                                <h4 className="text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-3 flex items-center gap-2">
                                   <span className="w-2.5 h-2.5 rounded-full bg-[var(--border)] -ml-[17px] md:-ml-[25px]"></span> 
                                   <Icon name="tag" className="w-3.5 h-3.5"/> {tagKey} <span className="opacity-50">({files.length})</span>
                                </h4>
                                <div className={gridClass}>{files.map(f => renderCard(f, false, viewMode))}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={gridClass}>{group.items.map(f => renderCard(f, false, viewMode))}</div>
                )}
            </details>
        ))}
      </div>
    );
  };

  // MÀN HÌNH ĐĂNG NHẬP
  if (!isAuthenticated) return ( 
    <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[var(--bg-body)]">
        <div className="cms-card p-10 max-w-sm w-full mx-4 text-center rounded-3xl shadow-2xl border cms-border">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-main)]">Workspace</h2>
            <input type="password" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-center text-3xl font-bold tracking-[0.5em] px-4 py-4 bg-[var(--bg-hover)] rounded-2xl mb-6 border cms-border outline-none text-[var(--text-main)] focus:border-[#007AFF] transition" />
            <button onClick={handleLogin} className="w-full py-4 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition">Mở Khóa</button>
        </div>
    </div> 
  );

  return (
    <>
      <div className="flex-col w-full min-h-screen fade-in flex bg-[var(--bg-body)]">
        <SVGIcons />
        
        {/* HEADER */}
        <header className="bg-[var(--bg-card)] border-b border-[var(--border)] pt-4 pb-3 px-4 md:px-8 flex flex-col md:flex-row items-center gap-4 sticky top-0 z-50 shadow-sm">
          <h1 className="text-2xl font-black tracking-tighter text-[var(--accent)] cursor-pointer" onClick={()=>window.location.reload()}>vietndj</h1>
          
          <div className="flex-1 flex w-full max-w-2xl items-center gap-2">
              <div className="flex-1 flex items-center bg-[var(--bg-hover)] border cms-border rounded-xl px-4 py-2 transition focus-within:border-[var(--accent)]">
                  <Icon name="search" className="text-[var(--text-muted)] w-4 h-4" />
                  <input type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Tìm bài viết... (Ctrl K)" className="bg-transparent border-none outline-none text-sm w-full ml-3 font-bold text-[var(--text-main)] placeholder-[var(--text-muted)]" />
              </div>
              <button onClick={()=>setIsDeepSearch(!isDeepSearch)} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${isDeepSearch?'bg-[var(--accent)] text-white border-transparent shadow-md':'bg-[var(--bg-hover)] text-[var(--text-main)] cms-border'}`}>
                 <Icon name="search" /> Sâu
              </button>
          </div>

          <div className="flex items-center gap-2 relative" ref={toolsMenuRef}>
            <button onClick={loadDatabase} className="cms-btn px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cms-border"><Icon name="refresh"/> Tải DB</button>
            <button onClick={()=>setIsTasksOpen(!isTasksOpen)} className={`cms-btn px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cms-border ${isTasksOpen?'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]':''}`}><Icon name="edit"/> Việc</button>
            <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="cms-btn px-4 py-2.5 rounded-xl text-xs font-bold transition border cms-border bg-[var(--bg-hover)]">Công cụ ▾</button>
            {isToolsOpen && ( 
                <div className="absolute right-0 top-full mt-2 w-56 p-2 z-[100] bg-[var(--bg-card)] rounded-xl shadow-2xl border cms-border fade-in">
                    <div className="flex gap-1 px-1 mb-3">
                        <button onClick={() => changeTheme('light')} className="flex-1 py-2 rounded-lg text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-main)] transition hover:opacity-80">Sáng</button>
                        <button onClick={() => changeTheme('dark')} className="flex-1 py-2 rounded-lg text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-main)] transition hover:opacity-80">Tối</button>
                    </div>
                    <button onClick={() => window.open('https://vietndj.github.io/tin.html', '_blank')} className="w-full text-left px-3 py-2.5 text-xs font-bold hover:bg-[var(--bg-hover)] rounded-lg transition">📖 Mở Reader</button>
                    <button onClick={() => { setIsExportModalOpen(true); setIsToolsOpen(false); }} className="w-full text-left px-3 py-2.5 text-xs font-bold text-[#10B981] hover:bg-[var(--bg-hover)] rounded-lg transition flex items-center gap-2"><Icon name="robot"/> Xuất Sách AI</button>
                    <hr className="my-2 border-t cms-border"/>
                    <button onClick={() => {localStorage.removeItem("cms_auth"); setIsAuthenticated(false);}} className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-[var(--bg-hover)] rounded-lg transition">🔒 Khóa App</button>
                </div> 
            )}
          </div>
        </header>

        {/* BỘ LỌC VÀ CHẾ ĐỘ XEM */}
        <nav className="bg-[var(--bg-body)]/95 backdrop-blur-md border-b border-[var(--border)] py-2 px-4 md:px-8 sticky top-[68px] z-40 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                  <span className="text-[10px] font-black text-[var(--text-muted)] uppercase shrink-0 flex items-center gap-1"><Icon name="folder" className="w-3 h-3"/> KHO</span>
                  {repoKeysList.map(r => <button key={r} onClick={() => setActiveRepo(activeRepo===r?'all':r)} className={`shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-lg transition border cms-border whitespace-nowrap ${activeRepo===r?'bg-[var(--accent)] text-white border-transparent shadow-sm':'bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}>{r}</button>)}
              </div>
              
              {/* VIEWS TOGGLE */}
              <div className="hidden md:flex bg-[var(--bg-card)] border cms-border rounded-lg p-1 shrink-0">
                  {['list', 'grid', 'kanban', 'table', 'feed'].map(v => (
                      <button key={v} onClick={() => setViewMode(v)} className={`px-2 py-1.5 rounded text-[10px] uppercase font-bold transition flex items-center gap-1 ${viewMode===v ? 'bg-[var(--bg-hover)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`} title={v.toUpperCase()}>
                          <Icon name={v} className="w-3 h-3" />
                          <span className="hidden lg:block">{v}</span>
                      </button>
                  ))}
              </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase shrink-0 flex items-center gap-1"><Icon name="tag" className="w-3 h-3"/> TAG</span>
              {allUniqueTags.map(t => <button key={t} onClick={() => setActiveTag(activeTag===t?'all':t)} className={`shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-lg transition border cms-border whitespace-nowrap ${activeTag===t?'bg-[var(--accent)] text-white border-transparent shadow-sm':'bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}>{t}</button>)}
          </div>
        </nav>
        
        <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto items-start w-full relative pb-20 mt-6">
          <main className="flex-1 w-full min-w-0 flex flex-col gap-8">
            
            {/* EDITOR */}
            <section className="cms-card overflow-hidden border cms-border shadow-sm">
              <button onClick={() => setIsEditorOpen(!isEditorOpen)} className="w-full px-6 py-4 flex justify-between items-center bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] font-bold text-[var(--accent)] outline-none transition">
                  <span className="flex items-center gap-2">
                      <Icon name="edit" className="w-5 h-5"/> Soạn thảo HTML <span className="text-[9px] text-[var(--text-muted)] border cms-border px-1.5 py-0.5 rounded font-mono ml-2 uppercase bg-[var(--bg-body)]">Ctrl E</span>
                  </span>
                  <span className="text-[var(--text-muted)]">{isEditorOpen?'▲':'▼'}</span>
              </button>
              {isEditorOpen && (
                <div className="p-5 flex flex-col gap-4 border-t cms-border bg-[var(--bg-card)] fade-in">
                  <div className="flex flex-wrap gap-2">{repoKeysList.map(r => <button key={r} onClick={() => setRepo(`${username}/${r}`)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition ${repo===`${username}/${r}`?'bg-[var(--accent)] text-white border-transparent shadow-sm':'cms-input border-[var(--border)] hover:opacity-80'}`}>{r}</button>)}</div>
                  
                  <textarea 
                      ref={editorInputRef} rows="12" 
                      value={content} onChange={handleContentChange} 
                      className="w-full p-4 bg-[#1D1D1F] text-[#34C759] rounded-xl font-mono text-sm outline-none shadow-inner border-none focus:ring-2 focus:ring-[var(--accent)] leading-relaxed" 
                      placeholder="Mở soạn thảo (Ctrl E) -> Dán HTML (Ctrl V) -> Lưu (Ctrl S)... Tiêu đề tự bóc từ thẻ <title>..."
                  ></textarea>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" value={title} onChange={(e)=>setTitle(e.target.value)} className="px-4 py-3.5 bg-[var(--bg-hover)] border cms-border rounded-xl text-sm font-bold outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] transition" placeholder="Tiêu đề (có thể sửa sau)" />
                      <input type="text" value={tags} onChange={(e)=>setTags(e.target.value)} className="px-4 py-3.5 bg-[var(--bg-hover)] border cms-border rounded-xl text-sm font-bold text-[var(--accent)] outline-none placeholder-[var(--text-muted)] focus:border-[var(--accent)] transition" placeholder="Nhãn (cách bằng dấu phẩy)..." />
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t cms-border mt-2">
                     <button id="btn-save-article" onClick={handleSaveArticle} disabled={isSaving} className="bg-[#007AFF] hover:bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-md text-sm transition hover:opacity-90 disabled:opacity-50">
                        {isSaving?'⏳ Đang lưu...':'🚀 LƯU BÀI LÊN GITHUB (Ctrl S)'}
                     </button>
                     {editorOriginal.sha && <button onClick={()=>{setTitle(''); setSlug(''); setContent(''); setEditorOriginal({repo:'',filename:'',sha:''}); setIsEditorOpen(false)}} className="text-red-500 text-xs font-bold px-4 py-3 hover:bg-[var(--bg-hover)] rounded-xl transition border cms-border">✕ HỦY SỬA</button>}
                  </div>
                </div>
              )}
            </section>

            {/* VÙNG CHỨA BÀI VIẾT GẦN ĐÂY VÀ MAIN RENDER */}
            {recentFiles.length > 0 && viewMode !== 'kanban' && <div className="mb-2"><h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 ml-1 flex items-center gap-1.5"><Icon name="list" className="text-[#FF9500]"/> 🔥 Vừa Thao Tác</h3><div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x">{recentFiles.map(f => renderCard(f, true))}</div></div>}
            {renderViewsLayout()}
          </main>

          {/* CỘT TASK (GHI CHÚ NHANH) */}
          {isTasksOpen && (
            <aside className="w-full lg:w-[320px] shrink-0 sticky top-[150px] h-[calc(100vh-170px)] fade-in">
               <div className="cms-card p-5 flex flex-col h-full border cms-border rounded-2xl shadow-sm bg-[var(--bg-card)]">
                  <div className="flex justify-between items-center mb-5"><h2 className="text-[11px] font-black text-[var(--accent)] uppercase tracking-widest flex items-center gap-1.5"><Icon name="edit" /> Ghi chú Nhanh</h2><button onClick={()=>setIsTasksOpen(false)} className="text-[var(--text-muted)] hover:text-red-500 font-bold transition"><Icon name="close" /></button></div>
                  <div className="flex gap-2 mb-4"><input type="text" value={nativeTaskInput} onChange={e=>setNativeTaskInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && nativeTaskInput){const n=[{id:Date.now(),title:nativeTaskInput,completed:false},...db.tasks]; saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n}); setNativeTaskInput('');}}} className="flex-1 bg-[var(--bg-hover)] border cms-border text-[var(--text-main)] px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[var(--accent)] transition" placeholder="Nhập ghi chú nhanh..." /></div>
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 kanban-scroll">
                    {db.tasks.map(t => <div key={t.id} className="p-3 flex gap-3 rounded-xl text-[13px] font-medium leading-snug bg-[var(--bg-hover)] border cms-border text-[var(--text-main)] group transition hover:border-[var(--accent)]"><input type="checkbox" checked={t.completed} onChange={()=>{const n=db.tasks.map(x=>x.id===t.id?{...x,completed:!x.completed}:x); saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n});}} className="mt-0.5 accent-[var(--accent)] w-4 h-4 cursor-pointer shrink-0" /><span className={`flex-1 ${t.completed?'opacity-40 line-through':''}`}>{t.title}</span><button onClick={()=>{const n=db.tasks.filter(x=>x.id!==t.id); saveLocalDb({...db,tasks:n}); syncMetaAndDB({...db,tasks:n});}} className="text-red-500 font-bold opacity-0 group-hover:opacity-100 px-1 transition">✕</button></div>)}
                  </div>
               </div>
            </aside>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* VÙNG MODALS NỔI BẬT */}
      {/* ======================================================== */}

      {/* 1. MODAL XUẤT SÁCH AI CHUẨN DESIGN */}
      <AIExportModal isOpen={isExportModalOpen} onClose={()=>setIsExportModalOpen(false)} db={db} repoKeysList={repoKeysList} token={token} username={username} setStatus={setStatus} getFileTags={getFileTags} />

      {/* 2. MODAL MÀU SẮC */}
      <ColorModal activeModal={activeModal} setActiveModal={setActiveModal} handleSetColor={handleSetColor} />

      {/* 3. TOAST THÔNG BÁO DƯỚI GÓC TRÁI */}
      {status.text && (
        <div className={`fixed bottom-6 left-6 z-[9999999] bg-white dark:bg-[#1C1C1E] px-6 py-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-[#38383A] ${status.type === 'error' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-[#007AFF]'} font-bold text-sm text-[var(--text-main)] flex items-center gap-3 fade-in`}>
           {status.type === 'loading' && <svg className="animate-spin h-5 w-5 text-[#007AFF]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
           {status.type === 'error' && <span className="text-red-500 text-xl">⚠️</span>}
           {status.type === 'success' && <span className="text-green-500 text-xl"><Icon name="check"/></span>}
           {status.text}
        </div>
      )}
    </>
  );
}