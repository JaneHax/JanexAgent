import type { janexConfig } from '../agent/Config.js';

export type ApiMode = 'openai' | 'anthropic' | 'codex_responses' | 'auto';

// ─── Host-mandated API modes ────────────────────────────────────────────────

const OPENAI_HOSTS = new Set([
  'api.openai.com',
  'us.api.openai.com',
  'eu.api.openai.com',
]);

const ANTHROPIC_HOSTS = new Set([
  'api.anthropic.com',
]);

// ─── Provider overlays ──────────────────────────────────────────────────────

export interface ProviderOverlay {
  transport: 'openai_chat' | 'anthropic_messages' | 'codex_responses';
  authType: 'api_key' | 'oauth_external' | 'oauth_device_code' | 'external_process' | 'aws_sdk' | 'vertex';
  extraEnvVars: string[];
  baseUrlOverride: string;
  baseUrlEnvVar: string;
  isAggregator: boolean;
}

export const PROVIDER_OVERLAYS: Record<string, ProviderOverlay> = {
  openai: {
    transport: 'codex_responses',
    authType: 'api_key',
    extraEnvVars: [],
    baseUrlOverride: 'https://api.openai.com/v1',
    baseUrlEnvVar: 'OPENAI_BASE_URL',
    isAggregator: false,
  },
  anthropic: {
    transport: 'anthropic_messages',
    authType: 'api_key',
    extraEnvVars: ['ANTHROPIC_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN'],
    baseUrlOverride: 'https://api.anthropic.com',
    baseUrlEnvVar: 'ANTHROPIC_BASE_URL',
    isAggregator: false,
  },
  'openai-api': {
    transport: 'codex_responses',
    authType: 'api_key',
    extraEnvVars: [],
    baseUrlOverride: 'https://api.openai.com/v1',
    baseUrlEnvVar: 'OPENAI_BASE_URL',
    isAggregator: false,
  },
  xai: {
    transport: 'codex_responses',
    authType: 'api_key',
    extraEnvVars: ['XAI_API_KEY'],
    baseUrlOverride: 'https://api.x.ai/v1',
    baseUrlEnvVar: 'XAI_BASE_URL',
    isAggregator: false,
  },
  'xai-oauth': {
    transport: 'codex_responses',
    authType: 'oauth_external',
    extraEnvVars: [],
    baseUrlOverride: 'https://api.x.ai/v1',
    baseUrlEnvVar: 'XAI_BASE_URL',
    isAggregator: false,
  },
  deepseek: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['DEEPSEEK_API_KEY'],
    baseUrlOverride: '',
    baseUrlEnvVar: 'DEEPSEEK_BASE_URL',
    isAggregator: false,
  },
  alibaba: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['DASHSCOPE_API_KEY'],
    baseUrlOverride: '',
    baseUrlEnvVar: 'DASHSCOPE_BASE_URL',
    isAggregator: false,
  },
  qwen: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['DASHSCOPE_API_KEY'],
    baseUrlOverride: '',
    baseUrlEnvVar: 'DASHSCOPE_BASE_URL',
    isAggregator: false,
  },
  lmstudio: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['LM_API_KEY'],
    baseUrlOverride: 'http://127.0.0.1:1234/v1',
    baseUrlEnvVar: 'LM_BASE_URL',
    isAggregator: false,
  },
  ollama: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: [],
    baseUrlOverride: 'http://127.0.0.1:11434/v1',
    baseUrlEnvVar: 'OLLAMA_BASE_URL',
    isAggregator: false,
  },
  openrouter: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['OPENROUTER_API_KEY'],
    baseUrlOverride: 'https://openrouter.ai/api/v1',
    baseUrlEnvVar: 'OPENROUTER_BASE_URL',
    isAggregator: true,
  },
  vercel: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: [],
    baseUrlOverride: '',
    baseUrlEnvVar: 'VERCEL_AI_GATEWAY_BASE_URL',
    isAggregator: true,
  },
  azure: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['AZURE_OPENAI_API_KEY'],
    baseUrlOverride: '',
    baseUrlEnvVar: 'AZURE_OPENAI_BASE_URL',
    isAggregator: false,
  },
  'azure-foundry': {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['AZURE_FOUNDRY_API_KEY'],
    baseUrlOverride: '',
    baseUrlEnvVar: 'AZURE_FOUNDRY_BASE_URL',
    isAggregator: false,
  },
  bedrock: {
    transport: 'openai_chat',
    authType: 'aws_sdk',
    extraEnvVars: [],
    baseUrlOverride: '',
    baseUrlEnvVar: '',
    isAggregator: false,
  },
  vertex: {
    transport: 'openai_chat',
    authType: 'vertex',
    extraEnvVars: [],
    baseUrlOverride: '',
    baseUrlEnvVar: 'VERTEX_BASE_URL',
    isAggregator: false,
  },
  kimi: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['KIMI_API_KEY'],
    baseUrlOverride: 'https://api.kimi.com/v1',
    baseUrlEnvVar: 'KIMI_BASE_URL',
    isAggregator: false,
  },
  minimax: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['MINIMAX_API_KEY'],
    baseUrlOverride: 'https://api.minimax.chat/v1',
    baseUrlEnvVar: 'MINIMAX_BASE_URL',
    isAggregator: false,
  },
  mistral: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['MISTRAL_API_KEY'],
    baseUrlOverride: 'https://api.mistral.ai/v1',
    baseUrlEnvVar: 'MISTRAL_BASE_URL',
    isAggregator: false,
  },
  groq: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['GROQ_API_KEY'],
    baseUrlOverride: 'https://api.groq.com/openai/v1',
    baseUrlEnvVar: 'GROQ_BASE_URL',
    isAggregator: false,
  },
  fireworks: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['FIREWORKS_API_KEY'],
    baseUrlOverride: 'https://api.fireworks.ai/inference/v1',
    baseUrlEnvVar: 'FIREWORKS_BASE_URL',
    isAggregator: false,
  },
  together: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['TOGETHER_API_KEY'],
    baseUrlOverride: 'https://api.together.xyz/v1',
    baseUrlEnvVar: 'TOGETHER_BASE_URL',
    isAggregator: false,
  },
  novita: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['NOVITA_API_KEY'],
    baseUrlOverride: 'https://api.novita.ai/v1',
    baseUrlEnvVar: 'NOVITA_BASE_URL',
    isAggregator: false,
  },
  huggingface: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['HF_API_KEY'],
    baseUrlOverride: 'https://api.huggingface.co/v1',
    baseUrlEnvVar: 'HF_BASE_URL',
    isAggregator: true,
  },
  github: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['GH_TOKEN', 'GITHUB_TOKEN'],
    baseUrlOverride: '',
    baseUrlEnvVar: '',
    isAggregator: false,
  },
  zai: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['GLM_API_KEY', 'ZAI_API_KEY', 'Z_AI_API_KEY'],
    baseUrlOverride: 'https://open.bigmodel.cn/api/paas/v4',
    baseUrlEnvVar: 'GLM_BASE_URL',
    isAggregator: false,
  },
  stepfun: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['STEPFUN_API_KEY'],
    baseUrlOverride: 'https://api.stepfun.ai/step_plan/v1',
    baseUrlEnvVar: 'STEPFUN_BASE_URL',
    isAggregator: false,
  },
  upstage: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['UPSTAGE_API_KEY'],
    baseUrlOverride: 'https://api.upstage.ai/v1',
    baseUrlEnvVar: 'UPSTAGE_BASE_URL',
    isAggregator: false,
  },
  gmi: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['GMI_API_KEY'],
    baseUrlOverride: 'https://api.gmi-serving.com/v1',
    baseUrlEnvVar: 'GMI_BASE_URL',
    isAggregator: false,
  },
  arcee: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['ARCEE_API_KEY'],
    baseUrlOverride: 'https://api.arcee.ai/api/v1',
    baseUrlEnvVar: 'ARCEE_BASE_URL',
    isAggregator: false,
  },
  nvidia: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['NVIDIA_API_KEY'],
    baseUrlOverride: 'https://integrate.api.nvidia.com/v1',
    baseUrlEnvVar: 'NVIDIA_BASE_URL',
    isAggregator: false,
  },
  xiaomi: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['XIAOMI_API_KEY'],
    baseUrlOverride: '',
    baseUrlEnvVar: 'XIAOMI_BASE_URL',
    isAggregator: false,
  },
  tencent: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: ['TENCENT_API_KEY'],
    baseUrlOverride: '',
    baseUrlEnvVar: 'TENCENT_BASE_URL',
    isAggregator: false,
  },
  moa: {
    transport: 'openai_chat',
    authType: 'api_key',
    extraEnvVars: [],
    baseUrlOverride: 'moa://local',
    baseUrlEnvVar: '',
    isAggregator: true,
  },
};

