// 简单的构建脚本，将TypeScript编译为JavaScript
const fs = require('fs');
const path = require('path');

// 简单的TypeScript到JavaScript转换
// 在实际项目中，你应该使用真正的TypeScript编译器

function buildPlugin() {
  console.log('Building TypeScript plugin...');

  // 读取TypeScript文件
  const tsContent = fs.readFileSync('plugin.ts', 'utf8');

  // 简单的转换（移除类型注解）
  let jsContent = tsContent
    // 移除import/export语句
    .replace(/import.*from.*['"];?\n?/g, '')
    .replace(/export\s+default\s+.*;\s*$/gm, '')

    // 移除类型注解
    .replace(/:\s*[A-Za-z<>\[\]|&\s]+(?=\s*[=,;})])/g, '')
    .replace(/:\s*Promise<[^>]+>/g, '')
    .replace(/:\s*any(\[\])?/g, '')
    .replace(/:\s*string(\[\])?/g, '')
    .replace(/:\s*number(\[\])?/g, '')
    .replace(/:\s*boolean(\[\])?/g, '')
    .replace(/:\s*void/g, '')
    .replace(/:\s*HTMLElement(\s*\|\s*null)?/g, '')

    // 移除接口定义
    .replace(/interface\s+\w+\s*\{[^}]*\}/gs, '')
    .replace(/declare\s+const\s+.*?;/gs, '')

    // 移除泛型
    .replace(/<[^>]+>/g, '')

    // 移除private/public/protected关键字
    .replace(/\b(private|public|protected)\s+/g, '');

  // 添加IIFE包装和插件注册代码
  const pluginWrapper = `
// Generated from TypeScript source
(function() {
  'use strict';

  // 等待全局API加载完成
  if (!window.LifeBoxAPI) {
    console.error('[Simple Test Plugin] LifeBoxAPI not available');
    return;
  }

${jsContent}

  // 注册插件到全局
  if (!window.LifeBoxPlugins) {
    window.LifeBoxPlugins = {};
  }

  window.LifeBoxPlugins['simple-test-plugin'] = TypeScriptTestPlugin;

  // 自动创建实例（用于独立测试）
  let pluginInstance = null;
  if (window.LifeBoxAPI && !pluginInstance) {
    pluginInstance = new TypeScriptTestPlugin();

    // 为了调试方便，将实例暴露到全局
    window.TypeScriptTestPlugin = pluginInstance;
  }

  console.log('[LifeBox] TypeScript Test Plugin loaded successfully');

})();
`;

  // 写入JavaScript文件
  fs.writeFileSync('plugin.js', pluginWrapper);

  console.log('Plugin built successfully! Generated: plugin.js');
  console.log('You can now load this plugin in LifeBox.');
}

// 如果直接运行此脚本
if (require.main === module) {
  buildPlugin();
}

module.exports = { buildPlugin };