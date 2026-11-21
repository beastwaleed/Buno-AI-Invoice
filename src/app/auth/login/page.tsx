"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { BunoLogo } from "@/components/ui/BunoLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading("Signing in...");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Welcome back!", { id: tId });
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(data.error || "Login failed", { id: tId });
      }
    } catch {
      toast.error("An error occurred during login", { id: tId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const tId = toast.loading("Launching demo account...");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demo" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Signed in as Demo User (Alexander Wright)!", { id: tId });
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error("Failed to load demo account", { id: tId });
      }
    } catch {
      toast.error("Demo login error", { id: tId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center mb-2">
            <BunoLogo size="lg" />
          </Link>
          <h1 className="text-xl font-serif font-bold text-[#202124]">
            Sign in to your account
          </h1>
          <p className="text-xs text-[#70757A]">
            Create, manage, and export studio-quality invoices in seconds
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="bg-[#EEF2FF] border border-blue-200/80 rounded-2xl p-4 text-center space-y-2.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4468E8]">
            <Sparkles className="w-4 h-4" />
            <span>Instant Reviewer / Evaluator Access</span>
          </div>
          <p className="text-[11px] text-[#475569]">
            Pre-loaded with Alexander Wright&apos;s design studio, 3 clients, 4 invoices, and full database persistence.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full py-2 px-3 bg-[#4468E8] hover:bg-[#3455D1] text-white text-xs font-semibold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2"
          >
            <span>One-Click Demo Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Traditional Credentials Form */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-4">
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alexander@company.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-[#202124]">Password</label>
                <span className="text-[10px] text-[#70757A]">
                  Demo: password123
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#202124] hover:bg-black text-white text-xs font-medium rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In with Email"}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[#70757A] border-t border-[#F0F0EE]">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-[#4468E8] font-semibold hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
