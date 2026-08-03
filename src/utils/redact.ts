const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey|api[_-]?secret|secret|password|passwd|pwd|token|bearer|auth|credential|private[_-]?key)\s*[:=]\s*['"]?([a-zA-Z0-9_\-\.]{8,})['"]?/gi,
  /(?:sk-|ghp_|gho_|ghs_|ghp_|github_pat_|xox[baprs]-)[a-zA-Z0-9_\-\.]{8,}/gi,
  /(?:Bearer\s+)[a-zA-Z0-9_\-\.]+/gi,
  /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{4,}['"]/gi,
  /(?:mongodb|postgres|mysql|redis):\/\/[^\s]+/gi,
  /(?:https?:\/\/[^:]+:)[^@]+@/gi,
  /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[^-]+-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi
];

export function redactSecrets(text: string): string {
  let redacted = text;
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => {
      const prefix = match.slice(0, Math.min(20, match.length));
      return `${prefix}...[REDACTED]`;
    });
  }
  return redacted;
}

export function redactObject(obj: any): any {
  if (typeof obj === 'string') {
    return redactSecrets(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }
  if (obj && typeof obj === 'object') {
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (['password', 'secret', 'token', 'apikey', 'api_key', 'key', 'credential'].some(s => lowerKey.includes(s))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactObject(value);
      }
    }
    return redacted;
  }
  return obj;
}
