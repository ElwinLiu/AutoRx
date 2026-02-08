/**
 * Development Seed Button
 *
 * Add this to a screen during development to easily reset and seed the database.
 * Remove or hide behind a dev flag before production.
 *
 * Usage:
 *   import { DevSeedButton } from '@/components/dev/dev-seed-button';
 *   // In your component:
 *   <DevSeedButton />
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { seedDatabase } from '@/scripts/seed-database';

interface DevSeedButtonProps {
  onSeedComplete?: () => void;
}

export function DevSeedButton({ onSeedComplete }: DevSeedButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSeed = useCallback(async () => {
    Alert.alert(
      'Seed Database?',
      'This will clear all existing data and insert default recipes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seed',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await seedDatabase();
              onSeedComplete?.();
              Alert.alert('Success', 'Database seeded successfully!');
            } catch (error) {
              Alert.alert('Error', `Failed to seed database: ${error}`);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [onSeedComplete]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleSeed}
        disabled={isLoading}
        style={[styles.button, isLoading && styles.buttonDisabled]}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>🌱 Seed Database</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.hint}>Tap to reset and seed with default data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: '#8E8E93',
  },
});
