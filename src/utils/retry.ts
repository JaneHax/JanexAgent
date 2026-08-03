export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoff?: 'linear' | 'exponential';
  retryOn?: (error: any) => boolean;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const delayMs = options.delayMs ?? 1000;
  const backoff = options.backoff ?? 'exponential';
  const retryOn = options.retryOn ?? (() => true);

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !retryOn(error)) {
        throw error;
      }

      const delay = backoff === 'exponential' ? delayMs * Math.pow(2, attempt) : delayMs * (attempt + 1);
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function classifyError(error: any): 'network' | 'rate_limit' | 'auth' | 'server' | 'client' | 'unknown' {
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';

  if (code.includes('timeout') || message.includes('timeout') || message.includes('econnreset') || message.includes('enotfound')) {
    return 'network';
  }
  if (code.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
    return 'rate_limit';
  }
  if (code.includes('401') || code.includes('403') || message.includes('unauthorized') || message.includes('forbidden')) {
    return 'auth';
  }
  if (code.includes('500') || code.includes('502') || code.includes('503') || message.includes('server error')) {
    return 'server';
  }
  if (code.includes('400') || code.includes('404') || message.includes('bad request') || message.includes('not found')) {
    return 'client';
  }
  return 'unknown';
}

export function shouldRetry(errorType: string): boolean {
  return ['network', 'rate_limit', 'server'].includes(errorType);
}
