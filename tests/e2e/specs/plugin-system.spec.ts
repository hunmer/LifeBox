import { test, expect } from '@playwright/test';
import { createTestHelpers } from '../utils/test-helpers';

test.describe('Plugin System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should initialize plugin system', async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.waitForAppToLoad();

    // Check if plugin system is available
    const hasPluginSystem = await page.evaluate(() => {
      return !!(window.LifeBoxAPI && window.LifeBoxPlugins);
    });

    expect(hasPluginSystem).toBe(true);
  });

  test('should load plugins', async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.waitForAppToLoad();

    // Get initially loaded plugins
    const initialPlugins = await helpers.getLoadedPlugins();
    expect(Array.isArray(initialPlugins)).toBe(true);

    // Mock plugin loading (since we don't have actual plugins in test)
    await page.evaluate(() => {
      window.LifeBoxPlugins = window.LifeBoxPlugins || {};
      window.LifeBoxPlugins['test-plugin'] = class TestPlugin {
        onLoad() { console.log('Test plugin loaded'); }
        onUnload() { console.log('Test plugin unloaded'); }
      };
    });

    const pluginsAfterLoad = await helpers.getLoadedPlugins();
    expect(pluginsAfterLoad).toContain('test-plugin');
  });

  test('should handle plugin events', async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.waitForAppToLoad();

    // Set up event listener
    const eventPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        const handler = (event: any) => {
          resolve(event);
        };
        window.LifeBoxAPI?.events?.on('test:event', handler);
      });
    });

    // Emit test event
    await helpers.emitEvent('test:event', { message: 'Hello from test' });

    // Wait for event to be received
    const receivedEvent = await Promise.race([
      eventPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Event timeout')), 5000))
    ]);

    expect(receivedEvent).toBeDefined();
  });

  test('should provide plugin API', async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.waitForAppToLoad();

    // Check if all required API methods are available
    const apiMethods = await page.evaluate(() => {
      const api = window.LifeBoxAPI;
      return {
        hasEvents: !!(api?.events),
        hasStorage: !!(api?.storage),
        hasUI: !!(api?.ui),
        hasHttp: !!(api?.http),
      };
    });

    expect(apiMethods.hasEvents).toBe(true);
    expect(apiMethods.hasStorage).toBe(true);
    expect(apiMethods.hasUI).toBe(true);
    expect(apiMethods.hasHttp).toBe(true);
  });
});