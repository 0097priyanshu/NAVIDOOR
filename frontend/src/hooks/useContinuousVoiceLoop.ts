import { useEffect, useRef } from 'react';
import { addSpeechCompletionListener } from '../utils/speechUtils';
import { useNavidoorStore } from '../store/useNavidoorStore';
import { continuousVisionManager } from '../services/continuousVisionManager';

export type ContinuousVoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';

/** Hands-free listening/reply loop, enabled by default for the NAVIDOOR user screen. */
export function useContinuousVoiceLoop(enabled: boolean): ContinuousVoiceState {
  const stateRef = useRef<ContinuousVoiceState>('IDLE');
  const enabledRef = useRef(enabled);
  const startInFlightRef = useRef(false);

  enabledRef.current = enabled;

  useEffect(() => {
    let disposed = false;
    let restartTimer: ReturnType<typeof setTimeout> | null = null;
    let previousVoiceState = useNavidoorStore.getState().voiceState;

    const scheduleListening = (delayMs: number) => {
      if (restartTimer) clearTimeout(restartTimer);
      console.log(`[VOICE LOOP] Restart listening scheduled in ${delayMs}ms`);
      restartTimer = setTimeout(() => {
        restartTimer = null;
        void startListening();
      }, delayMs);
    };

    const startListening = async () => {
      if (disposed || !enabledRef.current || startInFlightRef.current) return;
      const store = useNavidoorStore.getState();
      if (store.voiceState !== 'idle' || store.isFirstTimeUser || store.userRole !== 'navidoor_user') return;

      startInFlightRef.current = true;
      console.log('[VOICE LOOP] Restarting listening');
      try {
        await store.startVoiceListening();
      } catch (error) {
        console.error('[VOICE LOOP] Microphone start failed:', error);
        useNavidoorStore.setState({ voiceState: 'idle' });
      } finally {
        startInFlightRef.current = false;
        if (enabledRef.current && useNavidoorStore.getState().voiceState === 'idle') {
          scheduleListening(1500);
        }
      }
    };

    const removeCompletionListener = addSpeechCompletionListener((event) => {
      console.log(`[VOICE LOOP] TTS completion: ${event}`);
      if (!enabledRef.current || disposed) return;
      // The vision queue may start a queued alert from its own completion
      // listener. Wait for that speech to finish before opening the mic.
      if (useNavidoorStore.getState().voiceState === 'speaking' && !continuousVisionManager.isSpeakingQueuedGuidance()) {
        useNavidoorStore.getState().setVoiceState('idle');
      }
      scheduleListening(400);
    });

    const unsubscribe = useNavidoorStore.subscribe((store) => {
      if (store.voiceState !== previousVoiceState) {
        console.log(`[VOICE LOOP] ${previousVoiceState} -> ${store.voiceState}`);
        previousVoiceState = store.voiceState;
      }
      if (store.voiceState === 'listening') stateRef.current = 'LISTENING';
      else if (store.voiceState === 'thinking') stateRef.current = 'PROCESSING';
      else if (store.voiceState === 'speaking') stateRef.current = 'SPEAKING';
      else {
        stateRef.current = 'IDLE';
        if (enabledRef.current) {
          continuousVisionManager.flushQueuedGuidance();
          scheduleListening(600);
        }
      }
    });

    if (enabledRef.current) scheduleListening(0);

    return () => {
      disposed = true;
      removeCompletionListener();
      unsubscribe();
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = null;
      stateRef.current = 'IDLE';
    };
  }, []);

  useEffect(() => {
    if (enabled) {
      if (useNavidoorStore.getState().voiceState === 'idle') {
        // The state subscription above restarts after this change.
        useNavidoorStore.setState({ voiceState: 'idle' });
      }
      return;
    }

    stateRef.current = 'IDLE';
    const store = useNavidoorStore.getState();
    if (store.voiceState === 'listening') {
      void import('../services/voiceRecordingService').then(({ voiceRecordingService }) => {
        void voiceRecordingService.stopRecording();
      });
    }
    store.stopVoice();
  }, [enabled]);

  return stateRef.current;
}
