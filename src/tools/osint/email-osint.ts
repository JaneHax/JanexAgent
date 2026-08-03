import dns from 'dns';
import { promisify } from 'util';
import { createHash } from 'crypto';

const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolve4 = promisify(dns.resolve4);

export class EmailOSINTTool {
  async investigate(email: string): Promise<string> {
    const [localPart, domain] = email.split('@');
    if (!domain) return `Invalid email: ${email}`;

    const results: string[] = [`Email OSINT: ${email}`];

    try {
      const mx = await resolveMx(domain);
      results.push(`MX: ${mx.map(r => `${r.exchange} (priority: ${r.priority})`).join(', ')}`);
    } catch {
      results.push(`MX: None (domain may not accept email)`);
    }

    try {
      const txt = await resolveTxt(domain);
      const spf = txt.flat().filter((t: string) => t.includes('v=spf'));
      const dmarc = txt.flat().filter((t: string) => t.includes('v=DMARC'));
      const dkim = txt.flat().filter((t: string) => t.includes('v=DKIM') || t.includes('k=rsa'));

      if (spf.length > 0) results.push(`SPF: ${spf[0]}`);
      if (dmarc.length > 0) results.push(`DMARC: ${dmarc[0]}`);
      if (dkim.length > 0) results.push(`DKIM: found`);
    } catch {}

    try {
      const a = await resolve4(domain);
      results.push(`A: ${a.join(', ')}`);
    } catch {
      results.push(`A: No A records`);
    }

    results.push(`\nGravatar: https://www.gravatar.com/avatar/${this.md5(email.toLowerCase().trim())}?d=404`);
    results.push(`HaveIBeenPwned: https://haveibeenpwned.com/account/${email}`);

    return results.join('\n');
  }

  private md5(str: string): string {
    return createHash('md5').update(str).digest('hex');
  }
}

export const emailOSINTTool = new EmailOSINTTool();
