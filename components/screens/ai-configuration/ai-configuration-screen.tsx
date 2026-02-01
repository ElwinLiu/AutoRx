import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import {
  useAIConfiguration,
  MainView,
  ModelSelectionScreen,
  ModelRoleSelectionScreen,
} from '.';

/**
 * AIConfigurationScreen - Main screen for configuring AI providers and models
 *
 * Architecture:
 * - Uses the Container/Presentational pattern via useAIConfiguration hook
 * - Screen-level components are in ai-configuration/ folder:
 *   - components/: Reusable UI components (ProviderItem, ModelCard, etc.)
 *   - sections/: Logical groupings of components (ProviderListSection, etc.)
 *   - views/: Full-screen views (MainView, ModelSelectionView)
 *   - hooks/: Custom hooks (useAIConfiguration)
 *
 * This structure follows React Native best practices:
 * - Separation of concerns
 * - Reusable components
 * - Co-located logic in hooks
 * - Scalable folder structure
 */
export function AIConfigurationScreen() {
  const { colors, spacing, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const aiConfig = useAIConfiguration();

  const {
    isLoading,
    activeSection,
    setActiveSection,
    allAvailableModels,
    isSaving,
    selectModel,
    assignModelRole,
    selectedModel,
    settings,
  } = aiConfig;

  const styles = React.useMemo(
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
        backButton: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          ...typography.title1,
          color: colors.textPrimary,
        },
        loading: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, insets.top, spacing, typography]
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

  const getTitle = () => {
    switch (activeSection) {
      case 'modelSelection':
        return 'Select Model';
      case 'modelRoleSelection':
        return 'Assign Role';
      default:
        return 'AI Configuration';
    }
  };

  const handleBack = () => {
    if (activeSection === 'main') {
      router.back();
    } else if (activeSection === 'modelRoleSelection') {
      setActiveSection('modelSelection');
    } else {
      setActiveSection('main');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={{ width: 36 }} />
      </View>

      {activeSection === 'main' && (
        <MainView
          {...aiConfig}
          onSelectModel={() => setActiveSection('modelSelection')}
        />
      )}

      {activeSection === 'modelSelection' && (
        <ModelSelectionScreen
          models={allAvailableModels}
          isLoading={isLoading}
          onSelect={selectModel}
          primaryModel={settings?.primaryModel}
          secondaryModel={settings?.secondaryModel}
        />
      )}

      {activeSection === 'modelRoleSelection' && selectedModel && (
        <ModelRoleSelectionScreen
          model={selectedModel.model}
          provider={selectedModel.provider}
          isSaving={isSaving}
          onAssignRole={assignModelRole}
        />
      )}
    </View>
  );
}
