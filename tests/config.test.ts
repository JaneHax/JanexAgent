import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig, saveConfig, getConfigDir } from '../src/agent/config.ts';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Config', () => {
  const testConfigPath = path.join(os.homedir(), '.janex', 'config.yaml');

  beforeEach(async () => {
    if (await fs.pathExists(testConfigPath)) {
      await fs.remove(testConfigPath);
    }
  });

  it('should return default config when no file exists', async () => {
    const config = await loadConfig();
    expect(config.provider).toBe('custom');
    expect(config.model).toBe('llama3.2');
    expect(config.researchMode).toBe('low');
  });

  it('should return config dir path', () => {
    const dir = getConfigDir();
    expect(dir).toContain('.janex');
  });

  it('should save and load config', async () => {
    await saveConfig({
      provider: 'openai',
      apiStyle: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      model: 'gpt-4o',
      researchMode: 'high',
      themeName: 'Janex',
      captchaAudio: 'hybrid'
    });

    const loaded = await loadConfig();
    expect(loaded.provider).toBe('openai');
    expect(loaded.model).toBe('gpt-4o');
    expect(loaded.researchMode).toBe('high');
  });
});
