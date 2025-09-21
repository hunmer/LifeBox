/**
 * 事件类型模块单元测试
 * 
 * 测试前端事件类型定义、验证器、类型守卫函数和
 * 快捷事件创建函数的功能。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FrontendEventTypes,
  TypedEventFactory,
  EventTypeValidator,
  isUIEvent,
  isPluginEvent,
  isNavigationEvent,
  createQuickEvents,
} from '../../../src/lib/events/event-types';
import type { LifeBoxEvent, EventFactory } from '@lifebox/shared';

describe('前端事件类型', () => {
  let mockEventFactory: EventFactory;
  let typedFactory: TypedEventFactory;

  beforeEach(() => {
    mockEventFactory = vi.fn((type: string, data: any, source: string = 'system') => ({
      id: `event_${Date.now()}`,
      type,
      data,
      source,
      timestamp: Date.now(),
      cancelled: false,
      propagation: true,
    }));

    typedFactory = new TypedEventFactory(mockEventFactory);
  });

  describe('FrontendEventTypes', () => {
    it('should contain all expected event types', () => {
      expect(FrontendEventTypes.UI_THEME_CHANGED).toBe('ui:theme-changed');
      expect(FrontendEventTypes.PLUGIN_ERROR_OCCURRED).toBe('plugin:error-occurred');
      expect(FrontendEventTypes.NAVIGATION_ROUTE_CHANGED).toBe('navigation:route-changed');
      expect(FrontendEventTypes.STORAGE_DATA_CHANGED).toBe('storage:data-changed');
      expect(FrontendEventTypes.NETWORK_ONLINE).toBe('network:online');
      expect(FrontendEventTypes.USER_ACTION_PERFORMED).toBe('user:action-performed');
    });
  });

  describe('TypedEventFactory', () => {
    it('should create UI events correctly', () => {
      const uiEvent = typedFactory.createUIEvent(
        FrontendEventTypes.UI_THEME_CHANGED,
        {
          theme: {
            mode: 'dark',
            primaryColor: '#1976d2',
          },
        }
      );

      expect(mockEventFactory).toHaveBeenCalledWith(
        'ui:theme-changed',
        {
          theme: {
            mode: 'dark',
            primaryColor: '#1976d2',
          },
        },
        'ui'
      );
      
      expect(uiEvent.type).toBe('ui:theme-changed');
      expect(uiEvent.source).toBe('ui');
    });

    it('should create plugin events correctly', () => {
      const pluginEvent = typedFactory.createPluginEvent(
        FrontendEventTypes.PLUGIN_ERROR_OCCURRED,
        {
          pluginId: 'chat-plugin',
          error: {
            message: 'Plugin initialization failed',
            code: 'INIT_ERROR',
          },
        }
      );

      expect(mockEventFactory).toHaveBeenCalledWith(
        'plugin:error-occurred',
        {
          pluginId: 'chat-plugin',
          error: {
            message: 'Plugin initialization failed',
            code: 'INIT_ERROR',
          },
        },
        'plugin'
      );
    });

    it('should create navigation events correctly', () => {
      const navEvent = typedFactory.createNavigationEvent(
        FrontendEventTypes.NAVIGATION_ROUTE_CHANGED,
        {
          route: {
            path: '/settings',
            params: { tab: 'general' },
            query: { modal: 'true' },
          },
          previous: {
            path: '/dashboard',
          },
          direction: 'forward',
        }
      );

      expect(mockEventFactory).toHaveBeenCalledWith(
        'navigation:route-changed',
        expect.objectContaining({
          route: {
            path: '/settings',
            params: { tab: 'general' },
            query: { modal: 'true' },
          },
        }),
        'navigation'
      );
    });

    it('should create storage events correctly', () => {
      const storageEvent = typedFactory.createStorageEvent(
        FrontendEventTypes.STORAGE_DATA_CHANGED,
        {
          key: 'userPreferences',
          value: { theme: 'dark' },
          previousValue: { theme: 'light' },
          storageType: 'localStorage',
        }
      );

      expect(mockEventFactory).toHaveBeenCalledWith(
        'storage:data-changed',
        expect.objectContaining({
          key: 'userPreferences',
          storageType: 'localStorage',
        }),
        'storage'
      );
    });

    it('should create network events correctly', () => {
      const networkEvent = typedFactory.createNetworkEvent(
        FrontendEventTypes.NETWORK_REQUEST_COMPLETED,
        {
          request: {
            id: 'req-123',
            method: 'GET',
            url: '/api/users',
            startTime: Date.now() - 1000,
            endTime: Date.now(),
            duration: 1000,
          },
          response: {
            status: 200,
            statusText: 'OK',
            data: { users: [] },
          },
        }
      );

      expect(mockEventFactory).toHaveBeenCalledWith(
        'network:request-completed',
        expect.objectContaining({
          request: expect.objectContaining({
            method: 'GET',
            url: '/api/users',
          }),
        }),
        'network'
      );
    });

    it('should create user events correctly', () => {
      const userEvent = typedFactory.createUserEvent(
        FrontendEventTypes.USER_ACTION_PERFORMED,
        {
          action: {
            type: 'click',
            target: 'save-button',
            details: { formData: { name: 'test' } },
            timestamp: Date.now(),
          },
        }
      );

      expect(mockEventFactory).toHaveBeenCalledWith(
        'user:action-performed',
        expect.objectContaining({
          action: expect.objectContaining({
            type: 'click',
            target: 'save-button',
          }),
        }),
        'user'
      );
    });
  });

  describe('EventTypeValidator', () => {
    describe('validateUIEventData', () => {
      it('should validate correct UI event data', () => {
        const validData = {
          theme: {
            mode: 'dark' as const,
            primaryColor: '#1976d2',
          },
          layout: {
            sidebarVisible: true,
            sidebarWidth: 250,
            mainContentWidth: 800,
          },
        };

        expect(EventTypeValidator.validateUIEventData(validData)).toBe(true);
      });

      it('should reject invalid theme mode', () => {
        const invalidData = {
          theme: {
            mode: 'invalid' as any,
          },
        };

        expect(EventTypeValidator.validateUIEventData(invalidData)).toBe(false);
      });

      it('should reject invalid layout data', () => {
        const invalidData = {
          layout: {
            sidebarVisible: 'true', // should be boolean
            sidebarWidth: 250,
            mainContentWidth: 800,
          },
        };

        expect(EventTypeValidator.validateUIEventData(invalidData)).toBe(false);
      });

      it('should reject non-object data', () => {
        expect(EventTypeValidator.validateUIEventData(null)).toBe(false);
        expect(EventTypeValidator.validateUIEventData('string')).toBe(false);
        expect(EventTypeValidator.validateUIEventData(123)).toBe(false);
      });
    });

    describe('validatePluginEventData', () => {
      it('should validate correct plugin event data', () => {
        const validData = {
          pluginId: 'chat-plugin',
          pluginName: 'Chat Plugin',
          version: '1.0.0',
          error: {
            message: 'Error occurred',
            code: 'ERR001',
          },
        };

        expect(EventTypeValidator.validatePluginEventData(validData)).toBe(true);
      });

      it('should reject data without pluginId', () => {
        const invalidData = {
          pluginName: 'Chat Plugin',
        };

        expect(EventTypeValidator.validatePluginEventData(invalidData)).toBe(false);
      });

      it('should reject data with empty pluginId', () => {
        const invalidData = {
          pluginId: '',
        };

        expect(EventTypeValidator.validatePluginEventData(invalidData)).toBe(false);
      });
    });

    describe('validateNavigationEventData', () => {
      it('should validate correct navigation event data', () => {
        const validData = {
          route: {
            path: '/settings',
            params: { tab: 'general' },
            query: { modal: 'true' },
          },
          previous: {
            path: '/dashboard',
          },
        };

        expect(EventTypeValidator.validateNavigationEventData(validData)).toBe(true);
      });

      it('should reject data without route', () => {
        const invalidData = {
          previous: {
            path: '/dashboard',
          },
        };

        expect(EventTypeValidator.validateNavigationEventData(invalidData)).toBe(false);
      });

      it('should reject data with invalid route path', () => {
        const invalidData = {
          route: {
            path: 123, // should be string
          },
        };

        expect(EventTypeValidator.validateNavigationEventData(invalidData)).toBe(false);
      });
    });
  });

  describe('类型守卫函数', () => {
    it('isUIEvent should correctly identify UI events', () => {
      const uiEvent: LifeBoxEvent = {
        id: 'ui-1',
        type: 'ui:theme-changed',
        data: {
          theme: { mode: 'dark' },
        },
        source: 'ui',
        timestamp: Date.now(),
      };

      const nonUIEvent: LifeBoxEvent = {
        id: 'plugin-1',
        type: 'plugin:loaded',
        data: { pluginId: 'test' },
        source: 'plugin',
        timestamp: Date.now(),
      };

      expect(isUIEvent(uiEvent)).toBe(true);
      expect(isUIEvent(nonUIEvent)).toBe(false);
    });

    it('isPluginEvent should correctly identify plugin events', () => {
      const pluginEvent: LifeBoxEvent = {
        id: 'plugin-1',
        type: 'plugin:error-occurred',
        data: { pluginId: 'chat-plugin' },
        source: 'plugin',
        timestamp: Date.now(),
      };

      const nonPluginEvent: LifeBoxEvent = {
        id: 'ui-1',
        type: 'ui:theme-changed',
        data: { theme: { mode: 'dark' } },
        source: 'ui',
        timestamp: Date.now(),
      };

      expect(isPluginEvent(pluginEvent)).toBe(true);
      expect(isPluginEvent(nonPluginEvent)).toBe(false);
    });

    it('isNavigationEvent should correctly identify navigation events', () => {
      const navEvent: LifeBoxEvent = {
        id: 'nav-1',
        type: 'navigation:route-changed',
        data: {
          route: { path: '/settings' },
        },
        source: 'navigation',
        timestamp: Date.now(),
      };

      const nonNavEvent: LifeBoxEvent = {
        id: 'ui-1',
        type: 'ui:theme-changed',
        data: { theme: { mode: 'dark' } },
        source: 'ui',
        timestamp: Date.now(),
      };

      expect(isNavigationEvent(navEvent)).toBe(true);
      expect(isNavigationEvent(nonNavEvent)).toBe(false);
    });
  });

  describe('createQuickEvents', () => {
    let quickEvents: ReturnType<typeof createQuickEvents>;

    beforeEach(() => {
      quickEvents = createQuickEvents(mockEventFactory);
    });

    it('should create theme changed event', () => {
      const event = quickEvents.themeChanged('dark', '#1976d2');

      expect(mockEventFactory).toHaveBeenCalledWith(
        'ui:theme-changed',
        {
          theme: {
            mode: 'dark',
            primaryColor: '#1976d2',
          },
        },
        'ui'
      );
    });

    it('should create modal opened event', () => {
      const event = quickEvents.modalOpened('settings-modal', 'Settings', 'large');

      expect(mockEventFactory).toHaveBeenCalledWith(
        'ui:modal-opened',
        {
          modal: {
            id: 'settings-modal',
            title: 'Settings',
            size: 'large',
          },
        },
        'ui'
      );
    });

    it('should create modal closed event', () => {
      const event = quickEvents.modalClosed('settings-modal');

      expect(mockEventFactory).toHaveBeenCalledWith(
        'ui:modal-closed',
        {
          modal: {
            id: 'settings-modal',
            title: '',
          },
        },
        'ui'
      );
    });

    it('should create plugin error event', () => {
      const error = new Error('Plugin failed');
      error.stack = 'Error: Plugin failed\n    at test';

      const event = quickEvents.pluginError('chat-plugin', error);

      expect(mockEventFactory).toHaveBeenCalledWith(
        'plugin:error-occurred',
        {
          pluginId: 'chat-plugin',
          error: {
            message: 'Plugin failed',
            stack: 'Error: Plugin failed\n    at test',
          },
        },
        'plugin'
      );
    });

    it('should create route changed event', () => {
      const event = quickEvents.routeChanged(
        '/settings',
        { tab: 'general' },
        { modal: 'true' }
      );

      expect(mockEventFactory).toHaveBeenCalledWith(
        'navigation:route-changed',
        {
          route: {
            path: '/settings',
            params: { tab: 'general' },
            query: { modal: 'true' },
          },
        },
        'navigation'
      );
    });

    it('should create user action event', () => {
      const event = quickEvents.userAction(
        'click',
        'save-button',
        { formData: { name: 'test' } }
      );

      expect(mockEventFactory).toHaveBeenCalledWith(
        'user:action-performed',
        {
          action: {
            type: 'click',
            target: 'save-button',
            details: { formData: { name: 'test' } },
            timestamp: expect.any(Number),
          },
        },
        'user'
      );
    });
  });
});