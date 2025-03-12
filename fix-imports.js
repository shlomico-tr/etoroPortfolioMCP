// Fix imports script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(componentsDir);

files.forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix imports
    content = content.replace(/from ['"]\.\.\/index\.js['"]/g, 'from "../utils/response.js"');
    content = content.replace(/import \{ handleResponse, DEFAULT_BASE_URL, DEFAULT_ACCESS_TOKEN \} from ["']\.\.\/index\.js["']/g, 
      'import { handleResponse } from "../utils/response.js";\nimport { BASE_URL as DEFAULT_BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js"');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in ${file}`);
  }
});

console.log('All imports fixed!'); 