import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/stores/app-store';
import { cn } from '@/lib/utils';
import type { PluginInfo, PluginStatus } from '@lifebox/shared';

interface MyPluginsProps {
  className?: string;
}

interface PluginCardProps {
  plugin: PluginInfo;
  onToggle: (pluginId: string, enable: boolean) => void;
  onUninstall: (pluginId: string) => void;
  onConfigure?: (pluginId: string) => void;
}

function PluginCard({ plugin, onToggle, onUninstall, onConfigure }: PluginCardProps) {
  const isActive = plugin.status === 'active';
  const hasError = plugin.status === 'error';

  const getStatusLabel = (status: PluginStatus) => {
    switch (status) {
      case 'active': return '已启用';
      case 'inactive': return '已禁用';
      case 'loading': return '加载中';
      case 'loaded': return '已加载';
      case 'error': return '错误';
      default: return '未知';
    }
  };

  const getStatusColor = (status: PluginStatus) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
      case 'loading': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'loaded': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-sm truncate">{plugin.manifest.name}</h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              getStatusColor(plugin.status)
            )}>
              {getStatusLabel(plugin.status)}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mb-1">
            v{plugin.manifest.version} • ID: {plugin.manifest.id}
          </p>

          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {plugin.manifest.description}
          </p>

          {hasError && plugin.error && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
              错误: {plugin.error.message}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="space-x-4">
              {plugin.loadTime && (
                <span>加载时间: {formatTime(plugin.loadTime)}</span>
              )}
              {plugin.lastActiveTime && (
                <span>最后活跃: {formatTime(plugin.lastActiveTime)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          <Button
            size="sm"
            variant={isActive ? "outline" : "default"}
            onClick={() => onToggle(plugin.manifest.id, !isActive)}
            disabled={hasError}
            className="text-xs"
          >
            {isActive ? '禁用' : '启用'}
          </Button>

          {onConfigure && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onConfigure(plugin.manifest.id)}
              disabled={hasError}
              className="text-xs"
            >
              配置
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onUninstall(plugin.manifest.id)}
            className="text-xs text-destructive hover:text-destructive"
          >
            卸载
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MyPlugins({ className }: MyPluginsProps) {
  const { loadedPlugins } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'error'>('all');

  // 获取实际的已安装插件数据
  const installedPlugins = Object.values(loadedPlugins);

  const allPlugins = installedPlugins.length > 0 ? installedPlugins : [];

  const filteredPlugins = allPlugins.filter(plugin => {
    switch (filter) {
      case 'active':
        return plugin.status === 'active';
      case 'inactive':
        return plugin.status === 'inactive';
      case 'error':
        return plugin.status === 'error';
      default:
        return true;
    }
  });

  const handleTogglePlugin = async (pluginId: string, enable: boolean) => {
    try {
      console.log(`${enable ? '启用' : '禁用'}插件:`, pluginId);
      // TODO: 调用插件管理器的启用/禁用方法
    } catch (error) {
      console.error('切换插件状态失败:', error);
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      console.log('卸载插件:', pluginId);
      // TODO: 调用插件管理器的卸载方法
    } catch (error) {
      console.error('卸载插件失败:', error);
    }
  };

  const handleConfigurePlugin = (pluginId: string) => {
    console.log('配置插件:', pluginId);
    // TODO: 打开插件配置界面
  };

  const pluginCounts = {
    all: allPlugins.length,
    active: allPlugins.filter(p => p.status === 'active').length,
    inactive: allPlugins.filter(p => p.status === 'inactive').length,
    error: allPlugins.filter(p => p.status === 'error').length,
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">我的插件</h2>
        <div className="text-sm text-muted-foreground">
          共 {pluginCounts.all} 个插件
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "px-3 py-1 text-sm rounded-md transition-colors",
            filter === 'all'
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          全部 ({pluginCounts.all})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={cn(
            "px-3 py-1 text-sm rounded-md transition-colors",
            filter === 'active'
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          已启用 ({pluginCounts.active})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={cn(
            "px-3 py-1 text-sm rounded-md transition-colors",
            filter === 'inactive'
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          已禁用 ({pluginCounts.inactive})
        </button>
        {pluginCounts.error > 0 && (
          <button
            onClick={() => setFilter('error')}
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-colors",
              filter === 'error'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            错误 ({pluginCounts.error})
          </button>
        )}
      </div>

      {/* 插件列表 */}
      <div className="space-y-3">
        {filteredPlugins.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {filter === 'all' ? (
              <div>
                <p>暂无已安装的插件</p>
                <p className="text-sm">前往插件商店浏览和安装插件</p>
              </div>
            ) : (
              <p>没有找到{filter === 'active' ? '已启用' : filter === 'inactive' ? '已禁用' : '有错误'}的插件</p>
            )}
          </div>
        ) : (
          filteredPlugins.map((plugin) => (
            <PluginCard
              key={plugin.manifest.id}
              plugin={plugin}
              onToggle={handleTogglePlugin}
              onUninstall={handleUninstallPlugin}
              onConfigure={handleConfigurePlugin}
            />
          ))
        )}
      </div>
    </div>
  );
}