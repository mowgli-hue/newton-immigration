import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../components/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function PrivacyPolicyScreen() {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.updated}>Last updated: February 27, 2026</Text>

          <Text style={styles.sectionTitle}>1. Data We Collect</Text>
          <Text style={styles.body}>
            We collect account details (name, email), learning progress, lesson interactions, AI feedback history,
            and notification preferences to operate your learning journey.
          </Text>

          <Text style={styles.sectionTitle}>2. How We Use Data</Text>
          <Text style={styles.body}>
            Data is used to personalize lessons, track progression, generate study guidance, and send optional
            reminders/reports you enable in Profile.
          </Text>

          <Text style={styles.sectionTitle}>3. AI Features</Text>
          <Text style={styles.body}>
            Speaking/writing responses may be processed by AI services to return corrections and guidance. Do not
            submit sensitive personal legal information in free-text responses.
          </Text>

          <Text style={styles.sectionTitle}>4. Your Controls</Text>
          <Text style={styles.body}>
            You can update notification preferences from Profile. You can request data deletion/support by contacting
            support through the Contact Us page.
          </Text>

          <Text style={styles.sectionTitle}>5. Security</Text>
          <Text style={styles.body}>
            We apply reasonable safeguards, but no system is guaranteed 100% secure. Use strong passwords and keep
            your account credentials private.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md },
  title: { ...typography.heading2, color: colors.textPrimary, marginBottom: spacing.xs },
  updated: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  sectionTitle: { ...typography.bodyStrong, color: colors.primary, marginBottom: spacing.xs },
  body: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.md }
});
