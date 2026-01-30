import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number;
};

export function BottomSheet({ visible, onClose, children, maxHeight }: BottomSheetProps) {
  const { colors, radius, spacing, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        overlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        },
        sheet: {
          backgroundColor: colors.surfacePrimary,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          borderTopWidth: 1,
          borderColor: colors.borderPrimary,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
          ...shadows.glass,
        },
        handle: {
          width: 36,
          height: 4,
          borderRadius: radius.pill,
          alignSelf: 'center',
          marginTop: spacing.sm,
          marginBottom: spacing.sm,
          backgroundColor: colors.textTertiary,
          opacity: 0.5,
        },
      }),
    [colors, insets.bottom, radius, shadows, spacing]
  );

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={[styles.sheet, maxHeight ? { maxHeight } : null]}>
          <View style={styles.handle} />
          {children}
        </View>
      </View>
    </Modal>
  );
}
