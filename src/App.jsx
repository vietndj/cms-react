import React, { useState, useEffect } from 'react';

// ==========================================
// 1. TIỆN ÍCH GITHUB API (Self-healing, No Cache-Control)
// ==========================================
const safeEnc = (fn) => { try { fn = decodeURIComponent(fn); } catch(e){} return encodeURIComponent(fn); };

const getHeaders = (token) => token 
  ? { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' } 
  : { 'Accept': 'application/vnd.github.v3+json' };

// Bộ Icon SVG nhúng trực tiếp để không phải sửa file index.html
const SVGIcons = () => (
  <svg style={{ display: 'none' }}>
    <symbol id="icon-tag" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></symbol>
    <symbol id="icon-link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></symbol>
    <symbol id="icon-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></symbol>
    <symbol id="icon-trash" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></symbol>
    <symbol id="icon-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></symbol>
  </svg>
);

export default function App() {
  // --- STATE AUTH ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // --- STATE EDITOR ---
  const [isEditorOpen, setIsEditorOpen] = useState(true); // Mở sẵn cho dễ nhìn
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('vietndj/vietndj.github.io');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState({ text: '', type: '' });

  // Load dữ liệu khi khởi động
  useEffect(() => {
    if (localStorage.getItem("cms_auth") === "granted") setIsAuthenticated(true);
    const savedToken = localStorage.getItem('github_pat');
    if (savedToken) setToken(savedToken);
  }, []);

  // Login
  const handleLogin = () => {
    if (pin.trim() === "0070") {
      localStorage.setItem("cms_auth", "granted");
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
      setPin('');
    }
  };

  // Lưu Token
  const handleSaveToken = (val) => {
    setToken(val);
    try { localStorage.setItem('github_pat', val); } catch(err){}
  };

  // Auto-Slugify (Lọc dấu tiếng Việt + gộp Tags)
  const autoSlugify = (val, currentTags) => {
    setTitle(val);
    let s = val.toLowerCase().replace(/[áàảạãăắằẳẵặâấầẩẫậ]/gi,'a').replace(/[éèẻẽẹêếềểễệ]/gi,'e').replace(/[iíìỉĩị]/gi,'i').replace(/[óòỏõọôốồổỗộơớờởỡợ]/gi,'o').replace(/[úùủũụưứừửữự]/gi,'u').replace(/[ýỳỷỹỵ]/gi,'y').replace(/đ/gi,'d').replace(/\s+/g,'-').replace(/[^\w\-]+/g,'').replace(/\-\-+/g,'-').replace(/^-+|-+$/g,'');
    let tagArr = currentTags.split(',').map(x=>x.trim()).filter(Boolean);
    if(tagArr.length && s) { 
        let ts = tagArr.join('-').toLowerCase().replace(/\s+/g,'-'); 
        if(!s.includes(ts)) s += '-' + ts; 
    }
    setSlug(s);
  };

  // Gọi API thử để test CORS
  const loadIndexFile = async () => {
    if (!token) return alert("Cần nhập Token PAT!");
    setStatus({ text: 'Đang tải...', type: 'loading' });
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/index.html?t=${Date.now()}`, {
        headers: { ...getHeaders(token), 'Accept': 'application/vnd.github.v3.raw' }
      });
      if (res.ok) {
        setContent(await res.text());
        setTitle("Trang chủ (index.html)");
        setSlug("index.html");
        setStatus({ text: '✅ Tải thành công index.html', type: 'success' });
      } else {
        throw new Error("Không tìm thấy file hoặc sai Repo");
      }
    } catch (e) { 
      setStatus({ text: `❌ Lỗi: ${e.message}`, type: 'error' }); 
    }
  };

  // ==========================================
  // GIAO DIỆN LOGIN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[var(--bg-body)]">
        <div className="cms-card p-10 max-w-sm w-full mx-4 text-center shadow-2xl border cms-border">
          <h2 className="text-2xl font-bold mb-2">Workspace</h2>
          <p className="text-sm text-muted mb-6">Nhập mã PIN truy cập</p>
          <input type="password" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-center text-3xl tracking-[0.5em] font-bold px-4 py-4 cms-input rounded-2xl mb-6 border cms-border" />
          <button onClick={handleLogin} className="w-full py-4 text-base cms-btn-primary rounded-xl shadow-md">Mở Khóa</button>
          {loginError && <p className="text-red-500 text-sm font-bold mt-4">Mã PIN sai.</p>}
        </div>
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN CHÍNH (APP)
  // ==========================================
  return (
    <div className="flex-col w-full min-h-screen fade-in flex">
      <SVGIcons /> {/* Chèn SVG Ẩn */}
      
      {/* HEADER */}
      <header className="cms-glass sticky top-0 z-[60] py-3 px-4 md:px-6 lg:px-8 flex justify-between items-center gap-4 transition-all">
        <h1 className="text-xl font-bold tracking-tight text-[var(--accent)]">vietndj React</h1>
        <button onClick={() => {localStorage.removeItem("cms_auth"); setIsAuthenticated(false)}} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold text-red-500">🔒 Khóa App</button>
      </header>
      
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        
        {/* KHỐI EDITOR HTML */}
        <section className="cms-card overflow-hidden mb-6">
          <button onClick={() => setIsEditorOpen(!isEditorOpen)} className="w-full px-6 py-4 flex justify-between items-center hover:bg-[var(--bg-hover)] font-semibold text-[var(--accent)] outline-none">
            <span className="flex items-center gap-2">
              <svg className="svg-icon"><use href="#icon-edit"></use></svg> Soạn thảo HTML 
            </span>
            <span style={{ transform: isEditorOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} className="transition-transform">▼</span>
          </button>

          {isEditorOpen && (
            <div className="p-6 border-t cms-border bg-[var(--bg-card)] fade-in">
              {/* Token & Repo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <div>
                    <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">Mã Github PAT</label>
                    <input type="password" value={token} onChange={(e)=>handleSaveToken(e.target.value)} className="w-full px-4 py-2.5 cms-input rounded-xl text-sm" placeholder="Nhập Token GitHub..." />
                 </div>
                 <div>
                    <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">Kho (Repo)</label>
                    <input type="text" value={repo} onChange={(e)=>setRepo(e.target.value)} className="w-full px-4 py-2.5 cms-input rounded-xl text-sm font-bold text-[var(--accent)]" />
                 </div>
              </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                 <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">Tiêu đề bài viết</label>
                    <input type="text" value={title} onChange={(e)=>autoSlugify(e.target.value, tags)} placeholder="Vd: Kiến thức lập trình..." className="w-full px-4 py-2.5 cms-input rounded-xl text-sm font-bold" />
                 </div>
                 <div>
                    <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">Slug (URL)</label>
                    <input type="text" value={slug} onChange={(e)=>setSlug(e.target.value)} placeholder="kien-thuc-lap-trinh..." className="w-full px-4 py-2.5 cms-input rounded-xl text-sm font-mono text-[var(--accent)]" />
                 </div>
              </div>

              {/* Tags */}
              <div className="mb-4">
                 <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase flex items-center gap-1">
                   <svg className="w-3 h-3"><use href="#icon-tag"></use></svg> Nhãn (Tags)
                 </label>
                 <input type="text" value={tags} onChange={(e)=>{setTags(e.target.value); autoSlugify(title, e.target.value);}} className="w-full px-4 py-2.5 cms-input rounded-xl text-sm font-bold text-[var(--accent)]" placeholder="Gõ tag (cách bằng dấu phẩy)..." />
              </div>

              {/* Editor */}
              <div className="mb-5">
                 <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase">Nội dung HTML</label>
                 <textarea rows="12" value={content} onChange={(e)=>setContent(e.target.value)} className="w-full px-4 py-3 bg-[#1D1D1F] text-[#34C759] border-none rounded-xl focus:ring-2 focus:ring-[var(--accent)] font-mono text-xs leading-relaxed outline-none" placeholder="Nhập mã HTML vào đây..."></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 items-center">
                 <button className="cms-btn-primary px-8 py-3 rounded-xl shadow-md">Lưu Bài (Chờ API Save)</button>
                 <button onClick={loadIndexFile} className="cms-btn px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                    Test Nạp index.html
                 </button>
              </div>

              {/* Status Toast */}
              {status.text && (
                 <div className={`mt-4 px-4 py-3 font-bold text-sm rounded-xl border ${status.type === 'error' ? 'bg-red-50 text-red-500 border-red-200' : status.type === 'success' ? 'bg-green-50 text-green-600 border-green-200' : 'cms-input text-[var(--accent)] animate-pulse border-transparent'}`}>
                    {status.text}
                 </div>
              )}
            </div>
          )}
        </section>

        <div className="text-center py-20 text-muted font-bold text-sm">
          [Bước tiếp theo: Chúng ta sẽ nạp khối Database hiển thị Danh sách Repo vào đây]
        </div>

      </main>
    </div>
  );
}