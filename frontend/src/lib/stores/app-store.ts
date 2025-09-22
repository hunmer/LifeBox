import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { PluginSource, SourcePluginInfo } from '@lifebox/shared';

interface AppState {
  // 主题状态
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // 应用状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // 插件状态
  loadedPlugins: string[];
  addLoadedPlugin: (pluginId: string) => void;
  removeLoadedPlugin: (pluginId: string) => void;
  
  // UI 状态
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  currentPage: 'home' | 'plugins';
  setCurrentPage: (page: 'home' | 'plugins') => void;
  rightPanelTab: 'info' | 'settings';
  setRightPanelTab: (tab: 'info' | 'settings') => void;

  // 插件源状态
  pluginSources: PluginSource[];
  addPluginSource: (source: PluginSource) => void;
  removePluginSource: (sourceId: string) => void;
  updatePluginSource: (sourceId: string, updates: Partial<PluginSource>) => void;

  // 插件源插件列表
  sourcePlugins: Record<string, SourcePluginInfo[]>;
  setSourcePlugins: (sourceId: string, plugins: SourcePluginInfo[]) => void;

  // 插件源管理UI状态
  selectedSourceId: string | null;
  setSelectedSourceId: (sourceId: string | null) => void;
  isRefreshingSource: boolean;
  setIsRefreshingSource: (refreshing: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // 主题状态
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      // 应用状态
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      
      // 插件状态
      loadedPlugins: [],
      addLoadedPlugin: (pluginId) => 
        set((state) => ({ 
          loadedPlugins: [...state.loadedPlugins, pluginId] 
        })),
      removeLoadedPlugin: (pluginId) => 
        set((state) => ({ 
          loadedPlugins: state.loadedPlugins.filter(id => id !== pluginId) 
        })),
      
      // UI 状态
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      rightPanelOpen: true,
      setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
      currentPage: 'home',
      setCurrentPage: (currentPage) => set({ currentPage }),
      rightPanelTab: 'info',
      setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),

      // 插件源状态
      pluginSources: [],
      addPluginSource: (source) =>
        set((state) => ({
          pluginSources: [...state.pluginSources, source]
        })),
      removePluginSource: (sourceId) =>
        set((state) => ({
          pluginSources: state.pluginSources.filter(s => s.id !== sourceId),
          sourcePlugins: Object.fromEntries(
            Object.entries(state.sourcePlugins).filter(([id]) => id !== sourceId)
          )
        })),
      updatePluginSource: (sourceId, updates) =>
        set((state) => ({
          pluginSources: state.pluginSources.map(source =>
            source.id === sourceId ? { ...source, ...updates } : source
          )
        })),

      // 插件源插件列表
      sourcePlugins: {},
      setSourcePlugins: (sourceId, plugins) =>
        set((state) => ({
          sourcePlugins: { ...state.sourcePlugins, [sourceId]: plugins }
        })),

      // 插件源管理UI状态
      selectedSourceId: null,
      setSelectedSourceId: (selectedSourceId) => set({ selectedSourceId }),
      isRefreshingSource: false,
      setIsRefreshingSource: (isRefreshingSource) => set({ isRefreshingSource }),
    }),
    {
      name: 'lifebox-app-store',
    }
  )
);