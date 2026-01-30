import React from 'react';
import { Platform, StyleSheet, UIManager, View } from 'react-native';

type NativeBlurBackgroundProps = {
  tint?: 'light' | 'dark' | 'default' | 'extraLight' | 'regular' | 'prominent' | 'systemMaterial';
  intensity?: number;
  fallbackColor: string;
};

export const isBlurAvailable =
  Platform.OS === 'ios' &&
  typeof UIManager.getViewManagerConfig === 'function' &&
  !!UIManager.getViewManagerConfig('ExpoBlurView');

export function NativeBlurBackground({
  tint = 'systemMaterial',
  intensity = 40,
  fallbackColor,
}: NativeBlurBackgroundProps) {
  if (!isBlurAvailable) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: fallbackColor }]} />;
  }

  const { BlurView } = require('expo-blur') as typeof import('expo-blur');
  return <BlurView tint={tint} intensity={intensity} style={StyleSheet.absoluteFill} />;
}
