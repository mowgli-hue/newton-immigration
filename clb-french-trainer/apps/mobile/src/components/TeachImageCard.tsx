import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = {
  title: string;
  caption: string;
  imageUri?: string;
  emoji?: string;
  accentColor?: string;
  onPress?: () => void;
};

export function TeachImageCard({ title, caption, imageUri, emoji = '📘', accentColor = '#DBEAFE', onPress }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const shouldShowImage = Boolean(imageUri) && !imageFailed;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {shouldShowImage ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" onError={() => setImageFailed(true)} />
      ) : (
        <View style={[styles.fallback, { backgroundColor: accentColor }]}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.fallbackText}>{title}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.caption}>{caption}</Text>
        <Text style={styles.hint}>Tap card to hear this in French</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden'
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  image: {
    width: '100%',
    height: 132,
    backgroundColor: '#DBEAFE'
  },
  fallback: {
    width: '100%',
    height: 132,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs
  },
  emoji: {
    fontSize: 34
  },
  fallbackText: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  caption: {
    ...typography.body,
    color: colors.textSecondary
  },
  hint: {
    ...typography.caption,
    color: '#1E3A8A'
  }
});
