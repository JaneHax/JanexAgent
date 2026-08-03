// @ts-nocheck
import os from 'os';
import type { JanexConfig } from './Config.js';
import type { Tool } from '../tools/Registry.js';
import { loadAgentsMD, type AgentsMD } from './AgentsMD.js';
import { MemoryEngine } from './MemoryEngine.js';
import { loadSoul } from './Soul.js';
import { STRUCTURED_OUTPUT_PROMPT } from '../utils/StructuredOutputFormat.js';

export class AgentContext {
  private sessionId: string;
  private messages: Array<{ role: string; content: string; timestamp: number }>;
  private maxMessages: number;
  private createdAt: number;

  constructor(sessionId?: string, maxMessages = Infinity) {
    this.sessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.messages = [];
    this.maxMessages = maxMessages;
    this.createdAt = Date.now();
  }

  getSessionId(): string {
    return this.sessionId;
  }

  addMessage(message: { role: string; content: string }): void {
    this.messages.push({
      ...message,
      timestamp: Date.now()
    });
    while (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  getMessages(): Array<{ role: string; content: string; timestamp: number }> {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
  }

  reset(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.messages = [];
    this.createdAt = Date.now();
  }

  getTokenCount(): number {
    return this.messages.reduce((sum, m) => sum + m.content.length / 4, 0);
  }
}
