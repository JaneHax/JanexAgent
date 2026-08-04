import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import {
  drawInputScreen,
  drawSelector,
  drawBox,
  drawSuccess,
  drawInfo,
  drawWarning,
  enterSetupScreen,
  leaveSetupScreen,
} from '../cli/SetupUI.js';
import type { janexConfig } from './Config.js';
import {
  loadConfig,
  saveConfig,
  ensureConfigDir,
  CONFIG_PATH,
} from './Config.js';
import { fetchAvailableModels } from '../utils/provider-detect.js';
import { banner } from '../utils/ascii-logo.js';
import { normalizeBaseUrl } from '../utils/base-url.js';

const teal = chalk.hex('#fab283');
const dim = chalk.hex('#808080');
const orange = chalk.hex('#9d7cd8');
const bright = chalk.hex('#eeeeee');

const CONFIG_FILE = path.join(CONFIG_PATH, 'config.yaml');
const SETUP_STATE = path.join(CONFIG_PATH, '.setup-state.json');

function setupProviderFromConfig(config: janexConfig): string | undefined {
  if (config.provider === 'custom-anthropic') return 'custom';
  if (config.provider === 'custom') {
    if (config.apiStyle === 'openai') return 'custom';
    if (config.apiStyle === 'anthropic') return 'custom';
    return 'custom';
  }
  return config.provider;
}

async function detectCustomProviderStyle(
  baseUrl: string,
  apiKey: string,
): Promise<'openai' | 'anthropic' | 'auto'> {
  drawInfo('Detecting endpoint style...');
  
  const models = await fetchAvailableModels(baseUrl);
  if (models.length > 0) {
    drawInfo(`Detected OpenAI-compatible endpoint (${models.length} models)`);
    return 'openai';
  }
  
  drawInfo('Could not auto-detect endpoint style. Defaulting to auto.');
  return 'auto';
}

