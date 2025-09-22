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

  // 防止 React StrictMode 重复执行的 ref
  const hasInitialized = useRef(false);

  // 初始化官方插件源
  useEffect(() => {
    const initializeOfficialSource = async () => {
      // 防止 React StrictMode 重复执行
      if (hasInitialized.current) {
        console.log('[PluginInit] Already initialized, skipping...');
        return;
      }

      console.log('[PluginInit] Starting initialization, current sources:', pluginSources.map(s => ({ id: s.id, type: s.type })));

      // 检查是否已存在指定ID的官方插件源
      const existingOfficialSource = pluginSources.find(
        source => source.id === OFFICIAL_SOURCE_ID
      );

      console.log('[PluginInit] Existing official source:', existingOfficialSource?.id);

      if (!existingOfficialSource) {
        // 清理可能存在的其他官方源（防止重复）
        const otherOfficialSources = pluginSources.filter(
          source => source.type === 'official' && source.id !== OFFICIAL_SOURCE_ID
        );

        console.log('[PluginInit] Found other official sources to remove:', otherOfficialSources.map(s => s.id));

        // 如果存在其他官方源，先移除它们
        otherOfficialSources.forEach(source => {
          console.warn(`[PluginInit] Removing duplicate official source: ${source.id}`);
          removePluginSource(source.id);
        });
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

        // 标记初始化完成
        hasInitialized.current = true;
      } else {
        console.log('[PluginInit] Official source already exists, skipping initialization');
        hasInitialized.current = true;
      }
    };

    initializeOfficialSource();
  }, [pluginSources, addPluginSource, removePluginSource, selectedSourceId, setSelectedSourceId]);

  // 加载官方插件源的数据
  useEffect(() => {
    const loadOfficialPlugins = async () => {
      try {
        setIsRefreshingSource(true);

        const staticPluginService = StaticPluginService.getInstance();
        const plugins = await staticPluginService.getPlugins();

        // 将插件数据设置到store中
        setSourcePlugins(OFFICIAL_SOURCE_ID, plugins);

        // 更新插件源的插件数量
        const officialSource = pluginSources.find(s => s.id === OFFICIAL_SOURCE_ID);
        if (officialSource) {
          // 这里可以添加更新插件数量的逻辑
          // updatePluginSource(OFFICIAL_SOURCE_ID, { pluginCount: plugins.length });
        }

      } catch (error) {
        console.error('Failed to load official plugins:', error);
      } finally {
        setIsRefreshingSource(false);
      }
    };

    // 只有当官方插件源存在时才加载数据
    const hasOfficialSource = pluginSources.some(s => s.id === OFFICIAL_SOURCE_ID);
    if (hasOfficialSource && !isRefreshingSource) {
      loadOfficialPlugins();
    }
  }, [pluginSources, setSourcePlugins, setIsRefreshingSource, isRefreshingSource]);

  return {
    isInitialized: pluginSources.some(s => s.id === OFFICIAL_SOURCE_ID),
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