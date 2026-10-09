/** Tarayıcı tarafı tek Supabase istemcisi. Ortam değişkenleri yoksa `null`: site misafir modunda çalışır. */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;
