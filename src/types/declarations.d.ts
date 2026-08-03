declare module 'sharp' {
  const sharp: any;
  export default sharp;
}

declare module 'fs-extra' {
  import * as fs from 'fs';
  export const copyFile: any;
  export const ensureDir: any;
  export const readFile: any;
  export const writeFile: any;
  export const pathExists: any;
  export const move: any;
  export default fs;
}

declare module 'whois' {
  const whois: any;
  export default whois;
}

declare module 'systeminformation' {
  const si: any;
  export default si;
}
declare module '@opentui/core' {
  export const box: any;
  export const text: any;
  export const useInput: any;
  export const useApp: any;
  export const StyledText: any;
  export const Image: any;
  const core: any;
  export default core;
}

declare module '@opentui/react' {
  export const Flex: any;
  export const Text: any;
  export const Box: any;
  export const useInput: any;
  const react: any;
  export default react;
}

declare module 'sql.js' {
  const sql: any;
  export default sql;
}

declare module '@whiskeysockets/baileys' {
  const baileys: any;
  export default baileys;
}

declare module 'pino' {
  const pino: any;
  export default pino;
}

declare module '@anthropic-ai/sdk' {
  const anthropic: any;
  export default anthropic;
}

declare module '@ai-sdk/anthropic' {
  const aiSdk: any;
  export default aiSdk;
}

declare module 'cloakbrowser' {
  const cloakbrowser: any;
  export default cloakbrowser;
}

declare module 'qrcode' {
  const qrcode: any;
  export default qrcode;
}