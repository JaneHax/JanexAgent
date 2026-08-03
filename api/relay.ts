import http from 'http';
import { JanexConfig } from '../agent/Config.js';
import { JanexAgent } from '../agent/agent.js';
import { AgentContext } from '../agent/context.js';
import { toolRegistry } from '../src/tools/index.js';
import { skillRegistry } from '../src/skills/registry.js';
import { AgentMemory } from '../agent/memory.js';

export async function startApi(port = 3001): Promise<void> {
  const config = await loadConfig();
  toolRegistry.registerAll(config);
  await skillRegistry.loadAll();

  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', service: 'janex-api', port }));
      return;
    }

    if (req.method === 'POST' && req.url === '/research') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { query } = JSON.parse(body);
          const context = new AgentContext();
          const memory = new AgentMemory();
          const agent = new JanexAgent({ config, context, toolRegistry, skillRegistry, memory });
          const result = await agent.processMessage(`Research: ${query}`);
          res.writeHead(200);
          res.end(JSON.stringify({ result }));
        } catch (error: any) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(port, () => {
    console.log(`Janex API running on http://localhost:${port}`);
  });
}

async function loadConfig(): Promise<JanexConfig> {
  const { loadConfig } = await import('./agent/config.js');
  return loadConfig();
}


