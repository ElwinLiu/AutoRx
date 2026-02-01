import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions, Keyboard } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  FadeInUp,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useNativeHeaderOptions } from '@/hooks/use-native-header';
import { AIFab } from '@/components/ai/ai-fab';
import { recipeRepository } from '@/lib/repositories';
import { AIBottomSheet } from '@/components/ai/ai-bottom-sheet';
import { AnimatedIconButton } from '@/components/ui/animated-icon-button';
import { UnitConversionSheet } from '@/components/units/unit-conversion-sheet';
import { isUnitConvertible } from '@/lib/units/constants';
import type { Ingredient } from '@/types/models';

const formatAmount = (value: number) => {
  if (Number.isInteger(value)) return value.toString();
  const formatted = value.toFixed(2);
  // Remove trailing zeros but keep at least one decimal if needed
  return formatted.replace(/\.?0+$/, '').replace(/\.$/, '');
};

const formatServings = (value: number) => {
  if (Number.isInteger(value)) return value.toString();
  // Show up to 2 decimal places for servings
  const formatted = value.toFixed(2);
  return formatted.replace(/\.?0+$/, '').replace(/\.$/, '');
};

// Helper to find ingredient mentions in text and highlight with calculated amounts
const renderInstructionStep = (
  step: string,
  ingredients: Ingredient[],
  scale: number,
  colors: { accent: string; textPrimary: string; textSecondary: string },
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
    <Text style={{ ...typography.body, color: colors.textPrimary, lineHeight: 24 }}>
      {parts.map((part, index) => {
        if (part.type === 'highlight') {
          return (
            <Text key={index}>
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{part.content}</Text>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>
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

const HERO_HEIGHT = 420;
const HERO_MIN_HEIGHT = 0;
const HEADER_HEIGHT = 44;

// Database recipe type
interface RecipeDetail {
  id: string;
  title: string;
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
  const { colors, spacing, radius, typography, shadows } = useAppTheme();
  const { buildOptions } = useNativeHeaderOptions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [servings, setServings] = useState(1);
  const [multiplier, setMultiplier] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [isFavorite, setIsFavorite] = useState(recipe?.isFavorite ?? false);
  const [aiOpen, setAiOpen] = useState(false);
  const [isEditingServings, setIsEditingServings] = useState(false);
  const [tempServings, setTempServings] = useState('');

  // Unit conversion state
  const [unitConversionOpen, setUnitConversionOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [ingredientConversions, setIngredientConversions] = useState<Record<string, { amount: number; unit: string }>>({});

  // Servings input handlers
  const handleServingsSubmit = useCallback(() => {
    const newServings = parseFloat(tempServings);
    if (!isNaN(newServings) && newServings > 0) {
      setServings(newServings);
      if (recipe) {
        setMultiplier(newServings / recipe.servings);
      }
    }
    setIsEditingServings(false);
    setTempServings('');
    Keyboard.dismiss();
  }, [tempServings, recipe]);

  const handleServingsPress = useCallback(() => {
    setTempServings(servings.toString());
    setIsEditingServings(true);
  }, [servings]);

  // Unit conversion handlers
  const handleIngredientPress = useCallback((ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setUnitConversionOpen(true);
  }, []);

  const handleUnitConversion = useCallback((ingredientId: string, newAmount: number, newUnit: string) => {
    setIngredientConversions((prev) => ({
      ...prev,
      [ingredientId]: { amount: newAmount, unit: newUnit },
    }));
  }, []);

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
            setServings(data.servings);
            setMultiplier(1);
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

  const scale = recipe ? servings / recipe.servings : 1;
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

  const toggleAllIngredients = useCallback(() => {
    if (!recipe) return;
    if (checkedIngredients.size === recipe.ingredients.length) {
      setCheckedIngredients(new Set());
    } else {
      setCheckedIngredients(new Set(recipe.ingredients.map(i => i.id)));
    }
  }, [recipe, checkedIngredients.size]);

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

  const tabPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(activeIndex * 120, SPRING_CONFIG) }],
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
        topGradient: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 120,
        },
        gradient: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 200,
        },
        heroBadge: {
          position: 'absolute',
          bottom: 80,
          right: spacing.lg,
          flexDirection: 'row',
          gap: spacing.sm,
        },
        badge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        badgeText: {
          color: colors.textInverted,
          ...typography.footnote,
          fontWeight: '600',
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
        headerTitleContainer: {
          position: 'absolute',
          top: 0,
          left: 60,
          right: 60,
          height: insets.top + HEADER_HEIGHT,
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: spacing.sm,
          zIndex: 99,
        },
        headerTitle: {
          ...typography.subheadline,
          color: colors.textPrimary,
          fontWeight: '600',
          opacity: 0,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          paddingTop: HERO_HEIGHT - 60,
          paddingBottom: insets.bottom + 120,
        },
        contentCard: {
          backgroundColor: colors.backgroundGrouped,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingTop: spacing.xl,
          minHeight: 600,
          ...shadows.md,
        },
        content: {
          paddingHorizontal: spacing.lg,
          gap: spacing.lg,
        },
        titleContainer: {
          marginBottom: spacing.xs,
        },
        title: {
          ...typography.title,
          color: colors.textPrimary,
          letterSpacing: -0.5,
        },
        subtitle: {
          ...typography.subheadline,
          color: colors.textSecondary,
          marginTop: spacing.xs,
        },
        tagContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        tag: {
          paddingHorizontal: spacing.md,
          paddingVertical: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.tagBg,
        },
        tagText: {
          color: colors.tagText,
          ...typography.footnote,
          fontWeight: '500',
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
        },
        metaItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.md,
        },
        metaText: {
          color: colors.textSecondary,
          ...typography.subheadline,
          fontWeight: '500',
        },
        servingsCard: {
          backgroundColor: colors.surfacePrimary,
          borderRadius: radius.lg,
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          ...shadows.sm,
        },
        servingsLabelText: {
          ...typography.subheadline,
          color: colors.textSecondary,
          fontWeight: '500',
        },
        servingsControls: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        servingsValue: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.backgroundGrouped,
          minWidth: 70,
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'transparent',
        },
        servingsValueActive: {
          backgroundColor: colors.surfacePrimary,
          borderColor: colors.accent,
        },
        servingsNumber: {
          ...typography.title3,
          color: colors.textPrimary,
          fontWeight: '600',
          textAlign: 'center',
        },
        servingsNumberActive: {
          color: colors.accent,
        },
        servingsUnit: {
          ...typography.footnote,
          color: colors.textTertiary,
        },
        servingsUnitActive: {
          color: colors.accent,
        },
        servingsInput: {
          ...typography.title3,
          color: colors.accent,
          fontWeight: '600',
          minWidth: 50,
          textAlign: 'center',
          padding: 0,
        },
        presetContainer: {
          flexDirection: 'row',
          gap: spacing.xs,
        },
        presetButton: {
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radius.pill,
          backgroundColor: colors.backgroundGrouped,
          minWidth: 36,
          alignItems: 'center',
        },
        presetButtonActive: {
          backgroundColor: colors.accent,
        },
        presetText: {
          ...typography.footnote,
          color: colors.textSecondary,
          fontWeight: '500',
        },
        presetTextActive: {
          color: colors.textInverted,
        },
        sectionToggle: {
          flexDirection: 'row',
          justifyContent: 'center',
          marginBottom: spacing.md,
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.pill,
          padding: 4,
          alignSelf: 'center',
          position: 'relative',
          width: 248,
        },
        sectionTogglePill: {
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 4,
          width: 120,
          borderRadius: radius.pill,
          backgroundColor: colors.surfacePrimary,
          ...shadows.sm,
        },
        sectionToggleButton: {
          paddingVertical: spacing.sm,
          flex: 1,
          alignItems: 'center',
          zIndex: 1,
        },
        sectionToggleText: {
          ...typography.subheadline,
          color: colors.textSecondary,
          fontWeight: '500',
        },
        sectionToggleTextActive: {
          color: colors.textPrimary,
          fontWeight: '600',
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
        ingredientsHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
          paddingHorizontal: spacing.sm,
        },
        ingredientsTitle: {
          ...typography.subheadline,
          color: colors.textSecondary,
          fontWeight: '600',
        },
        checkAllButton: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceSecondary,
        },
        checkAllText: {
          ...typography.footnote,
          color: colors.accent,
          fontWeight: '600',
        },
        ingredientsCard: {
          backgroundColor: colors.surfacePrimary,
          borderRadius: radius.lg,
          overflow: 'hidden',
          ...shadows.sm,
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
        ingredientTextChecked: {
          textDecorationLine: 'line-through',
          color: colors.textTertiary,
        },
        ingredientAmount: {
          color: colors.accent,
          ...typography.subheadline,
          fontWeight: '600',
        },
        ingredientAmountChecked: {
          color: colors.textTertiary,
        },
        ingredientCheckboxArea: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        ingredientAmountArea: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          borderRadius: radius.md,
        },
        convertedIndicator: {
          ...typography.caption,
          color: colors.accent,
          marginLeft: 4,
        },
        checkbox: {
          width: 26,
          height: 26,
          borderRadius: radius.pill,
          borderWidth: 2,
          borderColor: colors.textTertiary,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        },
        checkboxChecked: {
          backgroundColor: colors.success,
          borderColor: colors.success,
        },
        instructionSection: {
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: colors.surfacePrimary,
          marginBottom: spacing.md,
          ...shadows.sm,
        },
        instructionTitle: {
          ...typography.subheadline,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: spacing.md,
          fontWeight: '600',
        },
        instructionStep: {
          flexDirection: 'row',
          gap: spacing.md,
          marginBottom: spacing.lg,
        },
        stepNumber: {
          width: 28,
          height: 28,
          borderRadius: radius.pill,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        stepNumberText: {
          color: colors.textInverted,
          ...typography.footnote,
          fontWeight: '700',
        },
        stepContent: {
          flex: 1,
          ...typography.body,
          color: colors.textPrimary,
          lineHeight: 24,
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
    [colors, insets.bottom, insets.top, radius, shadows, spacing, typography, width]
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



  const applyPreset = (value: number) => {
    setMultiplier(value);
    if (recipe) {
      setServings(Math.round(recipe.servings * value));
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
            {/* Top gradient for status bar */}
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'transparent']}
              style={styles.topGradient}
            />
            <LinearGradient
              colors={['transparent', colors.backgroundGrouped]}
              style={styles.gradient}
            />
            {/* Hero badges */}
            <View style={styles.heroBadge}>
              <View style={styles.badge}>
                <Ionicons name="time-outline" size={12} color={colors.textInverted} />
                <Text style={styles.badgeText}>{recipe.time}</Text>
              </View>
              {isFavorite && (
                <View style={styles.badge}>
                  <Ionicons name="heart" size={12} color="#FF3B30" />
                  <Text style={styles.badgeText}>Favorite</Text>
                </View>
              )}
            </View>

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
              onPress={() => router.push(`/recipe/edit/${recipeId}`)}
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
              <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.titleContainer}>
                <Text style={styles.title}>{recipe.title}</Text>
              </Animated.View>

            <Animated.View entering={FadeInUp.duration(400).delay(150)} style={styles.tagContainer}>
              {recipe.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>{recipe.time}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {recipe.servings} servings
                </Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400).delay(250)} style={styles.servingsCard}>
              <Text style={styles.servingsLabelText}>Scale</Text>

              <View style={styles.servingsControls}>
                <View style={styles.presetContainer}>
                  {[0.5, 1, 2].map((preset) => (
                    <Pressable
                      key={preset}
                      onPress={() => applyPreset(preset)}
                      style={[
                        styles.presetButton,
                        multiplier === preset && styles.presetButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          multiplier === preset && styles.presetTextActive,
                        ]}
                      >
                        {preset === 0.5 ? '½x' : `${preset}x`}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={handleServingsPress}
                  style={[
                    styles.servingsValue,
                    isEditingServings && styles.servingsValueActive,
                  ]}
                >
                  {isEditingServings ? (
                    <TextInput
                      style={styles.servingsInput}
                      value={tempServings}
                      onChangeText={setTempServings}
                      onSubmitEditing={handleServingsSubmit}
                      onBlur={handleServingsSubmit}
                      keyboardType="decimal-pad"
                      autoFocus
                      selectTextOnFocus
                    />
                  ) : (
                    <Text style={[
                      styles.servingsNumber,
                      isEditingServings && styles.servingsNumberActive,
                    ]}>
                      {formatServings(servings)}
                    </Text>
                  )}
                  <Text style={[
                    styles.servingsUnit,
                    isEditingServings && styles.servingsUnitActive,
                  ]}>
                    {servings === 1 ? 'serving' : 'servings'}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.sectionToggle}>
              <Animated.View style={[styles.sectionTogglePill, tabPillStyle]} />
              <Pressable
                onPress={() => setActiveTab('ingredients')}
                style={styles.sectionToggleButton}
              >
                <Text
                  style={[
                    styles.sectionToggleText,
                    activeTab === 'ingredients' && styles.sectionToggleTextActive,
                  ]}
                >
                  Ingredients
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('instructions')}
                style={styles.sectionToggleButton}
              >
                <Text
                  style={[
                    styles.sectionToggleText,
                    activeTab === 'instructions' && styles.sectionToggleTextActive,
                  ]}
                >
                  Instructions
                </Text>
              </Pressable>
            </Animated.View>
          </View>

          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.tabsContent, animatedStyle]}>
              <View style={styles.tabPanel}>
                <View style={styles.ingredientsHeader}>
                  <Text style={styles.ingredientsTitle}>
                    {checkedIngredients.size}/{recipe.ingredients.length} checked
                  </Text>
                  <Pressable onPress={toggleAllIngredients} style={styles.checkAllButton}>
                    <Text style={styles.checkAllText}>
                      {checkedIngredients.size === recipe.ingredients.length ? 'Uncheck All' : 'Check All'}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.ingredientsCard}>
                  {recipe.ingredients.map((ingredient, index) => {
                    const checked = checkedIngredients.has(ingredient.id);
                    const isLast = index === recipe.ingredients.length - 1;
                    const conversion = ingredientConversions[ingredient.id];

                    // Use converted values if available, otherwise use original scaled values
                    const displayAmount = conversion
                      ? conversion.amount * scale
                      : ingredient.amount * scale;
                    const displayUnit = conversion?.unit || ingredient.unit;

                    return (
                      <View
                        key={ingredient.id}
                        style={[styles.ingredientRow, isLast && styles.ingredientRowLast]}
                      >
                        <Pressable
                          onPress={() => toggleIngredient(ingredient)}
                          style={styles.ingredientCheckboxArea}
                        >
                          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                            {checked && <Ionicons name="checkmark" size={16} color={colors.textInverted} />}
                          </View>
                          <Text style={[styles.ingredientText, checked && styles.ingredientTextChecked]}>
                            {ingredient.item}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleIngredientPress(ingredient)}
                          style={styles.ingredientAmountArea}
                          disabled={!isUnitConvertible(ingredient.unit)}
                        >
                          <Text style={[styles.ingredientAmount, checked && styles.ingredientAmountChecked]}>
                            {formatAmount(displayAmount)} {displayUnit}
                          </Text>
                          {isUnitConvertible(ingredient.unit) && (
                            <Ionicons name="swap-horizontal" size={14} color={colors.accent} style={{ marginLeft: 4 }} />
                          )}
                          {conversion && (
                            <Text style={styles.convertedIndicator}>
                              ↻
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.tabPanel}>
                {recipe.instructionSections.map((section) => (
                  <View key={section.id} style={styles.instructionSection}>
                    <Text style={styles.instructionTitle}>{section.name}</Text>
                    {section.steps.map((step, index) => (
                      <View key={`${section.id}-${index}`} style={styles.instructionStep}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.stepContent}>
                          {renderInstructionStep(step, recipe.ingredients, scale, colors, typography)}
                        </View>
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

      <UnitConversionSheet
        visible={unitConversionOpen}
        onClose={() => setUnitConversionOpen(false)}
        ingredientName={selectedIngredient?.item || ''}
        originalAmount={selectedIngredient?.amount || 0}
        originalUnit={selectedIngredient?.unit || ''}
        onConvert={(amount, unit) => {
          if (selectedIngredient) {
            handleUnitConversion(selectedIngredient.id, amount, unit);
          }
        }}
      />
    </View>
  );
}
