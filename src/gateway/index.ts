// @ts-nocheck
import { JanexConfig } from '../agent/config.js';
import { JanexAgent } from '../agent/agent.js';
import { AgentContext } from '../agent/context.js';
import { toolRegistry } from '../tools/index.js';
import { skillRegistry } from '../skills/registry.js';
import { AgentMemory } from '../agent/memory.js';

export interface GatewayOptions {
  discord?: { enabled: boolean; token: string };
  telegram?: { enabled: boolean; token: string };
  whatsapp?: { enabled: boolean; session?: string };
}

export class JanexGateway {
  private config: JanexConfig;
  private options: GatewayOptions;

  constructor(options: GatewayOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    this.config = await loadConfig();
    console.log('Starting Janex Gateway...');

    if (this.options.discord?.enabled) {
      await this.startDiscord();
    }
    if (this.options.telegram?.enabled) {
      await this.startTelegram();
    }
    if (this.options.whatsapp?.enabled) {
      await this.startWhatsApp();
    }

    console.log('Gateway running. Press Ctrl+C to stop.');
  }

  private async startDiscord(): Promise<void> {
    try {
      const { startDiscordGateway } = await import('./discord.js');
      await startDiscordGateway(this.config, this.options.discord);
    } catch (error: any) {
      console.error(`Discord gateway error: ${error.message}`);
    }
  }

  private async startTelegram(): Promise<void> {
    try {
      const { startTelegramGateway } = await import('./telegram.js');
      await startTelegramGateway(this.config, this.options.telegram);
    } catch (error: any) {
      console.error(`Telegram gateway error: ${error.message}`);
    }
  }

  private async startWhatsApp(): Promise<void> {
    try {
      const { startWhatsAppGateway } = await import('./whatsapp.js');
      await startWhatsAppGateway(this.config);
    } catch (error: any) {
      console.error(`WhatsApp gateway error: ${error.message}`);
    }
  }

  async createSession(userId: string): Promise<{ context: AgentContext; agent: JanexAgent }> {
    const context = new AgentContext();
    const memory = new AgentMemory();
    try {
      toolRegistry.registerAll(this.config);
      await skillRegistry.loadAll();
    } catch (error: any) {
      console.error(`Session init error for ${userId}: ${error.message}`);
    }

    const agent = new JanexAgent({
      config: this.config,
      context,
      toolRegistry,
      skillRegistry,
      memory
    });

    return { context, agent };
  }
}

async function loadConfig(): Promise<JanexConfig> {
  const { loadConfig } = await import('../../agent/config.js');
  return loadConfig();
}
