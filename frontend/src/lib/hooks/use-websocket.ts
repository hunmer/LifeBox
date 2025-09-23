import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WebSocketState,
  WebSocketMessageHandler,
  WebSocketHandlerConfig
} from '@lifebox/shared';
import { getWebSocketClient, WebSocketClient } from '../services/websocket-client';

/**
 * useWebSocket Hook 的返回类型
 */
export interface UseWebSocketReturn {
  /** WebSocket 连接状态 */
  state: WebSocketState;
  /** 客户端ID */
  clientId: string | null;
  /** 是否已连接 */
  isConnected: boolean;
  /** 发送消息 */
  send: <T = any>(type: string, data: T) => void;
  /** 连接到服务器 */
  connect: () => Promise<void>;
  /** 断开连接 */
  disconnect: () => void;
  /** 注册消息处理器 */
  register: <T = any>(config: WebSocketHandlerConfig<T>) => void;
  /** 注销消息处理器 */
  unregister: (type: string, handler?: WebSocketMessageHandler) => void;
  /** 订阅事件 */
  subscribe: (eventTypes: string[]) => void;
  /** 取消订阅事件 */
  unsubscribe: (eventTypes: string[]) => void;
}

/**
 * useWebSocket Hook 配置选项
 */
export interface UseWebSocketOptions {
  /** 是否自动连接（默认 true） */
  autoConnect?: boolean;
  /** 组件卸载时是否自动断开连接（默认 false，保持连接以供其他组件使用） */
  autoDisconnect?: boolean;
  /** 初始消息处理器 */
  handlers?: WebSocketHandlerConfig[];
}

/**
 * React Hook 用于管理 WebSocket 连接
 * @param options 配置选项
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    autoDisconnect = false,
    handlers = []
  } = options;

  const [state, setState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  const [clientId, setClientId] = useState<string | null>(null);
  const clientRef = useRef<WebSocketClient | null>(null);
  const handlersRef = useRef<WebSocketHandlerConfig[]>([]);

  // 获取 WebSocket 客户端实例
  const getClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = getWebSocketClient();
    }
    return clientRef.current;
  }, []);

  // 连接到服务器
  const connect = useCallback(async () => {
    const client = getClient();
    await client.connect();
  }, [getClient]);

  // 断开连接
  const disconnect = useCallback(() => {
    const client = getClient();
    client.disconnect();
  }, [getClient]);

  // 发送消息
  const send = useCallback(<T = any>(type: string, data: T) => {
    const client = getClient();
    client.send(type, data);
  }, [getClient]);

  // 注册消息处理器
  const register = useCallback(<T = any>(config: WebSocketHandlerConfig<T>) => {
    const client = getClient();
    client.register(config);
    handlersRef.current.push(config);
  }, [getClient]);

  // 注销消息处理器
  const unregister = useCallback((type: string, handler?: WebSocketMessageHandler) => {
    const client = getClient();
    client.unregister(type, handler);

    // 从本地记录中移除
    if (handler) {
      handlersRef.current = handlersRef.current.filter(
        config => config.type !== type || config.handler !== handler
      );
    } else {
      handlersRef.current = handlersRef.current.filter(
        config => config.type !== type
      );
    }
  }, [getClient]);

  // 订阅事件
  const subscribe = useCallback((eventTypes: string[]) => {
    const client = getClient();
    client.subscribe(eventTypes);
  }, [getClient]);

  // 取消订阅事件
  const unsubscribe = useCallback((eventTypes: string[]) => {
    const client = getClient();
    client.unsubscribe(eventTypes);
  }, [getClient]);

  // 初始化 WebSocket 连接和状态监听
  useEffect(() => {
    const client = getClient();

    // 监听状态变化
    const unsubscribeState = client.onStateChange((newState) => {
      setState(newState);
      setClientId(client.getClientId());
    });

    // 设置初始状态
    setState(client.getState());
    setClientId(client.getClientId());

    // 注册初始处理器
    handlers.forEach(handler => {
      client.register(handler);
      handlersRef.current.push(handler);
    });

    // 自动连接
    if (autoConnect && client.getState() === WebSocketState.DISCONNECTED) {
      connect();
    }

    // 清理函数
    return () => {
      unsubscribeState();

      // 注销在此 Hook 中注册的处理器
      handlersRef.current.forEach(handler => {
        client.unregister(handler.type, handler.handler);
      });
      handlersRef.current = [];

      // 可选的自动断开连接
      if (autoDisconnect) {
        client.disconnect();
      }
    };
  }, []); // 空依赖数组，仅在组件挂载时执行

  return {
    state,
    clientId,
    isConnected: state === WebSocketState.CONNECTED,
    send,
    connect,
    disconnect,
    register,
    unregister,
    subscribe,
    unsubscribe
  };
}

/**
 * 简化版的 useWebSocket Hook，只返回基本的连接信息
 */
export function useWebSocketState(): {
  state: WebSocketState;
  isConnected: boolean;
  clientId: string | null;
} {
  const [state, setState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const client = getWebSocketClient();

    const unsubscribeState = client.onStateChange((newState) => {
      setState(newState);
      setClientId(client.getClientId());
    });

    // 设置初始状态
    setState(client.getState());
    setClientId(client.getClientId());

    return unsubscribeState;
  }, []);

  return {
    state,
    isConnected: state === WebSocketState.CONNECTED,
    clientId
  };
}