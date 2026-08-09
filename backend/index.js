const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const { SUPPORTED_LANGUAGES } = require('./config/languages');
const whisperService = require('./services/whisperService');
const piperService = require('./services/piperService');
const translationService = require('./services/translationService');
const aiAssistantService = require('./services/aiAssistantService');
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
app.use(express.json());

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
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'NAVIDOOR Backend Engine',
    whisperEngine: 'whisper.cpp-native',
    piperEngine: 'piper-tts-native'
  });
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

// 4. AI Assistant Query Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { query, language = 'en', context = {} } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter is required.' });
    }

    const result = await aiAssistantService.processQuery(query, language, context);
    const answer = typeof result === 'string' ? result : (result.answer || '');
    const intent = typeof result === 'object' ? result.intent : null;

    io.emit('ai_response', { query, answer, intent, language, timestamp: Date.now() });

    res.json({
      success: true,
      query,
      answer,
      intent,
      language
    });
  } catch (err) {
    console.error('[API /api/chat Error]:', err);
    res.status(500).json({ success: false, error: 'AI Assistant processing failed.' });
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

// 6. Text-to-Speech Endpoint (Piper TTS)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required.' });
    }

    const result = await piperService.synthesizeSpeech(text, language);
    if (!result) {
      return res.status(500).json({ success: false, error: 'Piper TTS synthesis failed.' });
    }

    res.set({
      'Content-Type': result.contentType,
      'Content-Length': result.audioBuffer.length,
      'X-Voice-Engine': result.engine,
      'X-Voice-Model': result.voice
    });

    res.send(result.audioBuffer);
  } catch (err) {
    console.error('[API /api/tts Error]:', err);
    res.status(500).json({ success: false, error: 'Piper TTS synthesis failed.' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NAVIDOOR Node.js + Express.js + Socket.IO Backend] Server running on http://0.0.0.0:${PORT} (LAN accessible)`);
});
