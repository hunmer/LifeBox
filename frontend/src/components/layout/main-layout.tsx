import React from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

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
            <div className={cn(
              "p-2 rounded-lg bg-accent text-accent-foreground",
              !sidebarOpen && "justify-center"
            )}>
              {sidebarOpen ? "插件管理" : "🧩"}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b p-4">
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
            <h2 className="text-lg font-semibold">欢迎来到 LifeBox</h2>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}