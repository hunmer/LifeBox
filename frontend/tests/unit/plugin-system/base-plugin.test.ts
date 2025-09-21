import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BasePlugin } from '../../../src/lib/plugin-system/base-plugin';
import type { PluginAPI, PluginManifest } from '../../../../../shared/src/types/plugin';

// Test plugin implementation
class TestPlugin extends BasePlugin {
  private loadCalled = false;
  private unloadCalled = false;

  async onLoad(): Promise<void> {
    this.loadCalled = true;
  }

  async onUnload(): Promise<void> {
    this.unloadCalled = true;
  }

  public isLoadCalled(): boolean {
    return this.loadCalled;
  }

  public isUnloadCalled(): boolean {
    return this.unloadCalled;
  }

  // Expose protected methods for testing
  public testCreateContainer(id: string): HTMLElement {
    return this.createContainer(id);
  }

  public testEmit(eventType: string, data: any): void {
    this.emit(eventType, data);
  }

  public testOn(eventType: string, handler: Function): void {
    this.on(eventType, handler);
  }

  public async testGetStorage(key: string): Promise<any> {
    return this.getStorage(key);
  }

  public async testSetStorage(key: string, value: any): Promise<void> {
    return this.setStorage(key, value);
  }

  public async testHttpGet(url: string): Promise<any> {
    return this.httpGet(url);
  }

  public async testHttpPost(url: string, data: any): Promise<any> {
    return this.httpPost(url, data);
  }
}

describe('BasePlugin', () => {
  let mockAPI: PluginAPI;
  let mockManifest: PluginManifest;
  let testPlugin: TestPlugin;

  beforeEach(() => {
    document.body.innerHTML = '<div id="plugin-root"></div>';

    // Mock plugin API
    mockAPI = {
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        emitLifeBoxEvent: vi.fn().mockResolvedValue({ id: '', type: '', data: {}, source: '', timestamp: 0 }),
        cancelEvent: vi.fn(),
        modifyEventData: vi.fn()
      },
      storage: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
        keys: vi.fn().mockResolvedValue([])
      },
      ui: {
        createContainer: vi.fn().mockReturnValue(document.createElement('div')),
        removeContainer: vi.fn(),
        showNotification: vi.fn(),
        showDialog: vi.fn().mockResolvedValue({}),
        addMenuItem: vi.fn(),
        removeMenuItem: vi.fn()
      },
      http: {
        get: vi.fn().mockResolvedValue({}),
        post: vi.fn().mockResolvedValue({}),
        put: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({})
      },
      config: {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        getAll: vi.fn().mockReturnValue({}),
        reset: vi.fn().mockResolvedValue(undefined)
      },
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    };

    // Mock plugin manifest
    mockManifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
      entry: 'plugin.js',
      permissions: []
    };

    testPlugin = new TestPlugin(mockAPI, mockManifest);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Constructor', () => {
    it('should initialize with API and manifest', () => {
      expect(testPlugin.getId()).toBe('test-plugin');
      expect(testPlugin.getName()).toBe('Test Plugin');
      expect(testPlugin.getVersion()).toBe('1.0.0');
    });
  });

  describe('Lifecycle methods', () => {
    it('should call onLoad when implemented', async () => {
      await testPlugin.onLoad();
      expect(testPlugin.isLoadCalled()).toBe(true);
    });

    it('should call onUnload when implemented', async () => {
      await testPlugin.onUnload();
      expect(testPlugin.isUnloadCalled()).toBe(true);
    });
  });

  describe('Container management', () => {
    it('should create container with correct ID', () => {
      const container = testPlugin.testCreateContainer('test-container');
      
      expect(container).toBeInstanceOf(HTMLElement);
      expect(container.id).toBe('plugin-test-container');
      expect(container.className).toContain('plugin-container');
    });

    it('should append container to plugin root', () => {
      const pluginRoot = document.getElementById('plugin-root');
      const container = testPlugin.testCreateContainer('test-container');
      
      expect(pluginRoot?.contains(container)).toBe(true);
    });
  });

  describe('Event system integration', () => {
    it('should emit events through API', () => {
      const eventData = { message: 'test' };
      testPlugin.testEmit('test-event', eventData);
      
      expect(mockAPI.events.emit).toHaveBeenCalledWith('test-event', eventData);
    });

    it('should register event listeners through API', () => {
      const handler = vi.fn();
      testPlugin.testOn('test-event', handler);
      
      expect(mockAPI.events.on).toHaveBeenCalledWith('test-event', handler);
    });
  });

  describe('Storage integration', () => {
    it('should get storage through API', async () => {
      mockAPI.storage.get = vi.fn().mockResolvedValue('test-value');
      
      const result = await testPlugin.testGetStorage('test-key');
      
      expect(mockAPI.storage.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe('test-value');
    });

    it('should set storage through API', async () => {
      await testPlugin.testSetStorage('test-key', 'test-value');
      
      expect(mockAPI.storage.set).toHaveBeenCalledWith('test-key', 'test-value');
    });
  });

  describe('HTTP integration', () => {
    it('should make GET requests through API', async () => {
      const mockResponse = { data: 'test' };
      mockAPI.http.get = vi.fn().mockResolvedValue(mockResponse);
      
      const result = await testPlugin.testHttpGet('/api/test');
      
      expect(mockAPI.http.get).toHaveBeenCalledWith('/api/test');
      expect(result).toEqual(mockResponse);
    });

    it('should make POST requests through API', async () => {
      const postData = { message: 'test' };
      const mockResponse = { success: true };
      mockAPI.http.post = vi.fn().mockResolvedValue(mockResponse);
      
      const result = await testPlugin.testHttpPost('/api/test', postData);
      
      expect(mockAPI.http.post).toHaveBeenCalledWith('/api/test', postData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Plugin metadata', () => {
    it('should return correct plugin ID', () => {
      expect(testPlugin.getId()).toBe('test-plugin');
    });

    it('should return correct plugin name', () => {
      expect(testPlugin.getName()).toBe('Test Plugin');
    });

    it('should return correct plugin version', () => {
      expect(testPlugin.getVersion()).toBe('1.0.0');
    });
  });

  describe('Error handling', () => {
    it('should handle missing plugin root gracefully', () => {
      // Remove plugin root
      document.body.innerHTML = '';
      
      const container = testPlugin.testCreateContainer('test-container');
      
      expect(container).toBeInstanceOf(HTMLElement);
      expect(container.id).toBe('plugin-test-container');
      // Should not throw error even without plugin root
    });

    it('should handle API errors gracefully', async () => {
      mockAPI.storage.get = vi.fn().mockRejectedValue(new Error('Storage error'));
      
      await expect(testPlugin.testGetStorage('test-key')).rejects.toThrow('Storage error');
    });

    it('should handle HTTP errors gracefully', async () => {
      mockAPI.http.get = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(testPlugin.testHttpGet('/api/test')).rejects.toThrow('Network error');
    });
  });
});