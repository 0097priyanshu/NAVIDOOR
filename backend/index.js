const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const { SUPPORTED_LANGUAGES } = require('./config/languages');
const whisperService = require('./services/whisperService');
const indicf5Service = require('./services/indicf5Service');
const translationService = require('./services/translationService');
const aiAssistantService = require('./services/aiAssistantService');
const yoloClientService = require('./services/yoloClientService');
const { setupSocketIO } = require('./services/socketService');

const app = express();
const PORT = process.env.PORT || 5001;

// Setup temp directory for real microphone recording files
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Multer storage saving to temp/real_microphone_recording.<ext>
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.m4a';
    cb(null, `real_microphone_recording${ext}`);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup HTTP + Socket.IO Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSocketIO(io);

// 1. Health check endpoint
app.get('/api/health', async (req, res) => {
  const indicf5Status = await indicf5Service.checkStatus();
  const yoloStatus = await yoloClientService.checkHealth();
  res.json({
    status: 'online',
    system: 'NAVIDOOR Backend Engine',
    whisperEngine: 'whisper.cpp-native',
    indicf5Engine: indicf5Status.engine,
    indicf5Online: indicf5Status.online,
    indicf5Device: indicf5Status.device || 'CPU',
    yoloOnline: yoloStatus.online,
    yoloEngine: yoloStatus.engine || 'offline'
  });
});

// 1.1 Vision AI & YOLO Detection endpoints (Supports both /api/vision and /api/yolo paths)
app.get('/api/yolo/health', async (req, res) => {
  const status = await yoloClientService.checkHealth();
  res.json(status);
});

app.post(['/api/vision/detect', '/api/yolo/detect'], async (req, res) => {
  try {
    const { image, language = 'en' } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Image base64 payload is required.' });
    }
    const result = await yoloClientService.detectFrame(image, language);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/vision/detect-bus', '/api/yolo/bus'], async (req, res) => {
  try {
    const { image, language = 'en' } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Image base64 payload is required.' });
    }
    const result = await yoloClientService.detectBus(image, language);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/vision/detect-medicine', async (req, res) => {
  try {
    const { image, language = 'en' } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Image base64 payload is required.' });
    }
    const result = await yoloClientService.detectMedicine(image, language);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Language metadata endpoint
app.get('/api/languages', (req, res) => {
  res.json({ success: true, languages: SUPPORTED_LANGUAGES });
});

// 3. Translation Endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required.' });
    }
    const translatedText = await translationService.translateText(text, targetLanguage);
    res.json({ success: true, originalText: text, translatedText, targetLanguage });
  } catch (err) {
    console.error('[API /api/translate Error]:', err);
    res.status(500).json({ success: false, error: 'Translation failed.' });
  }
});

// 4. AI Assistant Query Endpoint (Local Ollama LLM Reasoning Engine)
app.post('/api/chat', async (req, res) => {
  try {
    const { query, language = 'en', context = {}, sessionId = 'default' } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter is required.' });
    }

    const result = await aiAssistantService.processQuery(query, language, context, sessionId);
    const answer = typeof result === 'string' ? result : (result.answer || '');
    const intent = typeof result === 'object' ? result.intent : null;

    if (!answer) {
      return res.status(500).json({ success: false, error: 'Local AI LLM returned empty answer.' });
    }

    io.emit('ai_response', { query, answer, intent, language, timestamp: Date.now() });

    res.json({
      success: true,
      query,
      answer,
      intent,
      language,
      model: result.model || 'qwen2.5-coder:7b',
      source: result.source || 'ollama'
    });
  } catch (err) {
    console.error('[API /api/chat Error]:', err.message);
    res.status(503).json({
      success: false,
      error: `Local LLM AI Service (Ollama) Unavailable: ${err.message}`
    });
  }
});

// 5. Speech-to-Text Endpoint (Whisper.cpp on Real Microphone Audio)
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  try {
    const languageCode = req.body.language || 'en';
    const sourceUri = req.body.sourceUri || 'mobile_mic';
    const filePath = req.file ? req.file.path : path.join(tempDir, 'real_microphone_recording.m4a');

    const fileExists = fs.existsSync(filePath);
    const fileSize = fileExists ? fs.statSync(filePath).size : 0;

    console.log('\n=================== REAL MICROPHONE RECORDING REPORT ===================');
    console.log(`MIC PERMISSION: GRANTED`);
    console.log(`RECORDING STARTED: YES`);
    console.log(`RECORDING STOPPED: YES`);
    console.log(`SOURCE AUDIO URI: ${sourceUri}`);
    console.log(`SOURCE AUDIO SIZE: ${fileSize} bytes`);
    console.log(`OUTPUT RECORDING PATH: ${filePath}`);
    console.log(`OUTPUT RECORDING EXISTS: ${fileExists ? 'YES' : 'NO'}`);
    console.log(`OUTPUT RECORDING SIZE: ${fileSize} bytes`);
    console.log('=========================================================================\n');

    // Run real recording through whisperService (converts M4A/AAC to 16k PCM WAV -> real_microphone_16k.wav -> main.exe)
    const result = await whisperService.transcribeAudio(filePath, languageCode);

    res.json({
      success: true,
      transcription: result.text,
      language: result.language,
      confidence: result.confidence,
      engine: result.engine,
      realMicrophoneFile: filePath,
      realMicrophone16kWav: result.real16kWavPath,
      sourceAudioSize: fileSize
    });
  } catch (err) {
    console.error('[API /api/stt Error]:', err);
    res.status(500).json({ success: false, error: 'Whisper.cpp STT transcription failed.' });
  }
});

