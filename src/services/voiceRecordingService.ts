import { Platform } from 'react-native';
import { stopSpeech } from '../utils/speechUtils';

let ExpoAudio: any = null;
try {
  ExpoAudio = require('expo-av').Audio;
} catch (e) {}

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
  private pcmSamples: Float32Array[] = [];
  private scriptNode: ScriptProcessorNode | null = null;

  async requestMicrophonePermission(): Promise<boolean> {
    console.log('[VoiceRecordingService]: Requesting physical device microphone permission...');
    
    if (ExpoAudio) {
      try {
        const response = await ExpoAudio.requestPermissionsAsync();
        console.log(`MIC PERMISSION: ${response.granted ? 'GRANTED' : 'DENIED'}`);
        if (response.granted) return true;
      } catch (err) {
        console.warn('[VoiceRecordingService] Expo Audio permission request error:', err);
      }
    }
    
    if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator.mediaDevices) {
      try {
        if (!this.activeStream || !this.activeStream.active) {
          this.activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        console.log('MIC PERMISSION: GRANTED');
        return true;
      } catch (e) {
        console.log('MIC PERMISSION: DENIED', e);
        return false;
      }
    }
    console.log('MIC PERMISSION: GRANTED (Default)');
    return true;
  }

  async startRecording(langCode: string = 'en', onAutoResult?: (text: string) => void): Promise<boolean> {
    stopSpeech();

    const hasPerm = await this.requestMicrophonePermission();
    if (!hasPerm) {
      console.warn('[VoiceRecordingService] Cannot start recording: Permission denied');
      return false;
    }

    this.lastLiveTranscript = '';
    this.isRecording = true;
    this.audioChunks = [];
    this.pcmSamples = [];
    this.onAutoResultCallback = onAutoResult || null;

    console.log('RECORDING STARTED: YES');

    if (ExpoAudio) {
      try {
        await ExpoAudio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recording = new ExpoAudio.Recording();
        await recording.prepareToRecordAsync(ExpoAudio.RecordingOptionsPresets.HIGH_QUALITY);
        await recording.startAsync();
        this.recording = recording;
        return true;
      } catch (err) {
        console.warn('[VoiceRecordingService] Expo Audio start error:', err);
      }
    }

    // Web MediaRecorder with ALIVE activeStream
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (!this.activeStream || !this.activeStream.active) {
          this.activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass({ sampleRate: 16000 });
          if (this.audioCtx.state === 'suspended') {
            try { await this.audioCtx.resume(); } catch (e) {}
          }
          const source = this.audioCtx.createMediaStreamSource(this.activeStream);
          this.scriptNode = this.audioCtx.createScriptProcessor(4096, 1, 1);

          this.scriptNode.onaudioprocess = (e) => {
            if (this.isRecording) {
              const input = e.inputBuffer.getChannelData(0);
              this.pcmSamples.push(new Float32Array(input));
            }
          };

          source.connect(this.scriptNode);
          this.scriptNode.connect(this.audioCtx.destination);
        }

        this.mediaRecorder = new MediaRecorder(this.activeStream);
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
        this.mediaRecorder.start(100);
      } catch (err) {
        console.warn('[VoiceRecordingService] Web MediaRecorder error:', err);
      }

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
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript && transcript.trim()) {
              this.lastLiveTranscript = transcript.trim();
            }
          };

          this.speechRecognition.onend = () => {
            if (this.lastLiveTranscript && this.onAutoResultCallback) {
              const text = this.lastLiveTranscript;
              this.lastLiveTranscript = '';
              const cb = this.onAutoResultCallback;
              this.onAutoResultCallback = null;
              cb(text);
            }
          };

          this.speechRecognition.start();
        } catch (e) {}
      }
    }
    return true;
  }

  private buildWavFromPcm(samples: Float32Array[], sampleRate: number = 16000): Blob {
    let totalSamples = 0;
    for (const chunk of samples) {
      totalSamples += chunk.length;
    }

    const buffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(buffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    this.writeString(view, 8, 'WAVE');

    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    this.writeString(view, 36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    let offset = 44;
    for (const chunk of samples) {
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      }
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

    if (this.scriptNode) {
      try { this.scriptNode.disconnect(); } catch (e) {}
      this.scriptNode = null;
    }

    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch (e) {}
      this.audioCtx = null;
    }

    let blob: Blob | null = null;
    let recordedUri: string | null = null;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch (e) {}
    }

    if (this.audioChunks && this.audioChunks.length > 0) {
      blob = new Blob(this.audioChunks, { type: 'audio/wav' });
      this.audioChunks = [];
    } else if (this.pcmSamples && this.pcmSamples.length > 0) {
      blob = this.buildWavFromPcm(this.pcmSamples, 16000);
      this.pcmSamples = [];
    }

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
        recordedUri = this.recording.getURI();
        this.recording = null;

        if (recordedUri) {
          console.log(`SOURCE AUDIO URI: ${recordedUri}`);
          if (Platform.OS === 'web') {
            try {
              const res = await fetch(recordedUri);
              blob = await res.blob();
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('[VoiceRecordingService] stopAndUnloadAsync error:', err);
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
