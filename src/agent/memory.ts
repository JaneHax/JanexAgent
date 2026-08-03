// @ts-nocheck
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const SESSIONS_DIR = path.join(os.homedir(), '.janex', 'sessions');

export interface StoredSession {
  id: string;
  messages: any[];
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, any>;
}

export class AgentMemory {
  async saveSession(session: StoredSession): Promise<void> {
    await fs.ensureDir(SESSIONS_DIR);
    const file = path.join(SESSIONS_DIR, `${session.id}.json`);
    await fs.writeJson(file, session, { spaces: 2 });
  }

  async loadSession(id: string): Promise<StoredSession | null> {
    const file = path.join(SESSIONS_DIR, `${id}.json`);
    if (await fs.pathExists(file)) {
      return await fs.readJson(file);
    }
    return null;
  }

  async listSessions(): Promise<StoredSession[]> {
    await fs.ensureDir(SESSIONS_DIR);
    const files = await fs.readdir(SESSIONS_DIR);
    const sessions: StoredSession[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const session = await fs.readJson(path.join(SESSIONS_DIR, file));
          sessions.push(session);
        } catch {}
      }
    }

    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async deleteSession(id: string): Promise<void> {
    const file = path.join(SESSIONS_DIR, `${id}.json`);
    if (await fs.pathExists(file)) {
      await fs.remove(file);
    }
  }

  async getLatestSessionId(): Promise<string | null> {
    const sessions = await this.listSessions();
    return sessions.length > 0 ? sessions[0].id : null;
  }
}
