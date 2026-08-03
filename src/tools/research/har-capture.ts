// @ts-nocheck
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

export class HarCaptureTool {
  async capture(options: {
    url: string;
    output?: string;
    filter?: string;
    headless?: boolean;
    wait?: number;
    cdpUrl?: string;
    existingTab?: boolean;
  }): Promise<string> {
    const scriptDir = path.join(__dirname, '..', '..', '..', 'scripts', 'har-capture');
    const script = path.join(scriptDir, 'har_capture.py');

    if (!await fs.pathExists(script)) {
      return `Error: har_capture.py not found at ${script}`;
    }

    const pythonCmd = os.platform() === 'win32' ? 'python' : 'python3';
    try {
      execSync(`${pythonCmd} --version`, { stdio: 'pipe' });
    } catch {
      return `Error: Python not found. Install Python 3.9+ to use har_capture.\nRun: pip install playwright && python -m playwright install chromium`;
    }

    const args: string[] = [options.url];

    if (options.output) args.push('-o', options.output);
    if (options.filter) args.push('-f', options.filter);
    if (options.headless) args.push('--headless');
    if (options.wait) args.push('--wait', String(options.wait));
    if (options.cdpUrl) args.push('--cdp-url', options.cdpUrl);
    if (options.existingTab) args.push('--existing-tab');

    try {
      const { stdout } = await execAsync(`python "${script}" ${args.map(a => `"${a}"`).join(' ')}`, {
        timeout: options.wait ? (options.wait + 10) * 1000 : 120000,
        env: { ...process.env, PATH: process.env.PATH }
      });
      return stdout || 'Capture complete.';
    } catch (error: any) {
      return `HAR capture error: ${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`;
    }
  }
}

export const harCaptureTool = new HarCaptureTool();
