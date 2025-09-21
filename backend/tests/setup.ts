import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
process.env.PORT = process.env.PORT || '3001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

let prisma: PrismaClient;

// Mock console methods to reduce test noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(async () => {
  // Suppress console output in tests
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  // Ensure connection and enable foreign keys
  await prisma.$connect();
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
});

afterAll(async () => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;

  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up data after each test in correct order to respect foreign keys
  try {
    await prisma.message.deleteMany({});
    await prisma.channel.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.plugin.deleteMany({});
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
});

// Mock WebSocket for testing
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1, // OPEN
  OPEN: 1,
  CLOSED: 3,
})) as any;

// Test data helpers
export const createTestChannel = () => ({
  id: 'test-channel-1',
  name: 'Test Channel',
  description: 'A test channel',
  createdAt: new Date(),
  updatedAt: new Date(),
  memberCount: 1,
});

export const createTestMessage = (channelId: string = 'test-channel-1') => ({
  id: 'test-message-1',
  channelId,
  content: 'Test message content',
  author: 'Test User',
  timestamp: new Date(),
  type: 'text' as const,
});

export const createTestEvent = (type: string = 'test:event', data: any = {}) => ({
  id: 'test-event-1',
  type,
  data,
  source: 'test',
  timestamp: Date.now(),
  cancelled: false,
  propagation: true,
});

// Database cleanup helper
export const cleanupDatabase = async () => {
  await prisma.message.deleteMany({});
  await prisma.channel.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.plugin.deleteMany({});
};

export { prisma };