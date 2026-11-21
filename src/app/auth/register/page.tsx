"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Mail, User, ArrowRight } from "lucide-react";
import { BunoLogo } from "@/components/ui/BunoLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    const tId = toast.loading("Creating your account...");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", name, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Account created successfully!", { id: tId });
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(data.error || "Registration failed", { id: tId });
      }
    } catch {
      toast.error("An error occurred during registration", { id: tId });
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
            Start creating studio invoices
          </h1>
          <p className="text-xs text-[#70757A]">
            Set up your business workspace in under 60 seconds
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-4">
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                />
              </div>
            </div>

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
                  placeholder="maya@company.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Choose Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#4468E8] hover:bg-[#3455D1] text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[#70757A] border-t border-[#F0F0EE]">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-[#4468E8] font-semibold hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
