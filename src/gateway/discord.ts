// @ts-nocheck
export class DiscordPlatform {
  constructor(private token: string) {}
  async start() {}
  async stop() {}
  async sendMessage() { return ''; }
}

export default DiscordPlatform;