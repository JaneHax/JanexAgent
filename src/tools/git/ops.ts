import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';

const execAsync = promisify(exec);

export class GitTool {
  async status(cwd?: string): Promise<string> {
    try {
      const { stdout } = await execAsync('git status --short', { cwd: cwd || process.cwd() });
      return stdout.trim() || 'Working tree clean';
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async diff(file?: string, cwd?: string): Promise<string> {
    try {
      const cmd = file ? `git diff -- ${file}` : 'git diff';
      const { stdout } = await execAsync(cmd, { cwd: cwd || process.cwd() });
      return stdout || 'No changes';
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async log(limit = 10, cwd?: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`git log --oneline -${limit}`, { cwd: cwd || process.cwd() });
      return stdout || 'No commits';
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async branch(cwd?: string): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch -a', { cwd: cwd || process.cwd() });
      return stdout.trim();
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async add(pattern: string, cwd?: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`git add ${pattern}`, { cwd: cwd || process.cwd() });
      return `Staged: ${pattern}`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async commit(message: string, cwd?: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: cwd || process.cwd() });
      return stdout.trim();
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async push(remote = 'origin', branch?: string, cwd?: string): Promise<string> {
    try {
      const target = branch || await this.getCurrentBranch(cwd);
      const { stdout } = await execAsync(`git push ${remote} ${target}`, { cwd: cwd || process.cwd() });
      return stdout.trim();
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async pull(remote = 'origin', branch?: string, cwd?: string): Promise<string> {
    try {
      const target = branch || await this.getCurrentBranch(cwd);
      const { stdout } = await execAsync(`git pull ${remote} ${target}`, { cwd: cwd || process.cwd() });
      return stdout.trim();
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async checkout(branch: string, cwd?: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`git checkout ${branch}`, { cwd: cwd || process.cwd() });
      return `Switched to branch ${branch}`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async createBranch(name: string, cwd?: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`git checkout -b ${name}`, { cwd: cwd || process.cwd() });
      return `Created branch ${name}`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async clone(url: string, dest?: string, cwd?: string): Promise<string> {
    const target = dest || path.basename(url, '.git');
    try {
      const { stdout } = await execAsync(`git clone ${url} ${target}`, { cwd: cwd || process.cwd() });
      return `Cloned to ${target}`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async remote(cwd?: string): Promise<string> {
    try {
      const { stdout } = await execAsync('git remote -v', { cwd: cwd || process.cwd() });
      return stdout.trim();
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  private async getCurrentBranch(cwd?: string): Promise<string> {
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: cwd || process.cwd() });
      return stdout.trim();
    } catch {
      return 'main';
    }
  }
}

export const gitTool = new GitTool();
