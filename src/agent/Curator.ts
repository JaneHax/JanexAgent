import fs from 'fs';
import path from 'path';
import os from 'os';

const CURATOR_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
const ARCHIVE_AFTER_MS = 90 * 24 * 60 * 60 * 1000;
const CURATOR_STATE_FILE = path.join(os.homedir(), '.janex', 'curator-state.json');
const CURATOR_LOG_DIR = path.join(os.homedir(), '.janex', 'logs', 'curator');

export interface CuratorReport {
  runAt: string;
  skills: { slug: string; status: 'active' | 'stale' | 'archived'; modifiedAt: string }[];
}

export class Curator {
  private lastRunAt?: string;

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      if (fs.existsSync(CURATOR_STATE_FILE)) {
        const raw = fs.readFileSync(CURATOR_STATE_FILE, 'utf-8');
        const state = JSON.parse(raw);
        this.lastRunAt = state.lastRunAt;
      }
    } catch {}
  }

  private saveState(): void {
    try {
      fs.writeFileSync(CURATOR_STATE_FILE, JSON.stringify({ lastRunAt: this.lastRunAt }, null, 2));
    } catch {}
  }

  shouldRun(): boolean {
    if (!this.lastRunAt) return true;
    const last = new Date(this.lastRunAt).getTime();
    return Date.now() - last > CURATOR_INTERVAL_MS;
  }

  async run(): Promise<CuratorReport | null> {
    if (!this.shouldRun()) return null;
    this.lastRunAt = new Date().toISOString();
    this.saveState();

    const skillsDir = path.join(os.homedir(), '.janex', 'skills');
    if (!fs.existsSync(skillsDir)) return null;

    const entries = fs.readdirSync(skillsDir).filter((entry) => {
      const full = path.join(skillsDir, entry);
      return fs.existsSync(path.join(full, 'SKILL.md'));
    });

    const now = Date.now();
    const report: CuratorReport = {
      runAt: this.lastRunAt,
      skills: [],
    };

    for (const entry of entries) {
      const full = path.join(skillsDir, entry);
      const stat = fs.statSync(full);
      const age = now - stat.mtimeMs;
      let status: 'active' | 'stale' | 'archived' = 'active';
      if (age > ARCHIVE_AFTER_MS) {
        status = 'archived';
        const archiveDir = path.join(skillsDir, '.archived');
        if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
        const dest = path.join(archiveDir, `${entry}-${Date.now()}`);
        try {
          fs.renameSync(full, dest);
        } catch {}
      } else if (age > STALE_AFTER_MS) {
        status = 'stale';
      }
      report.skills.push({ slug: entry, status, modifiedAt: new Date(stat.mtimeMs).toISOString() });
    }

    try {
      if (!fs.existsSync(CURATOR_LOG_DIR)) fs.mkdirSync(CURATOR_LOG_DIR, { recursive: true });
      const reportFile = path.join(CURATOR_LOG_DIR, `run-${Date.now()}.json`);
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    } catch {}

    return report;
  }
}

export const curator = new Curator();
