import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type LoadingScreenProps = {
  message?: string;
  error?: Error | null;
};

export function LoadingScreen({ message = 'Preparing your kitchen…', error }: LoadingScreenProps) {
  const { colors, typography, spacing } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          backgroundColor: colors.backgroundPrimary,
        },
        text: {
          marginTop: spacing.md,
          color: colors.textSecondary,
          textAlign: 'center',
          ...typography.body,
        },
        error: {
          marginTop: spacing.sm,
          color: colors.error,
          textAlign: 'center',
          ...typography.subheadline,
        },
      }),
    [colors, spacing, typography]
  );

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.text}>{message}</Text>
      {error && <Text style={styles.error}>{error.message}</Text>}
    </View>
  );
}
