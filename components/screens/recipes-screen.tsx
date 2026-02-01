import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MasonryList from '@react-native-seoul/masonry-list';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { GlassButton } from '@/components/ui/glass-button';
import { SearchBar } from '@/components/ui/search-bar';
import { SettingsSheet } from '@/components/sheets/settings-sheet';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useDatabase } from '@/lib/db-provider';
import { recipeRepository } from '@/lib/repositories';
import type { Recipe } from '@/types/models';

const FILTERS = ['All', 'Favorites', 'Quick', 'Healthy'];

export function RecipesScreen() {
  const { colors, spacing, radius, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isReady, error } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recipes from database using repository
  const fetchRecipes = useCallback(async () => {
    try {
      let data: Recipe[];

      switch (activeFilter) {
        case 'Favorites':
          data = await recipeRepository.getFavorites();
          break;
        case 'Quick':
          data = await recipeRepository.getByCookTimeMax(30);
          break;
        case 'Healthy':
          data = await recipeRepository.getByTag('Healthy');
          break;
        default:
          data = await recipeRepository.getAll();
      }

      setRecipes(data);
    } catch (err) {
      console.error('Error fetching recipes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    if (isReady) {
      fetchRecipes();
    }
  }, [isReady, fetchRecipes]);

  // Refresh recipes when screen comes into focus (e.g., after database changes)
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        fetchRecipes();
      }
    }, [isReady, fetchRecipes])
  );

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return recipes;

    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(query) ||
      recipe.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [searchQuery, recipes]);

  const handleRecipePress = useCallback(
    (recipe: Recipe) => {
      router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } });
    },
    [router]
  );

  const handleFavoriteToggle = useCallback(() => {
    // Refresh recipes if we're on the Favorites filter
    if (activeFilter === 'Favorites') {
      fetchRecipes();
    }
  }, [activeFilter, fetchRecipes]);

  const renderItem = useCallback(
    ({ item, i }: { item: unknown; i: number }) => {
      const recipe = item as Recipe;
      return (
        <RecipeCard
          recipe={recipe}
          onPress={() => handleRecipePress(recipe)}
          onFavoriteToggle={handleFavoriteToggle}
        />
      );
    },
    [handleRecipePress, handleFavoriteToggle]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundGrouped,
        },
        nav: {
          paddingTop: insets.top,
          paddingHorizontal: spacing.lg,
        },
        searchRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.sm,
        },
        filtersRow: {
          paddingBottom: spacing.sm,
        },
        chip: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
          backgroundColor: colors.tagBg,
          marginRight: spacing.sm,
        },
        chipActive: {
          backgroundColor: colors.accent,
        },
        chipText: {
          color: colors.tagText,
          ...typography.footnote,
        },
        chipTextActive: {
          color: colors.textInverted,
          fontWeight: '600',
        },
        listContent: {
          paddingHorizontal: spacing.xs,
          paddingTop: spacing.xs,
          paddingBottom: insets.bottom + 120,
        },

        emptyContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.massive,
          paddingHorizontal: spacing.xl,
        },
        emptyIcon: {
          width: 64,
          height: 64,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
        },
        emptyTitle: {
          ...typography.title3,
          color: colors.textPrimary,
          marginBottom: spacing.xs,
        },
        emptyText: {
          ...typography.subheadline,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.lg,
        },
        emptyButton: {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: colors.accent,
        },
        emptyButtonText: {
          color: colors.textInverted,
          ...typography.body,
          fontWeight: '600',
        },
      }),
    [colors, insets.bottom, insets.top, radius, spacing, typography]
  );

  if (!isReady || isLoading) {
    return <LoadingScreen error={error} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <View style={styles.searchRow}>
          <GlassButton variant="icon" onPress={() => setSettingsOpen(true)}>
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
          </GlassButton>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            returnKeyType="search"
          />
          <GlassButton variant="icon" onPress={() => router.push('/recipe/add')}>
            <Ionicons name="add" size={22} color={colors.textPrimary} />
          </GlassButton>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(isActive ? 'All' : filter)}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{filter}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <MasonryList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        style={{ flex: 1 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="restaurant-outline" size={28} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No recipes yet</Text>
            <Text style={styles.emptyText}>Create or import your first recipe</Text>
            <Pressable style={styles.emptyButton} onPress={() => router.push('/recipe/add')}>
              <Text style={styles.emptyButtonText}>Create Recipe</Text>
            </Pressable>
          </View>
        }
      />

      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}
