import * as dns from 'dns';
import { promisify } from 'util';
import axios from 'axios';

const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

export class DNSTool {
  async lookup(domain: string): Promise<any> {
    const results: any = { domain };

    try {
      const mx = await resolveMx(domain);
      results.mx = mx.map(r => ({ exchange: r.exchange, priority: r.priority }));
    } catch {}

    try {
      const txt = await resolveTxt(domain);
      results.txt = txt.flat().filter(Boolean);
    } catch {}

    try {
      const a = await resolve4(domain);
      results.a = a;
    } catch {}

    try {
      const aaaa = await resolve6(domain);
      results.aaaa = aaaa;
    } catch {}

    return results;
  }

  async reverseDns(ip: string): Promise<string> {
    return new Promise((resolve) => {
      dns.reverse(ip, (err, hostnames) => {
        if (err) return resolve(`No PTR record for ${ip}`);
        resolve(`PTR for ${ip}: ${hostnames.join(', ')}`);
      });
    });
  }

  async subdomains(domain: string, wordlist: string[] = ['www', 'mail', 'ftp', 'admin', 'api', 'dev', 'staging', 'test', 'app']): Promise<string> {
    const found: string[] = [];

    for (const sub of wordlist) {
      const hostname = `${sub}.${domain}`;
      try {
        await resolve4(hostname);
        found.push(hostname);
      } catch {}
    }

    return found.length > 0 ? found.join('\n') : 'No subdomains found';
  }
}

export const dnsTool = new DNSTool();
