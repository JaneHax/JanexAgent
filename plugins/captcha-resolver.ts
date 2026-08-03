import { Plugin } from './index.js';

export const captchaResolverPlugin: Plugin = {
  name: 'captcha-resolver',
  version: '1.0.0',
  description: 'CAPTCHA detection and solving plugin',

  async init() {
    console.log('[plugin] captcha-resolver initialized');
  },

  async onToolUse(toolName: string, args: any) {
    if (toolName === 'captcha_detect' || toolName === 'captcha_solve') {
      return args;
    }
    if (toolName === 'browser_click') {
      const { browserTool } = await import('../tools/browser/browser.js');
      await browserTool.init({ headless: true });
    }
    return args;
  },

  async onMessage(message: string) {
    if (message.toLowerCase().includes('captcha') || message.toLowerCase().includes('verification')) {
      return `${message}\n\n[Capsolver hint: Configure vision model in ~/.janex/config.yaml for best results]`;
    }
    return message;
  }
};
