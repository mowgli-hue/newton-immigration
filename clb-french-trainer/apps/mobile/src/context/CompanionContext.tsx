import React, { createContext, useContext, useMemo, useState } from 'react';

export type CompanionId = 'owl' | 'fox' | 'dolphin';

export type Companion = {
  id: CompanionId;
  emoji: string;
  name: string;
  description: string;
  tone: 'calm' | 'motivational' | 'analytical';
};

export const companions: Companion[] = [
  {
    id: 'owl',
    emoji: '🦉',
    name: 'Owl Coach',
    description: 'Calm and structured guidance for steady progress.',
    tone: 'calm'
  },
  {
    id: 'fox',
    emoji: '🦊',
    name: 'Fox Guide',
    description: 'Encouraging momentum and confidence-focused feedback.',
    tone: 'motivational'
  },
  {
    id: 'dolphin',
    emoji: '🐬',
    name: 'Dolphin Mentor',
    description: 'Clear, analytical insights to sharpen exam strategy.',
    tone: 'analytical'
  }
];

type CompanionContextValue = {
  selectedCompanionId: CompanionId;
  setSelectedCompanionId: (id: CompanionId) => void;
  selectedCompanion: Companion;
};

const CompanionContext = createContext<CompanionContextValue | undefined>(undefined);

export function CompanionProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompanionId, setSelectedCompanionId] = useState<CompanionId>('owl');

  const value = useMemo<CompanionContextValue>(() => {
    const selectedCompanion = companions.find((item) => item.id === selectedCompanionId) ?? companions[0];

    return {
      selectedCompanionId,
      setSelectedCompanionId,
      selectedCompanion
    };
  }, [selectedCompanionId]);

  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>;
}

export function useCompanion() {
  const context = useContext(CompanionContext);

  if (!context) {
    throw new Error('useCompanion must be used inside CompanionProvider');
  }

  return context;
}
