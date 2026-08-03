// @ts-nocheck
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { glob } from 'glob';

export class FileTool {
  async read(filePath: string, limit = 2000, offset = 0): Promise<string> {
    const resolved = this.resolvePath(filePath);
    const stats = await fs.stat(resolved);

    if (stats.isDirectory()) {
      const items = await fs.readdir(resolved);
      return `Directory: ${resolved}\n${items.map((i: string) => {
        const itemPath = path.join(resolved, i);
        const itemStats = fs.statSync(itemPath);
        const prefix = itemStats.isDirectory() ? '📁' : '📄';
        return `${prefix} ${i}`;
      }).join('\n')}`;
    }

    const content = await fs.readFile(resolved, 'utf-8');
    const lines = content.split('\n');
    const sliced = lines.slice(offset, offset + limit);

    return `File: ${resolved} (lines ${offset + 1}-${offset + sliced.length} of ${lines.length})\n` +
      sliced.map((l: string, i: number) => `${offset + i + 1}: ${l}`).join('\n');
  }

  async write(filePath: string, content: string): Promise<string> {
    const resolved = this.resolvePath(filePath);
    await fs.ensureDir(path.dirname(resolved));
    await fs.writeFile(resolved, content, 'utf-8');
    return `Written ${content.length} bytes to ${resolved}`;
  }

  async append(filePath: string, content: string): Promise<string> {
    const resolved = this.resolvePath(filePath);
    await fs.ensureDir(path.dirname(resolved));
    await fs.appendFile(resolved, content, 'utf-8');
    return `Appended ${content.length} bytes to ${resolved}`;
  }

  async edit(filePath: string, oldString: string, newString: string): Promise<string> {
    const resolved = this.resolvePath(filePath);
    const content = await fs.readFile(resolved, 'utf-8');

    if (!content.includes(oldString)) {
      return 'Error: oldString not found in file';
    }

    if ((content.match(new RegExp(this.escapeRegex(oldString), 'g')) || []).length > 1) {
      return 'Error: oldString found multiple times. Provide more context.';
    }

    const newContent = content.replace(oldString, newString);
    await fs.writeFile(resolved, newContent, 'utf-8');
    return `Edited ${resolved}`;
  }

  async delete(filePath: string): Promise<string> {
    const resolved = this.resolvePath(filePath);
    await fs.remove(resolved);
    return `Deleted ${resolved}`;
  }

  async mkdir(dirPath: string): Promise<string> {
    const resolved = this.resolvePath(dirPath);
    await fs.ensureDir(resolved);
    return `Created directory ${resolved}`;
  }

  async copy(src: string, dest: string): Promise<string> {
    const resolvedSrc = this.resolvePath(src);
    const resolvedDest = this.resolvePath(dest);
    await fs.copy(resolvedSrc, resolvedDest);
    return `Copied ${resolvedSrc} -> ${resolvedDest}`;
  }

  async move(src: string, dest: string): Promise<string> {
    const resolvedSrc = this.resolvePath(src);
    const resolvedDest = this.resolvePath(dest);
    await fs.move(resolvedSrc, resolvedDest);
    return `Moved ${resolvedSrc} -> ${resolvedDest}`;
  }

  async search(pattern: string, path?: string): Promise<string> {
    const searchPath = path || process.cwd();
    const files = await glob(pattern, { cwd: searchPath, absolute: true });
    return files.length > 0 ? files.join('\n') : 'No files found';
  }

  async grep(pattern: string, path?: string, filePattern?: string): Promise<string> {
    const searchPath = path || process.cwd();
    const files = filePattern ? await glob(filePattern, { cwd: searchPath, absolute: true }) : [searchPath];

    const results: string[] = [];
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line: string, i: number) => {
          if (new RegExp(pattern).test(line)) {
            results.push(`${file}:${i + 1}: ${line}`);
          }
        });
      } catch {}
    }

    return results.length > 0 ? results.join('\n') : 'No matches found';
  }

  async stat(filePath: string): Promise<string> {
    const resolved = this.resolvePath(filePath);
    const stats = await fs.stat(resolved);
    return JSON.stringify({
      path: resolved,
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      created: stats.birthtime,
      modified: stats.mtime
    }, null, 2);
  }

  private resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) return filePath;
    return path.join(process.cwd(), filePath);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export const fileTool = new FileTool();
