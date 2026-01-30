import React, { useMemo } from 'react';
import { Platform } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { NativeBlurBackground, isBlurAvailable } from '@/components/native/native-blur';

type HeaderOptionsArgs = {
  title: string;
  headerRight?: () => React.ReactNode;
};

export function useNativeHeaderOptions() {
  const { colors } = useAppTheme();

  return useMemo(
    () => ({
      buildOptions: ({ title, headerRight }: HeaderOptionsArgs) => ({
        title,
        headerTintColor: colors.textPrimary,
        headerStyle: { backgroundColor: colors.backgroundSecondary },
        headerBackground:
          Platform.OS === 'ios' && isBlurAvailable
            ? () => <NativeBlurBackground fallbackColor={colors.surfacePrimary} />
            : undefined,
        headerRight,
      }),
    }),
    [colors]
  );
}
