import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  SectionList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAppTheme } from '@/hooks/use-app-theme';
import { PROVIDERS } from '@/lib/ai/settings';
import { MODEL_ROLES, type ModelRole } from '@/lib/ai/constants';
import type { ProviderId, FetchedModel } from '@/hooks/use-ai';

type ModelSelectionScreenProps = {
  models: (FetchedModel & { provider: ProviderId })[];
  isLoading: boolean;
  onSelect: (model: FetchedModel, provider: ProviderId) => void;
  primaryModel?: { provider: ProviderId; modelId: string; name: string } | null;
  secondaryModel?: { provider: ProviderId; modelId: string; name: string } | null;
};

type ModelItem = FetchedModel & { provider: ProviderId };

type ModelSection = {
  title: string;
  provider: ProviderId;
  isFirst: boolean;
  data: ModelItem[];
};



function getModelRole(
  model: ModelItem,
  primaryModel: ModelSelectionScreenProps['primaryModel'],
  secondaryModel: ModelSelectionScreenProps['secondaryModel']
): ModelRole {
  const isPrimary =
    primaryModel &&
    primaryModel.provider === model.provider &&
    primaryModel.modelId === model.id;
  if (isPrimary) return MODEL_ROLES.PRIMARY;

  const isSecondary =
    secondaryModel &&
    secondaryModel.provider === model.provider &&
    secondaryModel.modelId === model.id;
  if (isSecondary) return MODEL_ROLES.SECONDARY;

  return null;
}

function sortModelsByRole(
  models: ModelItem[],
  primaryModel: ModelSelectionScreenProps['primaryModel'],
  secondaryModel: ModelSelectionScreenProps['secondaryModel']
): ModelItem[] {
  return [...models].sort((a, b) => {
    const roleA = getModelRole(a, primaryModel, secondaryModel);
    const roleB = getModelRole(b, primaryModel, secondaryModel);

    if (roleA === MODEL_ROLES.PRIMARY) return -1;
    if (roleB === MODEL_ROLES.PRIMARY) return 1;
    if (roleA === MODEL_ROLES.SECONDARY) return -1;
    if (roleB === MODEL_ROLES.SECONDARY) return 1;
    return 0;
  });
}

/**
 * ModelSelectionScreen - Full-screen model picker with search
 *
 * Features:
 * - Search through all available models
 * - Group models by provider
 * - Clean selection interface
 */
