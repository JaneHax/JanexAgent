import { browserTool } from './browser.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export interface CaptchaOptions {
  type: 'image' | 'audio' | 'grid' | 'slider' | 'hybrid';
  selector?: string;
  targetDescription?: string;
}

export class CaptchaSolver {
  async detect(): Promise<any> {
    const page = browserTool.getPage();
    if (!page) return { found: false, type: null };

    const info = await page.evaluate(() => {
      const selectors = [
        'iframe[src*="captcha"]',
        'iframe[src*="recaptcha"]',
        'iframe[src*="arkose"]',
        'iframe[src*="turnstile"]',
        'iframe[src*="hcaptcha"]',
        '.captcha',
        '#captcha',
        '[data-captcha]',
        '[data-sitekey]',
        '.g-recaptcha',
        '#g-recaptcha'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const src = el.getAttribute('src') || '';
          const sitekey = el.getAttribute('data-sitekey') || '';

          let type = 'unknown';
          if (src.includes('recaptcha') || sitekey) type = 'recaptcha';
          else if (src.includes('arkose')) type = 'arkose';
          else if (src.includes('turnstile')) type = 'turnstile';
          else if (src.includes('hcaptcha')) type = 'hcaptcha';
          else if (src.includes('captcha')) type = 'generic';

          return { found: true, selector: sel, type, src: src.slice(0, 100), sitekey };
        }
      }
      return { found: false };
    });

    return info;
  }

  async solve(options: CaptchaOptions): Promise<string> {
    const detected = await this.detect();
    if (!detected.found) return 'No CAPTCHA detected on page';

    const type = options.type || 'hybrid';

    if (detected.type === 'recaptcha') {
      return await this.solveRecaptcha(detected);
    } else if (detected.type === 'arkose') {
      return await this.solveArkose(detected);
    } else if (detected.type === 'turnstile') {
      return await this.solveTurnstile(detected);
    } else if (type === 'grid') {
      return await this.solveGrid(options);
    } else if (type === 'slider') {
      return await this.solveSlider(options);
    }

    return await this.solveGeneric(detected, type);
  }

  private async solveRecaptcha(detected: any): Promise<string> {
    const page = browserTool.getPage();
    if (!page) return 'No active page';

    try {
      if (detected.sitekey) {
        return `reCAPTCHA detected (sitekey: ${detected.sitekey.slice(0, 20)}...). Use 2captcha/anticaptcha service for solving, or solve manually.`;
      }

      const frame = await this.findCaptchaFrame(page);
      if (frame) {
        const checkbox = await frame.$('.recaptcha-checkbox-border');
        if (checkbox) {
          await checkbox.click();
          await page.waitForTimeout(2000);
          return 'reCAPTCHA checkbox clicked. Waiting for challenge...';
        }
      }

      return 'reCAPTCHA detected. Manual intervention or external solving service required.';
    } catch (error: any) {
      return `reCAPTCHA solve error: ${error.message}`;
    }
  }

  private async solveArkose(detected: any): Promise<string> {
    return 'Arkose/FunCaptcha detected. Use image/audio solving via vision model or external service.';
  }

  private async solveTurnstile(detected: any): Promise<string> {
    const page = browserTool.getPage();
    if (!page) return 'No active page';

    try {
      const turnstile = await page.$('.cf-turnstile, [data-turnstile]');
      if (turnstile) {
        await turnstile.click();
        await page.waitForTimeout(2000);
        return 'Turnstile widget clicked.';
      }
      return 'Turnstile detected but widget not found.';
    } catch (error: any) {
      return `Turnstile error: ${error.message}`;
    }
  }

  private async solveGrid(options: CaptchaOptions): Promise<string> {
    const selector = options.selector || '.captcha-grid, [data-captcha-grid]';
    const page = browserTool.getPage();
    if (!page) return 'No active page';

    const tiles = await page.$$(`${selector} img, ${selector} [data-tile], ${selector} .captcha-cell`);
    if (tiles.length === 0) return 'No tiles found';

    const screenshotPath = path.join(os.tmpdir(), `captcha-grid-${Date.now()}.png`);
    await browserTool.screenshot(screenshotPath);

    return `Found ${tiles.length} tiles. Screenshot: ${screenshotPath}\nTarget: ${options.targetDescription || 'unknown'}\nUse vision model to identify and click tiles.`;
  }

  private async solveSlider(options: CaptchaOptions): Promise<string> {
    const selector = options.selector || '.captcha-slider, [data-captcha-slider], .slider';
    const page = browserTool.getPage();
    if (!page) return 'No active page';

    try {
      const slider = await page.$(selector);
      if (!slider) return 'Slider element not found';

      const box = await slider.boundingBox();
      if (!box) return 'Slider bounding box not found';

      await page.hover(selector);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width + 60, box.y, { steps: 35 });
      await page.waitForTimeout(300);
      await page.mouse.up();

      return `Slider moved to ${box.x + box.width + 60}px`;
    } catch (error: any) {
      return `Slider error: ${error.message}`;
    }
  }

  private async solveGeneric(detected: any, type: string): Promise<string> {
    const screenshotPath = path.join(os.tmpdir(), `captcha-${Date.now()}.png`);
    await browserTool.screenshot(screenshotPath);

    return `Generic CAPTCHA detected (${detected.type}).\nScreenshot: ${screenshotPath}\nUse vision model to analyze and solve.`;
  }

  private async findCaptchaFrame(page: any): Promise<any> {
    const frames = page.frames();
    for (const frame of frames) {
      const url = frame.url();
      if (url.includes('recaptcha') || url.includes('captcha')) {
        return frame;
      }
    }
    return null;
  }

  async clickTile(selector: string, index: number): Promise<string> {
    const page = browserTool.getPage();
    if (!page) return 'No active page';

    const tiles = await page.$$(`${selector} img, ${selector} [data-tile]`);
    if (index >= tiles.length) return `Tile index ${index} out of range (${tiles.length} tiles)`;

    await tiles[index].click();
    return `Clicked tile ${index}`;
  }

  async captchaVerify(): Promise<string> {
    const page = browserTool.getPage();
    if (!page) return 'No active page';

    const verifyBtn = await page.$('.captcha-verify, [data-captcha-verify], button[type="submit"]');
    if (verifyBtn) {
      await verifyBtn.click();
      await page.waitForTimeout(2000);
      return 'Verify button clicked';
    }
    return 'Verify button not found';
  }
}

export const captchaSolver = new CaptchaSolver();
