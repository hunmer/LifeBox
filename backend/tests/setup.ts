import { PrismaClient } from '@prisma/client';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test.db'
      }
    }
  });
  
  // Ensure connection and enable foreign keys
  await prisma.$connect();
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up data after each test in correct order to respect foreign keys
  await prisma.message.deleteMany({});
  await prisma.channel.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.plugin.deleteMany({});
});

export { prisma };