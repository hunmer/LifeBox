import React, { useEffect, useRef, useState } from 'react';
import { PluginManager } from '../../lib/plugin-system/plugin-manager';
import { PluginAPIManager, initializeGlobalPluginAPI } from '../../lib/plugin-system/plugin-api';
import type { PluginInfo, PluginStatus } from '../../../../../shared/src/types/plugin';

interface PluginContainerProps {
  /** 插件管理器实例 */
  pluginManager?: PluginManager;
  /** 容器类名 */
  className?: string;
  /** 容器样式 */
  style?: React.CSSProperties;
  /** 是否自动初始化插件API */
  autoInitializeAPI?: boolean;
}

/**
 * PluginContainer 组件
 * 作为插件系统的根容器，提供插件运行环境
 */
export const PluginContainer: React.FC<PluginContainerProps> = ({
  pluginManager,
  className = 'plugin-container',
  style,
  autoInitializeAPI = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const pluginManagerRef = useRef<PluginManager | null>(null);

  // 初始化插件管理器
  useEffect(() => {
    if (!pluginManagerRef.current) {
      pluginManagerRef.current = pluginManager || new PluginManager();
    }

    // 初始化全局插件 API
    if (autoInitializeAPI && !isInitialized) {
      initializeGlobalPluginAPI();
      setIsInitialized(true);
    }

    // 加载已安装的插件
    const loadedPlugins = pluginManagerRef.current.getInstalledPlugins();
    setPlugins(loadedPlugins);

  }, [pluginManager, autoInitializeAPI, isInitialized]);

  // 设置插件根容器ID
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.id = 'plugin-root';
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        minHeight: '100px',
        ...style
      }}
    >
      {/* 插件容器内容将由插件动态添加 */}
    </div>
  );
};

interface PluginManagerPanelProps {
  /** 插件管理器实例 */
  pluginManager?: PluginManager;
  /** 是否显示调试信息 */
  showDebugInfo?: boolean;
}

/**
 * PluginManagerPanel 组件
 * 提供插件管理的可视化界面
 */
