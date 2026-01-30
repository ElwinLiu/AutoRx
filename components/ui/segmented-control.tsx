import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type Segment = {
  key: string;
  label: string;
};

type SegmentedControlProps = {
  segments: Segment[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function SegmentedControl({ segments, activeKey, onChange }: SegmentedControlProps) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const activeIndex = Math.max(
    0,
    segments.findIndex((segment) => segment.key === activeKey)
  );

  const isNativeSegmentedAvailable =
    Platform.OS === 'ios' &&
    typeof UIManager.getViewManagerConfig === 'function' &&
    !!UIManager.getViewManagerConfig('RNCSegmentedControl');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.pill,
          padding: 4,
          gap: spacing.xs,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
        },
        segment: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
        },
        activeSegment: {
          backgroundColor: colors.backgroundSecondary,
        },
        label: {
          color: colors.textSecondary,
          ...typography.subheadline,
        },
        activeLabel: {
          color: colors.textPrimary,
          fontWeight: '600',
        },
        native: {
          backgroundColor: colors.surfaceSecondary,
        },
      }),
    [colors, radius, spacing, typography]
  );

  if (isNativeSegmentedAvailable) {
    const NativeSegmentedControl = require('@react-native-segmented-control/segmented-control')
      .default as typeof import('@react-native-segmented-control/segmented-control').default;
    return (
      <NativeSegmentedControl
        values={segments.map((segment) => segment.label)}
        selectedIndex={activeIndex}
        onChange={(event) => {
          const index = event.nativeEvent.selectedSegmentIndex;
          const segment = segments[index];
          if (segment) onChange(segment.key);
        }}
        backgroundColor={colors.surfaceSecondary}
        tintColor={colors.backgroundSecondary}
        fontStyle={{ ...typography.subheadline, color: colors.textSecondary }}
        activeFontStyle={{ ...typography.subheadline, color: colors.textPrimary, fontWeight: '600' }}
        style={styles.native}
      />
    );
  }

  return (
    <View style={styles.container}>
      {segments.map((segment) => {
        const isActive = segment.key === activeKey;
        return (
          <Pressable
            key={segment.key}
            onPress={() => onChange(segment.key)}
            style={({ pressed }) => [
              styles.segment,
              isActive && styles.activeSegment,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={[styles.label, isActive && styles.activeLabel]}>{segment.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
