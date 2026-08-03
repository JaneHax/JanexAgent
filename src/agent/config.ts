// @ts-nocheck
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

export interface JanexConfig {
  provider: 'anthropic' | 'openai' | 'custom' | 'custom-anthropic';
  apiKey: string;
  baseUrl?: string;
  model: string;
  visionModel?: string;
  visionBaseUrl?: string;
  visionApiKey?: string;
  visionProvider?: 'anthropic' | 'openai' | 'custom' | 'custom-anthropic';
  visionApiStyle?: 'openai' | 'anthropic' | 'auto';
  maxTokens?: number;
  contextLimit?: number;
  contextInputLimit?: number;
  contextOutputLimit?: number;
  contextCompactionBuffer?: number;
  temperature?: number;
  systemPrompt?: string;
  apiStyle?: 'anthropic' | 'openai' | 'auto';
  researchMode?: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | 'ultra';
  themeName?: 'Janex' | 'opencode' | 'amber' | 'violet';
  captchaAudio?: 'none' | 'local' | 'hybrid';
  gateway?: any;
  browser?: any;
  mcp?: any;
  skills?: any;
  brain?: any;
}

export const CONFIG_PATH = path.join(os.homedir(), '.janex');

export function getConfigDir(): string {
  return CONFIG_PATH;
}

export async function loadConfig(): Promise<JanexConfig> {
  const configFile = path.join(CONFIG_PATH, 'config.yaml');
  if (await fs.pathExists(configFile)) {
    const content = await fs.readFile(configFile, 'utf-8');
    return yaml.load(content) as JanexConfig;
  }
  return {
    provider: 'custom',
    apiKey: '',
    model: 'llama3.2',
    researchMode: 'low',
    themeName: 'Janex',
    captchaAudio: 'hybrid'
  };
}

export async function saveConfig(config: JanexConfig): Promise<void> {
  await fs.ensureDir(CONFIG_PATH);
  const configFile = path.join(CONFIG_PATH, 'config.yaml');
  await fs.writeFile(configFile, yaml.dump(config), 'utf-8');
}

export async function setupWizard(): Promise<void> {
  console.log('Setup wizard not implemented');
}