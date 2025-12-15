'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiShield, FiAlertCircle } from 'react-icons/fi';
import { Boxes } from '@/components/ui/background-boxes';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [accountHolderNumber, setAccountHolderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('RegisterPage mounted');
    
    const preventSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    document.addEventListener('submit', preventSubmit, true);
    
    return () => {
      document.removeEventListener('submit', preventSubmit, true);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleRegister();
    }
  };

  const handleRegister = async () => {
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await authApi.register({ name, accountHolderNumber, email, password });
      console.log('Registration response:', result.data);
      
      // Store token and redirect
      if (result.data?.token) {
        localStorage.setItem('token', result.data.token);
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 1500);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Info Panel */}
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
              <FiShield className="text-zinc-900 text-2xl" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">GateKeeperPro</div>
            </div>
          </div>

          {/* Main Content - Centered */}
          <div className="max-w-lg space-y-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                Secure OTP Verification
              </h1>
              <p className="text-lg text-zinc-300">
                Enterprise-grade authentication platform trusted by leading organizations.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-zinc-300">100 free credits included</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-zinc-300">Simple API integration</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-zinc-300">Global SMS network</p>
              </div>
            </div>
          </div>

          {/* Footer - Bottom Left */}
          <div className="absolute bottom-12 left-12 text-zinc-500 text-sm">
            © 2025 GateKeeperPro. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
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
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Create an account</h2>
            <p className="text-zinc-600">
              Get started with GateKeeperPro today
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
              <Label htmlFor="name">Name or Company Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name or company name here..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolderNumber">Phone Number</Label>
              <Input
                id="accountHolderNumber"
                type="tel"
                placeholder="Enter your phone number here..."
                value={accountHolderNumber}
                onChange={(e) => setAccountHolderNumber(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email here..."
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
                placeholder="Enter your password here..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password here..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <Button type="button" onClick={handleRegister} className="w-full h-11 bg-zinc-900 hover:bg-black text-white font-medium transition-colors" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <div className="text-center text-sm text-zinc-600">
              Already have an account?{' '}
              <Link href="/login" className="text-zinc-900 font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
