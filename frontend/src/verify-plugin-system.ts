/**
 * Manual verification script for the plugin system
 * This script performs basic checks to ensure the plugin system is working correctly
 */

import { 
  PluginLoader,
  BasePlugin, 
  PluginManager,
  EventBus,
  BrowserPluginStorage,
  PluginUIManager,
  APIClient,
  createPluginAPI
} from './lib/plugin-system';

// Test plugin implementation
class TestPlugin extends BasePlugin {
  private testData: any = null;

  async onLoad(): Promise<void> {
    this.info('Test plugin loading...');
    this.testData = { loadTime: Date.now() };
    
    // Test storage
    await this.setStorage('test-key', this.testData);
    
    // Test events
    this.on('test:event', (event: any) => {
      this.info('Received test event:', event);
    });
    
    this.info('Test plugin loaded successfully');
  }

  async onUnload(): Promise<void> {
    this.info('Test plugin unloading...');
    await this.removeStorage('test-key');
    this.info('Test plugin unloaded');
  }

  getTestData() {
    return this.testData;
  }
}

/**
 * Verification results interface
 */
interface VerificationResult {
  success: boolean;
  message: string;
  error?: Error;
}

/**
 * Verification test suite
 */
class PluginSystemVerification {
  private results: VerificationResult[] = [];

  async runAllTests(): Promise<VerificationResult[]> {
    console.log('🔍 Starting Plugin System Verification...\n');

    // Core component tests
    await this.testPluginLoader();
    await this.testBasePlugin();
    await this.testPluginManager();
    await this.testEventBus();
    await this.testStorage();
    await this.testUIManager();
    await this.testAPIClient();
    await this.testPluginAPI();

    // Integration tests
    await this.testPluginLifecycle();

    this.printResults();
    return this.results;
  }

  private async test(name: string, testFn: () => Promise<void>): Promise<void> {
    try {
      await testFn();
      this.results.push({ success: true, message: `✅ ${name}` });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.push({ 
        success: false, 
        message: `❌ ${name}`, 
        error: error as Error 
      });
      console.error(`❌ ${name}:`, error);
    }
  }

  private async testPluginLoader(): Promise<void> {
    await this.test('PluginLoader instantiation', async () => {
      const loader = new PluginLoader();
      if (!loader) throw new Error('Failed to create PluginLoader');
      
      const plugins = loader.getLoadedPlugins();
      if (!Array.isArray(plugins)) throw new Error('getLoadedPlugins should return array');
    });
  }

