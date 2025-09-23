/**
 * 开发版插件加载脚本
 * 用于在浏览器开发者工具中手动加载插件
 */

async function loadChatPluginDev() {
  try {
    console.log('🔄 开始加载 Chat Plugin 开发版...');

    // 检查 PluginLoader 是否可用
    if (!window.LifeBoxPluginLoader) {
      console.error('❌ PluginLoader 未初始化，请确保前端应用已启动');
      return;
    }

    const pluginLoader = window.LifeBoxPluginLoader;
    const pluginPath = '/plugins'; // 插件文件所在路径

    // 尝试加载插件
    const pluginInfo = await pluginLoader.loadPlugin(pluginPath);

    console.log('✅ Chat Plugin 开发版加载成功:', pluginInfo);

    // 更新应用状态
    if (window.LifeBoxAppStore) {
      const store = window.LifeBoxAppStore.getState();
      store.addLoadedPlugin(pluginInfo.manifest.id);
      console.log('✅ 已更新应用状态');
    }

    return pluginInfo;

  } catch (error) {
    console.error('❌ 加载 Chat Plugin 开发版失败:', error);
    throw error;
  }
}

// 导出全局函数方便使用
window.loadChatPluginDev = loadChatPluginDev;

console.log('📝 Chat Plugin 开发版加载器已准备就绪');
console.log('💡 在控制台执行: loadChatPluginDev()');