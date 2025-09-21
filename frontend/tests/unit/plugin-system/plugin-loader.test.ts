import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PluginLoader } from '../../../src/lib/plugin-system/plugin-loader';
import type { PluginManifest, PluginInfo } from '../../../../../shared/src/types/plugin';

describe('PluginLoader', () => {
  let pluginLoader: PluginLoader;

  beforeEach(() => {
    // Setup DOM environment
    document.body.innerHTML = '<div id="plugin-root"></div>';
    pluginLoader = new PluginLoader();
    
    // Clear any previous mocks
    vi.clearAllMocks();
    
    // Reset global plugin registry
    (window as any).LifeBoxPlugins = {};
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Remove any added script tags
    const scripts = document.querySelectorAll('script[data-plugin]');
    scripts.forEach(script => script.remove());
  });

  describe('loadPlugin', () => {
    it('should load a valid plugin successfully', async () => {
      // 🔴 Red Phase: Write failing test first
      
      // Mock plugin manifest
      const mockManifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        entry: 'plugin.js',
        permissions: []
      };

      // Mock fetch response for manifest
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockManifest)
      });

      // Mock plugin class that will be loaded
      const mockPluginClass = vi.fn().mockImplementation(() => ({
        onLoad: vi.fn(),
        onUnload: vi.fn(),
        getId: () => 'test-plugin'
      }));

      // Mock script loading
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'script') {
          const script = originalCreateElement.call(document, 'script') as HTMLScriptElement;
          
          // Simulate script loading
          setTimeout(() => {
            // Register mock plugin
            (window as any).LifeBoxPlugins = {
              'test-plugin': mockPluginClass
            };
            script.onload?.(new Event('load'));
          }, 0);
          
          return script;
        }
        return originalCreateElement.call(document, tagName);
      });

      // Act
      const pluginInfo = await pluginLoader.loadPlugin('/plugins/test-plugin');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/plugins/test-plugin/manifest.json');
      expect(pluginInfo).toBeDefined();
      expect(pluginInfo.manifest.id).toBe('test-plugin');
      expect(pluginInfo.status).toBe('loaded');
      expect(mockPluginClass).toHaveBeenCalled();

      // Restore createElement
      document.createElement = originalCreateElement;
    });

    it('should handle manifest loading errors gracefully', async () => {
      // Mock fetch failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(pluginLoader.loadPlugin('/invalid-plugin'))
        .rejects.toThrow('Failed to load plugin manifest');
    });

    it('should prevent loading the same plugin twice', async () => {
      // Mock plugin manifest
      const mockManifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        entry: 'plugin.js',
        permissions: []
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockManifest)
      });

      const mockPluginClass = vi.fn().mockImplementation(() => ({
        onLoad: vi.fn(),
        onUnload: vi.fn(),
        getId: () => 'test-plugin'
      }));

      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'script') {
          const script = originalCreateElement.call(document, 'script') as HTMLScriptElement;
          setTimeout(() => {
            (window as any).LifeBoxPlugins = { 'test-plugin': mockPluginClass };
            script.onload?.(new Event('load'));
          }, 0);
          return script;
        }
        return originalCreateElement.call(document, tagName);
      });

      // Load plugin first time
      await pluginLoader.loadPlugin('/plugins/test-plugin');

      // Try to load same plugin again
      const result = await pluginLoader.loadPlugin('/plugins/test-plugin');

      expect(result.status).toBe('loaded'); // Should return existing plugin
      expect(mockPluginClass).toHaveBeenCalledTimes(1); // Should not create new instance

      document.createElement = originalCreateElement;
    });

    it('should handle script loading errors', async () => {
      const mockManifest: PluginManifest = {
        id: 'broken-plugin',
        name: 'Broken Plugin',
        version: '1.0.0',
        description: 'A broken plugin',
        entry: 'plugin.js',
        permissions: []
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockManifest)
      });

      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'script') {
          const script = originalCreateElement.call(document, 'script') as HTMLScriptElement;
          setTimeout(() => {
            script.onerror?.(new Event('error'));
          }, 0);
          return script;
        }
        return originalCreateElement.call(document, tagName);
      });

      await expect(pluginLoader.loadPlugin('/plugins/broken-plugin'))
        .rejects.toThrow('Failed to load plugin script');

      document.createElement = originalCreateElement;
    });
  });

  describe('unloadPlugin', () => {
    it('should unload a loaded plugin successfully', async () => {
      // First load a plugin
      const mockManifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        entry: 'plugin.js',
        permissions: []
      };

      const mockPluginInstance = {
        onLoad: vi.fn(),
        onUnload: vi.fn(),
        getId: () => 'test-plugin'
      };

      const mockPluginClass = vi.fn().mockImplementation(() => mockPluginInstance);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockManifest)
      });

      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'script') {
          const script = originalCreateElement.call(document, 'script') as HTMLScriptElement;
          setTimeout(() => {
            (window as any).LifeBoxPlugins = { 'test-plugin': mockPluginClass };
            script.onload?.(new Event('load'));
          }, 0);
          return script;
        }
        return originalCreateElement.call(document, tagName);
      });

      await pluginLoader.loadPlugin('/plugins/test-plugin');

      // Now unload it
      const result = await pluginLoader.unloadPlugin('test-plugin');

      expect(result).toBe(true);
      expect(mockPluginInstance.onUnload).toHaveBeenCalled();

      document.createElement = originalCreateElement;
    });

    it('should return false when trying to unload non-existent plugin', async () => {
      const result = await pluginLoader.unloadPlugin('non-existent-plugin');
      expect(result).toBe(false);
    });
  });

  describe('getLoadedPlugins', () => {
    it('should return empty array when no plugins are loaded', () => {
      const plugins = pluginLoader.getLoadedPlugins();
      expect(plugins).toEqual([]);
    });

    it('should return loaded plugins info', async () => {
      // Load a plugin first
      const mockManifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        entry: 'plugin.js',
        permissions: []
      };

      const mockPluginClass = vi.fn().mockImplementation(() => ({
        onLoad: vi.fn(),
        onUnload: vi.fn(),
        getId: () => 'test-plugin'
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockManifest)
      });

      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'script') {
          const script = originalCreateElement.call(document, 'script') as HTMLScriptElement;
          setTimeout(() => {
            (window as any).LifeBoxPlugins = { 'test-plugin': mockPluginClass };
            script.onload?.(new Event('load'));
          }, 0);
          return script;
        }
        return originalCreateElement.call(document, tagName);
      });

      await pluginLoader.loadPlugin('/plugins/test-plugin');

      const plugins = pluginLoader.getLoadedPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].manifest.id).toBe('test-plugin');

      document.createElement = originalCreateElement;
    });
  });
});