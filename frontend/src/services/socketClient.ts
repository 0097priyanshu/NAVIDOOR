import { io, Socket } from 'socket.io-client';
import { SupportedLanguageCode } from '../types';
import { BACKEND_URL } from './voiceAssistantBackend';

class NavidoorSocketClient {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  connect() {
    if (this.socket && this.isConnected) return;

    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('[SocketClient] Connected to NAVIDOOR Socket.IO Server:', this.socket?.id);
    });

    this.socket.on('server:ready', (data) => {
      console.log('[SocketClient] Server ready signal received:', data.message);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('[SocketClient] Disconnected from Socket.IO Server');
    });
  }

  sendChatQuery(query: string, language: SupportedLanguageCode, onResponse: (answer: string) => void) {
    if (!this.socket) this.connect();

    if (this.socket) {
      this.socket.once('chat:response', (data) => {
        if (data && data.answer) {
          onResponse(data.answer);
        }
      });
      this.socket.emit('chat:query', { query, language });
    }
  }

  emitEmergencySOS(locationInfo: string = 'Oak Lane') {
    if (!this.socket) this.connect();
    this.socket?.emit('emergency:sos', { location: locationInfo });
  }

  emitSpatialAlert(obstacleInfo: string) {
    if (!this.socket) this.connect();
    this.socket?.emit('spatial:alert', { obstacle: obstacleInfo });
  }

  registerPhone(phone: string, role: string) {
    if (!this.socket) this.connect();
    this.socket?.emit('register', { phone, role });
    console.log(`[SocketClient] Emitted register for ${role} (${phone})`);
  }

  getSocket(): Socket | null {
    if (!this.socket) this.connect();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const socketClient = new NavidoorSocketClient();
