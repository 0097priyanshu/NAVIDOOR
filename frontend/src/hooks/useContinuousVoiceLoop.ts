import { useEffect, useRef } from 'react';
import { setSpeechCompletionHandler } from '../utils/speechUtils';
import { useNavidoorStore } from '../store/useNavidoorStore';

export type ContinuousVoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';

/**
 * Keeps the existing voice pipeline hands-free. RecordingService owns the
 * metered VAD and invokes the store callback after its silence window.
 */
export function useContinuousVoiceLoop(enabled: boolean): ContinuousVoiceState {
  const stateRef = useRef<ContinuousVoiceState>('IDLE');
  const enabledRef = useRef(enabled);
  const startInFlightRef = useRef(false);

  enabledRef.current = enabled;

  useEffect(() => {
    let disposed = false;

    const startListening = async () => {
      if (disposed || !enabledRef.current || startInFlightRef.current) return;
      const store = useNavidoorStore.getState();
      if (store.voiceState !== 'idle') return;

      startInFlightRef.current = true;
      stateRef.current = 'LISTENING';
      try {
        await store.startVoiceListening();
      } catch (error) {
        console.error('[ContinuousVoiceLoop] Unable to start microphone:', error);
        stateRef.current = 'IDLE';
      } finally {
        startInFlightRef.current = false;
      }
    };

    setSpeechCompletionHandler((event) => {
      if (disposed || !enabledRef.current) return;

      const store = useNavidoorStore.getState();
      // stopVoice() changes the store state before stopping speech, so an
      // explicit stop/exit can never be mistaken for natural TTS completion.
      if (store.voiceState !== 'speaking') {
        stateRef.current = 'IDLE';
        return;
      }

      if (event === 'error') {
        console.warn('[ContinuousVoiceLoop] TTS ended with an error; restarting listening.');
      }
      store.stopVoice();
      stateRef.current = 'LISTENING';
      void startListening();
    });

    const unsubscribe = useNavidoorStore.subscribe((store) => {
      if (store.voiceState === 'listening') stateRef.current = 'LISTENING';
      else if (store.voiceState === 'thinking') stateRef.current = 'PROCESSING';
      else if (store.voiceState === 'speaking') stateRef.current = 'SPEAKING';
      else if (store.voiceState === 'idle' && !enabledRef.current) stateRef.current = 'IDLE';
    });

    void startListening();

    return () => {
      disposed = true;
      setSpeechCompletionHandler(null);
      unsubscribe();
      stateRef.current = 'IDLE';
      const store = useNavidoorStore.getState();
      const cleanup = store.voiceState === 'listening'
        ? store.stopVoiceListening()
        : Promise.resolve();
      store.stopVoice();
      void cleanup.catch((error) => {
        console.warn('[ContinuousVoiceLoop] Microphone cleanup failed:', error);
      });
    };
  }, []);

  useEffect(() => {
    if (enabled) {
      const store = useNavidoorStore.getState();
      if (store.voiceState === 'idle' && !startInFlightRef.current) {
        startInFlightRef.current = true;
        void store.startVoiceListening().finally(() => {
          startInFlightRef.current = false;
        });
      }
    } else {
      stateRef.current = 'IDLE';
      const store = useNavidoorStore.getState();
      const cleanup = store.voiceState === 'listening'
        ? store.stopVoiceListening()
        : Promise.resolve();
      store.stopVoice();
      void cleanup;
    }
  }, [enabled]);

  return stateRef.current;
}
