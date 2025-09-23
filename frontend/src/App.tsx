import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/stores/app-store';
import { usePluginInitialization } from '@/lib/hooks/use-plugin-initialization';

function App() {
  const { theme, setTheme, loadedPlugins } = useAppStore();

  // 安全地初始化插件系统
  const { isInitialized, isLoading } = usePluginInitialization();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <MainLayout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-6">
              <h1 className="text-4xl font-bold text-foreground">
                LifeBox - 全能纪录应用
              </h1>
              
              <p className="text-lg text-muted-foreground">
                基于插件系统的跨平台记录应用，支持事件驱动的扩展开发
              </p>
              
              <div className="flex justify-center gap-4">
                <Button onClick={toggleTheme}>
                  切换主题 ({theme})
                </Button>
                
                <Button variant="outline">
                  加载插件
                </Button>
              </div>

              <div className="bg-card border rounded-lg p-6 text-left">
                <h3 className="text-lg font-semibold mb-4">系统状态</h3>
                <div className="space-y-2 text-sm">
                  <div>当前主题: <span className="font-mono">{theme}</span></div>
                  <div>已加载插件: <span className="font-mono">{loadedPlugins.length}</span></div>
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