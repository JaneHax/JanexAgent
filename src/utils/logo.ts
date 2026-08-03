export function showLogo(): string {
  return `
     ██╗ █████╗ ███╗   ██╗███████╗██╗  ██╗
     ██║██╔══██╗████╗  ██║██╔════╝╚██╗██╔╝
     ██║███████║██╔██╗ ██║█████╗   ╚███╔╝
██   ██║██╔══██║██║╚██╗██║██╔══╝   ██╔██╗
╚█████╔╝██║  ██║██║ ╚████║███████╗██╔╝ ██╗
 ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝
`;
}

export function showBanner(): string {
  const logo = showLogo();
  return `${logo}
  Autonomous Multi-Agent AI Workspace
  Type /help for commands | /exit to quit`;
}

export function sanitizeTerminal(input: string): string {
  return input
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

export function stripAnsi(text: string): string {
  const ansiRegex = /\x1b\[[0-9;]*[a-zA-Z]/g;
  return text.replace(ansiRegex, '');
}

export function getBaseUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url;
  }
}

export function resolveBaseUrl(baseUrl: string, path: string): string {
  if (!baseUrl.endsWith('/')) baseUrl += '/';
  if (path.startsWith('/')) path = path.slice(1);
  return baseUrl + path;
}
