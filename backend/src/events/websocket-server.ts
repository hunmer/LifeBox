import { WebSocketServer, WebSocket } from 'ws';

interface WebSocketClient extends WebSocket {
  id?: string;
  isAlive?: boolean;
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
    clients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to LifeBox WebSocket server',
      clientId: ws.id,
      timestamp: new Date().toISOString(),
    }));

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📨 Received message from ${ws.id}:`, message);

        // Echo the message to all other clients
        broadcastToOthers(ws, {
          type: 'broadcast',
          data: message,
          from: ws.id,
          timestamp: new Date().toISOString(),
        });
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
      clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for client ${ws.id}:`, error);
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

  // Clean up on server close
  wss.on('close', () => {
    clearInterval(heartbeat);
    clients.clear();
  });

  console.log(`🔌 WebSocket server created on port ${port}`);
  
  // Expose broadcast functions for external use
  (wss as any).broadcastToAll = broadcastToAll;
  (wss as any).broadcastToOthers = broadcastToOthers;
  (wss as any).clients = clients;

  return wss;
}