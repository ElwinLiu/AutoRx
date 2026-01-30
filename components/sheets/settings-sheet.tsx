import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useAppTheme } from '@/hooks/use-app-theme';

type SettingsSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const sections = [
  [
    { label: 'Appearance', value: 'System', icon: 'moon-outline' },
    { label: 'Notifications', value: 'On', icon: 'notifications-outline' },
  ],
  [
    { label: 'Privacy & Security', icon: 'lock-closed-outline' },
    { label: 'Export Data', icon: 'cloud-download-outline' },
  ],
  [
    { label: 'About', icon: 'information-circle-outline' },
    { label: 'Clear Cache', icon: 'trash-outline', danger: true },
  ],
];

export function SettingsSheet({ visible, onClose }: SettingsSheetProps) {
  const { colors, spacing, radius, typography, shadows } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderColor: colors.borderPrimary,
        },
        title: {
          ...typography.subheading,
          color: colors.textPrimary,
        },
        closeButton: {
          width: 32,
          height: 32,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceSecondary,
        },
        section: {
          marginHorizontal: spacing.lg,
          marginVertical: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          overflow: 'hidden',
          ...shadows.sm,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderColor: colors.borderSecondary,
        },
        rowLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        label: {
          color: colors.textPrimary,
          ...typography.body,
        },
        value: {
          color: colors.textSecondary,
          ...typography.body,
        },
        danger: {
          color: colors.error,
        },
        version: {
          textAlign: 'center',
          color: colors.textTertiary,
          ...typography.footnote,
          marginBottom: spacing.xl,
        },
      }),
    [colors, radius, shadows, spacing, typography]
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight={640}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      {sections.map((items, sectionIndex) => (
        <View key={`section-${sectionIndex}`} style={styles.section}>
          {items.map((item, itemIndex) => {
            const isLast = itemIndex === items.length - 1;
            return (
              <Pressable
                key={item.label}
                style={[styles.row, isLast && { borderBottomWidth: 0 }]}
                onPress={() => {}}
              >
                <View style={styles.rowLeft}>
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={item.danger ? colors.error : colors.textSecondary}
                  />
                  <Text style={[styles.label, item.danger && styles.danger]}>{item.label}</Text>
                </View>
                {!!item.value && <Text style={styles.value}>{item.value}</Text>}
              </Pressable>
            );
          })}
        </View>
      ))}

      <Text style={styles.version}>Recipe Organizer v1.0.0</Text>
    </BottomSheet>
  );
}
