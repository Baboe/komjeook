import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Profile } from '../types/db';

const DEV_SKIP = process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === 'true';
const DEV_PROFILE_KEY = 'ombaa_dev_profile';
const DEV_SESSION = { user: { id: 'dev-user-id', phone: '+31600000000' } } as unknown as Session;

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  devLogin?: (profile: Profile) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile((data as Profile) ?? null);
  }

  const devLogin = useCallback(async (p: Profile) => {
    await AsyncStorage.setItem(DEV_PROFILE_KEY, JSON.stringify(p));
    setSession(DEV_SESSION);
    setProfile(p);
  }, []);

  useEffect(() => {
    if (DEV_SKIP) {
      AsyncStorage.getItem(DEV_PROFILE_KEY).then((v) => {
        if (v) {
          setSession(DEV_SESSION);
          setProfile(JSON.parse(v) as Profile);
        }
        setLoading(false);
      });
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) loadProfile(sess.user.id);
      else setProfile(null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        refreshProfile: async () => {
          if (!DEV_SKIP && session?.user) await loadProfile(session.user.id);
        },
        signOut: async () => {
          if (DEV_SKIP) {
            await AsyncStorage.removeItem(DEV_PROFILE_KEY);
            setSession(null);
            setProfile(null);
            return;
          }
          await supabase.auth.signOut();
        },
        devLogin: DEV_SKIP ? devLogin : undefined,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
