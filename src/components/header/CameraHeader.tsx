import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { AlertCircle, User } from 'lucide-react-native';
import { UserProfileModal } from '../profile/UserProfileModal';

export const CameraHeader: React.FC = () => {
  const { triggerSosAlert, userName } = useNavidoorStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <View style={styles.headerContainer} accessibilityRole="header">
      <View style={styles.headerRow}>
        {/* Top-Left: Sleek Circular Emergency SOS FAB */}
        <TouchableOpacity 
          style={styles.sosCircleFab}
          onPress={triggerSosAlert}
          accessibilityLabel="Emergency SOS button"
          accessibilityHint="Tap to broadcast emergency location"
        >
          <AlertCircle size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Top-Right: Sleek Circular User Profile FAB */}
        <TouchableOpacity 
          style={styles.profileCircleFab}
          onPress={() => setIsProfileModalOpen(true)}
          accessibilityLabel={`User Profile for ${userName}`}
          accessibilityHint="Tap to view medical ID and user profile details"
        >
          <User size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* User Profile Modal */}
      <UserProfileModal 
        visible={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    zIndex: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sosCircleFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  profileCircleFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
});
