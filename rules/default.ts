export const defaultRules = [
  {
    name: 'no-destructive',
    description: 'Prevent destructive actions without confirmation',
    pattern: 'rm -rf|drop database|truncate|delete from',
    action: 'confirm'
  },
  {
    name: 'no-secrets',
    description: 'Prevent exposing secrets in output',
    pattern: 'password|api_key|secret|token|credential',
    action: 'redact'
  },
  {
    name: 'limit-exec-time',
    description: 'Limit command execution time',
    pattern: '',
    action: 'timeout',
    timeout: 30000
  }
];

export function getDefaultRules(): any[] {
  return defaultRules;
}

export function addRule(rule: any): void {
  defaultRules.push(rule);
}

export function removeRule(name: string): void {
  const index = defaultRules.findIndex(r => r.name === name);
  if (index >= 0) {
    defaultRules.splice(index, 1);
  }
}
