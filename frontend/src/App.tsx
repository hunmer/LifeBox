import { MainLayout } from '@/components/layout/main-layout';
import { useAppStore } from '@/lib/stores/app-store';
import { usePluginInitialization } from '@/lib/hooks/use-plugin-initialization';
import { useEffect, useState } from 'react';
import { setupGlobalAPI } from '@/lib/plugin-system/plugin-global-api';
import { initDevPluginAutoLoad, getDevPluginLoader } from '@/lib/services/dev-plugin-loader';

function App() {
  const { theme, loadedPlugins } = useAppStore();
  const [devPluginsLoaded, setDevPluginsLoaded] = useState(0);

  // 安全地初始化插件系统
  const { isInitialized, isLoading } = usePluginInitialization();

  // 初始化全局插件API和开发版插件
  useEffect(() => {
    const initializePluginSystem = async () => {
      try {
        // 1. 设置全局API
        setupGlobalAPI();

        // 2. 等待短暂时间确保API已设置完成
        await new Promise(resolve => setTimeout(resolve, 100));

        // 3. 自动加载开发版插件
        await initDevPluginAutoLoad();

        // 4. 获取加载统计
        const stats = getDevPluginLoader().getStats();
        setDevPluginsLoaded(stats.loaded);

      } catch (error) {
        console.error('插件系统初始化失败:', error);
      }
    };

    initializePluginSystem();

    // 监听开发插件加载事件
    const handleDevPluginLoaded = (event: CustomEvent) => {
      console.log('开发插件已加载:', event.detail.plugin);
      const stats = getDevPluginLoader().getStats();
      setDevPluginsLoaded(stats.loaded);
    };

    window.addEventListener('lifebox:dev-plugin:loaded', handleDevPluginLoaded as EventListener);

    return () => {
      window.removeEventListener('lifebox:dev-plugin:loaded', handleDevPluginLoaded as EventListener);
    };
  }, []);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <MainLayout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-6">
              <div className="bg-card border rounded-lg p-6 text-left">
                <h3 className="text-lg font-semibold mb-4">系统状态</h3>
                <div className="space-y-2 text-sm">
                  <div>当前主题: <span className="font-mono">{theme}</span></div>
                  <div>已加载插件: <span className="font-mono">{loadedPlugins.length}</span></div>
                  <div>开发插件: <span className="font-mono">{devPluginsLoaded}</span></div>
                  <div>插件系统: <span className="font-mono">
                    {isLoading ? '初始化中...' : isInitialized ? '已就绪' : '未初始化'}
                  </span></div>
                </div>
              </div>

              {/* Plugin Container */}
              <div id="plugin-root" className="min-h-[200px] bg-muted/30 border-2 border-dashed rounded-lg p-8">
                <p className="text-muted-foreground text-center">
                  插件容器 - 插件将在此处渲染
                </p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
}

export default App;