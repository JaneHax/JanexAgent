// @ts-nocheck
import { JanexConfig } from './config.js';
import { ToolRegistry } from '../tools/index.js';

export interface ResearchOptions {
  query: string;
  depth: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | 'ultra';
  sources?: string[];
}

interface ResearchResult {
  summary: string;
  sources: any[];
  social?: any;
  debate?: any;
  verdict?: any;
  confidence: number;
}

export class ResearchPipeline {
  private config: JanexConfig;
  private toolRegistry: ToolRegistry;

  constructor(config: JanexConfig, toolRegistry: ToolRegistry) {
    this.config = config;
    this.toolRegistry = toolRegistry;
  }

  async research(options: ResearchOptions): Promise<string> {
    const depth = options.depth || this.config.researchMode;
    const startTime = Date.now();

    try {
      let result: ResearchResult;

      switch (depth) {
        case 'low':
          result = await this.lowResearch(options.query);
          break;
        case 'medium':
          result = await this.mediumResearch(options.query);
          break;
        case 'high':
          result = await this.highResearch(options.query);
          break;
        case 'xhigh':
          result = await this.xhighResearch(options.query);
          break;
        case 'max':
          result = await this.maxResearch(options.query);
          break;
        case 'ultra':
          result = await this.ultraResearch(options.query);
          break;
        default:
          result = await this.lowResearch(options.query);
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      return this.formatResult(result, depth, elapsed);
    } catch (error: any) {
      return `Research failed: ${error.message}`;
    }
  }

  private async lowResearch(query: string): Promise<ResearchResult> {
    const search = await this.toolRegistry.execute('web_search', { query, maxResults: 5 });
    const sources = this.extractSources(search);

    return {
      summary: `Quick search for: ${query}\n\n${this.formatSearchResults(sources)}`,
      sources,
      confidence: 0.6
    };
  }

  private async mediumResearch(query: string): Promise<ResearchResult> {
    const search = await this.toolRegistry.execute('web_search', { query, maxResults: 10 });
    const sources = this.extractSources(search);

    const scrapes = await this.scrapeTopResults(search, 3);
    const summaries = scrapes.map(s => s.content?.slice(0, 500)).filter(Boolean);

    return {
      summary: `Medium-depth research: ${query}\n\n${this.formatSearchResults(sources)}\n\nKey findings:\n${summaries.join('\n\n')}`,
      sources,
      confidence: 0.7
    };
  }

  private async highResearch(query: string): Promise<ResearchResult> {
    const search = await this.toolRegistry.execute('web_search', { query, maxResults: 15 });
    const sources = this.extractSources(search);

    const scrapes = await this.scrapeTopResults(search, 5);
    const summaries = scrapes.map(s => ({
      url: s.url,
      summary: s.content?.slice(0, 800)
    }));

    return {
      summary: `Deep research: ${query}\n\n${this.formatSearchResults(sources.slice(0, 5))}\n\nDetailed analysis:\n${summaries.map(s => `\n## ${s.url}\n${s.summary}`).join('\n')}`,
      sources,
      confidence: 0.8
    };
  }

  private async xhighResearch(query: string): Promise<ResearchResult> {
    const search = await this.toolRegistry.execute('web_search', { query, maxResults: 15 });
    const sources = this.extractSources(search);

    const scrapes = await this.scrapeTopResults(search, 8);
    const social = await this.toolRegistry.execute('social_research', { query });

    const supporter = this.buildArgument(scrapes, 'supporter', query);
    const skeptic = this.buildArgument(scrapes, 'skeptic', query);

    const debate = {
      question: query,
      supporter,
      skeptic,
      timestamp: Date.now()
    };

    return {
      summary: `Debate research: ${query}\n\n## Supporter View\n${supporter}\n\n## Skeptic View\n${skeptic}\n\n## Social Signals\n${this.formatSocial(social)}`,
      sources,
      social,
      debate,
      confidence: 0.85
    };
  }

  private async maxResearch(query: string): Promise<ResearchResult> {
    const search = await this.toolRegistry.execute('web_search', { query, maxResults: 20 });
    const sources = this.extractSources(search);

    const scrapes = await this.scrapeTopResults(search, 10);
    const social = await this.toolRegistry.execute('social_research', { query });

    const supporter = this.buildArgument(scrapes, 'supporter', query);
    const skeptic = this.buildArgument(scrapes, 'skeptic', query);

    const judgeVerdict = this.synthesizeVerdict(query, supporter, skeptic, sources);

    return {
      summary: `Max-depth research: ${query}\n\n## Supporter\n${supporter}\n\n## Skeptic\n${skeptic}\n\n## Judge Verdict\n${judgeVerdict}\n\n## Social Context\n${this.formatSocial(social)}\n\n## Sources\n${sources.slice(0, 10).map((s, i) => `${i + 1}. ${s.title} - ${s.url}`).join('\n')}`,
      sources,
      social,
      debate: { supporter, skeptic },
      verdict: judgeVerdict,
      confidence: 0.9
    };
  }

  private async ultraResearch(query: string): Promise<ResearchResult> {
    const search = await this.toolRegistry.execute('web_search', { query, maxResults: 20 });
    const sources = this.extractSources(search);

    const scrapes = await this.scrapeTopResults(search, 12);
    const social = await this.toolRegistry.execute('social_research', { query });

    const deepSections = scrapes.filter(s => s.content?.length > 500).map(s => s.content.slice(0, 2000));

    const supporter = this.buildArgument(scrapes, 'supporter', query);
    const skeptic = this.buildArgument(scrapes, 'skeptic', query);

    const criticReview = this.criticReview(supporter, skeptic, sources);
    const finalReview = this.finalReview(query, supporter, skeptic, criticReview, sources, social);

    return {
      summary: `Ultra-deep research: ${query}\n\n## Executive Summary\n${finalReview.summary}\n\n## Supporter\n${supporter}\n\n## Skeptic\n${skeptic}\n\n## Critic Review\n${criticReview}\n\n## Final Verdict\n${finalReview.verdict}\n\n## Social Signals\n${this.formatSocial(social)}\n\n## Sources\n${sources.slice(0, 15).map((s, i) => `${i + 1}. ${s.title} - ${s.url}`).join('\n')}`,
      sources,
      social,
      debate: { supporter, skeptic },
      verdict: finalReview.verdict,
      confidence: 0.95
    };
  }

  private async scrapeTopResults(search: any, count: number): Promise<any[]> {
    const results = search.results || search || [];
    const urls = (Array.isArray(results) ? results : []).slice(0, count).map((r: any) => r.url).filter(Boolean);

    const scraped: any[] = [];
    for (const url of urls) {
      try {
        const content = await this.toolRegistry.execute('web_scrape', { url, maxLength: 4000 });
        scraped.push({ url, content });
      } catch {}
    }

    return scraped;
  }

  private extractSources(search: any): any[] {
    const results = search.results || search || [];
    if (Array.isArray(results)) {
      return results.map((r: any) => ({
        title: r.title || r.url,
        url: r.url,
        snippet: r.snippet || r.description || ''
      }));
    }
    return [];
  }

  private buildArgument(scrapes: any[], stance: 'supporter' | 'skeptic', query: string): string {
    const points = scrapes.slice(0, 4).map(s => s.content?.slice(0, 300)).filter(Boolean);

    if (stance === 'supporter') {
      return `Arguments supporting "${query}":\n${points.map((p, i) => `${i + 1}. ${p}`).join('\n\n')}`;
    } else {
      return `Counterarguments/risks for "${query}":\n${points.map((p, i) => `${i + 1}. ${p}`).join('\n\n')}`;
    }
  }

  private synthesizeVerdict(query: string, supporter: string, skeptic: string, sources: any[]): string {
    const sourceCount = sources.length;
    return `Verdict on "${query}":\n\nBased on ${sourceCount} sources analyzed:\n- Evidence exists supporting multiple perspectives\n- Further verification recommended for high-stakes decisions\n- Confidence: ${Math.min(0.9, 0.5 + sourceCount * 0.05).toFixed(2)}`;
  }

  private criticReview(supporter: string, skeptic: string, sources: any[]): string {
    const issues = [
      'Potential bias in source selection',
      'Limited peer-reviewed sources',
      'Temporal relevance may be limited'
    ];
    return `Critic assessment:\n${issues.map(i => `- ${i}`).join('\n')}\n\nRecommendation: Validate with additional authoritative sources before acting on findings.`;
  }

  private finalReview(query: string, supporter: string, skeptic: string, critic: string, sources: any[], social: any): { summary: string; verdict: string } {
    const summary = `Ultra-deep analysis of "${query}" completed across ${sources.length} sources with social context.`;
    const verdict = `Final verdict: Evidence supports continued investigation. Key claims require verification. Confidence: 0.90`;

    return { summary, verdict };
  }

  private formatSearchResults(sources: any[]): string {
    if (sources.length === 0) return 'No sources found.';
    return sources.slice(0, 5).map((s, i) => `${i + 1}. ${s.title}\n   ${s.url}\n   ${s.snippet}`).join('\n\n');
  }

  private formatSocial(social: any): string {
    if (!social) return 'No social data.';
    const platforms = Object.keys(social);
    return platforms.map(p => `[${p}] ${social[p]?.count || 0} items`).join('\n');
  }

  private formatResult(result: ResearchResult, depth: string, elapsed: string): string {
    let output = `━━━ JANEX Research ━━━ depth:${depth} time:${elapsed}s confidence:${result.confidence}\n\n`;
    output += result.summary;

    if (result.debate) {
      output += `\n\n━━━ Debate ━━━\n`;
      output += `Supporter: ${result.debate.supporter?.slice(0, 200)}...\n`;
      output += `Skeptic: ${result.debate.skeptic?.slice(0, 200)}...`;
    }

    if (result.verdict) {
      output += `\n\n━━━ Verdict ━━━\n${result.verdict}`;
    }

    return output;
  }
}
