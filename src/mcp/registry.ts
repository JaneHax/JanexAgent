// @ts-nocheck
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'yaml';
import { MCPClient, MCPServer } from './client.js';
import { JanexConfig } from '../agent/config.js';

const CONFIG_DIR = path.join(os.homedir(), '.janex');
const SERVERS_FILE = path.join(CONFIG_DIR, 'mcp-servers.yaml');

const PRESETS: Record<string, MCPServer[]> = {
  'filesystem': [
    { name: 'filesystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', os.homedir()], enabled: true }
  ],
  'github': [
    { name: 'github', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'], env: { GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || '' }, enabled: true }
  ],
  'brave-search': [
    { name: 'brave-search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], env: { BRAVE_API_KEY: process.env.SEARCH_API_KEY || '' }, enabled: true }
  ],
  'sqlite': [
    { name: 'sqlite', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', path.join(CONFIG_DIR, 'janex.db')], enabled: true }
  ]
};

export class MCPRegistry {
  private client: MCPClient | null = null;
  private servers: MCPServer[] = [];
  private config: JanexConfig | null = null;

  async init(config: JanexConfig): Promise<void> {
    this.config = config;
    this.client = new MCPClient(config);
    await this.loadServers();
  }

  async loadServers(): Promise<void> {
    if (await fs.pathExists(SERVERS_FILE)) {
      const content = await fs.readFile(SERVERS_FILE, 'utf-8');
      this.servers = yaml.parse(content) || [];
    } else {
      this.servers = [];
    }
  }

  async saveServers(): Promise<void> {
    await fs.ensureDir(CONFIG_DIR);
    await fs.writeFile(SERVERS_FILE, yaml.stringify(this.servers), 'utf-8');
  }

  async connectAll(): Promise<void> {
    if (!this.client) return;
    for (const server of this.servers) {
      if (server.enabled) {
        await this.client.connect(server);
      }
    }
  }

  async disconnectAll(): Promise<void> {
    if (!this.client) return;
    for (const server of this.servers) {
      await this.client.disconnect(server.name);
    }
  }

  async addServer(server: MCPServer): Promise<void> {
    this.servers.push(server);
    await this.saveServers();
    if (this.client && server.enabled) {
      await this.client.connect(server);
    }
  }

  async removeServer(name: string): Promise<void> {
    this.servers = this.servers.filter(s => s.name !== name);
    await this.saveServers();
    if (this.client) {
      await this.client.disconnect(name);
    }
  }

  getServers(): MCPServer[] {
    return [...this.servers];
  }

  getPreset(name: string): MCPServer[] | undefined {
    return PRESETS[name];
  }

  listPresets(): string[] {
    return Object.keys(PRESETS);
  }

  getConnectedServers(): string[] {
    return this.client?.getConnectedServers() || [];
  }

  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    if (!this.client) throw new Error('MCP not initialized');
    return this.client.callTool(serverName, toolName, args);
  }
}

export const mcpRegistry = new MCPRegistry();
