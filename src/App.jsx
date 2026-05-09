import { useState, useEffect } from 'react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  
  const SECRET_PIN = "0070";

  useEffect(() => {
    if (localStorage.getItem("cms_auth") === "granted") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    if (pin.trim() === SECRET_PIN) {
      localStorage.setItem("cms_auth", "granted");
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cms_auth");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[var(--bg-body)]">
        <div className="cms-card p-10 max-w-sm w-full mx-4 text-center shadow-2xl border cms-border">
          <h2 className="text-2xl font-bold mb-2">Workspace</h2>
          <p className="text-sm text-muted mb-6">Nhập mã PIN truy cập</p>
          <input 
            type="password" 
            placeholder="••••" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full text-center text-3xl tracking-[0.5em] font-bold px-4 py-4 cms-input rounded-2xl mb-6 border cms-border" 
          />
          <button onClick={handleLogin} className="w-full py-4 text-base cms-btn-primary rounded-xl shadow-md">
            Mở Khóa
          </button>
          {error && <p className="text-red-500 text-sm font-bold mt-4">Mã PIN sai.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col w-full min-h-screen fade-in flex">
      <header className="cms-glass sticky top-0 z-[60] py-3 px-4 md:px-6 lg:px-8 flex justify-between items-center gap-4 transition-all">
        <h1 className="text-xl font-bold tracking-tight shrink-0 text-[var(--accent)] hidden sm:block">
          vietndj React
        </h1>
        <button onClick={handleLogout} className="cms-btn px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 text-red-500">
          🔒 Khóa App
        </button>
      </header>
      
      <main className="flex-1 p-8 text-center text-muted font-bold">
        Hệ thống đã được mở khóa! Chúng ta sẽ tiếp tục đưa giao diện Editor và Danh sách Repo vào đây ở bước tiếp theo.
      </main>
    </div>
  );
}