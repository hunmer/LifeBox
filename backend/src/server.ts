import { createApp } from '@/app.js';
import { initializeDatabase } from '@/database/connection.js';
import { createWebSocketServer } from '@/events/websocket-server.js';

const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

async function startServer() {
  try {
    // Initialize database
    console.log('🔄 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    // Create Express app
    const app = createApp();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 HTTP Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start WebSocket server
    console.log('🔄 Starting WebSocket server...');
    const wsServer = createWebSocketServer(Number(WS_PORT));
    console.log(`🔌 WebSocket server running on port ${WS_PORT}`);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ HTTP server closed');
        wsServer.close(() => {
          console.log('✅ WebSocket server closed');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ HTTP server closed');
        wsServer.close(() => {
          console.log('✅ WebSocket server closed');
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