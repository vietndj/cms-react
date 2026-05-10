// ==========================================
// FILE: utils.js - CHUYÊN XỬ LÝ LOGIC & API
// ==========================================

export const username = 'vietndj';
export const SECRET_PIN = "0070";

export const safeEnc = (fn) => { 
    try { fn = decodeURIComponent(fn); } catch(e){} 
    return encodeURIComponent(fn); 
};

export const encodeBase64UTF8Async = async (str) => { 
    const bytes = new TextEncoder().encode(str); 
    let binary = ''; 
    for (let i = 0; i < bytes.byteLength; i += 16384) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 16384)); 
    return btoa(binary); 
};

export const getHeaders = (token) => token ? { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' } : { 'Accept': 'application/vnd.github.v3+json' };

export const getContrastYIQ = hex => { 
    if(!hex) return '#1D1D1F'; 
    hex = hex.replace("#",""); 
    const yiq = ((parseInt(hex.substr(0,2),16)*299)+(parseInt(hex.substr(2,2),16)*587)+(parseInt(hex.substr(4,2),16)*114))/1000; 
    return (yiq >= 128) ? '#1D1D1F' : '#FFFFFF'; 
};

export const fetchRawJSON = async (repoPath, file, token) => {
  try { 
      const res = await fetch(`https://api.github.com/repos/${repoPath}/contents/${safeEnc(file)}?t=${Date.now()}`, { headers: { ...getHeaders(token), 'Accept': 'application/vnd.github.v3.raw' } }); 
      if (res.ok) return await res.json(); 
  } catch(e) {}
  try { 
      const r2 = await fetch(`https://${repoPath.split('/')[0]}.github.io/${file}?t=${Date.now()}`); 
      if(r2.ok) return await r2.json(); 
  } catch(e){} 
  return null;
};

export const fetchText = async (url, token) => { 
    try { 
        const res = await fetch(url, { headers: { ...getHeaders(token), 'Accept': 'application/vnd.github.v3.raw' }}); 
        return res.ok ? await res.text() : null; 
    } catch(e) { return null; } 
};

export const getFileShaSafe = async (repoPath, file, token) => { 
  try { 
      let d = await fetch(`https://api.github.com/repos/${repoPath}/contents/${safeEnc(file)}?t=${Date.now()}`, { headers: getHeaders(token) }).then(r => r.ok ? r.json() : null); 
      if(d && !Array.isArray(d)) return d.sha; 
      let d2 = await fetch(`https://api.github.com/repos/${repoPath}/contents/?t=${Date.now()}`, { headers: getHeaders(token) }).then(r => r.ok ? r.json() : null); 
      if(d2 && Array.isArray(d2)) { const f = d2.find(x => x.name === file); if(f) return f.sha; } 
      return null; 
  } catch(e) { return null; }
};

export const getLastContextFromDB = (currentDb) => {
    const files = currentDb.files || [];
    const tagsDb = currentDb.tags || {};
    const latestNormal = files.find(f => f.repoName !== `${username}.github.io` && f.repoName !== username);
    if (latestNormal) {
        return { repo: `${username}/${latestNormal.repoName}`, tags: (tagsDb[`${latestNormal.repoName}/${latestNormal.fileName}`] || []).join(', ') };
    }
    return { repo: `${username}/${username}.github.io`, tags: '' };
};

export const removeAccents = (str) => {
    if (!str) return "";
    return str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();
};

export const getStringColor = (str) => {
    if (!str) return '#86868B'; 
    const colors = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#D946EF', '#F43F5E', '#14B8A6'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

export const getTimelineLabel = (timestamp) => {
    if (!timestamp) return 'Khác';
    const now = new Date();
    const date = new Date(timestamp);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor(Math.abs(startOfToday - startOfTarget) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '📍 Hôm nay';
    if (diffDays <= 7) return '🔥 Tuần này';
    if (diffDays <= 14) return '📅 Tuần trước';
    return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
};

export const generateSlug = (val, currentTags) => {
    let s = val.toLowerCase().replace(/[áàảạãăắằẳẵặâấầẩẫậ]/gi,'a').replace(/[éèẻẽẹêếềểễệ]/gi,'e').replace(/[iíìỉĩị]/gi,'i').replace(/[óòỏõọôốồổỗộơớờởỡợ]/gi,'o').replace(/[úùủũụưứừửữự]/gi,'u').replace(/[ýỳỷỹỵ]/gi,'y').replace(/đ/gi,'d').replace(/\s+/g,'-').replace(/[^\w\-]+/g,'').replace(/\-\-+/g,'-').replace(/^-+|-+$/g,'');
    let tagArr = currentTags.split(',').map(x=>x.trim()).filter(Boolean);
    if(tagArr.length && s) { let ts = tagArr.join('-').toLowerCase().replace(/\s+/g,'-'); if(!s.includes(ts)) s += '-' + ts; }
    return s;
};