import { Page, Locator, expect } from '@playwright/test';

/**
 * E2E Test Helper Functions for LifeBox
 */

export class LifeBoxTestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the main app to load
   */
  async waitForAppToLoad() {
    await this.page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });
    await expect(this.page.locator('[data-testid="app-container"]')).toBeVisible();
  }

  /**
   * Plugin system helpers
   */
  async waitForPluginToLoad(pluginId: string) {
    await this.page.waitForFunction(
      (id) => window.LifeBoxPlugins && window.LifeBoxPlugins[id],
      pluginId,
      { timeout: 5000 }
    );
  }

  async loadPlugin(pluginPath: string) {
    await this.page.evaluate((path) => {
      return window.LifeBoxAPI?.pluginLoader?.loadPlugin(path);
    }, pluginPath);
  }

  async getLoadedPlugins() {
    return await this.page.evaluate(() => {
      return Object.keys(window.LifeBoxPlugins || {});
    });
  }

  /**
   * Event system helpers
   */
  async emitEvent(eventType: string, data: any) {
    await this.page.evaluate(
      ({ type, eventData }) => {
        window.LifeBoxAPI?.events?.emit(type, eventData);
      },
      { type: eventType, eventData: data }
    );
  }

  async waitForEvent(eventType: string, timeout = 5000) {
    return await this.page.waitForFunction(
      (type) => {
        return new Promise((resolve) => {
          const handler = (event: any) => {
            if (event.type === type) {
              resolve(event);
            }
          };
          window.LifeBoxAPI?.events?.on(type, handler);
        });
      },
      eventType,
      { timeout }
    );
  }

  /**
   * Chat plugin helpers
   */
  async createChannel(name: string, description?: string) {
    const createButton = this.page.locator('[data-testid="create-channel-btn"]');
    await createButton.click();

    await this.page.fill('[data-testid="channel-name-input"]', name);
    if (description) {
      await this.page.fill('[data-testid="channel-description-input"]', description);
    }

    await this.page.click('[data-testid="create-channel-submit"]');
    await this.page.waitForSelector(`[data-testid="channel-${name}"]`);
  }

  async selectChannel(channelName: string) {
    await this.page.click(`[data-testid="channel-${channelName}"]`);
    await this.page.waitForSelector('[data-testid="chat-messages"]');
  }

  async sendMessage(content: string) {
    await this.page.fill('[data-testid="message-input"]', content);
    await this.page.click('[data-testid="send-message-btn"]');
    
    // Wait for message to appear
    await this.page.waitForSelector(`text="${content}"`);
  }

  async getChannelList() {
    const channels = await this.page.locator('[data-testid^="channel-"]').all();
    return Promise.all(
      channels.map(async (channel) => {
        const text = await channel.textContent();
        return text?.trim() || '';
      })
    );
  }

  async getMessages() {
    const messages = await this.page.locator('[data-testid="message"]').all();
    return Promise.all(
      messages.map(async (message) => {
        const content = await message.locator('[data-testid="message-content"]').textContent();
        const author = await message.locator('[data-testid="message-author"]').textContent();
        return { content: content?.trim() || '', author: author?.trim() || '' };
      })
    );
  }

  /**
   * UI interaction helpers
   */
  async clickAndWait(selector: string, waitFor?: string) {
    await this.page.click(selector);
    if (waitFor) {
      await this.page.waitForSelector(waitFor);
    }
  }

  async fillAndSubmit(formSelector: string, data: Record<string, string>) {
    for (const [field, value] of Object.entries(data)) {
      await this.page.fill(`${formSelector} [name="${field}"]`, value);
    }
    await this.page.click(`${formSelector} [type="submit"]`);
  }

  /**
   * Screenshot helpers
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Storage helpers
   */
  async clearLocalStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  async setLocalStorage(key: string, value: string) {
    await this.page.evaluate(
      ({ k, v }) => localStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  async getLocalStorage(key: string) {
    return await this.page.evaluate(
      (k) => localStorage.getItem(k),
      key
    );
  }

  /**
   * Network helpers
   */
  async mockApiResponse(url: string, response: any) {
    await this.page.route(url, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  async interceptApiCall(url: string) {
    const requests: any[] = [];
    await this.page.route(url, (route) => {
      requests.push({
        method: route.request().method(),
        url: route.request().url(),
        headers: route.request().headers(),
        postData: route.request().postData(),
      });
      route.continue();
    });
    return requests;
  }
}

/**
 * Global helper to create test helpers instance
 */
export function createTestHelpers(page: Page) {
  return new LifeBoxTestHelpers(page);
}