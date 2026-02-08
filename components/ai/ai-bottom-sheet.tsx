import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useAppTheme } from '@/hooks/use-app-theme';

type AIContext = 'recipes-list' | 'recipe-detail' | 'import' | 'settings';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type AIBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  context: AIContext;
  contextLabel?: string;
};

const suggestions: Record<AIContext, string[]> = {
  'recipe-detail': ['Halve portions', 'Make it vegan', 'Convert to metric', 'Add air fryer steps'],
  'recipes-list': ['Find recipes with chicken', 'Create from pasted text'],
  import: ['Extract ingredients', 'Format steps', 'Detect sections'],
  settings: ['Explain storage', 'Export my data', 'Help with import'],
};

export function AIBottomSheet({ visible, onClose, context, contextLabel }: AIBottomSheetProps) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderColor: colors.borderPrimary,
        },
        headerTitle: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        titleText: {
          ...typography.subheading,
          color: colors.textPrimary,
        },
        closeButton: {
          width: 32,
          height: 32,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceSecondary,
        },
        contextPill: {
          alignSelf: 'flex-start',
          marginHorizontal: spacing.lg,
          marginBottom: spacing.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: colors.tagBg,
        },
        contextText: {
          color: colors.tagText,
          ...typography.footnote,
        },
        transcript: {
          paddingHorizontal: spacing.lg,
        },
        emptyText: {
          textAlign: 'center',
          color: colors.textSecondary,
          ...typography.body,
          paddingVertical: spacing.xxl,
        },
        messageRow: {
          marginBottom: spacing.md,
          flexDirection: 'row',
        },
        messageBubble: {
          maxWidth: '80%',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.xl,
        },
        userBubble: {
          backgroundColor: colors.accent,
          marginLeft: 'auto',
        },
        assistantBubble: {
          backgroundColor: colors.surfaceSecondary,
        },
        userText: {
          color: colors.textInverted,
          ...typography.callout,
        },
        assistantText: {
          color: colors.textPrimary,
          ...typography.callout,
        },
        suggestions: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          marginTop: spacing.md,
        },
        suggestionChip: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          backgroundColor: colors.surfaceSecondary,
        },
        suggestionText: {
          color: colors.textPrimary,
          ...typography.callout,
        },
        inputRow: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: spacing.sm,
          padding: spacing.lg,
          borderTopWidth: 1,
          borderColor: colors.borderPrimary,
        },
        input: {
          flex: 1,
          minHeight: 44,
          maxHeight: 120,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceSecondary,
          color: colors.textPrimary,
          ...typography.body,
        },
        sendButton: {
          width: 44,
          height: 44,
          borderRadius: radius.pill,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, radius, spacing, typography]
  );

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I can help with that. Want me to apply these changes?' },
      ]);
      setIsLoading(false);
    }, 800);
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight={520}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Ionicons name="sparkles-outline" size={20} color={colors.aiAccent} />
          <Text style={styles.titleText}>Assistant</Text>
        </View>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      {contextLabel && (
        <View style={styles.contextPill}>
          <Text style={styles.contextText}>{contextLabel}</Text>
        </View>
      )}

      <ScrollView style={styles.transcript} contentContainerStyle={{ paddingBottom: spacing.lg }}>
        {messages.length === 0 ? (
          <>
            <Text style={styles.emptyText}>How can I help you today?</Text>
            <View style={styles.suggestions}>
              {suggestions[context]?.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => handleSuggestion(suggestion)}
                  style={({ pressed }) => [styles.suggestionChip, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          messages.map((message, index) => (
            <View
              key={`${message.role}-${index}`}
              style={[styles.messageRow, message.role === 'user' && { justifyContent: 'flex-end' }]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text style={message.role === 'user' ? styles.userText : styles.assistantText}>
                  {message.content}
                </Text>
              </View>
            </View>
          ))
        )}
        {isLoading && (
          <View style={styles.messageRow}>
            <View style={styles.messageBubble}>
              <Text style={styles.assistantText}>Thinking…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Message"
          placeholderTextColor={colors.textTertiary}
          value={input}
          onChangeText={setInput}
          style={styles.input}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Ionicons name="send" size={18} color={colors.textInverted} />
        </Pressable>
      </View>
    </BottomSheet>
  );
}
