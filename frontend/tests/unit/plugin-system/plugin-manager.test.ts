import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PluginManager } from '../../../src/lib/plugin-system/plugin-manager';
import { PluginLoader } from '../../../src/lib/plugin-system/plugin-loader';
import type { PluginManifest, PluginInfo, PluginStatus } from '@lifebox/shared';

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockPluginLoader: PluginLoader;

  beforeEach(() => {
    document.body.innerHTML = '<div id="plugin-root"></div>';
    
    // Mock PluginLoader
    mockPluginLoader = {
      loadPlugin: vi.fn(),
      unloadPlugin: vi.fn(),
      getLoadedPlugins: vi.fn(),
      getPluginInfo: vi.fn(),
      isPluginLoaded: vi.fn()
    } as any;

    pluginManager = new PluginManager(mockPluginLoader);
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Constructor', () => {
    it('should initialize with plugin loader', () => {
      expect(pluginManager).toBeInstanceOf(PluginManager);
    });

    it('should create default plugin loader if none provided', () => {
      const manager = new PluginManager();
      expect(manager).toBeInstanceOf(PluginManager);
    });
  });

  describe('installPlugin', () => {
    const mockManifest: PluginManifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
      entry: 'plugin.js',
      permissions: []
    };

    const mockPluginInfo: PluginInfo = {
      manifest: mockManifest,
      status: PluginStatus.LOADED,
      loadTime: Date.now()
    };

    it('should install and load plugin successfully', async () => {
      mockPluginLoader.loadPlugin = vi.fn().mockResolvedValue(mockPluginInfo);
      
      const result = await pluginManager.installPlugin('/plugins/test-plugin');
      
      expect(mockPluginLoader.loadPlugin).toHaveBeenCalledWith('/plugins/test-plugin');
      expect(result).toEqual(mockPluginInfo);
    });

    it('should handle plugin installation errors', async () => {
      const error = new Error('Installation failed');
      mockPluginLoader.loadPlugin = vi.fn().mockRejectedValue(error);
      
      await expect(pluginManager.installPlugin('/plugins/test-plugin'))
        .rejects.toThrow('Installation failed');
    });

    it('should validate plugin manifest before installation', async () => {
      const invalidManifest = { ...mockManifest, id: '' };
      const invalidPluginInfo = { ...mockPluginInfo, manifest: invalidManifest };
      
      mockPluginLoader.loadPlugin = vi.fn().mockResolvedValue(invalidPluginInfo);
      
      await expect(pluginManager.installPlugin('/plugins/invalid-plugin'))
        .rejects.toThrow('Invalid plugin manifest');
    });
  });

  describe('uninstallPlugin', () => {
    it('should uninstall plugin successfully', async () => {
      mockPluginLoader.unloadPlugin = vi.fn().mockResolvedValue(true);
      
      const result = await pluginManager.uninstallPlugin('test-plugin');
      
      expect(mockPluginLoader.unloadPlugin).toHaveBeenCalledWith('test-plugin');
      expect(result).toBe(true);
    });

    it('should return false when plugin is not found', async () => {
      mockPluginLoader.unloadPlugin = vi.fn().mockResolvedValue(false);
      
      const result = await pluginManager.uninstallPlugin('non-existent-plugin');
      
      expect(result).toBe(false);
    });
  });

  describe('enablePlugin', () => {
    const mockPluginInfo: PluginInfo = {
      manifest: {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        entry: 'plugin.js',
        permissions: []
      },
      status: PluginStatus.LOADED,
      instance: {
        onActivate: vi.fn(),
        getId: () => 'test-plugin'
      } as any
    };

    it('should enable loaded plugin successfully', async () => {
      mockPluginLoader.getPluginInfo = vi.fn().mockReturnValue(mockPluginInfo);
      
      const result = await pluginManager.enablePlugin('test-plugin');
      
      expect(result).toBe(true);
      expect(mockPluginInfo.instance?.onActivate).toHaveBeenCalled();
    });

    it('should return false when plugin is not found', async () => {
      mockPluginLoader.getPluginInfo = vi.fn().mockReturnValue(undefined);
      
      const result = await pluginManager.enablePlugin('non-existent-plugin');
      
      expect(result).toBe(false);
    });

    it('should handle plugins without onActivate method', async () => {
      const pluginWithoutActivate = {
        ...mockPluginInfo,
        instance: {
          getId: () => 'test-plugin'
        } as any
      };
      
      mockPluginLoader.getPluginInfo = vi.fn().mockReturnValue(pluginWithoutActivate);
      
      const result = await pluginManager.enablePlugin('test-plugin');
      
      expect(result).toBe(true);
    });
  });

  describe('disablePlugin', () => {
    const mockPluginInfo: PluginInfo = {
      manifest: {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        entry: 'plugin.js',
        permissions: []
      },
      status: PluginStatus.ACTIVE,
      instance: {
        onDeactivate: vi.fn(),
        getId: () => 'test-plugin'
      } as any
    };

    it('should disable active plugin successfully', async () => {
      mockPluginLoader.getPluginInfo = vi.fn().mockReturnValue(mockPluginInfo);
      
      const result = await pluginManager.disablePlugin('test-plugin');
      
      expect(result).toBe(true);
      expect(mockPluginInfo.instance?.onDeactivate).toHaveBeenCalled();
    });

    it('should return false when plugin is not found', async () => {
      mockPluginLoader.getPluginInfo = vi.fn().mockReturnValue(undefined);
      
      const result = await pluginManager.disablePlugin('non-existent-plugin');
      
      expect(result).toBe(false);
    });
  });

  describe('getInstalledPlugins', () => {
    it('should return list of installed plugins', () => {
      const mockPlugins: PluginInfo[] = [
        {
          manifest: {
            id: 'plugin1',
            name: 'Plugin 1',
            version: '1.0.0',
            description: 'First plugin',
            entry: 'plugin.js',
            permissions: []
          },
          status: PluginStatus.LOADED
        },
        {
          manifest: {
            id: 'plugin2',
            name: 'Plugin 2',
            version: '2.0.0',
            description: 'Second plugin',
            entry: 'plugin.js',
            permissions: []
          },
          status: PluginStatus.ACTIVE
        }
      ];

      mockPluginLoader.getLoadedPlugins = vi.fn().mockReturnValue(mockPlugins);
      
      const result = pluginManager.getInstalledPlugins();
      
      expect(result).toEqual(mockPlugins);
      expect(mockPluginLoader.getLoadedPlugins).toHaveBeenCalled();
    });

    it('should return empty array when no plugins installed', () => {
      mockPluginLoader.getLoadedPlugins = vi.fn().mockReturnValue([]);
      
      const result = pluginManager.getInstalledPlugins();
      
      expect(result).toEqual([]);
    });
  });

  describe('getPluginInfo', () => {
    it('should return plugin info when plugin exists', () => {
      const mockPluginInfo: PluginInfo = {
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'A test plugin',
          entry: 'plugin.js',
          permissions: []
        },
        status: PluginStatus.LOADED
      };

      mockPluginLoader.getPluginInfo = vi.fn().mockReturnValue(mockPluginInfo);
      
      const result = pluginManager.getPluginInfo('test-plugin');
      
      expect(result).toEqual(mockPluginInfo);
      expect(mockPluginLoader.getPluginInfo).toHaveBeenCalledWith('test-plugin');
    });

    it('should return undefined when plugin does not exist', () => {
      mockPluginLoader.getPluginInfo = vi.fn().mockReturnValue(undefined);
      
      const result = pluginManager.getPluginInfo('non-existent-plugin');
      
      expect(result).toBeUndefined();
    });
  });

  describe('isPluginInstalled', () => {
    it('should return true when plugin is installed', () => {
      mockPluginLoader.isPluginLoaded = vi.fn().mockReturnValue(true);
      
      const result = pluginManager.isPluginInstalled('test-plugin');
      
      expect(result).toBe(true);
      expect(mockPluginLoader.isPluginLoaded).toHaveBeenCalledWith('test-plugin');
    });

    it('should return false when plugin is not installed', () => {
      mockPluginLoader.isPluginLoaded = vi.fn().mockReturnValue(false);
      
      const result = pluginManager.isPluginInstalled('test-plugin');
      
      expect(result).toBe(false);
    });
  });

  describe('Plugin lifecycle management', () => {
    it('should track plugin states correctly', async () => {
      const mockPluginInfo: PluginInfo = {
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'A test plugin',
          entry: 'plugin.js',
          permissions: []
        },
        status: PluginStatus.LOADED,
        instance: {
          onActivate: vi.fn(),
          onDeactivate: vi.fn(),
          getId: () => 'test-plugin'
        } as any
      };

      // Install plugin
      mockPluginLoader.loadPlugin = vi.fn().mockResolvedValue(mockPluginInfo);
      mockPluginLoader.getPluginInfo = vi.fn().mockReturnValue(mockPluginInfo);
      
      await pluginManager.installPlugin('/plugins/test-plugin');
      
      // Enable plugin
      await pluginManager.enablePlugin('test-plugin');
      expect(mockPluginInfo.instance?.onActivate).toHaveBeenCalled();
      
      // Disable plugin
      await pluginManager.disablePlugin('test-plugin');
      expect(mockPluginInfo.instance?.onDeactivate).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle errors in plugin lifecycle methods', async () => {
      const mockPluginInfo: PluginInfo = {
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'A test plugin',
          entry: 'plugin.js',
          permissions: []
        },
        status: PluginStatus.LOADED,
        instance: {
          onActivate: vi.fn().mockRejectedValue(new Error('Activation failed')),
          getId: () => 'test-plugin'
        } as any
      };

      mockPluginLoader.getPluginInfo = vi.fn().mockReturnValue(mockPluginInfo);
      
      // Should still return false if activation fails
      const result = await pluginManager.enablePlugin('test-plugin');
      expect(result).toBe(false);
    });
  });
});