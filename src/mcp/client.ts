// @ts-nocheck
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { JanexConfig } from '../agent/Config.js';

export interface MCPServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  enabled: boolean;
}

export class MCPClient {
  private clients: Map<string, Client> = new Map();
  private config: JanexConfig;

  constructor(config: JanexConfig) {
    this.config = config;
  }

  async connect(server: MCPServer): Promise<void> {
    if (!server.enabled) return;

    try {
      const transport = new StdioClientTransport({
        command: server.command,
        args: server.args || [],
        env: { ...process.env, ...server.env }
      });

      const client = new Client({ name: 'janex', version: '1.0.0' }, { capabilities: {} });
      await client.connect(transport);
      this.clients.set(server.name, client);
      console.log(`MCP connected: ${server.name}`);
    } catch (error: any) {
      console.error(`MCP connect error ${server.name}: ${error.message}`);
    }
  }

  async disconnect(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.close();
      this.clients.delete(name);
    }
  }

  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`MCP server ${serverName} not connected`);

    return await client.callTool({ name: toolName, arguments: args });
  }

  async listTools(serverName: string): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`MCP server ${serverName} not connected`);

    return await client.listTools();
  }

  async listResources(serverName: string): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`MCP server ${serverName} not connected`);

    return await client.listResources();
  }

  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }
}

