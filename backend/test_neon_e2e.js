/**
 * End-to-End Verification against Live Neon Serverless Postgres + Express Backend
 * Starts the backend Express app on a test port, exercises all wired Neon/Prisma endpoints,
 * asserts real persistence across requests, and cleans up synthetic test data.
 */

const assert = require('assert');
const { getPrismaClient, disconnectPrisma } = require('./lib/prisma');

const TEST_USER_PHONE = '+919999000111';
const TEST_CAREGIVER_PHONE = '+919999000222';
const BASE_URL = 'http://127.0.0.1:5099';

async function runE2E() {
  console.log('='.repeat(68));
  console.log('   NAVIDOOR NEON POSTGRES + PRISMA END-TO-END BACKEND TEST');
  console.log('='.repeat(68));

  // Boot backend on ephemeral test port 5099
  process.env.PORT = '5099';
  require('./index');
  await new Promise((r) => setTimeout(r, 1500));

  const post = async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
  };

  const put = async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
  };

  const get = async (path) => {
    const res = await fetch(`${BASE_URL}${path}`);
    return { status: res.status, data: await res.json() };
  };

  try {
    // 1. Health Check -> verifies live Neon DB connectivity
    const health = await get('/api/health');
    console.log('[1] /api/health:', { databaseOnline: health.data.databaseOnline, databaseProvider: health.data.databaseProvider });
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.databaseOnline, true, 'Neon Postgres must be online!');

    // 2. User profile upsert
    const profileRes = await put('/api/user/profile', {
      phone: TEST_USER_PHONE,
      name: 'E2E Test User',
      languageCode: 'mr',
      themeMode: 'highContrastDark',
      speechRate: 1.15,
    });
    assert.strictEqual(profileRes.data.success, true);
    assert.strictEqual(profileRes.data.user.name, 'E2E Test User');
    console.log('[2] /api/user/profile saved user:', profileRes.data.user.id);

    // 3. Family Register + Password Login (bcryptjs)
    const regRes = await post('/api/family/register', {
      name: 'E2E Caregiver',
      phone: TEST_CAREGIVER_PHONE,
      email: 'caregiver@example.com',
      password: 'SecretPassword123!',
      relationship: 'Daughter',
    });
    assert.strictEqual(regRes.data.success, true);

    const badLogin = await post('/api/family/login', { phone: TEST_CAREGIVER_PHONE, password: 'WrongPassword' });
    assert.strictEqual(badLogin.status, 401);

    const goodLogin = await post('/api/family/login', { phone: TEST_CAREGIVER_PHONE, password: 'SecretPassword123!' });
    assert.strictEqual(goodLogin.status, 200);
    assert.strictEqual(goodLogin.data.user.name, 'E2E Caregiver');
    console.log('[3] /api/family/register & /api/family/login (bcrypt) passed.');

    // 4. QR Pairing Token -> Claim -> Approve Connection
    const token = `pair_e2e_${Date.now()}`;
    await post('/api/family/register-token', {
      token,
      navidoorUid: 'uid_e2e_user',
      navidoorName: 'E2E Test User',
      navidoorPhone: TEST_USER_PHONE,
    });
    const claim = await post('/api/family/claim-token', {
      token,
      companionUid: 'uid_e2e_caregiver',
      companionName: 'E2E Caregiver',
      companionPhone: TEST_CAREGIVER_PHONE,
      companionRelationship: 'Daughter',
    });
    assert.strictEqual(claim.data.success, true);
    assert.strictEqual(claim.data.connection.status, 'pending');

    const approve = await post('/api/user/approve-connection', {
      connectionId: claim.data.connection.id,
      approved: true,
    });
    assert.strictEqual(approve.data.status, 'connected');
    console.log('[4] QR pairing token register -> claim -> approve passed.');

    // 5. Medical Profile + Emergency Contact
    const medProfile = await put('/api/medical-profile', {
      phone: TEST_USER_PHONE,
      bloodGroup: 'O+',
      allergies: ['Penicillin'],
      chronicConditions: ['Hypertension'],
      primaryPhysician: 'Dr. Rao',
    });
    assert.strictEqual(medProfile.data.profile.bloodGroup, 'O+');

    const contact = await post('/api/emergency-contacts', {
      phone: TEST_USER_PHONE,
      name: 'E2E Caregiver',
      relation: 'Daughter',
      contactPhone: TEST_CAREGIVER_PHONE,
      isPrimary: true,
    });
    assert.strictEqual(contact.data.contact.name, 'E2E Caregiver');
    console.log('[5] Medical Profile & Emergency Contact persisted.');

    // 6. Medication Add + Confirm Dose Taken (decrements remainingPills & creates MedicationLog)
    const medAdd = await post('/api/medicines', {
      phone: TEST_USER_PHONE,
      name: 'Paracetamol 500mg',
      dosage: '1 Tablet',
      remainingPills: 10,
      expiryDate: '12/28',
    });
    const medId = medAdd.data.medicine.id;
    const medConfirm = await post(`/api/medicines/${medId}/confirm`, { status: 'TAKEN' });
    assert.strictEqual(medConfirm.data.medication.remainingPills, 9);
    console.log('[6] Medication added & dose confirmed (10 -> 9 pills).');

    // 7. Location Snapshot + SOS Alert + Resolve + Family Dashboard
    await post('/api/location', {
      phone: TEST_USER_PHONE,
      latitude: 19.076,
      longitude: 72.8777,
      address: 'Dadar West, Mumbai',
      batteryPct: '92%',
    });
    const sosRes = await post('/api/sos', {
      phone: TEST_USER_PHONE,
      latitude: 19.076,
      longitude: 72.8777,
      address: 'Dadar West, Mumbai',
    });
    assert.strictEqual(sosRes.data.alert.status, 'ACTIVE');
    await post(`/api/sos/${sosRes.data.alert.id}/resolve`, {});

    const dash = await get(`/api/family/dashboard?phone=${encodeURIComponent(TEST_CAREGIVER_PHONE)}`);
    assert.strictEqual(dash.data.data.userName, 'E2E Test User');
    assert.strictEqual(dash.data.data.location.address, 'Dadar West, Mumbai');
    assert.strictEqual(dash.data.data.medicines.length, 1);
    console.log('[7] Location, SOS Alert, and Caregiver Dashboard verified.');

    // 8. Direct OCR Scan log & Bootstrap Check
    const prisma = getPrismaClient();
    await prisma.ocrScan.create({
      data: {
        userId: profileRes.data.user.id,
        category: 'bus_board',
        rawText: 'BUS 204 DADAR',
        spokenSummary: 'Bus 204 heading towards Dadar.',
        language: 'en',
      },
    });
    const bootstrap = await get(`/api/user/bootstrap?phone=${encodeURIComponent(TEST_USER_PHONE)}`);
    assert.strictEqual(bootstrap.data.source, 'neon');
    assert.strictEqual(bootstrap.data.ocrScans.length, 1);
    console.log('[8] /api/user/bootstrap returned persisted Neon state cleanly.');

    // 9. Phase 3 Socket.IO async persistence test
    const { io: ioClient } = require('../node_modules/socket.io-client');
    const socket = ioClient(BASE_URL, { transports: ['websocket'] });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket.IO connect timeout')), 5000);
      socket.on('connect', () => {
        clearTimeout(timer);
        resolve();
      });
    });

    socket.emit('register', { phone: TEST_USER_PHONE, role: 'navidoor_user', name: 'E2E Test User' });
    await new Promise((r) => setTimeout(r, 400));

    const sosBroadcastPromise = new Promise((resolve) => {
      socket.once('emergency:broadcast', resolve);
    });
    socket.emit('emergency:sos', {
      phone: TEST_USER_PHONE,
      latitude: 19.082,
      longitude: 72.881,
      location: 'Socket SOS Street, Mumbai',
    });
    await sosBroadcastPromise;

    socket.emit('family:locationUpdate', {
      userPhone: TEST_USER_PHONE,
      location: { latitude: 19.082, longitude: 72.881, address: 'Socket Live Location, Mumbai', battery: '88%' },
    });

    // Wait briefly for async Neon persistence
    await new Promise((r) => setTimeout(r, 1200));
    socket.disconnect();

    const sosRows = await prisma.sosAlert.findMany({
      where: { userId: profileRes.data.user.id, address: 'Socket SOS Street, Mumbai' },
    });
    const locRows = await prisma.locationSnapshot.findMany({
      where: { userId: profileRes.data.user.id, address: 'Socket Live Location, Mumbai' },
    });
    assert.ok(sosRows.length >= 1, 'Socket.IO emergency:sos must persist SosAlert to Neon');
    assert.ok(locRows.length >= 1, 'Socket.IO family:locationUpdate must persist LocationSnapshot to Neon');
    console.log('[9] Phase 3 Socket.IO async persistence (SOS & GPS -> Neon) verified.');
  } finally {
    // Cleanup synthetic test records from Neon
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.pairingToken.deleteMany({ where: { navidoorPhone: TEST_USER_PHONE } }).catch(() => {});
      await prisma.user.deleteMany({
        where: { phone: { in: [TEST_USER_PHONE, TEST_CAREGIVER_PHONE] } },
      }).catch(() => {});
      await disconnectPrisma();
    }
  }

  console.log('\n[ALL TESTS PASSED] Live Neon Postgres + Express End-to-End Verified!');
  process.exit(0);
}

runE2E().catch((err) => {
  console.error('\n[E2E TEST FAILED]:', err);
  process.exit(1);
});
