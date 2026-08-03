const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const tsconfig = path.join(root, 'tsconfig.json');
const outDir = path.join(root, 'dist');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('Building Janex...');
try {
  execSync('npx tsc -p tsconfig.json', { stdio: 'inherit', cwd: root });
  console.log('Build complete: dist/');
} catch (e) {
  console.error('Build failed');
  process.exit(1);
}
