import { Platform } from 'react-native';
import { stopSpeech } from '../utils/speechUtils';

const LANG_BCP47_MAP: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
};

function getExpoAudio(): any {
  if (Platform.OS === 'web') return null;

  // 1. Try modern expo-audio first (Expo SDK 57+)
  try {
    const expoAudio = require('expo-audio');
    let AudioModule: any = null;
    try {
      AudioModule = require('expo-audio/build/AudioModule').default;
    } catch (e) {}

    const AudioRecorder = (AudioModule && AudioModule.AudioRecorder) || expoAudio.AudioRecorder || (expoAudio.default && expoAudio.default.AudioRecorder);
    if (expoAudio && (expoAudio.requestRecordingPermissionsAsync || AudioRecorder)) {
      return {
        isExpoAudio: true,
        getPermissionsAsync: expoAudio.getRecordingPermissionsAsync,
        requestPermissionsAsync: expoAudio.requestRecordingPermissionsAsync,
        AudioRecorder,
        RecordingPresets: expoAudio.RecordingPresets,
        expoAudio,
      };
    }
  } catch (e) {}

  // 2. Fallback to legacy expo-av (older Expo SDKs)
  try {
    const expoAv = require('expo-av');
    if (expoAv && (expoAv.Audio || expoAv.default?.Audio)) {
      return expoAv.Audio || expoAv.default?.Audio;
    }
  } catch (e) {}

  return null;
}

export class VoiceRecordingService {
  private recording: any = null;
  private isRecording: boolean = false;
  private speechRecognition: any = null;
  private lastLiveTranscript: string = '';
  private onAutoResultCallback: ((text: string) => void) | null = null;

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private activeStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private pcmSamples: Float32Array[] = [];
  private audioSampleRate: number = 44100;

  private activeLangCode: string = 'en';

  async requestMicrophonePermission(): Promise<boolean> {
    console.log('[VoiceRecordingService]: Requesting microphone permission...');

    // 1. Native Mobile (iOS & Android)
    if (Platform.OS !== 'web') {
      const Audio = getExpoAudio();
      if (Audio) {
        try {
          const { status, granted } = await Audio.getPermissionsAsync();
          console.log('[VoiceRecordingService] Current Mobile Mic Status:', status);
          if (granted) {
            console.log('MIC PERMISSION: GRANTED');
            return true;
          }
          console.log('[VoiceRecordingService] Triggering native mobile microphone permission dialog...');
          const response = await Audio.requestPermissionsAsync();
          console.log(`MIC PERMISSION: ${response.granted ? 'GRANTED' : 'DENIED'} (Status: ${response.status})`);
          return response.granted;
        } catch (err) {
          console.warn('[VoiceRecordingService] Mobile Audio permission request error:', err);
          return false;
        }
      }
    }

    // 2. Web Browser (HTML5 MediaDevices)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator && navigator.mediaDevices) {
      try {
        if (!this.activeStream || !this.activeStream.active) {
          this.activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        console.log('MIC PERMISSION: GRANTED (Web MediaDevices)');
        return true;
      } catch (e) {
        console.log('MIC PERMISSION: DENIED (Web MediaDevices)', e);
        return false;
      }
    }

    return true;
  }

