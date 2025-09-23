import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PluginSourceManager } from './plugin-source-manager';
import { PluginStore } from './plugin-store';
import { MyPlugins } from './my-plugins';
import { useAppStore } from '@/lib/stores/app-store';
import { refreshOfficialPlugins } from '@/lib/hooks/use-plugin-initialization';
import { PluginSourceService } from '@/lib/services/plugin-source-service';
import { cn } from '@/lib/utils';

interface PluginPanelProps {
  className?: string;
}

type TabType = 'store' | 'sources' | 'installed';

export function PluginPanel({ className }: PluginPanelProps) {
  const {
    pluginSources,
    selectedSourceId,
    sourcePlugins,
    setSourcePlugins
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('store');

  const pluginSourceService = PluginSourceService.getInstance();

  const handleRefreshSource = async (sourceId: string) => {
    const source = pluginSources.find(s => s.id === sourceId);
    if (!source || !source.enabled) return;

    try {
      // 如果是官方源，使用统一的官方插件刷新函数
      if (source.id === 'official-lifebox-plugins' || source.type === 'official') {
        await refreshOfficialPlugins();
      } else {
        // 其他第三方源使用原有逻辑
        const plugins = await pluginSourceService.fetchPluginsFromSource(source);
        setSourcePlugins(sourceId, plugins);
      }
    } catch (error) {
      console.error('Failed to refresh source:', error);
    }
  };

  const selectedSource = pluginSources.find(s => s.id === selectedSourceId);
  const hasSelectedSource = !!selectedSource;

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* 标签页导航 */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('store')}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === 'store'
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          插件商店
        </button>
        <button
          onClick={() => setActiveTab('installed')}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === 'installed'
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          我的插件
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === 'sources'
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          源管理
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'store' ? (
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <PluginStore />
            </div>
          </div>
        ) : activeTab === 'installed' ? (
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <MyPlugins />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <PluginSourceManager />
            </div>
          </div>
        )}
      </div>

      {/* 状态栏 */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {pluginSources.length} 个插件源 • {hasSelectedSource ? `当前: ${selectedSource?.name}` : '未选择源'}
          </div>
          <div>
            {hasSelectedSource && sourcePlugins[selectedSourceId!] && (
              `${sourcePlugins[selectedSourceId!].length} 个插件`
            )}
          </div>
        </div>
      </div>
    </div>
  );
}