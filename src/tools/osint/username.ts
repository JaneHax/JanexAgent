import axios from 'axios';
import { createHash } from 'crypto';
import * as dns from 'dns';

export class UsernameSearchTool {
  async search(username: string, platforms?: string[]): Promise<any> {
    const targets = platforms || [
      'github', 'twitter', 'reddit', 'youtube', 'instagram',
      'linkedin', 'tiktok', 'medium', 'devto'
    ];
    const results: any = {};

    for (const platform of targets) {
      try {
        const profile = await this.checkProfile(platform, username);
        if (profile) {
          results[platform] = profile;
        }
      } catch {}
    }

    return { username, found: results };
  }

  private async checkProfile(platform: string, username: string): Promise<any> {
    const urls: Record<string, string> = {
      github: `https://github.com/${username}`,
      twitter: `https://x.com/${username}`,
      reddit: `https://reddit.com/user/${username}`,
      youtube: `https://youtube.com/@${username}`,
      instagram: `https://instagram.com/${username}`,
      linkedin: `https://linkedin.com/in/${username}`,
      tiktok: `https://tiktok.com/@${username}`,
      medium: `https://medium.com/@${username}`,
      devto: `https://dev.to/${username}`
    };

    const url = urls[platform];
    if (!url) return null;

    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000,
        validateStatus: (s) => s < 500
      });

      const exists = response.status === 200;

      return {
        platform,
        url,
        exists,
        status: response.status,
        title: response.data?.match(/<title>([^<]+)<\/title>/)?.[1]?.trim()
      };
    } catch (error: any) {
      return { platform, url, error: error.message };
    }
  }

  async emailLookup(email: string): Promise<string> {
    const [localPart, domain] = email.split('@');
    const checks: string[] = [];

    try {
      const dnsResult = await this.checkDNS(domain);
      checks.push(`DNS: ${dnsResult}`);
    } catch {}

    try {
      const gravatar = await this.checkGravatar(email);
      checks.push(`Gravatar: ${gravatar}`);
    } catch {}

    return checks.join('\n');
  }

  private async checkDNS(domain: string): Promise<string> {
    const mx = await dns.promises.resolveMx(domain);
    const spf = await dns.promises.resolveTxt(domain).catch(() => []);
    return `MX: ${mx.length > 0 ? mx.map(r => r.exchange).join(', ') : 'none'}, TXT records: ${spf.length}`;
  }

  private async checkGravatar(email: string): Promise<string> {
    const hash = createHash('md5').update(email.toLowerCase().trim()).digest('hex');
    const url = `https://www.gravatar.com/avatar/${hash}?d=404`;

    try {
      const response = await axios.get(url, { timeout: 5000 });
      return response.status === 200 ? 'Found' : 'Not found';
    } catch {
      return 'Not found';
    }
  }
}

export const usernameSearchTool = new UsernameSearchTool();
