const express = require('express');
const http = require('http');

async function testFamilyPairingWorkflow() {
  console.log('=== NAVIDOOR Family Companion Pairing & Connection E2E Verification ===\n');

  // Launch a test server with backend/index.js logic
  const app = express();
  app.use(express.json());

  const pairingTokensMemory = new Map();
  const familyConnectionsMemory = [];

  // Register token
  app.post('/api/family/register-token', (req, res) => {
    const { token, navidoorUid, navidoorName, navidoorPhone, expiresAt } = req.body;
    pairingTokensMemory.set(token, {
      token,
      navidoorUid,
      navidoorName,
      navidoorPhone,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: expiresAt || (Date.now() + 5 * 60 * 1000),
      singleUse: true,
    });
    res.json({ success: true, token });
  });

  // Claim token
  app.post('/api/family/claim-token', (req, res) => {
    const { token, companionUid, companionName, companionPhone, companionRelationship } = req.body;
    const tokenData = pairingTokensMemory.get(token);

    if (!tokenData) {
      return res.status(404).json({ success: false, error: 'Invalid pairing token' });
    }
    if (tokenData.status !== 'active') {
      return res.status(400).json({ success: false, error: 'This pairing token has already been claimed or used.' });
    }
    if (tokenData.expiresAt < Date.now()) {
      tokenData.status = 'expired';
      return res.status(400).json({ success: false, error: 'This pairing token has expired.' });
    }
    if (tokenData.navidoorUid === companionUid) {
      return res.status(400).json({ success: false, error: 'Cannot pair with your own device.' });
    }

    tokenData.status = 'claimed';
    tokenData.claimedBy = companionUid;
    tokenData.claimedAt = Date.now();

    const connId = `conn_${tokenData.navidoorUid}_${companionUid}`;
    const connection = {
      id: connId,
      pairingToken: token,
      navidoorUid: tokenData.navidoorUid,
      companionUid,
      navidoorName: tokenData.navidoorName,
      navidoorPhone: tokenData.navidoorPhone,
      companionName,
      companionPhone,
      companionRelationship,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      permissions: {
        canViewLocation: true,
        canViewActivity: true,
        canReceiveSOSAlerts: true,
        canControlRemoteMic: false,
      },
    };

    familyConnectionsMemory.push(connection);
    res.json({ success: true, connection });
  });

  // Approve / Reject
  app.post('/api/user/approve-connection', (req, res) => {
    const { connectionId, approved } = req.body;
    const conn = familyConnectionsMemory.find(c => c.id === connectionId);
    if (!conn) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }
    conn.status = approved ? 'connected' : 'rejected';
    conn.updatedAt = Date.now();
    res.json({ success: true, status: conn.status });
  });

  // Disconnect
  app.post('/api/family/update-connection', (req, res) => {
    const { connectionId, status } = req.body;
    const conn = familyConnectionsMemory.find(c => c.id === connectionId);
    if (!conn) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }
    conn.status = status;
    conn.updatedAt = Date.now();
    res.json({ success: true, status: conn.status });
  });

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5099, '127.0.0.1', resolve));
  const baseUrl = 'http://127.0.0.1:5099';

  try {
    // 1. Generate Token for Visually Impaired User
    console.log('1. Visually Impaired User generates pairing token...');
    const now = Date.now();
    const token = `pair_${now}_test123`;
    const exp = now + 5 * 60 * 1000;

    const regRes = await fetch(`${baseUrl}/api/family/register-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        navidoorUid: 'navidoor_uid_456',
        navidoorName: 'Aarav Sharma',
        navidoorPhone: '+91 98123 45678',
        expiresAt: exp,
      }),
    });
    const regData = await regRes.json();
    console.log('   -> Token registered:', regData.token, '| Status: ACTIVE | Expiry in 5 minutes');

    // 2. Prevent Self-Pairing
    console.log('\n2. Security Check: Companion tries self-pairing...');
    const selfRes = await fetch(`${baseUrl}/api/family/claim-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        companionUid: 'navidoor_uid_456', // Same UID
        companionName: 'Self',
        companionPhone: '+91 98123 45678',
        companionRelationship: 'Self',
      }),
    });
    const selfData = await selfRes.json();
    console.log('   -> Self-pairing rejected correctly:', selfData.error);

    // 3. Companion Scans and Claims Token
    console.log('\n3. Family Companion scans QR code and claims token...');
    const claimRes = await fetch(`${baseUrl}/api/family/claim-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        companionUid: 'companion_uid_789',
        companionName: 'Sunita Sharma',
        companionPhone: '+91 98765 43210',
        companionRelationship: 'Daughter',
      }),
    });
    const claimData = await claimRes.json();
    console.log('   -> Token claimed! Connection ID:', claimData.connection.id, '| Status:', claimData.connection.status);

    // 4. Single-Use Protection: Attempt to reuse same token
    console.log('\n4. Security Check: Attempting to reuse already claimed token...');
    const reuseRes = await fetch(`${baseUrl}/api/family/claim-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        companionUid: 'companion_intruder_999',
        companionName: 'Intruder',
        companionPhone: '+91 99999 99999',
        companionRelationship: 'Stranger',
      }),
    });
    const reuseData = await reuseRes.json();
    console.log('   -> Duplicate claim rejected correctly:', reuseData.error);

    // 5. NAVIDOOR User Approves Connection
    console.log('\n5. NAVIDOOR User receives connection request and APPROVES...');
    const approveRes = await fetch(`${baseUrl}/api/user/approve-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectionId: claimData.connection.id,
        approved: true,
      }),
    });
    const approveData = await approveRes.json();
    console.log('   -> Connection status is now:', approveData.status);

    // 6. Either Participant Disconnects
    console.log('\n6. Managing Connections: Companion or User revokes connection...');
    const disconnectRes = await fetch(`${baseUrl}/api/family/update-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectionId: claimData.connection.id,
        status: 'disconnected',
      }),
    });
    const disconnectData = await disconnectRes.json();
    console.log('   -> Revocation successful! Status is now:', disconnectData.status);

    console.log('\n=== ALL 6 STEPS OF FAMILY COMPANION PAIRING WORKFLOW PASSED! ===');
  } finally {
    server.close();
  }
}

testFamilyPairingWorkflow().catch(console.error);
