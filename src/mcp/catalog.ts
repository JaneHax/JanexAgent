import axios from 'axios';

export interface MCPServerCatalog {
  name: string;
  description: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  category: string;
}

export class MCPCatalog {
  private servers: MCPServerCatalog[] = [];

  constructor() {
    this.servers = [
      {
        name: 'filesystem',
        description: 'Local filesystem access',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed'],
        category: 'local'
      },
      {
        name: 'github',
        description: 'GitHub API integration',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}' },
        category: 'integration'
      },
      {
        name: 'brave-search',
        description: 'Brave web search',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-brave-search'],
        env: { BRAVE_API_KEY: '${SEARCH_API_KEY}' },
        category: 'web'
      },
      {
        name: 'sqlite',
        description: 'SQLite database',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', '~/.janex/janex.db'],
        category: 'data'
      },
      {
        name: 'puppeteer',
        description: 'Browser automation',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-puppeteer'],
        category: 'browser'
      },
      {
        name: 'fetch',
        description: 'Web fetch and scraping',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-fetch'],
        category: 'web'
      }
    ];
  }

  search(query: string): MCPServerCatalog[] {
    const lower = query.toLowerCase();
    return this.servers.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower) ||
      s.category.toLowerCase().includes(lower)
    );
  }

  getByCategory(category: string): MCPServerCatalog[] {
    return this.servers.filter(s => s.category === category);
  }

  listAll(): MCPServerCatalog[] {
    return [...this.servers];
  }

  get(name: string): MCPServerCatalog | undefined {
    return this.servers.find(s => s.name === name);
  }
}

export const mcpCatalog = new MCPCatalog();
