import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { BACKEND_URL } from '../../services/voiceAssistantBackend';
import { socketClient } from '../../services/socketClient';
import { Heart, User, Phone, Mail, Lock, ChevronDown, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const FamilyAuthScreen: React.FC = () => {
  const { setFamilyUser, setFamilyConnectionStatus, setFamilyConnectedUserPhone, speak, setUserRole } = useNavidoorStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [relationship, setRelationship] = useState('Parent');

  const relations = ['Parent', 'Sibling', 'Spouse', 'Child', 'Caregiver', 'Other'];

  const triggerHapticFeedback = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
  };

  const handleToggleMode = () => {
    triggerHapticFeedback();
    setIsLogin(!isLogin);
  };

  const handleSubmit = async () => {
    triggerHapticFeedback();
    if (!phone || !password || (!isLogin && !name)) {
      Alert.alert('Required Fields', 'Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);

    const endpoint = isLogin ? `${BACKEND_URL}/api/family/login` : `${BACKEND_URL}/api/family/register`;
    const payload = isLogin 
      ? { phone, password } 
      : { name, phone, password, relationship, email };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isLogin) {
        // Success Login
        const user = data.member;
        setFamilyUser(user);
        
        // Connect socket
        socketClient.connect();
        socketClient.registerPhone(user.phone, 'family_member');

        // Fetch connection status
        const statusRes = await fetch(`${BACKEND_URL}/api/family/connection-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ familyPhone: user.phone })
        });
        const statusData = await statusRes.json();
        
        if (statusData.success) {
          if (statusData.connectedUsers && statusData.connectedUsers.length > 0) {
            setFamilyConnectedUserPhone(statusData.connectedUsers[0]);
            setFamilyConnectionStatus('connected');
          } else if (statusData.requests && statusData.requests.length > 0) {
            setFamilyConnectionStatus('pending');
          } else {
            setFamilyConnectionStatus('idle');
          }
        }
        
        speak(`Logged in as family companion ${user.name}.`);
      } else {
        // Success Register -> auto toggle to login or direct login
        Alert.alert('Account Created', 'Your family caregiver account is ready! Please log in.', [
          { text: 'OK', onPress: () => setIsLogin(true) }
        ]);
        speak(`Account created for ${name}. Please login.`);
      }
    } catch (err: any) {
      console.error('[Auth Error]:', err);
      Alert.alert('Error', err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Heart size={30} color="#FFFFFF" fill="#FFFFFF" />
        </View>
        <Text style={styles.title}>NAVIDOOR FAMILY</Text>
        <Text style={styles.subtitle}>Caregiver Companion Portal</Text>
      </View>

      {/* Main Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>{isLogin ? 'Login to Portal' : 'Create Caregiver Account'}</Text>
        
        {/* Registration Specific Fields */}
        {!isLogin && (
          <>
            <Text style={styles.label}>FULL NAME</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color="#0284C7" />
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="Sarah Jenkins"
                placeholderTextColor="#64748B"
              />
            </View>

            <Text style={styles.label}>RELATIONSHIP TO NAVIDOOR USER</Text>
            <TouchableOpacity 
              style={[styles.inputWrapper, styles.dropdownBtn]} 
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Heart size={18} color="#0284C7" />
              <Text style={styles.dropdownBtnText}>{relationship}</Text>
              <ChevronDown size={18} color="#0284C7" />
            </TouchableOpacity>

            {showDropdown && (
              <View style={styles.dropdown}>
                {relations.map((r) => (
                  <TouchableOpacity 
                    key={r} 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setRelationship(r);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, relationship === r && styles.dropdownItemActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Common Fields */}
        <Text style={styles.label}>MOBILE NUMBER</Text>
        <View style={styles.inputWrapper}>
          <Phone size={18} color="#0284C7" />
          <TextInput 
            style={styles.input} 
            value={phone} 
            onChangeText={setPhone} 
            placeholder="+1 (555) 234-5678"
            placeholderTextColor="#64748B"
            keyboardType="phone-pad"
          />
        </View>

        {!isLogin && (
          <>
            <Text style={styles.label}>EMAIL ADDRESS (OPTIONAL)</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#0284C7" />
              <TextInput 
                style={styles.input} 
                value={email} 
                onChangeText={setEmail} 
                placeholder="sarah@example.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </>
        )}

        <Text style={styles.label}>PASSWORD</Text>
        <View style={styles.inputWrapper}>
          <Lock size={18} color="#0284C7" />
          <TextInput 
            style={styles.input} 
            value={password} 
            onChangeText={setPassword} 
            placeholder="••••••••"
            placeholderTextColor="#64748B"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {isLogin && (
          <TouchableOpacity style={styles.forgotBtn} onPress={() => Alert.alert('Reset Password', 'Password recovery instructions have been sent to your registered channel.')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>{isLogin ? 'LOG IN' : 'REGISTER'}</Text>
          )}
        </TouchableOpacity>

        {/* Toggle Mode */}
        <TouchableOpacity style={styles.toggleModeBtn} onPress={handleToggleMode}>
          <Text style={styles.toggleModeText}>
            {isLogin ? "Don't have an account? Create one" : 'Already have an account? Log in'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Back to Role Selection */}
      <TouchableOpacity 
        style={styles.backRoleBtn} 
        onPress={() => {
          triggerHapticFeedback();
          setUserRole('undecided');
        }}
      >
        <Text style={styles.backRoleText}>← Change App Role</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#64748B',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#475569',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  dropdownBtn: {
    justifyContent: 'space-between',
  },
  dropdownBtnText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  dropdown: {
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 16,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  dropdownItemText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownItemActive: {
    color: '#0284C7',
    fontWeight: '900',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
  toggleModeBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  toggleModeText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  backRoleBtn: {
    marginTop: 28,
    padding: 12,
  },
  backRoleText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '800',
  },
});
