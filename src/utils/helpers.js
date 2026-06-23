import { USERNAME } from "../constants/config";

export const getContrastYIQ = (h) => {
  if (!h) return "#1D1D1F";
  h = h.replace("#", "");
  const y =
    (parseInt(h.substr(0, 2), 16) * 299 +
      parseInt(h.substr(2, 2), 16) * 587 +
      parseInt(h.substr(4, 2), 16) * 114) /
    1000;
  return y >= 128 ? "#1D1D1F" : "#FFFFFF";
};

export const getLastContextFromDB = (db) => {
  const f = db.files || [],
    t = db.tags || {},
    l = f.find(
      (x) => x.repoName !== `${USERNAME}.github.io` && x.repoName !== USERNAME,
    );
  return l
    ? {
        repo: `${USERNAME}/${l.repoName}`,
        tags: (t[`${l.repoName}/${l.fileName}`] || []).join(", "),
      }
    : { repo: `${USERNAME}/${USERNAME}.github.io`, tags: "" };
};

export const removeAccents = (s) =>
  s
    ? s
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d")
        .toLowerCase()
    : "";

export const getStringColor = (s) => {
  if (!s) return "#86868B";
  const c = [
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#10B981",
    "#06B6D4",
    "#3B82F6",
    "#8B5CF6",
    "#D946EF",
    "#F43F5E",
    "#14B8A6",
  ];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return c[Math.abs(h) % c.length];
};

export const getTimelineLabel = (ts) => {
  if (!ts) return "Khác";
  const n = new Date(),
    d = new Date(ts),
    st = new Date(n.getFullYear(), n.getMonth(), n.getDate()),
    td = new Date(d.getFullYear(), d.getMonth(), d.getDate()),
    df = Math.floor(Math.abs(st - td) / (1000 * 60 * 60 * 24));
  if (df === 0) return "📍 Hôm nay";
  if (df <= 7) return "🔥 Tuần này";
  if (df <= 14) return "📅 Tuần trước";
  return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
};

export const generateSlug = (v, tg) => {
  let s = v
    .toLowerCase()
    .replace(/[áàảạãăắằẳẵặâấầẩẫậ]/gi, "a")
    .replace(/[éèẻẽẹêếềểễệ]/gi, "e")
    .replace(/[iíìỉĩị]/gi, "i")
    .replace(/[óòỏõọôốồổỗộơớờởỡợ]/gi, "o")
    .replace(/[úùủũụưứừửữự]/gi, "u")
    .replace(/[ýỳỷỹỵ]/gi, "y")
    .replace(/đ/gi, "d")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+|-+$/g, "");
  let a = tg
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (a.length && s) {
    let ts = a.join("-").toLowerCase().replace(/\s+/g, "-");
    if (!s.includes(ts)) s += "-" + ts;
  }
  if (s.length > 140) {
    s = s.substring(0, 140);
    const l = s.lastIndexOf("-");
    if (l > 100) s = s.substring(0, l);
  }
  return s;
};

export const safeEnc = (fn) => {
  try {
    fn = decodeURIComponent(fn);
  } catch (e) {}
  return fn.split("/").map(encodeURIComponent).join("/");
};

export const getPreviewText = (html) => {
  try {
    const d = new DOMParser().parseFromString(html, "text/html");
    d.querySelectorAll(
      "script,style,nav,footer,svg,.mermaid,button,iframe",
    ).forEach((x) => x.remove());
    let res = [];
    const h1 = d.querySelector("h1");
    if (h1) {
      let n = h1.nextElementSibling;
      while (
        n &&
        ["P", "DIV", "H2", "H3", "SPAN", "STRONG"].includes(n.tagName)
      ) {
        let t = n.textContent.replace(/\s+/g, " ").trim();
        if (
          t.length > 30 &&
          t.replace(/Bức Tranh Toàn Cảnh|The Big Idea|Luận điểm/gi, "").trim()
            .length > 20
        ) {
          res.push(t);
          break;
        }
        n = n.nextElementSibling;
      }
    }
    const hs = Array.from(d.querySelectorAll("h1,h2,h3,h4,div,span,strong,p"));
    const th = hs.find(
      (h) =>
        /Bức Tranh Toàn Cảnh|The Big Idea|Luận điểm/i.test(h.textContent) &&
        h.textContent.length < 150,
    );
    if (th) {
      const pr = th.closest("section") || th.parentElement;
      if (pr) {
        let vp = Array.from(pr.querySelectorAll("p,blockquote")).find((p) => {
          let tc = p.textContent.replace(/\s+/g, " ").trim();
          let nk = tc
            .replace(
              /Bức Tranh Toàn Cảnh|The Big Idea|Luận điểm cốt lõi|Luận điểm/gi,
              "",
            )
            .trim();
          return nk.length > 50 && tc !== res[0];
        });
        if (!vp) {
          vp = Array.from(pr.querySelectorAll("div")).find((p) => {
            let tc = p.textContent.replace(/\s+/g, " ").trim();
            let nk = tc
              .replace(
                /Bức Tranh Toàn Cảnh|The Big Idea|Luận điểm cốt lõi|Luận điểm/gi,
                "",
              )
              .trim();
            return nk.length > 50 && tc !== res[0];
          });
        }
        if (vp)
          res.push(
            vp.textContent.replace(/["“”]/g, "").replace(/\s+/g, " ").trim(),
          );
        else {
          let nx = th.nextElementSibling;
          while (nx) {
            if (nx.textContent.trim().length > 50) {
               res.push(
                nx.textContent
                  .replace(/["“”]/g, "")
                  .replace(/\s+/g, " ")
                  .trim(),
              );
              break;
            }
            nx = nx.nextElementSibling;
          }
        }
      }
    }
    if (res.length > 0)
      return Array.from(new Set(res)).join("\n\n").substring(0, 800);
    const m = d.querySelector("main") || d.body;
    let raw = (m.textContent || "").replace(/\s+/g, " ").trim();
    return raw ? raw.substring(0, 400) + "..." : "";
  } catch (e) {
    return html
      ? html
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 400) + "..."
      : "";
  }
};