  async startRecording(langCode: string = 'en', onAutoResult?: (text: string) => void): Promise<boolean> {
    stopSpeech();

    const hasPerm = await this.requestMicrophonePermission();
    if (!hasPerm) {
      console.warn('[VoiceRecordingService] Cannot start recording: Permission denied');
      return false;
    }

    this.activeLangCode = langCode;
    this.lastLiveTranscript = '';
    this.isRecording = true;
    this.audioChunks = [];
    this.pcmSamples = [];
    this.onAutoResultCallback = onAutoResult || null;

    console.log('RECORDING STARTED: YES');

    // 1. NATIVE MOBILE RECORDING (iOS & Android via expo-audio or expo-av)
    if (Platform.OS !== 'web') {
      const Audio = getExpoAudio();
      if (Audio) {
        try {
          if (Audio.isExpoAudio) {
            const { AudioRecorder, RecordingPresets, expoAudio } = Audio;
            if (!AudioRecorder) {
              throw new Error('AudioRecorder constructor unavailable on expo-audio module');
            }

            const presets = RecordingPresets || (expoAudio && expoAudio.RecordingPresets) || {};
            const options = presets.HIGH_QUALITY || {
              extension: '.m4a',
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 128000,
              android: { outputFormat: 'mpeg4', audioEncoder: 'aac' },
            };

            if (this.recording) {
              try { await this.recording.stop(); } catch (e) {}
              this.recording = null;
            }

            const recorder = new AudioRecorder(options);
            if (typeof recorder.prepareToRecordAsync === 'function') {
              await recorder.prepareToRecordAsync();
            }
            recorder.record();
            this.recording = recorder;
            console.log('[VoiceRecordingService] Mobile expo-audio recording active');
            return true;
          } else if (Audio.Recording) {
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
              staysActiveInBackground: false,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false,
            });

            if (this.recording) {
              try { await this.recording.stopAndUnloadAsync(); } catch (e) {}
              this.recording = null;
            }

            const { recording } = await Audio.Recording.createAsync(
              Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            this.recording = recording;
            console.log('[VoiceRecordingService] Mobile Audio recording active:', this.recording.getURI());
            return true;
          }
        } catch (err) {
          console.error('[VoiceRecordingService] Mobile Audio start error:', err);
          this.isRecording = false;
          return false;
        }
      } else {
        console.warn('[VoiceRecordingService] Mobile Audio module is NOT available on this native device');
        this.isRecording = false;
        return false;
      }
    }

    // 2. WEB BROWSER RECORDING (HTML5 MediaRecorder & PCM WAV Generator)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (!this.activeStream || !this.activeStream.active) {
          this.activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
          this.audioSampleRate = this.audioCtx.sampleRate || 44100;
          if (this.audioCtx.state === 'suspended') {
            try { await this.audioCtx.resume(); } catch (e) {}
          }
          this.sourceNode = this.audioCtx.createMediaStreamSource(this.activeStream);
          this.scriptNode = this.audioCtx.createScriptProcessor(4096, 1, 1);

          this.scriptNode.onaudioprocess = (e) => {
            if (this.isRecording) {
              const input = e.inputBuffer.getChannelData(0);
              this.pcmSamples.push(new Float32Array(input));
            }
          };

