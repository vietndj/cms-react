export const SUPA_URL = "https://hogksepvfxzhxyqllkxv.supabase.co/rest/v1/";
export const SUPA_KEY = "sb_publishable_hvyjuTVE11__0IHZGHi_DQ_GylrEYoT";
export const getSupaHeaders=()=>({'apikey':SUPA_KEY,'Authorization':`Bearer ${SUPA_KEY}`,'Content-Type':'application/json'});

export const fetchSupabaseDB=async()=>{try{const r=await fetch(`${SUPA_URL}cms_store?id=eq.1&select=data`,{headers:{...getSupaHeaders(),'Cache-Control':'no-store','Pragma':'no-cache'},cache:'no-store'});if(r.ok){const res=await r.json();if(!res||res.length===0){console.warn("Supabase: bảng cms_store trống hoặc không có row id=1");return null;}return res[0]?.data||null;}const errBody=await r.text().catch(()=>'');console.error(`Supabase lỗi HTTP ${r.status}:`,errBody);}catch(e){console.error("Lỗi fetch DB:",e.message);}return null;};
export const updateSupabaseDB=async(d)=>{try{// Đính kèm _encToken đã cache từ localStorage để không bị mất khi sync
  const cachedEnc=localStorage.getItem('_enc_token_cache');const encToken=cachedEnc?JSON.parse(cachedEnc):null;const payload=encToken?{...d,_encToken:encToken}:d;const r=await fetch(`${SUPA_URL}cms_store?id=eq.1`,{method:'PATCH',headers:getSupaHeaders(),body:JSON.stringify({data:payload})});if(!r.ok){throw new Error(await r.text());}return true;}catch(e){console.error("Lỗi update DB:",e);return false;}};
export const encodeBase64UTF8Async=s=>new Promise(r=>{const rd=new FileReader();rd.onload=()=>r(rd.result.split(',')[1]);rd.readAsDataURL(new Blob([s]));});

// ── Cloud Token Crypto (AES-GCM + PBKDF2) ──────────────────────────────────
const buf2b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
const b642buf=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;
const deriveKey=async pin=>{const enc=new TextEncoder();const km=await crypto.subtle.importKey('raw',enc.encode(pin),{name:'PBKDF2'},false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:enc.encode('cms-fedu-salt-v1'),iterations:100000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);};
export const encryptToken=async(token,pin)=>{try{const key=await deriveKey(pin);const iv=crypto.getRandomValues(new Uint8Array(12));const enc=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(token));return{iv:buf2b64(iv.buffer),ct:buf2b64(enc)};}catch(e){console.error('Encrypt error:',e);return null;}};
export const decryptToken=async(data,pin)=>{try{if(!data?.iv||!data?.ct)return null;const key=await deriveKey(pin);const dec=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(b642buf(data.iv))},key,b642buf(data.ct));return new TextDecoder().decode(dec);}catch(e){console.error('Decrypt error:',e);return null;}};

// Lưu/đọc _encToken bên trong data JSON của row id=1
export const fetchTokenFromCloud=async()=>{try{const r=await fetch(`${SUPA_URL}cms_store?id=eq.1&select=data`,{headers:{...getSupaHeaders(),'Cache-Control':'no-store'},cache:'no-store'});if(r.ok){const res=await r.json();const d=res[0]?.data;return d?._encToken||null;}}catch(e){console.error('Fetch token error:',e);}return null;};
export const saveTokenToCloud=async(token,pin)=>{try{const enc=await encryptToken(token,pin);if(!enc)return false;
  // Đọc data hiện tại để merge, tránh mất dữ liệu
  const r0=await fetch(`${SUPA_URL}cms_store?id=eq.1&select=data`,{headers:getSupaHeaders()});
  const existing=(r0.ok?(await r0.json()):[])[0]?.data||{};
  const merged={...existing,_encToken:enc};
  const r=await fetch(`${SUPA_URL}cms_store?id=eq.1`,{method:'PATCH',headers:getSupaHeaders(),body:JSON.stringify({data:merged})});
  if(r.ok){try{localStorage.setItem('_enc_token_cache',JSON.stringify(enc));}catch(e){}}
  return r.ok;}catch(e){console.error('Save token error:',e);return false;}};




export const username='vietndj'; export const SECRET_PIN="0070";