export async function runSetup(continueFrom?: boolean): Promise<janexConfig> {
  enterSetupScreen();
  try {
    console.log(banner('setup', 'wizard'));

    const existingConfig = loadConfig();
    const existingSetupProvider = setupProviderFromConfig(existingConfig);
    const state = continueFrom ? loadSetupState() : {};

    drawInfo('Configure your AI agent step by step.');
    drawInfo(
      'You can skip any step and run ' +
        teal('janex setup --continue') +
        ' later.\n',
    );

    // Step 1 of 6: Terminal theme
    const themeChoice = state.themeChoice?.name
      ? state.themeChoice
      : await stepTheme(existingConfig.themeName, existingConfig.accentColor, '1 / 6');

    // Step 2 of 6: Provider
    const provider =
      state.provider || (await stepProvider(existingSetupProvider, '2 / 6'));
    if (provider === '__skip__' || provider === '__back__') {
      saveSetupState({ step: 'provider' });
      return await loadConfigOrDefault();
    }
    const providerChanged = Boolean(
      existingSetupProvider && provider !== existingSetupProvider,
    );

    // Step 2: Base URL (custom providers)
    let baseUrl: string | undefined =
      state.baseUrl || (providerChanged ? undefined : existingConfig.baseUrl);
    const isCustom = provider === 'custom';
    if (isCustom && !baseUrl) {
      baseUrl = await stepBaseUrl(provider, '3 / 6');
      if (baseUrl === '__skip__' || baseUrl === '__back__') {
        saveSetupState({ step: 'baseUrl', provider });
        return await loadConfigOrDefault();
      }
    }

    // Step 4: API Key — always offer for custom providers and provider changes
    let apiKey = state.apiKey || (providerChanged ? '' : existingConfig.apiKey);
    if (!apiKey || isCustom || providerChanged) {
      const existingHint = apiKey
        ? `\nCurrent key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}\nLeave blank to keep existing key.`
        : '';
      const key = await stepApiKey(provider, existingHint, '4 / 6');
      if (key === '__skip__' || key === '__back__') {
        if (apiKey) {
          drawInfo('Keeping existing API key.\n');
        } else {
          saveSetupState({ step: 'apiKey', provider, baseUrl });
          return await loadConfigOrDefault();
        }
      } else if (key) {
        apiKey = key;
      }
    }

    // Auto-detect API style for custom providers
    let detectedApiStyle: 'openai' | 'anthropic' | 'auto' | undefined;
    if (isCustom && baseUrl && apiKey) {
      detectedApiStyle = await detectCustomProviderStyle(baseUrl, apiKey);
    }

    // Step 5: Model
    const model =
      state.model || (await stepModel(provider, existingConfig.model, '5 / 11', baseUrl, detectedApiStyle));
    if (model === '__skip__' || model === '__back__') {
      saveSetupState({ step: 'model', provider, baseUrl, apiKey });
      return await loadConfigOrDefault();
    }

    // Step 6: Gateway — always offer to set/update tokens
    const gateway = await stepGateway(state.gateway || existingConfig.gateway, '6 / 11');

    // Step 7: Features
    const features = await stepFeatures(existingConfig.features, '7 / 11');

    // Step 8: Account integrations
    const integrations = await stepIntegrations(existingConfig.integrations, '8 / 11');

    // Step 9: Plugin/skill loading
    const plugins = await stepPlugins(existingConfig.plugins, '9 / 11');

    // Step 10: Captcha solving method
    const captchaAudio = await stepCaptcha(
      existingConfig.captchaAudio,
      existingConfig.groqApiKey,
      '10 / 11',
    );

    // Step 11: Web search engine
    const searchEngine = await stepSearchEngine(
      existingConfig.searchEngine,
      existingConfig.searchApiKey,
      existingConfig.searchBaseUrl,
      '11 / 11',
    );

    const resolvedProvider =
      provider === 'custom' ? 'custom' : provider;

    const resolvedApiStyle: janexConfig['apiStyle'] =
      provider === 'custom'
        ? detectedApiStyle || 'auto'
        : provider === 'openai'
          ? 'openai'
          : provider === 'anthropic'
            ? 'anthropic'
            : undefined;

    const finalBaseUrl = isCustom
      ? baseUrl
      : providerChanged
        ? undefined
        : baseUrl;

    const config: janexConfig = {
      ...existingConfig,
      provider: resolvedProvider as janexConfig['provider'],
      apiKey,
      baseUrl: finalBaseUrl,
      model,
      maxTokens: existingConfig.maxTokens || 4096,
      temperature: existingConfig.temperature ?? 0.7,
      apiStyle: resolvedApiStyle,
      researchMode: existingConfig.researchMode || 'low',
      themeName: themeChoice.name,
      accentColor: themeChoice.accent,
      gateway: gateway as janexConfig['gateway'],
      integrations,
      plugins,
      features: (Array.isArray(features)
        ? features
        : existingConfig.features || []) as string[],
      captchaAudio: captchaAudio.mode,
      useGroqAudio: captchaAudio.useGroqAudio,
      groqApiKey: captchaAudio.groqApiKey,
      searchEngine: searchEngine.engine,
      searchApiKey: searchEngine.apiKey || '',
      searchBaseUrl: searchEngine.baseUrl,
    };

    ensureConfigDir();
    saveConfig(config);
    clearSetupState();

    console.log();
    drawSuccess('Configuration saved to ~/.janex/config.yaml');

    drawInfo('Starting janex Agent...\n');

    return config;
  } finally {
    leaveSetupScreen();
  }
}

async function stepTheme(
  existingName?: janexConfig['themeName'],
  existingAccent?: string,
  step?: string,
): Promise<{
  name: NonNullable<janexConfig['themeName']>;
  accent: string;
}> {
  const choice = await drawSelector({
    title: 'Terminal UI Theme',
    items: [{ id: 'janex', label: 'janex Cyan + Orange', desc: 'Default theme' }],
    allowSkip: true,
    step,
    extra: existingName
      ? [`Current theme: ${existingName}`, 'Skip keeps current theme.']
      : undefined,
  });

  if ((choice === '__skip__' || choice === '__back__') && existingName) {
    return { name: existingName, accent: existingAccent || '#fab283' };
  }

  const palette: Record<string, { name: NonNullable<janexConfig['themeName']>; accent: string }> = { janex: { name: 'janex', accent: '#fab283' } };

  return palette[choice] || palette.janex;
}

