"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, UserPlus } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register";

export function CustomerAuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, refresh } = useAuth();

  const client = useMemo(
    () => createClient(),
    []
  );

  const from = searchParams.get("from") ?? "/";
  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(registered ? "Your account is ready. Sign in below." : "");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(from);
    }
  }, [authLoading, from, router, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error: signInError } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        await refresh();
        router.replace(from);
        router.refresh();
        return;
      }

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/login?registered=1`
          : undefined;

      const { data, error: signUpError } = await client.auth.signUp({
        email,
        password,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        await refresh();
        router.replace(from);
        router.refresh();
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full bg-muted/50 border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-brand transition-all"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full bg-muted/50 border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-brand transition-all"
            required
            minLength={6}
          />
        </div>
      </div>

      {mode === "register" && (
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Confirm Password</label>
          <div className="relative">
            <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="w-full bg-muted/50 border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-brand transition-all"
              required
              minLength={6}
            />
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full py-4 bg-brand text-brand-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-brand/20 disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : mode === "login" ? "Sign In" : "Create Account"}
      </button>

      <div className="text-center text-sm">
        {mode === "login" ? (
          <>
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link href="/register" className="text-brand font-bold hover:underline">
              Sign Up
            </Link>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-brand font-bold hover:underline">
              Sign In
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
