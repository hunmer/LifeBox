import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock global objects for plugin system
global.fetch = vi.fn();

// Mock window.LifeBoxAPI and window.LifeBoxPlugins
(global as any).window = Object.assign(global.window || {}, {
  LifeBoxAPI: {},
  LifeBoxPlugins: {},
});

// Mock DOM methods
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:1420',
    origin: 'http://localhost:1420',
  },
  writable: true,
});