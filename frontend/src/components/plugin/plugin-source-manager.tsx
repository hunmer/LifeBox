import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppStore } from '@/lib/stores/app-store';
import type { PluginSource, PluginSourceType } from '@lifebox/shared';
import { cn } from '@/lib/utils';

interface PluginSourceManagerProps {
  className?: string;
}

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (source: Omit<PluginSource, 'id' | 'lastUpdated'>) => void;
}

function AddSourceDialog({ open, onOpenChange, onSubmit }: AddSourceDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    type: 'community' as PluginSourceType,
    enabled: true,
    verifySSL: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) {
      return;
    }
    onSubmit(formData);
    onOpenChange(false);
    // 重置表单
    setFormData({
      name: '',
      description: '',
      url: '',
      type: 'community' as PluginSourceType,
      enabled: true,
      verifySSL: true,
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
    // 重置表单
    setFormData({
      name: '',
      description: '',
      url: '',
      type: 'community' as PluginSourceType,
      enabled: true,
      verifySSL: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加插件源</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-6 pt-0">
            <div>
              <label className="block text-sm font-medium mb-1">源名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="输入插件源名称"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">源地址</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="https://example.com/plugins"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="插件源描述（可选）"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">源类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PluginSourceType })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="official">官方源</option>
                <option value="community">社区源</option>
                <option value="third_party">第三方源</option>
                <option value="local">本地源</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">启用</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.verifySSL}
                  onChange={(e) => setFormData({ ...formData, verifySSL: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">验证SSL</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button type="submit">
              添加
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PluginSourceItem({ source }: { source: PluginSource }) {
  const { removePluginSource, updatePluginSource, setSelectedSourceId, selectedSourceId } = useAppStore();

  const isSelected = selectedSourceId === source.id;

  const getTypeLabel = (type: PluginSourceType) => {
    switch (type) {
      case 'official': return '官方';
      case 'community': return '社区';
      case 'third_party': return '第三方';
      case 'local': return '本地';
      default: return type;
    }
  };

  const getTypeColor = (type: PluginSourceType) => {
    switch (type) {
      case 'official': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'community': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'third_party': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'local': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div
      className={cn(
        "p-3 border rounded-lg cursor-pointer transition-colors",
        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      )}
      onClick={() => setSelectedSourceId(isSelected ? null : source.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{source.name}</h4>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              getTypeColor(source.type)
            )}>
              {getTypeLabel(source.type)}
            </span>
            <div className={cn(
              "w-2 h-2 rounded-full",
              source.enabled ? "bg-green-500" : "bg-gray-400"
            )} />
          </div>

          <p className="text-xs text-muted-foreground mb-1">
            {source.url}
          </p>

          {source.description && (
            <p className="text-xs text-muted-foreground">
              {source.description}
            </p>
          )}

          {source.pluginCount !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              {source.pluginCount} 个插件
            </p>
          )}
        </div>

        <div className="flex gap-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              updatePluginSource(source.id, { enabled: !source.enabled });
            }}
            className="p-1 hover:bg-accent rounded"
            title={source.enabled ? "禁用" : "启用"}
          >
            {source.enabled ? "⏸️" : "▶️"}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              removePluginSource(source.id);
            }}
            className="p-1 hover:bg-destructive/10 text-destructive rounded"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

export function PluginSourceManager({ className }: PluginSourceManagerProps) {
  const { pluginSources, addPluginSource } = useAppStore();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddSource = (sourceData: Omit<PluginSource, 'id' | 'lastUpdated'>) => {
    const newSource: PluginSource = {
      ...sourceData,
      id: `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastUpdated: Date.now(),
    };

    addPluginSource(newSource);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">插件源管理</h2>
        <Button
          size="sm"
          onClick={() => setShowAddDialog(true)}
        >
          添加源
        </Button>
      </div>

      <AddSourceDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddSource}
      />

      <div className="space-y-2">
        {pluginSources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>暂无插件源</p>
            <p className="text-sm">点击"添加源"来添加你的第一个插件源</p>
          </div>
        ) : (
          pluginSources.map((source) => (
            <PluginSourceItem key={source.id} source={source} />
          ))
        )}
      </div>
    </div>
  );
}