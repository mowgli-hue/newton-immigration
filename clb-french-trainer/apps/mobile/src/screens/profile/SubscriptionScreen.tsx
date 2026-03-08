import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function SubscriptionScreen() {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.subtitle}>Manage your learning plan and premium access.</Text>

          <View style={styles.planCardCurrent}>
            <Text style={styles.planTitle}>Current Plan</Text>
            <Text style={styles.planName}>Free Starter</Text>
            <Text style={styles.planMeta}>Foundation + selected guided lessons</Text>
          </View>

          <View style={styles.planCard}>
            <Text style={styles.planTitle}>Pro Monthly</Text>
            <Text style={styles.planName}>Unlock full 8-month path</Text>
            <Text style={styles.planMeta}>A1 to CLB7 roadmap, AI checks, reports, and benchmarks</Text>
          </View>

          <View style={styles.planCard}>
            <Text style={styles.planTitle}>Pro Yearly</Text>
            <Text style={styles.planName}>Best value</Text>
            <Text style={styles.planMeta}>All premium features with annual discount</Text>
          </View>

          <View style={styles.securityCard}>
            <Text style={styles.securityTitle}>Security & Privacy</Text>
            <Text style={styles.securityLine}>• Payments will use encrypted processor checkout (PCI-compliant).</Text>
            <Text style={styles.securityLine}>• Card details will not be stored directly in app servers.</Text>
            <Text style={styles.securityLine}>• Account data is protected with access controls and audit-ready logs.</Text>
          </View>

          <View style={styles.paymentNextCard}>
            <Text style={styles.paymentNextTitle}>Next step: Payment Methods</Text>
            <Text style={styles.paymentNextLine}>We will add secure support for:</Text>
            <Text style={styles.paymentNextLine}>• Credit/Debit Cards</Text>
            <Text style={styles.paymentNextLine}>• Apple Pay / Google Pay</Text>
            <Text style={styles.paymentNextLine}>• Renewal + cancellation controls in Profile</Text>
          </View>

          <Button label="Upgrade (Coming Soon)" disabled onPress={() => undefined} />
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
  planCardCurrent: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  planCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  planTitle: { ...typography.caption, color: colors.textSecondary },
  planName: { ...typography.bodyStrong, color: colors.textPrimary, marginTop: 2 },
  planMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  securityCard: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  securityTitle: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  securityLine: {
    ...typography.caption,
    color: colors.textPrimary,
    marginBottom: 2
  },
  paymentNextCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  paymentNextTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  paymentNextLine: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2
  }
});
