import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { supabase } from './supabase';
import type { Session, AuthError } from '@supabase/supabase-js';

type Profile = {
  id: string;
  role: 'user' | 'astrologer' | 'admin';
  name: string;
  phone: string | null;
} | null;

type AuthState = {
  session: Session | null;
  profile: Profile;
  isLoading: boolean;
};

type AuthContextType = AuthState & {
  signUp: (email: string, password: string, name: string, role?: 'user' | 'astrologer') => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  setProfileRole: (role: 'user' | 'astrologer') => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    profile: null,
    isLoading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setState({ session: null, profile: null, isLoading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setState({ session: null, profile: null, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, role, name, phone')
      .eq('id', userId)
      .single();

    if (data) {
      setState({
        session: (await supabase.auth.getSession()).data.session,
        profile: data as Profile,
        isLoading: false,
      });
    } else {
      const session = (await supabase.auth.getSession()).data.session;
      setState(prev => ({ ...prev, session, isLoading: false }));
    }
  }

  const signUp = useCallback(async (email: string, password: string, name: string, role?: 'user' | 'astrologer'): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return error.message;
    if (!data.user) return 'Sign up failed. Please try again.';

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      email,
      role: role ?? null,
    });

    if (profileError) return profileError.message;

    if (role) {
      setState(prev => ({
        ...prev,
        profile: { id: data.user!.id, role, name, phone: null },
      }));
    }

    return null;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ session: null, profile: null, isLoading: false });
    router.replace('/auth/login');
  }, []);

  const setProfileRole = useCallback(async (role: 'user' | 'astrologer'): Promise<string | null> => {
    const user = (await supabase.auth.getSession()).data.session?.user;
    if (!user) return 'No authenticated user';

    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', user.id);

    if (error) return error.message;

    setState(prev => ({
      ...prev,
      profile: { ...prev.profile!, id: user.id, role, name: prev.profile?.name ?? '', phone: null },
    }));

    return null;
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signOut, setProfileRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
