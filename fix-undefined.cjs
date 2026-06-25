const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Replace state.db.pinned.includes with (state.db.pinned || []).includes
content = content.replace(/state\.db\.pinned\.includes/g, "(state.db.pinned || []).includes");

// Replace state.db.deleted with (state.db.deleted || []) where necessary, but mostly it's already done.
// Let's also check for state.db.views
content = content.replace(/\(state\.db\.views \|\| \{\}\)/g, "(state.db.views || {})");

fs.writeFileSync('src/App.jsx', content);
console.log("Fixed undefined checks");
