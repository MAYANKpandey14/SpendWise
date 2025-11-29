import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Access environment variables handling both Vite and standard environments
const getEnv = (key: string, viteKey: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[viteKey] || (import.meta as any).env[key] || '';
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[viteKey] || process.env[key] || '';
  }
  return '';
};

// Get values
const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Authentication will fail.');
}

// Create client with Database type definition
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder'
);
