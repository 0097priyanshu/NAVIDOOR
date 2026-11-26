/**
 * Phase 4 Verification: Offline Queue & Neon Bootstrap Sync End-to-End Test
 * Simulates mobile offline mutations (queued locally while server is offline),
 * brings up Express + Neon Postgres, flushes the queue, and verifies Neon bootstrap & history.
 */

const assert = require('assert');
const { getPrismaClient, disconnectPrisma } = require('./lib/prisma');

const TEST_PHONE = '+919999000444';
const BASE_URL = 'http://127.0.0.1:5098';

async function runPhase4Test() {
  console.log('='.repeat(68));
  console.log('   NAVIDOOR PHASE 4: OFFLINE QUEUE + NEON HYDRATION E2E TEST');
  console.log('='.repeat(68));

  // Simulate local offline queue while backend is unreachable
  const offlineQueue = [];

  const sendOrQueue = async (method, endpoint, body) => {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(1000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { synced: true, data: await res.json() };
    } catch {
      offlineQueue.push({ method, endpoint, body, createdAt: Date.now() });
      return { synced: false };
    }
  };

  // 1. Mutate while OFFLINE (server not running yet)
  const r1 = await sendOrQueue('PUT', '/api/user/profile', {
    phone: TEST_PHONE,
    name: 'Offline Sync User',
    languageCode: 'hi',
  });
  const r2 = await sendOrQueue('PUT', '/api/medical-profile', {
    phone: TEST_PHONE,
    bloodGroup: 'B+',
    allergies: ['Sulfa'],
    primaryPhysician: 'Dr. Verma',
  });
  const r3 = await sendOrQueue('POST', '/api/medicines', {
    phone: TEST_PHONE,
    name: 'Metformin 500mg',
    dosage: '1 Tablet',
    remainingPills: 30,
  });

  assert.strictEqual(r1.synced, false);
  assert.strictEqual(r2.synced, false);
  assert.strictEqual(r3.synced, false);
  assert.strictEqual(offlineQueue.length, 3);
  console.log('[1] Offline mutations queued safely (3 items in pending queue).');

  // 2. Boot backend + Neon connection
  process.env.PORT = '5098';
  require('./index');
  await new Promise((r) => setTimeout(r, 1500));

  try {
    // 3. Flush queue in FIFO order
    let flushed = 0;
    for (const item of offlineQueue) {
      const res = await fetch(`${BASE_URL}${item.endpoint}`, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      assert.strictEqual(res.ok, true);
      flushed++;
    }
    assert.strictEqual(flushed, 3);
    console.log('[2] Offline queue flushed cleanly to Express + Neon Postgres (3/3 synced).');

    // 4. Verify bootstrap hydration returns all synced data
    const bootRes = await fetch(`${BASE_URL}/api/user/bootstrap?phone=${encodeURIComponent(TEST_PHONE)}`);
    const boot = await bootRes.json();
    assert.strictEqual(boot.success, true);
    assert.strictEqual(boot.source, 'neon');
    assert.strictEqual(boot.user.name, 'Offline Sync User');
    assert.strictEqual(boot.user.languageCode, 'hi');
    assert.strictEqual(boot.medicalProfile.bloodGroup, 'B+');
    assert.deepStrictEqual(boot.medicalProfile.allergies, ['Sulfa']);
    assert.strictEqual(boot.medications.length, 1);
    assert.strictEqual(boot.medications[0].name, 'Metformin 500mg');
    console.log('[3] /api/user/bootstrap hydrated all offline-queued data from Neon Postgres.');
  } finally {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.user.deleteMany({ where: { phone: TEST_PHONE } }).catch(() => {});
      await disconnectPrisma();
    }
  }

  console.log('\n[ALL TESTS PASSED] Phase 4 Offline Cache & Neon Sync Verified!');
  process.exit(0);
}

runPhase4Test().catch((err) => {
  console.error('\n[PHASE 4 TEST FAILED]:', err);
  process.exit(1);
});
