import { ChatPlugin } from './ChatPlugin';
import type { PluginAPI, PluginManifest } from './types';

// 导出主要类和类型
export { ChatPlugin };
export * from './types';

// 插件注册函数
// 这个函数会被插件系统调用来创建插件实例
export function createPlugin(api: PluginAPI, manifest: PluginManifest): ChatPlugin {
  return new ChatPlugin(api, manifest);
}

// 如果在浏览器环境中，将插件注册到 LifeBox 插件系统
if (typeof window !== 'undefined') {
  // 确保 LifeBoxPlugins 对象存在
  if (!(window as any).LifeBoxPlugins) {
    (window as any).LifeBoxPlugins = {};
  }

  // 注册插件构造函数到系统中
  (window as any).LifeBoxPlugins['chat-plugin-dev'] = ChatPlugin;

  // 保持向后兼容
  (window as any).createChatPlugin = createPlugin;
  (window as any).ChatPlugin = ChatPlugin;
}

// 如果支持模块导出，也提供默认导出
export default createPlugin;