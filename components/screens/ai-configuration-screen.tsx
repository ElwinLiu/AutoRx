import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useAI, type ModelConfig } from '@/hooks/use-ai';

const PROVIDER_ICONS: Record<ModelConfig['provider'], keyof typeof Ionicons.glyphMap> = {
  openai: 'logo-openai',
  anthropic: 'sparkles',
  google: 'logo-google',
  custom: 'construct',
};

const PROVIDER_LABELS: Record<ModelConfig['provider'], string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  custom: 'Custom',
};

export function AIConfigurationScreen() {
  const { colors, spacing, typography, radius } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    settings,
    isLoading,
    saveApiKey,
    savePrimaryModel,
    saveSecondaryModel,
    deleteApiKey,
    refreshSettings,
    recommendedModels,
  } = useAI();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'main' | 'primary' | 'secondary'>('main');

  useEffect(() => {
    refreshSettings();
    setApiKeyInput('');
    setActiveSection('main');
  }, [refreshSettings]);

  const handleSaveApiKey = useCallback(async () => {
    if (!apiKeyInput.trim()) return;
    setIsSaving(true);
    try {
      await saveApiKey(apiKeyInput.trim());
      setApiKeyInput('');
    } finally {
      setIsSaving(false);
    }
  }, [apiKeyInput, saveApiKey]);

  const handleDeleteApiKey = useCallback(async () => {
    setIsSaving(true);
    try {
      await deleteApiKey();
    } finally {
      setIsSaving(false);
    }
  }, [deleteApiKey]);

  const handleSelectPrimaryModel = useCallback(
    async (model: ModelConfig) => {
      setIsSaving(true);
      try {
        await savePrimaryModel(model);
        setActiveSection('main');
      } finally {
        setIsSaving(false);
      }
    },
    [savePrimaryModel]
  );

  const handleSelectSecondaryModel = useCallback(
    async (model: ModelConfig) => {
      setIsSaving(true);
      try {
        await saveSecondaryModel(model);
        setActiveSection('main');
      } finally {
        setIsSaving(false);
      }
    },
    [saveSecondaryModel]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundGrouped,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        backButton: {
          width: 36,
          height: 36,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          ...typography.title1,
          color: colors.textPrimary,
        },
        content: {
          padding: spacing.lg,
        },
        section: {
          marginBottom: spacing.lg,
        },
        sectionTitle: {
          ...typography.footnote,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          marginBottom: spacing.sm,
        },
        card: {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          overflow: 'hidden',
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderColor: colors.borderSecondary,
        },
        rowLast: {
          borderBottomWidth: 0,
        },
        rowLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        rowText: {
          flex: 1,
        },
        rowLabel: {
          ...typography.body,
          color: colors.textPrimary,
        },
        rowValue: {
          ...typography.callout,
          color: colors.textSecondary,
        },
        statusConfigured: {
          color: colors.success,
        },
        inputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          padding: spacing.lg,
        },
        input: {
          flex: 1,
          height: 44,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceSecondary,
          color: colors.textPrimary,
          ...typography.body,
        },
        inputButton: {
          width: 44,
          height: 44,
          borderRadius: radius.md,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        inputButtonDisabled: {
          backgroundColor: colors.surfaceSecondary,
        },
        modelList: {
          gap: spacing.sm,
        },
        modelCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.borderSecondary,
        },
        modelCardSelected: {
          borderColor: colors.accent,
          backgroundColor: colors.accent + '10',
        },
        modelIcon: {
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: colors.backgroundSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        modelInfo: {
          flex: 1,
        },
        modelName: {
          ...typography.body,
          color: colors.textPrimary,
          fontWeight: '600',
        },
        modelProvider: {
          ...typography.footnote,
          color: colors.textSecondary,
        },
        description: {
          ...typography.callout,
          color: colors.textSecondary,
          lineHeight: 20,
          marginBottom: spacing.lg,
        },
        loading: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, insets.top, radius, spacing, typography]
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>AI Configuration</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  // Main settings view
  if (activeSection === 'main') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>AI Configuration</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>API Key</Text>
            <View style={styles.card}>
              {settings?.apiKey ? (
                <>
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <Ionicons name="key" size={20} color={colors.success} />
                      <View style={styles.rowText}>
                        <Text style={styles.rowLabel}>API Key</Text>
                        <Text style={[styles.rowValue, styles.statusConfigured]}>
                          Configured
                        </Text>
                      </View>
                    </View>
                    <Pressable onPress={handleDeleteApiKey} disabled={isSaving}>
                      <Ionicons name="trash-outline" size={22} color={colors.error} />
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your API key"
                      placeholderTextColor={colors.textTertiary}
                      value={apiKeyInput}
                      onChangeText={setApiKeyInput}
                      secureTextEntry={!showApiKey}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Pressable onPress={() => setShowApiKey(!showApiKey)}>
                      <Ionicons
                        name={showApiKey ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>
                  <Pressable
                    style={[
                      styles.inputButton,
                      (!apiKeyInput.trim() || isSaving) && styles.inputButtonDisabled,
                      { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
                    ]}
                    onPress={handleSaveApiKey}
                    disabled={!apiKeyInput.trim() || isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color={colors.textInverted} />
                    ) : (
                      <Ionicons name="save-outline" size={20} color={colors.textInverted} />
                    )}
                  </Pressable>
                </>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Models</Text>
            <View style={styles.card}>
              <Pressable style={styles.row} onPress={() => setActiveSection('primary')}>
                <View style={styles.rowLeft}>
                  <Ionicons name="sparkles" size={20} color={colors.accent} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>Primary Model</Text>
                    <Text style={styles.rowValue}>
                      {settings?.primaryModel
                        ? `${PROVIDER_LABELS[settings.primaryModel.provider]} · ${settings.primaryModel.modelId}`
                        : 'Not configured'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </Pressable>

              <Pressable
                style={[styles.row, styles.rowLast]}
                onPress={() => setActiveSection('secondary')}
              >
                <View style={styles.rowLeft}>
                  <Ionicons name="flash" size={20} color={colors.warning} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>Secondary Model</Text>
                    <Text style={styles.rowValue}>
                      {settings?.secondaryModel
                        ? `${PROVIDER_LABELS[settings.secondaryModel.provider]} · ${settings.secondaryModel.modelId}`
                        : 'Not configured'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>
              AutoRx uses a Bring Your Own Key (BYOK) model. Your API key is stored securely on
              your device and never sent to our servers. You are responsible for API costs based
              on your usage.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Primary model selection
  if (activeSection === 'primary') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => setActiveSection('main')}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Primary Model</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.description}>
            The primary model is used for high-quality responses. Choose a capable model like
            GPT-4o or Claude 3.5 Sonnet.
          </Text>

          <View style={[styles.section, styles.modelList]}>
            {recommendedModels.primary.map((model) => {
              const isSelected = settings?.primaryModel?.modelId === model.modelId;
              return (
                <Pressable
                  key={model.modelId}
                  style={[styles.modelCard, isSelected && styles.modelCardSelected]}
                  onPress={() => handleSelectPrimaryModel(model)}
                  disabled={isSaving}
                >
                  <View style={styles.modelIcon}>
                    <Ionicons
                      name={PROVIDER_ICONS[model.provider]}
                      size={20}
                      color={colors.textPrimary}
                    />
                  </View>
                  <View style={styles.modelInfo}>
                    <Text style={styles.modelName}>{model.modelId}</Text>
                    <Text style={styles.modelProvider}>{PROVIDER_LABELS[model.provider]}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Secondary model selection
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => setActiveSection('main')}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Secondary Model</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          The secondary model is used for simpler, faster tasks. Choose a cheaper model like
          GPT-4o Mini or Claude 3.5 Haiku.
        </Text>

        <View style={[styles.section, styles.modelList]}>
          {recommendedModels.secondary.map((model) => {
            const isSelected = settings?.secondaryModel?.modelId === model.modelId;
            return (
              <Pressable
                key={model.modelId}
                style={[styles.modelCard, isSelected && styles.modelCardSelected]}
                onPress={() => handleSelectSecondaryModel(model)}
                disabled={isSaving}
              >
                <View style={styles.modelIcon}>
                  <Ionicons
                    name={PROVIDER_ICONS[model.provider]}
                    size={20}
                    color={colors.textPrimary}
                  />
                </View>
                <View style={styles.modelInfo}>
                  <Text style={styles.modelName}>{model.modelId}</Text>
                  <Text style={styles.modelProvider}>{PROVIDER_LABELS[model.provider]}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
