import React, { useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

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

type AnimatedIconButtonProps = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  onPress?: () => void;
  variant?: 'dark' | 'light' | 'liked';
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
};

export function AnimatedIconButton({
  name,
  size = 24,
  color,
  onPress,
  variant = 'dark',
  style,
  animated = true,
}: AnimatedIconButtonProps) {
  const { colors, radius } = useAppTheme();
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

  const variantStyles = useMemo(() => {
    switch (variant) {
      case 'light':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          iconColor: colors.textPrimary,
        };
      case 'liked':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          iconColor: '#FF3B30',
        };
      case 'dark':
      default:
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          iconColor: '#FFFFFF',
        };
    }
  }, [variant, colors.textPrimary]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          width: 36,
          height: 36,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [radius.pill]
  );

  const iconColor = color || variantStyles.iconColor;

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.button,
          { backgroundColor: variantStyles.backgroundColor },
          animatedStyle,
          style,
        ]}
      >
        <Ionicons name={name} size={size} color={iconColor} />
      </Animated.View>
    </Pressable>
  );
}
