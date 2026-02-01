import React, { useState, useRef, useEffect } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Animated,
  Easing,
  LayoutAnimation,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAppTheme } from '@/hooks/use-app-theme';
import { PROVIDERS } from '@/lib/ai/settings';
import { ProviderIcon } from './provider-icon';
import type { ProviderItemProps } from '../types';

/**
 * ProviderItem - An expandable list item for configuring an AI provider
 *
 * Features:
 * - Enhanced visual design with animated interactions
 * - Smooth expand/collapse animations using LayoutAnimation
 * - Press feedback animations
 * - Improved input and button styling
 */
export function ProviderItem({
  provider,
  isExpanded,
  isVerified,
  isVerifying,
  apiKey,
  verificationError,
  onToggle,
  onApiKeyChange,
  onVerify,
  onRemove,
}: ProviderItemProps) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const providerConfig = PROVIDERS[provider];

  // Animation values for chevron rotation
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Configure layout animation
    LayoutAnimation.configureNext({
      duration: 200,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

    // Chevron rotation animation
    Animated.timing(rotateAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotateAnimation]);

  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    onToggle();
  };

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderColor: colors.borderSecondary,
      }}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor: isPressed ? colors.surfaceSecondary : 'transparent',
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.lg,
              backgroundColor: colors.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ProviderIcon provider={provider} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
              {providerConfig.name}
            </Text>
            <Text
              style={{ ...typography.footnote, color: colors.textSecondary }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {isVerified ? 'API key configured' : providerConfig.description}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: 48, justifyContent: 'flex-end' }}>
          {isVerified && (
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          )}
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.textTertiary}
            />
          </Animated.View>
        </View>
      </Pressable>

      {isExpanded && (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
          {isVerified ? (
            <VerifiedState provider={provider} onRemove={onRemove} />
          ) : (
            <ApiKeyInput
              provider={provider}
              apiKey={apiKey}
              isVerifying={isVerifying}
              verificationError={verificationError}
              onApiKeyChange={onApiKeyChange}
              onVerify={onVerify}
            />
          )}
        </View>
      )}
    </View>
  );
}

/**
 * VerifiedState - Shows when a provider is already configured
 */
function VerifiedState({
  onRemove,
}: {
  provider: string;
  onRemove: () => void;
}) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
          padding: spacing.md,
          backgroundColor: colors.success + '10',
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.success + '20',
        }}
      >
        <Ionicons name="shield-checkmark" size={20} color={colors.success} />
        <Text style={{ ...typography.body, color: colors.success, fontWeight: '500' }}>
          API Key Verified
        </Text>
      </View>
      <Pressable
        onPress={onRemove}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          backgroundColor: isPressed ? colors.error + '15' : colors.surfaceSecondary,
          borderRadius: radius.md,
        }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
        <Text style={{ ...typography.body, color: colors.error, fontWeight: '500' }}>
          Remove API Key
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * ApiKeyInput - Input form for entering and verifying API keys
 */
function ApiKeyInput({
  provider,
  apiKey,
  isVerifying,
  verificationError,
  onApiKeyChange,
  onVerify,
}: {
  provider: string;
  apiKey: string;
  isVerifying: boolean;
  verificationError: string | null;
  onApiKeyChange: (value: string) => void;
  onVerify: () => void;
}) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const [showApiKey, setShowApiKey] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const providerName = PROVIDERS[provider as keyof typeof PROVIDERS]?.name ?? provider;
  const isDisabled = !apiKey.trim() || isVerifying;

  return (
    <View>
      {/* Input Container */}
      <View
        style={{
          marginBottom: spacing.md,
        }}
      >
        <Text
          style={{
            ...typography.footnote,
            color: colors.textSecondary,
            marginBottom: spacing.xs,
            marginLeft: spacing.xs,
          }}
        >
          API Key
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.md,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceSecondary,
            borderWidth: 1,
            borderColor: verificationError ? colors.error : 'transparent',
          }}
        >
          <Ionicons name="key-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={{
              flex: 1,
              height: 48,
              color: colors.textPrimary,
              ...typography.body,
            }}
            placeholder={`Enter ${providerName} API key`}
            placeholderTextColor={colors.textTertiary}
            value={apiKey}
            onChangeText={onApiKeyChange}
            secureTextEntry={!showApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={() => setShowApiKey(!showApiKey)}
            style={{
              padding: spacing.xs,
            }}
          >
            <Ionicons
              name={showApiKey ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      {/* Error Message */}
      {verificationError && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            marginBottom: spacing.md,
            padding: spacing.sm,
            backgroundColor: colors.error + '10',
            borderRadius: radius.sm,
          }}
        >
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text
            style={{
              ...typography.caption,
              color: colors.error,
              flex: 1,
            }}
          >
            {verificationError}
          </Text>
        </View>
      )}

      {/* Verify Button */}
      <Pressable
        onPress={onVerify}
        disabled={isDisabled}
        onPressIn={() => !isDisabled && setIsButtonPressed(true)}
        onPressOut={() => setIsButtonPressed(false)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          height: 48,
          borderRadius: radius.md,
          backgroundColor: isDisabled
            ? colors.surfaceSecondary
            : isButtonPressed
              ? colors.accentHover
              : colors.accent,
          opacity: isDisabled ? 0.7 : 1,
        }}
      >
        {isVerifying ? (
          <ActivityIndicator size="small" color={colors.textInverted} />
        ) : (
          <>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={isDisabled ? colors.textSecondary : colors.textInverted}
            />
            <Text
              style={{
                ...typography.body,
                color: isDisabled ? colors.textSecondary : colors.textInverted,
                fontWeight: '600',
              }}
            >
              Verify & Save
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
