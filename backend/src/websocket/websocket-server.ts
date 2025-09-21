import { WebSocketServer, WebSocket } from 'ws';
import { eventBus, EventPayload } from '@/events/event-bus.js';

interface WebSocketClient extends WebSocket {
  id?: string;
  isAlive?: boolean;
  subscriptions?: Set<string>;
}

export function createWebSocketServer(port: number): WebSocketServer {
  const wss = new WebSocketServer({ port });

  // Store connected clients
  const clients = new Set<WebSocketClient>();

  wss.on('connection', (ws: WebSocketClient, req) => {
    console.log(`🔌 New WebSocket connection from ${req.socket.remoteAddress}`);
    
    // Generate unique client ID
    ws.id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    ws.isAlive = true;
    ws.subscriptions = new Set(['*']); // Subscribe to all events by default
    clients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to LifeBox WebSocket server',
      clientId: ws.id,
      timestamp: new Date().toISOString(),
    }));

    // Emit user connected event
    eventBus.emitEvent('user.connected', {
      clientId: ws.id,
      remoteAddress: req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    }, 'websocket');

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📨 Received message from ${ws.id}:`, message);

        handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          timestamp: new Date().toISOString(),
        }));
      }
    });

    // Handle pong responses for heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log(`🔌 Client ${ws.id} disconnected`);
      
      // Emit user disconnected event
      eventBus.emitEvent('user.disconnected', {
        clientId: ws.id
      }, 'websocket');
      
      clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for client ${ws.id}:`, error);
      
      // Emit error event
      eventBus.emitEvent('system.error', {
        type: 'websocket_error',
        clientId: ws.id,
        error: error.message
      }, 'websocket');
      
      clients.delete(ws);
    });
  });

  // Heartbeat mechanism to detect dead connections
  const heartbeat = setInterval(() => {
    clients.forEach((ws) => {
      if (!ws.isAlive) {
        console.log(`💀 Terminating dead connection: ${ws.id}`);
        clients.delete(ws);
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds

  // Handle WebSocket messages
  function handleWebSocketMessage(ws: WebSocketClient, message: any): void {
    switch (message.type) {
      case 'event':
        // Emit event to the event bus
        eventBus.emitEvent(message.eventType, message.data, `websocket:${ws.id}`, message.metadata);
        break;
      
      case 'subscribe':
        // Subscribe to specific event types
        if (message.eventTypes && Array.isArray(message.eventTypes)) {
          ws.subscriptions = new Set(message.eventTypes);
          ws.send(JSON.stringify({
            type: 'subscribed',
            eventTypes: message.eventTypes,
            timestamp: new Date().toISOString()
          }));
        }
        break;
      
      case 'unsubscribe':
        // Unsubscribe from specific event types
        if (message.eventTypes && Array.isArray(message.eventTypes)) {
          message.eventTypes.forEach((eventType: string) => {
            ws.subscriptions?.delete(eventType);
          });
          ws.send(JSON.stringify({
            type: 'unsubscribed',
            eventTypes: message.eventTypes,
            timestamp: new Date().toISOString()
          }));
        }
        break;
      
      case 'ping':
        // Respond to ping
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
      
      case 'chat.message':
        // Handle chat messages
        eventBus.emitEvent('chat.message', {
          ...message.data,
          clientId: ws.id
        }, 'websocket');
        break;
      
      default:
        // Echo the message to all other clients for backward compatibility
        broadcastToOthers(ws, {
          type: 'broadcast',
          data: message,
          from: ws.id,
          timestamp: new Date().toISOString(),
        });
    }
  }

  // Broadcast message to all connected clients
  function broadcastToAll(message: any): void {
    const messageStr = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Broadcast message to all clients except sender
  function broadcastToOthers(sender: WebSocketClient, message: any): void {
    const messageStr = JSON.stringify(message);
    clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Broadcast event to subscribed clients
  function broadcastEvent(eventPayload: EventPayload): void {
    const message = {
      type: 'event',
      payload: eventPayload,
      timestamp: new Date().toISOString()
    };
    
    const messageStr = JSON.stringify(message);
    
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // Check if client is subscribed to this event type
        const isSubscribed = client.subscriptions?.has('*') || 
                            client.subscriptions?.has(eventPayload.type);
        
        if (isSubscribed) {
          client.send(messageStr);
        }
      }
    });
  }

  // Clean up on server close
  wss.on('close', () => {
    clearInterval(heartbeat);
    clients.clear();
  });

  console.log(`🔌 WebSocket server created on port ${port}`);
  
  // Register the WebSocket server with the event bus
  eventBus.setWebSocketServer(wss);
  
  // Expose broadcast functions for external use
  (wss as any).broadcastToAll = broadcastToAll;
  (wss as any).broadcastToOthers = broadcastToOthers;
  (wss as any).broadcastEvent = broadcastEvent;
  (wss as any).clients = clients;

  return wss;
}