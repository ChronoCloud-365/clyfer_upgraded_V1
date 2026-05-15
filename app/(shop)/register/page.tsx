import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerAuthForm } from "@/components/auth/CustomerAuthForm";

export const metadata: Metadata = {
  title: "Sign Up | Clyfer",
  description: "Create your Clyfer customer account.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join Clyfer for faster checkout and order tracking</p>
        </div>

        <Suspense fallback={null}>
          <CustomerAuthForm mode="register" />
        </Suspense>
      </div>
    </div>
  );
}
