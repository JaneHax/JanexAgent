// @ts-nocheck
import * as whois from 'whois';

export class WhoisTool {
  async lookup(domain: string): Promise<string> {
    try {
      const result = await new Promise<string>((resolve, reject) => {
        whois.lookup(domain, (err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      });

      const relevant = result.split('\n').filter((line: string) => {
        const lower = line.toLowerCase();
        return /domain|registrar|created|expires|updated|name server|status|registrant|admin|tech/i.test(lower);
      }).join('\n');

      return relevant || result.slice(0, 1000);
    } catch (error: any) {
      return `Whois error for ${domain}: ${error.message}`;
    }
  }

  async ipLookup(ip: string): Promise<string> {
    try {
      const result = await new Promise<string>((resolve, reject) => {
        whois.lookup(ip, (err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      });

      const relevant = result.split('\n').filter((line: string) => {
        const lower = line.toLowerCase();
        return /netname|orgname|country|org|route|inetnum|abuse|mnt-by/i.test(lower);
      }).join('\n');

      return relevant || result.slice(0, 1000);
    } catch (error: any) {
      return `IP whois error: ${error.message}`;
    }
  }
}

export const whoisTool = new WhoisTool();
