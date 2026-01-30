import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAppTheme } from '@/hooks/use-app-theme';

type SearchBarProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
};

export function SearchBar({ containerStyle, ...inputProps }: SearchBarProps) {
  const { colors, radius, shadows, spacing, typography } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          backgroundColor: colors.backgroundSecondary,
          minHeight: 36,
          ...shadows.sm,
        },
        input: {
          flex: 1,
          color: colors.textPrimary,
          ...typography.subheadline,
        },
        icon: {
          color: colors.textTertiary,
        },
      }),
    [colors, radius, shadows, spacing, typography]
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <Ionicons name="search" size={16} style={styles.icon} />
      <TextInput
        placeholderTextColor={colors.textTertiary}
        {...inputProps}
        style={[styles.input, inputProps.style]}
      />
    </View>
  );
}
