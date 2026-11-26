/**
 * Phase 1 Verification: Neon + Prisma Foundation
 * Validates schema generation, Prisma Client model delegates, phone normalization,
 * and checks Neon DB connectivity if DATABASE_URL is configured.
 */

const { normalizePhone } = require('./lib/phoneUtils');
const { isDatabaseConfigured, checkDatabaseHealth, disconnectPrisma } = require('./lib/prisma');
const { PrismaClient } = require('@prisma/client');

async function verifyPhase1() {
  console.log('='.repeat(64));
  console.log('   NAVIDOOR DATABASE PHASE 1: NEON + PRISMA VERIFICATION');
  console.log('='.repeat(64));

  // 1. Phone normalization test
  const normalized = normalizePhone(' +91 (981) 234-5678 ');
  console.log('[TEST 1] Phone normalization:', normalized);
  if (normalized !== '+919812345678') {
    throw new Error(`Expected +919812345678, got ${normalized}`);
  }

  // 2. Prisma Client generated delegates check
  const dummyClient = new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/navidoor' },
    },
  });

  const expectedModels = [
    'user',
    'medicalProfile',
    'emergencyContact',
    'caregiverConnection',
    'medication',
    'medicationLog',
    'ocrScan',
    'sosAlert',
    'locationSnapshot',
  ];

  for (const model of expectedModels) {
    if (!dummyClient[model]) {
      throw new Error(`Missing Prisma model delegate: ${model}`);
    }
  }
  await dummyClient.$disconnect();
  console.log(`[TEST 2] All ${expectedModels.length} Prisma models verified on generated client.`);

  // 3. Database configuration & health check
  const configured = isDatabaseConfigured();
  const health = await checkDatabaseHealth();
  console.log('[TEST 3] Database configured:', configured);
  console.log('[TEST 3] Database health:', health);

  await disconnectPrisma();
  console.log('\n[PASS] Phase 1 Neon + Prisma foundation verified!');
  process.exit(0);
}

verifyPhase1().catch((err) => {
  console.error('[FAIL] Phase 1 verification error:', err);
  process.exit(1);
});
