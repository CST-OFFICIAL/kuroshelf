/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_AMAZON_AFFILIATE_ACTIVE?: string;
  readonly VITE_AMAZON_AFFILIATE_TAG?: string;
  readonly VITE_SOCIAL_INSTAGRAM?: string;
  readonly VITE_SOCIAL_TWITTER?: string;
  readonly VITE_SOCIAL_YOUTUBE?: string;
  readonly VITE_SOCIAL_DISCORD?: string;
  readonly VITE_DISQUS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
