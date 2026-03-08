import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { UserSubscriptionProfile } from '../navigation/routePersistence';
import { colors } from '../theme/colors';

type Props = {
  profile: UserSubscriptionProfile;
  compact?: boolean;
};

function getBadgeCopy(profile: UserSubscriptionProfile): { label: string; tone: 'free' | 'active' | 'founder' } {
  if (profile.subscriptionStatus === 'active' && profile.planType === 'founder') {
    return { label: 'Founding Member', tone: 'founder' };
  }

  if (profile.subscriptionStatus === 'active' && profile.planType === 'pro') {
    return { label: 'Franco Pro Active', tone: 'active' };
  }

  if (profile.proPreviewUsed) {
    return { label: 'Free Plan (Preview Used)', tone: 'free' };
  }

  return { label: 'Free Plan (1 Pro Preview Left)', tone: 'free' };
}

export function SubscriptionStatusBadge({ profile, compact = false }: Props) {
  const { label, tone } = getBadgeCopy(profile);

  return (
    <View
      style={[
        styles.badge,
        tone === 'free' && styles.badgeFree,
        tone === 'active' && styles.badgeActive,
        tone === 'founder' && styles.badgeFounder,
        compact && styles.badgeCompact
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === 'free' && styles.labelFree,
          tone === 'active' && styles.labelActive,
          tone === 'founder' && styles.labelFounder
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start'
  },
  badgeCompact: {
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeFree: {
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight
  },
  badgeActive: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF'
  },
  badgeFounder: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB'
  },
  label: {
    fontSize: 12,
    fontWeight: '600'
  },
  labelFree: {
    color: colors.textSecondary
  },
  labelActive: {
    color: colors.primary
  },
  labelFounder: {
    color: '#92400E'
  }
});
