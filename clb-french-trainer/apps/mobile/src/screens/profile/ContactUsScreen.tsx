import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../components/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    // no-op
  }
}

export function ContactUsScreen() {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.title}>Contact Us</Text>
          <Text style={styles.subtitle}>Reach support for account, billing, or learning issues.</Text>

          <Pressable style={styles.item} onPress={() => void openUrl('mailto:support@newtonimmigration.org')}>
            <Text style={styles.itemTitle}>📧 Email Support</Text>
            <Text style={styles.itemMeta}>support@newtonimmigration.org</Text>
          </Pressable>

          <Pressable style={styles.item} onPress={() => void openUrl('mailto:franco@newtonimmigration.org')}>
            <Text style={styles.itemTitle}>🏢 Admin Contact</Text>
            <Text style={styles.itemMeta}>franco@newtonimmigration.org</Text>
          </Pressable>

          <Pressable style={styles.item} onPress={() => void openUrl('https://newtonimmigration.org')}>
            <Text style={styles.itemTitle}>🌐 Website</Text>
            <Text style={styles.itemMeta}>newtonimmigration.org</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md },
  title: { ...typography.heading2, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  item: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  itemTitle: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: 2 },
  itemMeta: { ...typography.caption, color: colors.textSecondary }
});
