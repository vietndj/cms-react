import React from 'react';
import SVGIcons from './Icons.jsx';
import useCMS from './useCMS.js';
import Editor from './Editor.jsx';
import Views from './Views.jsx';

export default function App() {
  const cms = useCMS();
  const { state, actions } = cms;

  // MÀN HÌNH LOGIN
  if (!state.isAuthenticated) return ( 
    <div className="flex fixed inset-0 flex-col items-center justify-center z-[99999] bg-[var(--bg-body)]">
        <div className="cms-card p-10 max-w-sm w-full mx-4 text-center rounded-3xl shadow-2xl border cms-border">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-main)]">Workspace</h2>
            <input type="password" placeholder="••••" value={state.pin} onChange={(e) => actions.setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && actions.handleLogin()} className="w-full text-center text-3xl font-bold px-4 py-4 bg-[var(--bg-hover)] rounded-2xl mb-6 border cms-border outline-none text-[var(--text-main)] tracking-widest" />
            <button onClick={actions.handleLogin} className="w-full py-4 bg-[var(--accent)] text-white rounded-xl font-bold shadow-md hover:opacity-90 transition">Mở Khóa</button>
        </div>
    </div> 
  );

  return (
    <>
      <div className="flex-col w-full min-h-screen fade-in flex bg-[var(--bg-body)]" onClick={() => actions.setActiveColorPickerCard(null)}>
        <SVGIcons />
        
        {/* HEADER */}
        <header className="bg-[var(--bg-card)] border-b border-[var(--border)] pt-4 pb-3 px-4 md:px-8 flex flex-col md:flex-row items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--accent)]">vietndj</h1>
          <div className="flex-1 flex w-full items-center gap-2">
              <div className="flex-1 flex items-center bg-[var(--bg-hover)] rounded-xl px-4 py-2 border cms-border">
                  <svg className="w-4 h-4 text-[var(--text-muted)]"><use href="#icon-search"></use></svg>
                  <input id="search-input-main" type="text" value={state.searchQuery} onChange={(e)=>actions.setSearchQuery(e.target.value)} placeholder="Tìm kiếm không dấu... (Ctrl K)" className="bg-transparent border-none outline-none text-sm w-full ml-3 font-bold text-[var(--text-main)] placeholder-[var(--text-muted)]" />
              </div>
              <button onClick={() => actions.setIsDeepSearch(!state.isDeepSearch)} className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${state.isDeepSearch ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--bg-hover)] text-[var(--text-main)] cms-border hover:opacity-80'}`} title="Bật/Tắt tìm kiếm sâu trong nội dung">
                  <svg className="w-4 h-4"><use href="#icon-search"></use></svg> <span className="hidden sm:inline-block">Sâu</span>
              </button>
          </div>
          <div className="flex items-center gap-2 relative" ref={state.toolsMenuRef}>
            <button onClick={actions.loadDatabase} className="px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border)] flex items-center gap-1">Tải DB</button>
            <button onClick={()=>actions.setIsTasksOpen(!state.isTasksOpen)} className="px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border)] flex items-center gap-1">Việc</button>
            <button onClick={() => actions.setIsToolsOpen(!state.isToolsOpen)} className="px-3 py-2 rounded-xl text-xs font-bold transition text-[var(--text-main)] bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border)] flex items-center gap-1">Công cụ ▾</button>
            {state.isToolsOpen && ( 
                <div className="absolute right-0 top-full mt-2 w-56 p-2 z-[100] cms-card rounded-xl shadow-2xl border cms-border fade-in">
                    <div className="flex gap-1 px-1 mb-3">
                        <button onClick={() => actions.changeTheme('light')} className="flex-1 py-1.5 rounded text-[11px] font-bold border cms-border text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition">Sáng</button>
                        <button onClick={() => actions.changeTheme('dark')} className="flex-1 py-1.5 rounded text-[11px] font-bold border cms-border text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition">Tối</button>
                    </div>
                    <button onClick={() => window.open('https://vietndj.github.io/tin.html', '_blank')} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-[var(--bg-hover)] rounded text-[var(--text-main)] transition">Mở Reader</button>
                    <button onClick={() => { window.open('https://vietndj.github.io/export.html', '_blank'); actions.setIsToolsOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-[#8E44AD] hover:bg-[var(--bg-hover)] rounded transition">Xuất Sách AI</button>
                    <hr className="my-1 border-t cms-border"/>
                    <button onClick={() => {localStorage.removeItem("cms_auth"); actions.setIsAuthenticated(false);}} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-[var(--bg-hover)] rounded transition">Khóa App</button>
                </div> 
            )}
          </div>
        </header>

        {/* BỘ LỌC VIEW VÀ TAGS */}
        <div className="bg-[var(--bg-body)] border-b border-[var(--border)] py-2 px-4 md:px-8 sticky top-0 z-40 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0 mr-2">VIEW</span>
                <div className="flex bg-[var(--bg-hover)] p-1 rounded-lg border cms-border gap-1 mr-4">
                    {[ { id: 'list', icon: '#icon-list', title: 'List' }, { id: 'grid', icon: '#icon-grid', title: 'Grid' }, { id: 'kanban', icon: '#icon-kanban', title: 'Kanban' }, { id: 'table', icon: '#icon-list', title: 'Table' }, { id: 'feed', icon: '#icon-feed', title: 'Feed' } ].map(v => (
                        <button key={v.id} onClick={() => actions.setCurrentView(v.id)} className={`px-3 py-1 rounded-md transition text-xs font-bold flex items-center gap-1.5 ${state.currentView === v.id ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent'}`} title={v.title}>
                            <svg className="w-3.5 h-3.5"><use href={v.icon}></use></svg> <span className="hidden md:block capitalize">{v.title}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0">KHO</span>{state.repoKeysList.map(r => <button key={r} onClick={() => actions.setActiveRepo(state.activeRepo===r?'all':r)} className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${state.activeRepo===r?'bg-[var(--accent)] text-white shadow-sm border border-transparent':'bg-[var(--bg-hover)] text-[var(--text-main)] border cms-border hover:opacity-80'}`}>{r}</button>)}</div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0">TAG</span>{state.allUniqueTags.map(t => <button key={t} onClick={() => actions.setActiveTag(state.activeTag===t?'all':t)} className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${state.activeTag===t?'bg-[var(--accent)] text-white shadow-sm border border-transparent':'bg-[var(--bg-hover)] text-[var(--text-main)] border cms-border hover:opacity-80'}`}>{t}</button>)}</div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto items-start w-full relative pb-20 mt-6">
          <main className="flex-1 w-full min-w-0 flex flex-col gap-8">
            
            {/* EDITOR */}
            <Editor cms={cms} />

            {/* KHỐI VỪA THAO TÁC GẦN ĐÂY */}
            {state.recentFiles.length > 0 && (
              <div className="mb-8 mt-4 pl-1">
                  <div className="flex items-center mb-5 gap-2">
                      <div className="w-3 h-3 bg-[var(--text-main)] rounded-full"></div>
                      <h3 className="font-bold text-lg text-[var(--accent)]">Vừa thao tác gần đây</h3>
                  </div>
                  <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x">
                    {state.recentFiles.map(f => (
                      <div key={f.sha} onClick={() => window.open(f.url, '_blank')} className="bg-[var(--bg-card)] border cms-border p-4 rounded-2xl min-w-[280px] max-w-[280px] flex flex-col cursor-pointer hover:shadow-md transition snap-start">
                         <div className="flex items-center gap-1.5 mb-2 opacity-60">
                             <svg className="w-3 h-3"><use href="#icon-folder"></use></svg>
                             <span className="text-[10px] font-bold uppercase">{f.repoName}</span>
                         </div>
                         <h4 className="font-bold text-[15px] leading-[1.4] mb-6 line-clamp-2 text-[var(--text-main)]">{f.name}</h4>
                         <div className="mt-auto flex justify-between items-center pt-3 border-t cms-border">
                             <span className="text-[11px] text-[var(--text-muted)] font-mono">{f.fullDate?.split(' ')[0]}</span>
                             <button onClick={(e)=>{e.stopPropagation(); actions.editFileContent(f.repoName, f.fileName, f.sha)}} className="bg-[#3B82F6]/10 text-[#3B82F6] font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-[#3B82F6]/20 transition">Sửa</button>
                         </div>
                      </div>
                    ))}
                  </div>
              </div>
            )}

            {/* HIỂN THỊ DỮ LIỆU CHÍNH */}
            <Views cms={cms} />
            
          </main>

          {/* SIDEBAR GHI CHÚ */}
          {state.isTasksOpen && (
            <aside className="w-full lg:w-[320px] shrink-0 sticky top-[130px] h-[calc(100vh-150px)] fade-in">
               <div className="bg-[var(--bg-card)] p-5 flex flex-col h-full border border-[var(--border)] rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-5"><h2 className="text-xs font-black text-[var(--accent)] uppercase tracking-widest flex items-center gap-2"><svg className="w-4 h-4"><use href="#icon-edit"></use></svg> Ghi chú</h2><button onClick={()=>actions.setIsTasksOpen(false)} className="text-[var(--text-muted)] font-bold hover:text-red-500 transition px-2">✕</button></div>
                  <div className="flex gap-2 mb-5"><input type="text" value={state.nativeTaskInput} onChange={e=>actions.setNativeTaskInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && state.nativeTaskInput){const n=[{id:Date.now(),title:state.nativeTaskInput,completed:false},...state.db.tasks]; actions.saveLocalDb({...state.db,tasks:n}); actions.syncMetaAndDB({...state.db,tasks:n}); actions.setNativeTaskInput('');}}} className="flex-1 bg-[var(--bg-hover)] border cms-border text-[var(--text-main)] px-4 py-3 rounded-xl text-sm outline-none focus:border-[var(--accent)] transition" placeholder="Gõ rồi Enter..." /></div>
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                    {state.db.tasks.map(t => <div key={t.id} className="p-3 flex gap-3 rounded-xl text-xs font-medium leading-relaxed bg-[var(--bg-hover)] border cms-border text-[var(--text-main)] group hover:border-[var(--accent)] transition"><input type="checkbox" checked={t.completed} onChange={()=>{const n=state.db.tasks.map(x=>x.id===t.id?{...x,completed:!x.completed}:x); actions.saveLocalDb({...state.db,tasks:n}); actions.syncMetaAndDB({...state.db,tasks:n});}} className="mt-1 accent-[var(--accent)] w-4 h-4 cursor-pointer" /><span className={`flex-1 ${t.completed ? 'opacity-50 line-through' : ''}`}>{t.title}</span><button onClick={()=>{const n=state.db.tasks.filter(x=>x.id!==t.id); actions.saveLocalDb({...state.db,tasks:n}); actions.syncMetaAndDB({...state.db,tasks:n});}} className="text-red-500 font-bold opacity-0 group-hover:opacity-100 px-2 transition">✕</button></div>)}
                  </div>
               </div>
            </aside>
          )}
        </div>
      </div>

      {/* TOAST THÔNG BÁO TÁCH RỜI */}
      {state.status.text && (
          <div className="fixed top-[80px] left-1/2 transform -translate-x-1/2 z-[9999999] pointer-events-none transition-all duration-300 w-max max-w-[90%] fade-in">
              <div className={`bg-[var(--bg-card)] px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 border-2 font-bold text-sm text-[var(--text-main)] ${state.status.type === 'error' ? 'border-red-500' : state.status.type === 'loading' ? 'border-[var(--accent)]' : 'border-green-500'}`}>
                  {state.status.type === 'loading' && <svg className="animate-spin h-5 w-5 text-[var(--accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  {state.status.type === 'error' && <span className="text-red-500 text-lg">✕</span>}
                  {state.status.type === 'success' && <span className="text-green-500 text-lg">✓</span>}
                  <span className="whitespace-nowrap">{state.status.text}</span>
              </div>
          </div>
      )}
    </>
  );
}