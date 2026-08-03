// @ts-nocheck
import { chromium } from 'playwright';
import path from 'path';
import os from 'os';

export interface BrowserOptions {
  headless?: boolean;
  proxy?: string;
  profile?: string;
  userDataDir?: string;
}

export class BrowserTool {
  private browser: any = null;
  private page: any = null;
  private context: any = null;
  private userDataDir?: string;

  async init(options: BrowserOptions = {}): Promise<void> {
    const profileName = options.profile || 'default';
    const homeDir = os.homedir();
    this.userDataDir = options.userDataDir || path.join(homeDir, '.janex-browser-profile', profileName);

    const args = [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--metrics-recording-only',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      '--disable-component-update'
    ];

    try {
      this.context = await chromium.launchPersistentContext(this.userDataDir, {
        headless: options.headless ?? false,
        args,
        proxy: options.proxy ? { server: options.proxy } : undefined,
        viewport: { width: 1366, height: 768 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'Asia/Jakarta',
        permissions: ['geolocation'],
        ignoreHTTPSErrors: true,
        acceptDownloads: true
      });

      this.page = await this.context.newPage();

      await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        window.chrome = { runtime: {} };
      });
    } catch (error: any) {
      throw new Error(`Browser initialization failed: ${error.message}. Ensure playwright is installed: pip install playwright && python -m playwright install chromium`);
    }
  }

  async navigate(url: string, waitUntil = 'domcontentloaded'): Promise<string> {
    if (!this.page) await this.init();
    await this.page.goto(url, { waitUntil, timeout: 30000 });
    return `Navigated to ${url}`;
  }

  async click(selector: string, force = false): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.click(selector, { force, timeout: 10000 });
    return `Clicked ${selector}`;
  }

  async fill(selector: string, value: string): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.fill(selector, value);
    return `Filled ${selector}`;
  }

  async screenshot(path?: string, fullPage = true): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    const screenshotPath = path || path.join(os.tmpdir(), `janex-screenshot-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage });
    return `Screenshot saved to ${screenshotPath}`;
  }

  async snapshot(): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    return await this.page.content();
  }

  async type(selector: string, text: string, delay = 50): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.type(selector, text, { delay });
    return `Typed into ${selector}`;
  }

  async evaluate(script: string): Promise<any> {
    if (!this.page) throw new Error('Browser not initialized');
    return await this.page.evaluate(script);
  }

  async scroll(x = 0, y = 100): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.evaluate(({ x, y }) => window.scrollBy(x, y), { x, y });
    return `Scrolled to (${x}, ${y})`;
  }

  async hover(selector: string): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.hover(selector);
    return `Hovered ${selector}`;
  }

  async select(selector: string, value: string): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.selectOption(selector, value);
    return `Selected ${value} in ${selector}`;
  }

  async press(key: string): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.keyboard.press(key);
    return `Pressed ${key}`;
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.page = null;
      this.browser = null;
    }
  }

  async getCookies(): Promise<any> {
    if (!this.page) return [];
    return await this.page.context().cookies();
  }

  async setCookie(name: string, value: string, domain: string): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.context().addCookies([{
      name,
      value,
      domain,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }]);
    return `Cookie ${name} set`;
  }

  getUserDataDir(): string | undefined {
    return this.userDataDir;
  }

  getPage(): any {
    return this.page;
  }
}

export const browserTool = new BrowserTool();
