import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../lib/hooks/use-websocket';
import { WebSocketMessageTypes } from '@lifebox/shared';

/**
 * WebSocket 演示组件
 * 展示如何使用 WebSocket 发送和接收消息
 */
export function WebSocketDemo() {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  const {
    state,
    isConnected,
    clientId,
    send,
    connect,
    disconnect,
    register,
    unregister
  } = useWebSocket({
    autoConnect: true,
    handlers: [
      {
        type: 'demo.response',
        handler: (data: { received: any; timestamp: string }) => {
          setMessages(prev => [...prev, `Server response: ${JSON.stringify(data)}`]);
        }
      },
      {
        type: WebSocketMessageTypes.EVENT,
        handler: (data: { eventType: string; data: any }) => {
          setMessages(prev => [...prev, `Event received: ${data.eventType} - ${JSON.stringify(data.data)}`]);
        }
      }
    ]
  });

  // 发送演示消息
  const sendDemoMessage = () => {
    if (inputMessage.trim()) {
      send('demo.message', { text: inputMessage, timestamp: new Date().toISOString() });
      setMessages(prev => [...prev, `Sent: ${inputMessage}`]);
      setInputMessage('');
    }
  };

  // 发送心跳
  const sendPing = () => {
    send(WebSocketMessageTypes.PING, { timestamp: new Date().toISOString() });
    setMessages(prev => [...prev, 'Ping sent to server']);
  };

  // 订阅事件
  const subscribeToEvents = () => {
    const eventTypes = ['chat.message', 'system.notification', 'user.activity'];
    send(WebSocketMessageTypes.SUBSCRIBE, { eventTypes });
    setMessages(prev => [...prev, `Subscribed to: ${eventTypes.join(', ')}`]);
  };

  // 清空消息
  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">WebSocket 演示</h2>

      {/* 连接状态 */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">连接状态</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">状态: </span>
            <span className={`px-2 py-1 rounded text-white ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {state}
            </span>
          </div>
          <div>
            <span className="font-medium">客户端ID: </span>
            <span className="font-mono text-xs">{clientId || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={connect}
          disabled={isConnected}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          连接
        </button>
        <button
          onClick={disconnect}
          disabled={!isConnected}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          断开
        </button>
        <button
          onClick={sendPing}
          disabled={!isConnected}
          className="px-4 py-2 bg-yellow-500 text-white rounded disabled:bg-gray-400"
        >
          发送心跳
        </button>
        <button
          onClick={subscribeToEvents}
          disabled={!isConnected}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-400"
        >
          订阅事件
        </button>
        <button
          onClick={clearMessages}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          清空消息
        </button>
      </div>

      {/* 发送消息 */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendDemoMessage()}
            placeholder="输入演示消息..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
            disabled={!isConnected}
          />
          <button
            onClick={sendDemoMessage}
            disabled={!isConnected || !inputMessage.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
          >
            发送
          </button>
        </div>
      </div>

      {/* 消息日志 */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">消息日志</h3>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-gray-500">暂无消息...</div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="mb-1">
                {new Date().toLocaleTimeString()} - {message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="text-sm text-gray-600">
        <h3 className="font-semibold mb-2">使用说明:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>点击"连接"按钮连接到 WebSocket 服务器</li>
          <li>在输入框中输入消息并点击"发送"进行测试</li>
          <li>点击"发送心跳"测试心跳功能</li>
          <li>点击"订阅事件"订阅系统事件</li>
          <li>所有收发的消息都会显示在消息日志中</li>
        </ul>
      </div>
    </div>
  );
}