import { test, expect } from '@playwright/test';
import { createTestHelpers } from '../utils/test-helpers';

test.describe('LifeBox Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main application', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Wait for app to load
    await helpers.waitForAppToLoad();
    
    // Check for main components
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('LifeBox');
  });

  test('should have responsive design', async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.waitForAppToLoad();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
  });

  test('should handle navigation', async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.waitForAppToLoad();

    // Test navigation between sections
    const navItems = page.locator('[data-testid^="nav-"]');
    const count = await navItems.count();
    
    if (count > 0) {
      await navItems.first().click();
      // Verify navigation worked
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    }
  });
});