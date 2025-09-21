import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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
    }),
    {
      name: 'lifebox-app-store',
    }
  )
);