import React from 'react';
import { generateSlug } from './utils.js';

export default function Editor({ cms }) {
  const { state, actions } = cms;

  if (!state.isEditorOpen) {
    return (
        <button onClick={() => {
            actions.setIsEditorOpen(true); 
            if (!state.title && !state.content && !state.editorOriginal.sha) {
                // Tự động được handle trong hook nếu cần, hoặc để mặc định
            }
        }} className="w-full px-6 py-4 flex justify-between items-center bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] font-bold text-[var(--accent)] outline-none transition rounded-xl border cms-border shadow-sm">
            <span className="flex items-center gap-2 text-base">
                <svg className="w-5 h-5"><use href="#icon-edit"></use></svg> Soạn thảo HTML <span className="text-[9px] text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono ml-2 uppercase bg-[var(--bg-body)] hidden sm:inline-block">Ctrl E</span>
            </span>
            <span>▼</span>
        </button>
    );
  }

  return (
    <div className="flex flex-col gap-5 border cms-border bg-[var(--bg-card)] rounded-xl shadow-sm overflow-hidden">
        <button onClick={() => actions.setIsEditorOpen(false)} className="w-full px-6 py-4 flex justify-between items-center bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] font-bold text-[var(--accent)] border-b cms-border transition outline-none">
            <span className="flex items-center gap-2 text-base"><svg className="w-5 h-5"><use href="#icon-edit"></use></svg> Thu gọn Editor</span>
            <span>▲</span>
        </button>

        <div className="p-6 flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
                {state.repoKeysList.map(r => <button key={r} onClick={() => actions.setRepo(`${username}/${r}`)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border ${state.repo===`${username}/${r}`?'bg-[var(--accent)] text-white border-transparent':'bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border)] hover:opacity-80'}`}>{r}</button>)}
            </div>
            
            <textarea ref={state.editorInputRef} rows="12" value={state.content} onChange={e => actions.handleContentChange(e.target.value)} className="w-full p-5 bg-[#1D1D1F] text-[#34C759] rounded-xl font-mono text-sm outline-none shadow-inner leading-relaxed" placeholder="Mở soạn thảo (Ctrl E) -> Dán HTML (Ctrl V) -> Lưu (Ctrl S)... Tiêu đề tự bóc từ thẻ <title>..."></textarea>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold uppercase text-[var(--text-muted)] ml-1">Tiêu đề</label><input type="text" value={state.title} onChange={e => actions.handleTitleChange(e.target.value)} className="px-4 py-3 bg-[var(--bg-hover)] rounded-xl text-sm font-bold outline-none text-[var(--text-main)] border cms-border focus:border-[var(--accent)] transition" placeholder="Tiêu đề bài viết..." /></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold uppercase text-[var(--text-muted)] ml-1">Slug (URL)</label><input type="text" value={state.slug} onChange={e => actions.handleSlugChange(e.target.value)} className="px-4 py-3 bg-[var(--bg-hover)] rounded-xl text-sm font-bold font-mono outline-none text-[var(--accent)] border cms-border focus:border-[var(--accent)] transition" placeholder="slug-cua-bai-viet..." /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5 p-4 rounded-xl border cms-border bg-[var(--bg-body)]">
                    <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] ml-1">Nhãn (Tags)</label>
                    <input type="text" value={state.tags} onChange={e=>{actions.setTags(e.target.value); if(!state.isSlugEdited) actions.handleSlugChange(generateSlug(state.title, e.target.value));}} className="px-4 py-2 bg-[var(--bg-hover)] rounded-lg text-sm font-bold text-[var(--text-main)] outline-none border cms-border focus:border-[var(--accent)] transition" />
                    {state.allUniqueTags.length > 0 && (<div className="mt-3"><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-2 block px-1">Gợi ý nhãn có sẵn:</span><div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-32 pr-1">{state.allUniqueTags.map(t => { const isSelected = state.tags.split(',').map(x=>x.trim()).includes(t); return <button key={t} type="button" onClick={() => actions.toggleTagEditor(t)} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition border ${isSelected ? 'bg-[var(--accent)] text-white border-transparent shadow-sm' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]'}`}>{t}</button>})}</div></div>)}
                </div>
                
                <div className="flex flex-col gap-1.5 p-4 rounded-xl border cms-border bg-[var(--bg-body)]">
                    <div className="flex justify-between items-center mb-2"><label className="text-[10px] font-bold uppercase text-[var(--text-muted)] ml-1 flex items-center gap-1"><svg className="w-3 h-3"><use href="#icon-link"></use></svg> Link tham khảo</label><button onClick={actions.handleAddLink} className="text-[10px] font-bold text-[var(--accent)] bg-[var(--bg-hover)] px-3 py-1.5 rounded-lg border cms-border hover:bg-[var(--bg-card)] transition">+ Thêm</button></div>
                    {state.uploadLinks.length === 0 ? <div className="text-xs text-[var(--text-muted)] italic text-center py-6 opacity-70 bg-[var(--bg-card)] rounded-lg border cms-border">Chưa có link</div> : (<div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">{state.uploadLinks.map((link, idx) => (<div key={idx} className="flex items-center gap-2 bg-[var(--bg-card)] border cms-border p-2 rounded-lg"><input type="text" value={link.title} onChange={e => actions.handleUpdateLink(idx, 'title', e.target.value)} placeholder="Tên" className="w-1/3 bg-transparent text-xs font-bold outline-none text-[var(--text-main)] px-2" /><input type="text" value={link.url} onChange={e => actions.handleUpdateLink(idx, 'url', e.target.value)} placeholder="https://..." className="flex-1 bg-transparent text-xs outline-none text-[var(--text-muted)] px-2 border-l cms-border" /><button onClick={() => actions.handleRemoveLink(idx)} className="text-red-500 font-bold px-3 hover:bg-red-50 rounded transition">✕</button></div>))}</div>)}
                </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 mt-2 border-t cms-border">
                <button id="btn-save-article" onClick={actions.handleSaveArticle} disabled={state.isSaving} className="bg-[var(--accent)] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg text-sm transition hover:scale-105 disabled:opacity-50 border border-transparent">
                  {state.isSaving?'Đang lưu...':'LƯU BÀI (Ctrl S)'}
                </button>
                {state.editorOriginal.sha && <button onClick={actions.cancelEdit} className="text-red-500 text-xs font-bold px-5 py-3 hover:bg-[var(--bg-hover)] rounded-xl transition">✕ HỦY SỬA BÀI NÀY</button>}
            </div>
        </div>
    </div>
  );
}