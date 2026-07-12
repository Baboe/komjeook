import { useSyncExternalStore } from 'react';

export type Draft = {
  uri: string | null;
  duration: number;
  activiteit: string;
  datum: string;
  locatie: string;
  fotos: string[];
};

const initial: Draft = {
  uri: null,
  duration: 0,
  activiteit: '',
  datum: '',
  locatie: '',
  fotos: [],
};

let state: Draft = { ...initial };
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export const draftStore = {
  get: () => state,
  set: (patch: Partial<Draft>) => {
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

export function useDraft() {
  return useSyncExternalStore(draftStore.subscribe, draftStore.get, draftStore.get);
}
