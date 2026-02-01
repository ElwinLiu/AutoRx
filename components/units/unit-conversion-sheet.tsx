import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAppTheme } from '@/hooks/use-app-theme';
import {
  UNIT_CATEGORIES,
  getUnitsByCategory,
} from '@/lib/units/constants';
import {
  convertUnit,
  formatConvertedAmount,
  canConvertViaLookup,
} from '@/lib/units/converter';
import type { UnitCategory, UnitDefinition } from '@/lib/units/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.45;

interface UnitConversionSheetProps {
  visible: boolean;
  onClose: () => void;
  ingredientName: string;
  originalAmount: number;
  originalUnit: string;
  onConvert: (amount: number, unit: string) => void;
}

type Step = 'category' | 'unit';

export function UnitConversionSheet({
  visible,
  onClose,
  ingredientName,
  originalAmount,
  originalUnit,
  onConvert,
}: UnitConversionSheetProps) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<UnitCategory | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEstimated, setIsEstimated] = useState(false);

  const translateY = useSharedValue(SHEET_HEIGHT);
  const opacity = useSharedValue(0);

  // Animate in/out - elegant, fast but subtle
  React.useEffect(() => {
    if (visible) {
      // Quick fade in backdrop
      opacity.value = withTiming(1, { duration: 100 });
      // Smooth slide up with slight bounce
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 350,
        mass: 0.8,
        overshootClamping: false,
      });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withSpring(SHEET_HEIGHT, {
        damping: 30,
        stiffness: 400,
        mass: 0.8,
      });
    }
  }, [visible, translateY, opacity]);

  // Reset state when opened
  React.useEffect(() => {
    if (visible) {
      setStep('category');
      setSelectedCategory(null);
      setSelectedUnit(null);
      setPreviewAmount(null);
      setIsEstimated(false);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    opacity.value = withTiming(0, { duration: 150 });
    translateY.value = withSpring(SHEET_HEIGHT, {
      damping: 30,
      stiffness: 400,
      mass: 0.8,
    }, () => {
      runOnJS(onClose)();
    });
  }, [onClose, translateY, opacity]);

  const handleCategorySelect = useCallback((category: UnitCategory) => {
    setSelectedCategory(category);
    setStep('unit');
  }, []);

  const handleUnitSelect = useCallback(async (unit: UnitDefinition) => {
    setSelectedUnit(unit.id);
    setIsLoading(true);

    try {
      // Check if we can do a quick lookup conversion
      if (canConvertViaLookup(originalUnit, unit.id)) {
        const { convertUnit: syncConvert } = await import('@/lib/units/converter');
        const result = await syncConvert(originalAmount, originalUnit, unit.id, ingredientName);
        setPreviewAmount(result.amount);
        setIsEstimated(result.isEstimated);
      } else {
        // AI conversion needed
        const result = await convertUnit(originalAmount, originalUnit, unit.id, ingredientName);
        setPreviewAmount(result.amount);
        setIsEstimated(result.isEstimated);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      setPreviewAmount(null);
    } finally {
      setIsLoading(false);
    }
  }, [originalAmount, originalUnit, ingredientName]);

  const handleApply = useCallback(() => {
    if (previewAmount !== null && selectedUnit) {
      onConvert(previewAmount, selectedUnit);
      handleClose();
    }
  }, [previewAmount, selectedUnit, onConvert, handleClose]);

  const handleBack = useCallback(() => {
    setStep('category');
    setSelectedUnit(null);
    setPreviewAmount(null);
    setIsEstimated(false);
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        // Fade backdrop as user drags down
        opacity.value = Math.max(0, 1 - event.translationY / (SHEET_HEIGHT * 0.5));
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withSpring(SHEET_HEIGHT, {
          damping: 30,
          stiffness: 400,
          mass: 0.8,
        });
        opacity.value = withTiming(0, { duration: 150 }, () => {
          runOnJS(handleClose)();
        });
      } else {
        // Snap back with slight bounce
        translateY.value = withSpring(0, {
          damping: 25,
          stiffness: 350,
          mass: 0.8,
        });
        opacity.value = withTiming(1, { duration: 100 });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const availableUnits = useMemo(() => {
    if (!selectedCategory) return [];
    return getUnitsByCategory(selectedCategory);
  }, [selectedCategory]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: colors.backgroundGrouped,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          height: SHEET_HEIGHT,
          paddingTop: spacing.md,
        },
        handle: {
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.borderPrimary,
          alignSelf: 'center',
          marginBottom: spacing.md,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSecondary,
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        backButton: {
          padding: spacing.xs,
        },
        title: {
          ...typography.headline,
          color: colors.textPrimary,
          fontWeight: '600',
        },
        closeButton: {
          padding: spacing.xs,
        },
        content: {
          flex: 1,
          padding: spacing.lg,
        },
        originalValue: {
          alignItems: 'center',
          marginBottom: spacing.md,
          paddingVertical: spacing.sm,
        },
        originalLabel: {
          ...typography.caption,
          color: colors.textSecondary,
          marginBottom: spacing.xs,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        originalText: {
          ...typography.body,
          color: colors.textPrimary,
          fontWeight: '500',
        },
        sectionTitle: {
          ...typography.footnote,
          color: colors.textSecondary,
          fontWeight: '500',
          marginBottom: spacing.md,
        },
        categoriesGrid: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: spacing.md,
        },
        categoryCard: {
          flex: 1,
          backgroundColor: colors.surfacePrimary,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.md,
          borderWidth: 2,
          borderColor: 'transparent',
          minHeight: 100,
        },
        categoryCardSelected: {
          borderColor: colors.accent,
        },
        categoryIcon: {
          marginBottom: spacing.sm,
        },
        categoryName: {
          ...typography.subheadline,
          color: colors.textPrimary,
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: spacing.xs,
        },
        categoryDescription: {
          ...typography.caption,
          color: colors.textSecondary,
          textAlign: 'center',
          fontSize: 12,
        },
        unitsList: {
          gap: spacing.sm,
          paddingBottom: spacing.lg,
        },
        unitRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.md,
          backgroundColor: colors.surfacePrimary,
          borderRadius: radius.md,
          borderWidth: 2,
          borderColor: 'transparent',
        },
        unitRowSelected: {
          borderColor: colors.accent,
        },
        unitInfo: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        unitSymbol: {
          width: 50,
          ...typography.title3,
          color: colors.accent,
          fontWeight: '700',
        },
        unitName: {
          ...typography.body,
          color: colors.textPrimary,
        },
        unitPreview: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        previewAmount: {
          ...typography.subheadline,
          color: colors.accent,
          fontWeight: '600',
        },
        estimatedBadge: {
          backgroundColor: colors.warning + '20',
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radius.pill,
        },
        estimatedText: {
          ...typography.caption,
          color: colors.warning,
          fontWeight: '500',
        },
        footer: {
          padding: spacing.lg,
          borderTopWidth: 1,
          borderTopColor: colors.borderSecondary,
        },
        applyButton: {
          backgroundColor: colors.accent,
          paddingVertical: spacing.md,
          borderRadius: radius.lg,
          alignItems: 'center',
        },
        applyButtonDisabled: {
          opacity: 0.5,
        },
        applyButtonText: {
          ...typography.subheadline,
          color: colors.textInverted,
          fontWeight: '600',
        },
        loadingContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        loadingText: {
          ...typography.footnote,
          color: colors.textSecondary,
        },
      }),
    [colors, spacing, radius, typography]
  );

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[styles.overlay, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {step === 'unit' && (
                  <Pressable onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                  </Pressable>
                )}
                <Text style={styles.title}>
                  {step === 'category' ? 'Convert Unit' : 'Select Unit'}
                </Text>
              </View>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Original Value Display */}
                <View style={styles.originalValue}>
                  <Text style={styles.originalLabel}>Original</Text>
                  <Text style={styles.originalText}>
                    {formatConvertedAmount(originalAmount)} {originalUnit} {ingredientName}
                  </Text>
                </View>

                {step === 'category' ? (
                  <>
                    <Text style={styles.sectionTitle}>Choose Category</Text>
                    <View style={styles.categoriesGrid}>
                      {UNIT_CATEGORIES.map((category) => (
                        <Pressable
                          key={category.id}
                          onPress={() => handleCategorySelect(category.id)}
                          style={[
                            styles.categoryCard,
                            selectedCategory === category.id && styles.categoryCardSelected,
                          ]}
                        >
                          <Ionicons
                            name={category.icon as any}
                            size={24}
                            color={colors.accent}
                            style={styles.categoryIcon}
                          />
                          <Text style={styles.categoryName}>{category.name}</Text>
                          <Text style={styles.categoryDescription}>
                            {category.description}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.sectionTitle}>
                      {selectedCategory?.charAt(0).toUpperCase() + selectedCategory?.slice(1)} Units
                    </Text>
                    <View style={styles.unitsList}>
                      {availableUnits.map((unit) => {
                        const isSelected = selectedUnit === unit.id;
                        const showPreview = isSelected && previewAmount !== null;

                        return (
                          <Pressable
                            key={unit.id}
                            onPress={() => handleUnitSelect(unit)}
                            style={[
                              styles.unitRow,
                              isSelected && styles.unitRowSelected,
                            ]}
                          >
                            <View style={styles.unitInfo}>
                              <Text style={styles.unitSymbol}>{unit.symbol}</Text>
                              <Text style={styles.unitName}>{unit.name}</Text>
                            </View>
                            {showPreview && (
                              <View style={styles.unitPreview}>
                                <Text style={styles.previewAmount}>
                                {formatConvertedAmount(previewAmount)}
                              </Text>
                              {isEstimated && (
                                <View style={styles.estimatedBadge}>
                                  <Text style={styles.estimatedText}>Est.</Text>
                                </View>
                              )}
                            </View>
                          )}
                          {isSelected && isLoading && (
                            <View style={styles.loadingContainer}>
                              <Text style={styles.loadingText}>Calculating...</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>
            </View>

            {/* Footer */}
            {step === 'unit' && (
              <View style={styles.footer}>
                <Pressable
                  onPress={handleApply}
                  disabled={!selectedUnit || previewAmount === null}
                  style={[
                    styles.applyButton,
                    (!selectedUnit || previewAmount === null) && styles.applyButtonDisabled,
                  ]}
                >
                  <Text style={styles.applyButtonText}>
                    {previewAmount !== null
                      ? `Convert to ${formatConvertedAmount(previewAmount)} ${selectedUnit}`
                      : 'Select a unit'}
                  </Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </GestureHandlerRootView>
  </Modal>
  );
}
