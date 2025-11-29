
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
      // Cast to any to bypass SupabaseAuthClient type issues
      const { data: { session } } = await (supabase.auth as any).getSession();
      
      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        if (profile) {
          setUser(profile);
        } else {
            // Fallback if profile trigger hasn't fired yet or failed
            setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata.full_name || 'User',
                avatar: session.user.user_metadata.avatar_url,
                currency: 'USD',
                locale: 'en-US'
            });
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Listen for changes
    // Cast to any to bypass SupabaseAuthClient type issues
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(async (event: any, session: any) => {
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
                name: session.user.user_metadata.full_name || 'User',
                avatar: session.user.user_metadata.avatar_url,
                currency: 'USD',
                locale: 'en-US'
            });
         }
         setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
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
    
    // Cast to any to bypass SupabaseAuthClient type issues
    const { error } = await (supabase.auth as any).signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signup = async (name: string, email: string, password?: string) => {
    if (!password) throw new Error("Password required");

    // Cast to any to bypass SupabaseAuthClient type issues
    const { error } = await (supabase.auth as any).signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) throw error;
  };

  const googleLogin = async () => {
    // Cast to any to bypass SupabaseAuthClient type issues
    const { error } = await (supabase.auth as any).signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
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
