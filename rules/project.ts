import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const RULES_FILE = path.join(os.homedir(), '.janex', 'project-rules.yaml');

export interface ProjectRule {
  name: string;
  description: string;
  pattern: string;
  action: 'allow' | 'deny' | 'confirm' | 'log';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ProjectRules {
  private rules: ProjectRule[] = [];

  async load(): Promise<void> {
    if (await fs.pathExists(RULES_FILE)) {
      const content = await fs.readFile(RULES_FILE, 'utf-8');
      const yaml = (await import('yaml')).default;
      this.rules = yaml.parse(content) || [];
    }
  }

  async save(): Promise<void> {
    const yaml = (await import('yaml')).default;
    await fs.ensureDir(path.dirname(RULES_FILE));
    await fs.writeFile(RULES_FILE, yaml.stringify(this.rules), 'utf-8');
  }

  add(rule: ProjectRule): void {
    this.rules.push(rule);
  }

  remove(name: string): void {
    this.rules = this.rules.filter(r => r.name !== name);
  }

  evaluate(action: string, args: any): { allowed: boolean; reason?: string } {
    for (const rule of this.rules) {
      if (rule.pattern && new RegExp(rule.pattern, 'i').test(action)) {
        if (rule.action === 'deny') {
          return { allowed: false, reason: rule.description };
        }
        if (rule.action === 'confirm') {
          return { allowed: true, reason: `Requires confirmation: ${rule.description}` };
        }
      }
    }
    return { allowed: true };
  }

  list(): ProjectRule[] {
    return [...this.rules];
  }
}

export const projectRules = new ProjectRules();
