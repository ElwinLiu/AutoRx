import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAppTheme } from '@/hooks/use-app-theme';
import { recipeRepository } from '@/lib/repositories';
import type { Recipe } from '@/types/models';

type RecipeCardProps = {
  recipe: Recipe;
  onPress: () => void;
  onFavoriteToggle?: () => void;
};

function RecipeCardComponent({ recipe, onPress, onFavoriteToggle }: RecipeCardProps) {
  const { colors, spacing, radius, typography, shadows } = useAppTheme();
  const [isFavorite, setIsFavorite] = useState(recipe.isFavorite);

  // Use first image for the card
  const firstImage = recipe.images[0];
  const hasMultipleImages = recipe.images.length > 1;

  const imageAspectRatio = useMemo(() => {
    if (firstImage?.width && firstImage?.height && firstImage.height > 0) {
      return firstImage.width / firstImage.height;
    }
    return 4 / 3;
  }, [firstImage?.width, firstImage?.height]);

  const handleToggleFavorite = useCallback(async (e: { stopPropagation: () => void }) => {
    e.stopPropagation();

    const newFavorite = !isFavorite;
    setIsFavorite(newFavorite);

    try {
      await recipeRepository.toggleFavorite(recipe.id);
      onFavoriteToggle?.();
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setIsFavorite(!newFavorite);
    }
  }, [isFavorite, recipe.id, onFavoriteToggle]);

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
        imageContainer: {
          position: 'relative',
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
        favoriteButton: {
          position: 'absolute',
          top: spacing.xs,
          right: spacing.xs,
          width: 32,
          height: 32,
          borderRadius: radius.pill,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        imageIndicator: {
          position: 'absolute',
          bottom: spacing.xs,
          right: spacing.xs,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radius.pill,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        imageIndicatorText: {
          color: colors.textInverted,
          ...typography.caption,
          fontWeight: '600',
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
      <View style={styles.imageContainer}>
        {firstImage ? (
          <Image source={{ uri: firstImage.url }} contentFit="cover" style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="restaurant-outline" size={28} color={colors.textTertiary} />
          </View>
        )}
        {hasMultipleImages && (
          <View style={styles.imageIndicator}>
            <Ionicons name="images-outline" size={12} color={colors.textInverted} />
            <Text style={styles.imageIndicatorText}>{recipe.images.length}</Text>
          </View>
        )}
        <Pressable onPress={handleToggleFavorite} style={styles.favoriteButton}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? '#FF3B30' : '#FFFFFF'}
          />
        </Pressable>
      </View>
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
