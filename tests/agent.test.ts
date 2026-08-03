import { describe, it, expect, beforeEach } from 'vitest';
import { AgentContext } from '../src/agent/AgentContext.js';

describe('AgentContext', () => {
  let context: AgentContext;

  beforeEach(() => {
    context = new AgentContext();
  });

  it('should generate unique session IDs', () => {
    const ctx2 = new AgentContext();
    expect(context.getSessionId()).not.toBe(ctx2.getSessionId());
  });

  it('should add messages with timestamps', () => {
    context.addMessage({ role: 'user', content: 'hello' });
    const messages = context.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('hello');
    expect(messages[0].role).toBe('user');
    expect(messages[0].timestamp).toBeGreaterThan(0);
  });

  it('should clear messages', () => {
    context.addMessage({ role: 'user', content: 'hello' });
    context.addMessage({ role: 'assistant', content: 'world' });
    expect(context.getMessages()).toHaveLength(2);
    context.clear();
    expect(context.getMessages()).toHaveLength(0);
  });

  it('should reset session', () => {
    context.addMessage({ role: 'user', content: 'hello' });
    const oldId = context.getSessionId();
    context.reset();
    expect(context.getSessionId()).not.toBe(oldId);
    expect(context.getMessages()).toHaveLength(0);
  });

  it('should respect max messages limit', () => {
    const ctx = new AgentContext('test', 3);
    for (let i = 0; i < 5; i++) {
      ctx.addMessage({ role: 'user', content: `msg ${i}` });
    }
    expect(ctx.getMessages()).toHaveLength(3);
    expect(ctx.getMessages()[0].content).toBe('msg 2');
  });

  it('should estimate tokens', () => {
    context.addMessage({ role: 'user', content: 'Hello world this is a test' });
    const tokens = context.getTokenCount();
    expect(tokens).toBeGreaterThan(0);
  });
});

