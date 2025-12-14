"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiShield, FiAlertCircle } from "react-icons/fi";
import { Boxes } from "@/components/ui/background-boxes";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    console.log("LoginPage mounted - NO REDIRECTS WILL HAPPEN");

    // Prevent any form submission globally on this page
    const preventSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Prevented default form submission");
      return false;
    };

    document.addEventListener("submit", preventSubmit, true);

    return () => {
      document.removeEventListener("submit", preventSubmit, true);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      console.log("Enter key intercepted and prevented");
      handleLogin();
    }
  };

  const handleLogin = async () => {
    console.log("=== LOGIN BUTTON CLICKED (handleLogin called) ===");
    console.log("Email:", email);
    console.log("Password length:", password.length);

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await authApi.login({ email, password });
      
      // Store token
      if (result.data?.token) {
        localStorage.setItem('token', result.data.token);
        setSuccess("Login successful! Redirecting...");
        
        // Use window.location for a full page navigation to ensure AuthProvider reloads
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Login failed");
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
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <FiShield className="text-white text-2xl" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">GateKeeperPro</div>
              <div className="text-sm text-zinc-400">OTP Verification Platform</div>
            </div>
          </div>

          {/* Main Content - Centered */}
          <div className="max-w-lg space-y-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Secure OTP Verification
                <br />
                <span className="text-blue-500">Made Simple</span>
              </h1>
              <p className="text-xl text-zinc-300">
                Powerful authentication with hosted checkout pages and direct API integration.
              </p>
            </div>

            <div className="space-y-6 mt-12">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Hosted Checkout</h3>
                  <p className="text-zinc-400">Pre-built verification pages that work out of the box</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Direct API</h3>
                  <p className="text-zinc-400">Full control with our RESTful API integration</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">100 Free Credits</h3>
                  <p className="text-zinc-400">Start building immediately with free credits on signup</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Bottom Left */}
          <div className="absolute bottom-12 left-12 text-zinc-500 text-sm">
            © 2025 GateKeeperPro. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center">
                <FiShield className="text-white text-2xl" />
              </div>
              <div>
                <div className="text-xl font-bold">GateKeeperPro</div>
                <div className="text-xs text-zinc-500">Developer Portal</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Welcome back</h2>
            <p className="text-zinc-600">
              Sign in to your account to continue
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800">
                <FiAlertCircle />
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

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <Button
              type="button"
              onClick={handleLogin}
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-center text-sm text-zinc-600">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-blue-600 font-medium hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
