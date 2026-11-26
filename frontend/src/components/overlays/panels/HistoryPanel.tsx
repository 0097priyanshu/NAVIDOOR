import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bookmark, RefreshCw } from 'lucide-react-native';
import { useNavidoorStore } from '../../../store/useNavidoorStore';

const CATEGORY_LABELS: Record<string, string> = {
  medicine_label: 'Medicine Mode',
  bus_board: 'Transit Mode',
  hospital_department: 'Hospital Sign',
  door_label: 'Door Label',
  signboard: 'Signboard',
  document: 'Document',
  notice: 'Notice',
  menu: 'Menu',
  product_label: 'Product Label',
};

function formatScanTime(isoDate?: string): string {
  if (!isoDate) return 'Saved Scan';
  try {
    const date = new Date(isoDate);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Saved Scan';
  }
}

export const HistoryPanel = () => {
  const { ocrHistory, speak, refreshOcrHistory, isSyncingData } = useNavidoorStore();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>RECENT OCR & VOICE HISTORY ({ocrHistory.length})</Text>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => refreshOcrHistory()}
          accessibilityLabel="Sync reading history from server"
        >
          <RefreshCw size={15} color="#0284C7" />
          <Text style={styles.refreshText}>{isSyncingData ? 'SYNCING' : 'SYNC'}</Text>
        </TouchableOpacity>
      </View>

      {ocrHistory && ocrHistory.length > 0 ? (
        ocrHistory.map((item) => {
          const catLabel = CATEGORY_LABELS[item.category] || item.category || 'Read Mode';
          const title = item.spokenSummary || item.rawText || 'Scanned Text';
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.historyItem}
              onPress={() => speak(title, true)}
              accessibilityLabel={`Replay scan: ${title}`}
            >
              <Bookmark size={18} color="#0284C7" />
              <View style={styles.historyTextGroup}>
                <Text style={styles.historyTitle} numberOfLines={2}>
                  {title}
                </Text>
                <Text style={styles.historyTime}>
                  {formatScanTime(item.createdAt)} • {catLabel}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyBox}>
          <Bookmark size={24} color="#64748B" />
          <Text style={styles.emptyTitle}>No saved scans yet</Text>
          <Text style={styles.emptySubtitle}>
            Switch to READ mode and scan any signboard, medicine label, or document to save it here.
          </Text>
        </View>
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  refreshText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '800',
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
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#334155',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
