import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, PanResponder } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { AIVisionOverlay } from './AIVisionOverlay';
import { CameraControlsOverlay } from './CameraControlsOverlay';
import { CapturedPhotoPreviewModal } from './CapturedPhotoPreviewModal';
import { Camera as CameraIcon, ShieldAlert, VideoOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { playObstacleBeep } from '../../utils/speechUtils';
import { getBackendUrl } from '../../services/voiceAssistantBackend';

export const CameraViewCanvas: React.FC = () => {
  const { 
    activeMode, 
    cameraFacing, 
    torchOn, 
    isSimulatedCamera, 
    setSimulatedCamera, 
    setCameraRef,
    isDetectionActive,
    speak 
  } = useNavidoorStore();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraRef = useRef<any>(null);
  const [webCameraError, setWebCameraError] = useState<string | null>(null);

  // Hook for Native Camera permissions from expo-camera
  const [permission, requestPermission] = useCameraPermissions();

  const isVisionMode = ['assist', 'navigate', 'read', 'medicine', 'transport'].includes(activeMode);

  // Web Camera Stream setup
  useEffect(() => {
    if (Platform.OS === 'web' && isVisionMode) {
      let activeStream: MediaStream | null = null;
      setWebCameraError(null);

      const startWebCamera = async () => {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setWebCameraError('Camera API not accessible in this context (requires HTTPS or localhost).');
            return;
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: cameraFacing === 'front' ? 'user' : 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });

          activeStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.muted = true;
            videoRef.current.playsInline = true;
            try {
              await videoRef.current.play();
            } catch (pErr) {
              console.warn('[CameraViewCanvas] Web autoplay prevented:', pErr);
            }
          }
        } catch (err: any) {
          console.error('[CameraViewCanvas] Web camera stream error:', err);
          setWebCameraError(err.message || 'Camera permission denied or unavailable in this browser.');
        }
      };

      startWebCamera();

      return () => {
        if (activeStream) {
          activeStream.getTracks().forEach((track) => track.stop());
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };
    }
  }, [isVisionMode, cameraFacing]);

  // Continuous Silent Live YOLO Camera Frame Scanning Loop (Web Canvas Stream Only)
  const isScanningRef = useRef(false);
  const lastSpokenGuidanceRef = useRef('');

  const performSingleScan = async () => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    try {
      let base64Image: string | null = null;

      if (Platform.OS === 'web') {
        if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 320, 240);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.3);
            if (dataUrl && dataUrl.includes(',')) {
              base64Image = dataUrl.split(',')[1];
            }
          }
        }
      } else {
        // Mobile Native Expo Camera: Frame Snapshot with Robust Fallback
        const cam = cameraRef.current || useNavidoorStore.getState().cameraRef;
        if (cam && typeof cam.takePictureAsync === 'function') {
          try {
            const photo = await cam.takePictureAsync({
              base64: true,
              quality: 0.4,
            });
            if (photo && photo.base64) {
              base64Image = photo.base64;
            }
          } catch (camErr) {
            console.warn('[CameraViewCanvas] Primary mobile snapshot error, trying fallback:', camErr);
            try {
              const photo = await cam.takePictureAsync({ base64: true });
              if (photo && photo.base64) base64Image = photo.base64;
            } catch (fallbackErr) {
              console.error('[CameraViewCanvas] Mobile camera snapshot fallback error:', fallbackErr);
            }
          }
        } else {
          console.warn('[CameraViewCanvas] Camera reference not ready on mobile.');
        }
      }

      if (base64Image) {
        const lang = useNavidoorStore.getState().activeLanguageCode || 'en';
        const mode = useNavidoorStore.getState().activeMode;
        const host = getBackendUrl();
        const yoloDirectHost = host.includes(':5001') ? host.replace(':5001', ':5003') : `${host.split(':')[0]}:${host.split(':')[1]}:5003`;
        
        let endpoint = `${yoloDirectHost}/detect`;
        if (mode === 'transport') endpoint = `${yoloDirectHost}/detect/bus`;
        if (mode === 'medicine') endpoint = `${yoloDirectHost}/detect/medicine`;

        let response: Response | null = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image, language: lang }),
        }).catch(() => null);

        if (!response || !response.ok) {
          let expressEndpoint = `${host}/api/yolo/detect`;
          if (mode === 'transport') expressEndpoint = `${host}/api/yolo/bus`;
          if (mode === 'medicine') expressEndpoint = `${host}/api/yolo/medicine`;
          response = await fetch(expressEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, language: lang }),
          }).catch(() => null);
        }

        if (response && response.ok) {
          const data = await response.json();
          if (data && data.success && Array.isArray(data.detections)) {
            const mappedObjects = data.detections.map((d: any, i: number) => ({
              id: `yolo-${Date.now()}-${i}`,
              classId: d.class_id,
              label: d.class || 'object',
              emojiIcon: getEmojiForClass(d.class),
              category: getCategoryForClass(d.class),
              confidence: d.confidence || 0.8,
              distanceMeters: d.distance_meters || 2.0,
              direction: ((d.zone || 'CENTER').toLowerCase()) as any,
              xRatio: d.normalized_bbox ? d.normalized_bbox[0] : 0.1,
              yRatio: d.normalized_bbox ? d.normalized_bbox[1] : 0.1,
              x2Ratio: d.normalized_bbox ? d.normalized_bbox[2] : 0.4,
              y2Ratio: d.normalized_bbox ? d.normalized_bbox[3] : 0.4,
              isHazard: d.risk_level === 'DANGER' || d.risk_level === 'WARNING',
            }));

            if (__DEV__) {
              console.log(`[CAMERA DIAG] Frame analysis returned ${mappedObjects.length} detections.`);
              mappedObjects.forEach((o: any, idx: number) => {
                console.log(`[CAMERA DIAG] Det ${idx+1}: class_id=${o.classId}, label='${o.label}', conf=${o.confidence}, bbox=[${o.xRatio}, ${o.yRatio}, ${o.x2Ratio}, ${o.y2Ratio}]`);
              });
            }

            useNavidoorStore.setState({ detectedObjects: mappedObjects });

            if (data.voice_guidance) {
              lastSpokenGuidanceRef.current = data.voice_guidance;
              useNavidoorStore.getState().speak(data.voice_guidance, true);

              if (mappedObjects.some((o: any) => o.distanceMeters < 2.0)) {
                try { playObstacleBeep(880, 150); } catch (e) {}
              }
            } else if (mappedObjects.length === 0) {
              const lang = (useNavidoorStore.getState().activeLanguageCode || 'en').toLowerCase();
              const clearPathMap: Record<string, string> = {
                en: 'Clear walking path directly ahead.',
                hi: 'सामने रास्ता बिल्कुल साफ है।',
                mr: 'समोर चालण्यासाठी वाट मोकळी आहे.',
                gu: 'સામે રસ્તો એકદમ સાફ છે.',
                pa: 'ਸਾਹਮਣੇ ਰਸਤਾ ਬਿਲਕੁਲ ਸਾਫ਼ ਹੈ।',
                bn: 'সামনে হাঁটার পথ একদম পরিষ্কার।',
                ta: 'முன்னால் பாதை தெளிவாக உள்ளது.',
                te: 'ముందు దారి నిష్కారణంగా ఉంది.',
                kn: 'ಮುಂದೆ ಹಾದಿ ಸ್ಪಷ್ಟವಾಗಿದೆ.',
                ml: 'മുന്നിൽ വഴി വ്യക്തമാണ്.',
              };
              const clearMsg = clearPathMap[lang] || clearPathMap.en;
              useNavidoorStore.getState().speak(clearMsg, true);
            }
          }
        }
      } else {
        const lang = (useNavidoorStore.getState().activeLanguageCode || 'en').toLowerCase();
        const initMsgMap: Record<string, string> = {
          en: 'Camera initializing. Tap SCAN again in a moment.',
          hi: 'कैमरा शुरू हो रहा है, कृपया एक पल में पुन: प्रयास करें।',
          mr: 'कॅमेरा सुरू होत आहे, कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.',
          gu: 'કેમેરા શરૂ થઈ રહ્યો છે, કૃપા કરીને થોડી વારમાં ફરી પ્રયાસ કરો.',
          pa: 'ਕੈਮਰਾ ਸ਼ੁਰੂ ਹੋ ਰਿਹਾ ਹੈ, ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਪਲ ਵਿੱਚ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
          bn: 'ক্যামেরা চালু হচ্ছে, অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
          ta: 'கேமரா தொடங்கும் வரை காத்திருந்து மீண்டும் தட்டவும்.',
          te: 'కెమెరా ప్రారంభమవుతోంది, దయచేసి ఒక క్షణంలో మళ్ళీ ప్రయత్నించండి.',
          kn: 'ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ, ದಯವಿಟ್ಟು ಕ್ಷಣಾರ್ಧದಲ್ಲಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
          ml: 'ക്യാമറ ആരംഭിക്കുന്നു, ദയവായി അല്പസമയത്തിനകം വീണ്ടും ശ്രമിക്കുക.',
        };
        const initMsg = initMsgMap[lang] || initMsgMap.en;
        useNavidoorStore.getState().speak(initMsg, true);
      }
    } catch (err) {
      console.warn('[CameraViewCanvas] Scan error:', err);
    } finally {
      isScanningRef.current = false;
    }
  };

  // Register singleScanHandler on Navidoor store
  useEffect(() => {
    useNavidoorStore.getState().setSingleScanHandler(performSingleScan);
    return () => {
      useNavidoorStore.getState().setSingleScanHandler(null);
    };
  }, []);

  useEffect(() => {
    if (!isVisionMode || !isDetectionActive) return;

    // Web: Background canvas scanning loop (100% silent, no shutter sound)
    if (Platform.OS === 'web') {
      const intervalId = setInterval(() => {
        performSingleScan();
      }, 2500);

      return () => clearInterval(intervalId);
    }
  }, [isVisionMode, isDetectionActive]);

  const getEmojiForClass = (cls: string = ''): string => {
    const c = cls.toLowerCase();
    if (c.includes('person')) return '🚶';
    if (c.includes('car') || c.includes('bus') || c.includes('truck')) return '🚌';
    if (c.includes('chair') || c.includes('couch') || c.includes('sofa')) return '🪑';
    if (c.includes('bottle') || c.includes('medicine') || c.includes('cup')) return '💊';
    if (c.includes('dog') || c.includes('cat')) return '🐕';
    if (c.includes('door')) return '🚪';
    if (c.includes('tv') || c.includes('laptop') || c.includes('cell')) return '📱';
    return '📦';
  };

  const getCategoryForClass = (cls: string = ''): 'obstacle' | 'person' | 'door' | 'text' | 'sign' | 'furniture' | 'hazard' => {
    const c = cls.toLowerCase();
    if (c.includes('person')) return 'person';
    if (c.includes('door')) return 'door';
    if (c.includes('chair') || c.includes('couch') || c.includes('table')) return 'furniture';
    if (c.includes('car') || c.includes('bus') || c.includes('truck')) return 'hazard';
    return 'obstacle';
  };

  const renderNativeCamera = () => {
    if (isSimulatedCamera) {
      return (
        <View style={styles.nativeCameraContainer}>
          <View style={styles.cameraRoomBackground}>
            <View style={styles.gridLineHorizontal} />
            <View style={styles.gridLineVertical} />

            <View style={styles.simulatedRoomCenter}>
              <View style={styles.depthRingLarge} />
              <View style={styles.depthRingMedium} />
              <View style={styles.depthRingCenter} />
            </View>

            <TouchableOpacity 
              style={styles.simulationBanner}
              onPress={() => {
                setSimulatedCamera(false);
                speak('Switching to live camera view.');
              }}
              accessibilityLabel="Simulated camera mode banner. Tap to switch to live camera."
              accessibilityRole="button"
            >
              <Text style={styles.simulationBannerText}>⚡ Simulated Mode active. Tap for Live Camera.</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!permission) {
      return (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Initializing camera permissions...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionContainer}>
          <ShieldAlert size={48} color="#E11D48" style={{ marginBottom: 16 }} />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            NAVIDOOR requires live camera access to detect obstacles, read text, scan medicines, and provide real-time spatial navigation.
          </Text>
          <TouchableOpacity 
            style={styles.grantButton}
            onPress={async () => {
              const res = await requestPermission();
              if (res.granted) {
                speak('Camera permission granted. Live AI vision active.');
              }
            }}
            accessibilityLabel="Grant Camera Access Button"
            accessibilityRole="button"
          >
            <CameraIcon size={20} color="#FFFFFF" />
            <Text style={styles.grantButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.simulatedFallbackBtn}
            onPress={() => {
              setSimulatedCamera(true);
              speak('Simulated camera mode activated.');
            }}
            accessibilityLabel="Use Simulated Camera mode"
            accessibilityRole="button"
          >
            <Text style={styles.simulatedFallbackText}>Use Simulated Camera Instead</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Permission granted: Render live Expo CameraView
    return (
      <CameraView
        ref={(ref) => {
          if (ref && cameraRef.current !== ref) {
            cameraRef.current = ref;
            setCameraRef(ref);
          }
        }}
        style={styles.cameraView}
        facing={cameraFacing}
        enableTorch={torchOn}
      />
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -25) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (e) {}
          useNavidoorStore.getState().cycleNextMode();
        } else if (gestureState.dx > 25) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (e) {}
          useNavidoorStore.getState().cyclePrevMode();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Real Device Camera Stream active during Vision & Navigation modes */}
      {isVisionMode ? (
        Platform.OS === 'web' ? (
          webCameraError ? (
            <View style={styles.permissionContainer}>
              <VideoOff size={48} color="#F59E0B" style={{ marginBottom: 16 }} />
              <Text style={styles.permissionTitle}>Web Camera Notice</Text>
              <Text style={styles.permissionText}>
                {webCameraError}
              </Text>
              <TouchableOpacity 
                style={styles.grantButton}
                onPress={() => {
                  setSimulatedCamera(true);
                  speak('Switched to simulated camera feed for Web testing.');
                }}
                accessibilityLabel="Use Simulated Camera for Web testing"
                accessibilityRole="button"
              >
                <CameraIcon size={20} color="#FFFFFF" />
                <Text style={styles.grantButtonText}>Use Simulated Camera Stream</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // @ts-ignore
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0,
                backgroundColor: '#0F172A',
              }}
            />
          )
        ) : (
          renderNativeCamera()
        )
      ) : (
        /* Utility Modes (Settings, Profile, History, etc.) use a clean solid light gray canvas */
        <View style={styles.solidUtilityCanvas} />
      )}

      {/* Floating Quick Action Controls Overlay */}
      <CameraControlsOverlay />

      {/* Vision Overlay (Scoped to active vision modes) */}
      <AIVisionOverlay />

      {/* Captured Photo Scan Preview Modal */}
      <CapturedPhotoPreviewModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#CBD5E1',
  },
  cameraView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  nativeCameraContainer: {
    flex: 1,
    backgroundColor: '#CBD5E1',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  permissionTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  grantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 16,
  },
  grantButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  simulatedFallbackBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  simulatedFallbackText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  simulationBanner: {
    position: 'absolute',
    bottom: 24,
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  simulationBannerText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '800',
  },
  cameraRoomBackground: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#CBD5E1',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    top: '50%',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    left: '50%',
  },
  simulatedRoomCenter: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  depthRingLarge: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1.5,
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  depthRingMedium: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: 'rgba(2, 132, 199, 0.35)',
  },
  depthRingCenter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#0284C7',
  },
  solidUtilityCanvas: {
    flex: 1,
    backgroundColor: '#CBD5E1',
  },
});

