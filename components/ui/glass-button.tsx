import React, { useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/use-app-theme';

const BUTTON_SPRING_CONFIG = {
  damping: 12,
  stiffness: 300,
  mass: 0.6,
};

const LIQUID_GLASS_CONFIG = {
  scaleUp: 1.25,
  scaleOvershoot: 0.92,
  brightness: 1.3,
};

type GlassButtonVariant = 'icon' | 'text' | 'label';

type GlassButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: GlassButtonVariant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  animated?: boolean;
};

export function GlassButton({
  children,
  onPress,
  variant = 'icon',
  style,
  disabled = false,
  animated = true,
}: GlassButtonProps) {
  const { colors, radius, shadows } = useAppTheme();
  const scaleValue = useSharedValue(1);
  const brightnessValue = useSharedValue(1);

  const handlePressIn = () => {
    if (!animated) return;
    scaleValue.value = withSpring(LIQUID_GLASS_CONFIG.scaleUp, {
      ...BUTTON_SPRING_CONFIG,
      damping: 12,
      stiffness: 350,
    });
    brightnessValue.value = withSpring(LIQUID_GLASS_CONFIG.brightness, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    if (!animated) return;
    scaleValue.value = withSequence(
      withSpring(LIQUID_GLASS_CONFIG.scaleOvershoot, {
        ...BUTTON_SPRING_CONFIG,
        damping: 12,
        stiffness: 400,
      }),
      withSpring(1, {
        ...BUTTON_SPRING_CONFIG,
        damping: 14,
        stiffness: 280,
      })
    );
    brightnessValue.value = withSpring(1, {
      damping: 12,
      stiffness: 250,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: brightnessValue.value,
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfacePrimary,
          borderColor: colors.borderPrimary,
          borderWidth: 1,
          borderRadius: radius.md,
          ...shadows.sm,
        },
        icon: {
          width: 40,
          height: 40,
        },
        text: {
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        label: {
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        pressed: {
          opacity: 0.7,
        },
      }),
    [colors, radius, shadows]
  );

  if (variant === 'label' || disabled) {
    return <View style={[styles.base, styles[variant], style]}>{children}</View>;
  }

  if (animated) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.base, styles[variant], animatedStyle, style]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}
