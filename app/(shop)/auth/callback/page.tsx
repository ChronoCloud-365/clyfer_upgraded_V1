"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useMemo(() => createClient(), []);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function completeAuth() {
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/login?registered=1";

      if (!code) {
        router.replace("/login");
        return;
      }

      const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
      if (!active) return;

      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }

      router.replace(next);
      router.refresh();
    }

    completeAuth();
    return () => {
      active = false;
    };
  }, [client, router, searchParams]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl text-center">
        {error ? (
          <>
            <h1 className="text-xl font-bold text-foreground mb-3">Could not confirm account</h1>
            <p className="text-sm text-red-500">{error}</p>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Confirming your account...
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center p-4 bg-background"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
