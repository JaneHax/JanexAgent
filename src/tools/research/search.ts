import axios from 'axios';
import { rateLimiter } from '../../utils/rate-limit.js';
import { fileCache } from '../../utils/cache.js';

export class WebSearchTool {
  async search(query: string, maxResults = 10): Promise<any> {
    if (!rateLimiter.check('web_search', 10, 60000)) {
      return { error: 'Rate limit exceeded. Try again in a minute.', results: [] };
    }

    const cacheKey = `search:${query}:${maxResults}`;
    const cached = fileCache.get(cacheKey);
    if (cached) return cached;

    try {
      const searchApi = process.env.SEARCH_API_KEY
        ? 'https://api.search.brave.com/res/v1/web/search'
        : null;

      if (searchApi) {
        const response = await axios.get(searchApi, {
          headers: { 'X-Subscription-Token': process.env.SEARCH_API_KEY },
          params: { q: query, count: maxResults }
        });
        const result = this.formatBraveResults(response.data);
        fileCache.set(cacheKey, result);
        return result;
      }

      const duckResults = await this.duckDuckGoSearch(query, maxResults);
      const result = { results: duckResults, source: 'duckduckgo' };
      fileCache.set(cacheKey, result);
      return result;
    } catch (error: any) {
      return { error: error.message, results: [] };
    }
  }

  private async duckDuckGoSearch(query: string, maxResults: number): Promise<any[]> {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const results: any[] = [];
      const regex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/g;
      let match;

      while ((match = regex.exec(response.data)) && results.length < maxResults) {
        results.push({
          title: match[2].replace(/<[^>]+>/g, ''),
          url: match[1],
          snippet: ''
        });
      }

      return results;
    } catch {
      return [];
    }
  }

  private formatBraveResults(data: any): any {
    const results = (data.web?.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.description
    }));
    return { results, source: 'brave' };
  }
}

export const webSearchTool = new WebSearchTool();
