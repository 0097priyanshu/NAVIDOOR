import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiService {
  static const String localComputerIp = '192.168.0.105';
  static String activeBackendUrl = 'http://localhost:5001';

  static List<String> getCandidateBackendUrls() {
    final List<String> list = [];
    if (kIsWeb) {
      list.add('http://localhost:5001');
      list.add('http://$localComputerIp:5001');
      return list;
    }

    try {
      if (Platform.isAndroid) {
        list.add('http://10.0.2.2:5001');
      }
    } catch (_) {}

    list.add('http://localhost:5001');
    list.add('http://$localComputerIp:5001');
    return list.toSet().toList();
  }

  static Future<String> discoverBackendUrl() async {
    final candidates = getCandidateBackendUrls();
    for (final url in candidates) {
      try {
        final response = await http
            .get(Uri.parse('$url/api/health'))
            .timeout(const Duration(milliseconds: 2500));
        if (response.statusCode == 200) {
          activeBackendUrl = url;
          debugPrint('[ApiService] Reachable Backend URL verified: $activeBackendUrl');
          return activeBackendUrl;
        }
      } catch (_) {}
    }
    debugPrint('[ApiService] Fallback to: ${candidates.first}');
    activeBackendUrl = candidates.first;
    return activeBackendUrl;
  }

  static Future<Map<String, dynamic>?> checkHealth() async {
    try {
      final baseUrl = await discoverBackendUrl();
      final res = await http
          .get(Uri.parse('$baseUrl/api/health'))
          .timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[ApiService] Health check error: $e');
    }
    return null;
  }

  static Future<String?> uploadSpeechAudio(Uint8List audioBytes, {String language = 'en'}) async {
    try {
      final baseUrl = activeBackendUrl;
      final uri = Uri.parse('$baseUrl/api/stt');
      final request = http.MultipartRequest('POST', uri);
      request.fields['language'] = language;
      request.files.add(
        http.MultipartFile.fromBytes(
          'audio',
          audioBytes,
          filename: 'recording.wav',
        ),
      );

      final streamedResponse = await request.send().timeout(const Duration(seconds: 25));
      final response = await http.Response.fromStream(streamedResponse);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['text'] as String?;
      }
    } catch (e) {
      debugPrint('[ApiService] STT upload error: $e');
    }
    return null;
  }

  static Future<String?> queryChatAssistant(String query, {String language = 'en'}) async {
    try {
      final baseUrl = activeBackendUrl;
      final uri = Uri.parse('$baseUrl/api/chat');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'query': query, 'language': language}),
      ).timeout(const Duration(seconds: 20));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['response'] ?? data['answer'];
      }
    } catch (e) {
      debugPrint('[ApiService] Chat assistant error: $e');
    }
    return null;
  }

  static Future<Uint8List?> synthesizeSpeechIndicF5(String text, {String language = 'en'}) async {
    try {
      final baseUrl = activeBackendUrl;
      final uri = Uri.parse('$baseUrl/api/tts');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'text': text, 'language': language}),
      ).timeout(const Duration(seconds: 20));
      if (res.statusCode == 200) {
        return res.bodyBytes;
      }
    } catch (e) {
      debugPrint('[ApiService] IndicF5 TTS error: $e');
    }
    return null;
  }

  // Family Caregiver APIs
  static Future<Map<String, dynamic>?> registerFamilyUser({
    required String name,
    required String phone,
    String? email,
    String? relationship,
  }) async {
    try {
      final baseUrl = activeBackendUrl;
      final uri = Uri.parse('$baseUrl/api/family/register');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'phone': phone,
          'email': email ?? '',
          'relationship': relationship ?? 'Family Caregiver',
          'role': 'caregiver',
        }),
      ).timeout(const Duration(seconds: 8));
      if (res.statusCode == 200 || res.statusCode == 201) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      debugPrint('[ApiService] Family register error: $e');
    }
    return null;
  }

  static Future<Map<String, dynamic>?> requestPairing({
    required String caregiverPhone,
    required String userPhone,
  }) async {
    try {
      final baseUrl = activeBackendUrl;
      final uri = Uri.parse('$baseUrl/api/family/request-pair');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'caregiverPhone': caregiverPhone,
          'userPhone': userPhone,
        }),
      ).timeout(const Duration(seconds: 8));
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      debugPrint('[ApiService] Pairing request error: $e');
    }
    return null;
  }

  static Future<Map<String, dynamic>?> getFamilyStatus(String phone) async {
    try {
      final baseUrl = activeBackendUrl;
      final uri = Uri.parse('$baseUrl/api/family/status?phone=${Uri.encodeComponent(phone)}');
      final res = await http.get(uri).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      debugPrint('[ApiService] Family status error: $e');
    }
    return null;
  }

  static Future<List<dynamic>?> getFamilyActivity() async {
    try {
      final baseUrl = activeBackendUrl;
      final uri = Uri.parse('$baseUrl/api/family/activity');
      final res = await http.get(uri).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['activities'] as List<dynamic>?;
      }
    } catch (e) {
      debugPrint('[ApiService] Family activity error: $e');
    }
    return null;
  }

  static Future<List<dynamic>?> getFamilyAlerts() async {
    try {
      final baseUrl = activeBackendUrl;
      final uri = Uri.parse('$baseUrl/api/family/alerts');
      final res = await http.get(uri).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['alerts'] as List<dynamic>?;
      }
    } catch (e) {
      debugPrint('[ApiService] Family alerts error: $e');
    }
    return null;
  }
}
