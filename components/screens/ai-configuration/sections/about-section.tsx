import { Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { APP_NAME } from '@/constants/app';

/**
 * AboutSection - Displays information about the BYOK model
 */
export function AboutSection() {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text
        style={{
          ...typography.footnote,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          marginBottom: spacing.sm,
          marginLeft: spacing.md,
        }}
      >
        About
      </Text>
      <Text
        style={{
          ...typography.callout,
          color: colors.textSecondary,
          lineHeight: 20,
        }}
      >
        {APP_NAME} uses a Bring Your Own Key (BYOK) model. Your API keys are stored securely on
        your device using hardware encryption and never sent to our servers. You are responsible
        for API costs based on your usage.
      </Text>
    </View>
  );
}
