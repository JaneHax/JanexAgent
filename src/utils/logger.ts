// @ts-nocheck
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { redactSecrets, redactObject } from './redact.js';

const LOG_DIR = path.join(os.homedir(), '.janex', 'logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024;

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private logLevel: LogLevel = LogLevel.INFO;
  private logFile?: string;

  constructor() {
    this.ensureLogDir();
    this.rotateLogs();
  }

  private ensureLogDir(): void {
    fs.ensureDirSync(LOG_DIR);
    this.logFile = path.join(LOG_DIR, `janex-${new Date().toISOString().split('T')[0]}.log`);
  }

  private rotateLogs(): void {
    if (!this.logFile || !fs.existsSync(this.logFile)) return;
    const stats = fs.statSync(this.logFile);
    if (stats.size > MAX_LOG_SIZE) {
      const rotated = this.logFile.replace('.log', `-${Date.now()}.log`);
      fs.renameSync(this.logFile, rotated);
    }
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.log('DEBUG', message, args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.log('INFO', message, args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.log('WARN', message, args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      this.log('ERROR', message, args);
    }
  }

  private log(level: string, message: string, args: any[]): void {
    const timestamp = new Date().toISOString();
    const safeMessage = redactSecrets(message);
    const formatted = args.length > 0 ? `${safeMessage} ${args.map(a => JSON.stringify(redactObject(a))).join(' ')}` : safeMessage;
    const line = `[${timestamp}] [${level}] ${formatted}`;

    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, line + '\n');
      } catch {}
    }

    if (level === 'ERROR') {
      console.error(`\x1b[31m${line}\x1b[0m`);
    } else if (level === 'WARN') {
      console.warn(`\x1b[33m${line}\x1b[0m`);
    } else if (level === 'DEBUG') {
      console.debug(`\x1b[36m${line}\x1b[0m`);
    }
  }

  getLogPath(): string {
    return this.logFile || path.join(LOG_DIR, 'janex.log');
  }
}

export const logger = new Logger();

