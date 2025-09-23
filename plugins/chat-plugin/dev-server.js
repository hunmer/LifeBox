import { createServer } from 'vite';
import path from 'path';
import fs from 'fs';

const pluginDistPath = path.resolve('./dist/chat-plugin.umd.cjs');
const pluginDevPath = path.resolve('../../frontend/public/plugins/chat-plugin-dev.js');
const manifestDevPath = path.resolve('./manifest.dev.json');
const manifestTargetPath = path.resolve('../../frontend/public/plugins/manifest.json');
const cssSourcePath = path.resolve('./chat-plugin.css');
const cssTargetPath = path.resolve('../../frontend/public/plugins/chat-plugin.css');

async function startDevServer() {
  // 创建 Vite 开发服务器
  const server = await createServer({
    root: '.',
    configFile: './vite.config.ts',
    server: {
      port: 5174, // 使用不同端口避免冲突
      host: true,
      cors: true
    },
    build: {
      watch: {
        include: 'src/**'
      }
    }
  });

  await server.listen();

  console.log('📦 Chat Plugin 开发服务器已启动');
  console.log(`🔗 本地地址: http://localhost:5174`);

  // 监听构建变化
  let isBuilding = false;

  const buildAndCopy = async () => {
    if (isBuilding) return;
    isBuilding = true;

    try {
      console.log('🔨 检测到文件变化，开始构建...');

      // 使用 Vite 构建
      const { build } = await import('vite');
      await build({
        configFile: './vite.config.ts',
        build: {
          watch: null // 禁用构建时的监听
        }
      });

      // 复制到 LifeBox 前端插件目录
      if (fs.existsSync(pluginDistPath)) {
        const distDir = path.dirname(pluginDevPath);
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }

        // 复制插件 JS 文件
        fs.copyFileSync(pluginDistPath, pluginDevPath);
        console.log('✅ 插件 JS 已更新到 LifeBox 前端');

        // 复制开发版 manifest
        if (fs.existsSync(manifestDevPath)) {
          fs.copyFileSync(manifestDevPath, manifestTargetPath);
          console.log('✅ Manifest 已更新到 LifeBox 前端');
        }

        // 复制 CSS 文件（如果存在）
        if (fs.existsSync(cssSourcePath)) {
          fs.copyFileSync(cssSourcePath, cssTargetPath);
          console.log('✅ CSS 已更新到 LifeBox 前端');
        }

        // 通知前端热更新
        server.ws.send({
          type: 'full-reload'
        });

        console.log('🔄 已通知前端重新加载插件');
      }

    } catch (error) {
      console.error('❌ 构建失败:', error);
    } finally {
      isBuilding = false;
    }
  };

  // 监听文件变化
  const chokidar = await import('chokidar');
  const watcher = chokidar.watch('src/**/*', {
    ignored: /(^|[\/\\])\../, // 忽略隐藏文件
    persistent: true
  });

  watcher.on('change', buildAndCopy);
  watcher.on('add', buildAndCopy);
  watcher.on('unlink', buildAndCopy);

  // 初始构建
  await buildAndCopy();

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭开发服务器...');
    watcher.close();
    server.close();
    process.exit(0);
  });
}

startDevServer().catch(console.error);