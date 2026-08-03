// @ts-nocheck
import { SkillRegistry, Skill } from './registry.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import axios from 'axios';

export class SkillLoader {
  private registry: SkillRegistry;

  constructor(registry: SkillRegistry) {
    this.registry = registry;
  }

  async loadAll(): Promise<void> {
    await this.registry.loadAll();
  }

  async loadSkill(name: string): Promise<Skill | null> {
    const skill = this.registry.get(name);
    if (!skill) {
      console.warn(`Skill not found: ${name}`);
      return null;
    }
    return skill;
  }

  async enableSkill(name: string): Promise<string> {
    const skill = this.registry.get(name);
    if (!skill) return `Skill ${name} not found`;
    return `Skill ${name} enabled`;
  }

  async disableSkill(name: string): Promise<string> {
    const skill = this.registry.get(name);
    if (!skill) return `Skill ${name} not found`;
    return `Skill ${name} disabled`;
  }

  async installSkill(source: string): Promise<string> {
    const skillsDir = path.join(os.homedir(), '.janex', 'skills');

    if (source.startsWith('http')) {
      const response = await axios.get(source);
      const fileName = source.split('/').pop() || 'skill.md';
      const dest = path.join(skillsDir, fileName);
      await fs.ensureDir(skillsDir);
      await fs.writeFile(dest, response.data, 'utf-8');
      return `Installed skill to ${dest}`;
    }

    if (await fs.pathExists(source)) {
      const content = await fs.readFile(source, 'utf-8');
      const fileName = path.basename(source);
      const dest = path.join(skillsDir, fileName);
      await fs.ensureDir(skillsDir);
      await fs.writeFile(dest, content, 'utf-8');
      return `Installed skill from ${source}`;
    }

    return 'Invalid skill source';
  }

  formatSkillList(): string {
    const skills = this.registry.list();
    if (skills.length === 0) return 'No skills loaded';

    const grouped = new Map<string, Skill[]>();
    for (const skill of skills) {
      const tag = skill.tags[0] || 'general';
      if (!grouped.has(tag)) grouped.set(tag, []);
      grouped.get(tag)!.push(skill);
    }

    let output = '';
    for (const [tag, tagSkills] of grouped) {
      output += `\n[${tag}]\n`;
      for (const s of tagSkills) {
        output += `  - ${s.name}: ${s.description}\n`;
      }
    }

    return output;
  }
}

export const skillLoader = new SkillLoader(skillRegistry);
