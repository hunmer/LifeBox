/**
 * Demo file to verify the plugin system implementation
 * This file demonstrates how to use the plugin system programmatically
 */

import { 
  PluginSystem, 
  PluginManager,
  BasePlugin,
  createPluginAPI,
  BrowserPluginStorage 
} from '../lib/plugin-system';
import type { PluginManifest, PluginAPI } from '../../../../shared/src/types/plugin';

// Demo plugin implementation
class DemoPlugin extends BasePlugin {
  async onLoad(): Promise<void> {
    this.info('Demo plugin loaded successfully');
    
    // Create a simple UI container
    const container = this.createContainer('demo-plugin');
    container.innerHTML = `
      <div style="padding: 16px; border: 1px solid #ccc; border-radius: 4px; margin: 8px;">
        <h3>Demo Plugin</h3>
        <p>This is a demonstration plugin showing the plugin system capabilities.</p>
        <button id="demo-button">Click me!</button>
      </div>
    `;

    // Add event listener
    const button = container.querySelector('#demo-button');
    if (button) {
      button.addEventListener('click', () => {
        this.showNotification('Hello from Demo Plugin!', 'success');
        this.emit('demo:button-clicked', { timestamp: Date.now() });
      });
    }

    // Store some data
    await this.setStorage('demo-data', { 
      loadTime: Date.now(),
      version: this.getVersion()
    });

    // Listen to events
    this.on('demo:test-event', (event) => {
      this.info('Received test event:', event);
    });
  }

  async onUnload(): Promise<void> {
    this.info('Demo plugin unloaded');
    this.removeContainer();
  }
}

// Demo function to test the plugin system
export async function runPluginSystemDemo(): Promise<void> {
  console.log('🚀 Starting Plugin System Demo...');

  try {
    // 1. Create plugin system
    const pluginSystem = new PluginSystem({
      debug: true,
      defaultStorageType: 'local'
    });

    await pluginSystem.initialize();
    console.log('✅ Plugin system initialized');

    // 2. Create API for demo plugin
    const api = createPluginAPI('demo-plugin', {
      storageType: 'local'
    });

    // 3. Create demo manifest
    const manifest: PluginManifest = {
      id: 'demo-plugin',
      name: 'Demo Plugin',
      version: '1.0.0',
      description: 'A demonstration plugin for testing the plugin system',
      entry: 'demo.js',
      permissions: ['storage:local', 'events:emit', 'ui:manipulate']
    };

    // 4. Create and test plugin instance
    const demoPlugin = new DemoPlugin(api, manifest);
    
    // Test plugin lifecycle
    await demoPlugin.onLoad();
    console.log('✅ Demo plugin loaded');

    // 5. Test storage
    const storageData = await demoPlugin['getStorage']('demo-data');
    console.log('✅ Storage test:', storageData);

    // 6. Test events
    api.events.on('demo:button-clicked', (event) => {
      console.log('✅ Event received:', event);
    });

    // Emit a test event
    api.events.emit('demo:test-event', { message: 'Test event from demo' });

    // 7. Test HTTP client (mock request)
    try {
      // This will fail due to CORS but demonstrates the API
      await api.http.get('/api/test');
    } catch (error) {
      console.log('✅ HTTP client test (expected to fail due to CORS)');
    }

    // 8. Test UI manager
    api.ui.showNotification('Plugin system demo completed!', 'success');

    // 9. Get statistics
    const stats = pluginSystem.getStatistics();
    console.log('✅ Plugin system statistics:', stats);

    console.log('🎉 Plugin System Demo completed successfully!');

    // Cleanup
    await demoPlugin.onUnload();

  } catch (error) {
    console.error('❌ Plugin system demo failed:', error);
    throw error;
  }
}

// Export for manual testing
export { DemoPlugin };

// Auto-run demo if in development mode
if (import.meta.env?.DEV) {
  console.log('Development mode detected, plugin demo available via runPluginSystemDemo()');
}