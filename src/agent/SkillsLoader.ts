import fs from 'fs';
import path from 'path';
import os from 'os';
import type { SlashCommand, CommandSource, CommandStatus } from '../cli/commands.js';
import { loadSkillsFromDir, type SkillDefinition } from '../skills/SkillRegistry.js';

export { type SkillDefinition } from '../skills/SkillRegistry.js';

export interface SkillManifest {
  name: string;
  description: string;
  slug: string;
  source: 'local' | 'external' | 'store';
  path: string;
  enabled: boolean;
  category?: string;
}

export interface SkillInvocation {
  skill: SkillManifest;
  args: string;
}

const SKILLS_DIR = path.join(os.homedir(), '.janex', 'skills');
const REPO_SKILLS_DIR = path.join(process.cwd(), 'skills');
const PACKAGE_SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');

let cachedSkills: SkillManifest[] | null = null;
let cachedSkillContent = new Map<string, string>();

export function clearSkillsCache(): void {
  cachedSkills = null;
  cachedSkillContent.clear();
}

export function ensureSkillsDir(): void {
  for (const dir of [SKILLS_DIR, REPO_SKILLS_DIR, PACKAGE_SKILLS_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

export function scanSkills(): SkillManifest[] {
  if (cachedSkills) return cachedSkills;
  ensureSkillsDir();
  const skills: SkillManifest[] = [];
  const seen = new Set<string>();

  const scanDir = (dir: string, source: SkillManifest['source']) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const skillDir = path.join(dir, entry);
      const manifestPath = path.join(skillDir, 'SKILL.md');
      if (!fs.existsSync(manifestPath)) continue;
      const content = fs.readFileSync(manifestPath, 'utf-8');
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      const descMatch = content.match(/^description:\s*(.+)$/m);
      const slug = entry.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      if (seen.has(slug)) continue;
      seen.add(slug);
      skills.push({
        name: nameMatch?.[1]?.trim() || entry,
        description: descMatch?.[1]?.trim() || '',
        slug,
        source,
        path: skillDir,
        enabled: true,
      });
    }
  };

  scanDir(REPO_SKILLS_DIR, 'local');
  scanDir(PACKAGE_SKILLS_DIR, 'local');
  scanDir(SKILLS_DIR, 'external');
  cachedSkills = skills.sort((a, b) => a.slug.localeCompare(b.slug));
  return cachedSkills;
}

export function loadSkillContent(slug: string): string | null {
  if (cachedSkillContent.has(slug)) return cachedSkillContent.get(slug)!;
  const skills = scanSkills();
  const skill = skills.find((s) => s.slug === slug);
  if (!skill) return null;
  const manifestPath = path.join(skill.path, 'SKILL.md');
  const content = fs.readFileSync(manifestPath, 'utf-8');
  cachedSkillContent.set(slug, content);
  return content;
}

export function resolveSkillSlug(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  const skills = scanSkills();
  const exact = skills.find((s) => s.slug === trimmed || s.name.toLowerCase() === trimmed);
  if (exact) return exact.slug;
  const fuzzy = skills.find((s) => s.slug.startsWith(trimmed) || s.name.toLowerCase().startsWith(trimmed));
  return fuzzy?.slug || null;
}

export function buildSkillCommandHelp(skills: SkillManifest[]): string {
  const lines = skills.map((s) => `/${s.slug}  ${s.description || s.name}`);
  return lines.join('\n');
}

export function getSkillSlashCommands(skills: SkillManifest[]): SlashCommand[] {
  return skills.map((s) => ({
    name: s.slug,
    description: s.description || s.name,
    group: 'skills',
    source: 'skill' as CommandSource,
    status: 'agent-prompt' as CommandStatus,
    hidden: false,
  }));
}

export function buildSkillInvocationMessage(skill: SkillManifest, userArgs: string): string {
  const content = loadSkillContent(skill.slug) || '';
  const lines = [
    `[SKILL: ${skill.name}]`,
    content,
    `[END SKILL]`,
    '',
    `User request: ${userArgs}`,
  ];
  return lines.join('\n');
}