export const PluginManagerPanel: React.FC<PluginManagerPanelProps> = ({
  pluginManager,
  showDebugInfo = false
}) => {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const pluginManagerRef = useRef<PluginManager | null>(null);

  useEffect(() => {
    if (!pluginManagerRef.current) {
      pluginManagerRef.current = pluginManager || new PluginManager();
    }
    refreshPlugins();
  }, [pluginManager]);

  const refreshPlugins = () => {
    if (pluginManagerRef.current) {
      const installedPlugins = pluginManagerRef.current.getInstalledPlugins();
      setPlugins(installedPlugins);
    }
  };

  const handleEnablePlugin = async (pluginId: string) => {
    if (!pluginManagerRef.current) return;

    setLoading(prev => ({ ...prev, [pluginId]: true }));
    try {
      await pluginManagerRef.current.enablePlugin(pluginId);
      refreshPlugins();
    } catch (error) {
      console.error('Failed to enable plugin:', error);
    } finally {
      setLoading(prev => ({ ...prev, [pluginId]: false }));
    }
  };

  const handleDisablePlugin = async (pluginId: string) => {
    if (!pluginManagerRef.current) return;

    setLoading(prev => ({ ...prev, [pluginId]: true }));
    try {
      await pluginManagerRef.current.disablePlugin(pluginId);
      refreshPlugins();
    } catch (error) {
      console.error('Failed to disable plugin:', error);
    } finally {
      setLoading(prev => ({ ...prev, [pluginId]: false }));
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    if (!pluginManagerRef.current) return;
    if (!confirm(`Are you sure you want to uninstall plugin "${pluginId}"?`)) return;

    setLoading(prev => ({ ...prev, [pluginId]: true }));
    try {
      await pluginManagerRef.current.uninstallPlugin(pluginId);
      refreshPlugins();
      if (selectedPlugin === pluginId) {
        setSelectedPlugin(null);
      }
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
    } finally {
      setLoading(prev => ({ ...prev, [pluginId]: false }));
    }
  };

  const getStatusColor = (status: PluginStatus): string => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'inactive': return '#9E9E9E';
      case 'error': return '#F44336';
      case 'loading': return '#FF9800';
      default: return '#2196F3';
    }
  };

  const getStatusText = (status: PluginStatus): string => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'error': return 'Error';
      case 'loading': return 'Loading';
      case 'loaded': return 'Loaded';
      default: return 'Unknown';
    }
  };

  const selectedPluginInfo = plugins.find(p => p.manifest.id === selectedPlugin);
  const stats = pluginManagerRef.current?.getPluginStatistics();

  return (
    <div className="plugin-manager-panel" style={{ display: 'flex', height: '500px', border: '1px solid #ddd' }}>
      {/* 插件列表 */}
      <div style={{ width: '300px', borderRight: '1px solid #ddd', overflow: 'auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #ddd', background: '#f5f5f5' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Plugins ({plugins.length})</h3>
          {stats && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Active: {stats.active} | Inactive: {stats.inactive} | Error: {stats.error}
            </div>
          )}
        </div>
        
        <div style={{ padding: '8px' }}>
          {plugins.map(plugin => (
            <div
              key={plugin.manifest.id}
              onClick={() => setSelectedPlugin(plugin.manifest.id)}
              style={{
                padding: '12px',
                margin: '4px 0',
                border: '1px solid #eee',
                borderRadius: '4px',
                cursor: 'pointer',
                background: selectedPlugin === plugin.manifest.id ? '#e3f2fd' : 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{plugin.manifest.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{plugin.manifest.version}</div>
                </div>
                <div
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: 'white',
                    background: getStatusColor(plugin.status)
                  }}
                >
                  {getStatusText(plugin.status)}
                </div>
              </div>
            </div>
          ))}
          
          {plugins.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
              No plugins installed
            </div>
          )}
        </div>
      </div>

      {/* 插件详情 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {selectedPluginInfo ? (
          <div style={{ padding: '16px' }}>
            <h3>{selectedPluginInfo.manifest.name}</h3>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              {selectedPluginInfo.manifest.description}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <strong>Version:</strong> {selectedPluginInfo.manifest.version}<br />
              <strong>ID:</strong> {selectedPluginInfo.manifest.id}<br />
              <strong>Status:</strong> <span style={{ color: getStatusColor(selectedPluginInfo.status) }}>
                {getStatusText(selectedPluginInfo.status)}
              </span><br />
              {selectedPluginInfo.manifest.author && (
                <>
                  <strong>Author:</strong> {selectedPluginInfo.manifest.author}<br />
                </>
              )}
              {selectedPluginInfo.loadTime && (
                <>
                  <strong>Load Time:</strong> {new Date(selectedPluginInfo.loadTime).toLocaleString()}<br />
                </>
              )}
            </div>

            {selectedPluginInfo.manifest.permissions.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Permissions:</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {selectedPluginInfo.manifest.permissions.map((permission, index) => (
                    <li key={index} style={{ fontSize: '14px' }}>{permission}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {selectedPluginInfo.status === 'active' ? (
                <button
                  onClick={() => handleDisablePlugin(selectedPluginInfo.manifest.id)}
                  disabled={loading[selectedPluginInfo.manifest.id]}
                  style={{
                    padding: '8px 16px',
                    background: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {loading[selectedPluginInfo.manifest.id] ? 'Disabling...' : 'Disable'}
                </button>
              ) : (
                <button
                  onClick={() => handleEnablePlugin(selectedPluginInfo.manifest.id)}
                  disabled={loading[selectedPluginInfo.manifest.id]}
                  style={{
                    padding: '8px 16px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {loading[selectedPluginInfo.manifest.id] ? 'Enabling...' : 'Enable'}
                </button>
              )}
              
              <button
                onClick={() => handleUninstallPlugin(selectedPluginInfo.manifest.id)}
                disabled={loading[selectedPluginInfo.manifest.id]}
                style={{
                  padding: '8px 16px',
                  background: '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {loading[selectedPluginInfo.manifest.id] ? 'Uninstalling...' : 'Uninstall'}
              </button>
            </div>

            {showDebugInfo && selectedPluginInfo.error && (
              <div style={{
                padding: '12px',
                background: '#ffebee',
                border: '1px solid #ffcdd2',
                borderRadius: '4px',
                marginTop: '16px'
              }}>
                <strong>Error:</strong><br />
                <pre style={{ fontSize: '12px', margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
                  {selectedPluginInfo.error.message}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#999'
          }}>
            Select a plugin to view details
          </div>
        )}
      </div>
    </div>
  );
};

export default PluginContainer;