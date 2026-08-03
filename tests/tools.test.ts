import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../src/tools/index.ts';
import { JanexConfig } from '../src/agent/config.ts';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  let config: JanexConfig;

  beforeEach(async () => {
    registry = new ToolRegistry();
    config = {
      provider: 'custom',
      apiStyle: 'auto',
      baseUrl: 'http://localhost:11434/v1',
      apiKey: 'test-key',
      model: 'llama3.2',
      researchMode: 'low',
      themeName: 'Janex',
      captchaAudio: 'hybrid'
    };
    registry.registerAll(config);
  });

  it('should register tools', () => {
    const tools = registry.list();
    expect(tools.length).toBeGreaterThan(0);
    expect(tools).toContain('web_search');
    expect(tools).toContain('terminal_execute');
    expect(tools).toContain('file_read');
    expect(tools).toContain('har_capture');
  });

  it('should execute registered tool', async () => {
    const result = await registry.execute('web_search', { query: 'test', maxResults: 1 });
    expect(result).toBeDefined();
  });

  it('should throw for unknown tool', async () => {
    await expect(registry.execute('nonexistent_tool', {})).rejects.toThrow('Unknown tool: nonexistent_tool');
  });

  it('should get tool definitions', () => {
    const defs = registry.getToolDefinitions();
    expect(defs.length).toBeGreaterThan(0);
    expect(defs[0].name).toBeDefined();
    expect(defs[0].description).toBeDefined();
  });
});
