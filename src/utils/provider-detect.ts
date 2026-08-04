import type { janexConfig } from '../agent/Config.js';

export type ApiMode = 'openai' | 'anthropic' | 'codex_responses' | 'auto';

const OPENAI_HOSTS = new Set([
  'api.openai.com',
  'us.api.openai.com',
  'eu.api.openai.com',
]);

const ANTHROPIC_HOSTS = new Set([
  'api.anthropic.com',
]);

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

export function detectProviderForModel(modelName: string): string | null {
  const name = (modelName || '').trim().toLowerCase();
  if (!name) return null;

  if (name.includes('claude') || name.includes('anthropic')) return 'anthropic';
  if (name.includes('gpt') || name.includes('o1') || name.includes('o3') || name.includes('o4')) return 'openai';
  if (name.includes('gemini')) return 'openai';
  if (name.includes('llama') || name.includes('mistral') || name.includes('qwen') || name.includes('deepseek')) return 'openai';
  if (name.includes('grok')) return 'openai';
  if (name.includes('phi') || name.includes('yi-') || name.includes('vicuna')) return 'openai';

  return null;
}

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

export function needsAutoDetect(config: janexConfig): boolean {
  if ((config as any).apiStyle === 'openai' || (config as any).apiStyle === 'anthropic') return false;
  if (config.provider === 'anthropic') return false;
  if (config.provider === 'openai') return false;
  return true;
}
