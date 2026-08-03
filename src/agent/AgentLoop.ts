// @ts-nocheck
export class AgentLoop {
  setSessionKey() {}
  setMaxIterations() {}
  interrupt() {}
  getLedger() { return []; }
  injectContext() {}
  setProvider() {}
  setResearchMode() {}
  getModel() { return ''; }
  getProviderName() { return ''; }
  getMessages() { return []; }
  getSessionId() { return ''; }
  searchSessions() { return []; }
  saveSession() {}
  listDurableSessions() { return []; }
  listSessions() { return []; }
  findLatestSession() { return null; }
  loadSessionAsync() { return Promise.resolve(null); }
  compactMessages() { return []; }
  listAgentJobs() { return []; }
  getToolUsageStats() { return {}; }
  getContextStats() { return {}; }
  getTokenStats() { return {}; }
  detectWorkflowPatterns() { return []; }
  listObserverEvents() { return []; }
  run() { return Promise.resolve(''); }
  
  constructor(public config: any, public registry: any) {}
  async start() {}
  async stop() {}
  async sendMessage(message: string) { return ''; }
}
export type { AgentEvent };