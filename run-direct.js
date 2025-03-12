// Run the application directly without TypeScript compilation
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running the application directly...');

// Use ts-node to run the TypeScript code directly
const tsNode = spawn('npx', ['ts-node', '--esm', 'src/index.ts'], {
  stdio: 'inherit',
  cwd: __dirname
});

tsNode.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
}); 