import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  getAllConvertibleUnits,
} from '@/lib/units/constants';
import {
  convertUnit,
  formatConvertedAmount,
  canConvertViaLookup,
} from '@/lib/units/converter';
import type { UnitDefinition } from '@/lib/units/types';
import { getUIHintsCache, saveUIHintsCache } from '@/lib/cache';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

const SPRING_CONFIG = {
  damping: 30,
  stiffness: 200,
  mass: 0.8,
};

interface UnitConversionSheetProps {
  visible: boolean;
  onClose: () => void;
  ingredientName: string;
  originalAmount: number;
  originalUnit: string;
  onConvert: (amount: number, unit: string) => void;
}

// Pre-calculated conversion result
interface ConversionItem {
  unit: UnitDefinition;
  amount: number;
  isEstimated: boolean;
}

export function UnitConversionSheet({
  visible,
  onClose,
  ingredientName,
  originalAmount,
  originalUnit,
  onConvert,
}: UnitConversionSheetProps) {
  const { colors, spacing, radius, typography, shadows } = useAppTheme();
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [directConversions, setDirectConversions] = useState<ConversionItem[]>([]);
  const [estimationConversions, setEstimationConversions] = useState<ConversionItem[]>([]);
  const [isLoadingEstimations, setIsLoadingEstimations] = useState(false);
  const [showEstimations, setShowEstimations] = useState(false);
  const [directHintDismissed, setDirectHintDismissed] = useState(false);
  const [estimateHintDismissed, setEstimateHintDismissed] = useState(false);

  const translateY = useSharedValue(SHEET_HEIGHT);
  const opacity = useSharedValue(0);
  const activeTabIndex = useSharedValue(0);
  const contentTranslateX = useSharedValue(0);
  const contextX = useSharedValue(0);

  // Load hint dismissal state when sheet opens
  useEffect(() => {
    if (visible) {
      const loadHintState = async () => {
        const cache = await getUIHintsCache();
        setDirectHintDismissed(cache.unitConversionDirectDismissed ?? false);
        setEstimateHintDismissed(cache.unitConversionEstimateDismissed ?? false);
      };
      loadHintState();
    }
  }, [visible]);

  // Handle hint dismissal
  const handleDismissDirectHint = useCallback(async () => {
    setDirectHintDismissed(true);
    const cache = await getUIHintsCache();
    await saveUIHintsCache({ ...cache, unitConversionDirectDismissed: true });
  }, []);

  const handleDismissEstimateHint = useCallback(async () => {
    setEstimateHintDismissed(true);
    const cache = await getUIHintsCache();
    await saveUIHintsCache({ ...cache, unitConversionEstimateDismissed: true });
  }, []);

  // Animate in/out - elegant, fast but subtle
  useEffect(() => {
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

  // Pre-calculate all conversions when opened
  useEffect(() => {
    if (visible) {
      setSelectedUnit(null);
      setShowEstimations(false);
      setIsLoadingEstimations(false);
      activeTabIndex.value = 0;
      contentTranslateX.value = 0;

      const allUnits = getAllConvertibleUnits();
      const direct: ConversionItem[] = [];
      const estimation: ConversionItem[] = [];

      // Split units and pre-calculate direct conversions
      // Use Promise.all to handle async conversions
      const processConversions = async () => {
        for (const unit of allUnits) {
          if (canConvertViaLookup(originalUnit, unit.id)) {
            const result = await convertUnit(originalAmount, originalUnit, unit.id, ingredientName);
            direct.push({
              unit,
              amount: result.amount,
              isEstimated: result.isEstimated,
            });
          } else {
            estimation.push({ unit, amount: 0, isEstimated: true });
          }
        }
        setDirectConversions(direct);
        setEstimationConversions(estimation);
      };

      processConversions();
    }
  }, [visible, originalAmount, originalUnit, ingredientName, activeTabIndex, contentTranslateX]);

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

  const handleUnitSelect = useCallback((item: ConversionItem) => {
    setSelectedUnit(item.unit.id);

    // If it's an estimation, we need to calculate it
    if (item.isEstimated && item.amount === 0) {
      setIsLoadingEstimations(true);
      convertUnit(originalAmount, originalUnit, item.unit.id, ingredientName)
        .then((result) => {
          if (result && typeof result.amount === 'number') {
            setEstimationConversions((prev) =>
              prev.map((c) =>
                c.unit.id === item.unit.id ? { ...c, amount: result.amount } : c
              )
            );
          }
        })
        .catch((error) => {
          console.error('Conversion error:', error);
        })
        .finally(() => {
          setIsLoadingEstimations(false);
        });
    }
  }, [originalAmount, originalUnit, ingredientName]);

  const handleApply = useCallback(() => {
    const conversions = showEstimations ? estimationConversions : directConversions;
    const selected = conversions.find((c) => c.unit.id === selectedUnit);
    if (selected && selected.amount !== 0) {
      onConvert(selected.amount, selectedUnit!);
      handleClose();
    }
  }, [directConversions, estimationConversions, selectedUnit, showEstimations, onConvert, handleClose]);

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

  // Horizontal swipe gesture for tab switching with finger tracking
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      contextX.current = contentTranslateX.value;
    })
    .onUpdate((event) => {
      const newTranslateX = contextX.current + event.translationX;
      const maxTranslate = 0;
      const minTranslate = -SCREEN_WIDTH;
      contentTranslateX.value = Math.max(minTranslate, Math.min(maxTranslate, newTranslateX));
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const currentOffset = -contentTranslateX.value;
      const currentIndex = Math.round(currentOffset / SCREEN_WIDTH);

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

      contentTranslateX.value = withSpring(-newIndex * SCREEN_WIDTH, SPRING_CONFIG);
      activeTabIndex.value = newIndex;
      runOnJS(setShowEstimations)(newIndex === 1);
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Animated pill style for tab indicator (like recipe detail screen)
  const tabPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(activeTabIndex.value * (SCREEN_WIDTH - spacing.lg * 2) / 2, SPRING_CONFIG) }],
  }));

  // Content sliding animation
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: contentTranslateX.value }],
  }));



  // Get selected conversion for apply button
  const selectedConversion = useMemo(() => {
    const conversions = showEstimations ? estimationConversions : directConversions;
    return conversions.find((c) => c.unit.id === selectedUnit);
  }, [selectedUnit, showEstimations, directConversions, estimationConversions]);

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
        },
        handle: {
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.borderPrimary,
          alignSelf: 'center',
          marginTop: spacing.sm,
          marginBottom: spacing.sm,
        },
        header: {
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSecondary,
        },
        headerTop: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.sm,
        },
        title: {
          ...typography.headline,
          color: colors.textPrimary,
          fontWeight: '600',
          fontSize: 17,
        },
        closeButton: {
          padding: spacing.xs,
        },
        originalDisplay: {
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: spacing.xs,
          flexWrap: 'wrap',
        },
        originalAmount: {
          ...typography.title3,
          color: colors.textPrimary,
          fontWeight: '700',
        },
        originalUnit: {
          ...typography.body,
          color: colors.accent,
          fontWeight: '600',
          textTransform: 'lowercase',
        },
        originalDot: {
          ...typography.body,
          color: colors.textTertiary,
          fontWeight: '400',
        },
        originalIngredient: {
          ...typography.body,
          color: colors.textSecondary,
          fontWeight: '500',
          fontStyle: 'italic',
        },
        categoryToggle: {
          flexDirection: 'row',
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.pill,
          padding: 4,
          marginHorizontal: spacing.lg,
          marginVertical: spacing.sm,
          position: 'relative',
        },
        categoryTogglePill: {
          position: 'absolute',
          top: 4,
          bottom: 4,
          width: (SCREEN_WIDTH - spacing.lg * 2 - 8) / 2,
          backgroundColor: colors.surfacePrimary,
          borderRadius: radius.pill,
          ...shadows.sm,
        },
        categoryToggleButton: {
          flex: 1,
          paddingVertical: 8,
          paddingHorizontal: spacing.sm,
          borderRadius: radius.pill,
          alignItems: 'center',
          zIndex: 1,
        },
        categoryToggleText: {
          ...typography.caption,
          color: colors.textSecondary,
          fontWeight: '500',
        },
        categoryToggleTextActive: {
          color: colors.textPrimary,
          fontWeight: '600',
        },
        contentContainer: {
          flex: 1,
          flexDirection: 'row',
          width: SCREEN_WIDTH * 2,
        },
        contentTab: {
          width: SCREEN_WIDTH,
          paddingHorizontal: spacing.lg,
        },
        unitsList: {
          paddingBottom: spacing.lg,
        },
        unitRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 10,
          paddingHorizontal: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSecondary,
        },
        unitRowSelected: {
          backgroundColor: colors.accent + '08',
          marginHorizontal: -spacing.lg,
          paddingHorizontal: spacing.lg + spacing.sm,
        },
        unitInfo: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          flex: 1,
        },
        unitSymbol: {
          ...typography.subheadline,
          color: colors.textPrimary,
          fontWeight: '600',
          minWidth: 40,
        },
        unitName: {
          ...typography.footnote,
          color: colors.textSecondary,
        },
        unitRight: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        convertedAmount: {
          ...typography.subheadline,
          color: colors.textPrimary,
          fontWeight: '500',
          minWidth: 60,
          textAlign: 'right',
        },
        convertedAmountSelected: {
          color: colors.accent,
          fontWeight: '600',
        },
        badge: {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          minWidth: 36,
          alignItems: 'center',
        },
        badgeText: {
          ...typography.caption2,
          fontWeight: '600',
        },
        directBadge: {
          backgroundColor: colors.success + '15',
        },
        directText: {
          color: colors.success,
        },
        estimatedBadge: {
          backgroundColor: colors.warning + '15',
        },
        estimatedText: {
          color: colors.warning,
        },
        hintContainer: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.surfaceSecondary,
          marginHorizontal: spacing.lg,
          marginBottom: spacing.sm,
          borderRadius: radius.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        hintText: {
          ...typography.caption,
          color: colors.textSecondary,
          flex: 1,
        },
        hintDismissButton: {
          padding: spacing.xs,
        },
        footer: {
          padding: spacing.md,
          paddingBottom: spacing.lg,
          borderTopWidth: 1,
          borderTopColor: colors.borderSecondary,
          backgroundColor: colors.backgroundGrouped,
        },
        applyButton: {
          backgroundColor: colors.accent,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
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
        loadingText: {
          ...typography.caption,
          color: colors.textSecondary,
        },
      }),
    [colors, spacing, radius, typography, shadows]
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
              <View style={styles.headerTop}>
                <Text style={styles.title}>Convert Unit</Text>
                <Pressable onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </Pressable>
              </View>
              <View style={styles.originalDisplay}>
                <Text style={styles.originalAmount}>{formatConvertedAmount(originalAmount)}</Text>
                <Text style={styles.originalUnit}>{originalUnit}</Text>
                <Text style={styles.originalDot}>·</Text>
                <Text style={styles.originalIngredient}>{ingredientName}</Text>
              </View>
            </View>

            {/* Category Toggle */}
            <View style={styles.categoryToggle}>
              <Animated.View style={[styles.categoryTogglePill, tabPillStyle]} />
              <Pressable
                onPress={() => {
                  setShowEstimations(false);
                  activeTabIndex.value = 0;
                  contentTranslateX.value = withSpring(0, SPRING_CONFIG);
                }}
                style={styles.categoryToggleButton}
              >
                <Text
                  style={[
                    styles.categoryToggleText,
                    !showEstimations && styles.categoryToggleTextActive,
                  ]}
                >
                  Direct ({directConversions.length})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowEstimations(true);
                  activeTabIndex.value = 1;
                  contentTranslateX.value = withSpring(-SCREEN_WIDTH, SPRING_CONFIG);
                }}
                style={styles.categoryToggleButton}
              >
                <Text
                  style={[
                    styles.categoryToggleText,
                    showEstimations && styles.categoryToggleTextActive,
                  ]}
                >
                  Estimate ({estimationConversions.length})
                </Text>
              </Pressable>
            </View>

            {/* Content */}
            <GestureDetector gesture={swipeGesture}>
              <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
                {/* Direct Tab */}
                <View style={styles.contentTab}>
                  {!directHintDismissed && (
                    <Pressable onPress={handleDismissDirectHint} style={styles.hintContainer}>
                      <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.hintText}>Tap a unit to convert using standard conversion rates</Text>
                      <View style={styles.hintDismissButton}>
                        <Ionicons name="close" size={14} color={colors.textTertiary} />
                      </View>
                    </Pressable>
                  )}
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.unitsList}>
                      {directConversions.map((item) => {
                        const isSelected = selectedUnit === item.unit.id;

                        return (
                          <Pressable
                            key={item.unit.id}
                            onPress={() => handleUnitSelect(item)}
                            style={[
                              styles.unitRow,
                              isSelected && styles.unitRowSelected,
                            ]}
                          >
                            <View style={styles.unitInfo}>
                              <Text style={styles.unitSymbol}>{item.unit.symbol}</Text>
                              <Text style={styles.unitName}>{item.unit.name}</Text>
                            </View>
                            <View style={styles.unitRight}>
                              <Text style={[
                                styles.convertedAmount,
                                isSelected && styles.convertedAmountSelected,
                              ]}>
                                {formatConvertedAmount(item.amount)}
                              </Text>
                              <View style={[styles.badge, styles.directBadge]}>
                                <Text style={[styles.badgeText, styles.directText]}>Direct</Text>
                              </View>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                {/* Estimate Tab */}
                <View style={styles.contentTab}>
                  {!estimateHintDismissed && (
                    <Pressable onPress={handleDismissEstimateHint} style={styles.hintContainer}>
                      <Ionicons name="sparkles-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.hintText}>Tap a unit to have AI estimate the conversion for this ingredient</Text>
                      <View style={styles.hintDismissButton}>
                        <Ionicons name="close" size={14} color={colors.textTertiary} />
                      </View>
                    </Pressable>
                  )}
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.unitsList}>
                      {estimationConversions.map((item) => {
                        const isSelected = selectedUnit === item.unit.id;
                        const isLoading = isLoadingEstimations && isSelected && item.amount === 0;

                        return (
                          <Pressable
                            key={item.unit.id}
                            onPress={() => handleUnitSelect(item)}
                            style={[
                              styles.unitRow,
                              isSelected && styles.unitRowSelected,
                            ]}
                          >
                            <View style={styles.unitInfo}>
                              <Text style={styles.unitSymbol}>{item.unit.symbol}</Text>
                              <Text style={styles.unitName}>{item.unit.name}</Text>
                            </View>
                            <View style={styles.unitRight}>
                              {isLoading ? (
                                <Text style={styles.loadingText}>...</Text>
                              ) : (
                                <>
                                  {(item.amount !== 0 || isSelected) && (
                                    <Text style={[
                                      styles.convertedAmount,
                                      isSelected && styles.convertedAmountSelected,
                                    ]}>
                                      {item.amount !== 0 ? formatConvertedAmount(item.amount) : '—'}
                                    </Text>
                                  )}
                                  <View style={[styles.badge, styles.estimatedBadge]}>
                                    <Text style={[styles.badgeText, styles.estimatedText]}>Est.</Text>
                                  </View>
                                </>
                              )}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              </Animated.View>
            </GestureDetector>

            {/* Footer */}
            <View style={styles.footer}>
              <Pressable
                onPress={handleApply}
                disabled={!selectedConversion || selectedConversion.amount === 0}
                style={[
                  styles.applyButton,
                  (!selectedConversion || selectedConversion.amount === 0) && styles.applyButtonDisabled,
                ]}
              >
                <Text style={styles.applyButtonText}>
                  {selectedConversion && selectedConversion.amount !== 0
                    ? `Convert to ${formatConvertedAmount(selectedConversion.amount)} ${selectedConversion.unit.symbol}`
                    : 'Select a unit'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </GestureHandlerRootView>
  </Modal>
  );
}
