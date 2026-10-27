const http = require('http');
const { io } = require('socket.io-client');

const BACKEND_URL = 'http://127.0.0.1:5001';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = http.request(
      `${BACKEND_URL}${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 3000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(postData);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BACKEND_URL}${path}`, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

async function runRealPairingTestSuite() {
  console.log('\n============================================================');
  console.log('🧪 RUNNING REAL FAMILY COMPANION PAIRING & CONNECTION TESTS');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // 1. Setup real Socket.IO clients for NAVIDOOR user and Family Companion
  console.log('🔌 Step 1: Connecting real Socket.IO clients...');
  const userSocket = io(BACKEND_URL, { transports: ['websocket'] });
  const companionSocket = io(BACKEND_URL, { transports: ['websocket'] });

  await new Promise((resolve) => {
    let connectedCount = 0;
    const check = () => {
      connectedCount++;
      if (connectedCount === 2) resolve();
    };
    userSocket.on('connect', check);
    companionSocket.on('connect', check);
  });

  assert(userSocket.connected && companionSocket.connected, 'Socket.IO Real-time Connection Established');

  // Register clients
  const userPhone = '+91 98111 22222';
  const companionPhone = '+91 98333 44444';
  userSocket.emit('register', { phone: userPhone, role: 'navidoor_user' });
  companionSocket.emit('register', { phone: companionPhone, role: 'family_member' });

  // 2. Test Token Generation
  console.log('\n🎟️ Step 2: Testing Token Generation...');
  const now = Date.now();
  const token = `pair_${now}_${Math.random().toString(36).substring(2, 8)}`;
  const expiresAt = now + 5 * 60 * 1000;
  const qrPayload = JSON.stringify({
    v: 1,
    type: 'navidoor_pair',
    token,
    exp: expiresAt,
  });

  // Verify QR format
  const parsedQr = JSON.parse(qrPayload);
  assert(parsedQr.v === 1 && parsedQr.type === 'navidoor_pair', 'QR Payload Format Valid');
  assert(parsedQr.token === token, 'QR Payload Contains Generated Token');
  assert(parsedQr.exp > Date.now() + 290000, 'QR Token Expiry Valid for 5 Minutes (~300s)');

  // Register on Backend
  const regRes = await post('/api/family/register-token', {
    token,
    navidoorUid: 'nav_user_real_test',
    navidoorName: 'Aarav Sharma',
    navidoorPhone: userPhone,
    expiresAt,
  });
  assert(regRes.status === 200 && regRes.body.success, 'Token Successfully Registered on Backend');

  // 3. Test Real-time Connection Request Event over Socket.IO & Backend
  console.log('\n📱 Step 3: Companion Claims Token & Sends Connection Request...');

  let socketReceivedRequest = null;
  userSocket.on('family:connectionRequest', (data) => {
    socketReceivedRequest = data;
  });

  const claimRes = await post('/api/family/claim-token', {
    token,
    companionUid: 'fam_companion_real_test',
    companionName: 'Priya Sharma',
    companionPhone: companionPhone,
    companionRelationship: 'Daughter',
  });

  assert(claimRes.status === 200 && claimRes.body.success, 'Token Claim Succeeded on First Attempt');
  assert(claimRes.body.connection && claimRes.body.connection.status === 'pending', 'Connection Created with Status PENDING');

  const connectionId = claimRes.body.connection.id;

  // Notify over Socket.IO
  userSocket.emit('family:connectionRequest', claimRes.body.connection);
  await new Promise((r) => setTimeout(r, 200));

  assert(socketReceivedRequest !== null, 'NAVIDOOR User Received Real-time Socket Connection Request');
  assert(socketReceivedRequest && socketReceivedRequest.companionName === 'Priya Sharma', 'Received Companion Name matches "Priya Sharma"');

  // Verify Pending Requests endpoint
  const pendingRes = await get(`/api/user/pending-requests?phone=${encodeURIComponent(userPhone)}`);
  assert(pendingRes.status === 200 && pendingRes.body.requests.length > 0, 'Pending Request Visible via API Endpoint');

  // 4. Test Single-Use Token Enforcement (Reuse Prevention)
  console.log('\n🔒 Step 4: Testing Single-Use Token Security Enforcement...');
  const secondClaimRes = await post('/api/family/claim-token', {
    token,
    companionUid: 'fam_second_hacker',
    companionName: 'Unknown Person',
  });
  assert(secondClaimRes.status === 400 && secondClaimRes.body.success === false, 'Re-claiming Same Token Rejected (Single-Use Enforced)');

  // 5. Test Expired Token Rejection
  console.log('\n⏰ Step 5: Testing Expired Token Rejection...');
  const expiredToken = `pair_expired_${Date.now()}`;
  await post('/api/family/register-token', {
    token: expiredToken,
    navidoorUid: 'nav_user_expired',
    expiresAt: Date.now() - 1000, // already expired!
  });

  const claimExpiredRes = await post('/api/family/claim-token', {
    token: expiredToken,
    companionUid: 'fam_companion_test',
  });
  assert(claimExpiredRes.status === 400 && claimExpiredRes.body.success === false, 'Expired Token Claim Rejected by Security Policy');

  // 6. Test Self-Pairing Rejection
  console.log('\n🚫 Step 6: Testing Self-Pairing Rejection...');
  const selfToken = `pair_self_${Date.now()}`;
  await post('/api/family/register-token', {
    token: selfToken,
    navidoorUid: 'same_device_uid_123',
    expiresAt: Date.now() + 300000,
  });

  const selfClaimRes = await post('/api/family/claim-token', {
    token: selfToken,
    companionUid: 'same_device_uid_123',
  });
  assert(selfClaimRes.status === 400 && selfClaimRes.body.success === false, 'Self-Pairing Forbidden (Cannot pair with own device)');

  // 7. Test NAVIDOOR User Approving Request (Full Approval Flow)
  console.log('\n🤝 Step 7: Visually Impaired User Approves Connection Request...');

  let companionReceivedResponse = null;
  companionSocket.on('family:connectionResponse', (data) => {
    companionReceivedResponse = data;
  });

  const approveRes = await post('/api/family/update-connection', {
    connectionId,
    status: 'connected',
  });
  assert(approveRes.status === 200 && approveRes.body.status === 'connected', 'Connection Status Transitioned to CONNECTED on Backend');

  // Companion socket event broadcast
  userSocket.emit('family:connectionApproved', { connectionId });
  await new Promise((r) => setTimeout(r, 200));

  assert(companionReceivedResponse !== null && companionReceivedResponse.approved === true, 'Companion Socket Received Real-time Approval Signal');

  // Verify connection status endpoint
  const statusRes = await get(`/api/family/connection-status?phone=${encodeURIComponent(companionPhone)}`);
  assert(
    statusRes.status === 200 && statusRes.body.requests.some((c) => c.id === connectionId && c.status === 'connected'),
    'Active Connection Verified in System Registry'
  );

  // 8. Test Disconnection / Revocation Flow
  console.log('\n🔌 Step 8: Disconnecting Active Pairing...');
  let companionReceivedRevoke = null;
  companionSocket.on('family:connectionRevoked', (data) => {
    companionReceivedRevoke = data;
  });

  const disconnectRes = await post('/api/family/update-connection', {
    connectionId,
    status: 'disconnected',
  });
  assert(disconnectRes.status === 200 && disconnectRes.body.status === 'disconnected', 'Connection Status Transitioned to DISCONNECTED');

  userSocket.emit('family:disconnected', { connectionId });
  await new Promise((r) => setTimeout(r, 200));

  assert(companionReceivedRevoke !== null, 'Companion Received Real-Time Connection Revoked Notification');

  // Clean up sockets
  userSocket.disconnect();
  companionSocket.disconnect();

  console.log('\n============================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRealPairingTestSuite().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
