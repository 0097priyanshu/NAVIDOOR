const aiAssistantService = require('./aiAssistantService');
const translationService = require('./translationService');

function setupSocketIO(io) {
  io.phoneSockets = {};
  io.socketPhones = {};

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    socket.emit('server:ready', {
      message: 'NAVIDOOR Real-Time Socket.IO Server Connected',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Register socket with phone number and role
    socket.on('register', (data) => {
      const { phone, role } = data || {};
      if (phone) {
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        io.phoneSockets[cleanPhone] = socket.id;
        io.socketPhones[socket.id] = cleanPhone;
        console.log(`[Socket.IO] Registered client ${role} (${cleanPhone}) on socket ${socket.id}`);
      }
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
      
      const phone = io.socketPhones[socket.id] || 'Unknown User';
      io.emit('emergency:broadcast', {
        alertType: 'SOS_TRIGGERED',
        socketId: socket.id,
        phone: phone,
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

    // 5. Family live tracking events
    socket.on('family:locationUpdate', (data) => {
      const { userPhone, location } = data || {};
      if (userPhone && location) {
        io.emit(`family:location:${userPhone}`, { location, timestamp: Date.now() });
      }
    });

    socket.on('family:journeyUpdate', (data) => {
      const { userPhone, journey } = data || {};
      if (userPhone && journey) {
        io.emit(`family:journey:${userPhone}`, { journey, timestamp: Date.now() });
      }
    });

    socket.on('family:activityUpdate', (data) => {
      const { userPhone, activity } = data || {};
      if (userPhone && activity) {
        io.emit(`family:activity:${userPhone}`, { activity, timestamp: Date.now() });
      }
    });

    socket.on('family:medicineUpdate', (data) => {
      const { userPhone, medicines } = data || {};
      if (userPhone && medicines) {
        io.emit(`family:medicines:${userPhone}`, { medicines, timestamp: Date.now() });
      }
    });

    socket.on('disconnect', () => {
      const phone = io.socketPhones[socket.id];
      if (phone) {
        console.log(`[Socket.IO] Unregistered phone ${phone}`);
        delete io.phoneSockets[phone];
        delete io.socketPhones[socket.id];
      }
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupSocketIO };
