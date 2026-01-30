import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'elevated';
};

export function GlassCard({ children, style, variant = 'primary' }: GlassCardProps) {
  const { colors, radius, shadows } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          overflow: 'hidden',
          backgroundColor: colors.surfacePrimary,
          ...shadows.md,
        },
        secondary: {
          backgroundColor: colors.surfaceSecondary,
        },
        elevated: {
          backgroundColor: colors.surfaceElevated,
        },
      }),
    [colors, radius, shadows]
  );

  return (
    <View style={[styles.base, variant === 'secondary' && styles.secondary, variant === 'elevated' && styles.elevated, style]}>
      {children}
    </View>
  );
}
