// Prisma 7 with PrismaPg adapter
import { PrismaClient } from '../../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// Create adapter with connection string object (Prisma 7 style)
const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL 
})

// Singleton pattern for Next.js hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize Prisma Client with adapter
const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const prismaClient = prisma;