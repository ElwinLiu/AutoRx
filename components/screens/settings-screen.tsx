import React, { useMemo, useState, useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import { clearCache } from '@/lib/cache';

const SECTIONS = [
  [
    { label: 'Appearance', value: 'System', icon: 'moon-outline' },
    { label: 'Notifications', value: 'On', icon: 'notifications-outline' },
  ],
  [
    { label: 'AI Configuration', icon: 'sparkles-outline', route: '/settings/ai' },
    { label: 'Privacy & Security', icon: 'lock-closed-outline' },
    { label: 'Export Data', icon: 'cloud-download-outline' },
  ],
  [
    { label: 'About', icon: 'information-circle-outline' },
    { label: 'Clear Cache', icon: 'trash-outline', danger: true, action: 'clear-cache' },
  ],
];

export function SettingsScreen() {
  const { colors, spacing, radius, typography, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = useCallback(async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear image cache and temporary data. Your recipes and settings (except AI configuration) will be preserved. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              const result = await clearCache(['images']);
              if (result.success) {
                Alert.alert('Success', 'Cache cleared successfully.');
              } else {
                Alert.alert('Error', result.error || 'Failed to clear cache.');
              }
            } catch {
              Alert.alert('Error', 'An unexpected error occurred.');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  }, []);

  const handleRowPress = (route?: string, action?: string) => {
    if (action === 'clear-cache') {
      handleClearCache();
    } else if (route) {
      router.push(route as Parameters<typeof router.push>[0]);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundGrouped,
        },
        header: {
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
        },
        title: {
          ...typography.largeTitle,
          color: colors.textPrimary,
        },
        content: {
          paddingHorizontal: spacing.lg,
        },
        section: {
          marginBottom: spacing.lg,
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
        rowLast: {
          borderBottomWidth: 0,
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
          marginTop: spacing.xl,
          marginBottom: insets.bottom + spacing.xl,
        },
      }),
    [colors, insets.bottom, insets.top, radius, shadows, spacing, typography]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {SECTIONS.map((items, sectionIndex) => (
        <View key={`section-${sectionIndex}`} style={styles.section}>
          {items.map((item, itemIndex) => {
            const isLast = itemIndex === items.length - 1;
            return (
              <Pressable
                key={item.label}
                style={({ pressed }) => [
                  styles.row,
                  isLast && styles.rowLast,
                  pressed && { opacity: 0.7, backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={() => handleRowPress(item.route, item.action)}
                disabled={isClearing && item.action === 'clear-cache'}
              >
                <View style={styles.rowLeft}>
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={item.danger ? colors.error : colors.textSecondary}
                  />
                  <Text style={[styles.label, item.danger && styles.danger]}>{item.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  {isClearing && item.action === 'clear-cache' ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <>
                      {!!item.value && <Text style={styles.value}>{item.value}</Text>}
                      {(item.route || item.action) && (
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                      )}
                    </>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <Text style={styles.version}>Recipe Organizer v1.0.0</Text>
    </ScrollView>
  );
}
