"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from '@hugeicons/react';
import { ShieldIcon, AlertCircleIcon } from '@hugeicons/core-free-icons';
import { Boxes } from "@/components/ui/background-boxes";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const maskedPhone = searchParams.get("phone");
  const maskedEmail = searchParams.get("email");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Redirect if no reference provided
    if (!reference) {
      router.push("/login");
    }
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, [reference, router]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 5 && newOtp.every((digit) => digit !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const otpCode = otp.join("");
      if (otpCode.length === 6) {
        handleVerify(otpCode);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      
      // Focus appropriate input after paste
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();

      // Auto-submit if complete
      if (pastedData.length === 6) {
        handleVerify(pastedData);
      }
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join("");
    
    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    if (!reference) {
      setError("Invalid session. Please login again.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await authApi.verifyLoginOTP({ reference, otp: code });
      
      if (result.data?.token) {
        localStorage.setItem('token', result.data.token);
        
        // Store role and member info
        const role = result.data.role || 'admin';
        const isMember = result.data.isMember || false;
        localStorage.setItem('userRole', role);
        localStorage.setItem('isMember', String(isMember));
        
        if (result.data.member) {
          localStorage.setItem('memberInfo', JSON.stringify(result.data.member));
        }
        
        // Fetch and store accessible accounts
        try {
          const accountsRes = await authApi.getAccessibleAccounts();
          if (accountsRes.data?.accounts) {
            localStorage.setItem('accessibleAccounts', JSON.stringify(accountsRes.data.accounts));
          }
        } catch {
          // Non-critical, ignore errors
        }
        
        setSuccess("Verification successful! Redirecting...");
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Verification failed");
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Info Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 relative overflow-hidden">
        {/* Background Boxes */}
        <div className="absolute inset-0 z-0">
          <Boxes />
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 z-[1] bg-zinc-950/80 pointer-events-none" />
        
        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-12 pointer-events-auto">
          {/* Logo - Top Left */}
          <div className="absolute top-12 left-12 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
              <HugeiconsIcon icon={ShieldIcon} size={24} strokeWidth={1.5} className="text-zinc-900" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">GateKeeperPro</div>
            </div>
          </div>

          {/* Main Content - Centered */}
          <div className="max-w-lg space-y-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                Two-Factor Authentication
              </h1>
              <p className="text-lg text-zinc-300">
                We&apos;ve sent a verification code to your phone and email to secure your account.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-zinc-300">Extra layer of security for your account</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-zinc-300">Code expires in 10 minutes</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-zinc-300">3 verification attempts allowed</p>
              </div>
            </div>
          </div>

          {/* Footer - Bottom Left */}
          <div className="absolute bottom-12 left-12 text-zinc-500 text-sm">
            © 2025 GateKeeperPro. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - OTP Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center">
                <HugeiconsIcon icon={ShieldIcon} size={24} strokeWidth={1.5} className="text-white" />
              </div>
              <div>
                <div className="text-xl font-bold">GateKeeperPro</div>
                <div className="text-xs text-zinc-500">Developer Portal</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Enter verification code</h2>
            <p className="text-zinc-600">
              We&apos;ve sent a 6-digit code to:
            </p>
            {maskedPhone && (
              <p className="text-zinc-800 font-medium mt-1">{maskedPhone}</p>
            )}
            {maskedEmail && (
              <p className="text-zinc-800 font-medium">{maskedEmail}</p>
            )}
          </div>

          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800">
                <HugeiconsIcon icon={AlertCircleIcon} size={16} strokeWidth={1.5} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm">{success}</p>
              </div>
            )}

            {/* OTP Input Grid */}
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-zinc-300 rounded-lg 
                           focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20
                           disabled:bg-zinc-100 disabled:cursor-not-allowed
                           transition-all duration-200"
                />
              ))}
            </div>

            <Button
              type="button"
              onClick={() => handleVerify()}
              className="w-full h-11 bg-zinc-900 hover:bg-black text-white font-medium transition-colors"
              disabled={loading || otp.some((digit) => !digit)}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="text-center space-y-3">
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                <p className="text-sm text-zinc-600 mb-2">
                  Didn&apos;t receive the code? Dial the USSD code below with your account number:
                </p>
                <p className="text-xl font-bold text-zinc-900 font-mono">
                  *713*882#
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  Works on all networks in Ghana
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-sm text-zinc-500 hover:text-zinc-700 hover:underline"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
