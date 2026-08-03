export const coderAgent = {
  name: 'Coder',
  description: 'Code generation, debugging, repo editing',
  systemPrompt: `You are an expert software engineer.
You write clean, efficient, well-tested code.
You follow existing codebase conventions.
You fix bugs by understanding root cause, not patching symptoms.
You run tests after changes.`,
  skills: ['engineering', 'testing', 'git', 'debug']
};

export async function runCoder(task: string, repoPath?: string): Promise<string> {
  return `[Coder] Task: ${task}\nRepo: ${repoPath || 'current'}\nAnalyzing codebase...`;
}
