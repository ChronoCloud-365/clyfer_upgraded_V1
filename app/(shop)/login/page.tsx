"use client";

import { motion } from "framer-motion";
import { User, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Clyfer account</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Email Address</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full bg-muted/50 border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-brand transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-muted/50 border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-brand transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-border bg-muted" />
              <span className="text-muted-foreground">Remember me</span>
            </label>
            <Link href="#" className="text-brand font-medium hover:underline">Forgot password?</Link>
          </div>

          <button 
            className="w-full py-4 bg-brand text-brand-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-brand/20"
            onClick={() => alert("Customer accounts are coming soon!")}
          >
            Sign In
            <ArrowRight className="size-4" />
          </button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link href="#" className="text-brand font-bold hover:underline">Sign Up</Link>
          </div>
        </div>

        {/* Admin Link */}
        <div className="mt-12 pt-8 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-widest">Administrator</p>
          <Link 
            href="/admin/login" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all text-xs font-bold"
          >
            Admin Dashboard
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
