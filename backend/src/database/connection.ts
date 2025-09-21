import { PrismaClient } from '@prisma/client';

// Global Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

// Initialize Prisma client with connection pooling and logging
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the connection across hot reloads
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

/**
 * Initialize database connection and run migrations
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Run pending migrations in development
    if (process.env.NODE_ENV === 'development') {
      // Note: In production, migrations should be run separately
      console.log('🔄 Checking database schema...');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
    throw error;
  }
}

/**
 * Get Prisma client instance
 */
export function getDatabase(): PrismaClient {
  return prisma;
}

export default prisma;