// @ts-nocheck
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const CACHE_DIR = path.join(os.homedir(), '.janex', 'cache');
const CACHE_TTL = 1000 * 60 * 60;

export class FileCache {
  private cacheDir: string;

  constructor() {
    this.cacheDir = CACHE_DIR;
    fs.ensureDirSync(this.cacheDir);
  }

  get(key: string): any | null {
    const file = this.getCacheFile(key);
    if (!fs.existsSync(file)) return null;

    try {
      const data = fs.readJsonSync(file);
      if (Date.now() > data.expires) {
        fs.removeSync(file);
        return null;
      }
      return data.value;
    } catch {
      return null;
    }
  }

  set(key: string, value: any, ttl = CACHE_TTL): void {
    const file = this.getCacheFile(key);
    fs.writeJsonSync(file, {
      value,
      expires: Date.now() + ttl
    });
  }

  clear(): void {
    fs.emptyDirSync(this.cacheDir);
  }

  private getCacheFile(key: string): string {
    const hash = Buffer.from(key).toString('hex').slice(0, 32);
    return path.join(this.cacheDir, `${hash}.json`);
  }
}

export const fileCache = new FileCache();
