import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAppTheme } from '@/hooks/use-app-theme';
import type { Recipe } from '@/types/models';

type RecipeCardProps = {
  recipe: Recipe;
  onPress: () => void;
};

function RecipeCardComponent({ recipe, onPress }: RecipeCardProps) {
  const { colors, spacing, radius, typography, shadows } = useAppTheme();

  const imageAspectRatio = useMemo(() => {
    if (recipe.imageWidth && recipe.imageHeight && recipe.imageHeight > 0) {
      return recipe.imageWidth / recipe.imageHeight;
    }
    return 4 / 3;
  }, [recipe.imageWidth, recipe.imageHeight]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flex: 1,
          margin: spacing.xs,
          backgroundColor: colors.surfacePrimary,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          overflow: 'hidden',
          ...shadows.md,
        },
        image: {
          width: '100%',
          aspectRatio: imageAspectRatio,
          backgroundColor: colors.surfaceSecondary,
        },
        placeholder: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
          padding: spacing.sm,
          backgroundColor: colors.surfacePrimary,
        },
        title: {
          color: colors.textPrimary,
          fontWeight: '700',
          fontSize: 14,
          lineHeight: 18,
        },
        metaRow: {
          marginTop: spacing.xs,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        metaText: {
          color: colors.textSecondary,
          ...typography.footnote,
        },
      }),
    [colors, imageAspectRatio, radius, shadows, spacing, typography]
  );

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} contentFit="cover" style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="restaurant-outline" size={28} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="flame-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.metaText}>Cooked {recipe.timesCooked}x</Text>
        </View>
      </View>
    </Pressable>
  );
}

export const RecipeCard = memo(RecipeCardComponent);
