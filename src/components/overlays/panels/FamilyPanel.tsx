import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavidoorStore } from '../../../store/useNavidoorStore';

export const FamilyPanel = () => {
  const { setFamilyCompanionOpen } = useNavidoorStore();

  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.familyBtn}
        onPress={() => setFamilyCompanionOpen(true)}
      >
        <Text style={styles.familyBtnText}>CONNECT FAMILY ASSIST</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#475569',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  familyBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 10,
  },
  familyBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