async function stepProvider(existing?: string, step?: string): Promise<string> {
  const choice = await drawSelector({
    title: 'LLM Provider',
    items: [
      {
        id: 'openai',
        label: 'OpenAI-compatible',
        desc:
          existing === 'openai'
            ? 'Current provider'
            : 'OpenAI, GPT-4o, o1, etc.',
      },
      {
        id: 'anthropic',
        label: 'Anthropic-compatible',
        desc:
          existing === 'anthropic'
            ? 'Current provider'
            : 'Claude 4, Claude 3.5, etc.',
      },
      {
        id: 'custom',
        label: 'Custom provider',
        desc:
          existing === 'custom'
            ? 'Current provider'
            : 'Ollama, LM Studio, vLLM, OpenRouter, etc.',
      },
    ],
    allowSkip: true,
    step,
    extra: existing
      ? [
          `Current provider: ${existing}`,
          'Skip keeps the current provider and key.',
        ]
      : undefined,
  });
  if ((choice === '__skip__' || choice === '__back__') && existing)
    return existing;
  return choice;
}

async function stepApiKey(
  provider: string,
  existingHint?: string,
  step?: string,
): Promise<string> {
  const providerNames: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    custom: 'Custom provider',
  };
  const providerName = providerNames[provider] || provider;

  const hintLines = [
    `You can get an API key at:`,
    provider === 'openai'
      ? '  https://platform.openai.com/api-keys'
      : provider === 'anthropic'
        ? '  https://console.anthropic.com/settings/keys'
        : "  Your provider's dashboard",
    '',
    'Your key is stored locally in ~/.janex/config.yaml',
  ];
  if (existingHint) hintLines.push(existingHint);

  const key = await drawInputScreen({
    title: `API Key — ${providerName}`,
    hint: `Paste your ${providerName} API key below`,
    label: 'API Key:',
    masked: true,
    extra: hintLines,
    step,
  });

  if (!key || key === '__back__') return '__skip__';
  return key;
}

async function stepBaseUrl(provider: string, step?: string): Promise<string | undefined> {
  const items = [
    { id: 'custom', label: 'Custom URL', desc: 'Enter your own endpoint' },
    {
      id: 'http://localhost:11434/v1',
      label: 'Ollama',
      desc: 'localhost:11434',
    },
    {
      id: 'http://localhost:1234/v1',
      label: 'LM Studio',
      desc: 'localhost:1234',
    },
    { id: 'http://localhost:8080/v1', label: 'vLLM', desc: 'localhost:8080' },
    {
      id: 'https://api.openai.com/v1',
      label: 'OpenAI /v1',
      desc: 'Official OpenAI-compatible endpoint',
    },
  ];

  const choice = await drawSelector({
    title: 'Base URL',
    items,
    allowSkip: true,
    step,
    extra: [
      'Custom URL is selected first so your custom gateway endpoint is not skipped.',
    ],
  });

  if (choice === '__skip__' || choice === '__back__') return '__skip__';

  if (choice === 'custom') {
    while (true) {
      const url = await drawInputScreen({
        title: 'Custom Base URL',
        hint: 'Examples: https://api.openai.com/v1, localhost:1234/v1, https://your-gateway/openai/v1',
        label: 'Base URL:',
        masked: false,
        step,
      });

      if (!url || url === '__back__') return '__skip__';

      try {
        return normalizeBaseUrl(url, 'auto');
      } catch (e: any) {
        drawWarning(e.message);
        drawInfo(
          'The URL may include /v1. If http/https is missing, janex will add it automatically.\n',
        );
      }
    }
  }

  return normalizeBaseUrl(choice, 'auto');
}

