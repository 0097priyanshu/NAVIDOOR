import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:record/record.dart';

class AudioService {
  static final AudioService _instance = AudioService._internal();
  factory AudioService() => _instance;
  AudioService._internal();

  final AudioPlayer _player = AudioPlayer();
  final FlutterTts _tts = FlutterTts();
  final AudioRecorder _recorder = AudioRecorder();

  bool _isRecording = false;
  bool get isRecording => _isRecording;

  Future<void> init() async {
    try {
      await _tts.setSpeechRate(0.9);
      await _tts.setPitch(1.0);
    } catch (e) {
      debugPrint('[AudioService] TTS init error: $e');
    }
  }

  Future<void> speakFallback(String text, {String languageCode = 'en', double rate = 1.0}) async {
    try {
      await _tts.stop();
      await _tts.setLanguage(languageCode);
      await _tts.setSpeechRate(0.5 * rate);
      await _tts.speak(text);
    } catch (e) {
      debugPrint('[AudioService] speakFallback error: $e');
    }
  }

  Future<void> playAudioBytes(Uint8List bytes) async {
    try {
      await _player.stop();
      await _player.play(BytesSource(bytes));
    } catch (e) {
      debugPrint('[AudioService] playAudioBytes error: $e');
    }
  }

  Future<void> stopAllAudio() async {
    try {
      await _player.stop();
      await _tts.stop();
    } catch (e) {
      debugPrint('[AudioService] stopAllAudio error: $e');
    }
  }

  Future<bool> startRecording() async {
    try {
      if (await _recorder.hasPermission()) {
        const config = RecordConfig(
          encoder: AudioEncoder.wav,
          sampleRate: 16000,
          numChannels: 1,
        );
        await _recorder.start(config, path: '');
        _isRecording = true;
        return true;
      }
    } catch (e) {
      debugPrint('[AudioService] startRecording error: $e');
    }
    return false;
  }

  Future<Uint8List?> stopRecording() async {
    try {
      if (_isRecording) {
        _isRecording = false;
        final path = await _recorder.stop();
        if (path != null) {
          return null;
        }
      }
    } catch (e) {
      debugPrint('[AudioService] stopRecording error: $e');
    }
    return null;
  }
}
