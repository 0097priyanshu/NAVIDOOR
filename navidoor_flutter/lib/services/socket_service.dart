import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'api_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  bool _isConnected = false;
  bool get isConnected => _isConnected;

  Function(Map<String, dynamic>)? onSosAlertReceived;
  Function(Map<String, dynamic>)? onFamilyRequestReceived;
  Function(Map<String, dynamic>)? onTelemetryReceived;

  void connect() {
    if (_socket != null && _isConnected) return;

    final url = ApiService.activeBackendUrl;
    try {
      _socket = io.io(
        url,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(5)
            .build(),
      );

      _socket?.onConnect((_) {
        _isConnected = true;
        debugPrint('[SocketService] Connected to NAVIDOOR Socket.IO Server: ${_socket?.id}');
      });

      _socket?.on('server:ready', (data) {
        debugPrint('[SocketService] Server ready signal received: $data');
      });

      _socket?.on('emergency:sos', (data) {
        debugPrint('[SocketService] SOS alert received: $data');
        if (data is Map<String, dynamic>) {
          onSosAlertReceived?.call(data);
        }
      });

      _socket?.on('family:request', (data) {
        debugPrint('[SocketService] Family connection request received: $data');
        if (data is Map<String, dynamic>) {
          onFamilyRequestReceived?.call(data);
        }
      });

      _socket?.on('family:telemetry', (data) {
        if (data is Map<String, dynamic>) {
          onTelemetryReceived?.call(data);
        }
      });

      _socket?.onDisconnect((_) {
        _isConnected = false;
        debugPrint('[SocketService] Disconnected from Socket.IO Server');
      });
    } catch (e) {
      debugPrint('[SocketService] Connection error: $e');
    }
  }

  void registerPhone(String phone, String role) {
    if (_socket == null) connect();
    _socket?.emit('register', {'phone': phone, 'role': role});
    debugPrint('[SocketService] Emitted register for $role ($phone)');
  }

  void emitEmergencySOS({String location = 'Oak Lane, MG Road', String reason = 'User triggered emergency SOS button'}) {
    if (_socket == null) connect();
    _socket?.emit('emergency:sos', {
      'location': location,
      'reason': reason,
      'timestamp': DateTime.now().toIso8601String(),
    });
    debugPrint('[SocketService] Emitted emergency:sos');
  }

  void emitSpatialAlert(String obstacleInfo) {
    if (_socket == null) connect();
    _socket?.emit('spatial:alert', {
      'obstacle': obstacleInfo,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  void sendChatQuery(String query, String language, Function(String) onResponse) {
    if (_socket == null) connect();
    _socket?.once('chat:response', (data) {
      if (data is Map && data['answer'] != null) {
        onResponse(data['answer'].toString());
      }
    });
    _socket?.emit('chat:query', {'query': query, 'language': language});
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
  }
}
