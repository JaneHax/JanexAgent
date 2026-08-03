// @ts-nocheck
import axios from 'axios';
import { execAsync } from '../tools/terminal/exec.js';
import { showLogo } from './logo.js';

export async function checkForUpdates(): Promise<string> {
  try {
    const response = await axios.get('https://registry.npmjs.org/janex/latest', { timeout: 5000 });
    const latest = response.data.version;
    const current = '1.0.0';

    if (latest !== current) {
      return `${showLogo()}\n\nUpdate available: ${current} -> ${latest}\nRun: npm update -g janex`;
    }

    return `You are on the latest version (${current})`;
  } catch (error: any) {
    return `Update check failed: ${error.message}`;
  }
}

export async function selfUpdate(): Promise<string> {
  try {
    const result = await execAsync.execute('npm update -g janex');
    return `Update complete:\n${result}`;
  } catch (error: any) {
    return `Update failed: ${error.message}`;
  }
}
