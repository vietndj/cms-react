const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(/state\.db\.colors\[k\]/g, "(state.db.colors || {})[k]");
content = content.replace(/state\.db\.files\.filter/g, "(state.db.files || []).filter");
content = content.replace(/\[\.\.\.state\.db\.files\]/g, "[...(state.db.files || [])]");

fs.writeFileSync('src/App.jsx', content);
console.log("Fixed colors and files in App.jsx");
