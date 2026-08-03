import axios from 'axios';
import * as cheerio from 'cheerio';
import { rateLimiter } from '../../utils/rate-limit.js';
import { fileCache } from '../../utils/cache.js';

export class WebScrapeTool {
  async scrape(url: string, maxLength = 5000, selector?: string): Promise<string> {
    if (!rateLimiter.check('web_scrape', 20, 60000)) {
      return 'Rate limit exceeded. Try again in a minute.';
    }

    const cacheKey = `scrape:${url}:${maxLength}:${selector || 'body'}`;
    const cached = fileCache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);

      $('script, style, nav, footer, header, aside, iframe, noscript').remove();

      let text: string;
      if (selector) {
        text = $(selector).text();
      } else {
        text = $('main, article, .content, #content, body').first().text();
      }

      text = text.replace(/\s+/g, ' ').trim();

      if (text.length > maxLength) {
        text = text.slice(0, maxLength) + '...';
      }

      const result = text || `Scraped ${url} (empty content)`;
      fileCache.set(cacheKey, result, 1000 * 60 * 30);
      return result;
    } catch (error: any) {
      return `Error scraping ${url}: ${error.message}`;
    }
  }

  async scrapeLinks(url: string, filter?: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const links: any[] = [];

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (href && text && !href.startsWith('javascript:')) {
          links.push({ text, href });
        }
      });

      const filtered = filter ? links.filter(l => l.href.includes(filter) || l.text.includes(filter)) : links;
      return JSON.stringify(filtered.slice(0, 50), null, 2);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async extractMetadata(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);

      const meta = {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
        image: $('meta[property="og:image"]').attr('content') || '',
        url: url,
        site: $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname
      };

      return JSON.stringify(meta, null, 2);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

export const webScrapeTool = new WebScrapeTool();
