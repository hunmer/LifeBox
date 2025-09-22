import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/stores/app-store';
import type { SourcePluginInfo, PluginSearchFilter } from '@lifebox/shared';
import { cn } from '@/lib/utils';

interface PluginStoreProps {
  className?: string;
}

interface PluginCardProps {
  plugin: SourcePluginInfo;
  onInstall: (plugin: SourcePluginInfo) => void;
  onUninstall: (plugin: SourcePluginInfo) => void;
  isInstalling?: boolean;
}

function PluginCard({ plugin, onInstall, onUninstall, isInstalling = false }: PluginCardProps) {
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const stars = Math.round(rating);
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < stars ? "text-yellow-400" : "text-gray-300"}>
            ⭐
          </span>
        ))}
        <span className="text-xs text-muted-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {plugin.icon && (
          <img
            src={plugin.icon}
            alt={plugin.name}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{plugin.name}</h3>
              <p className="text-xs text-muted-foreground">
                v{plugin.version}
                {plugin.author && ` • ${plugin.author}`}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              {plugin.isInstalled ? (
                <div className="flex items-center gap-1">
                  {plugin.hasUpdate && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs rounded-full">
                      有更新
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUninstall(plugin)}
                    className="h-7 px-2 text-xs"
                  >
                    {plugin.hasUpdate ? '更新' : '已安装'}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onInstall(plugin)}
                  disabled={isInstalling}
                  className="h-7 px-2 text-xs"
                >
                  {isInstalling ? '安装中...' : '安装'}
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {plugin.description}
          </p>

          {plugin.tags && plugin.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {plugin.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-xs rounded"
                >
                  {tag}
                </span>
              ))}
              {plugin.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{plugin.tags.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {plugin.downloads && (
                <span>下载: {plugin.downloads.toLocaleString()}</span>
              )}
              {plugin.size && (
                <span>大小: {formatSize(plugin.size)}</span>
              )}
              {plugin.lastUpdated && (
                <span>更新: {formatDate(plugin.lastUpdated)}</span>
              )}
            </div>

            {plugin.rating && renderStars(plugin.rating)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchFilters({
  onFilterChange
}: {
  onFilterChange: (filters: Partial<PluginSearchFilter>) => void
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<PluginSearchFilter['sortBy']>('downloads');

  const categories = [
    { value: '', label: '全部分类' },
    { value: 'productivity', label: '效率工具' },
    { value: 'entertainment', label: '娱乐' },
    { value: 'development', label: '开发工具' },
    { value: 'social', label: '社交' },
    { value: 'utility', label: '实用工具' },
  ];

  const handleFilterChange = () => {
    onFilterChange({
      query: searchQuery || undefined,
      category: selectedCategory || undefined,
      sortBy,
      sortOrder: 'desc',
    });
  };

  useEffect(() => {
    const debounceTimer = setTimeout(handleFilterChange, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-card">
      <div>
        <input
          type="text"
          placeholder="搜索插件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-md bg-background"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as PluginSearchFilter['sortBy'])}
          className="px-3 py-2 text-sm border rounded-md bg-background"
        >
          <option value="downloads">下载量</option>
          <option value="rating">评分</option>
          <option value="lastUpdated">更新时间</option>
          <option value="name">名称</option>
        </select>
      </div>
    </div>
  );
}

export function PluginStore({ className }: PluginStoreProps) {
  const {
    selectedSourceId,
    sourcePlugins,
    pluginSources,
    isRefreshingSource,
    setIsRefreshingSource
  } = useAppStore();

  const [filters, setFilters] = useState<PluginSearchFilter>({});
  const [installingPlugins, setInstallingPlugins] = useState<Set<string>>(new Set());

  const selectedSource = pluginSources.find(s => s.id === selectedSourceId);
  const plugins = selectedSourceId ? sourcePlugins[selectedSourceId] || [] : [];

  const filteredPlugins = plugins.filter((plugin) => {
    if (filters.query && !plugin.name.toLowerCase().includes(filters.query.toLowerCase()) &&
        !plugin.description.toLowerCase().includes(filters.query.toLowerCase())) {
      return false;
    }

    if (filters.category && plugin.category !== filters.category) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'name':
        return filters.sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      case 'downloads':
        return filters.sortOrder === 'desc' ? (b.downloads || 0) - (a.downloads || 0) : (a.downloads || 0) - (b.downloads || 0);
      case 'rating':
        return filters.sortOrder === 'desc' ? (b.rating || 0) - (a.rating || 0) : (a.rating || 0) - (b.rating || 0);
      case 'lastUpdated':
        return filters.sortOrder === 'desc' ? (b.lastUpdated || 0) - (a.lastUpdated || 0) : (a.lastUpdated || 0) - (b.lastUpdated || 0);
      default:
        return 0;
    }
  });

  const handleInstallPlugin = async (plugin: SourcePluginInfo) => {
    setInstallingPlugins(prev => new Set([...prev, plugin.id]));

    try {
      // TODO: 实现实际的安装逻辑
      await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟安装
      console.log('Installing plugin:', plugin.name);

      // 更新插件状态为已安装
      // TODO: 调用实际的插件管理器 API

    } catch (error) {
      console.error('Failed to install plugin:', error);
    } finally {
      setInstallingPlugins(prev => {
        const newSet = new Set(prev);
        newSet.delete(plugin.id);
        return newSet;
      });
    }
  };

  const handleUninstallPlugin = async (plugin: SourcePluginInfo) => {
    try {
      // TODO: 实现实际的卸载逻辑
      console.log('Uninstalling plugin:', plugin.name);
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
    }
  };

  const handleRefreshSource = async () => {
    if (!selectedSourceId || !selectedSource) return;

    setIsRefreshingSource(true);
    try {
      // TODO: 实现实际的源刷新逻辑
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟刷新
      console.log('Refreshing source:', selectedSource.name);
    } catch (error) {
      console.error('Failed to refresh source:', error);
    } finally {
      setIsRefreshingSource(false);
    }
  };

  if (!selectedSourceId) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-muted-foreground">请选择一个插件源来浏览插件</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{selectedSource?.name}</h2>
          <p className="text-sm text-muted-foreground">
            {plugins.length} 个插件
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefreshSource}
          disabled={isRefreshingSource}
        >
          {isRefreshingSource ? '刷新中...' : '刷新'}
        </Button>
      </div>

      <SearchFilters onFilterChange={setFilters} />

      <div className="space-y-3">
        {filteredPlugins.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {plugins.length === 0 ? (
              <p>此源暂无插件</p>
            ) : (
              <p>没有找到匹配的插件</p>
            )}
          </div>
        ) : (
          filteredPlugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onInstall={handleInstallPlugin}
              onUninstall={handleUninstallPlugin}
              isInstalling={installingPlugins.has(plugin.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}