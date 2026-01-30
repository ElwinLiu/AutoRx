import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import { AnimatedIconButton } from '@/components/ui/animated-icon-button';
import { templateRepository, recipeRepository } from '@/lib/repositories';
import type { Template } from '@/types/models';

type IngredientInput = {
  id: string;
  item: string;
  amount: string;
  unit: string;
};

const suggestedTags = ['Quick', 'Healthy', 'Spicy', 'Vegetarian', 'Dessert', 'Breakfast'];

export function AddRecipeScreen() {
  const { colors, spacing, radius, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [recipeName, setRecipeName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [time, setTime] = useState('');
  const [servings, setServings] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { id: 'ing-1', item: '', amount: '', unit: 'cup' },
  ]);
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch templates from database using repository
  const fetchTemplates = useCallback(async () => {
    try {
      const data = await templateRepository.getAll();
      setTemplates(data);
      if (data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0].name);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const addTag = (tag: string) => {
    if (!tag || tags.includes(tag)) return;
    setTags((prev) => [...prev, tag]);
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  };

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

  const handleSave = async () => {
    if (!recipeName.trim()) {
      // Could show an alert here
      console.warn('Recipe name is required');
      return;
    }

    const template = templates.find((t) => t.name === selectedTemplate);
    if (!template) {
      console.warn('Template is required');
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

      // Map instructions to template sections
      const sections = template.instructionSections.map((section) => ({
        templateSectionId: section.id,
        content: instructions,
      }));

      await recipeRepository.create({
        name: recipeName.trim(),
        templateId: template.id,
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
        templateChip: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: colors.tagBg,
          marginRight: spacing.sm,
        },
        templateChipActive: {
          backgroundColor: colors.accent,
        },
        templateText: {
          color: colors.tagText,
          ...typography.footnote,
        },
        templateTextActive: {
          color: colors.textInverted,
          fontWeight: '600',
        },
        tagRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        tag: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.tagBg,
        },
        tagText: {
          color: colors.tagText,
          ...typography.footnote,
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

        <View>
          <Text style={styles.fieldLabel}>Template</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {templates.map((template) => {
              const isActive = selectedTemplate === template.name;
              return (
                <Pressable
                  key={template.id}
                  onPress={() => setSelectedTemplate(template.name)}
                  style={[styles.templateChip, isActive && styles.templateChipActive]}
                >
                  <Text style={[styles.templateText, isActive && styles.templateTextActive]}>{template.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
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
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <Pressable key={tag} onPress={() => removeTag(tag)} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <Ionicons name="close" size={12} color={colors.textSecondary} />
              </Pressable>
            ))}
            {tags.length === 0 && (
              <Text style={{ color: colors.textTertiary, ...typography.subheadline }}>No tags yet</Text>
            )}
          </View>
          <TextInput
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Add tag"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { marginTop: spacing.sm }]}
            onSubmitEditing={() => addTag(newTag.trim())}
          />
          <View style={[styles.tagRow, { marginTop: spacing.sm }]}>
            {suggestedTags.map((tag) => (
              <Pressable key={tag} onPress={() => addTag(tag)} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </Pressable>
            ))}
          </View>
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
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Write steps here..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
            multiline
          />
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Recipe'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
