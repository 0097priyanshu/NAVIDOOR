import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { useNavidoorStore } from '../../../store/useNavidoorStore';

export const HistoryPanel = () => {
  const { speak } = useNavidoorStore();

  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.historyItem}
        onPress={() => speak('Prescription scan: Lisinopril 10mg')}
      >
        <Bookmark size={18} color="#0284C7" />
        <View style={styles.historyTextGroup}>
          <Text style={styles.historyTitle}>Lisinopril 10mg Prescription</Text>
          <Text style={styles.historyTime}>Today • Medicine Mode</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.historyItem}
        onPress={() => speak('Bus 42 schedule: Arrives 5th Avenue stop')}
      >
        <Bookmark size={18} color="#0284C7" />
        <View style={styles.historyTextGroup}>
          <Text style={styles.historyTitle}>Bus 42 Schedule</Text>
          <Text style={styles.historyTime}>Yesterday • Transport Mode</Text>
        </View>
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
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    padding: 14,
    borderRadius: 16,
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  historyTextGroup: {
    flex: 1,
  },
  historyTitle: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
  historyTime: {
    color: '#334155',
    fontSize: 12,
    marginTop: 2,
  },
});