// ─── Alias normalization ────────────────────────────────────────────────────

export const PROVIDER_ALIASES: Record<string, string> = {
  // openai family
  gpt: 'openai',
  o1: 'openai',
  o3: 'openai',
  o4: 'openai',
  chatgpt: 'openai',
  'openai-api': 'openai-api',

  // anthropic family
  claude: 'anthropic',
  'claude-code': 'anthropic',

  // xai
  'x-ai': 'xai',
  'x.ai': 'xai',
  grok: 'xai',
  'xai-grok': 'xai',
  'xai-oauth': 'xai-oauth',

  // deepseek
  'deep-seek': 'deepseek',

  // alibaba / qwen
  dashscope: 'alibaba',
  aliyun: 'alibaba',
  qwen: 'alibaba',
  'alibaba-cloud': 'alibaba',
  'alibaba_coding': 'alibaba-coding-plan',
  'alibaba-coding': 'alibaba-coding-plan',

  // lmstudio / local
  'lm-studio': 'lmstudio',
  lm_studio: 'lmstudio',
  ollama: 'ollama',
  vllm: 'ollama',
  llamacpp: 'ollama',
  'llama.cpp': 'ollama',
  'llama-cpp': 'ollama',

  // kimi
  kimi: 'kimi',
  moonshot: 'kimi',

  // minimax
  'minimax-china': 'minimax',
  minimax_cn: 'minimax',

  // mistral
  mistralai: 'mistral',
  'mistral-ai': 'mistral',

  // groq
  groq: 'groq',

  // fireworks
  'fireworks-ai': 'fireworks',
  fw: 'fireworks',

  // together
  together: 'together',
  'together-ai': 'together',

  // novita
  'novita-ai': 'novita',
  novitaai: 'novita',

  // huggingface
  hf: 'huggingface',
  'hugging-face': 'huggingface',
  huggingface_hub: 'huggingface',

  // github / copilot
  github: 'github',
  copilot: 'github',
  'github-copilot': 'github',

  // zai / glm
  glm: 'zai',
  'z-ai': 'zai',
  'z.ai': 'zai',
  zhipu: 'zai',

  // stepfun
  step: 'stepfun',
  stepfun: 'stepfun',

  // upstage / solar
  solar: 'upstage',

  // gmi
  'gmi-cloud': 'gmi',
  gmicloud: 'gmi',

  // arcee
  'arcee-ai': 'arcee',
  arceeai: 'arcee',

  // nvidia
  nim: 'nvidia',
  'nvidia-nim': 'nvidia',
  build_nvidia: 'nvidia',
  nemotron: 'nvidia',

  // xiaomi
  mimo: 'xiaomi',
  'xiaomi-mimo': 'xiaomi',

  // tencent
  tencent: 'tencent',
  tokenhub: 'tencent',
  'tencent-cloud': 'tencent',
  tencentmaas: 'tencent',

  // aws
  aws: 'bedrock',
  'aws-bedrock': 'bedrock',
  'amazon-bedrock': 'bedrock',
  amazon: 'bedrock',

  // vercel
  'ai-gateway': 'vercel',
  aigateway: 'vercel',
  'vercel-ai-gateway': 'vercel',

  // openrouter
  openrouter: 'openrouter',

  // azure
  azure: 'azure',
  'azure-openai': 'azure',
  'azure-foundry': 'azure-foundry',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function getPath(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

// ─── API mode detection from URL ───────────────────────────────────────────

export function detectApiModeForUrl(baseUrl: string): ApiMode | null {
  const hostname = getHostname(baseUrl);
  const path = getPath(baseUrl);

  if (OPENAI_HOSTS.has(hostname)) {
    return 'codex_responses';
  }
  if (ANTHROPIC_HOSTS.has(hostname)) {
    return 'anthropic';
  }
  if (path.endsWith('/anthropic') || path.endsWith('/anthropic/v1')) {
    return 'anthropic';
  }
  if (hostname === 'api.kimi.com' && baseUrl.toLowerCase().includes('/coding')) {
    return 'anthropic';
  }
  if (hostname === 'api.x.ai') {
    return 'codex_responses';
  }

  return null;
}

// ─── Local model auto-detect ───────────────────────────────────────────────

export async function autoDetectLocalModel(baseUrl: string): Promise<string> {
  if (!baseUrl) return '';
  try {
    let url = baseUrl.replace(/\/+$/, '');
    if (!url.endsWith('/v1')) {
      url += '/v1';
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${url}/models`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);
    if (!res.ok) return '';
    const json = (await res.json().catch(() => null)) as any;
    const models = Array.isArray(json?.data) ? json.data : [];
    if (models.length === 1) {
      const id = models[0]?.id;
      if (typeof id === 'string' && id.trim()) return id.trim();
    }
  } catch {
    // ignore detection failures
  }
  return '';
}

// ─── Model → provider heuristics ───────────────────────────────────────────

export function detectProviderForModel(modelName: string): string | null {
  const name = (modelName || '').trim().toLowerCase();
  if (!name) return null;

  if (name.includes('claude') || name.includes('anthropic')) return 'anthropic';
  if (name.includes('gpt') || name.includes('o1') || name.includes('o3') || name.includes('o4')) return 'openai';
  if (name.includes('gemini')) return 'openai';
  if (name.includes('llama') || name.includes('mistral') || name.includes('qwen') || name.includes('deepseek')) return 'openai';
  if (name.includes('grok')) return 'openai';
  if (name.includes('phi') || name.includes('yi-') || name.includes('vicuna')) return 'openai';
  if (name.includes('kimi')) return 'kimi';
  if (name.includes('minimax')) return 'minimax';
  if (name.includes('step')) return 'stepfun';
  if (name.includes('solar') || name.includes('upstage')) return 'upstage';
  if (name.includes('nvidia') || name.includes('nemotron')) return 'nvidia';
  if (name.includes('fireworks')) return 'fireworks';
  if (name.includes('groq')) return 'groq';
  if (name.includes('together')) return 'together';

  return null;
}

// ─── Alias resolution ──────────────────────────────────────────────────────

export function normalizeProviderName(name: string): string {
  const key = name.trim().toLowerCase();
  return PROVIDER_ALIASES[key] || key;
}

// ─── Host-derived API key ──────────────────────────────────────────────────

export function getHostDerivedApiKey(baseUrl: string): string {
  const hostname = getHostname(baseUrl);
  if (!hostname) return '';

  // Reject IPs / loopback
  const lastLabel = hostname.split('.').pop() || '';
  if (/^\d+$/.test(lastLabel) || hostname === 'localhost' || hostname.includes(':')) {
    return '';
  }

  // Strip common prefixes
  const labels = hostname.split('.').filter(Boolean);
  while (labels.length > 0 && ['api', 'www', 'openai', 'anthropic'].includes(labels[0])) {
    labels.shift();
  }
  if (labels.length < 2) return '';

  // Registrable label = second-to-last
  const vendor = labels[labels.length - 2];
  const sanitized = vendor.replace(/[^a-z0-9]/gi, '_').toUpperCase();
  if (!sanitized || !/^[A-Z]/.test(sanitized)) return '';

  // Don't re-derive env vars already handled explicitly
  if (['OPENAI', 'OPENROUTER', 'OLLAMA', 'ANTHROPIC'].includes(sanitized)) return '';

  const envName = `${sanitized}_API_KEY`;
  return process.env[envName]?.trim() || '';
}

// ─── API style resolution ──────────────────────────────────────────────────

export function resolveApiStyle(config: janexConfig): 'openai' | 'anthropic' | 'auto' {
  const configured = (config as any).apiStyle as string | undefined;
  if (configured === 'openai' || configured === 'anthropic') return configured;

  const detected = detectApiModeForUrl(config.baseUrl || '');
  if (detected === 'anthropic') return 'anthropic';
  if (detected === 'codex_responses') return 'openai';

  const providerDetected = detectProviderForModel(config.model);
  if (providerDetected === 'anthropic') return 'anthropic';

  return 'auto';
}

// ─── Provider overlay lookup ───────────────────────────────────────────────

export function getProviderOverlay(providerId: string): ProviderOverlay | null {
  const normalized = normalizeProviderName(providerId);
  return PROVIDER_OVERLAYS[normalized] || PROVIDER_OVERLAYS[providerId] || null;
}

// ─── Auto-detect gate ──────────────────────────────────────────────────────

export function needsAutoDetect(config: janexConfig): boolean {
  if ((config as any).apiStyle === 'openai' || (config as any).apiStyle === 'anthropic') return false;
  if (config.provider === 'anthropic') return false;
  if (config.provider === 'openai') return false;
  return true;
}