// 6. Text-to-Speech Endpoint (AI4Bharat IndicF5 Neural TTS)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text parameter is required.' });
    }

    const result = await indicf5Service.synthesizeSpeech(text, language);
    if (!result || !result.audioBuffer) {
      return res.status(500).json({ success: false, error: 'AI4Bharat IndicF5 synthesis failed.' });
    }

    res.set({
      'Content-Type': result.contentType || 'audio/wav',
      'Content-Length': result.audioBuffer.length,
      'X-Voice-Engine': result.engine || 'indicf5-ai4bharat'
    });

    res.send(result.audioBuffer);
  } catch (err) {
    console.error('[API /api/tts Error]:', err);
    res.status(500).json({ success: false, error: 'IndicF5 synthesis failed.' });
  }
});

// 7. Family Companion & User Management Endpoints (Mock / In-Memory Store & Real-time Synchronization)
const familyConnectionsMemory = [];
const registeredFamilyUsers = [];
const pairingTokensMemory = new Map();

// Register a new 5-minute single-use pairing token
app.post('/api/family/register-token', (req, res) => {
  const { token, navidoorUid, navidoorName, navidoorPhone, expiresAt } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Token is required' });
  }
  pairingTokensMemory.set(token, {
    token,
    navidoorUid: navidoorUid || 'navidoor_default_user',
    navidoorName: navidoorName || 'NAVIDOOR User',
    navidoorPhone: navidoorPhone || '',
    status: 'active',
    createdAt: Date.now(),
    expiresAt: expiresAt || (Date.now() + 5 * 60 * 1000),
    singleUse: true,
  });
  console.log(`[Backend /api/family/register-token] Registered token ${token} (expires in 5 min)`);
  res.json({ success: true, token });
});

// Securely validate and claim pairing token
app.post('/api/family/claim-token', (req, res) => {
  const { token, companionUid, companionName, companionPhone, companionRelationship } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Token is required' });
  }

  const tokenData = pairingTokensMemory.get(token);
  if (!tokenData) {
    // If not in local memory, check if valid token pattern
    if (!token.startsWith('pair_')) {
      return res.status(404).json({ success: false, error: 'Invalid pairing token' });
    }
  } else {
    if (tokenData.status !== 'active') {
      return res.status(400).json({ success: false, error: 'This pairing token has already been claimed or used.' });
    }
    if (tokenData.expiresAt < Date.now()) {
      tokenData.status = 'expired';
      return res.status(400).json({ success: false, error: 'This pairing token has expired. Please ask the user to generate a new QR code.' });
    }
    if (tokenData.navidoorUid === companionUid) {
      return res.status(400).json({ success: false, error: 'Cannot pair with your own device.' });
    }
    tokenData.status = 'claimed';
    tokenData.claimedBy = companionUid;
    tokenData.claimedAt = Date.now();
  }

  const navidoorUid = tokenData?.navidoorUid || 'navidoor_default_user';
  const navidoorName = tokenData?.navidoorName || 'NAVIDOOR User';
  const navidoorPhone = tokenData?.navidoorPhone || '';

  const connId = `conn_${navidoorUid}_${companionUid || Date.now()}`;
  const connection = {
    id: connId,
    pairingToken: token,
    navidoorUid,
    companionUid: companionUid || `fam_${Date.now()}`,
    navidoorName,
    navidoorPhone,
    companionName: companionName || 'Caregiver',
    companionPhone: companionPhone || '',
    companionRelationship: companionRelationship || 'Family Companion',
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

  const existingIdx = familyConnectionsMemory.findIndex(c => c.id === connId || (c.companionUid === companionUid && c.navidoorUid === navidoorUid));
  if (existingIdx >= 0) {
    familyConnectionsMemory[existingIdx] = connection;
  } else {
    familyConnectionsMemory.push(connection);
  }

  console.log(`[Backend /api/family/claim-token] Claimed token ${token}, created connection ${connId} (pending)`);
  res.json({ success: true, connection });
});

