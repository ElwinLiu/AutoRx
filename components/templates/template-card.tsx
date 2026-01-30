import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAppTheme } from '@/hooks/use-app-theme';
import type { Template } from '@/types/models';

type TemplateCardProps = {
  template: Template;
  index: number;
  onPress: () => void;
};

const gradientPalette = ['#A78BFA', '#38BDF8', '#F59E0B', '#FB7185', '#34D399'];

function TemplateCardComponent({ template, index, onPress }: TemplateCardProps) {
  const { colors, spacing, radius, typography, shadows } = useAppTheme();
  const accent = gradientPalette[index % gradientPalette.length];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flex: 1,
          backgroundColor: colors.surfacePrimary,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          overflow: 'hidden',
          marginBottom: spacing.md,
          ...shadows.md,
        },
        header: {
          height: 96,
          backgroundColor: `${accent}1A`,
          padding: spacing.md,
          justifyContent: 'flex-end',
        },
        iconWrapper: {
          width: 44,
          height: 44,
          borderRadius: radius.lg,
          backgroundColor: colors.backgroundSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          ...shadows.sm,
        },
        content: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
        },
        title: {
          color: colors.textPrimary,
          fontSize: 18,
          fontWeight: '700',
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          marginTop: spacing.xs,
        },
        metaText: {
          color: colors.textSecondary,
          ...typography.footnote,
        },
        badge: {
          alignSelf: 'flex-start',
          marginTop: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radius.md,
          backgroundColor: `${colors.accent}14`,
          borderWidth: 1,
          borderColor: `${colors.accent}33`,
        },
        badgeText: {
          color: colors.accent,
          fontWeight: '600',
          ...typography.footnote,
        },
      }),
    [accent, colors, radius, shadows, spacing, typography]
  );

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <Ionicons name="layers-outline" size={20} color={colors.accent} />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{template.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="list-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{template.instructionSections.length} sections</Text>
        </View>
        {!!template.lastEdited && !template.isDefault && (
          <Text style={[styles.metaText, { marginTop: spacing.xs }]}>Added {template.lastEdited}</Text>
        )}
        {template.isDefault && (
          <View style={styles.badge}>
            <Ionicons name="sparkles-outline" size={12} color={colors.accent} />
            <Text style={styles.badgeText}>Default</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export const TemplateCard = memo(TemplateCardComponent);
