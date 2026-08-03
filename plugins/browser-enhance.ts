import { Plugin } from './index.js';

export const browserEnhancePlugin: Plugin = {
  name: 'browser-enhance',
  version: '1.0.0',
  description: 'Enhanced browser automation with human-like behavior',

  async init() {
    console.log('[plugin] browser-enhance initialized');
  },

  async onToolUse(toolName: string, args: any) {
    if (toolName === 'browser_navigate') {
      args.headless = args.headless ?? true;
      args.waitUntil = 'domcontentloaded';
    }
    if (toolName === 'browser_screenshot') {
      args.fullPage = args.fullPage ?? true;
      args.type = 'png';
    }
    return args;
  }
};
