import { useAppStore } from '@/lib/stores/app-store';
import { cn } from '@/lib/utils';

interface RightPanelProps {
  className?: string;
}

function InfoTab() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">应用信息</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div>版本: 1.0.0</div>
          <div>构建: 2025.01.22</div>
          <div>环境: 开发模式</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">系统状态</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">插件系统</span>
            <span className="text-green-600">正常</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">事件总线</span>
            <span className="text-green-600">正常</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">存储系统</span>
            <span className="text-green-600">正常</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">最近活动</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div>• 启动应用程序</div>
          <div>• 初始化插件系统</div>
          <div>• 加载用户配置</div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const { theme, setTheme } = useAppStore();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">外观设置</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-sm">主题</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="px-2 py-1 text-xs border rounded bg-background"
            >
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="system">跟随系统</option>
            </select>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">插件设置</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-sm">自动更新插件</span>
            <input
              type="checkbox"
              defaultChecked
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">开发者模式</span>
            <input
              type="checkbox"
              className="rounded"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">数据管理</h3>
        <div className="space-y-2">
          <button className="w-full px-3 py-2 text-xs text-left border rounded hover:bg-accent">
            清理缓存
          </button>
          <button className="w-full px-3 py-2 text-xs text-left border rounded hover:bg-accent">
            导出设置
          </button>
          <button className="w-full px-3 py-2 text-xs text-left border rounded hover:bg-accent">
            重置应用
          </button>
        </div>
      </div>
    </div>
  );
}

export function RightPanel({ className }: RightPanelProps) {
  const { rightPanelTab, setRightPanelTab } = useAppStore();

  return (
    <div className={cn("flex flex-col h-full bg-card border-l", className)}>
      {/* 标签页导航 */}
      <div className="flex border-b">
        <button
          onClick={() => setRightPanelTab('info')}
          className={cn(
            "flex-1 px-3 py-2 text-xs font-medium transition-colors",
            rightPanelTab === 'info'
              ? "border-b-2 border-primary text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          信息
        </button>
        <button
          onClick={() => setRightPanelTab('settings')}
          className={cn(
            "flex-1 px-3 py-2 text-xs font-medium transition-colors",
            rightPanelTab === 'settings'
              ? "border-b-2 border-primary text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          设置
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {rightPanelTab === 'info' ? <InfoTab /> : <SettingsTab />}
      </div>
    </div>
  );
}