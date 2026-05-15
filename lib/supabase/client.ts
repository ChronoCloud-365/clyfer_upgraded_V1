import { createBrowserClient } from "@supabase/ssr";

function isValidHttpUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function createFallbackClient() {
  const auth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
    }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({
      data: { session: null, user: null },
      error: new Error("Supabase is not configured"),
    }),
    signUp: async () => ({
      data: { session: null, user: null },
      error: new Error("Supabase is not configured"),
    }),
    exchangeCodeForSession: async () => ({
      data: { session: null, user: null },
      error: new Error("Supabase is not configured"),
    }),
  };

  return {
    auth,
  };
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
    return createFallbackClient();
  }

  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}
