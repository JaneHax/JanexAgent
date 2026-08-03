import axios from 'axios';
import * as cheerio from 'cheerio';

export class SocialResearchTool {
  async research(query: string, platforms?: string[]): Promise<any> {
    const targets = platforms || ['reddit', 'hackernews', 'github'];
    const results: any = {};

    for (const platform of targets) {
      try {
        switch (platform) {
          case 'reddit':
            results.reddit = await this.searchReddit(query);
            break;
          case 'hackernews':
            results.hackernews = await this.searchHackerNews(query);
            break;
          case 'github':
            results.github = await this.searchGitHub(query);
            break;
          case 'x':
          case 'twitter':
            results.twitter = await this.searchTwitter(query);
            break;
        }
      } catch (error: any) {
        results[platform] = { error: error.message };
      }
    }

    return results;
  }

  private async searchReddit(query: string): Promise<any> {
    try {
      const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=10`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Janex/1.0' },
        timeout: 10000
      });

      const posts = (response.data.data?.children || []).map((child: any) => ({
        title: child.data.title,
        subreddit: child.data.subreddit,
        score: child.data.score,
        url: `https://reddit.com${child.data.permalink}`,
        created: new Date(child.data.created_utc * 1000).toISOString()
      }));

      return { platform: 'reddit', count: posts.length, posts };
    } catch (error: any) {
      return { platform: 'reddit', error: error.message };
    }
  }

  private async searchHackerNews(query: string): Promise<any> {
    try {
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=10`;
      const response = await axios.get(url, { timeout: 10000 });

      const stories = (response.data.hits || []).map((hit: any) => ({
        title: hit.title,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        points: hit.points,
        author: hit.author,
        created: hit.created_at
      }));

      return { platform: 'hackernews', count: stories.length, stories };
    } catch (error: any) {
      return { platform: 'hackernews', error: error.message };
    }
  }

  private async searchGitHub(query: string): Promise<any> {
    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=10`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Janex/1.0' },
        timeout: 10000
      });

      const repos = (response.data.items || []).map((repo: any) => ({
        name: repo.full_name,
        description: repo.description,
        stars: repo.stargazers_count,
        url: repo.html_url,
        language: repo.language
      }));

      return { platform: 'github', count: repos.length, repos };
    } catch (error: any) {
      return { platform: 'github', error: error.message };
    }
  }

  private async searchTwitter(query: string): Promise<any> {
    return {
      platform: 'twitter',
      note: 'Twitter/X search requires official API or Nitter/RSS fallback',
      query
    };
  }

  async forumResearch(query: string, forum: string): Promise<any> {
    const url = `https://www.google.com/search?q=site:${forum}+${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const results: any[] = [];

    $('.g').each((_, el) => {
      const title = $(el).find('h3').text();
      const snippet = $(el).find('.VwiC3b').text();
      const link = $(el).find('a').attr('href');
      if (title && link) {
        results.push({ title, snippet, url: link });
      }
    });

    return { forum, query, count: results.length, results };
  }
}

export const socialResearchTool = new SocialResearchTool();
