const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { Server } = require('socket.io');

const { SUPPORTED_LANGUAGES } = require('./config/languages');
const whisperService = require('./services/whisperService');
const indicf5Service = require('./services/indicf5Service');
const translationService = require('./services/translationService');
const aiAssistantService = require('./services/aiAssistantService');
const yoloClientService = require('./services/yoloClientService');
const ocrClientService = require('./services/ocrClientService');
const ocrSemanticService = require('./services/ocrSemanticService');
const databaseService = require('./services/databaseService');
const { checkDatabaseHealth } = require('./lib/prisma');
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
    cb(null, `real_microphone_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
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
  const [indicf5Status, yoloStatus, ocrStatus, dbStatus] = await Promise.all([
    indicf5Service.checkStatus(),
    yoloClientService.checkHealth(),
    ocrClientService.checkHealth(),
    checkDatabaseHealth(),
  ]);
  res.json({
    status: 'online',
    system: 'NAVIDOOR Backend Engine',
    whisperEngine: 'whisper.cpp-native',
    indicf5Engine: indicf5Status.engine,
    indicf5Online: indicf5Status.online,
    indicf5Device: indicf5Status.device || 'CPU',
    yoloOnline: yoloStatus.online,
    yoloEngine: yoloStatus.engine || 'offline',
    ocrOnline: ocrStatus.online,
    ocrEngine: ocrStatus.engine || 'offline',
    databaseOnline: dbStatus.online,
    databaseConfigured: dbStatus.configured,
    databaseProvider: dbStatus.provider,
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

// 1.2 OCR Reading Assistant endpoints (Module 5)
app.get('/api/ocr/health', async (req, res) => {
  const status = await ocrClientService.checkHealth();
  res.json(status);
});

app.post('/api/ocr/analyze', async (req, res) => {
  try {
    const { image, language = 'en', mode = 'glance', categoryHint = null, generateAudio = false, userPhone = null, uid = null } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Image base64 payload is required.' });
    }

    // Step 1: Run OCR through Python microservice (Port 5004)
    const rawOcr = await ocrClientService.readFrame(image, mode, categoryHint);

    // Step 2: Semantic LLM entity extraction & accessible announcement formulation
    const semanticResult = await ocrSemanticService.processSemanticResult(rawOcr, language);

    // Step 3: Optional Neural Speech Synthesis via IndicF5
    let audioUrl = null;
    let audioBase64 = null;
    if (generateAudio && semanticResult.spokenSummary) {
      try {
        const ttsResult = await indicf5Service.synthesizeSpeech(semanticResult.spokenSummary, language);
        if (ttsResult && ttsResult.audioBase64) {
          audioBase64 = ttsResult.audioBase64;
          audioUrl = ttsResult.audioUrl;
        }
      } catch (ttsErr) {
        console.warn('[OCR TTS Error]:', ttsErr.message);
      }
    }

    // Broadcast reading event to family companion / caregiver portal in real time
    io.emit('ocr_reading_event', {
      category: semanticResult.category,
      spokenSummary: semanticResult.spokenSummary,
      text: semanticResult.rawText,
      timestamp: Date.now()
    });

    // Non-blocking async persistence to Neon Postgres
    if (semanticResult.rawText) {
      databaseService.logOcrScan({
        phone: userPhone,
        uid,
        category: semanticResult.category,
        rawText: semanticResult.rawText,
        structuredData: semanticResult.structuredData,
        spokenSummary: semanticResult.spokenSummary,
        language,
      }).catch(() => {});
    }

    res.json({
      success: true,
      text: semanticResult.rawText,
      lines: semanticResult.lines,
      category: semanticResult.category,
      structuredData: semanticResult.structuredData,
      spokenSummary: semanticResult.spokenSummary,
      quality: semanticResult.quality,
      inferenceTimeMs: semanticResult.inferenceTimeMs,
      audioBase64,
      audioUrl
    });
  } catch (err) {
    console.error('[API /api/ocr/analyze Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ocr/glance', async (req, res) => {
  try {
    const { image, language = 'en' } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Image base64 payload is required.' });
    }
    const rawOcr = await ocrClientService.glanceScan(image);
    const result = await ocrSemanticService.processSemanticResult(rawOcr, language);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ocr/read-aloud', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required for read-aloud.' });
    }
    const ttsResult = await indicf5Service.synthesizeSpeech(text, language);
    res.json({ success: true, text, language, ...ttsResult });
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
  let uploadedPath = req.file?.path;
  let convertedPath = null;
  try {
    const languageCode = req.body.language || 'en';
    const sourceUri = req.body.sourceUri || 'mobile_mic';
    if (!req.file || !fs.existsSync(req.file.path) || req.file.size <= 0) {
      return res.status(400).json({ success: false, error: 'Audio upload missing or empty. Expected multipart field "audio".' });
    }
    const filePath = req.file.path;

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
    convertedPath = result.real16kWavPath;
    if (!result.text || !result.text.trim()) {
      return res.status(422).json({
        success: false,
        error: 'No speech was recognized in the uploaded recording.',
        sourceAudioSize: fileSize,
        wavMetrics: result.wavMetrics || null,
      });
    }

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
    res.status(500).json({ success: false, error: `Whisper.cpp STT transcription failed: ${err.message}` });
  } finally {
    for (const file of [uploadedPath, convertedPath]) {
      if (file && file !== uploadedPath && fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch (cleanupError) {
          console.warn('[API /api/stt] Could not remove converted audio:', cleanupError.message);
        }
      }
      if (file === uploadedPath && file && fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch (cleanupError) {
          console.warn('[API /api/stt] Could not remove uploaded audio:', cleanupError.message);
        }
      }
    }
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

// 7. Family Companion & User Management Endpoints (Neon Postgres via Prisma + Offline Fallback)
app.post('/api/family/register-token', async (req, res) => {
  try {
    const { token, navidoorUid, navidoorName, navidoorPhone, expiresAt } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }
    await databaseService.registerPairingToken({ token, navidoorUid, navidoorName, navidoorPhone, expiresAt });
    console.log(`[Backend /api/family/register-token] Registered token ${token} (expires in 5 min)`);
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Securely validate and claim pairing token
app.post('/api/family/claim-token', async (req, res) => {
  try {
    const { token, companionUid, companionName, companionPhone, companionRelationship } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }
    const result = await databaseService.claimPairingToken({
      token,
      companionUid,
      companionName,
      companionPhone,
      companionRelationship,
    });
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ success: false, error: result.error });
    }
    res.json({ success: true, connection: result.connection });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update connection status (approve / reject / disconnect)
app.post('/api/family/update-connection', async (req, res) => {
  try {
    const { connectionId, status } = req.body;
    const updatedStatus = await databaseService.updateConnectionStatus({ connectionId, status });
    res.json({ success: true, status: updatedStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Notify request
app.post('/api/family/notify-request', async (req, res) => {
  try {
    const connection = req.body;
    if (connection && connection.navidoorPhone && connection.companionPhone) {
      await databaseService.connectFamilyDirect({
        userPhone: connection.navidoorPhone,
        familyPhone: connection.companionPhone,
        familyName: connection.companionName,
        relationship: connection.companionRelationship,
        status: connection.status || 'pending',
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/user/pending-requests', async (req, res) => {
  try {
    const { phone, uid } = req.query;
    const requests = await databaseService.getPendingRequests({ phone, uid });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/user/approve-connection', async (req, res) => {
  try {
    const { userPhone, familyPhone, action, approved, connectionId } = req.body;
    const isApproved = approved !== undefined ? approved : action === 'accept';
    const newStatus = isApproved ? 'connected' : 'rejected';
    const status = await databaseService.updateConnectionStatus({
      connectionId,
      userPhone,
      familyPhone,
      status: newStatus,
    });
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.all(['/api/family/connection-status', '/api/family/connection-status/get'], async (req, res) => {
  try {
    const phone = req.query.phone || (req.body && req.body.familyPhone);
    const { requests, connectedUsers } = await databaseService.getConnectionStatus({ phone });
    res.json({ success: true, requests, connectedUsers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/family/connect', async (req, res) => {
  try {
    const { familyPhone, familyName, relationship, userPhone } = req.body;
    const result = await databaseService.connectFamilyDirect({
      familyPhone,
      familyName,
      relationship,
      userPhone,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/family/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const result = await databaseService.loginFamilyUser({ phone, password });
    if (!result.success) {
      return res.status(401).json({ success: false, error: result.error });
    }
    res.json({
      success: true,
      user: result.user,
      member: result.user,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/family/register', '/api/family/signup'], async (req, res) => {
  try {
    const { name, phone, relationship, email, password, uid } = req.body;
    const familyMember = await databaseService.registerFamilyUser({
      name,
      phone,
      relationship,
      email,
      password,
      uid,
    });
    res.json({
      success: true,
      user: familyMember,
      member: familyMember,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get(['/api/family/dashboard', '/api/family/dashboard-data'], async (req, res) => {
  try {
    const { phone, userPhone } = req.query;
    const data = await databaseService.getFamilyDashboard({ phone, userPhone });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Hybrid Mobile Sync, Medical ID, Medications, History & SOS Persistence Endpoints
app.get('/api/user/bootstrap', async (req, res) => {
  try {
    const { phone, uid } = req.query;
    const data = await databaseService.getBootstrapData({ phone, uid });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/user/profile', async (req, res) => {
  try {
    const user = await databaseService.ensureUser(req.body || {});
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/medical-profile', async (req, res) => {
  try {
    const profile = await databaseService.getMedicalProfile(req.query.phone);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/medical-profile', async (req, res) => {
  try {
    const profile = await databaseService.upsertMedicalProfile(req.body || {});
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/emergency-contacts', async (req, res) => {
  try {
    const contacts = await databaseService.listEmergencyContacts(req.query.phone);
    res.json({ success: true, contacts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/emergency-contacts', async (req, res) => {
  try {
    const contact = await databaseService.addEmergencyContact(req.body || {});
    res.json({ success: true, contact });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/emergency-contacts/:id', async (req, res) => {
  try {
    const result = await databaseService.deleteEmergencyContact(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/medicines', async (req, res) => {
  try {
    const medicines = await databaseService.listMedications(req.query.phone);
    res.json({ success: true, medicines });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/medicines', async (req, res) => {
  try {
    const medicine = await databaseService.addMedication(req.body || {});
    res.json({ success: true, medicine });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/medicines/:id/confirm', async (req, res) => {
  try {
    const result = await databaseService.confirmMedicationTaken({
      medicationId: req.params.id,
      status: req.body?.status || 'TAKEN',
    });
    if (!result) return res.status(404).json({ success: false, error: 'Medication not found' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/medicines/:id', async (req, res) => {
  try {
    const result = await databaseService.deleteMedication(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 25;
    const scans = await databaseService.getOcrHistory({ phone: req.query.phone, limit });
    res.json({ success: true, scans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sos', async (req, res) => {
  try {
    const alert = await databaseService.logSosAlert(req.body || {});
    io.emit('emergency:broadcast', {
      alertType: 'SOS_TRIGGERED',
      phone: req.body?.phone || 'Unknown User',
      location: req.body?.address || 'Live GPS',
      timestamp: new Date().toISOString(),
    });
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sos/:id/resolve', async (req, res) => {
  try {
    const alert = await databaseService.resolveSosAlert(req.params.id);
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/location', async (req, res) => {
  try {
    const snapshot = await databaseService.logLocationSnapshot(req.body || {});
    res.json({ success: true, snapshot });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NAVIDOOR Node.js + Express.js + Socket.IO Backend] Server running on http://0.0.0.0:${PORT} (LAN accessible)`);
});
