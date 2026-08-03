// @ts-nocheck
import { AgentContext } from './Context.js';
import { JanexConfig } from './Config.js';
import { ToolRegistry } from '../tools/index.js';
import { SkillRegistry } from '../skills/registry.js';
import { AgentMemory } from './memory.js';
import { MultiAgentRouter } from './MultiAgent.js';
import { logger } from '../utils/logger.js';
import { withRetry, classifyError, shouldRetry } from '../utils/retry.js';
import { onTaskStart, onTaskComplete, onTaskError } from './hooks/on-task.js';
import { pluginManager } from '../plugins/index.js';
import { projectRules } from '../rules/project.js';

export interface AgentOptions {
  config: JanexConfig;
  context: AgentContext;
  toolRegistry: ToolRegistry;
  skillRegistry: SkillRegistry;
  memory: AgentMemory;
}

export class JanexAgent {
  private config: JanexConfig;
  private context: AgentContext;
  private toolRegistry: ToolRegistry;
  private skillRegistry: SkillRegistry;
  private memory: AgentMemory;
  private router: MultiAgentRouter;
  private running = false;

  constructor(options: AgentOptions) {
    this.config = options.config;
    this.context = options.context;
    this.toolRegistry = options.toolRegistry;
    this.skillRegistry = options.skillRegistry;
    this.memory = options.memory;
    this.router = new MultiAgentRouter(options.config);
  }

  async processMessage(userMessage: string): Promise<string> {
    this.context.addMessage({ role: 'user', content: userMessage });
    logger.info('Processing message', { messageLength: userMessage.length });

    const taskId = `task_${Date.now()}`;
    await onTaskStart({ id: taskId, message: userMessage });

    const shouldMultiAgent = await this.router.shouldRoute(userMessage);
    let response: string;

    try {
      if (shouldMultiAgent) {
        response = await withRetry(
          () => this.router.route(userMessage, {
            context: this.context,
            toolRegistry: this.toolRegistry,
            skillRegistry: this.skillRegistry,
            config: this.config
          }),
          { maxRetries: 2, delayMs: 500 }
        );
      } else {
        response = await withRetry(
          () => this.runSingleAgent(userMessage),
          { maxRetries: 2, delayMs: 500 }
        );
      }

      response = await pluginManager.onMessage(response);

      this.context.addMessage({ role: 'assistant', content: response });
      await this.memory.saveSession(this.context.getSession() as any);

      await onTaskComplete({ id: taskId }, { response });
      return response;
    } catch (error: any) {
      logger.error('Process message failed', { error: error.message });
      await onTaskError({ id: taskId }, error);
      return `Error: ${error.message}`;
    }
  }

  private async runSingleAgent(userMessage: string): Promise<string> {
    const messages = this.buildMessages();
    const tools = this.toolRegistry.getToolDefinitions();
    const systemPrompt = this.context.getSystemPrompt();

    try {
      const completion = await withRetry(
        () => this.callProvider(systemPrompt, messages, tools),
        {
          maxRetries: 3,
          delayMs: 1000,
          retryOn: (error) => shouldRetry(classifyError(error))
        }
      );

      if (completion.toolCalls && completion.toolCalls.length > 0) {
        const toolResults = await this.executeToolCalls(completion.toolCalls);
        this.context.addMessage({
          role: 'assistant',
          content: completion.content || '',
          toolCalls: completion.toolCalls
        });

        for (const result of toolResults) {
          this.context.addMessage({
            role: 'tool',
            content: result,
            toolCallId: result.id
          });
        }

        const followUp = await withRetry(
          () => this.callProvider(systemPrompt, this.buildMessages(), tools),
          {
            maxRetries: 2,
            delayMs: 500,
            retryOn: (error) => shouldRetry(classifyError(error))
          }
        );

        this.context.addMessage({ role: 'assistant', content: followUp.content || '' });
        return followUp.content || 'Done.';
      }

      return completion.content || 'No response.';
    } catch (error: any) {
      logger.error('Agent error', { error: error.message, userMessage });
      return `Error: ${error.message}`;
    }
  }

