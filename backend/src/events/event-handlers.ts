import { EventPayload, EventHandler, eventBus } from './event-bus.js';
import { getDatabase } from '@/database/connection.js';

/**
 * Core event handlers for system events
 */
export class EventHandlers {
  private static db = getDatabase();

  /**
   * Initialize default event handlers
   */
  static initialize(): void {
    // Handle system events
    eventBus.subscribe('system.startup', this.handleSystemStartup);
    eventBus.subscribe('system.shutdown', this.handleSystemShutdown);
    eventBus.subscribe('system.error', this.handleSystemError);

    // Handle user events
    eventBus.subscribe('user.connected', this.handleUserConnected);
    eventBus.subscribe('user.disconnected', this.handleUserDisconnected);

    // Handle data events
    eventBus.subscribe('data.created', this.handleDataCreated);
    eventBus.subscribe('data.updated', this.handleDataUpdated);
    eventBus.subscribe('data.deleted', this.handleDataDeleted);

    // Handle plugin events
    eventBus.subscribe('plugin.loaded', this.handlePluginLoaded);
    eventBus.subscribe('plugin.unloaded', this.handlePluginUnloaded);
    eventBus.subscribe('plugin.error', this.handlePluginError);

    // Handle chat/message events
    eventBus.subscribe('chat.message', this.handleChatMessage);
    eventBus.subscribe('chat.channel.created', this.handleChannelCreated);
    eventBus.subscribe('chat.channel.updated', this.handleChannelUpdated);

    console.log('✅ EventHandlers: Default event handlers initialized');
  }

  /**
   * System startup handler
   */
  private static handleSystemStartup: EventHandler = async (payload: EventPayload) => {
    console.log('🚀 System started:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging system startup event:', error);
    }
  };

  /**
   * System shutdown handler
   */
  private static handleSystemShutdown: EventHandler = async (payload: EventPayload) => {
    console.log('🛑 System shutting down:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging system shutdown event:', error);
    }
  };

  /**
   * System error handler
   */
  private static handleSystemError: EventHandler = async (payload: EventPayload) => {
    console.error('🚨 System error:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging system error event:', error);
    }
  };

  /**
   * User connected handler
   */
  private static handleUserConnected: EventHandler = async (payload: EventPayload) => {
    console.log('👤 User connected:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging user connected event:', error);
    }
  };

  /**
   * User disconnected handler
   */
  private static handleUserDisconnected: EventHandler = async (payload: EventPayload) => {
    console.log('👤 User disconnected:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging user disconnected event:', error);
    }
  };

  /**
   * Data created handler
   */
  private static handleDataCreated: EventHandler = async (payload: EventPayload) => {
    console.log('📝 Data created:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging data created event:', error);
    }
  };

  /**
   * Data updated handler
   */
  private static handleDataUpdated: EventHandler = async (payload: EventPayload) => {
    console.log('✏️ Data updated:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging data updated event:', error);
    }
  };

  /**
   * Data deleted handler
   */
  private static handleDataDeleted: EventHandler = async (payload: EventPayload) => {
    console.log('🗑️ Data deleted:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging data deleted event:', error);
    }
  };

  /**
   * Plugin loaded handler
   */
  private static handlePluginLoaded: EventHandler = async (payload: EventPayload) => {
    console.log('🔌 Plugin loaded:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging plugin loaded event:', error);
    }
  };

  /**
   * Plugin unloaded handler
   */
  private static handlePluginUnloaded: EventHandler = async (payload: EventPayload) => {
    console.log('🔌 Plugin unloaded:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging plugin unloaded event:', error);
    }
  };

  /**
   * Plugin error handler
   */
  private static handlePluginError: EventHandler = async (payload: EventPayload) => {
    console.error('🔌❌ Plugin error:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging plugin error event:', error);
    }
  };

  /**
   * Chat message handler
   */
  private static handleChatMessage: EventHandler = async (payload: EventPayload) => {
    console.log('💬 Chat message:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging chat message event:', error);
    }
  };

  /**
   * Channel created handler
   */
  private static handleChannelCreated: EventHandler = async (payload: EventPayload) => {
    console.log('📢 Channel created:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging channel created event:', error);
    }
  };

  /**
   * Channel updated handler
   */
  private static handleChannelUpdated: EventHandler = async (payload: EventPayload) => {
    console.log('📢 Channel updated:', payload.data);
    
    try {
      await this.db.event.create({
        data: {
          type: payload.type,
          data: JSON.stringify(payload.data),
          source: payload.source,
          timestamp: payload.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error logging channel updated event:', error);
    }
  };
}