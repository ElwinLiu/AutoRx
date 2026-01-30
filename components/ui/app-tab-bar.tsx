import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useAppTheme } from '@/hooks/use-app-theme';

const TAB_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Recipes', icon: 'book-outline' },
  templates: { label: 'Templates', icon: 'layers-outline' },
};

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, spacing, typography, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingTop: spacing.sm,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          backgroundColor: colors.surfacePrimary,
          borderTopWidth: 1,
          borderColor: colors.borderPrimary,
          ...shadows.glass,
        },
        tab: {
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.xs,
        },
        label: {
          ...typography.footnote,
          color: colors.textTertiary,
        },
        activeLabel: {
          color: colors.accent,
          fontWeight: '600',
        },
      }),
    [colors, insets.bottom, shadows, spacing, typography]
  );

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;

        const isFocused = state.index === index;
        const iconColor = isFocused ? colors.accent : colors.textTertiary;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => navigation.navigate(route.name)}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name={config.icon} size={22} color={iconColor} />
            <Text style={[styles.label, isFocused && styles.activeLabel]}>{config.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