export const getHeaders=t=>t?{'Authorization':`Bearer ${t}`,'Accept':'application/vnd.github.v3+json'}:{'Accept':'application/vnd.github.v3+json'};
export const getContrastYIQ=h=>{if(!h)return '#1D1D1F';h=h.replace("#","");const y=((parseInt(h.substr(0,2),16)*299)+(parseInt(h.substr(2,2),16)*587)+(parseInt(h.substr(4,2),16)*114))/1000;return y>=128?'#1D1D1F':'#FFFFFF';};
export const fetchText=async(u,t)=>{try{const r=await fetch(u,{headers:{...getHeaders(t),'Accept':'application/vnd.github.v3.raw'}});return r.ok?await r.text():null;}catch(e){return null;}};
export const getFileShaSafe=async(p,f,t)=>{try{let d=await fetch(`https://api.github.com/repos/${p}/contents/${safeEnc(f)}?t=${Date.now()}`,{headers:getHeaders(t)}).then(r=>r.ok?r.json():null);if(d&&!Array.isArray(d))return d.sha;let d2=await fetch(`https://api.github.com/repos/${p}/contents/?t=${Date.now()}`,{headers:getHeaders(t)}).then(r=>r.ok?r.json():null);if(d2&&Array.isArray(d2)){const x=d2.find(x=>x.name===f);if(x)return x.sha;}return null;}catch(e){return null;}};
export const getLastContextFromDB=db=>{const f=db.files||[],t=db.tags||{},l=f.find(x=>x.repoName!==`${username}.github.io`&&x.repoName!==username);return l?{repo:`${username}/${l.repoName}`,tags:(t[`${l.repoName}/${l.fileName}`]||[]).join(', ')}:{repo:`${username}/${username}.github.io`,tags:''};};
export const removeAccents=s=>s?s.toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toLowerCase():"";
export const getStringColor=s=>{if(!s)return '#86868B';const c=['#EF4444','#F97316','#F59E0B','#10B981','#06B6D4','#3B82F6','#8B5CF6','#D946EF','#F43F5E','#14B8A6'];let h=0;for(let i=0;i<s.length;i++)h=s.charCodeAt(i)+((h<<5)-h);return c[Math.abs(h)%c.length];};
export const getTimelineLabel=ts=>{if(!ts)return 'Khác';const n=new Date(),d=new Date(ts),st=new Date(n.getFullYear(),n.getMonth(),n.getDate()),td=new Date(d.getFullYear(),d.getMonth(),d.getDate()),df=Math.floor(Math.abs(st-td)/(1000*60*60*24));if(df===0)return '📍 Hôm nay';if(df<=7)return '🔥 Tuần này';if(df<=14)return '📅 Tuần trước';return `Tháng ${d.getMonth()+1}/${d.getFullYear()}`;};
export const generateSlug=(v,tg)=>{let s=v.toLowerCase().replace(/[áàảạãăắằẳẵặâấầẩẫậ]/gi,'a').replace(/[éèẻẽẹêếềểễệ]/gi,'e').replace(/[iíìỉĩị]/gi,'i').replace(/[óòỏõọôốồổỗộơớờởỡợ]/gi,'o').replace(/[úùủũụưứừửữự]/gi,'u').replace(/[ýỳỷỹỵ]/gi,'y').replace(/đ/gi,'d').replace(/\s+/g,'-').replace(/[^\w\-]+/g,'').replace(/\-\-+/g,'-').replace(/^-+|-+$/g,'');let a=tg.split(',').map(x=>x.trim()).filter(Boolean);if(a.length&&s){let ts=a.join('-').toLowerCase().replace(/\s+/g,'-');if(!s.includes(ts))s+='-'+ts;}if(s.length>140){s=s.substring(0,140);const l=s.lastIndexOf('-');if(l>100)s=s.substring(0,l);}return s;};

export const safeEnc=fn=>{try{fn=decodeURIComponent(fn);}catch(e){}return fn.split('/').map(encodeURIComponent).join('/');};
export const getPreviewText=html=>{try{const d=new DOMParser().parseFromString(html,'text/html');d.querySelectorAll('script,style,nav,footer,svg,.mermaid,button,iframe').forEach(x=>x.remove());let res=[];const h1=d.querySelector('h1');if(h1){let n=h1.nextElementSibling;while(n&&['P','DIV','H2','H3','SPAN','STRONG'].includes(n.tagName)){let t=n.textContent.replace(/\s+/g,' ').trim();if(t.length>30&&t.replace(/Bức Tranh Toàn Cảnh|The Big Idea|Luận điểm/gi,'').trim().length>20){res.push(t);break;}n=n.nextElementSibling;}}const hs=Array.from(d.querySelectorAll('h1,h2,h3,h4,div,span,strong,p'));const th=hs.find(h=>/Bức Tranh Toàn Cảnh|The Big Idea|Luận điểm/i.test(h.textContent)&&h.textContent.length<150);if(th){const pr=th.closest('section')||th.parentElement;if(pr){let vp=Array.from(pr.querySelectorAll('p,blockquote')).find(p=>{let tc=p.textContent.replace(/\s+/g,' ').trim();let nk=tc.replace(/Bức Tranh Toàn Cảnh|The Big Idea|Luận điểm cốt lõi|Luận điểm/gi,'').trim();return nk.length>50&&tc!==res[0];});if(!vp){vp=Array.from(pr.querySelectorAll('div')).find(p=>{let tc=p.textContent.replace(/\s+/g,' ').trim();let nk=tc.replace(/Bức Tranh Toàn Cảnh|The Big Idea|Luận điểm cốt lõi|Luận điểm/gi,'').trim();return nk.length>50&&tc!==res[0];});}if(vp)res.push(vp.textContent.replace(/["“”]/g,'').replace(/\s+/g,' ').trim());else{let nx=th.nextElementSibling;while(nx){if(nx.textContent.trim().length>50){res.push(nx.textContent.replace(/["“”]/g,'').replace(/\s+/g,' ').trim());break;}nx=nx.nextElementSibling;}}}}if(res.length>0)return Array.from(new Set(res)).join('\n\n').substring(0,800);const m=d.querySelector('main')||d.body;let raw=(m.textContent||"").replace(/\s+/g,' ').trim();return raw?raw.substring(0,400)+'...':'';}catch(e){return html?html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().substring(0,400)+'...':'';}};
