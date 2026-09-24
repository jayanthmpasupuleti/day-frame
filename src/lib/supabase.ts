import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export interface ProfileRow {
  id: string;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  unlocked_themes: string[];
}

export interface UserDataRow {
  user_id: string;
  habits: any[];
  tasks: any[];
  settings: Record<string, any>;
  updated_at: string;
}

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0 &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key') &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://'))
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: typeof window !== 'undefined',
      },
    })
  : null;

export type { User, Session };
