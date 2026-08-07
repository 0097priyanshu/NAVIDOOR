import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { AIVisionOverlay } from './AIVisionOverlay';
import { CameraControlsOverlay } from './CameraControlsOverlay';
import { Camera as CameraIcon, ShieldAlert } from 'lucide-react-native';

export const CameraViewCanvas: React.FC = () => {
  const { 
    activeMode, 
    cameraFacing, 
    torchOn, 
    isSimulatedCamera, 
    setSimulatedCamera, 
    speak 
  } = useNavidoorStore();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraRef = useRef<any>(null);

  // Hook for Native Camera permissions from expo-camera
  const [permission, requestPermission] = useCameraPermissions();

  const isVisionMode = ['assist', 'navigate', 'read', 'medicine', 'transport'].includes(activeMode);

  useEffect(() => {
    if (Platform.OS === 'web' && isVisionMode) {
      navigator.mediaDevices?.getUserMedia({
        video: { facingMode: cameraFacing === 'front' ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch(() => {});

      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }
      };
    }
  }, [isVisionMode, cameraFacing]);

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
        ref={cameraRef}
        style={styles.cameraView}
        facing={cameraFacing}
        enableTorch={torchOn}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Real Device Camera Stream active during Vision & Navigation modes */}
      {isVisionMode ? (
        Platform.OS === 'web' ? (
          // @ts-ignore
          <video
            ref={videoRef}
            style={styles.webVideo}
            playsInline
            muted
            autoPlay
          />
        ) : (
          renderNativeCamera()
        )
      ) : (
        /* Utility Modes (Settings, Profile, History, etc.) use a clean solid canvas */
        <View style={styles.solidUtilityCanvas} />
      )}

      {/* Floating Quick Action Controls Overlay */}
      <CameraControlsOverlay />

      {/* Vision Overlay (Scoped to active vision modes) */}
      <AIVisionOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  cameraView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  nativeCameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  grantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#276EF1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#276EF1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
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
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  simulationBanner: {
    position: 'absolute',
    bottom: 24,
    backgroundColor: 'rgba(39, 110, 241, 0.2)',
    borderWidth: 1,
    borderColor: '#276EF1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  simulationBannerText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  cameraRoomBackground: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    top: '50%',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
    borderWidth: 1,
    borderColor: 'rgba(5, 163, 87, 0.15)',
  },
  depthRingMedium: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(39, 110, 241, 0.2)',
  },
  depthRingCenter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(39, 110, 241, 0.4)',
  },
  solidUtilityCanvas: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
