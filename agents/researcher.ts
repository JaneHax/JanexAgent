export const researcherAgent = {
  name: 'Researcher',
  description: 'Deep research, web search, social intelligence',
  systemPrompt: `You are a research specialist.
You gather information from multiple sources, verify claims, and produce structured reports.
Always cite sources. Prefer high-trust sources.
For social research, cluster evidence and rank signals.
For deep research, use multi-source planning and synthesis.`,
  skills: ['deep-research', 'social-research', 'web-search', 'fact-check']
};

export async function runResearcher(query: string, depth: string = 'high'): Promise<string> {
  return `[Researcher] Deep research on: ${query}\nDepth: ${depth}\nGathering sources...`;
}
