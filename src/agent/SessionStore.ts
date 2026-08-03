export interface SessionSummary {
  id: string;
  title: string;
  preview?: string;
  snippet?: string;
  messageCount?: number;
}

export function searchSessions() { return []; }
export function listDurableSessions() { return []; }
export function listSessions() { return []; }
export function findLatestSession() { return null; }
export function saveSession() {}
export function loadSessionAsync() { return Promise.resolve(null); }

export function getSessionStore() {
  return { 
    save: () => {}, 
    load: () => null, 
    list: () => [], 
    searchSessions,
    listDurableSessions,
    listSessions,
    findLatestSession,
    saveSession,
    loadSessionAsync
  };
}