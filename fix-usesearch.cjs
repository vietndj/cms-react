const fs = require('fs');
let content = fs.readFileSync('src/hooks/useSearch.js', 'utf8');

content = content.replace(/db\.tags\[/g, "(db.tags || {})[");
content = content.replace(/db\.links\[/g, "(db.links || {})[");
content = content.replace(/Object\.values\(db\.tags\)/g, "Object.values(db.tags || {})");
content = content.replace(/db\.tags,/g, "(db.tags || {}),");

fs.writeFileSync('src/hooks/useSearch.js', content);
console.log("Fixed useSearch.js");
