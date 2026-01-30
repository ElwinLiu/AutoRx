import React from 'react';
import { Platform } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { NativeBlurBackground, isBlurAvailable } from '@/components/native/native-blur';

export function useNativeTabBarOptions() {
  const { colors } = useAppTheme();

  return {
    headerShown: false,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.textTertiary,
    tabBarStyle: [
      { borderTopColor: colors.borderPrimary },
      Platform.OS === 'ios'
        ? { backgroundColor: 'transparent', position: 'absolute' }
        : { backgroundColor: colors.surfacePrimary },
    ],
    tabBarBackground:
      Platform.OS === 'ios' && isBlurAvailable
        ? () => <NativeBlurBackground fallbackColor={colors.surfacePrimary} />
        : undefined,
  };
}
