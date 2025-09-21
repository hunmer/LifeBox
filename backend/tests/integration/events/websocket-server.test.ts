import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import WebSocket from 'ws';
import { createWebSocketServer } from '../../../src/websocket/websocket-server.js';
import { BackendEventBus } from '../../../src/events/event-bus.js';

describe('WebSocket Server Integration', () => {
  let wsServer: any;
  let eventBus: BackendEventBus;
  const TEST_PORT = 3003;

  beforeEach(async () => {
    // Reset EventBus singleton
    (BackendEventBus as any).instance = null;
    eventBus = BackendEventBus.getInstance();
    
    // Create WebSocket server
    wsServer = createWebSocketServer(TEST_PORT);
    
    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    if (wsServer) {
      await new Promise<void>((resolve) => {
        wsServer.close(() => {
          resolve();
        });
      });
    }
    
    eventBus.removeAllListeners();
    eventBus.clearHistory();
    (BackendEventBus as any).instance = null;
  });

  describe('Basic Connection', () => {
    it('should accept WebSocket connections', async () => {
      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      await new Promise<void>((resolve, reject) => {
        client.on('open', () => {
          expect(client.readyState).toBe(WebSocket.OPEN);
          resolve();
        });
        
        client.on('error', reject);
        
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
      
      client.close();
    });

    it('should send welcome message on connection', async () => {
      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      const welcomeMessage = await new Promise<any>((resolve, reject) => {
        client.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            resolve(message);
          } catch (error) {
            reject(error);
          }
        });
        
        client.on('error', reject);
        
        setTimeout(() => reject(new Error('Message timeout')), 5000);
      });
      
      expect(welcomeMessage.type).toBe('connection');
      expect(welcomeMessage.message).toBe('Connected to LifeBox WebSocket server');
      expect(welcomeMessage.clientId).toMatch(/^client_/);
      
      client.close();
    });

    it('should emit user connected event when client connects', async () => {
      const eventPromise = new Promise<any>((resolve) => {
        eventBus.subscribe('user.connected', resolve);
      });

      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      await new Promise<void>((resolve, reject) => {
        client.on('open', resolve);
        client.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      const event = await eventPromise;
      expect(event.type).toBe('user.connected');
      expect(event.data.clientId).toMatch(/^client_/);
      expect(event.source).toBe('websocket');
      
      client.close();
    });
  });

  describe('Event Broadcasting', () => {
    it('should receive events broadcasted by EventBus', async () => {
      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        client.on('open', resolve);
        client.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      // Skip welcome message
      await new Promise<void>((resolve) => {
        client.on('message', () => resolve());
      });

      // Listen for the test event
      const eventPromise = new Promise<any>((resolve, reject) => {
        client.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'event' && message.payload.type === 'test.broadcast') {
              resolve(message);
            }
          } catch (error) {
            reject(error);
          }
        });
        
        setTimeout(() => reject(new Error('Event timeout')), 5000);
      });

      // Emit event through EventBus
      await eventBus.emitEvent('test.broadcast', { message: 'Hello WebSocket!' }, 'test');

      const receivedMessage = await eventPromise;
      expect(receivedMessage.type).toBe('event');
      expect(receivedMessage.payload.type).toBe('test.broadcast');
      expect(receivedMessage.payload.data.message).toBe('Hello WebSocket!');
      
      client.close();
    });

    it('should handle multiple connected clients', async () => {
      const client1 = new WebSocket(`ws://localhost:${TEST_PORT}`);
      const client2 = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      // Wait for both connections
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          client1.on('open', resolve);
          client1.on('error', reject);
        }),
        new Promise<void>((resolve, reject) => {
          client2.on('open', resolve);
          client2.on('error', reject);
        })
      ]);

      // Skip welcome messages
      await Promise.all([
        new Promise<void>((resolve) => client1.on('message', () => resolve())),
        new Promise<void>((resolve) => client2.on('message', () => resolve()))
      ]);

      // Set up event listeners
      const events: any[] = [];
      const eventHandler = (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'event') {
            events.push(message);
          }
        } catch (error) {
          // Ignore parse errors
        }
      };

      client1.on('message', eventHandler);
      client2.on('message', eventHandler);

      // Emit event
      await eventBus.emitEvent('multi.client.test', { data: 'broadcast to all' }, 'test');

      // Wait for events to be received
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(events).toHaveLength(2);
      expect(events[0].payload.type).toBe('multi.client.test');
      expect(events[1].payload.type).toBe('multi.client.test');
      
      client1.close();
      client2.close();
    });
  });

  describe('Client Message Handling', () => {
    it('should handle event messages from clients', async () => {
      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        client.on('open', resolve);
        client.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      // Skip welcome message
      await new Promise<void>((resolve) => {
        client.on('message', () => resolve());
      });

      // Listen for the event in EventBus
      const eventPromise = new Promise<any>((resolve) => {
        eventBus.subscribe('client.test.event', resolve);
      });

      // Send event from client
      client.send(JSON.stringify({
        type: 'event',
        eventType: 'client.test.event',
        data: { message: 'Hello from client!' },
        metadata: { priority: 'high' }
      }));

      const receivedEvent = await eventPromise;
      expect(receivedEvent.type).toBe('client.test.event');
      expect(receivedEvent.data.message).toBe('Hello from client!');
      expect(receivedEvent.metadata.priority).toBe('high');
      expect(receivedEvent.source).toMatch(/^websocket:client_/);
      
      client.close();
    });

    it('should handle subscription messages', async () => {
      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        client.on('open', resolve);
        client.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      // Skip welcome message
      await new Promise<void>((resolve) => {
        client.on('message', () => resolve());
      });

      // Listen for subscription confirmation
      const subscriptionPromise = new Promise<any>((resolve, reject) => {
        client.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'subscribed') {
              resolve(message);
            }
          } catch (error) {
            reject(error);
          }
        });
        
        setTimeout(() => reject(new Error('Subscription timeout')), 5000);
      });

      // Send subscription message
      client.send(JSON.stringify({
        type: 'subscribe',
        eventTypes: ['specific.event', 'another.event']
      }));

      const subscriptionResponse = await subscriptionPromise;
      expect(subscriptionResponse.type).toBe('subscribed');
      expect(subscriptionResponse.eventTypes).toEqual(['specific.event', 'another.event']);
      
      client.close();
    });

    it('should handle ping messages', async () => {
      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        client.on('open', resolve);
        client.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      // Skip welcome message
      await new Promise<void>((resolve) => {
        client.on('message', () => resolve());
      });

      // Listen for pong response
      const pongPromise = new Promise<any>((resolve, reject) => {
        client.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'pong') {
              resolve(message);
            }
          } catch (error) {
            reject(error);
          }
        });
        
        setTimeout(() => reject(new Error('Pong timeout')), 5000);
      });

      // Send ping
      client.send(JSON.stringify({ type: 'ping' }));

      const pongResponse = await pongPromise;
      expect(pongResponse.type).toBe('pong');
      expect(pongResponse.timestamp).toBeDefined();
      
      client.close();
    });

    it('should handle malformed messages gracefully', async () => {
      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        client.on('open', resolve);
        client.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      // Skip welcome message
      await new Promise<void>((resolve) => {
        client.on('message', () => resolve());
      });

      // Listen for error response
      const errorPromise = new Promise<any>((resolve, reject) => {
        client.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'error') {
              resolve(message);
            }
          } catch (error) {
            reject(error);
          }
        });
        
        setTimeout(() => reject(new Error('Error timeout')), 5000);
      });

      // Send malformed JSON
      client.send('invalid json');

      const errorResponse = await errorPromise;
      expect(errorResponse.type).toBe('error');
      expect(errorResponse.message).toBe('Invalid message format');
      
      client.close();
    });
  });

  describe('Disconnection Handling', () => {
    it('should emit user disconnected event when client disconnects', async () => {
      let clientId: string;
      
      const disconnectPromise = new Promise<any>((resolve) => {
        eventBus.subscribe('user.disconnected', resolve);
      });

      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      // Wait for connection and get client ID
      await new Promise<void>((resolve, reject) => {
        client.on('open', resolve);
        client.on('error', reject);
        client.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'connection') {
              clientId = message.clientId;
            }
          } catch (error) {
            // Ignore parse errors
          }
        });
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      // Close connection
      client.close();

      const disconnectEvent = await disconnectPromise;
      expect(disconnectEvent.type).toBe('user.disconnected');
      expect(disconnectEvent.data.clientId).toBe(clientId);
      expect(disconnectEvent.source).toBe('websocket');
    });
  });
});