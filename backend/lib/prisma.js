/**
 * NAVIDOOR Prisma Client Singleton (Neon Serverless Postgres)
 * Designed with graceful offline degradation so local AI services continue
 * operating even when DATABASE_URL is absent or network is offline.
 */

const path = require('path');
const fs = require('fs');

// Load backend/.env first, then fallback to root .env if present
const backendEnvPath = path.join(__dirname, '../.env');
const rootEnvPath = path.join(__dirname, '../../.env');

try {
  const dotenv = require('dotenv');
  if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath });
  } else if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  }
} catch (err) {
  console.warn('[Prisma] dotenv not available:', err.message);
}

let prismaInstance = null;

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

function getPrismaClient() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!prismaInstance) {
    const { PrismaClient } = require('@prisma/client');
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  return prismaInstance;
}

async function checkDatabaseHealth() {
  if (!isDatabaseConfigured()) {
    return {
      configured: false,
      online: false,
      provider: 'neon-postgresql',
      message: 'DATABASE_URL not set in backend/.env; running in offline/in-memory fallback mode.',
    };
  }

  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return {
      configured: true,
      online: true,
      provider: 'neon-postgresql',
    };
  } catch (err) {
    return {
      configured: true,
      online: false,
      provider: 'neon-postgresql',
      error: err.message,
    };
  }
}

async function disconnectPrisma() {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

module.exports = {
  getPrismaClient,
  isDatabaseConfigured,
  checkDatabaseHealth,
  disconnectPrisma,
};
