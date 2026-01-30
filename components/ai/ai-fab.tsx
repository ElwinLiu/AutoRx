import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';

type AIFabProps = {
  onPress: () => void;
  hasUnread?: boolean;
};

export function AIFab({ onPress, hasUnread = false }: AIFabProps) {
  const { colors, spacing, radius, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'absolute',
          right: spacing.lg,
          bottom: insets.bottom + spacing.xxl,
        },
        button: {
          width: 56,
          height: 56,
          borderRadius: radius.pill,
          backgroundColor: colors.aiAccent,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          ...shadows.glass,
        },
        badge: {
          position: 'absolute',
          top: -2,
          right: -2,
          width: 12,
          height: 12,
          borderRadius: radius.pill,
          backgroundColor: colors.error,
          borderWidth: 2,
          borderColor: colors.backgroundSecondary,
        },
      }),
    [colors, insets.bottom, radius, shadows, spacing]
  );

  return (
    <View style={styles.container}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && { transform: [{ scale: 0.96 }] }]}>
        <Ionicons name="sparkles" size={24} color={colors.textInverted} />
        {hasUnread && <View style={styles.badge} />}
      </Pressable>
    </View>
  );
}
