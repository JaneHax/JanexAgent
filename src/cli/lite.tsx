// @ts-nocheck
import { JanexAgent } from '../agent/agent.js';
import { AgentContext } from '../agent/context.js';
import { JanexConfig } from '../agent/Config.js';
import { toolRegistry } from '../tools/index.js';
import { skillRegistry } from '../skills/registry.js';
import { AgentMemory } from '../agent/memory.js';

export class JanexLite {
  private agent: JanexAgent | null = null;

  async start(): Promise<void> {
    const config = await loadConfig();
    const context = new AgentContext();
    const memory = new AgentMemory();

    toolRegistry.registerAll(config);
    await skillRegistry.loadAll();

    this.agent = new JanexAgent({ config, context, toolRegistry, skillRegistry, memory });

    console.log('Janex Lite Mode — type /exit to quit\n');

    const readline = (await import('readline')).createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    const prompt = () => {
      if (!this.agent) return;
      readline.question('> ', async (input) => {
        const trimmed = input.trim();
        if (!trimmed) {
          prompt();
          return;
        }

        if (trimmed === '/exit' || trimmed === '/quit') {
          readline.close();
          return;
        }

        if (trimmed === '/clear') {
          context.clear();
          console.log('Cleared.');
          prompt();
          return;
        }

        if (trimmed === '/reset') {
          context.reset();
          console.log('Reset.');
          prompt();
          return;
        }

        if (trimmed === '/status') {
          const tools = toolRegistry.list();
          const skills = skillRegistry.list();
          console.log(`Model: ${config.model} | Tools: ${tools.length} | Skills: ${skills.length}`);
          prompt();
          return;
        }

        console.log('Thinking...');
        try {
          const response = await this.agent!.processMessage(trimmed);
          console.log(response);
        } catch (error: any) {
          console.error(`Error: ${error.message}`);
        }

        prompt();
      });
    };

    prompt();
  }

  stop(): void {
    this.agent?.stop();
  }
}

async function loadConfig(): Promise<JanexConfig> {
  const { loadConfig } = await import('../../agent/config.js');
  return loadConfig();
}