async function stepModel(
  provider: string,
  existingModel?: string,
  step?: string,
  baseUrl?: string,
  detectedApiStyle?: 'openai' | 'anthropic' | 'auto',
): Promise<string> {
  // For custom providers with a base URL, try to fetch available models
  if (provider === 'custom' && baseUrl) {
    drawInfo('Fetching available models from endpoint...');
    const detectedModels = await fetchAvailableModels(baseUrl);
    if (detectedModels.length > 0) {
      const items = [
        ...detectedModels.map(m => ({
          id: m.id,
          label: m.label,
          desc: undefined as string | undefined,
        })),
        { id: 'custom', label: 'Custom model', desc: 'Type your own model ID' },
      ];
      const choice = await drawSelector({
        title: 'Model',
        items,
        allowSkip: true,
        step,
        extra: existingModel
          ? [`Current model: ${existingModel}`, 'Skip keeps the current model.']
          : [`Found ${detectedModels.length} model(s) at this endpoint`],
      });
      if (choice === '__skip__' || choice === '__back__') {
        return existingModel || detectedModels[0]?.id || 'gpt-4o';
      }
      if (choice === 'custom') {
        const model = await drawInputScreen({
          title: 'Custom Model',
          hint: existingModel
            ? `Enter the exact model ID your provider supports\nCurrent: ${existingModel}`
            : 'Enter the exact model ID your provider supports',
          label: 'Model ID:',
          masked: false,
          step,
        });
        return !model || model === '__back__' ? existingModel || detectedModels[0]?.id || 'gpt-4o' : model;
      }
      return choice;
    }
  }

  const models: Record<string, { id: string; label: string; desc?: string }[]> =
    {
      openai: [
        {
          id: 'gpt-4o',
          label: 'GPT-4o',
          desc: 'Best balance of speed and capability',
        },
        { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Fast and cheap' },
        {
          id: 'gpt-4.1',
          label: 'GPT-4.1',
          desc: 'Latest flagship model',
        },
        {
          id: 'o3',
          label: 'o3',
          desc: 'Advanced reasoning',
        },
        {
          id: 'o4-mini',
          label: 'o4-mini',
          desc: 'Fast reasoning',
        },
        { id: 'custom', label: 'Custom model', desc: 'Type your own model ID' },
      ],
      anthropic: [
        {
          id: 'claude-sonnet-4-20250514',
          label: 'Claude Sonnet 4',
          desc: 'Best balance',
        },
        {
          id: 'claude-opus-4-20250514',
          label: 'Claude Opus 4',
          desc: 'Most capable',
        },
        {
          id: 'claude-3-5-haiku-20241022',
          label: 'Claude 3.5 Haiku',
          desc: 'Fast and efficient',
        },
        { id: 'custom', label: 'Custom model', desc: 'Type your own model ID' },
      ],
      custom: [
        { id: 'custom', label: 'Custom model', desc: 'Type your own model ID' },
      ],
    };

  const items = models[provider] || models['custom']!;
  const choice = await drawSelector({
    title: 'Model',
    items,
    allowSkip: true,
    step,
    extra: existingModel
      ? [`Current model: ${existingModel}`, 'Skip keeps the current model.']
      : undefined,
  });

  if (choice === '__skip__' || choice === '__back__') {
    return (
      existingModel ||
      (provider === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gpt-4o')
    );
  }

  if (choice === 'custom') {
    const model = await drawInputScreen({
      title: 'Custom Model',
      hint: existingModel
        ? `Enter the exact model ID your provider supports\nCurrent: ${existingModel}`
        : 'Enter the exact model ID your provider supports',
      label: 'Model ID:',
      masked: false,
      step,
    });
    return !model || model === '__back__' ? existingModel || 'gpt-4o' : model;
  }

  return choice;
}

async function stepGateway(
  existing?: janexConfig['gateway'],
  step?: string,
): Promise<janexConfig['gateway']> {
  const existingList: string[] = [];
  if (existing?.discord?.token)
    existingList.push(
      `Discord (${existing.discord.token.slice(0, 8)}...${existing.discord.token.slice(-4)})`,
    );
  if (existing?.telegram?.token)
    existingList.push(
      `Telegram (${existing.telegram.token.slice(0, 8)}...${existing.telegram.token.slice(-4)})`,
    );
  if (existing?.whatsapp?.enabled) existingList.push('WhatsApp (QR paired)');

  const extra =
    existingList.length > 0
      ? [
          '',
          'Current tokens:',
          ...existingList.map((t) => `  • ${t}`),
          '',
          'Select to update or add new tokens.',
        ]
      : undefined;

  const selected = await drawSelector({
    title: 'Messaging Gateway (Optional)',
    items: [
      {
        id: 'discord',
        label: 'Discord Bot',
        desc: existing?.discord?.token
          ? 'Update token'
          : 'Connect to Discord servers',
      },
      {
        id: 'telegram',
        label: 'Telegram Bot',
        desc: existing?.telegram?.token
          ? 'Update token'
          : 'Connect via Bot API',
      },
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        desc: existing?.whatsapp?.enabled
          ? 'Update settings'
          : 'Connect via Baileys (QR code)',
      },
    ],
    allowSkip: true,
    step,
    extra,
  });

  if (!selected || selected === '__skip__' || selected === '__back__') {
    drawInfo(
      existing
        ? 'Keeping existing gateway tokens.\n'
        : 'No platforms selected.\n',
    );
    return existing || undefined;
  }

  const platforms = Array.isArray(selected) ? selected : [selected];
  const gateway: janexConfig['gateway'] = existing ? { ...existing } : {};

  for (const platform of platforms) {
    if (platform === 'discord') {
      const token = await drawInputScreen({
        title: 'Discord Bot Token',
        hint: 'Get from discord.com/developers/applications',
        label: 'Token:',
        masked: true,
        step,
      });
      if (token && token !== '__back__') {
        gateway.discord = { enabled: true, token };
        const userIds = await drawInputScreen({
          title: 'Discord — Allowed User IDs (Optional)',
          hint: 'Comma-separated Discord user IDs. Only these users can control the bot.\nLeave blank to allow everyone (not recommended for VPS bots).\nFind your ID: right-click your name → Copy User ID (enable Developer Mode in settings).',
          label: 'User IDs:',
          masked: false,
          step,
        });
        if (userIds && userIds !== '__back__') {
          gateway.discord!.allowedUsers = userIds
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
    }
    if (platform === 'telegram') {
      const token = await drawInputScreen({
        title: 'Telegram Bot Token',
        hint: 'Get from @BotFather on Telegram',
        label: 'Token:',
        masked: true,
        step,
      });
      if (token && token !== '__back__') {
        gateway.telegram = { enabled: true, token };
        const userIds = await drawInputScreen({
          title: 'Telegram — Allowed User IDs (Optional)',
          hint: 'Comma-separated Telegram user IDs. Only these users can control the bot.\nLeave blank to allow everyone.\nFind your ID: message @userinfobot or @getmyid_bot.',
          label: 'User IDs:',
          masked: false,
          step,
        });
        if (userIds && userIds !== '__back__') {
          gateway.telegram!.allowedUsers = userIds
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
    }
    if (platform === 'whatsapp') {
      gateway.whatsapp = { enabled: true };
      drawInfo('WhatsApp will pair via QR code on first run');
      const phoneIds = await drawInputScreen({
        title: 'WhatsApp — Allowed Phone Numbers (Optional)',
        hint: 'Comma-separated phone numbers with country code (e.g. +6281234567890).\nOnly these numbers can control the bot. Leave blank to allow everyone.',
        label: 'Phone numbers:',
        masked: false,
        step,
      });
      if (phoneIds && phoneIds !== '__back__') {
        gateway.whatsapp.allowedUsers = phoneIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
  }

  return gateway;
}

async function stepFeatures(existing?: string[], step?: string): Promise<string[]> {
  const selected = await drawSelector({
    title: 'Extra Features',
    items: [
      { id: 'trading', label: 'Trading Agents', desc: 'Stock/crypto analysis' },
      { id: 'cybersec', label: 'Cybersecurity', desc: 'Red/blue/purple team' },
      { id: 'vps', label: 'VPS Management', desc: 'Server monitoring' },
      {
        id: 'research',
        label: 'Deep Research',
        desc: 'Multi-source + citations',
      },
      {
        id: 'office',
        label: 'Office Tools',
        desc: 'PDF, email, presentations',
      },
      { id: 'planning', label: 'Project Planning', desc: 'Sprint planning' },
      {
        id: 'frontend',
        label: 'Frontend Dev',
        desc: 'React, Next.js, Vue, Svelte',
      },
      { id: 'backend', label: 'Backend Dev', desc: 'Express, Fastify, Hono' },
      {
        id: 'deploy',
        label: 'Deployment',
        desc: 'Vercel, GitHub Pages, CI/CD',
      },
      {
        id: 'cloud',
        label: 'Cloud (GCloud/AWS)',
        desc: 'Deploy & manage cloud',
      },
      { id: 'github', label: 'GitHub', desc: 'PRs, issues, actions' },
      { id: 'creative', label: 'Creative', desc: 'GIF search, humanizer' },
    ],
    allowSkip: true,
    multi: true,
    step,
    extra: existing?.length
      ? [
          `Current features: ${existing.join(', ')}`,
          'Skip keeps current features.',
        ]
      : undefined,
  });

  if (!Array.isArray(selected) || selected.length === 0) return existing || [];
  return selected;
}

async function stepIntegrations(
  existing?: janexConfig['integrations'],
  step?: string,
): Promise<janexConfig['integrations']> {
  const selected = await drawSelector({
    title: 'Connect Accounts (Optional)',
    items: [
      {
        id: 'github',
        label: 'GitHub',
        desc: 'Use gh CLI for PRs, issues, repo inspection',
      },
      {
        id: 'gmail',
        label: 'Gmail / Email',
        desc: 'Use himalaya or msmtp for mail tools',
      },
    ],
    allowSkip: true,
    multi: true,
    step,
    extra: existing
      ? [
          `Current integrations: ${Object.keys(existing).join(', ') || 'none'}`,
          'Skip keeps current integrations.',
        ]
      : undefined,
  });

  if (!Array.isArray(selected) || selected.length === 0) {
    drawInfo(
      existing
        ? 'Keeping existing account integrations.\n'
        : 'No account integrations selected.\n',
    );
    return existing;
  }

  const integrations: janexConfig['integrations'] = existing
    ? { ...existing }
    : {};

  if (selected.includes('github')) {
    const method = await drawSelector({
      title: 'GitHub Auth',
      items: [
        {
          id: 'gh-cli',
          label: 'Use gh CLI',
          desc: 'Recommended: run gh auth login once',
        },
        {
          id: 'token',
          label: 'Store token',
          desc: 'Save a GitHub token in ~/.janex/config.yaml',
        },
      ],
      allowSkip: true,
      step,
    });

    if (method === 'token') {
      const token = await drawInputScreen({
        title: 'GitHub Token',
        hint: 'Paste a token with repo scope if you want janex to use GitHub tools directly',
        label: 'Token:',
        masked: true,
        step,
      });
      if (token && token !== '__back__')
        integrations.github = { enabled: true, auth: 'token', token };
    } else if (method === 'gh-cli') {
      integrations.github = { enabled: true, auth: 'gh-cli' };
      drawInfo(
        'GitHub will use gh CLI. Run gh auth login if not logged in yet.\n',
      );
    }
  }

  if (selected.includes('gmail')) {
    const address = await drawInputScreen({
      title: 'Gmail Address',
      hint: 'Optional. janex email tool uses himalaya or msmtp under the hood.',
      label: 'Email:',
      masked: false,
      step,
    });
    const appPassword = await drawInputScreen({
      title: 'Gmail App Password (Optional)',
      hint: 'Leave blank if you already configured himalaya/msmtp.',
      label: 'App Password:',
      masked: true,
      step,
    });
    integrations.gmail = {
      enabled: true,
      address: address && address !== '__back__' ? address : undefined,
      appPassword:
        appPassword && appPassword !== '__back__' ? appPassword : undefined,
    };
  }

  return integrations;
}

async function stepPlugins(
  existing?: janexConfig['plugins'],
  step?: string,
): Promise<janexConfig['plugins']> {
  const selected = await drawSelector({
    title: 'Plugins and Skills',
    items: [
      {
        id: 'local',
        label: 'Enable local plugins',
        desc: '~/.janex/plugins and in-repo skills',
      },
      {
        id: 'claude-store',
        label: 'Allow Claude-style store sources',
        desc: 'Register git/path sources for later sync',
      },
      {
        id: 'create',
        label: 'Create plugin scaffold later',
        desc: 'Use /plugin create <name>',
      },
    ],
    allowSkip: true,
    multi: true,
    step,
    extra: existing
      ? [
          'Current plugin settings detected.',
          'Skip keeps current plugin settings.',
        ]
      : undefined,
  });

  if (!Array.isArray(selected) || selected.length === 0) {
    return existing || { enabled: true, sources: [], allowClaudeStore: false };
  }

  const sources: string[] = existing?.sources ? [...existing.sources] : [];
  if (selected.includes('claude-store')) {
    const source = await drawInputScreen({
      title: 'Plugin Store Source (Optional)',
      hint: 'Enter a git URL/path now, or leave blank and use /plugin install later.',
      label: 'Source:',
      masked: false,
      step,
    });
    if (source && source !== '__back__') sources.push(source);
  }

  return {
    enabled:
      selected.includes('local') ||
      selected.includes('claude-store') ||
      selected.includes('create'),
    sources,
    allowClaudeStore: selected.includes('claude-store'),
  };
}

async function stepCaptcha(
  existingMode?: janexConfig['captchaAudio'],
  existingGroqApiKey?: string,
  step?: string,
): Promise<{
  mode: janexConfig['captchaAudio'];
  groqApiKey?: string;
  useGroqAudio?: boolean;
}> {
  const selected = await drawSelector({
    title: 'CAPTCHA Solving Method',
    items: [
      {
        id: 'hybrid',
        label: 'Hybrid (Recommended)',
        desc: 'Audio first for reCAPTCHA, image fallback for grids/sliders',
      },
      {
        id: 'image',
        label: 'Image Clicking',
        desc: 'AI vision analyzes grid tiles',
      },
      {
        id: 'audio',
        label: 'Audio Captcha',
        desc: 'Whisper STT transcribes audio challenge',
      },
    ],
    allowSkip: true,
    step,
    extra: existingMode
      ? [
          `Current CAPTCHA mode: ${existingMode}`,
          'Skip keeps current CAPTCHA settings.',
        ]
      : undefined,
  });

  if (!selected || selected === '__skip__' || selected === '__back__') {
    if (existingMode) {
      drawInfo('Keeping existing CAPTCHA settings.\n');
      return { mode: existingMode, groqApiKey: existingGroqApiKey };
    }
    drawInfo('Defaulting to hybrid captcha mode.\n');
    return { mode: 'hybrid' };
  }

  const mode = selected as janexConfig['captchaAudio'];

  // If audio or hybrid, ask for Groq API key or local whisper
  if (mode === 'audio' || mode === 'hybrid') {
    const audioMethod = await drawSelector({
      title: 'Audio Transcription Method',
      items: [
        {
          id: 'groq',
          label: 'Groq API (Recommended)',
          desc: 'Free 2000 req/day, fast & accurate',
        },
        {
          id: 'local',
          label: 'Local Whisper',
          desc: 'Use existing local whisper CLI, no API key needed',
        },
      ],
      allowSkip: true,
      step,
    });

    if (audioMethod === 'groq') {
      drawInfo(
        'Get your free API key at: https://console.groq.com/docs/speech-to-text',
      );
      const groqKey = await drawInputScreen({
        title: 'Groq API Key',
        hint: 'Paste your Groq API key (gsk_...). Get free at console.groq.com\nYou Can Change This At ~/.janex/config.yaml',
        label: 'API Key:',
        masked: true,
        step,
      });
      if (groqKey && groqKey !== '__back__') {
        return { mode, useGroqAudio: true, groqApiKey: groqKey };
      }
    }

    if (audioMethod === 'local') {
      drawInfo(
        'Local Whisper mode will use the existing `whisper` CLI only. It will not install packages automatically.',
      );
      return { mode, useGroqAudio: false, groqApiKey: existingGroqApiKey };
    }
  }

  return { mode, groqApiKey: existingGroqApiKey };
}

// ─── Search Engine Step ─────────────────────────────────────────────────────

async function stepSearchEngine(
  existingEngine?: janexConfig['searchEngine'],
  existingApiKey?: string,
  existingBaseUrl?: string,
  step?: string,
): Promise<{
  engine: janexConfig['searchEngine'];
  apiKey?: string;
  baseUrl?: string;
}> {
  const selected = await drawSelector({
    title: 'Web Search Engine',
    items: [
      {
        id: 'ddg',
        label: 'DuckDuckGo (Default)',
        desc: 'Free, no API key — instant answers + web results',
      },
      {
        id: 'searxng',
        label: 'SearXNG',
        desc: 'Free metasearch; use public fallback or your own instance',
      },
      {
        id: 'serper',
        label: 'Serper.dev (Google)',
        desc: 'Real Google results, 2500 free/month\nGet key: https://serper.dev',
      },
      {
        id: 'tavily',
        label: 'Tavily (AI-Optimized)',
        desc: 'Built for AI agents, clean results, 1000 free/month\nGet key: https://tavily.com',
      },
    ],
    allowSkip: true,
    step,
    extra: existingEngine
      ? [
          `Current search engine: ${existingEngine}`,
          'Skip keeps current search settings.',
        ]
      : undefined,
  });

  if (!selected || selected === '__skip__' || selected === '__back__') {
    if (existingEngine) {
      drawInfo('Keeping existing search settings.\n');
      return {
        engine: existingEngine,
        apiKey: existingApiKey,
        baseUrl: existingBaseUrl,
      };
    }
    drawInfo('Defaulting to DuckDuckGo (free, no API key).\n');
    return { engine: 'ddg' };
  }

  if (selected === 'ddg') {
    drawInfo('DuckDuckGo is free and needs no API key.\n');
    return { engine: 'ddg' };
  }

  if (selected === 'searxng') {
    const instance = await drawInputScreen({
      title: 'SearXNG Instance (Optional)',
      hint: 'Leave blank to use built-in public fallbacks.\nExample: https://search.example.com or http://localhost:8080',
      label: 'Base URL:',
      masked: false,
      step,
    });
    if (instance && instance !== '__back__') {
      return { engine: 'searxng', baseUrl: instance.replace(/\/+$/, '') };
    }
    return {
      engine: 'searxng',
      baseUrl: existingEngine === 'searxng' ? existingBaseUrl : undefined,
    };
  }

  const name = selected === 'serper' ? 'Serper.dev' : 'Tavily';
  const url =
    selected === 'serper' ? 'https://serper.dev' : 'https://tavily.com';
  drawInfo('Get your free API key at: ' + url);
  const apiKey = await drawInputScreen({
    title: name + ' API Key',
    hint:
      'Paste your ' +
      name +
      ' API key.\nGet it free at: ' +
      url +
      '\nLeave blank to use DDG instead.',
    label: 'API Key:',
    masked: true,
    step,
  });

  if (apiKey && apiKey !== '__back__') {
    return { engine: selected as janexConfig['searchEngine'], apiKey };
  }

  if (existingEngine === selected && existingApiKey) {
    drawInfo('No new key provided. Keeping existing search API key.\n');
    return {
      engine: existingEngine,
      apiKey: existingApiKey,
      baseUrl: existingBaseUrl,
    };
  }

  drawInfo('No key provided. Defaulting to DDG.\n');
  return { engine: 'ddg' };
}

function loadSetupState(): Record<string, any> {
  try {
    if (fs.existsSync(SETUP_STATE)) {
      return JSON.parse(fs.readFileSync(SETUP_STATE, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveSetupState(state: Record<string, any>): void {
  ensureConfigDir();
  fs.writeFileSync(SETUP_STATE, JSON.stringify(state, null, 2));
  drawInfo(
    `Setup paused at: ${state.step}. Run \`janex setup --continue\` to resume.`,
  );
}

function clearSetupState(): void {
  try {
    fs.unlinkSync(SETUP_STATE);
  } catch {}
}

async function loadConfigOrDefault(): Promise<janexConfig> {
  if (fs.existsSync(CONFIG_FILE)) {
    const yaml = (await import('js-yaml')).default;
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return yaml.load(raw) as janexConfig;
  }
  return {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o',
  };
}






