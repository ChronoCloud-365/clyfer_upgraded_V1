"use server";

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function isValidHttpUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function createFallbackQuery(result: { data: unknown; error: { message: string } | null }) {
  const query: Record<string, unknown> = {
    select: () => query,
    eq: () => query,
    ilike: () => query,
    order: () => query,
    limit: () => query,
    maybeSingle: async () => result,
    single: async () => result,
    insert: () => query,
    update: () => query,
    delete: () => query,
    upsert: () => query,
    then: (onFulfilled?: (value: typeof result) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
    catch: (onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).catch(onRejected as never),
    finally: (onFinally?: (() => void) | undefined) =>
      Promise.resolve(result).finally(onFinally),
  };

  return query;
}

function createFallbackClient() {
  return {
    from: () => createFallbackQuery({ data: null, error: null }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  };
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
    return createFallbackClient() as ReturnType<typeof createServerClient>;
  }

  let cookieStore: Awaited<ReturnType<typeof cookies>> | undefined;
  try {
    cookieStore = await cookies();
  } catch {
    // In a static context (like generateStaticParams or pre-rendering), 
    // cookies() is not available. We return a client without cookie support.
  }

  return createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore?.getAll() ?? [];
        },
        setAll(cookiesToSet) {
          if (!cookieStore) return;
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}
