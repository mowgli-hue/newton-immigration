import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { SubscriptionStatusBadge } from '../components/SubscriptionStatusBadge';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import type { ProfileStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileScreen'>;

export function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { subscriptionProfile } = useSubscription();
  const [loading, setLoading] = useState(false);

  const emailVerificationStatus = useMemo(() => {
    if (!user) return 'Not available';
    return user.emailVerified ? 'Verified' : 'Verification pending';
  }, [user]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Card>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>🍁</Text>
            </View>
            <Text style={styles.brandName}>FRANCO</Text>
          </View>

          <Text style={styles.title}>Profile</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email ?? 'Not available'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email verification</Text>
            <Text style={styles.value}>{emailVerificationStatus}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Subscription</Text>
            <SubscriptionStatusBadge profile={subscriptionProfile} compact />
          </View>

          <View style={styles.quickLinksCard}>
            <Text style={styles.quickLinksTitle}>More</Text>

            <Pressable
              onPress={() => navigation.navigate('SubscriptionScreen')}
              style={({ pressed }) => [styles.linkRow, pressed && styles.toggleRowPressed]}
            >
              <Text style={styles.linkText}>💳 Subscription</Text>
              <Text style={styles.linkArrow}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('ImmigrationServicesScreen')}
              style={({ pressed }) => [styles.linkRow, pressed && styles.toggleRowPressed]}
            >
              <Text style={styles.linkText}>🧾 Immigration Services</Text>
              <Text style={styles.linkArrow}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('ContactUsScreen')}
              style={({ pressed }) => [styles.linkRow, pressed && styles.toggleRowPressed]}
            >
              <Text style={styles.linkText}>📞 Contact Us</Text>
              <Text style={styles.linkArrow}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('PrivacyPolicyScreen')}
              style={({ pressed }) => [styles.linkRow, pressed && styles.toggleRowPressed]}
            >
              <Text style={styles.linkText}>🔒 Privacy Policy</Text>
              <Text style={styles.linkArrow}>›</Text>
            </Pressable>
          </View>
          <Button label="Logout" onPress={handleLogout} loading={loading} />
          <Text style={styles.poweredBy}>Powered by Jungle Labs</Text>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl
  },
  container: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center'
  },
  title: {
    ...typography.heading2,
    marginBottom: spacing.lg
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs
  },
  brandMarkText: {
    fontSize: 14
  },
  brandName: {
    ...typography.bodyStrong,
    color: colors.primary,
    letterSpacing: 1.2
  },
  row: {
    marginBottom: spacing.lg
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  value: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  toggleRowPressed: {
    opacity: 0.9
  },
  quickLinksCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    padding: spacing.sm,
    marginBottom: spacing.lg
  },
  quickLinksTitle: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  linkRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  linkText: {
    ...typography.body,
    color: colors.textPrimary
  },
  linkArrow: {
    ...typography.bodyStrong,
    color: colors.primary
  },
  poweredBy: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md
  }
});
