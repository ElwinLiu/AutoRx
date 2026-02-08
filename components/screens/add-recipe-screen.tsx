import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import { AnimatedIconButton } from '@/components/ui/animated-icon-button';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { TagInput } from '@/components/ui/tag-input';
import { recipeRepository } from '@/lib/repositories';
import { useDatabase } from '@/lib/db-provider';
import type { InstructionSection } from '@/types/models';

type IngredientInput = {
  id: string;
  item: string;
  amount: string;
  unit: string;
};

export function AddRecipeScreen() {
  const { colors, spacing, radius, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isReady, error } = useDatabase();

  const [recipeName, setRecipeName] = useState('');
  const [time, setTime] = useState('');
  const [servings, setServings] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { id: 'ing-1', item: '', amount: '', unit: 'cup' },
  ]);
  const [instructionSections, setInstructionSections] = useState<InstructionSection[]>([
    { id: 'section-1', name: 'Instructions', steps: [] },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all tags from database
  const fetchData = useCallback(async () => {
    try {
      const tagsData = await recipeRepository.getAllTags();
      setAllTags(tagsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isReady) {
      fetchData();
    }
  }, [isReady, fetchData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        fetchData();
      }
    }, [isReady, fetchData])
  );

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: `ing-${Date.now()}`, item: '', amount: '', unit: 'cup' },
    ]);
  };

  const updateIngredient = (id: string, field: keyof IngredientInput, value: string) => {
    setIngredients((prev) =>
      prev.map((ingredient) => (ingredient.id === id ? { ...ingredient, [field]: value } : ingredient))
    );
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ingredient) => ingredient.id !== id));
  };

  const addSection = () => {
    setInstructionSections((prev) => [
      ...prev,
      { id: `section-${Date.now()}`, name: 'New Section', steps: [] },
    ]);
  };

  const updateSectionName = (sectionId: string, name: string) => {
    setInstructionSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, name } : section))
    );
  };

  const updateSectionSteps = (sectionId: string, stepsText: string) => {
    setInstructionSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, steps: stepsText.split('\n').filter((s) => s.trim()) }
          : section
      )
    );
  };

  const removeSection = (sectionId: string) => {
    setInstructionSections((prev) => prev.filter((section) => section.id !== sectionId));
  };

  const handleSave = async () => {
    if (!recipeName.trim()) {
      // Could show an alert here
      console.warn('Recipe name is required');
      return;
    }

    if (instructionSections.length === 0) {
      console.warn('At least one instruction section is required');
      return;
    }

    setIsSaving(true);

    try {
      // Parse cook time from string (e.g., "30 min" -> 30)
      const cookTimeMatch = time.match(/\d+/);
      const cookTimeMin = cookTimeMatch ? parseInt(cookTimeMatch[0], 10) : undefined;

      // Parse servings
      const servingsNum = servings ? parseFloat(servings) : undefined;

      // Filter out empty ingredients
      const validIngredients = ingredients
        .filter((ing) => ing.item.trim())
        .map((ing) => ({
          item: ing.item.trim(),
          amount: parseFloat(ing.amount) || 0,
          unit: ing.unit.trim() || 'piece',
        }));

      const sections = instructionSections
        .filter((section) => section.name.trim())
        .map((section) => ({
          name: section.name.trim(),
          content: section.steps.join('\n'),
        }));

      await recipeRepository.create({
        name: recipeName.trim(),
        cookTimeMin,
        servings: servingsNum,
        ingredients: validIngredients,
        sections,
        tags,
      });

      router.back();
    } catch (err) {
      console.error('Error saving recipe:', err);
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
        row: {
          flexDirection: 'row',
          gap: spacing.md,
        },
        ingredientRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        },
        ingredientInput: {
          flex: 1,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          backgroundColor: colors.backgroundSecondary,
          color: colors.textPrimary,
          ...typography.subheadline,
        },
        amountInput: {
          width: 80,
        },
        unitInput: {
          width: 80,
        },
        addIngredient: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.sm,
        },
        addIngredientText: {
          color: colors.accent,
          ...typography.body,
          fontWeight: '600',
        },
        sectionCard: {
          backgroundColor: colors.surfacePrimary,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
        sectionInput: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          backgroundColor: colors.backgroundSecondary,
          color: colors.textPrimary,
          ...typography.subheadline,
          marginBottom: spacing.md,
        },
        stepsInput: {
          minHeight: 120,
          textAlignVertical: 'top',
        },
        sectionActions: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        sectionHint: {
          ...typography.caption,
          color: colors.textTertiary,
        },
        removeSection: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        },
        removeSectionText: {
          color: colors.error,
          ...typography.footnote,
          fontWeight: '600',
        },
        addSection: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.sm,
        },
        addSectionText: {
          color: colors.accent,
          ...typography.body,
          fontWeight: '600',
        },
        saveButton: {
          paddingVertical: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: colors.accent,
          alignItems: 'center',
        },
        saveButtonText: {
          color: colors.textInverted,
          ...typography.body,
          fontWeight: '600',
        },
      }),
    [colors, insets.bottom, insets.top, radius, spacing, typography]
  );

  if (!isReady || isLoading) {
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
        <Text style={styles.headerTitle}>New Recipe</Text>
        <Pressable onPress={handleSave} hitSlop={8} disabled={isSaving}>
          <Text style={{ color: isSaving ? colors.textTertiary : colors.accent, ...typography.body, fontWeight: '600' }}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.fieldLabel}>Recipe Name</Text>
          <TextInput
            value={recipeName}
            onChangeText={setRecipeName}
            placeholder="e.g., Sunday Chili"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Time</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="30 min"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Servings</Text>
            <TextInput
              value={servings}
              onChangeText={setServings}
              placeholder="4"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Tags</Text>
          <TagInput
            tags={tags}
            onTagsChange={setTags}
            allTags={allTags}
            placeholder="Type to search or create tags..."
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Ingredients</Text>
          {ingredients.map((ingredient) => (
            <View key={ingredient.id} style={styles.ingredientRow}>
              <TextInput
                value={ingredient.item}
                onChangeText={(value) => updateIngredient(ingredient.id, 'item', value)}
                placeholder="Ingredient"
                placeholderTextColor={colors.textTertiary}
                style={styles.ingredientInput}
              />
              <TextInput
                value={ingredient.amount}
                onChangeText={(value) => updateIngredient(ingredient.id, 'amount', value)}
                placeholder="1"
                placeholderTextColor={colors.textTertiary}
                style={[styles.ingredientInput, styles.amountInput]}
                keyboardType="decimal-pad"
              />
              <TextInput
                value={ingredient.unit}
                onChangeText={(value) => updateIngredient(ingredient.id, 'unit', value)}
                placeholder="cup"
                placeholderTextColor={colors.textTertiary}
                style={[styles.ingredientInput, styles.unitInput]}
              />
              <Pressable onPress={() => removeIngredient(ingredient.id)}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addIngredient} onPress={addIngredient}>
            <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
            <Text style={styles.addIngredientText}>Add Ingredient</Text>
          </Pressable>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Instructions</Text>
          {instructionSections.map((section) => (
            <View key={section.id} style={styles.sectionCard}>
              <TextInput
                value={section.name}
                onChangeText={(value) => updateSectionName(section.id, value)}
                placeholder="Section Name"
                placeholderTextColor={colors.textTertiary}
                style={styles.sectionInput}
              />
              <TextInput
                value={section.steps.join('\n')}
                onChangeText={(value) => updateSectionSteps(section.id, value)}
                placeholder="Enter steps, one per line..."
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, styles.stepsInput]}
                multiline
              />
              <View style={styles.sectionActions}>
                <Text style={styles.sectionHint}>Each line will be treated as a separate step</Text>
                <Pressable onPress={() => removeSection(section.id)} style={styles.removeSection}>
                  <Text style={styles.removeSectionText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Pressable style={styles.addSection} onPress={addSection}>
            <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
            <Text style={styles.addSectionText}>Add Instruction Section</Text>
          </Pressable>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Recipe'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
