import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Text,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '@/hooks/use-app-theme';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
  placeholder?: string;
}

// Simple fuzzy match - checks if characters appear in order
function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let queryIndex = 0;

  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === lowerQuery.length;
}

// Score matches for ranking (higher = better match)
function getMatchScore(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match gets highest score
  if (lowerText === lowerQuery) return 1000;

  // Starts with query gets high score
  if (lowerText.startsWith(lowerQuery)) return 500;

  // Contains query as substring
  if (lowerText.includes(lowerQuery)) return 300;

  // Fuzzy match base score
  return 100;
}

export function TagInput({ tags, onTagsChange, allTags, placeholder = 'Add tag' }: TagInputProps) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<TextInput>(null);

  // Get filtered suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) {
      // Show all unused tags when input is empty
      return allTags.filter((tag) => !tags.includes(tag)).slice(0, 8);
    }

    // Filter and sort by match quality
    const query = inputValue.trim();
    const matches = allTags
      .filter((tag) => !tags.includes(tag) && fuzzyMatch(tag, query))
      .sort((a, b) => getMatchScore(b, query) - getMatchScore(a, query));

    return matches.slice(0, 6);
  }, [inputValue, allTags, tags]);

  // Check if input is a new tag (not in allTags)
  const isNewTag = useMemo(() => {
    if (!inputValue.trim()) return false;
    return !allTags.some(
      (tag) => tag.toLowerCase() === inputValue.trim().toLowerCase()
    );
  }, [inputValue, allTags]);

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim();
      if (!trimmedTag || tags.includes(trimmedTag)) return;
      onTagsChange([...tags, trimmedTag]);
      setInputValue('');
      setSelectedIndex(-1);
      inputRef.current?.focus();
    },
    [tags, onTagsChange]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onTagsChange(tags.filter((t) => t !== tag));
    },
    [tags, onTagsChange]
  );

  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string } }) => {
      const key = e.nativeEvent.key;

      if (key === 'Backspace' && !inputValue && tags.length > 0) {
        // Remove last tag when backspace on empty input
        removeTag(tags[tags.length - 1]);
        return;
      }

      if (key === 'Enter' || key === ',') {
        e.nativeEvent.key && e.preventDefault?.();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          addTag(suggestions[selectedIndex]);
        } else if (inputValue.trim()) {
          addTag(inputValue);
        }
        return;
      }

      if (key === 'ArrowDown') {
        const maxIndex = isNewTag ? suggestions.length : suggestions.length - 1;
        setSelectedIndex((prev) => Math.min(prev + 1, maxIndex));
      } else if (key === 'ArrowUp') {
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      }
    },
    [inputValue, tags, suggestions, selectedIndex, isNewTag, addTag, removeTag]
  );

  const handleSubmit = useCallback(() => {
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      addTag(suggestions[selectedIndex]);
    } else if (inputValue.trim()) {
      addTag(inputValue);
    }
  }, [inputValue, suggestions, selectedIndex, addTag]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'relative',
        },
        inputContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: isFocused ? colors.accent : colors.borderPrimary,
          backgroundColor: colors.backgroundSecondary,
          minHeight: 48,
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
          fontWeight: '500',
        },
        input: {
          flex: 1,
          minWidth: 80,
          paddingVertical: spacing.xs,
          color: colors.textPrimary,
          ...typography.body,
        },
        dropdown: {
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: spacing.xs,
          backgroundColor: colors.surfacePrimary,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor: colors.accent,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 12,
          zIndex: 1000,
          maxHeight: 200,
          overflow: 'hidden',
        },
        suggestionItem: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.surfacePrimary,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSecondary,
        },
        suggestionItemSelected: {
          backgroundColor: colors.accent + '20',
        },
        suggestionItemFirst: {
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
        },
        suggestionItemLast: {
          borderBottomLeftRadius: radius.lg,
          borderBottomRightRadius: radius.lg,
          borderBottomWidth: 0,
        },
        collapseHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          paddingVertical: spacing.xs,
          backgroundColor: colors.surfaceSecondary,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSecondary,
        },
        collapseText: {
          color: colors.textSecondary,
          ...typography.caption,
          fontWeight: '500',
        },
        suggestionText: {
          color: colors.textPrimary,
          ...typography.body,
        },
        suggestionTextMatch: {
          color: colors.accent,
          fontWeight: '600',
        },
        newTagBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        newTagText: {
          color: colors.accent,
          ...typography.caption,
          fontWeight: '500',
        },
        emptyText: {
          color: colors.textTertiary,
          ...typography.subheadline,
          padding: spacing.md,
          textAlign: 'center',
        },
      }),
    [colors, spacing, radius, typography, isFocused]
  );

  // Highlight matching characters in suggestion
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) {
      return <Text style={styles.suggestionText}>{text}</Text>;
    }

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const elements: React.ReactNode[] = [];
    let textIndex = 0;
    let queryIndex = 0;

    while (textIndex < text.length && queryIndex < lowerQuery.length) {
      if (lowerText[textIndex] === lowerQuery[queryIndex]) {
        elements.push(
          <Text key={textIndex} style={styles.suggestionTextMatch}>
            {text[textIndex]}
          </Text>
        );
        queryIndex++;
      } else {
        elements.push(
          <Text key={textIndex} style={styles.suggestionText}>
            {text[textIndex]}
          </Text>
        );
      }
      textIndex++;
    }

    // Add remaining text
    if (textIndex < text.length) {
      elements.push(
        <Text key="remaining" style={styles.suggestionText}>
          {text.slice(textIndex)}
        </Text>
      );
    }

    return <Text>{elements}</Text>;
  };

  const showDropdown = isFocused && (suggestions.length > 0 || isNewTag || inputValue.trim());

  const collapseDropdown = useCallback(() => {
    setIsFocused(false);
    inputRef.current?.blur();
  }, []);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={styles.inputContainer}
      >
        {tags.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => removeTag(tag)}
            style={styles.tag}
          >
            <Text style={styles.tagText}>{tag}</Text>
            <Ionicons name="close" size={14} color={colors.textSecondary} />
          </Pressable>
        ))}
        <TextInput
          ref={inputRef}
          value={inputValue}
          onChangeText={(text) => {
            setInputValue(text);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow press events on dropdown items
            setTimeout(() => setIsFocused(false), 200);
          }}
          onKeyPress={handleKeyPress}
          onSubmitEditing={handleSubmit}
          placeholder={tags.length === 0 ? placeholder : ''}
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
        />
      </Pressable>

      {showDropdown && (
        <View style={styles.dropdown}>
          {/* Collapse Button Header */}
          <Pressable onPress={collapseDropdown} style={styles.collapseHeader}>
            <Text style={styles.collapseText}>Hide suggestions</Text>
            <Ionicons name="chevron-up" size={16} color={colors.textSecondary} />
          </Pressable>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((tag, index) => {
              const isFirst = index === 0;
              const isLast = !isNewTag && index === suggestions.length - 1;
              return (
                <Pressable
                  key={tag}
                  onPress={() => addTag(tag)}
                  style={[
                    styles.suggestionItem,
                    selectedIndex === index && styles.suggestionItemSelected,
                    isFirst && styles.suggestionItemFirst,
                    isLast && styles.suggestionItemLast,
                  ]}
                >
                  {renderHighlightedText(tag, inputValue)}
                </Pressable>
              );
            })}

            {isNewTag && (
              <Pressable
                onPress={() => addTag(inputValue)}
                style={[
                  styles.suggestionItem,
                  selectedIndex === suggestions.length && styles.suggestionItemSelected,
                  suggestions.length === 0 && styles.suggestionItemFirst,
                  styles.suggestionItemLast,
                ]}
              >
                <View style={styles.newTagBadge}>
                  <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
                  <Text style={styles.suggestionText}>Create &quot;{inputValue.trim()}&quot;</Text>
                </View>
                <Text style={styles.newTagText}>NEW</Text>
              </Pressable>
            )}

            {suggestions.length === 0 && !isNewTag && (
              <Text style={styles.emptyText}>Type to create a new tag</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
