
import { supabase } from './supabaseClient';
import { User } from '../types';
import { Database } from '../types/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const getUserProfile = async (userId: string, user?: User | any): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // Ignore error if row doesn't exist yet (first login)
    if (error?.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
    }
    return null;
  }

  // If user object is not provided, fetch it (fallback)
  // This optimization prevents a blocking network call when we already have the session
  let authUser = user;
  if (!authUser) {
      const userResp = await (supabase.auth as any).getUser();
      authUser = userResp?.data?.user;
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name || '',
    email: authUser?.email || '',
    avatar: data.avatar || undefined,
    currency: data.currency || 'INR',
    locale: data.locale || 'en-US'
  };
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  const profileUpdates: ProfileUpdate = {
    name: updates.name,
    avatar: updates.avatar,
    currency: updates.currency,
    locale: updates.locale,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', userId);

  if (error) {
    throw error;
  }
};