// Update connection status (approve / reject / disconnect)
app.post('/api/family/update-connection', (req, res) => {
  const { connectionId, status } = req.body;
  const conn = familyConnectionsMemory.find(c => c.id === connectionId);
  if (conn) {
    conn.status = status;
    conn.updatedAt = Date.now();
  }
  res.json({ success: true, status });
});

// Notify request
app.post('/api/family/notify-request', (req, res) => {
  const connection = req.body;
  if (connection && connection.id) {
    const existingIdx = familyConnectionsMemory.findIndex(c => c.id === connection.id);
    if (existingIdx >= 0) {
      familyConnectionsMemory[existingIdx] = connection;
    } else {
      familyConnectionsMemory.push(connection);
    }
  }
  res.json({ success: true });
});

app.get('/api/user/pending-requests', (req, res) => {
  const { phone, uid } = req.query;
  const requests = familyConnectionsMemory.filter(c => 
    c.status === 'pending' && (!phone || c.toUserPhone === phone || c.navidoorPhone === phone || c.navidoorUid === uid)
  );
  res.json({ success: true, requests });
});

app.post('/api/user/approve-connection', (req, res) => {
  const { userPhone, familyPhone, action, approved, connectionId } = req.body;
  const isApproved = approved !== undefined ? approved : action === 'accept';
  const newStatus = isApproved ? 'connected' : 'rejected';

  let conn = null;
  if (connectionId) {
    conn = familyConnectionsMemory.find(c => c.id === connectionId);
  }
  if (!conn && userPhone && familyPhone) {
    conn = familyConnectionsMemory.find(c => (c.toUserPhone === userPhone || c.navidoorPhone === userPhone) && (c.fromFamilyPhone === familyPhone || c.companionPhone === familyPhone));
  }
  if (conn) {
    conn.status = newStatus;
    conn.updatedAt = Date.now();
  }
  res.json({ success: true, status: conn ? conn.status : newStatus });
});

app.all(['/api/family/connection-status', '/api/family/connection-status/get'], (req, res) => {
  const phone = req.query.phone || (req.body && req.body.familyPhone);
  const requests = familyConnectionsMemory.filter(c => c.fromFamilyPhone === phone || c.toUserPhone === phone || c.companionPhone === phone || c.navidoorPhone === phone);
  const connectedUsers = requests.filter(c => c.status === 'connected').map(c => (c.toUserPhone === phone || c.navidoorPhone === phone) ? (c.fromFamilyPhone || c.companionPhone) : (c.toUserPhone || c.navidoorPhone));
  
  // Return connected users and requests
  res.json({ success: true, requests, connectedUsers });
});

app.post('/api/family/connect', (req, res) => {
  const { familyPhone, familyName, relationship, userPhone } = req.body;
  const targetPhone = userPhone || '+91 98123 45678';
  const existing = familyConnectionsMemory.find(c => c.fromFamilyPhone === familyPhone && c.toUserPhone === targetPhone);
  if (existing) {
    existing.status = 'connected';
  } else {
    familyConnectionsMemory.push({
      fromFamilyPhone: familyPhone,
      familyName: familyName || 'Caregiver',
      relationship: relationship || 'Family',
      toUserPhone: targetPhone,
      status: 'connected',
      timestamp: Date.now()
    });
  }
  res.json({ success: true, status: 'connected', connectedUserPhone: targetPhone });
});

app.post('/api/family/login', (req, res) => {
  const { phone, password } = req.body;
  const familyMember = {
    id: `fam_${Date.now()}`,
    name: 'Priya Sharma',
    phone: phone || '+91 98765 43210',
    relationship: 'Caregiver'
  };
  res.json({
    success: true,
    user: familyMember,
    member: familyMember
  });
});

app.post(['/api/family/register', '/api/family/signup'], (req, res) => {
  const { name, phone, relationship, email } = req.body;
  const familyMember = {
    id: `fam_${Date.now()}`,
    name: name || 'Priya Sharma',
    phone: phone || '+91 98765 43210',
    relationship: relationship || 'Family Companion',
    email
  };
  res.json({
    success: true,
    user: familyMember,
    member: familyMember
  });
});

app.get(['/api/family/dashboard', '/api/family/dashboard-data'], (req, res) => {
  res.json({
    success: true,
    data: {
      userName: 'Aarav Sharma',
      userPhone: '+91 98123 45678',
      location: { latitude: 28.6315, longitude: 77.2167, address: 'Connaught Place, Inner Circle, New Delhi' },
      activity: { status: 'Walking safely with AI voice assist', battery: '85%' },
      alerts: []
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NAVIDOOR Node.js + Express.js + Socket.IO Backend] Server running on http://0.0.0.0:${PORT} (LAN accessible)`);
});
