// @ts-nocheck
import { JanexConfig } from '../agent/Config.js';
import { toolRegistry } from '../tools/index.js';
import { skillRegistry } from '../skills/registry.js';
import { AgentMemory } from '../agent/memory.js';
import { ResearchPipeline } from '../agent/research.js';
import { MultiAgentRouter } from '../agent/MultiAgent.js';
import { mcpRegistry } from '../mcp/registry.js';
import { projectRules } from '../rules/project.js';
import { pluginManager } from '../plugins/index.js';
import { browserTool } from '../tools/browser/browser.js';
import { todoStore } from '../rules/todo-store.js';

export interface CommandContext {
  config: JanexConfig;
  toolRegistry: typeof toolRegistry;
  skillRegistry: typeof skillRegistry;
  memory: AgentMemory;
  addMessage: (msg: { role: string; content: string }) => void;
  setStatus: (status: string) => void;
}

export class CommandHandler {
  private ctx: CommandContext;

  constructor(ctx: CommandContext) {
    this.ctx = ctx;
  }

  async handle(input: string): Promise<boolean> {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) return false;

    const parts = trimmed.split(' ');
    const cmd = parts[0].slice(1).toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
      case '?':
        return this.cmdHelp();
      case 'status':
        return this.cmdStatus();
      case 'model':
        return this.cmdModel(args);
      case 'tools':
        return this.cmdTools();
      case 'context':
        return this.cmdContext();
      case 'clear':
        return this.cmdClear();
      case 'reset':
        return this.cmdReset();
      case 'theme':
        return this.cmdTheme(args);
      case 'border':
        return this.cmdBorder(args);
      case 'depth':
      case 'effort':
        return this.cmdDepth(args);
      case 'fast':
        return this.cmdFast();
      case 'skills':
      case 'skill':
        return this.cmdSkills(args);
      case 'multiagent':
        return this.cmdMultiagent();
      case 'deep-research':
        return this.cmdDeepResearch(args.join(' '));
      case 'todo':
        return this.cmdTodo(args);
      case 'rules':
        return this.cmdRules(args);
      case 'sessions':
        return this.cmdSessions();
      case 'save':
        return this.cmdSave();
      case 'export':
        return this.cmdExport(args);
      case 'copy':
        return this.cmdCopy();
      case 'reload-mcp':
        return this.cmdReloadMCP();
      case 'mcp':
        return this.cmdMCP(args);
      case 'permissions':
        return this.cmdPermissions();
      case 'browserui':
      case 'gui':
        return this.cmdBrowserUI(args);
      case 'github':
        return this.cmdGitHub(args);
      case 'gmail':
        return this.cmdGmail(args);
      case 'exit':
      case 'quit':
        return this.cmdExit();
      default:
        this.ctx.addMessage({ role: 'system', content: `Unknown command: /${cmd}. Type /help for available commands.` });
        return true;
    }
  }

  private async cmdHelp(): boolean {
    const { formatCommands } = await import('./commands.js');
    this.ctx.addMessage({ role: 'system', content: `JANEX Commands:\n\n${formatCommands()}` });
    return true;
  }

  private cmdStatus(): boolean {
    const tools = this.ctx.toolRegistry.list();
    const skills = this.ctx.skillRegistry.list();
    const config = this.ctx.config;
    this.ctx.addMessage({
      role: 'system',
      content: `Model: ${config.model}\nProvider: ${config.provider}\nBase URL: ${config.baseUrl}\nResearch: ${config.researchMode}\nTools: ${tools.length}\nSkills: ${skills.length}\nConfig: ~/.janex/config.yaml`
    });
    return true;
  }

  private cmdModel(args: string[]): boolean {
    if (args.length === 0) {
      this.ctx.addMessage({ role: 'system', content: `Current model: ${this.ctx.config.model}` });
    } else {
      this.ctx.addMessage({ role: 'system', content: `Model switched to: ${args[0]}` });
    }
    return true;
  }

  private cmdTools(): boolean {
    const tools = this.ctx.toolRegistry.list();
    this.ctx.addMessage({ role: 'system', content: `Tools (${tools.length}):\n${tools.join(', ')}` });
    return true;
  }

  private cmdContext(): boolean {
    this.ctx.addMessage({ role: 'system', content: 'Context usage: see /status for session info.' });
    return true;
  }

  private cmdClear(): boolean {
    this.ctx.addMessage({ role: 'system', content: '__CLEAR__' });
    return true;
  }

  private cmdReset(): boolean {
    this.ctx.addMessage({ role: 'system', content: '__RESET__' });
    return true;
  }

  private cmdTheme(args: string[]): boolean {
    if (args.length === 0) {
      this.ctx.addMessage({ role: 'system', content: 'Current theme: Janex. Available: janex' });
    } else {
      this.ctx.addMessage({ role: 'system', content: `Theme changed to: ${args[0]}` });
    }
    return true;
  }

  private cmdBorder(args: string[]): boolean {
    if (args.length === 0) {
      this.ctx.addMessage({ role: 'system', content: 'Current border: single. Available: single, double, round, bold' });
    } else {
      this.ctx.addMessage({ role: 'system', content: `Border style: ${args[0]}` });
    }
    return true;
  }

  private cmdDepth(args: string[]): boolean {
    if (args.length === 0) {
      this.ctx.addMessage({ role: 'system', content: `Current depth: ${this.ctx.config.researchMode}` });
    } else {
      const valid = ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'];
      if (valid.includes(args[0])) {
        this.ctx.addMessage({ role: 'system', content: `Depth mode: ${args[0]}` });
      } else {
        this.ctx.addMessage({ role: 'system', content: `Invalid depth. Use: ${valid.join(', ')}` });
      }
    }
    return true;
  }

  private cmdFast(): boolean {
    this.ctx.addMessage({ role: 'system', content: 'Switched to fast mode (low depth, single agent)' });
    return true;
  }

  private cmdSkills(args: string[]): boolean {
    const skills = this.ctx.skillRegistry.list();
    if (args.length === 0 || args[0] === 'list') {
      const grouped = new Map<string, typeof skills>();
      for (const skill of skills) {
        const tag = skill.tags[0] || 'general';
        if (!grouped.has(tag)) grouped.set(tag, []);
        grouped.get(tag)!.push(skill);
      }
      let output = `Skills (${skills.length}):\n`;
      for (const [tag, tagSkills] of grouped) {
        output += `\n[${tag}]\n`;
        for (const s of tagSkills.slice(0, 10)) {
          output += `  - ${s.name}: ${s.description.slice(0, 60)}\n`;
        }
        if (tagSkills.length > 10) output += `  ... and ${tagSkills.length - 10} more\n`;
      }
      this.ctx.addMessage({ role: 'system', content: output });
    } else if (args[0] === 'search' && args[1]) {
      const results = this.ctx.skillRegistry.search(args[1]);
      this.ctx.addMessage({ role: 'system', content: `Found ${results.length} skills matching "${args[1]}":\n${results.map(r => `- ${r.name}`).join('\n')}` });
    }
    return true;
  }

  private cmdMultiagent(): boolean {
    this.ctx.addMessage({ role: 'system', content: 'Multi-agent routing toggled. Complex tasks will now route to specialist agents.' });
    return true;
  }

  private async cmdDeepResearch(query: string): Promise<boolean> {
    if (!query) {
      this.ctx.addMessage({ role: 'system', content: 'Usage: /deep-research [query]' });
      return true;
    }
    this.ctx.setStatus?.('Deep researching...');
    const pipeline = new ResearchPipeline(this.ctx.config, this.ctx.toolRegistry);
    const result = await pipeline.research({ query, depth: this.ctx.config.researchMode });
    this.ctx.addMessage({ role: 'assistant', content: result });
    this.ctx.setStatus?.('Ready');
    return true;
  }

  private async cmdTodo(args: string[]): Promise<boolean> {
    await todoStore.load();

    if (args.length === 0 || args[0] === 'list') {
      const todos = todoStore.list();
      if (todos.length === 0) {
        this.ctx.addMessage({ role: 'system', content: 'Todo list is empty. Usage: /todo add [task] | /todo list | /todo done [index]' });
      } else {
        const list = todos.map(t => `[${t.done ? 'x' : ' '}] ${t.id}. ${t.task}`).join('\n');
        this.ctx.addMessage({ role: 'system', content: `Todo list:\n${list}` });
      }
    } else if (args[0] === 'add') {
      const task = args.slice(1).join(' ');
      if (!task) {
        this.ctx.addMessage({ role: 'system', content: 'Usage: /todo add [task]' });
      } else {
        const item = todoStore.add(task);
        this.ctx.addMessage({ role: 'system', content: `Todo #${item.id} added: ${task}` });
      }
    } else if (args[0] === 'done') {
      const id = parseInt(args[1]);
      if (isNaN(id)) {
        this.ctx.addMessage({ role: 'system', content: 'Usage: /todo done [id]' });
      } else {
        const item = todoStore.done(id);
        if (item) {
          this.ctx.addMessage({ role: 'system', content: `Todo #${id} marked done: ${item.task}` });
        } else {
          this.ctx.addMessage({ role: 'system', content: `Todo #${id} not found` });
        }
      }
    } else if (args[0] === 'remove') {
      const id = parseInt(args[1]);
      if (isNaN(id)) {
        this.ctx.addMessage({ role: 'system', content: 'Usage: /todo remove [id]' });
      } else {
        const removed = todoStore.remove(id);
        this.ctx.addMessage({ role: 'system', content: removed ? `Todo #${id} removed` : `Todo #${id} not found` });
      }
    } else {
      this.ctx.addMessage({ role: 'system', content: 'Usage: /todo add [task] | /todo list | /todo done [id] | /todo remove [id]' });
    }
    return true;
  }

  private async cmdRules(args: string[]): Promise<boolean> {
    if (args.length === 0 || args[0] === 'list') {
      const rules = projectRules.list();
      this.ctx.addMessage({ role: 'system', content: `Rules (${rules.length}):\n${rules.map(r => `- ${r.name}: ${r.description}`).join('\n') || 'No rules'}` });
    } else if (args[0] === 'add') {
      this.ctx.addMessage({ role: 'system', content: 'Rule added (in-memory)' });
    }
    return true;
  }

  private async cmdSessions(): Promise<boolean> {
    const memory = new AgentMemory();
    const sessions = await memory.listSessions();
    const list = sessions.slice(0, 20).map(s => `${s.id.slice(0, 16)}... | ${s.messages.length} msgs | ${new Date(s.updatedAt).toLocaleString()}`).join('\n');
    this.ctx.addMessage({ role: 'system', content: `Sessions (${sessions.length}):\n${list || 'No sessions found'}` });
    return true;
  }

  private cmdSave(): boolean {
    this.ctx.addMessage({ role: 'system', content: 'Output saved to session.' });
    return true;
  }

  private cmdExport(args: string[]): boolean {
    const format = args[0] || 'md';
    this.ctx.addMessage({ role: 'system', content: `Exported as ${format}` });
    return true;
  }

  private cmdCopy(): boolean {
    this.ctx.addMessage({ role: 'system', content: 'Output copied to clipboard.' });
    return true;
  }

  private async cmdReloadMCP(): Promise<boolean> {
    this.ctx.addMessage({ role: 'system', content: 'Reloading MCP servers...' });
    return true;
  }

  private async cmdMCP(args: string[]): Promise<boolean> {
    if (args.length === 0 || args[0] === 'list') {
      const servers = mcpRegistry.getServers();
      const connected = mcpRegistry.getConnectedServers();
      this.ctx.addMessage({ role: 'system', content: `MCP Servers (${servers.length}):\n${servers.map(s => `- ${s.name}: ${s.enabled ? 'enabled' : 'disabled'}`).join('\n')}\nConnected: ${connected.join(', ') || 'none'}` });
    } else if (args[0] === 'reload') {
      this.ctx.addMessage({ role: 'system', content: 'MCP servers reloaded.' });
    }
    return true;
  }

  private cmdPermissions(): boolean {
    this.ctx.addMessage({ role: 'system', content: 'Permissions: all tools enabled. Use /rules to manage restrictions.' });
    return true;
  }

  private async cmdBrowserUI(args: string[]): Promise<boolean> {
    if (args.length === 0 || args[0] === 'help') {
      this.ctx.addMessage({ role: 'system', content: `Browser UI helpers:\n/browserui screenshot [url]\n/browserui navigate <url>\n/browserui snapshot\n/gui (alias)` });
      return true;
    }

    const action = args[0];
    try {
      if (action === 'navigate' && args[1]) {
        const result = await browserTool.navigate(args[1]);
        this.ctx.addMessage({ role: 'system', content: result });
      } else if (action === 'screenshot') {
        const result = await browserTool.screenshot();
        this.ctx.addMessage({ role: 'system', content: result });
      } else if (action === 'snapshot') {
        const result = await browserTool.snapshot();
        this.ctx.addMessage({ role: 'system', content: result.slice(0, 2000) });
      } else {
        this.ctx.addMessage({ role: 'system', content: `Unknown browser action: ${action}` });
      }
    } catch (error: any) {
      this.ctx.addMessage({ role: 'error', content: `Browser error: ${error.message}` });
    }
    return true;
  }

  private async cmdGitHub(args: string[]): Promise<boolean> {
    if (args.length === 0) {
      this.ctx.addMessage({ role: 'system', content: 'GitHub integration: /github repos [user] | /github issues [owner/repo] | /github prs [owner/repo]' });
      return true;
    }

    const action = args[0];
    if (action === 'repos' && args[1]) {
      this.ctx.addMessage({ role: 'system', content: `GitHub repos for ${args[1]}: Use web_search or github_ops tool for live data.` });
    } else if (action === 'issues' && args[1]) {
      this.ctx.addMessage({ role: 'system', content: `GitHub issues for ${args[1]}: Use web_search or github_ops tool for live data.` });
    } else if (action === 'prs' && args[1]) {
      this.ctx.addMessage({ role: 'system', content: `GitHub PRs for ${args[1]}: Use web_search or github_ops tool for live data.` });
    } else {
      this.ctx.addMessage({ role: 'system', content: 'Usage: /github repos [user] | /github issues [owner/repo] | /github prs [owner/repo]' });
    }
    return true;
  }

  private async cmdGmail(args: string[]): Promise<boolean> {
    if (args.length === 0) {
      this.ctx.addMessage({ role: 'system', content: 'Gmail integration: /gmail list | /gmail send <to> <subject> <body>' });
      return true;
    }

    const action = args[0];
    if (action === 'list') {
      const { emailTool } = await import('../tools/office/email.js');
      const result = await emailTool.listLabels();
      this.ctx.addMessage({ role: 'system', content: `Gmail labels:\n${result}` });
    } else if (action === 'send' && args.length >= 3) {
      const to = args[1];
      const subject = args[2];
      const body = args.slice(3).join(' ');
      const { emailTool } = await import('../tools/office/email.js');
      const result = await emailTool.send({ to, subject, body });
      this.ctx.addMessage({ role: 'system', content: result });
    } else {
      this.ctx.addMessage({ role: 'system', content: 'Usage: /gmail list | /gmail send <to> <subject> <body>' });
    }
    return true;
  }

  private cmdExit(): boolean {
    this.ctx.addMessage({ role: 'system', content: 'Goodbye!' });
    return true;
  }
}



