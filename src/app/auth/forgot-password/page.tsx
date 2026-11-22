"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { BunoLogo } from "@/components/ui/BunoLogo";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Verify Email
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Checking registered account...");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "forgot-password-check",
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUserName(data.name || "User");
        setStep(2);
        toast.success(`Account found for ${data.name}! Set your new password.`, {
          id: toastId,
        });
      } else {
        toast.error(data.error || "No account found with this email", {
          id: toastId,
        });
      }
    } catch {
      toast.error("Failed to verify email. Please try again.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Updating password...");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          email: email.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStep(3);
        toast.success("Password reset successfully!", { id: toastId });
      } else {
        toast.error(data.error || "Failed to reset password", { id: toastId });
      }
    } catch {
      toast.error("An error occurred while resetting password.", {
        id: toastId,
      });
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
            {step === 3
              ? "Password Reset Complete"
              : step === 2
              ? `Reset Password for ${userName}`
              : "Recover your account"}
          </h1>
          <p className="text-xs text-[#70757A]">
            {step === 3
              ? "Your credentials have been securely updated."
              : step === 2
              ? "Choose a strong password with at least 6 characters."
              : "Enter your registered email address to reset your account password."}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-4">
          {/* STEP 1: Verify Email Form */}
          {step === 1 && (
            <form onSubmit={handleVerifyEmail} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#202124] mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#202124] hover:bg-black text-white text-xs font-medium rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{isLoading ? "Verifying..." : "Continue"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* STEP 2: New Password Form */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E5] flex items-center gap-2 text-[11px] text-[#70757A]">
                <ShieldCheck className="w-4 h-4 text-[#4468E8] shrink-0" />
                <span>
                  Resetting credentials for: <strong className="text-[#202124]">{email}</strong>
                </span>
              </div>

              <div>
                <label className="block font-medium text-[#202124] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#70757A] hover:text-[#202124]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202124] mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-3 border border-[#E8E8E5] hover:bg-[#FAFAF8] text-[#202124] text-xs font-medium rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 bg-[#4468E8] hover:bg-[#3455D1] text-white text-xs font-medium rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Updating..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-[#202124]">
                  Password Successfully Changed
                </h3>
                <p className="text-xs text-[#70757A]">
                  You can now log in to Buno with your newly created password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="w-full py-2.5 px-4 bg-[#202124] hover:bg-black text-white text-xs font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Back to Login footer */}
          {step !== 3 && (
            <div className="pt-2 text-center text-xs text-[#70757A] border-t border-[#F0F0EE]">
              Remember your password?{" "}
              <Link
                href="/auth/login"
                className="text-[#4468E8] font-semibold hover:underline"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
