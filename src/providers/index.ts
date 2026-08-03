// @ts-nocheck
import { JanexConfig } from '../agent/config.js';

export interface ChatOptions {
  system: string;
  messages: any[];
  tools?: any[];
}

export interface ProviderResult {
  content?: string;
  toolCalls?: any[];
}

export interface ChatProvider {
  chat(options: ChatOptions): Promise<ProviderResult>;
}

export function getProvider(config: JanexConfig): ChatProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
    case 'custom-anthropic':
      return new AnthropicProvider(config);
    case 'custom':
    default:
      return new OpenAIProvider(config);
  }
}

class OpenAIProvider implements ChatProvider {
  constructor(private config: JanexConfig) {}

  async chat({ system, messages, tools }: ChatOptions): Promise<ProviderResult> {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      baseURL: this.config.baseUrl,
      apiKey: this.config.apiKey || 'sk-placeholder'
    });

    const response = await client.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: 'system', content: system },
        ...messages
      ],
      tools: tools || undefined
    });

    const choice = response.choices[0];
    const message = choice.message;

    return {
      content: message.content || undefined,
      toolCalls: message.tool_calls || undefined
    };
  }
}

class AnthropicProvider implements ChatProvider {
  constructor(private config: JanexConfig) {}

  async chat({ system, messages, tools }: ChatOptions): Promise<ProviderResult> {
    let AnthropicSDK: any;
    try {
      AnthropicSDK = (await import('@anthropic-ai/sdk')).default;
    } catch {
      AnthropicSDK = (await import('@ai-sdk/anthropic')).default;
    }

    const client = new AnthropicSDK({
      baseURL: this.config.baseUrl,
      apiKey: this.config.apiKey || 'sk-placeholder'
    });

    const anthropicMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    }));

    const response = await client.messages.create({
      model: this.config.model,
      max_tokens: 8192,
      system,
      messages: anthropicMessages,
      ...(tools && tools.length > 0 ? { tools: tools as any } : {})
    });

    const textBlock = response.content.find((b: any) => b.type === 'text');
    if (textBlock) {
      return { content: textBlock.text };
    }

    return {};
  }
}

export interface Provider {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, any>;
}
export function createProvider(config: any): any { return {}; }
