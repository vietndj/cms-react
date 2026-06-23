import React from "react";

export default function LoginScreen({ pin, setPin, handleLogin }) {
  return (
    <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[var(--bg-body)]">
      <div className="cms-card p-10 max-w-sm w-full mx-4 text-center rounded-3xl shadow-2xl border cms-border">
        <h2 className="text-2xl font-bold mb-6 text-[var(--text-main)]">
          Workspace
        </h2>
        <input
          type="password"
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="w-full text-center text-3xl font-bold px-4 py-4 bg-[var(--bg-hover)] rounded-2xl mb-6 border cms-border outline-none tracking-widest"
        />
        <button
          onClick={handleLogin}
          className="w-full py-4 bg-[var(--accent)] text-white rounded-xl font-bold hover:opacity-90"
        >
          Mở Khóa
        </button>
      </div>
    </div>
  );
}
