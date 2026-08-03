// @ts-nocheck
export class TelegramPlatform {
  constructor(private token: string) {}
  async start() {}
  async stop() {}
  async sendMessage() { return ''; }
}

export default TelegramPlatform;