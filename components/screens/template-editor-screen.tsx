import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import { AIFab } from '@/components/ai/ai-fab';
import { AIBottomSheet } from '@/components/ai/ai-bottom-sheet';
import { AnimatedIconButton } from '@/components/ui/animated-icon-button';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { templateRepository } from '@/lib/repositories';
import { useDatabase } from '@/lib/db-provider';

type TemplateEditorScreenProps = {
  templateId?: string;
};

type InstructionSection = {
  id: string;
  name: string;
};

export function TemplateEditorScreen({ templateId }: TemplateEditorScreenProps) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isReady, error } = useDatabase();

  const [templateName, setTemplateName] = useState('');
  const [sections, setSections] = useState<InstructionSection[]>([
    { id: 'inst-1', name: 'Preparation' },
    { id: 'inst-2', name: 'Cooking' },
  ]);
  const [aiOpen, setAiOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch template from database using repository if editing
  useEffect(() => {
    if (isReady && templateId) {
      const fetchTemplate = async () => {
        try {
          const template = await templateRepository.getById(templateId);

          if (template) {
            setTemplateName(template.name);
            if (template.instructionSections.length > 0) {
              setSections(template.instructionSections.map((s) => ({ id: s.id, name: s.name })));
            }
          }
        } catch (err) {
          console.error('Error fetching template:', err);
        }
      };
      fetchTemplate();
    }
  }, [isReady, templateId]);

  const addSection = () => {
    setSections((prev) => [...prev, { id: `inst-${Date.now()}`, name: 'New Section' }]);
  };

  const updateSectionName = (id: string, value: string) => {
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, name: value } : section)));
  };

  const deleteSection = (id: string) => {
    setSections((prev) => prev.filter((section) => section.id !== id));
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      console.warn('Template name is required');
      return;
    }

    if (sections.length === 0) {
      console.warn('At least one section is required');
      return;
    }

    setIsSaving(true);

    try {
      // Filter out empty sections and map to proper format
      const validSections = sections
        .filter((s) => s.name.trim())
        .map((s) => ({
          // Only pass ID if it's a real database ID (not a temporary client-side ID)
          id: s.id.startsWith('inst-') ? undefined : s.id,
          name: s.name.trim(),
        }));

      if (validSections.length === 0) {
        console.warn('At least one non-empty section is required');
        setIsSaving(false);
        return;
      }

      console.log('Saving template:', {
        templateId,
        name: templateName.trim(),
        sections: validSections,
      });

      if (templateId) {
        // Update existing template
        await templateRepository.update(templateId, {
          name: templateName.trim(),
          sections: validSections,
        });
      } else {
        // Create new template
        await templateRepository.create({
          name: templateName.trim(),
          sections: validSections,
        });
      }

      router.back();
    } catch (err) {
      console.error('Error saving template:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundGrouped,
        },
        header: {
          paddingTop: insets.top,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        headerTitle: {
          ...typography.headline,
          color: colors.textPrimary,
        },
        content: {
          paddingTop: spacing.lg,
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + 120,
          gap: spacing.lg,
        },
        fieldLabel: {
          ...typography.footnote,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: spacing.sm,
        },
        input: {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          backgroundColor: colors.backgroundSecondary,
          color: colors.textPrimary,
          ...typography.body,
        },
        sectionCard: {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          backgroundColor: colors.backgroundSecondary,
          overflow: 'hidden',
        },
        sectionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderColor: colors.borderSecondary,
        },
        sectionInput: {
          flex: 1,
          color: colors.textPrimary,
          ...typography.subheadline,
        },
        addSection: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.md,
        },
        addSectionText: {
          color: colors.accent,
          ...typography.body,
          fontWeight: '600',
        },
        previewButton: {
          paddingVertical: spacing.md,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          backgroundColor: colors.backgroundSecondary,
          alignItems: 'center',
        },
        previewText: {
          color: colors.accent,
          ...typography.body,
          fontWeight: '600',
        },
      }),
    [colors, insets.bottom, insets.top, radius, spacing, typography]
  );

  if (!isReady) {
    return <LoadingScreen error={error} />;
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <AnimatedIconButton
          name="chevron-back"
          size={24}
          onPress={() => router.back()}
          variant="light"
        />
        <Text style={styles.headerTitle}>{templateId ? 'Edit Template' : 'New Template'}</Text>
        <Pressable onPress={handleSave} hitSlop={8} disabled={isSaving}>
          <Text style={{ color: isSaving ? colors.textTertiary : colors.accent, ...typography.body, fontWeight: '600' }}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.fieldLabel}>Template Name</Text>
          <TextInput
            value={templateName}
            onChangeText={setTemplateName}
            placeholder="e.g., Quick Weeknight"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Instruction Sections</Text>
          <View style={styles.sectionCard}>
            {sections.map((section, index) => {
              const isLast = index === sections.length - 1;
              return (
                <View key={section.id} style={[styles.sectionRow, isLast && { borderBottomWidth: 0 }]}>
                  <Ionicons name="reorder-three-outline" size={18} color={colors.textTertiary} />
                  <TextInput
                    value={section.name}
                    onChangeText={(value) => updateSectionName(section.id, value)}
                    placeholder="Section name"
                    placeholderTextColor={colors.textTertiary}
                    style={styles.sectionInput}
                  />
                  <Pressable onPress={() => deleteSection(section.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
              );
            })}
            <Pressable style={styles.addSection} onPress={addSection}>
              <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
              <Text style={styles.addSectionText}>Add Instruction Section</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.previewButton} onPress={() => {}}>
          <Text style={styles.previewText}>Preview Template</Text>
        </Pressable>
      </ScrollView>

      <AIFab onPress={() => setAiOpen(true)} />
      <AIBottomSheet
        visible={aiOpen}
        onClose={() => setAiOpen(false)}
        context="template"
        contextLabel={templateName ? `Template: ${templateName}` : 'New Template'}
      />
    </View>
  );
}
