import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { COLORS, getThemeColors, getFontSizes, ACCESSIBILITY } from '../../theme/designSystem';
import { Palette, MousePointer, ShieldCheck, X, Sparkles, AlertTriangle, Compass } from 'lucide-react-native';

export const DesignSystemModal: React.FC = () => {
  const { isDesignSystemOpen, setDesignSystemOpen, themeMode, fontScale } = useNavidoorStore();
  const colors = getThemeColors(themeMode);
  const fonts = getFontSizes(fontScale);

  if (!isDesignSystemOpen) return null;

  return (
    <Modal visible={isDesignSystemOpen} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: '#090D16', borderColor: colors.accent }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Palette size={24} color="#38BDF8" />
              <Text style={styles.headerTitle}>NAVIDOOR DESIGN SYSTEM SPECS</Text>
            </View>
            <TouchableOpacity onPress={() => setDesignSystemOpen(false)} style={styles.closeBtn}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* 1. COLOR PALETTE */}
            <Text style={styles.sectionHeading}>1. ACCESSIBLE COLOR SYSTEM</Text>
            <View style={styles.colorGrid}>
              <View style={[styles.colorSwatch, { backgroundColor: COLORS.primaryBlue }]}>
                <Text style={styles.swatchLabel}>Primary Blue</Text>
                <Text style={styles.swatchHex}>{COLORS.primaryBlue}</Text>
              </View>
              <View style={[styles.colorSwatch, { backgroundColor: COLORS.softGreen }]}>
                <Text style={styles.swatchLabel}>Soft Green</Text>
                <Text style={styles.swatchHex}>{COLORS.softGreen}</Text>
              </View>
              <View style={[styles.colorSwatch, { backgroundColor: COLORS.safetyCoral }]}>
                <Text style={styles.swatchLabel}>Safety Coral</Text>
                <Text style={styles.swatchHex}>{COLORS.safetyCoral}</Text>
              </View>
              <View style={[styles.colorSwatch, { backgroundColor: COLORS.highContrastYellow }]}>
                <Text style={[styles.swatchLabel, { color: '#000' }]}>Contrast Amber</Text>
                <Text style={[styles.swatchHex, { color: '#000' }]}>{COLORS.highContrastYellow}</Text>
              </View>
            </View>

            {/* 2. TYPOGRAPHY SYSTEM */}
            <Text style={styles.sectionHeading}>2. TYPOGRAPHY HIERARCHY (SCALE: {fontScale.toUpperCase()})</Text>
            <View style={styles.typoBox}>
              <Text style={[styles.typoHero, { fontSize: fonts.hero }]}>Hero Title ({fonts.hero}px)</Text>
              <Text style={[styles.typoXxl, { fontSize: fonts.xxl }]}>Section Header ({fonts.xxl}px)</Text>
              <Text style={[styles.typoLg, { fontSize: fonts.lg }]}>Card Heading ({fonts.lg}px)</Text>
              <Text style={[styles.typoBase, { fontSize: fonts.base }]}>Body Text Minimum ({fonts.base}px)</Text>
            </View>

            {/* 3. TOUCH TARGET & SPACING SPECS */}
            <Text style={styles.sectionHeading}>3. ACCESSIBILITY COMPLIANCE</Text>
            <View style={styles.specBox}>
              <View style={styles.specItem}>
                <MousePointer size={18} color="#10B981" />
                <Text style={styles.specText}>Min Touch Target: {ACCESSIBILITY.minTouchTargetSize}px (WCAG AAA Exceeded)</Text>
              </View>
              <View style={styles.specItem}>
                <Sparkles size={18} color="#38BDF8" />
                <Text style={styles.specText}>Voice Agent FAB: {ACCESSIBILITY.fabMicSize}px Tactile Mic Target</Text>
              </View>
              <View style={styles.specItem}>
                <ShieldCheck size={18} color="#F59E0B" />
                <Text style={styles.specText}>Camera Continuity: 100% Live Feed Canvas Across All Tabs</Text>
              </View>
            </View>

            {/* 4. COMPONENT VARIANTS PREVIEW */}
            <Text style={styles.sectionHeading}>4. COMPONENT VARIANTS</Text>
            <View style={styles.componentsPreview}>
              {/* Primary Button */}
              <TouchableOpacity style={styles.demoBtnPrimary}>
                <Sparkles size={18} color="#FFF" />
                <Text style={styles.demoBtnText}>Primary Button (52px Target)</Text>
              </TouchableOpacity>

              {/* Hazard Chip */}
              <View style={styles.demoHazardChip}>
                <AlertTriangle size={16} color="#FFF" />
                <Text style={styles.demoChipText}>Hazard Warning Chip</Text>
              </View>

              {/* Status Badge */}
              <View style={styles.demoStatusChip}>
                <Compass size={16} color="#38BDF8" />
                <Text style={styles.demoStatusText}>GPS Status Indicator</Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeBigBtn} onPress={() => setDesignSystemOpen(false)}>
            <Text style={styles.closeBigBtnText}>CLOSE DESIGN SYSTEM</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 2,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    marginBottom: 14,
  },
  sectionHeading: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatch: {
    width: '48%',
    padding: 10,
    borderRadius: 12,
  },
  swatchLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  swatchHex: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  typoBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 12,
    borderRadius: 14,
    gap: 6,
  },
  typoHero: {
    color: '#F8FAFC',
    fontWeight: '900',
  },
  typoXxl: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  typoLg: {
    color: '#E2E8F0',
    fontWeight: '700',
  },
  typoBase: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  specBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 12,
    borderRadius: 14,
    gap: 8,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  componentsPreview: {
    gap: 8,
  },
  demoBtnPrimary: {
    backgroundColor: '#0A59A7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  demoHazardChip: {
    backgroundColor: '#E11D48',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  demoChipText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  demoStatusChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  demoStatusText: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 12,
  },
  closeBigBtn: {
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: ACCESSIBILITY.borderRadiusButton,
    alignItems: 'center',
  },
  closeBigBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 14,
  },
});
