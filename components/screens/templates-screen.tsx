import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import { TemplateCard } from '@/components/templates/template-card';
import { GlassButton } from '@/components/ui/glass-button';
import { SearchBar } from '@/components/ui/search-bar';
import { SettingsSheet } from '@/components/sheets/settings-sheet';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { DevSeedButton } from '@/components/dev/dev-seed-button';
import { useDatabase } from '@/lib/db-provider';
import { templateRepository } from '@/lib/repositories';
import type { Template } from '@/types/models';

export function TemplatesScreen() {
  const { colors, spacing, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isReady, error } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch templates from database using repository
  const fetchTemplates = useCallback(async () => {
    try {
      const data = await templateRepository.getAll();
      setTemplates(data);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isReady) {
      fetchTemplates();
    }
  }, [isReady, fetchTemplates]);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return templates;
    return templates.filter((template) =>
      template.name.toLowerCase().includes(query)
    );
  }, [searchQuery, templates]);

  const handleTemplatePress = useCallback(
    (template: Template) => {
      router.push({ pathname: '/template/[id]', params: { id: template.id } });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Template; index: number }) => (
      <TemplateCard template={item} index={index} onPress={() => handleTemplatePress(item)} />
    ),
    [handleTemplatePress]
  );

  const renderFooter = useCallback(
    () => (
      <View style={{ marginTop: spacing.xl }}>
        <DevSeedButton onSeedComplete={fetchTemplates} />
      </View>
    ),
    [spacing.xl, fetchTemplates]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundGrouped,
        },
        nav: {
          paddingTop: insets.top,
          paddingHorizontal: spacing.lg,
        },
        searchRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.sm,
        },
        listContent: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + 120,
          gap: spacing.md,
        },
        columnWrapper: {
          gap: spacing.md,
        },
        emptyText: {
          color: colors.textSecondary,
          ...typography.body,
        },
      }),
    [colors, insets.bottom, insets.top, spacing, typography]
  );

  if (!isReady || isLoading) {
    return <LoadingScreen error={error} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <View style={styles.searchRow}>
          <GlassButton variant="icon" onPress={() => setSettingsOpen(true)}>
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
          </GlassButton>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            returnKeyType="search"
          />
          <GlassButton variant="icon" onPress={() => router.push('/template/new')}>
            <Ionicons name="add" size={22} color={colors.textPrimary} />
          </GlassButton>
        </View>
      </View>

      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />

      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}
