// @ts-nocheck
import { MCPRegistry } from './registry.js';
import { toolRegistry } from '../tools/index.js';

export class MCPToolAdapter {
  private mcpRegistry: MCPRegistry;

  constructor(mcpRegistry: MCPRegistry) {
    this.mcpRegistry = mcpRegistry;
  }

  async registerMCPTools(): Promise<void> {
    const servers = this.mcpRegistry.getServers();

    for (const server of servers) {
      if (!server.enabled) continue;

      try {
        const tools = await this.mcpRegistry.listTools(server.name);
        if (tools && tools.tools) {
          for (const tool of tools.tools) {
            toolRegistry.register(
              `mcp_${server.name}_${tool.name}`,
              async (args: any) => {
                return this.mcpRegistry.callTool(server.name, tool.name, args);
              },
              `[MCP:${server.name}] ${tool.description || tool.name}`,
              tool.inputSchema || { type: 'object', properties: {} }
            );
          }
        }
      } catch (error: any) {
        console.warn(`Failed to load tools from ${server.name}: ${error.message}`);
      }
    }
  }

  async loadFromCatalog(catalogEntry: any): Promise<void> {
    const server = {
      name: catalogEntry.name,
      command: catalogEntry.command,
      args: catalogEntry.args,
      env: catalogEntry.env,
      enabled: true
    };

    await this.mcpRegistry.addServer(server);
    await this.registerMCPTools();
  }

  getMCPToolNames(): string[] {
    return toolRegistry.list().filter(name => name.startsWith('mcp_'));
  }
}

let mcpToolAdapterInstance: MCPToolAdapter | null = null;

export function getMCPToolAdapter(registry?: MCPRegistry): MCPToolAdapter {
  if (!mcpToolAdapterInstance) {
    if (registry) {
      mcpToolAdapterInstance = new MCPToolAdapter(registry);
    } else {
      throw new Error('MCPToolAdapter not initialized. Call getMCPToolAdapter(registry) first.');
    }
  }
  return mcpToolAdapterInstance;
}

export function setMCPToolAdapter(registry: MCPRegistry): MCPToolAdapter {
  mcpToolAdapterInstance = new MCPToolAdapter(registry);
  return mcpToolAdapterInstance;
}

