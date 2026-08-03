// @ts-nocheck
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface Skill {
  name: string;
  description: string;
  path: string;
  content: string;
  tags: string[];
}

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private skillsDir: string;

  constructor() {
    this.skillsDir = path.join(os.homedir(), '.janex', 'skills');
  }

  async loadAll(): Promise<void> {
    const dirs = [
      this.skillsDir,
      path.join(process.cwd(), 'skills'),
      path.join(__dirname, '..', '..', 'skills')
    ];

    for (const dir of dirs) {
      try {
        if (await fs.pathExists(dir)) {
          await this.loadFromDir(dir);
        }
      } catch (error: any) {
        console.warn(`Skills load warning: ${dir}: ${error.message}`);
      }
    }
  }

  async loadFromDir(dir: string): Promise<void> {
    if (!(await fs.pathExists(dir))) return;

    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.loadFromDir(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      const lowerName = entry.name.toLowerCase();
      const isSkill = lowerName === 'skill.md' || lowerName === 'index.md';
      if (!isSkill) continue;

      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const skillName = this.inferSkillName(fullPath, entry.name);
        const tags = this.extractTags(content);

        if (this.skills.has(skillName)) {
          const existing = this.skills.get(skillName)!;
          if (fullPath.includes(path.join(process.cwd(), 'skills'))) {
            this.skills.set(skillName, {
              name: skillName,
              description: this.extractDescription(content),
              path: fullPath,
              content,
              tags
            });
          }
          continue;
        }

        this.skills.set(skillName, {
          name: skillName,
          description: this.extractDescription(content),
          path: fullPath,
          content,
          tags
        });
      } catch {}
    }
  }

  private inferSkillName(filePath: string, fileName: string): string {
    const normalized = path.normalize(filePath);
    const parts = normalized.split(path.sep);

    const skillIdx = parts.findIndex(p => p.toLowerCase() === 'skills');
    if (skillIdx >= 0 && parts.length > skillIdx + 1) {
      const folder = parts[skillIdx + 1];
      const base = path.basename(fileName, path.extname(fileName)).toLowerCase();
      if (base === 'skill' || base === 'index') {
        return folder;
      }
      return `${folder}:${base}`;
    }

    return path.basename(fileName, path.extname(fileName));
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  search(query: string): Skill[] {
    const lower = query.toLowerCase();
    return Array.from(this.skills.values()).filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower) ||
      s.tags.some(t => t.toLowerCase().includes(lower))
    );
  }

  list(): Skill[] {
    return Array.from(this.skills.values());
  }

  getByTag(tag: string): Skill[] {
    return this.list().filter(s => s.tags.includes(tag));
  }

  private extractDescription(content: string): string {
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
      if (descMatch) {
        return descMatch[1].trim().slice(0, 300);
      }
    }

    const lines = content.split('\n');
    let desc = '';
    let inDesc = false;

    for (const line of lines) {
      if (line.startsWith('#')) {
        inDesc = true;
        continue;
      }
      if (inDesc) {
        if (line.trim() === '') break;
        desc += line.trim() + ' ';
      }
    }

    return desc.trim().slice(0, 200) || 'No description';
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const tagMatch = content.match(/tags?:?\s*([a-zA-Z,\s]+)/i);
    if (tagMatch) {
      tags.push(...tagMatch[1].split(',').map(t => t.trim()).filter(Boolean));
    }
    return tags;
  }
}

export const skillRegistry = new SkillRegistry();
