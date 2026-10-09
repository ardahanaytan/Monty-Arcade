interface ImportMetaEnv {
  /** Supabase proje adresi (herkese açık). Boşsa site üyeliksiz (misafir) modda çalışır. */
  readonly PUBLIC_SUPABASE_URL?: string;
  /** Supabase publishable anahtarı (herkese açık, tarayıcıda görünür). */
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
