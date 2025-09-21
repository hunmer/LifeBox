import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';

export interface EventPayload {
  id: string;
  type: string;
  data: any;
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface EventHandler {
  (payload: EventPayload): void | Promise<void>;
}

export interface PluginEventHandler {
  pluginId: string;
  eventTypes: string[];
  handler: EventHandler;
  priority?: number;
}

export class BackendEventBus extends EventEmitter {
  private static instance: BackendEventBus | null = null;
  private pluginHandlers: Map<string, PluginEventHandler[]> = new Map();
  private wsServer: WebSocketServer | null = null;
  private eventHistory: EventPayload[] = [];
  private maxHistorySize: number = 1000;

  constructor() {
    super();
    this.setMaxListeners(100); // Increase max listeners for plugins
  }

  /**
   * Get singleton instance of EventBus
   */
  static getInstance(): BackendEventBus {
    if (!BackendEventBus.instance) {
      BackendEventBus.instance = new BackendEventBus();
    }
    return BackendEventBus.instance;
  }

  /**
   * Set WebSocket server for broadcasting events
   */
  setWebSocketServer(wsServer: WebSocketServer): void {
    this.wsServer = wsServer;
    console.log('🔌 EventBus: WebSocket server registered for broadcasting');
  }

  /**
   * Emit an event to all listeners and WebSocket clients
   */
  async emitEvent(type: string, data: any, source: string = 'backend', metadata?: Record<string, any>): Promise<void> {
    const eventPayload: EventPayload = {
      id: uuidv4(),
      type,
      data,
      source,
      timestamp: new Date(),
      metadata
    };

    // Add to history
    this.addToHistory(eventPayload);

    // Emit to internal listeners
    this.emit(type, eventPayload);
    this.emit('*', eventPayload); // Wildcard listener

    // Handle plugin events
    await this.handlePluginEvents(eventPayload);

    // Broadcast via WebSocket
    this.broadcastToWebSocket(eventPayload);

    console.log(`📢 EventBus: Emitted event "${type}" from "${source}"`);
  }

  /**
   * Register a plugin event handler
   */
  registerPluginHandler(handler: PluginEventHandler): void {
    for (const eventType of handler.eventTypes) {
      if (!this.pluginHandlers.has(eventType)) {
        this.pluginHandlers.set(eventType, []);
      }
      
      const handlers = this.pluginHandlers.get(eventType)!;
      handlers.push(handler);
      
      // Sort by priority (higher priority first)
      handlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    console.log(`🔌 EventBus: Registered plugin handler for ${handler.pluginId} (events: ${handler.eventTypes.join(', ')})`);
  }

  /**
   * Unregister a plugin event handler
   */
  unregisterPluginHandler(pluginId: string): void {
    for (const [eventType, handlers] of this.pluginHandlers.entries()) {
      const filteredHandlers = handlers.filter(h => h.pluginId !== pluginId);
      if (filteredHandlers.length === 0) {
        this.pluginHandlers.delete(eventType);
      } else {
        this.pluginHandlers.set(eventType, filteredHandlers);
      }
    }

    console.log(`🔌 EventBus: Unregistered plugin handler for ${pluginId}`);
  }

  /**
   * Get event history
   */
  getEventHistory(limit?: number, eventType?: string): EventPayload[] {
    let history = this.eventHistory;
    
    if (eventType) {
      history = history.filter(event => event.type === eventType);
    }
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return history;
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType: string, handler: EventHandler): () => void {
    this.on(eventType, handler);
    
    return () => {
      this.off(eventType, handler);
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeToAll(handler: EventHandler): () => void {
    this.on('*', handler);
    
    return () => {
      this.off('*', handler);
    };
  }

  /**
   * Handle plugin events
   */
  private async handlePluginEvents(eventPayload: EventPayload): Promise<void> {
    const handlers = this.pluginHandlers.get(eventPayload.type) || [];
    
    for (const pluginHandler of handlers) {
      try {
        await pluginHandler.handler(eventPayload);
      } catch (error) {
        console.error(`❌ EventBus: Error in plugin handler ${pluginHandler.pluginId}:`, error);
      }
    }
  }

  /**
   * Broadcast event to WebSocket clients
   */
  private broadcastToWebSocket(eventPayload: EventPayload): void {
    if (!this.wsServer) {
      return;
    }

    try {
      (this.wsServer as any).broadcastEvent?.(eventPayload);
    } catch (error) {
      console.error('❌ EventBus: Error broadcasting to WebSocket:', error);
    }
  }

  /**
   * Add event to history
   */
  private addToHistory(eventPayload: EventPayload): void {
    this.eventHistory.push(eventPayload);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    console.log('🧹 EventBus: Event history cleared');
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEvents: number;
    pluginHandlers: number;
    eventTypes: string[];
    wsConnected: boolean;
  } {
    const eventTypes = [...new Set(this.eventHistory.map(e => e.type))];
    const pluginHandlerCount = Array.from(this.pluginHandlers.values())
      .reduce((sum, handlers) => sum + handlers.length, 0);

    return {
      totalEvents: this.eventHistory.length,
      pluginHandlers: pluginHandlerCount,
      eventTypes,
      wsConnected: !!this.wsServer
    };
  }
}

// Export singleton instance
export const eventBus = BackendEventBus.getInstance();