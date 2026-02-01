import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAppTheme } from '@/hooks/use-app-theme';
import { PROVIDERS } from '@/lib/ai/settings';
import type { ProviderId, FetchedModel } from '@/hooks/use-ai';

type ModelRoleSelectionScreenProps = {
  model: FetchedModel;
  provider: ProviderId;
  isSaving: boolean;
  onAssignRole: (role: 'primary' | 'secondary') => Promise<void>;
};

/**
 * ModelRoleSelectionScreen - Screen to assign primary or secondary role to selected model
 *
 * Features:
 * - Display selected model info
 * - Choose between primary and secondary role
 * - Visual distinction between roles
 */
export function ModelRoleSelectionScreen({
  model,
  provider,
  isSaving,
  onAssignRole,
}: ModelRoleSelectionScreenProps) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const [selectedRole, setSelectedRole] = useState<'primary' | 'secondary' | null>(null);

  const handleAssign = async (role: 'primary' | 'secondary') => {
    setSelectedRole(role);
    await onAssignRole(role);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}>
      {/* Selected Model Info */}
      <View
        style={{
          margin: spacing.lg,
          padding: spacing.lg,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
        }}
      >
        <Text
          style={{
            ...typography.footnote,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            marginBottom: spacing.xs,
          }}
        >
          Selected Model
        </Text>
        <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
          {model.name}
        </Text>
        <Text style={{ ...typography.callout, color: colors.textSecondary, marginTop: spacing.xs }}>
          {PROVIDERS[provider].name}
        </Text>
        {model.description && (
          <Text
            style={{
              ...typography.caption,
              color: colors.textTertiary,
              marginTop: spacing.sm,
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {model.description}
          </Text>
        )}
      </View>

      {/* Role Selection */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Text
          style={{
            ...typography.footnote,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            marginBottom: spacing.sm,
            marginLeft: spacing.md,
          }}
        >
          Choose Role
        </Text>

        {/* Primary Role Option */}
        <RoleOption
          role="primary"
          title="Primary Model"
          description="Used for high-quality, complex tasks"
          icon="sparkles"
          iconColor={colors.accent}
          isSelected={selectedRole === 'primary'}
          isSaving={isSaving && selectedRole === 'primary'}
          onSelect={() => handleAssign('primary')}
        />

        {/* Secondary Role Option */}
        <RoleOption
          role="secondary"
          title="Secondary Model"
          description="Used for faster, simpler tasks"
          icon="flash"
          iconColor={colors.warning}
          isSelected={selectedRole === 'secondary'}
          isSaving={isSaving && selectedRole === 'secondary'}
          onSelect={() => handleAssign('secondary')}
        />
      </View>
    </View>
  );
}

/**
 * RoleOption - Individual role selection button
 */
function RoleOption({
  title,
  description,
  icon,
  iconColor,
  isSelected,
  isSaving,
  onSelect,
}: {
  role: 'primary' | 'secondary';
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  isSelected: boolean;
  isSaving: boolean;
  onSelect: () => void;
}) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPress={onSelect}
      disabled={isSaving}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: isPressed ? colors.surfaceSecondary : colors.backgroundSecondary,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: isSelected ? iconColor : colors.borderPrimary,
        opacity: isSaving ? 0.7 : 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: iconColor + '15',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
          {title}
        </Text>
        <Text style={{ ...typography.callout, color: colors.textSecondary }}>{description}</Text>
      </View>
      {isSaving ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}
