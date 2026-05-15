import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerAuthForm } from "@/components/auth/CustomerAuthForm";

export const metadata: Metadata = {
  title: "Sign In | Clyfer",
  description: "Sign in to your Clyfer customer account.",
};

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Clyfer account</p>
        </div>

        <Suspense fallback={null}>
          <CustomerAuthForm mode="login" />
        </Suspense>
      </div>
    </div>
  );
}
