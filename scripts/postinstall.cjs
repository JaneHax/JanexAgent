const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('Running Janex postinstall...');

try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build complete.');

  const harDir = path.join(__dirname, '..', 'scripts', 'har-capture');
  const harScript = path.join(harDir, 'har_capture.py');

  if (fs.existsSync(harScript)) {
    console.log('Setting up HAR capture tool...');
    try {
      execSync('pip install playwright', { stdio: 'inherit', env: { ...process.env, PATH: process.env.PATH } });
      console.log('Playwright Python installed.');
      try {
        execSync('python -m playwright install chromium', { stdio: 'inherit', timeout: 120000 });
        console.log('Chromium browser downloaded.');
      } catch (e) {
        console.warn('Playwright browser install failed. Run manually: python -m playwright install chromium');
      }
    } catch (e) {
      console.warn('pip install failed. Python/Playwright may need manual install.');
    }
  }

  console.log('Janex installed successfully.');
} catch (error) {
  console.error('Postinstall failed. Run npm run build manually.');
}
