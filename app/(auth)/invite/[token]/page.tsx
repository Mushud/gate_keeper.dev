'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { membersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HugeiconsIcon } from '@hugeicons/react';
import { ShieldIcon, AlertCircleIcon, CheckmarkCircle01Icon, UserAdd01Icon } from '@hugeicons/core-free-icons';
import { Boxes } from '@/components/ui/background-boxes';

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [inviteData, setInviteData] = useState<{
    email: string;
    name?: string;
    role: string;
    accountName: string;
    expiresAt: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInviteDetails();
    }
  }, [token]);

  const fetchInviteDetails = async () => {
    try {
      setLoading(true);
      const { data } = await membersApi.getInviteDetails(token);
      setInviteData(data);
      setFormData((prev) => ({ ...prev, name: data.name || '' }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      const result = await membersApi.acceptInvite({
        token,
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
      });

      setSuccess('Account set up successfully! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <HugeiconsIcon icon={AlertCircleIcon} size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Invalid Invitation</h1>
          <p className="text-zinc-600 mb-6">{error}</p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

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
              <HugeiconsIcon icon={ShieldIcon} size={24} strokeWidth={1.5} className="text-zinc-900" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">GateKeeperPro</div>
            </div>
          </div>

          {/* Main Content - Centered */}
          <div className="max-w-lg space-y-12">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                <HugeiconsIcon icon={UserAdd01Icon} size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Join {inviteData?.accountName}
              </h1>
              <p className="text-xl text-zinc-400">
                You've been invited to collaborate as a <span className="text-white font-medium">{inviteData?.role}</span>
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <HugeiconsIcon icon={ShieldIcon} size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Secure Access</h3>
                  <p className="text-zinc-400">Your account is protected with OTP-based two-factor authentication</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Role-Based Permissions</h3>
                  <p className="text-zinc-400">Access features based on your assigned role</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 border-b border-zinc-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center">
              <HugeiconsIcon icon={ShieldIcon} size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl">GateKeeperPro</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold text-zinc-900">Complete Your Setup</h2>
              <p className="mt-2 text-zinc-600">
                Set up your account to join <strong>{inviteData?.accountName}</strong>
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Invitation for: <strong>{inviteData?.email}</strong>
              </p>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <HugeiconsIcon icon={AlertCircleIcon} size={18} />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
                {success}
              </div>
            )}

            {/* Form */}
            <div className="space-y-5">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="John Doe"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="+233 XX XXX XXXX"
                  className="mt-1.5"
                />
                <p className="text-xs text-zinc-500 mt-1">For receiving OTP codes during login</p>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Create a secure password"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Confirm your password"
                  className="mt-1.5"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 text-base"
              >
                {submitting ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-zinc-600">
              Already have an account?{' '}
              <Link href="/login" className="text-zinc-900 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
