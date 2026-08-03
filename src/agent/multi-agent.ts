// @ts-nocheck
import { AgentContext } from './context.js';
import { ToolRegistry } from '../tools/index.js';
import { SkillRegistry } from '../skills/registry.js';
import { JanexConfig } from './config.js';

export class MultiAgentRouter {
  private config: JanexConfig;
  private agents: Map<string, any> = new Map();

  constructor(config: JanexConfig) {
    this.config = config;
    this.registerAgents();
  }

  private registerAgents(): void {
    this.agents.set('researcher', {
      name: 'Researcher',
      description: 'Deep research, web search, social intelligence',
      skills: ['deep-research', 'social-research', 'web-search']
    });

    this.agents.set('coder', {
      name: 'Coder',
      description: 'Code generation, debugging, repo editing',
      skills: ['engineering', 'testing', 'git']
    });

    this.agents.set('security', {
      name: 'Security',
      description: 'CTF, bug hunt, OSINT, authorized testing',
      skills: ['bug-hunt', 'osint', 'forensics']
    });

    this.agents.set('analyst', {
      name: 'Analyst',
      description: 'Trading, finance, data analysis',
      skills: ['trading', 'finance', 'crypto']
    });

    this.agents.set('browser', {
      name: 'Browser',
      description: 'Browser automation, CAPTCHA solving',
      skills: ['browser', 'captcha-resolver']
    });
  }

  async shouldRoute(message: string): Promise<boolean> {
    const mode = this.config.researchMode;
    if (mode === 'low' || mode === 'medium') return false;

    const keywords = [
      'research', 'analyze', 'audit', 'review', 'compare',
      'council', 'debate', 'ctf', 'bug hunt', 'exploit',
      'captcha', 'browser', 'trade', 'crypto', 'deploy'
    ];

    const lower = message.toLowerCase();
    return keywords.some(k => lower.includes(k)) || mode === 'xhigh' || mode === 'max' || mode === 'ultra';
  }

  async route(
    message: string,
    options: {
      context: AgentContext;
      toolRegistry: ToolRegistry;
      skillRegistry: SkillRegistry;
      config: JanexConfig;
    }
  ): Promise<string> {
    const agentName = this.selectAgent(message);
    const agent = this.agents.get(agentName);

    if (!agent) {
      return `Agent "${agentName}" not found. Falling back to default.`;
    }

    const skills = agent.skills.map(s => options.skillRegistry.get(s)).filter(Boolean);

    if (skills.length > 0) {
      options.context.addMessage({
        role: 'system',
        content: `[Agent: ${agent.name}] ${agent.description}\nLoaded skills: ${skills.map(s => s.name).join(', ')}`
      });
    }

    const { JanexAgent } = await import('./agent.js');
    const agentInstance = new JanexAgent({
      config: options.config,
      context: options.context,
      toolRegistry: options.toolRegistry,
      skillRegistry: options.skillRegistry,
      memory: options.context['memory'] || new (await import('./memory.js')).AgentMemory()
    });

    return agentInstance.processMessage(message);
  }

  private selectAgent(message: string): string {
    const lower = message.toLowerCase();

    if (/captcha|browser|web|scrape|crawl/.test(lower)) return 'browser';
    if (/ctf|bug.?hunt|exploit|pwn|forensic|malware/.test(lower)) return 'security';
    if (/trade|crypto|defi|stock|market|portfolio/.test(lower)) return 'analyst';
    if (/research|analyze|report|deep.?research|social/.test(lower)) return 'researcher';
    if (/code|debug|fix|implement|build|test|deploy/.test(lower)) return 'coder';

    return 'researcher';
  }

  listAgents(): string[] {
    return Array.from(this.agents.keys());
  }
}
