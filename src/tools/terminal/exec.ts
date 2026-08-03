// @ts-nocheck
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export class TerminalTool {
  async execute(command: string, cwd?: string, timeout = 30000): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd || process.cwd(),
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, TERM: 'xterm-256color' }
      });

      const output = [stdout, stderr].filter(Boolean).join('\n').trim();
      return output || '(command executed, no output)';
    } catch (error: any) {
      return `Error (${error.code}): ${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`;
    }
  }

  async executeInBackground(command: string, cwd?: string): Promise<{ pid: number }> {
    const child = exec(command, {
      cwd: cwd || process.cwd(),
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return { pid: child.pid || 0 };
  }

  async killProcess(pid: number): Promise<string> {
    try {
      process.kill(pid);
      return `Process ${pid} killed`;
    } catch (error: any) {
      return `Error killing process: ${error.message}`;
    }
  }

  async which(command: string): Promise<string> {
    const platform = os.platform();
    const prefix = platform === 'win32' ? 'where' : 'which';
    try {
      const result = await this.execute(`${prefix} ${command}`);
      return result.includes('not found') ? 'Not found' : result.trim();
    } catch {
      return 'Not found';
    }
  }

  async env(key?: string): Promise<string> {
    if (key) {
      return process.env[key] || `Variable ${key} not set`;
    }
    return Object.entries(process.env)
      .slice(0, 50)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
  }
}

export const terminalTool = new TerminalTool();
