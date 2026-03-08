import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../components/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const NEWTON_PHONE = '6046535031';
const NEWTON_EMAIL = 'newtonimmigration@gmail.com';
const NEWTON_WEBSITE_LABEL = 'www.newtonimmigration.com';
const NEWTON_WEBSITE_URL = 'https://www.newtonimmigration.com';

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    // no-op
  }
}

export function ImmigrationServicesScreen() {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.title}>Immigration Services</Text>
          <Text style={styles.subtitle}>Support for pathways, documentation, and settlement planning.</Text>

          <View style={styles.serviceItem}>
            <Text style={styles.serviceTitle}>✅ Consultation and profile review</Text>
            <Text style={styles.serviceMeta}>Assess options and timeline based on your case.</Text>
          </View>
          <View style={styles.serviceItem}>
            <Text style={styles.serviceTitle}>✅ Application guidance</Text>
            <Text style={styles.serviceMeta}>Document checklist and process support.</Text>
          </View>
          <View style={styles.serviceItem}>
            <Text style={styles.serviceTitle}>✅ Language score strategy</Text>
            <Text style={styles.serviceMeta}>CLB/TEF target planning aligned to your profile.</Text>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Newton Immigration Contact</Text>
            <Text style={styles.contactMeta}>Phone: {NEWTON_PHONE}</Text>
            <Text style={styles.contactMeta}>Email: {NEWTON_EMAIL}</Text>
            <Text style={styles.contactMeta}>Website: {NEWTON_WEBSITE_LABEL}</Text>

            <View style={styles.actionsRow}>
              <Pressable style={styles.actionBtn} onPress={() => void openUrl(`tel:${NEWTON_PHONE}`)}>
                <Text style={styles.actionBtnText}>Call</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => void openUrl(`mailto:${NEWTON_EMAIL}`)}>
                <Text style={styles.actionBtnText}>Email</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => void openUrl(NEWTON_WEBSITE_URL)}>
                <Text style={styles.actionBtnText}>Website</Text>
              </Pressable>
            </View>
          </View>
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
  serviceItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: spacing.sm,
    marginBottom: spacing.sm
  },
  serviceTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  serviceMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  contactCard: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    marginTop: spacing.sm
  },
  contactTitle: { ...typography.bodyStrong, color: colors.primary, marginBottom: spacing.xs },
  contactMeta: { ...typography.caption, color: colors.textPrimary, marginBottom: 2 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  actionBtnText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
