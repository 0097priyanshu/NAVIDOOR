const aiAssistantService = require('./aiAssistantService');
const translationService = require('./translationService');

function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    socket.emit('server:ready', {
      message: 'NAVIDOOR Real-Time Socket.IO Server Connected',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // 1. Real-time dynamic AI Q&A via WebSockets
    socket.on('chat:query', async (data) => {
      try {
        const { query, language = 'en' } = data || {};
        if (!query) return;

        const answer = await aiAssistantService.processQuery(query, language);
        socket.emit('chat:response', {
          success: true,
          query,
          answer,
          language,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        socket.emit('chat:error', { error: 'Failed to process chat query' });
      }
    });

    // 2. Real-time Live Translation Event
    socket.on('translate:text', async (data) => {
      try {
        const { text, targetLanguage = 'en' } = data || {};
        if (!text) return;

        const translatedText = await translationService.translateText(text, targetLanguage);
        socket.emit('translate:result', {
          success: true,
          originalText: text,
          translatedText,
          targetLanguage
        });
      } catch (err) {
        socket.emit('translate:error', { error: 'Translation error' });
      }
    });

    // 3. Real-Time Emergency SOS Broadcast Channel
    socket.on('emergency:sos', (data) => {
      console.log(`[Socket.IO] EMERGENCY SOS ALERT from ${socket.id}:`, data);
      io.emit('emergency:broadcast', {
        alertType: 'SOS_TRIGGERED',
        socketId: socket.id,
        location: data ? data.location : 'Oak Lane',
        timestamp: new Date().toISOString()
      });
    });

    // 4. Live Spatial Vision Alert Channel
    socket.on('spatial:alert', (data) => {
      socket.broadcast.emit('spatial:update', {
        senderId: socket.id,
        obstacle: data ? data.obstacle : 'Chair 1.2m',
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupSocketIO };
