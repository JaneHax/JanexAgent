import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { normalizeBaseUrl } from '../utils/base-url.js';

export interface janexConfig {
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
  themeName?: 'janex';
  accentColor?: string;
  useGroqAudio?: boolean;
  captchaAudio?: 'image' | 'audio' | 'hybrid' | boolean;
  groqApiKey?: string;
  integrations?: {
    github?: { enabled: boolean; auth?: 'gh-cli' | 'token'; token?: string };
    gmail?: { enabled: boolean; address?: string; appPassword?: string };
  };
  plugins?: {
    enabled?: boolean;
    sources?: string[];
    allowClaudeStore?: boolean;
  };
  gateway?: {
    discord?: { enabled: boolean; token: string; allowedUsers?: string[] };
    telegram?: { enabled: boolean; token: string; allowedUsers?: string[] };
    whatsapp?: { enabled: boolean; allowedUsers?: string[] };
  };
  imageGeneration?: {
    baseUrl?: string;
    apiKey?: string;
    format?: 'openai' | 'anthropic';
    model?: string;
    size?: string;
  };
  browser?: {
    proxies?: string[];
    cdpEndpoint?: string;
  };
  brain?: {
    enabled?: boolean;
    repoIndex?: boolean;
    evidenceGate?: boolean;
    capabilities?: Partial<{
      vision: boolean;
      tools: boolean;
      json: boolean;
    }>;
  };
  hooks?: {
    preToolUse?: string | { command: string; timeoutMs?: number };
    postToolUse?: string | { command: string; timeoutMs?: number };
    toolFailure?: string | { command: string; timeoutMs?: number };
    preCompact?: string | { command: string; timeoutMs?: number };
    postCompact?: string | { command: string; timeoutMs?: number };
  };
  execution?: {
    simpleTurnsWithoutTools?: boolean;
    lazyToolSchemas?: boolean;
  };
  tools?: {
    enabled?: string[];
    disabled?: string[];
  };
  features?: string[];
  searchEngine?: 'ddg' | 'serper' | 'tavily' | 'searxng';
  searchApiKey?: string;
  searchBaseUrl?: string;
  redditRelayUrl?: string;
  redditRelayToken?: string;
  redditBackend?: 'auto' | 'relay' | 'keyless' | 'scrapecreators' | 'off';
  redditRelayStrict?: boolean;
  captchaSolver?: {
    url?: string;
    token?: string;
    timeoutSeconds?: number;
  };
}

const CONFIG_DIR = path.join(os.homedir(), '.janex');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.yaml');

export function getConfigDir(): string { return CONFIG_DIR; }
export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): janexConfig {
  ensureConfigDir();

  // Try config file first
  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = yaml.load(raw) as Partial<janexConfig>;
    return mergeWithEnv(parsed);
  }

  // Fallback to env
  return mergeWithEnv({});
}

