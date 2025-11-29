
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const initializeAuth = async () => {
      // Safety: if getSession hangs, clear loading after timeout so UI isn't stuck
      const safetyTimeout = setTimeout(() => {
        console.warn('Auth initialization timed out; clearing loading state');
        setIsLoading(false);
      }, 7000);

      try {
        console.debug('Auth: starting getSession()');
        // Cast to any to bypass SupabaseAuthClient type issues and guard nested data
        const sessionResp = await (supabase.auth as any).getSession();
        console.debug('Auth: getSession() resolved', sessionResp);
        const session = sessionResp?.data?.session;

        if (session?.user) {
          console.debug('Auth: session user found', session.user.id);
          const profile = await getUserProfile(session.user.id);
          if (profile) {
            setUser(profile);
          } else {
              // Fallback if profile trigger hasn't fired yet or failed
              setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.full_name || 'User',
                  avatar: session.user.user_metadata?.avatar_url,
                  currency: 'INR',
                  locale: 'en-US'
              });
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth session', err);
      } finally {
        clearTimeout(safetyTimeout);
        // Always clear loading so UI can render (prevents permanent spinner)
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes
    // Cast to any to bypass SupabaseAuthClient type issues and guard return shape
    const onAuth = (supabase.auth as any).onAuthStateChange(async (event: any, session: any) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
           setIsLoading(true);
           const profile = await getUserProfile(session.user.id);
           if (profile) {
               setUser(profile);
           } else {
               // Handle case where profile might be created via trigger asynchronously
               // For now, use metadata
               setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.full_name || 'User',
                  avatar: session.user.user_metadata?.avatar_url,
                  currency: 'INR',
                  locale: 'en-US'
              });
           }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      } catch (err) {
        console.error('Error handling auth state change', err);
      } finally {
        // Ensure loading is cleared after handling any event
        setIsLoading(false);
      }
    });

    const subscription = onAuth?.data?.subscription;
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error("Password required");
    setIsLoading(true);
    try {
      // Cast to any to bypass SupabaseAuthClient type issues
      const resp = await (supabase.auth as any).signInWithPassword({
        email,
        password,
      });
      console.debug('Auth.login: response', resp);

      const session = resp?.data?.session;
      if (session?.user) {
        // Try to load profile from DB, fall back to session metadata
        const profile = await getUserProfile(session.user.id);
        if (profile) setUser(profile);
        else setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'User',
          avatar: session.user.user_metadata?.avatar_url,
          currency: 'INR',
          locale: 'en-US'
        });
      }

      const error = resp?.error;
      if (error) {
        console.error('Auth.login: error from supabase', error);
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password?: string) => {
    if (!password) throw new Error("Password required");
    setIsLoading(true);
    try {
      // Cast to any to bypass SupabaseAuthClient type issues
      const resp = await (supabase.auth as any).signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      console.debug('Auth.signup: response', resp);

      const session = resp?.data?.session;
      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        if (profile) setUser(profile);
        else setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || name || 'User',
          avatar: session.user.user_metadata?.avatar_url,
          currency: 'INR',
          locale: 'en-US'
        });
      }

      const error = resp?.error;
      if (error) {
        console.error('Auth.signup: error from supabase', error);
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async () => {
    setIsLoading(true);
    try {
      // Cast to any to bypass SupabaseAuthClient type issues
      const resp = await (supabase.auth as any).signInWithOAuth({
        provider: 'google',
      });

      const error = resp?.error;
      if (error) throw error;
      // OAuth is a redirect flow; the session will be handled by onAuthStateChange after redirect.
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Cast to any to bypass SupabaseAuthClient type issues
    await (supabase.auth as any).signOut();
    setUser(null);
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
    <AuthContext.Provider value={{ user, login, signup, googleLogin, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
