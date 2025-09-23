import { createApp } from '@/app.js';
import { initializeDatabase } from '@/database/connection.js';
import { createWebSocketServer } from '@/websocket/websocket-server.js';
import { EnhancedWebSocketServer } from '@/websocket/enhanced-websocket-server.js';
import { EventHandlers } from '@/events/event-handlers.js';
import { eventBus } from '@/events/event-bus.js';

const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

async function startServer() {
  try {
    // Initialize database
    console.log('🔄 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    // Initialize event handlers
    console.log('🔄 Initializing event handlers...');
    EventHandlers.initialize();
    console.log('✅ Event handlers initialized successfully');

    // Emit system startup event
    await eventBus.emitEvent('system.startup', {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      ports: { http: PORT, websocket: WS_PORT }
    }, 'system');

    // Create Express app
    const app = createApp();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 HTTP Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start Enhanced WebSocket server
    console.log('🔄 Starting Enhanced WebSocket server...');
    const enhancedWsServer = new EnhancedWebSocketServer(Number(WS_PORT));

    // Register example handlers for demonstration
    enhancedWsServer.registerHandler({
      type: 'demo.message',
      handler: (data, message) => {
        console.log('Demo message received:', data);
        enhancedWsServer.broadcast({
          type: 'demo.response',
          data: { received: data, timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
          id: `demo_${Date.now()}`
        });
      },
      priority: 100
    });

    console.log(`🔌 Enhanced WebSocket server running on port ${WS_PORT}`);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      
      // Emit shutdown event
      eventBus.emitEvent('system.shutdown', {
        reason: 'SIGTERM',
        timestamp: new Date()
      }, 'system');
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        enhancedWsServer.close().then(() => {
          console.log('✅ Enhanced WebSocket server closed');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      
      // Emit shutdown event
      eventBus.emitEvent('system.shutdown', {
        reason: 'SIGINT',
        timestamp: new Date()
      }, 'system');
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        enhancedWsServer.close().then(() => {
          console.log('✅ Enhanced WebSocket server closed');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();