export interface Plugin {
  name: string;
  version: string;
  description: string;
  init?: () => Promise<void>;
  onToolUse?: (toolName: string, args: any) => Promise<any>;
  onMessage?: (message: string) => Promise<string>;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private enabled = true;

  register(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  async initAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.init) {
        await plugin.init();
      }
    }
  }

  async onToolUse(toolName: string, args: any): Promise<any> {
    if (!this.enabled) return args;

    for (const plugin of this.plugins.values()) {
      if (plugin.onToolUse) {
        const result = await plugin.onToolUse(toolName, args);
        if (result) args = result;
      }
    }
    return args;
  }

  async onMessage(message: string): Promise<string> {
    if (!this.enabled) return message;

    for (const plugin of this.plugins.values()) {
      if (plugin.onMessage) {
        message = await plugin.onMessage(message);
      }
    }
    return message;
  }

  list(): string[] {
    return Array.from(this.plugins.keys());
  }

  enable(): void { this.enabled = true; }
  disable(): void { this.enabled = false; }
}

export const pluginManager = new PluginManager();