export function ModelSelectionScreen({
  models,
  isLoading,
  onSelect,
  primaryModel,
  secondaryModel,
}: ModelSelectionScreenProps) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null);
  const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false);
  const providerMenuTop = 44 + spacing.xs;

  const availableProviders = useMemo(() => {
    const providerSet = new Set<ProviderId>();
    for (const model of models) {
      providerSet.add(model.provider);
    }
    return (Object.keys(PROVIDERS) as ProviderId[]).filter((provider) => providerSet.has(provider));
  }, [models]);

  useEffect(() => {
    if (availableProviders.length === 0) {
      setSelectedProvider(null);
      return;
    }
    if (!selectedProvider || !availableProviders.includes(selectedProvider)) {
      setSelectedProvider(availableProviders[0]);
    }
  }, [availableProviders, selectedProvider]);

  useEffect(() => {
    setIsProviderMenuOpen(false);
  }, [selectedProvider]);

  const providerFilteredModels = useMemo(() => {
    if (!selectedProvider) return models;
    return models.filter((model) => model.provider === selectedProvider);
  }, [models, selectedProvider]);

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return providerFilteredModels;
    const query = searchQuery.toLowerCase();
    return providerFilteredModels.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query)
    );
  }, [providerFilteredModels, searchQuery]);

  const sections = useMemo<ModelSection[]>(() => {
    const groups: Record<ProviderId, ModelItem[]> = {
      openai: [],
      openrouter: [],
      gemini: [],
    };
    for (const model of filteredModels) {
      groups[model.provider].push(model);
    }

    // Sort each provider's models: primary first, then secondary, then others
    for (const provider of Object.keys(groups) as ProviderId[]) {
      groups[provider] = sortModelsByRole(groups[provider], primaryModel, secondaryModel);
    }

    const orderedProviders = (Object.keys(PROVIDERS) as ProviderId[]).filter(
      (provider) => groups[provider].length > 0
    );

    return orderedProviders.map((provider, index) => ({
      title: PROVIDERS[provider].name,
      provider,
      isFirst: index === 0,
      data: groups[provider],
    }));
  }, [filteredModels, primaryModel, secondaryModel]);

  const renderItem = useCallback(
    ({ item, index, section }: { item: ModelItem; index: number; section: ModelSection }) => {
      const role = getModelRole(item, primaryModel, secondaryModel);
      return (
        <ModelListItem
          model={item}
          role={role}
          isFirst={index === 0}
          isLast={index === section.data.length - 1}
          onSelect={() => onSelect(item, section.provider)}
        />
      );
    },
    [onSelect, primaryModel, secondaryModel]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: ModelSection }) => (
      <View
        style={{
          paddingTop: section.isFirst ? 0 : spacing.lg,
          paddingBottom: spacing.sm,
          backgroundColor: colors.backgroundGrouped,
        }}
      >
        <Text
          style={{
            ...typography.footnote,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            paddingHorizontal: spacing.lg,
          }}
        >
          {section.title}
        </Text>
      </View>
    ),
    [colors.backgroundGrouped, colors.textSecondary, spacing.lg, spacing.sm, typography.footnote]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundGrouped, position: 'relative' }}>
      {/* Model List */}
      {isLoading ? (
        <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text
            style={{
              ...typography.callout,
              color: colors.textSecondary,
              marginTop: spacing.md,
            }}
          >
            Loading models...
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.provider}:${item.id}`}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          style={{ zIndex: 0 }}
          ListHeaderComponent={
            <View style={{ paddingVertical: spacing.md }}>
              <View style={{ paddingHorizontal: spacing.lg }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingHorizontal: spacing.md,
                      height: 44,
                      borderRadius: radius.md,
                      backgroundColor: colors.surfaceSecondary,
                      borderWidth: 1,
                      borderColor: colors.borderSecondary,
                    }}
                  >
                    <Ionicons name="search" size={20} color={colors.textTertiary} />
                    <TextInput
                      style={{
                        flex: 1,
                        height: 44,
                        color: colors.textPrimary,
                        ...typography.body,
                      }}
                      placeholder="Search models..."
                      placeholderTextColor={colors.textTertiary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                      <Pressable onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                      </Pressable>
                    )}
                  </View>
                  {availableProviders.length > 0 && (
                    <Pressable
                      onPress={() => setIsProviderMenuOpen((current) => !current)}
                      style={({ pressed }) => ({
                        height: 44,
                        minWidth: 120,
                        paddingHorizontal: spacing.md,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.borderSecondary,
                        backgroundColor: pressed ? colors.backgroundSecondary : colors.surfaceSecondary,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: spacing.xs,
                      })}
                    >
                      <Text
                        style={{
                          ...typography.callout,
                          color: colors.textPrimary,
                          fontWeight: '600',
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {selectedProvider ? PROVIDERS[selectedProvider].name : 'Provider'}
                      </Text>
                      <Ionicons
                        name={isProviderMenuOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textTertiary}
                      />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          }
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={8}
          stickySectionHeadersEnabled={false}
          removeClippedSubviews={false}
          ListEmptyComponent={
            <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
              <Ionicons name="cube-outline" size={48} color={colors.textTertiary} />
              <Text
                style={{
                  ...typography.callout,
                  color: colors.textSecondary,
                  marginTop: spacing.md,
                  textAlign: 'center',
                }}
              >
                {searchQuery
                  ? 'No models found matching your search'
                  : 'No models available. Configure a provider first.'}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        />
      )}

      {isProviderMenuOpen && availableProviders.length > 0 && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            right: spacing.lg,
            top: spacing.md + providerMenuTop,
            zIndex: 10,
            elevation: 10,
          }}
        >
          <View
            style={{
              minWidth: 180,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.borderPrimary,
              overflow: 'hidden',
              shadowColor: colors.textPrimary,
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            {availableProviders.map((provider, index) => {
              const isActive = provider === selectedProvider;
              return (
                <Pressable
                  key={provider}
                  onPress={() => setSelectedProvider(provider)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: pressed
                      ? colors.surfaceSecondary
                      : colors.backgroundSecondary,
                    borderBottomWidth:
                      index === availableProviders.length - 1
                        ? 0
                        : StyleSheet.hairlineWidth,
                    borderColor: colors.borderSecondary,
                  })}
                >
                  <Text
                    style={{
                      ...typography.callout,
                      color: colors.textPrimary,
                      fontWeight: isActive ? '600' : '400',
                    }}
                  >
                    {PROVIDERS[provider].name}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark" size={16} color={colors.accent} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * ModelListItem - Individual model row in the list
 */
function ModelListItem({
  model,
  role,
  isFirst,
  isLast,
  onSelect,
}: {
  model: ModelItem;
  role: ModelRole;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
}) {
  const { colors, spacing, typography, radius } = useAppTheme();

  const roleLabel = role === MODEL_ROLES.PRIMARY ? 'Primary' : role === MODEL_ROLES.SECONDARY ? 'Secondary' : null;
  const roleColor = role === MODEL_ROLES.PRIMARY ? colors.accent : colors.textSecondary;

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 56,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: pressed ? colors.surfaceSecondary : colors.backgroundSecondary,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderTopWidth: isFirst ? 1 : 0,
        borderBottomWidth: isLast ? 1 : StyleSheet.hairlineWidth,
        borderColor: colors.borderPrimary,
        borderBottomColor: isLast ? colors.borderPrimary : colors.borderSecondary,
        borderTopLeftRadius: isFirst ? radius.lg : 0,
        borderTopRightRadius: isFirst ? radius.lg : 0,
        borderBottomLeftRadius: isLast ? radius.lg : 0,
        borderBottomRightRadius: isLast ? radius.lg : 0,
      })}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
            {model.name}
          </Text>
          {roleLabel && (
            <View
              style={{
                backgroundColor: role === MODEL_ROLES.PRIMARY ? `${colors.accent}20` : colors.surfaceSecondary,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs / 2,
                borderRadius: radius.sm,
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: roleColor,
                  fontWeight: '600',
                  fontSize: 11,
                }}
              >
                {roleLabel}
              </Text>
            </View>
          )}
        </View>
        {model.description && (
          <Text
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {model.description}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}
