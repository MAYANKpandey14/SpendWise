
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { User } from '../types';
import { logAuthEvent } from '../services/auditService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to centralize user state updates
  const handleSession = async (session: any) => {
    console.log('Auth: handleSession starting', { hasSession: !!session, hasUser: !!session?.user });
    if (!session?.user) {
      console.log('Auth: handleSession no user, setting user to null');
      setUser(null);
      return;
    }

    try {
      console.log('Auth: handleSession fetching profile for', session.user.id);
      const profile = await getUserProfile(session.user.id, session.user);
      console.log('Auth: handleSession profile fetched', { hasProfile: !!profile });
      if (profile) {
        setUser(profile);
      } else {
        console.log('Auth: handleSession using fallback user data');
        // Fallback to session user data
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'User',
          avatar: session.user.user_metadata?.avatar_url,
          currency: 'INR',
          locale: 'en-US'
        });
      }
    } catch (err) {
      console.error('Auth: failed to fetch profile', err);
      // Fallback to session user data
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || 'User',
        avatar: session.user.user_metadata?.avatar_url,
        currency: 'INR',
        locale: 'en-US'
      });
    }
  };

  useEffect(() => {
    console.log('Auth: Setting up auth state listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth: onAuthStateChange', event, session?.user?.email);

      if (session?.user) {
        // 1. Optimistic update: Set user immediately from session to unblock UI
        // This ensures isLoading becomes false right away
        setUser(prev => {
          // If we already have a profile with this ID, keep it (don't overwrite with basic session data)
          if (prev?.id === session.user.id) return prev;

          return {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || 'User',
            avatar: session.user.user_metadata?.avatar_url,
            currency: 'INR',
            locale: 'en-US'
          };
        });

        setIsLoading(false);

        // 2. Fetch full profile in background
        handleSession(session);
      } else {
        // Signed out
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error("Password required");
    setIsLoading(true);
    try {
      const resp = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (resp.error) {
        await logAuthEvent('LOGIN_FAILURE', { email, metadata: { error: resp.error.message } });
        throw resp.error;
      }

      await logAuthEvent('LOGIN_SUCCESS', { userId: resp.data.session?.user.id, email });
      // State update handled by onAuthStateChange
    } catch (e: any) {
      setIsLoading(false);
      if (!e.message?.includes('Invalid login credentials')) {
        // Log unexpected errors
      }
      throw e;
    }
  };

  const signup = async (name: string, email: string, password?: string) => {
    if (!password) throw new Error("Password required");
    setIsLoading(true);
    try {
      const resp = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (resp.error) {
        await logAuthEvent('SIGNUP_FAILURE', { email, metadata: { error: resp.error.message } });
        throw resp.error;
      }

      await logAuthEvent('SIGNUP_SUCCESS', { userId: resp.data.session?.user?.id, email });
      // State update handled by onAuthStateChange
    } catch (e) {
      setIsLoading(false);
      throw e;
    }
  };

  const googleLogin = async () => {
    setIsLoading(true);
    try {
      const resp = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (resp.error) {
        await logAuthEvent('GOOGLE_LOGIN_FAILURE', { metadata: { error: resp.error.message } });
        throw resp.error;
      }

      await logAuthEvent('GOOGLE_LOGIN_SUCCESS', {});
    } catch (e) {
      setIsLoading(false);
      throw e;
    }
  };

  const logout = async () => {
    if (user) {
      await logAuthEvent('LOGOUT', { userId: user.id, email: user.email });
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        await logAuthEvent('PASSWORD_RESET_REQUEST', { email, metadata: { success: false, error: error.message } });
        throw error;
      }

      await logAuthEvent('PASSWORD_RESET_REQUEST', { email, metadata: { success: true } });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        await logAuthEvent('PASSWORD_UPDATE_FAILURE', { userId: user?.id, metadata: { error: error.message } });
        throw error;
      }

      await logAuthEvent('PASSWORD_UPDATE_SUCCESS', { userId: user?.id });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;

    try {
      await updateUserProfile(user.id, data);
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error("Failed to update user", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, googleLogin, logout, resetPassword, updatePassword, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};