function mergeWithEnv(file: Partial<janexConfig>): janexConfig {
  const apiStyle =
    (process.env.janex_API_STYLE as janexConfig['apiStyle']) || file.apiStyle || 'auto';
  const rawBaseUrl = process.env.janex_BASE_URL || file.baseUrl;
  const baseUrl = normalizeBaseUrl(rawBaseUrl, apiStyle);

  return {
    provider: (process.env.janex_PROVIDER as janexConfig['provider']) || file.provider || 'openai',
    apiKey: process.env.janex_API_KEY || file.apiKey || '',
    baseUrl,
    model: process.env.janex_MODEL || file.model || 'gpt-4o',
    visionModel: process.env.janex_VISION_MODEL || file.visionModel,
    visionBaseUrl: process.env.janex_VISION_BASE_URL || file.visionBaseUrl,
    visionApiKey: process.env.janex_VISION_API_KEY || file.visionApiKey,
    visionProvider:
      (process.env.janex_VISION_PROVIDER as janexConfig['visionProvider']) || file.visionProvider,
    visionApiStyle: (process.env.janex_VISION_API_STYLE as any) || file.visionApiStyle,
    maxTokens: file.maxTokens || 4096,
    contextLimit: parseNumberEnv(process.env.janex_CONTEXT_LIMIT) ?? file.contextLimit,
    contextInputLimit: parseNumberEnv(process.env.janex_CONTEXT_INPUT_LIMIT) ?? file.contextInputLimit,
    contextOutputLimit: parseNumberEnv(process.env.janex_CONTEXT_OUTPUT_LIMIT) ?? file.contextOutputLimit,
    contextCompactionBuffer:
      parseNumberEnv(process.env.janex_CONTEXT_COMPACTION_BUFFER) ?? file.contextCompactionBuffer,
    temperature: file.temperature ?? 0.7,
    systemPrompt: file.systemPrompt,
    apiStyle,
    researchMode: file.researchMode || 'low',
    themeName: file.themeName || 'janex',
    accentColor: file.accentColor,
    useGroqAudio: file.useGroqAudio,
    captchaAudio: file.captchaAudio,
    groqApiKey: process.env.GROQ_API_KEY || file.groqApiKey,
    integrations: file.integrations,
    plugins: file.plugins,
    gateway: file.gateway,
    imageGeneration: {
      ...(file.imageGeneration || {}),
      baseUrl: process.env.janex_IMAGE_BASE_URL || file.imageGeneration?.baseUrl,
      apiKey: process.env.janex_IMAGE_API_KEY || file.imageGeneration?.apiKey,
      format: (process.env.janex_IMAGE_FORMAT as any) || file.imageGeneration?.format,
      model: process.env.janex_IMAGE_MODEL || file.imageGeneration?.model,
      size: process.env.janex_IMAGE_SIZE || file.imageGeneration?.size,
    },
    browser: {
      ...(file.browser || {}),
      cdpEndpoint:
        process.env.janex_BROWSER_CDP_ENDPOINT ||
        process.env.BROWSER_CDP_ENDPOINT ||
        process.env.BROWSER_CDP_URL ||
        file.browser?.cdpEndpoint,
    },
    brain: file.brain,
    hooks: file.hooks,
    execution: file.execution,
    tools: file.tools,
    features: file.features,
    searchEngine: file.searchEngine || 'ddg',
    searchApiKey: process.env.SEARCH_API_KEY || file.searchApiKey || '',
    searchBaseUrl: process.env.SEARCH_BASE_URL || process.env.SEARXNG_URL || file.searchBaseUrl,
    redditRelayUrl:
      process.env.janex_REDDIT_RELAY_URL || process.env.REDDIT_RELAY_URL || file.redditRelayUrl,
    redditRelayToken:
      process.env.janex_REDDIT_RELAY_TOKEN ||
      process.env.REDDIT_RELAY_TOKEN ||
      file.redditRelayToken,
    redditBackend:
      (process.env.janex_REDDIT_BACKEND as janexConfig['redditBackend']) ||
      file.redditBackend ||
      'auto',
    redditRelayStrict:
      parseBooleanEnv(process.env.janex_REDDIT_RELAY_STRICT) ?? file.redditRelayStrict,
    captchaSolver: {
      ...(file.captchaSolver || {}),
      url: process.env.janex_CAPTCHA_SOLVER_URL || file.captchaSolver?.url,
      token: process.env.janex_CAPTCHA_SOLVER_TOKEN || file.captchaSolver?.token,
      timeoutSeconds:
        parseNumberEnv(process.env.janex_CAPTCHA_SOLVER_TIMEOUT_SECONDS) ??
        file.captchaSolver?.timeoutSeconds,
    },
  };
}

function parseNumberEnv(value?: string): number | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBooleanEnv(value?: string): boolean | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
}

export function saveConfig(config: janexConfig): void {
  ensureConfigDir();
  const yamlStr = yaml.dump(config, { indent: 2 });
  fs.writeFileSync(CONFIG_FILE, yamlStr, 'utf-8');
}

export const CONFIG_PATH = CONFIG_DIR;







