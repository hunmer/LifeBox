import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BackendEventBus, EventPayload, PluginEventHandler } from '../../../src/events/event-bus.js';

describe('BackendEventBus', () => {
  let eventBus: BackendEventBus;

  beforeEach(() => {
    // Create a new instance for each test
    (BackendEventBus as any).instance = null;
    eventBus = BackendEventBus.getInstance();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
    eventBus.clearHistory();
    (BackendEventBus as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = BackendEventBus.getInstance();
      const instance2 = BackendEventBus.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Event Emission', () => {
    it('should emit events with correct payload structure', async () => {
      const eventType = 'test.event';
      const eventData = { message: 'test data' };
      const source = 'test-source';
      const metadata = { priority: 'high' };

      const handler = jest.fn();
      eventBus.subscribe(eventType, handler);

      await eventBus.emitEvent(eventType, eventData, source, metadata);

      expect(handler).toHaveBeenCalledTimes(1);
      const payload = handler.mock.calls[0][0] as EventPayload;
      
      expect(payload.type).toBe(eventType);
      expect(payload.data).toEqual(eventData);
      expect(payload.source).toBe(source);
      expect(payload.metadata).toEqual(metadata);
      expect(payload.id).toBeDefined();
      expect(payload.timestamp).toBeInstanceOf(Date);
    });

    it('should emit to wildcard listeners', async () => {
      const wildcardHandler = jest.fn();
      const specificHandler = jest.fn();
      
      eventBus.subscribeToAll(wildcardHandler);
      eventBus.subscribe('specific.event', specificHandler);

      await eventBus.emitEvent('specific.event', { test: true }, 'test');

      expect(wildcardHandler).toHaveBeenCalledTimes(1);
      expect(specificHandler).toHaveBeenCalledTimes(1);
    });

    it('should add events to history', async () => {
      await eventBus.emitEvent('test.event', { data: 'test' }, 'test');
      await eventBus.emitEvent('another.event', { data: 'another' }, 'test');

      const history = eventBus.getEventHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('test.event');
      expect(history[1].type).toBe('another.event');
    });
  });

  describe('Event History', () => {
    beforeEach(async () => {
      // Populate some test events
      await eventBus.emitEvent('event.1', { data: 1 }, 'test');
      await eventBus.emitEvent('event.2', { data: 2 }, 'test');
      await eventBus.emitEvent('event.1', { data: 3 }, 'test');
    });

    it('should return all events when no filters applied', () => {
      const history = eventBus.getEventHistory();
      expect(history).toHaveLength(3);
    });

    it('should filter by event type', () => {
      const history = eventBus.getEventHistory(undefined, 'event.1');
      expect(history).toHaveLength(2);
      expect(history.every(event => event.type === 'event.1')).toBe(true);
    });

    it('should limit results', () => {
      const history = eventBus.getEventHistory(2);
      expect(history).toHaveLength(2);
    });

    it('should clear history', () => {
      eventBus.clearHistory();
      const history = eventBus.getEventHistory();
      expect(history).toHaveLength(0);
    });

    it('should maintain history size limit', async () => {
      // Set a small limit for testing
      (eventBus as any).maxHistorySize = 2;
      
      await eventBus.emitEvent('new.event', { data: 'new' }, 'test');
      
      const history = eventBus.getEventHistory();
      expect(history).toHaveLength(2);
      // Should have the last 2 events
      expect(history[0].type).toBe('event.1');
      expect(history[1].type).toBe('new.event');
    });
  });

  describe('Plugin Event Handlers', () => {
    it('should register plugin handlers', () => {
      const handler: PluginEventHandler = {
        pluginId: 'test-plugin',
        eventTypes: ['test.event'],
        handler: jest.fn(),
        priority: 10
      };

      eventBus.registerPluginHandler(handler);
      
      const stats = eventBus.getStats();
      expect(stats.pluginHandlers).toBe(1);
    });

    it('should call plugin handlers when events are emitted', async () => {
      const mockHandler = jest.fn();
      const handler: PluginEventHandler = {
        pluginId: 'test-plugin',
        eventTypes: ['test.event'],
        handler: mockHandler,
        priority: 10
      };

      eventBus.registerPluginHandler(handler);
      await eventBus.emitEvent('test.event', { data: 'test' }, 'test');

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple event types for one plugin', async () => {
      const mockHandler = jest.fn();
      const handler: PluginEventHandler = {
        pluginId: 'multi-plugin',
        eventTypes: ['event.1', 'event.2'],
        handler: mockHandler,
        priority: 10
      };

      eventBus.registerPluginHandler(handler);
      await eventBus.emitEvent('event.1', { data: 1 }, 'test');
      await eventBus.emitEvent('event.2', { data: 2 }, 'test');
      await eventBus.emitEvent('event.3', { data: 3 }, 'test');

      expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    it('should sort handlers by priority', async () => {
      const calls: string[] = [];
      
      const handler1: PluginEventHandler = {
        pluginId: 'plugin-1',
        eventTypes: ['test.event'],
        handler: async () => { calls.push('plugin-1'); },
        priority: 5
      };
      
      const handler2: PluginEventHandler = {
        pluginId: 'plugin-2',
        eventTypes: ['test.event'],
        handler: async () => { calls.push('plugin-2'); },
        priority: 10
      };

      eventBus.registerPluginHandler(handler1);
      eventBus.registerPluginHandler(handler2);
      
      await eventBus.emitEvent('test.event', { data: 'test' }, 'test');
      
      expect(calls).toEqual(['plugin-2', 'plugin-1']);
    });

    it('should unregister plugin handlers', () => {
      const handler: PluginEventHandler = {
        pluginId: 'test-plugin',
        eventTypes: ['test.event'],
        handler: jest.fn(),
        priority: 10
      };

      eventBus.registerPluginHandler(handler);
      expect(eventBus.getStats().pluginHandlers).toBe(1);
      
      eventBus.unregisterPluginHandler('test-plugin');
      expect(eventBus.getStats().pluginHandlers).toBe(0);
    });

    it('should handle errors in plugin handlers gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const errorHandler: PluginEventHandler = {
        pluginId: 'error-plugin',
        eventTypes: ['test.event'],
        handler: async () => { throw new Error('Plugin error'); },
        priority: 10
      };

      eventBus.registerPluginHandler(errorHandler);
      
      // Should not throw
      await expect(eventBus.emitEvent('test.event', { data: 'test' }, 'test'))
        .resolves.not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in plugin handler error-plugin'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe and unsubscribe from events', async () => {
      const handler = jest.fn();
      const unsubscribe = eventBus.subscribe('test.event', handler);

      await eventBus.emitEvent('test.event', { data: 'test' }, 'test');
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      await eventBus.emitEvent('test.event', { data: 'test2' }, 'test');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should subscribe and unsubscribe from all events', async () => {
      const handler = jest.fn();
      const unsubscribe = eventBus.subscribeToAll(handler);

      await eventBus.emitEvent('any.event', { data: 'test' }, 'test');
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      await eventBus.emitEvent('any.event', { data: 'test2' }, 'test');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', async () => {
      await eventBus.emitEvent('event.1', { data: 1 }, 'test');
      await eventBus.emitEvent('event.2', { data: 2 }, 'test');
      
      const handler: PluginEventHandler = {
        pluginId: 'test-plugin',
        eventTypes: ['test.event'],
        handler: jest.fn(),
        priority: 10
      };
      eventBus.registerPluginHandler(handler);

      const stats = eventBus.getStats();
      
      expect(stats.totalEvents).toBe(2);
      expect(stats.pluginHandlers).toBe(1);
      expect(stats.eventTypes).toContain('event.1');
      expect(stats.eventTypes).toContain('event.2');
      expect(stats.wsConnected).toBe(false);
    });
  });

  describe('WebSocket Integration', () => {
    it('should register WebSocket server', () => {
      const mockWsServer = { 
        broadcastEvent: jest.fn() 
      } as any;
      
      eventBus.setWebSocketServer(mockWsServer);
      
      const stats = eventBus.getStats();
      expect(stats.wsConnected).toBe(true);
    });

    it('should broadcast events to WebSocket when registered', async () => {
      const mockBroadcastEvent = jest.fn();
      const mockWsServer = { 
        broadcastEvent: mockBroadcastEvent 
      } as any;
      
      eventBus.setWebSocketServer(mockWsServer);
      await eventBus.emitEvent('test.event', { data: 'test' }, 'test');
      
      expect(mockBroadcastEvent).toHaveBeenCalledTimes(1);
      expect(mockBroadcastEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test.event',
          data: { data: 'test' },
          source: 'test'
        })
      );
    });

    it('should handle WebSocket broadcast errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const mockWsServer = { 
        broadcastEvent: jest.fn().mockImplementation(() => {
          throw new Error('WebSocket error');
        })
      } as any;
      
      eventBus.setWebSocketServer(mockWsServer);
      
      // Should not throw
      await expect(eventBus.emitEvent('test.event', { data: 'test' }, 'test'))
        .resolves.not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error broadcasting to WebSocket'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});