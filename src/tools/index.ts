// @ts-nocheck
import { AgentContext } from '../agent/context.js';
import { JanexConfig } from '../agent/config.js';
import { browserTool } from '../tools/browser/browser.js';
import { captchaSolver } from '../tools/browser/captcha.js';
import { webSearchTool } from '../tools/research/search.js';
import { webScrapeTool } from '../tools/research/scrape.js';
import { socialResearchTool } from '../tools/research/social.js';
import { harCaptureTool } from '../tools/research/har-capture.js';
import { terminalTool } from '../tools/terminal/exec.js';
import { fileTool } from '../tools/file/ops.js';
import { gitTool } from '../tools/git/ops.js';
import { dnsTool } from '../tools/osint/dns.js';
import { whoisTool } from '../tools/osint/whois.js';
import { usernameSearchTool } from '../tools/osint/username.js';
import { emailOSINTTool } from '../tools/osint/email-osint.js';
import { geolocationTool } from '../tools/osint/geolocation.js';
import { phoneTool } from '../tools/osint/phone.js';
import { pdfTool } from '../tools/office/pdf.js';
import { excelTool } from '../tools/office/excel.js';
import { emailTool } from '../tools/office/email.js';
import { cloudDeployTool } from '../tools/deploy/cloud.js';
import { vpsTool } from '../tools/cloud/vps.js';
import { tradingTool } from '../tools/finance/trading.js';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface RegisteredTool {
  fn: (args: Record<string, any>) => Promise<any>;
  description: string;
  parameters: Record<string, any>;
}

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();
  private config: JanexConfig | null = null;

  register(name: string, fn: (args: Record<string, any>) => Promise<any>, description: string, parameters: Record<string, any>): void {
    this.tools.set(name, { fn, description, parameters });
  }

  get(name: string): Function | undefined {
    return this.tools.get(name)?.fn;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  list(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolDefinitions(): ToolDefinition[] {
    const definitions: ToolDefinition[] = [];

    for (const [name, tool] of this.tools) {
      definitions.push({
        name,
        description: tool.description,
        parameters: tool.parameters
      });
    }

    return definitions;
  }

  async execute(name: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      return await tool.fn(args);
    } catch (error: any) {
      return { error: error.message };
    }
  }

  registerAll(config: JanexConfig): void {
    this.config = config;

    this.register('web_search', (args) => webSearchTool.search(args.query, args.maxResults),
      'Search the web', { query: { type: 'string' }, maxResults: { type: 'number' } });

    this.register('web_scrape', (args) => webScrapeTool.scrape(args.url, args.maxLength, args.selector),
      'Scrape web page content', { url: { type: 'string' }, maxLength: { type: 'number' }, selector: { type: 'string' } });

    this.register('social_research', (args) => socialResearchTool.research(args.query, args.platforms),
      'Research across social platforms', { query: { type: 'string' }, platforms: { type: 'array' } });

    this.register('har_capture', (args) => harCaptureTool.capture(args),
      'Capture HAR network traffic (XHR/Fetch/WebSocket) from website', {
        url: { type: 'string' },
        output: { type: 'string' },
        filter: { type: 'string' },
        headless: { type: 'boolean' },
        wait: { type: 'number' },
        cdpUrl: { type: 'string' },
        existingTab: { type: 'boolean' }
      });

    this.register('terminal_execute', (args) => terminalTool.execute(args.command, args.cwd, args.timeout),
      'Execute terminal command', { command: { type: 'string' }, cwd: { type: 'string' }, timeout: { type: 'number' } });

    this.register('file_read', (args) => fileTool.read(args.path, args.limit, args.offset),
      'Read file contents', { path: { type: 'string' }, limit: { type: 'number' }, offset: { type: 'number' } });

    this.register('file_write', (args) => fileTool.write(args.path, args.content),
      'Write file contents', { path: { type: 'string' }, content: { type: 'string' } });

    this.register('file_edit', (args) => fileTool.edit(args.path, args.oldString, args.newString),
      'Edit file contents', { path: { type: 'string' }, oldString: { type: 'string' }, newString: { type: 'string' } });

    this.register('file_delete', (args) => fileTool.delete(args.path),
      'Delete file or directory', { path: { type: 'string' } });

    this.register('git_status', (args) => gitTool.status(args.cwd),
      'Show git status', { cwd: { type: 'string' } });

    this.register('git_diff', (args) => gitTool.diff(args.file, args.cwd),
      'Show git diff', { file: { type: 'string' }, cwd: { type: 'string' } });

    this.register('git_log', (args) => gitTool.log(args.limit, args.cwd),
      'Show git log', { limit: { type: 'number' }, cwd: { type: 'string' } });

    this.register('git_commit', (args) => gitTool.commit(args.message, args.cwd),
      'Commit changes', { message: { type: 'string' }, cwd: { type: 'string' } });

    this.register('browser_navigate', (args) => browserTool.navigate(args.url),
      'Navigate browser to URL', { url: { type: 'string' } });

    this.register('browser_click', (args) => browserTool.click(args.selector),
      'Click browser element', { selector: { type: 'string' } });

    this.register('browser_fill', (args) => browserTool.fill(args.selector, args.value),
      'Fill browser input', { selector: { type: 'string' }, value: { type: 'string' } });

    this.register('browser_screenshot', (args) => browserTool.screenshot(args.path),
      'Take browser screenshot', { path: { type: 'string' } });

    this.register('browser_snapshot', () => browserTool.snapshot(),
      'Get browser page content', {});

    this.register('captcha_detect', () => captchaSolver.detect(),
      'Detect CAPTCHA on page', {});

    this.register('captcha_solve', (args) => captchaSolver.solve(args),
      'Solve CAPTCHA', { type: { type: 'string' } });

    this.register('dns_lookup', (args) => dnsTool.lookup(args.domain),
      'DNS lookup', { domain: { type: 'string' } });

    this.register('whois_lookup', (args) => whoisTool.lookup(args.domain),
      'Whois lookup', { domain: { type: 'string' } });

    this.register('username_search', (args) => usernameSearchTool.search(args.username, args.platforms),
      'Search username across platforms', { username: { type: 'string' }, platforms: { type: 'array' } });

    this.register('email_osint', (args) => emailOSINTTool.investigate(args.email),
      'Email OSINT investigation', { email: { type: 'string' } });

    this.register('ip_lookup', (args) => geolocationTool.ipLookup(args.ip),
      'IP geolocation lookup', { ip: { type: 'string' } });

    this.register('phone_lookup', (args) => phoneTool.lookup(args.phone),
      'Phone number lookup', { phone: { type: 'string' } });

    this.register('pdf_read', (args) => pdfTool.read(args.path),
      'Read PDF file', { path: { type: 'string' } });

    this.register('excel_read', (args) => excelTool.read(args.path, args.sheetName),
      'Read Excel file', { path: { type: 'string' }, sheetName: { type: 'string' } });

    this.register('email_send', (args) => emailTool.send(args),
      'Send email', { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } });

    this.register('deploy_docker', (args) => cloudDeployTool.deployDocker(args),
      'Deploy Docker container', { image: { type: 'string' }, containerName: { type: 'string' } });

    this.register('ssh_execute', (args) => vpsTool.ssh(args.command, args.host, args.user, args.keyPath),
      'SSH execute command', { command: { type: 'string' }, host: { type: 'string' } });

    this.register('trading_analyze', (args) => tradingTool.analyze(args),
      'Analyze stock/crypto symbol', { symbol: { type: 'string' }, action: { type: 'string' }, period: { type: 'string' } });

    this.register('trading_compare', (args) => tradingTool.compare(args.symbols),
      'Compare multiple symbols', { symbols: { type: 'array' } });

    this.register('trading_portfolio', (args) => tradingTool.portfolio(args.holdings),
      'Analyze portfolio', { holdings: { type: 'array' } });
  }
}

export const toolRegistry = new ToolRegistry();
