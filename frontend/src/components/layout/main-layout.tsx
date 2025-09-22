import React from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { PluginPanel } from '@/components/plugin/plugin-panel';
import { RightPanel } from './right-panel';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen, setSidebarOpen, currentPage, setCurrentPage, rightPanelOpen, setRightPanelOpen } = useAppStore();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-card border-r transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            {sidebarOpen && (
              <h1 className="font-semibold text-foreground">LifeBox</h1>
            )}
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            <button
              onClick={() => setCurrentPage('home')}
              className={cn(
                "w-full p-2 rounded-lg text-left transition-colors",
                currentPage === 'home'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent",
                !sidebarOpen && "justify-center"
              )}
            >
              {sidebarOpen ? "主页" : "🏠"}
            </button>

            <button
              onClick={() => setCurrentPage('plugins')}
              className={cn(
                "w-full p-2 rounded-lg text-left transition-colors",
                currentPage === 'plugins'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent",
                !sidebarOpen && "justify-center"
              )}
            >
              {sidebarOpen ? "插件管理" : "🧩"}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-card border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h2 className="text-lg font-semibold">
                {currentPage === 'home' ? '欢迎来到 LifeBox' : '插件管理'}
              </h2>
            </div>

            {currentPage === 'home' && (
              <button
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                title="信息面板"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {currentPage === 'home' ? (
            <>
              <div className="flex-1 overflow-auto">
                {children}
              </div>
              {rightPanelOpen && (
                <aside className="w-72 flex-shrink-0">
                  <RightPanel />
                </aside>
              )}
            </>
          ) : (
            <div className="flex-1 overflow-auto p-4">
              <PluginPanel />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}