  private buildMessages() {
    const msgs = this.context.getMessages();
    return msgs.map(m => ({
      role: m.role,
      content: m.content,
      ...(m.toolCalls ? { tool_calls: m.toolCalls } : {}),
      ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {})
    }));
  }

  private async callProvider(
    system: string,
    messages: any[],
    tools: any[]
  ): Promise<{ content?: string; toolCalls?: any[] }> {
    const { getProvider } = await import('../providers/index.js');
    const provider = getProvider(this.config);

    const response = await provider.chat({
      system,
      messages,
      tools: tools.length > 0 ? tools : undefined
    });

    return response;
  }

  private async executeToolCalls(toolCalls: any[]): Promise<any[]> {
    const results: any[] = [];

    for (const call of toolCalls) {
      const toolName = call.function?.name || call.name;
      const args = call.function?.arguments ? JSON.parse(call.function.arguments) : (call.arguments || {});

      try {
        const ruleCheck = projectRules.evaluate(toolName, args);
        if (!ruleCheck.allowed) {
          results.push({ id: call.id, content: `Blocked by rule: ${ruleCheck.reason}` });
          continue;
        }

        let processedArgs = await pluginManager.onToolUse(toolName, args);
        const result = await this.toolRegistry.execute(toolName, processedArgs);
        const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        results.push({ id: call.id, content });
      } catch (error: any) {
        results.push({ id: call.id, content: `Error: ${error.message}` });
      }
    }

    return results;
  }

  async runLoop(inputStream: NodeJS.ReadableStream, outputStream: NodeJS.WritableStream): Promise<void> {
    this.running = true;
    outputStream.write('\x1b[32mJanex ready.\x1b[0m Type /help for commands.\n\n');

    const readline = (await import('readline')).createInterface({
      input: inputStream,
      output: outputStream,
      terminal: true
    });

    const prompt = () => {
      if (!this.running) return;
      readline.question('\x1b[36m>\x1b[0m ', async (input) => {
        if (!input.trim()) {
          prompt();
          return;
        }

        if (input === '/exit' || input === '/quit') {
          readline.close();
          this.running = false;
          return;
        }

        if (input === '/clear') {
          this.context.clear();
          outputStream.write('Context cleared.\n');
          prompt();
          return;
        }

        if (input === '/reset') {
          this.context.reset();
          outputStream.write('Session reset.\n');
          prompt();
          return;
        }

        if (input === '/status') {
          await this.showStatus(outputStream);
          prompt();
          return;
        }

        if (input === '/tools') {
          const tools = this.toolRegistry.list();
          outputStream.write(`Tools: ${tools.join(', ')}\n`);
          prompt();
          return;
        }

        if (input === '/skills') {
          const skills = this.skillRegistry.list();
          outputStream.write(`Skills: ${skills.join(', ')}\n`);
          prompt();
          return;
        }

        outputStream.write('\x1b[33mThinking...\x1b[0m\n');

        try {
          const response = await this.processMessage(input);
          outputStream.write(`${response}\n\n`);
        } catch (error: any) {
          outputStream.write(`\x1b[31mError: ${error.message}\x1b[0m\n\n`);
        }

        prompt();
      });
    };

    prompt();
  }

  private async showStatus(stream: NodeJS.WritableStream): Promise<void> {
    stream.write(`Model: ${this.config.model}\n`);
    stream.write(`Provider: ${this.config.provider}\n`);
    stream.write(`Research: ${this.config.researchMode}\n`);
    stream.write(`Session: ${this.context.getSessionId()}\n`);
    stream.write(`Messages: ${this.context.getMessages().length}\n`);
  }

  stop(): void {
    this.running = false;
  }
}