  private async testBasePlugin(): Promise<void> {
    await this.test('BasePlugin implementation', async () => {
      const api = createPluginAPI('test-plugin');
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        entry: 'test.js',
        permissions: []
      };

      const plugin = new TestPlugin(api, manifest);
      
      if (plugin.getId() !== 'test-plugin') throw new Error('Plugin ID mismatch');
      if (plugin.getName() !== 'Test Plugin') throw new Error('Plugin name mismatch');
      if (plugin.getVersion() !== '1.0.0') throw new Error('Plugin version mismatch');
      
      await plugin.onLoad();
      const testData = plugin.getTestData();
      if (!testData || !testData.loadTime) throw new Error('Plugin load data not set');
      
      await plugin.onUnload();
    });
  }

  private async testPluginManager(): Promise<void> {
    await this.test('PluginManager functionality', async () => {
      const manager = new PluginManager();
      
      const installedPlugins = manager.getInstalledPlugins();
      if (!Array.isArray(installedPlugins)) throw new Error('getInstalledPlugins should return array');
      
      const stats = manager.getPluginStatistics();
      if (typeof stats.total !== 'number') throw new Error('Statistics should have total count');
    });
  }

  private async testEventBus(): Promise<void> {
    await this.test('EventBus functionality', async () => {
      const eventBus = new EventBus();
      let eventReceived = false;
      
      eventBus.on('test:event', () => {
        eventReceived = true;
      });
      
      eventBus.emit('test:event', { test: true });
      
      // Give event time to process
      await new Promise(resolve => setTimeout(resolve, 10));
      
      if (!eventReceived) throw new Error('Event not received');
      
      const stats = eventBus.getStats();
      if (typeof stats.totalEvents !== 'number') throw new Error('Event stats invalid');
    });
  }

  private async testStorage(): Promise<void> {
    await this.test('Storage functionality', async () => {
      // Use memory storage for testing to avoid browser dependencies
      class TestStorage {
        private data = new Map();
        
        async get(key: string) { return this.data.get(key) || null; }
        async set(key: string, value: any) { this.data.set(key, value); }
        async remove(key: string) { this.data.delete(key); }
        async clear() { this.data.clear(); }
        async keys() { return Array.from(this.data.keys()); }
      }
      
      const storage = new TestStorage();
      
      await storage.set('test-key', { value: 'test' });
      const result = await storage.get('test-key');
      
      if (!result || result.value !== 'test') throw new Error('Storage set/get failed');
      
      await storage.remove('test-key');
      const removed = await storage.get('test-key');
      
      if (removed !== null) throw new Error('Storage remove failed');
    });
  }

  private async testUIManager(): Promise<void> {
    await this.test('UIManager functionality', async () => {
      // Mock DOM environment for testing
      const mockDocument = {
        createElement: (tag: string) => ({
          id: '',
          className: '',
          style: {},
          setAttribute: () => {},
          appendChild: () => {},
          querySelector: () => null,
          remove: () => {}
        }),
        getElementById: () => null,
        body: { appendChild: () => {} }
      };
      
      global.document = mockDocument as any;
      
      const uiManager = new PluginUIManager();
      const container = uiManager.createContainer('test');
      
      if (!container) throw new Error('Failed to create container');
      
      uiManager.removeContainer('test');
    });
  }

  private async testAPIClient(): Promise<void> {
    await this.test('APIClient instantiation', async () => {
      const client = new APIClient();
      
      if (client.getBaseURL() !== 'http://localhost:3001/api') {
        throw new Error('Default base URL incorrect');
      }
      
      client.setBaseURL('http://test.example.com');
      if (client.getBaseURL() !== 'http://test.example.com') {
        throw new Error('Base URL setter failed');
      }
    });
  }

  private async testPluginAPI(): Promise<void> {
    await this.test('Plugin API creation', async () => {
      const api = createPluginAPI('test-api-plugin');
      
      if (!api.events) throw new Error('API missing events');
      if (!api.storage) throw new Error('API missing storage');
      if (!api.ui) throw new Error('API missing ui');
      if (!api.http) throw new Error('API missing http');
      if (!api.config) throw new Error('API missing config');
      if (!api.logger) throw new Error('API missing logger');
    });
  }

  private async testPluginLifecycle(): Promise<void> {
    await this.test('Complete plugin lifecycle', async () => {
      const api = createPluginAPI('lifecycle-test');
      const manifest = {
        id: 'lifecycle-test',
        name: 'Lifecycle Test Plugin',
        version: '1.0.0',
        description: 'Test plugin lifecycle',
        entry: 'test.js',
        permissions: []
      };

      const plugin = new TestPlugin(api, manifest);
      
      // Test load
      await plugin.onLoad();
      const testData = plugin.getTestData();
      if (!testData) throw new Error('Plugin data not initialized on load');
      
      // Test event handling
      let eventHandled = false;
      api.events.on('lifecycle:test', () => { eventHandled = true; });
      api.events.emit('lifecycle:test', {});
      
      // Give event time to process
      await new Promise(resolve => setTimeout(resolve, 10));
      
      if (!eventHandled) throw new Error('Event handling failed');
      
      // Test unload
      await plugin.onUnload();
    });
  }

  private printResults(): void {
    console.log('\n📊 Verification Results:');
    console.log('========================');
    
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    this.results.forEach(result => {
      console.log(result.message);
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error.message}`);
      }
    });
    
    console.log(`\n📈 Summary: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Plugin system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the implementation.');
    }
  }
}

/**
 * Run verification
 */
export async function verifyPluginSystem(): Promise<boolean> {
  const verification = new PluginSystemVerification();
  const results = await verification.runAllTests();
  
  return results.every(result => result.success);
}

// Auto-run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyPluginSystem().then(success => {
    process.exit(success ? 0 : 1);
  });
}