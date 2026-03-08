import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext';
import {
  loadUserSubscriptionProfile,
  saveUserSubscriptionProfile,
  type UserSubscriptionProfile
} from '../navigation/routePersistence';
import { fetchFounderSeatsRemaining, reserveFounderSeat } from '../services/subscription/subscriptionService';

type SubscriptionContextValue = {
  subscriptionProfile: UserSubscriptionProfile;
  founderSeatsRemaining: number;
  loading: boolean;
  canAccessProLesson: boolean;
  markProPreviewUsed: () => Promise<void>;
  setActivePlan: (planType: 'founder' | 'pro') => Promise<{ ok: boolean; reason?: string }>;
  refreshFounderSeats: () => Promise<void>;
};

const DEFAULT_PROFILE: UserSubscriptionProfile = {
  subscriptionStatus: 'free',
  planType: 'free',
  proPreviewUsed: false
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscriptionProfile, setSubscriptionProfileState] = useState<UserSubscriptionProfile>(DEFAULT_PROFILE);
  const [founderSeatsRemaining, setFounderSeatsRemaining] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user?.uid) {
      setSubscriptionProfileState(DEFAULT_PROFILE);
      setFounderSeatsRemaining(50);
      setLoading(false);
      return;
    }

    setLoading(true);
    void Promise.all([loadUserSubscriptionProfile(user.uid), fetchFounderSeatsRemaining()])
      .then(([profile, seats]) => {
        if (!active) return;
        setSubscriptionProfileState(profile);
        setFounderSeatsRemaining(seats);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.uid]);

  const persist = useCallback(
    async (next: UserSubscriptionProfile) => {
      setSubscriptionProfileState(next);
      if (!user?.uid) return;
      await saveUserSubscriptionProfile(user.uid, next);
    },
    [user?.uid]
  );

  const markProPreviewUsed = useCallback(async () => {
    if (subscriptionProfile.proPreviewUsed) return;
    await persist({ ...subscriptionProfile, proPreviewUsed: true });
  }, [persist, subscriptionProfile]);

  const refreshFounderSeats = useCallback(async () => {
    const seats = await fetchFounderSeatsRemaining();
    setFounderSeatsRemaining(seats);
  }, []);

  const setActivePlan = useCallback(
    async (planType: 'founder' | 'pro') => {
      if (planType === 'founder') {
        const result = await reserveFounderSeat(user?.uid);
        if (!result.ok) {
          await refreshFounderSeats();
          return { ok: false, reason: result.reason };
        }
        setFounderSeatsRemaining(result.seatsRemaining);
      }

      await persist({ ...subscriptionProfile, subscriptionStatus: 'active', planType });
      return { ok: true };
    },
    [persist, refreshFounderSeats, subscriptionProfile, user?.uid]
  );

  const canAccessProLesson =
    subscriptionProfile.subscriptionStatus === 'active' || subscriptionProfile.proPreviewUsed === false;

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      subscriptionProfile,
      founderSeatsRemaining,
      loading,
      canAccessProLesson,
      markProPreviewUsed,
      setActivePlan,
      refreshFounderSeats
    }),
    [
      canAccessProLesson,
      founderSeatsRemaining,
      loading,
      markProPreviewUsed,
      refreshFounderSeats,
      setActivePlan,
      subscriptionProfile
    ]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used inside SubscriptionProvider');
  }
  return context;
}
