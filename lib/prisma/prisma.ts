// Prisma 7 with PrismaPg adapter
import { config } from "dotenv";
config({ path: ".env.local" });

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

// Initialize Prisma Client with adapter
const baseClient = new PrismaClient({ 
  adapter,
})

// Use $extends to ensure proper initialization
const client = baseClient.$extends({})


// @ts-ignore - Type workaround for Prisma 7 adapter issues
export const prismaClient = client as unknown as PrismaClient