          this.sourceNode.connect(this.scriptNode);
          this.scriptNode.connect(this.audioCtx.destination);
          console.log(`[VoiceRecordingService] Web AudioContext PCM listener active (${this.audioSampleRate}Hz)`);
        }

        this.mediaRecorder = new MediaRecorder(this.activeStream);
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
        this.mediaRecorder.start(100);
        console.log('[VoiceRecordingService] Web MediaRecorder started.');
      } catch (err) {
        console.warn('[VoiceRecordingService] Web MediaRecorder error:', err);
      }

      // Web SpeechRecognition for instant live transcript
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          if (this.speechRecognition) {
            try { this.speechRecognition.abort(); } catch (e) {}
          }
          this.speechRecognition = new SpeechRecognition();
          this.speechRecognition.continuous = true;
          this.speechRecognition.interimResults = true;
          this.speechRecognition.lang = LANG_BCP47_MAP[langCode] || 'en-US';

          this.speechRecognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i] && event.results[i][0] && event.results[i][0].transcript) {
                transcript += event.results[i][0].transcript + ' ';
              }
            }
            if (transcript && transcript.trim()) {
              this.lastLiveTranscript = transcript.trim();
              console.log('[VoiceRecordingService] Live speech detected:', this.lastLiveTranscript);
            }
          };

          this.speechRecognition.onend = () => {
            if (this.onAutoResultCallback) {
              const text = this.lastLiveTranscript;
              this.lastLiveTranscript = '';
              const cb = this.onAutoResultCallback;
              this.onAutoResultCallback = null;
              if (text && text.trim()) {
                cb(text.trim());
              }
            }
          };

          this.speechRecognition.start();
        } catch (e) {}
      }
    }
    return true;
  }

  private buildWavFromPcm(samples: Float32Array[], inputSampleRate: number = 44100, targetSampleRate: number = 16000): Blob {
    let totalInputSamples = 0;
    for (const chunk of samples) {
      totalInputSamples += chunk.length;
    }
    if (totalInputSamples === 0) {
      return new Blob([], { type: 'audio/wav' });
    }

    const merged = new Float32Array(totalInputSamples);
    let offset = 0;
    for (const chunk of samples) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    let outputSamples: Float32Array;
    if (inputSampleRate !== targetSampleRate && inputSampleRate > 0) {
      const ratio = inputSampleRate / targetSampleRate;
      const newLength = Math.round(totalInputSamples / ratio);
      outputSamples = new Float32Array(newLength);
      for (let i = 0; i < newLength; i++) {
        const srcIdx = i * ratio;
        const index = Math.floor(srcIdx);
        const decimal = srcIdx - index;
        const current = merged[index] || 0;
        const next = merged[index + 1] !== undefined ? merged[index + 1] : current;
        outputSamples[i] = current + decimal * (next - current);
      }
    } else {
      outputSamples = merged;
    }

    const numSamples = outputSamples.length;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    this.writeString(view, 8, 'WAVE');

    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, targetSampleRate, true);
    view.setUint32(28, targetSampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    this.writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    let pcmOffset = 44;
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, outputSamples[i]));
      view.setInt16(pcmOffset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      pcmOffset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  async stopRecording(): Promise<{ blob: Blob | null; uri: string | null; liveTranscript: string }> {
    console.log('RECORDING STOPPED: YES');
    const liveTranscript = this.lastLiveTranscript;
    this.lastLiveTranscript = '';
    this.isRecording = false;
    this.onAutoResultCallback = null;

    if (this.speechRecognition) {
      try { this.speechRecognition.stop(); } catch (e) {}
      this.speechRecognition = null;
    }

    let blob: Blob | null = null;
    let recordedUri: string | null = null;

    // 1. NATIVE MOBILE CLEANUP (iOS & Android)
    if (Platform.OS !== 'web' && this.recording) {
      try {
        if (typeof this.recording.stop === 'function') {
          await this.recording.stop();
          recordedUri = this.recording.uri || null;
        } else if (typeof this.recording.stopAndUnloadAsync === 'function') {
          recordedUri = this.recording.getURI ? this.recording.getURI() : null;
          await this.recording.stopAndUnloadAsync();
          if (!recordedUri && this.recording.getURI) {
            recordedUri = this.recording.getURI();
          }
        }
        if (recordedUri) {
          console.log(`SOURCE AUDIO URI: ${recordedUri}`);
        }
      } catch (err) {
        console.warn('[VoiceRecordingService] Mobile stop recording error:', err);
      } finally {
        this.recording = null;
      }
    }

    // 2. WEB BROWSER CLEANUP (HTML5)
    if (Platform.OS === 'web') {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        try {
          await new Promise<void>((resolve) => {
            if (!this.mediaRecorder) return resolve();
            this.mediaRecorder.onstop = () => resolve();
            this.mediaRecorder.stop();
            setTimeout(resolve, 300);
          });
        } catch (e) {}
      }

      if (this.pcmSamples && this.pcmSamples.length > 0) {
        blob = this.buildWavFromPcm(this.pcmSamples, this.audioSampleRate, 16000);
        console.log(`[VoiceRecordingService] Built PCM WAV Blob (${blob ? blob.size : 0} bytes) from ${this.pcmSamples.length} chunks.`);
        this.pcmSamples = [];
      }

      if ((!blob || blob.size <= 44) && this.audioChunks && this.audioChunks.length > 0) {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        blob = new Blob(this.audioChunks, { type: mimeType });
        console.log(`[VoiceRecordingService] Built MediaRecorder Blob (${blob.size} bytes, ${mimeType}).`);
        this.audioChunks = [];
      }

      if (this.sourceNode) {
        try { this.sourceNode.disconnect(); } catch (e) {}
        this.sourceNode = null;
      }
      if (this.scriptNode) {
        try { this.scriptNode.disconnect(); } catch (e) {}
        this.scriptNode = null;
      }
      if (this.audioCtx) {
        try { this.audioCtx.close(); } catch (e) {}
        this.audioCtx = null;
      }
    }

    if (this.activeStream) {
      try { this.activeStream.getTracks().forEach((t) => t.stop()); } catch (e) {}
      this.activeStream = null;
    }

    return { blob, uri: recordedUri, liveTranscript };
  }

  getRecordingStatus(): boolean {
    return this.isRecording;
  }
}

export const voiceRecordingService = new VoiceRecordingService();
