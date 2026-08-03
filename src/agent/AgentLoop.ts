// @ts-nocheck
import type { ToolRegistry } from '../tools/Registry.js';
import type { JanexConfig } from './config.js';

export interface AgentEvent {
  type: 'text' | 'tool_start' | 'tool_chunk' | 'tool_end' | 'error' | 'done' | 'route' | 'compact' | 'research';
  data?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolCallId?: string;
  durationMs?: number;
  status?: 'running' | 'success' | 'error' | 'timeout' | 'cancelled';
  errorType?: string;
  turnId?: string;
}

export class AgentLoop {
  private messages: Array<{ role: string; content: string; tool_calls?: any[]; tool_call_id?: string }>;
  private sessionId: string;
  private running = false;

  constructor(public config: any, public registry: ToolRegistry) {
    this.messages = [];
    this.sessionId = `session_${Date.now()}`;
  }

  setSessionKey() {}
  setMaxIterations() {}
  interrupt() { this.running = false; }
  getLedger() { return []; }
  injectContext() {}
  setProvider() {}
  setResearchMode() {}
  getModel() { return this.config?.model || ''; }
  getProviderName() { return this.config?.provider || ''; }
  getMessages() { return this.messages; }
  getSessionId() { return this.sessionId; }
  searchSessions() { return []; }
  saveSession() {}
  listDurableSessions() { return []; }
  listSessions() { return []; }
  findLatestSession() { return null; }
  async loadSessionAsync() { return null; }
  compactMessages() { return this.messages; }
  listAgentJobs() { return []; }
  getToolUsageStats() { return {}; }
  getContextStats() { return {}; }
  getTokenStats() { return {}; }
  detectWorkflowPatterns() { return []; }
  listObserverEvents() { return []; }
  clearHistory() { this.messages = []; }

  async *run(message: string): AsyncGenerator<AgentEvent, void, unknown> {
    this.running = true;
    this.messages.push({ role: 'user', content: message });

    try {
      const system = this.buildSystemPrompt();
      const tools = this.registry.list().map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));

      const provider = this.getProvider();
      const response = await provider.chat({
        system,
        messages: this.messages.map((m) => ({ role: m.role, content: m.content })),
        tools: tools.length > 0 ? tools : undefined,
      });

      if (response.toolCalls && response.toolCalls.length > 0) {
        this.messages.push({
          role: 'assistant',
          content: response.content || '',
          tool_calls: response.toolCalls,
        });
        for (const call of response.toolCalls) {
          const name = call.function?.name || call.name;
          const callId = call.id;
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(call.function?.arguments || '{}'); } catch {}
          const toolStart = Date.now();
          yield { type: 'tool_start', toolName: name, toolArgs: args, toolCallId: callId };
          let toolResult = '';
          try {
            toolResult = await this.registry.execute(name, args);
          } catch (e: any) {
            toolResult = `Error: ${e?.message || e}`;
          }
          const durationMs = Date.now() - toolStart;
          yield {
            type: 'tool_end',
            data: String(toolResult).slice(0, 4000),
            toolName: name,
            toolArgs: args,
            toolCallId: callId,
            durationMs,
            status: toolResult.startsWith('Error') ? 'error' : 'success',
            errorType: toolResult.startsWith('Error') ? 'execution' : undefined,
          };
          this.messages.push({
            role: 'tool',
            content: String(toolResult),
            tool_call_id: callId,
          });
        }
      }

      if (response.content) {
        const text = response.content;
        this.messages.push({ role: 'assistant', content: text });
        yield { type: 'text', data: text };
        yield { type: 'done', data: text };
      } else if (!response.toolCalls?.length) {
        yield { type: 'done', data: '' };
      }
    } catch (e: any) {
      yield { type: 'error', data: e?.message || String(e) };
    } finally {
      this.running = false;
    }
  }

  async sendMessage(message: string): Promise<string> { return ''; }

  private async getProvider() {
    const { getProvider } = await import('../providers/index.js');
    return getProvider(this.config);
  }

  private buildSystemPrompt(): string {
    const base = 'You are Janex, an autonomous multi-agent AI workspace running in a terminal. '
      + 'You can execute real tasks using the available tools. Prefer the tool with the correct action, '
      + 'and return concise, factual results.';
    const modelNote = this.config.model ? `\n\nModel: ${this.config.model}` : '';
    return base + modelNote;
  }
}