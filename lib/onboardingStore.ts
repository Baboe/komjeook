import { useSyncExternalStore } from 'react';

export type OnboardingData = {
  voornaam: string;
  leeftijd: string;
  locatie: string;
  interesses: string[];
  vrijeInteresse: string;
  telefoonnummer: string;
};

const initial: OnboardingData = {
  voornaam: '',
  leeftijd: '',
  locatie: '',
  interesses: [],
  vrijeInteresse: '',
  telefoonnummer: '',
};

let state: OnboardingData = { ...initial };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const onboardingStore = {
  get: () => state,
  set: (patch: Partial<OnboardingData>) => {
    state = { ...state, ...patch };
    emit();
  },
  reset: () => {
    state = { ...initial };
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useOnboarding() {
  return useSyncExternalStore(onboardingStore.subscribe, onboardingStore.get, onboardingStore.get);
}
