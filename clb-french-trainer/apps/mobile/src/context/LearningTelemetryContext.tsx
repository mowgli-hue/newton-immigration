import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext';
import type { LearningTelemetryEvent, LearningTelemetrySnapshot } from '../types/LearningTelemetryTypes';

type LearningTelemetryContextValue = {
  events: LearningTelemetryEvent[];
  trackEvent: (event: Omit<LearningTelemetryEvent, 'id' | 'timestamp'>) => void;
  clearTelemetry: () => void;
};

const LearningTelemetryContext = createContext<LearningTelemetryContextValue | undefined>(undefined);
const STORAGE_KEY = 'clb:learning-telemetry:v1';
const MAX_EVENTS = 1200;

export function LearningTelemetryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<LearningTelemetryEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const storageKey = `${STORAGE_KEY}:${user?.uid ?? 'guest'}`;

  useEffect(() => {
    let mounted = true;
    setHydrated(false);
    setEvents([]);
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw && mounted) {
          const parsed = JSON.parse(raw) as LearningTelemetrySnapshot | LearningTelemetryEvent[];
          const loaded = Array.isArray(parsed) ? parsed : parsed.events;
          setEvents(Array.isArray(loaded) ? loaded : []);
        }
      } finally {
        if (mounted) setHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    const snapshot: LearningTelemetrySnapshot = { events };
    void AsyncStorage.setItem(storageKey, JSON.stringify(snapshot));
  }, [events, hydrated, storageKey]);

  const trackEvent = useCallback((event: Omit<LearningTelemetryEvent, 'id' | 'timestamp'>) => {
    setEvents((prev) => {
      const nextEvent: LearningTelemetryEvent = {
        ...event,
        id: `lte-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now()
      };
      const next = [nextEvent, ...prev];
      return next.slice(0, MAX_EVENTS);
    });
  }, []);

  const clearTelemetry = useCallback(() => {
    setEvents([]);
  }, []);

  const value = useMemo<LearningTelemetryContextValue>(
    () => ({
      events,
      trackEvent,
      clearTelemetry
    }),
    [events, trackEvent, clearTelemetry]
  );

  return <LearningTelemetryContext.Provider value={value}>{children}</LearningTelemetryContext.Provider>;
}

export function useLearningTelemetry() {
  const context = useContext(LearningTelemetryContext);
  if (!context) {
    throw new Error('useLearningTelemetry must be used inside LearningTelemetryProvider');
  }
  return context;
}
