// @ts-nocheck
// @ts-nocheck
import { Command } from 'commander';
import { JanexCLI } from './cli/tui.js';
import { JanexGateway } from './gateway/index.js';
import { JanexLite } from './cli/lite.js';

const program = new Command();

program
  .name('janex')
  .description('Autonomous Multi-Agent AI Workspace in your terminal')
  .version('1.0.0')
  .option('--continue', 'Continue latest session')
  .option('--resume <id>', 'Resume a specific session')
  .option('--lite', 'Launch lite prompt mode')
  .option('--gateway [type]', 'Start gateway (discord|telegram|whatsapp)')
  .option('--api', 'Start local relay API on :3001')
  .option('--setup', 'Run setup wizard')
  .option('--mcp', 'Manage MCP servers')
  .option('--skills', 'List loaded skills')
  .option('--tools', 'List available tools')
  .option('--status', 'Show status')
  .action(async (opts) => {
    try {
      if (opts.setup) {
        const { setupWizard } = await import('../../agent/config.js');
        await setupWizard();
        return;
      }

      if (opts.gateway) {
        const gateway = new JanexGateway({ [opts.gateway]: { enabled: true, token: '' } });
        await gateway.start();
        return;
      }

      if (opts.api) {
        const { startApi } = await import('../../api/relay.js');
        await startApi();
        return;
      }

      if (opts.mcp) {
        const { mcpRegistry } = await import('./mcp/registry.js');
        console.log('MCP servers:', mcpRegistry.getServers().map(s => s.name).join(', ') || 'none');
        return;
      }

      if (opts.skills) {
        const { skillRegistry } = await import('./skills/registry.js');
        const skills = await skillRegistry.list();
        console.log(`Skills (${skills.length}):`, skills.map(s => s.name).join(', '));
        return;
      }

      if (opts.tools) {
        const { toolRegistry } = await import('./tools/index.js');
        const tools = toolRegistry.list();
        console.log(`Tools (${tools.length}):`, tools.join(', '));
        return;
      }

      if (opts.status) {
        const cli = new JanexCLI();
        await cli.showStatus();
        return;
      }

      const cli = new JanexCLI();

      if (opts.continue) {
        await cli.continueLatest();
      } else if (opts.resume) {
        await cli.resume(opts.resume);
      } else if (opts.lite) {
        const lite = new JanexLite();
        await lite.start();
        return;
      }

      await cli.start();
    } catch (error: any) {
      console.error(`Fatal error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
