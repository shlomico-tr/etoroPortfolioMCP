// Fix imports script
const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(componentsDir);

files.forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix imports
    content = content.replace(/from ['"]\.\.\/index\.js['"]/g, 'from "../index.js"');
    content = content.replace(/from ['"]\.\.\/config\/constants\.js['"]/g, 'from "../config/constants.js"');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in ${file}`);
  }
});

console.log('All imports fixed!'); 