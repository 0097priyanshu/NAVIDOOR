import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, PanResponder } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { AIVisionOverlay } from './AIVisionOverlay';
import { CameraControlsOverlay } from './CameraControlsOverlay';
import { CapturedPhotoPreviewModal } from './CapturedPhotoPreviewModal';
import { Camera as CameraIcon, ShieldAlert, VideoOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { continuousVisionManager } from '../../services/continuousVisionManager';

export const CameraViewCanvas: React.FC = () => {
  const { 
    activeMode, 
    cameraFacing, 
    torchOn, 
    isSimulatedCamera, 
    setSimulatedCamera, 
    setCameraRef,
    isDetectionActive,
    userRole,
    isFirstTimeUser,
    isProfileModalOpen,
    isSosModalOpen,
    isFamilyCompanionOpen,
    isDesignSystemOpen,
    isCapturedPhotoModalOpen,
    speak 
  } = useNavidoorStore();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraRef = useRef<any>(null);
  const [webCameraError, setWebCameraError] = useState<string | null>(null);

  // Hook for Native Camera permissions from expo-camera
  const [permission, requestPermission] = useCameraPermissions();

  const isVisionMode = ['assist', 'navigate', 'read', 'medicine', 'transport'].includes(activeMode);

  // Camera & YOLO perception should NOT run during profile setup, modals, role selection, or non-vision modes
  const isProfileOrModalActive = 
    isFirstTimeUser || 
    isProfileModalOpen || 
    isSosModalOpen || 
    isFamilyCompanionOpen || 
    isDesignSystemOpen || 
    Boolean(isCapturedPhotoModalOpen) ||
    userRole !== 'navidoor_user';

  const isCameraNeeded = isVisionMode && !isProfileOrModalActive;
  const isYoloNeeded = isCameraNeeded && isDetectionActive;

  // Web Camera Stream setup - only open hardware stream when camera is actively needed
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (Platform.OS === 'web' && isCameraNeeded) {
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
            continuousVisionManager.setVideoRef(videoRef.current);
          }
        } catch (err: any) {
          console.error('[CameraViewCanvas] Web camera stream error:', err);
          setWebCameraError(err.message || 'Camera permission denied or unavailable in this browser.');
        }
      };

      startWebCamera();
    } else {
      // Cleanly release web camera tracks when camera is not needed
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      continuousVisionManager.setVideoRef(null);
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      continuousVisionManager.setVideoRef(null);
    };
  }, [isCameraNeeded, cameraFacing]);

  // Clean up native cameraRef when camera is not needed
  useEffect(() => {
    if (!isCameraNeeded && cameraRef.current) {
      cameraRef.current = null;
      setCameraRef(null);
      continuousVisionManager.setCameraRef(null);
    }
  }, [isCameraNeeded]);

  // Continuous Detection Lifecycle: Start/Stop automatic detection based on mode, toggle, & modal/setup state
  useEffect(() => {
    if (isYoloNeeded) {
      continuousVisionManager.start({ targetIntervalMs: 280, minIntervalMs: 220 });
    } else {
      continuousVisionManager.stop();
    }

    return () => {
      continuousVisionManager.stop();
    };
  }, [isYoloNeeded]);

  // Register on-demand single scan trigger on Navidoor store
  useEffect(() => {
    useNavidoorStore.getState().setSingleScanHandler(() => {
      continuousVisionManager.forceScan();
    });
    return () => {
      useNavidoorStore.getState().setSingleScanHandler(null);
    };
  }, []);

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

    // Permission granted: Render live Expo CameraView at full native quality with shutter animation disabled
    return (
      <CameraView
        ref={(ref) => {
          if (ref && cameraRef.current !== ref) {
            cameraRef.current = ref;
            setCameraRef(ref);
            continuousVisionManager.setCameraRef(ref);
          }
        }}
        style={styles.cameraView}
        facing={cameraFacing}
        enableTorch={torchOn}
        animateShutter={false}
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
      {/* Real Device Camera Stream active ONLY when camera is needed */}
      {isCameraNeeded ? (
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
        /* Standby slate canvas during profile setup, modal dialogs, or utility panels */
        <View style={styles.solidUtilityCanvas} />
      )}

      {/* Floating Quick Action Controls Overlay - only when camera is needed */}
      {isCameraNeeded && <CameraControlsOverlay />}

      {/* Vision Overlay (Scoped to active vision modes when camera is needed) */}
      {isCameraNeeded && <AIVisionOverlay />}

      {/* Captured Photo Scan Preview Modal */}
      <CapturedPhotoPreviewModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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

