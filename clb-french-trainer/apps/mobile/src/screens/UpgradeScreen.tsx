import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useSubscription } from '../context/SubscriptionContext';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'UpgradeScreen'>;

const FEATURES = [
  'Full CLB 3-7 structured path',
  'Unlimited speaking practice',
  'Advanced pronunciation scoring',
  'Writing correction AI',
  'Mock TEF simulation mode',
  'Weekly live class access',
  'Exam strategy workshop'
];

export function UpgradeScreen({ navigation }: Props) {
  const { founderSeatsRemaining, refreshFounderSeats, setActivePlan } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planType: 'founder' | 'pro') => {
    try {
      setLoading(true);
      // Placeholder for Stripe checkout flow per plan.
      const result = await setActivePlan(planType);
      if (!result.ok) {
        if (result.reason === 'sold_out') {
          Alert.alert('Founding Member Sold Out', 'All 50 founding seats are already taken.');
        } else {
          Alert.alert('Subscription', 'Could not activate plan right now. Please try again.');
        }
        await refreshFounderSeats();
        return;
      }
      Alert.alert(
        'Subscription Active',
        planType === 'founder'
          ? 'Founding Member plan activated at $49/month.'
          : 'Franco Pro activated at $99/month.'
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#F8FAFC', '#EEF4FF', '#FFFFFF']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerWrap}>
          <Text style={styles.headline}>Continue Your Journey to CLB 5+</Text>
          <Text style={styles.subtext}>
            Foundation complete. Unlock full structured immigration performance training.
          </Text>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>What you unlock</Text>
          <View style={styles.featureList}>
            {FEATURES.map((feature) => (
              <Text key={feature} style={styles.featureItem}>
                • {feature}
              </Text>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Choose your plan</Text>

          {founderSeatsRemaining > 0 ? (
            <View style={[styles.planCard, styles.planCardFounder]}>
              <Text style={styles.planBadge}>FOUNDING MEMBER</Text>
              <Text style={styles.planTitle}>Franco Founding</Text>
              <Text style={styles.price}>$49/month</Text>
              <Text style={styles.priceMeta}>Same full Pro features. Limited to first 50 learners.</Text>
              <Text style={styles.seatMeta}>{founderSeatsRemaining} seats remaining</Text>
              <Button label="Get Founding Plan" onPress={() => void handleSubscribe('founder')} loading={loading} />
            </View>
          ) : null}

          <View style={styles.planCard}>
            <Text style={styles.planLabel}>FRANCO PRO</Text>
            <Text style={styles.planTitle}>Standard Pro</Text>
            <Text style={styles.price}>$99/month</Text>
            <Text style={styles.priceMeta}>Full structured CLB 3-7 immigration training.</Text>
            <Button label="Unlock Franco Pro" onPress={() => void handleSubscribe('pro')} loading={loading} />
          </View>

          <View style={styles.actions}>
            <Button label="Stay on Free Plan" variant="outline" onPress={() => navigation.goBack()} disabled={loading} />
          </View>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg
  },
  headerWrap: {
    marginTop: spacing.sm
  },
  headline: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  subtext: {
    ...typography.body,
    color: colors.textSecondary
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.sm
  },
  featureList: {
    gap: spacing.xs
  },
  featureItem: {
    ...typography.body,
    color: colors.textPrimary
  },
  planLabel: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700',
    marginBottom: spacing.xs
  },
  planCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  planCardFounder: {
    borderColor: '#60A5FA',
    backgroundColor: '#F3F8FF'
  },
  planBadge: {
    ...typography.caption,
    color: '#1D4ED8',
    fontWeight: '700',
    marginBottom: spacing.xs
  },
  planTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  price: {
    ...typography.heading2,
    color: colors.textPrimary
  },
  priceMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md
  },
  seatMeta: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.md
  },
  actions: {
    gap: spacing.sm
  }
});
