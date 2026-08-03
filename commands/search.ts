export async function runSearchCommand(query: string, options: { maxResults?: number; deep?: boolean } = {}): Promise<string> {
  const { webSearchTool } = await import('../tools/research/search.js');
  const result = await webSearchTool.search(query, options.maxResults || 10);
  return JSON.stringify(result, null, 2);
}

export async function runDeepResearch(query: string, depth: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | 'ultra' = 'high'): Promise<string> {
  const { webSearchTool } = await import('../tools/research/search.js');
  const { webScrapeTool } = await import('../tools/research/scrape.js');

  const searchResult = await webSearchTool.search(query, 15);
  const urls = (searchResult.results || []).slice(0, 8).map((r: any) => r.url).filter(Boolean);

  const scraped: any[] = [];
  for (const url of urls) {
    try {
      const content = await webScrapeTool.scrape(url, 3000);
      scraped.push({ url, content });
    } catch {}
  }

  return `Deep Research: ${query}\n\nSources: ${urls.length}\nScraped: ${scraped.length}\n\n${JSON.stringify(scraped, null, 2)}`;
}
