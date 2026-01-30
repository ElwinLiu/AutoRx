import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useNativeHeaderOptions } from '@/hooks/use-native-header';
import { AIFab } from '@/components/ai/ai-fab';
import { recipeRepository } from '@/lib/repositories';
import { AIBottomSheet } from '@/components/ai/ai-bottom-sheet';
import { AnimatedIconButton } from '@/components/ui/animated-icon-button';
import type { Ingredient } from '@/types/models';

const formatAmount = (value: number) => {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2).replace(/\.?0+$/, '');
};

const formatMultiplier = (value: number) => {
  if (value === 1) return '1x';
  if (Number.isInteger(value)) return `${value}x`;
  return `${value.toFixed(2).replace(/\.?0+$/, '')}x`;
};

// Helper to find ingredient mentions in text and highlight with calculated amounts
const renderInstructionStep = (
  step: string,
  ingredients: Ingredient[],
  scale: number,
  colors: { accent: string; textPrimary: string },
  typography: { body: object }
) => {
  // Sort ingredients by length (longest first) to avoid partial matches
  const sortedIngredients = [...ingredients].sort((a, b) => b.item.length - a.item.length);

  const parts: { type: 'text' | 'highlight'; content: string; amount?: string; unit?: string }[] = [];
  let remainingText = step;

  while (remainingText.length > 0) {
    let matchFound = false;

    for (const ingredient of sortedIngredients) {
      // Create regex to match whole word/phrase (case insensitive)
      const regex = new RegExp(`\\b${ingredient.item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      const match = remainingText.match(regex);

      if (match && match.index !== undefined) {
        // Add text before match
        if (match.index > 0) {
          parts.push({ type: 'text', content: remainingText.slice(0, match.index) });
        }

        // Add the matched ingredient with calculated amount
        const calculatedAmount = formatAmount(ingredient.amount * scale);
        parts.push({
          type: 'highlight',
          content: match[0],
          amount: calculatedAmount,
          unit: ingredient.unit,
        });

        // Update remaining text
        remainingText = remainingText.slice(match.index + match[0].length);
        matchFound = true;
        break;
      }
    }

    if (!matchFound) {
      // No more matches, add remaining text
      parts.push({ type: 'text', content: remainingText });
      break;
    }
  }

  return (
    <Text style={{ ...typography.body, color: colors.textPrimary, marginBottom: 8 }}>
      {parts.map((part, index) => {
        if (part.type === 'highlight') {
          return (
            <Text key={index}>
              <Text style={{ fontWeight: '600' }}>{part.content}</Text>
              <Text style={{ color: colors.accent, fontWeight: '700' }}>
                {' '}({part.amount} {part.unit})
              </Text>
            </Text>
          );
        }
        return <Text key={index}>{part.content}</Text>;
      })}
    </Text>
  );
};

const SPRING_CONFIG = {
  damping: 30,
  stiffness: 200,
  mass: 0.8,
};

const HERO_HEIGHT = 380;
const HERO_MIN_HEIGHT = 0;
const HEADER_HEIGHT = 44;

// Database recipe type
interface RecipeDetail {
  id: string;
  title: string;
  template: string;
  time: string;
  servings: number;
  tags: string[];
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  isFavorite: boolean;
  ingredients: Ingredient[];
  instructionSections: { id: string; name: string; steps: string[] }[];
}

export function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const recipeId = Array.isArray(id) ? id[0] : id;
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colors, spacing, radius, typography } = useAppTheme();
  const { buildOptions } = useNativeHeaderOptions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [servingsMode, setServingsMode] = useState<'servings' | 'multiplier'>('servings');
  const [servings, setServings] = useState(recipe?.servings ?? 1);
  const [multiplier, setMultiplier] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [isFavorite, setIsFavorite] = useState(recipe?.isFavorite ?? false);
  const [aiOpen, setAiOpen] = useState(false);

  // Persist favorite toggle to database
  const handleToggleFavorite = useCallback(async () => {
    if (!recipeId) return;

    const newFavorite = !isFavorite;
    setIsFavorite(newFavorite);

    try {
      await recipeRepository.toggleFavorite(recipeId);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert on error
      setIsFavorite(!newFavorite);
    }
  }, [isFavorite, recipeId]);

  // Fetch recipe from database using repository
  useEffect(() => {
    if (recipeId) {
      const fetchRecipe = async () => {
        try {
          const data = await recipeRepository.getById(recipeId);
          if (data) {
            setRecipe({
              id: data.id,
              title: data.title,
              template: data.template,
              time: data.time,
              servings: data.servings,
              tags: data.tags,
              imageUrl: data.imageUrl,
              imageWidth: data.imageWidth,
              imageHeight: data.imageHeight,
              isFavorite: data.isFavorite,
              ingredients: data.ingredients,
              instructionSections: data.instructionSections,
            });
            setIsFavorite(data.isFavorite);
          }
        } catch (err) {
          console.error('Error fetching recipe:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRecipe();
    }
  }, [recipeId]);

  const scale = servingsMode === 'servings' ? (recipe ? servings / recipe.servings : 1) : multiplier;
  const translateX = useSharedValue(0);
  const contextX = useRef(0);
  const activeIndex = activeTab === 'ingredients' ? 0 : 1;
  const scrollY = useSharedValue(0);

  // Sync translateX with activeTab when tab is clicked
  React.useEffect(() => {
    translateX.value = withSpring(-activeIndex * width, SPRING_CONFIG);
  }, [activeTab, width, translateX, activeIndex]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HERO_HEIGHT],
      [HERO_HEIGHT, HERO_MIN_HEIGHT],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [0, HERO_HEIGHT * 0.8],
      [1, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [-100, 0, HERO_HEIGHT],
      [1.1, 1, 1],
      Extrapolation.CLAMP
    );
    return {
      height,
      opacity,
      transform: [{ scale }],
    };
  });





  const toggleIngredient = useCallback((ingredient: Ingredient) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingredient.id)) {
        next.delete(ingredient.id);
      } else {
        next.add(ingredient.id);
      }
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    if (!recipe) return;
    navigation.setOptions(
      buildOptions({
        title: '',
        headerTransparent: true,
      })
    );
  }, [buildOptions, navigation, recipe]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      contextX.current = translateX.value;
    })
    .onUpdate((event) => {
      const newTranslateX = contextX.current + event.translationX;
      const maxTranslate = 0;
      const minTranslate = -width;
      translateX.value = Math.max(minTranslate, Math.min(maxTranslate, newTranslateX));
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const currentOffset = -translateX.value;
      const currentIndex = Math.round(currentOffset / width);

      let newIndex = currentIndex;
      if (Math.abs(velocity) > 500) {
        if (velocity < 0) {
          newIndex = Math.min(1, currentIndex + 1);
        } else {
          newIndex = Math.max(0, currentIndex - 1);
        }
      } else {
        newIndex = Math.max(0, Math.min(1, currentIndex));
      }

      translateX.value = withSpring(-newIndex * width, SPRING_CONFIG);
      runOnJS(setActiveTab)(newIndex === 0 ? 'ingredients' : 'instructions');
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundGrouped,
        },
        heroContainer: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: HERO_HEIGHT,
          zIndex: 0,
        },
        hero: {
          width: '100%',
          height: '100%',
          backgroundColor: colors.surfaceSecondary,
          overflow: 'hidden',
        },
        heroImage: {
          width: '100%',
          height: '100%',
        },
        gradient: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 160,
        },
        header: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + HEADER_HEIGHT,
          zIndex: 100,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.sm,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          paddingTop: HERO_HEIGHT - 40,
          paddingBottom: insets.bottom + 120,
        },
        contentCard: {
          backgroundColor: colors.backgroundGrouped,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingTop: spacing.lg,
          minHeight: 600,
        },
        content: {
          paddingHorizontal: spacing.lg,
          gap: spacing.lg,
        },
        title: {
          ...typography.heading,
          color: colors.textPrimary,
        },
        tag: {
          paddingHorizontal: spacing.md,
          paddingVertical: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.tagBg,
          alignSelf: 'flex-start',
        },
        tagText: {
          color: colors.tagText,
          ...typography.footnote,
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
        },
        metaItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        metaText: {
          color: colors.textSecondary,
          ...typography.subheadline,
        },
        servingsCard: {
          backgroundColor: colors.surfacePrimary,
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.md,
        },
        servingsToggle: {
          flexDirection: 'row',
          backgroundColor: colors.backgroundGrouped,
          borderRadius: radius.md,
          padding: 4,
        },
        servingsToggleButton: {
          flex: 1,
          paddingVertical: spacing.sm,
          alignItems: 'center',
          borderRadius: radius.sm,
        },
        servingsToggleButtonActive: {
          backgroundColor: colors.surfacePrimary,
        },
        servingsToggleText: {
          ...typography.subheadline,
          color: colors.textSecondary,
        },
        servingsToggleTextActive: {
          color: colors.textPrimary,
          fontWeight: '600',
        },
        servingsControls: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xl,
        },
        servingsButton: {
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: colors.backgroundGrouped,
          alignItems: 'center',
          justifyContent: 'center',
        },
        servingsValue: {
          alignItems: 'center',
        },
        servingsNumber: {
          ...typography.title3,
          color: colors.textPrimary,
          fontWeight: '700',
        },
        servingsLabel: {
          ...typography.footnote,
          color: colors.textTertiary,
        },
        sectionToggle: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.xl,
          marginBottom: spacing.md,
        },
        sectionToggleButton: {
          paddingVertical: spacing.sm,
          width: 100,
          alignItems: 'center',
        },
        sectionToggleText: {
          ...typography.body,
          color: colors.textSecondary,
        },
        sectionToggleTextActive: {
          color: colors.textPrimary,
          fontWeight: '600',
        },
        sectionToggleIndicator: {
          height: 3,
          backgroundColor: colors.textPrimary,
          borderRadius: radius.pill,
          marginTop: spacing.xs,
          width: 60,
          alignSelf: 'center',
        },
        tabsContainer: {
          flex: 1,
        },
        tabsContent: {
          flexDirection: 'row',
          width: width * 2,
        },
        tabPanel: {
          width,
          paddingHorizontal: spacing.lg,
        },
        ingredientsCard: {
          backgroundColor: colors.surfacePrimary,
          borderRadius: radius.lg,
          overflow: 'hidden',
        },
        ingredientRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderBottomWidth: 1,
          borderColor: colors.borderSecondary,
        },
        ingredientRowLast: {
          borderBottomWidth: 0,
        },
        ingredientText: {
          flex: 1,
          ...typography.body,
          color: colors.textPrimary,
        },
        ingredientAmount: {
          color: colors.textSecondary,
          ...typography.subheadline,
        },
        checkbox: {
          width: 24,
          height: 24,
          borderRadius: radius.pill,
          borderWidth: 2,
          borderColor: colors.textTertiary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        checkboxChecked: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        instructionSection: {
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: colors.surfacePrimary,
          marginBottom: spacing.md,
        },
        instructionTitle: {
          ...typography.subheadline,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: spacing.sm,
        },
        instructionStep: {
          ...typography.body,
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        },
        emptyState: {
          padding: spacing.xl,
          alignItems: 'center',
        },
        emptyText: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
        },
      }),
    [colors, insets.bottom, insets.top, radius, spacing, typography, width]
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, styles.emptyState]}>
          <Text style={styles.emptyText}>Recipe not found.</Text>
        </View>
      </View>
    );
  }



  const handleDecrement = () => {
    if (servingsMode === 'servings') {
      setServings((prev) => Math.max(1, prev - 1));
    } else {
      setMultiplier((prev) => Math.max(0.25, prev - 0.25));
    }
  };

  const handleIncrement = () => {
    if (servingsMode === 'servings') {
      setServings((prev) => prev + 1);
    } else {
      setMultiplier((prev) => prev + 0.25);
    }
  };

  return (
    <View style={styles.container}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Parallax Hero Image */}
        <Animated.View style={[styles.heroContainer, heroAnimatedStyle]}>
          <View style={styles.hero}>
            {recipe.imageUrl ? (
              <Image source={{ uri: recipe.imageUrl }} contentFit="cover" style={styles.heroImage} />
            ) : (
              <View style={[styles.hero, { alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="restaurant-outline" size={40} color={colors.textTertiary} />
              </View>
            )}
            <LinearGradient
              colors={['transparent', colors.backgroundGrouped]}
              style={styles.gradient}
            />
          </View>
        </Animated.View>

        {/* Floating Header */}
        <View style={styles.header}>
          <AnimatedIconButton
            name="chevron-back"
            size={24}
            onPress={() => navigation.goBack()}
            variant="dark"
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <AnimatedIconButton
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              onPress={handleToggleFavorite}
              variant={isFavorite ? 'liked' : 'dark'}
            />
            <AnimatedIconButton
              name="ellipsis-horizontal"
              size={22}
              onPress={() => {}}
              variant="dark"
            />
          </View>
        </View>

        {/* Scrollable Content */}
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentCard}>
            <View style={styles.content}>
              <View>
                <Text style={styles.title}>{recipe.title}</Text>
              </View>

            <View style={styles.tag}>
              <Text style={styles.tagText}>{recipe.template}</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>{recipe.time}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {recipe.servings} servings (original)
                </Text>
              </View>
            </View>

            <View style={styles.servingsCard}>
              <View style={styles.servingsToggle}>
                <Pressable
                  onPress={() => setServingsMode('servings')}
                  style={[
                    styles.servingsToggleButton,
                    servingsMode === 'servings' && styles.servingsToggleButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.servingsToggleText,
                      servingsMode === 'servings' && styles.servingsToggleTextActive,
                    ]}
                  >
                    Servings
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setServingsMode('multiplier')}
                  style={[
                    styles.servingsToggleButton,
                    servingsMode === 'multiplier' && styles.servingsToggleButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.servingsToggleText,
                      servingsMode === 'multiplier' && styles.servingsToggleTextActive,
                    ]}
                  >
                    Multiplier
                  </Text>
                </Pressable>
              </View>

              <View style={styles.servingsControls}>
                <Pressable onPress={handleDecrement} style={styles.servingsButton}>
                  <Ionicons name="remove" size={20} color={colors.textPrimary} />
                </Pressable>
                <View style={styles.servingsValue}>
                  <Text style={styles.servingsNumber}>
                    {servingsMode === 'servings' ? servings : formatMultiplier(multiplier)}
                  </Text>
                  <Text style={styles.servingsLabel}>
                    {servingsMode === 'servings' ? 'servings' : 'multiplier'}
                  </Text>
                </View>
                <Pressable onPress={handleIncrement} style={styles.servingsButton}>
                  <Ionicons name="add" size={20} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionToggle}>
              <Pressable onPress={() => setActiveTab('ingredients')} style={styles.sectionToggleButton}>
                <Text
                  style={[
                    styles.sectionToggleText,
                    activeTab === 'ingredients' && styles.sectionToggleTextActive,
                  ]}
                >
                  Ingredients
                </Text>
                {activeTab === 'ingredients' && <View style={styles.sectionToggleIndicator} />}
              </Pressable>
              <Pressable onPress={() => setActiveTab('instructions')} style={styles.sectionToggleButton}>
                <Text
                  style={[
                    styles.sectionToggleText,
                    activeTab === 'instructions' && styles.sectionToggleTextActive,
                  ]}
                >
                  Instructions
                </Text>
                {activeTab === 'instructions' && <View style={styles.sectionToggleIndicator} />}
              </Pressable>
            </View>
          </View>

          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.tabsContent, animatedStyle]}>
              <View style={styles.tabPanel}>
                <View style={styles.ingredientsCard}>
                  {recipe.ingredients.map((ingredient, index) => {
                    const checked = checkedIngredients.has(ingredient.id);
                    const isLast = index === recipe.ingredients.length - 1;
                    return (
                      <Pressable
                        key={ingredient.id}
                        onPress={() => toggleIngredient(ingredient)}
                        style={[styles.ingredientRow, isLast && styles.ingredientRowLast]}
                      >
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                          {checked && <Ionicons name="checkmark" size={14} color={colors.textInverted} />}
                        </View>
                        <Text
                          style={[
                            styles.ingredientText,
                            checked && { textDecorationLine: 'line-through', color: colors.textTertiary },
                          ]}
                        >
                          {ingredient.item}
                        </Text>
                        <Text style={styles.ingredientAmount}>
                          {formatAmount(ingredient.amount * scale)} {ingredient.unit}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.tabPanel}>
                {recipe.instructionSections.map((section) => (
                  <View key={section.id} style={styles.instructionSection}>
                    <Text style={styles.instructionTitle}>{section.name}</Text>
                    {section.steps.map((step, index) => (
                      <View key={`${section.id}-${index}`}>
                        {renderInstructionStep(step, recipe.ingredients, scale, colors, typography)}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </Animated.View>
          </GestureDetector>
          </View>
        </Animated.ScrollView>
      </GestureHandlerRootView>

      <AIFab onPress={() => setAiOpen(true)} />
      <AIBottomSheet
        visible={aiOpen}
        onClose={() => setAiOpen(false)}
        context="recipe-detail"
        contextLabel={`Editing: ${recipe.title}`}
      />
    </View>
  );
}
