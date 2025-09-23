import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/app-store';
import { StaticPluginService } from '../services/static-plugin-service';
import type { PluginSource } from '@lifebox/shared';

// 官方插件源配置
const OFFICIAL_PLUGIN_SOURCE: Omit<PluginSource, 'id' | 'lastUpdated'> = {
  name: 'LifeBox 官方插件源',
  description: 'LifeBox 官方维护的插件仓库，提供经过验证的高质量插件',
  url: 'static',  // 使用特殊标识，表示使用静态服务
  type: 'official',
  enabled: true,
  verifySSL: false,
};

const OFFICIAL_SOURCE_ID = 'official-lifebox-plugins';

/**
 * 插件系统初始化 Hook
 * 负责：
 * 1. 初始化官方插件源
 * 2. 加载官方插件源的插件数据
 * 3. 设置默认选中的插件源
 */
export function usePluginInitialization() {
  const {
    pluginSources,
    addPluginSource,
    removePluginSource,
    setSourcePlugins,
    selectedSourceId,
    setSelectedSourceId,
    isRefreshingSource,
    setIsRefreshingSource
  } = useAppStore();

  // 防止重复执行和无限循环的 ref
  const hasInitialized = useRef(false);
  const isInitializing = useRef(false);

  // 初始化官方插件源 - 只在组件挂载时执行一次
  useEffect(() => {
    if (hasInitialized.current || isInitializing.current) {
      return;
    }

    const initializeOfficialSource = async () => {
      isInitializing.current = true;

      try {
        console.log('[PluginInit] Starting initialization...');

        // 检查是否已存在官方插件源
        const existingOfficialSource = pluginSources.find(
          source => source.id === OFFICIAL_SOURCE_ID
        );

        if (existingOfficialSource) {
          console.log('[PluginInit] Official source already exists');
          hasInitialized.current = true;
          return;
        }

        // 清理可能存在的其他官方源
        const otherOfficialSources = pluginSources.filter(
          source => source.type === 'official' && source.id !== OFFICIAL_SOURCE_ID
        );

        if (otherOfficialSources.length > 0) {
          console.log('[PluginInit] Removing duplicate official sources:', otherOfficialSources.map(s => s.id));
          otherOfficialSources.forEach(source => {
            removePluginSource(source.id);
          });
        }

        // 添加官方插件源
        const officialSource: PluginSource = {
          ...OFFICIAL_PLUGIN_SOURCE,
          id: OFFICIAL_SOURCE_ID,
          lastUpdated: Date.now(),
        };

        console.log('[PluginInit] Adding official source:', OFFICIAL_SOURCE_ID);
        addPluginSource(officialSource);

        // 如果没有选中的插件源，默认选中官方源
        if (!selectedSourceId) {
          console.log('[PluginInit] Setting selected source to:', OFFICIAL_SOURCE_ID);
          setSelectedSourceId(OFFICIAL_SOURCE_ID);
        }

        hasInitialized.current = true;
      } catch (error) {
        console.error('[PluginInit] Failed to initialize:', error);
      } finally {
        isInitializing.current = false;
      }
    };

    initializeOfficialSource();
  }, []); // 移除依赖，只在挂载时执行一次

  // 加载官方插件源的数据 - 在初始化完成后执行
  useEffect(() => {
    const loadOfficialPlugins = async () => {
      if (!hasInitialized.current || isRefreshingSource) {
        return;
      }

      const hasOfficialSource = pluginSources.some(s => s.id === OFFICIAL_SOURCE_ID);
      if (!hasOfficialSource) {
        return;
      }

      try {
        console.log('[PluginInit] Loading official plugins...');
        setIsRefreshingSource(true);

        const staticPluginService = StaticPluginService.getInstance();
        const plugins = await staticPluginService.getPlugins();

        setSourcePlugins(OFFICIAL_SOURCE_ID, plugins);
        console.log('[PluginInit] Loaded', plugins.length, 'plugins');

      } catch (error) {
        console.error('[PluginInit] Failed to load official plugins:', error);
      } finally {
        setIsRefreshingSource(false);
      }
    };

    // 延迟执行，确保初始化已完成
    if (hasInitialized.current) {
      loadOfficialPlugins();
    }
  }, [hasInitialized.current, pluginSources.length]); // 使用更稳定的依赖

  return {
    isInitialized: hasInitialized.current && pluginSources.some(s => s.id === OFFICIAL_SOURCE_ID),
    isLoading: isRefreshingSource
  };
}

/**
 * 刷新官方插件源数据
 */
export async function refreshOfficialPlugins() {
  const staticPluginService = StaticPluginService.getInstance();

  try {
    // 刷新缓存
    await staticPluginService.refreshData();

    // 重新获取插件数据
    const plugins = await staticPluginService.getPlugins();

    // 获取store实例并更新数据
    const store = useAppStore.getState();
    store.setSourcePlugins(OFFICIAL_SOURCE_ID, plugins);

    return plugins;
  } catch (error) {
    console.error('Failed to refresh official plugins:', error);
    throw error;
  }
}

/**
 * 使用静态插件服务搜索插件
 */
export function usePluginSearch() {
  const staticPluginService = StaticPluginService.getInstance();

  const searchPlugins = async (query: string, filters?: any) => {
    try {
      return await staticPluginService.searchPlugins(query, filters);
    } catch (error) {
      console.error('Failed to search plugins:', error);
      return [];
    }
  };

  const getFeaturedPlugins = async (limit?: number) => {
    try {
      return await staticPluginService.getFeaturedPlugins(limit);
    } catch (error) {
      console.error('Failed to get featured plugins:', error);
      return [];
    }
  };

  const getCategories = async () => {
    try {
      return await staticPluginService.getCategories();
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  };

  const getPluginStats = async () => {
    try {
      return await staticPluginService.getPluginStats();
    } catch (error) {
      console.error('Failed to get plugin stats:', error);
      return null;
    }
  };

  return {
    searchPlugins,
    getFeaturedPlugins,
    getCategories,
    getPluginStats
  };
}