'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FiShield, FiAlertCircle } from 'react-icons/fi';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [accountHolderNumber, setAccountHolderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

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
    setResponse(null);

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
      setResponse(result.data);
      
      // Store token and redirect
      if (result.data?.token) {
        localStorage.setItem('token', result.data.token);
        setTimeout(() => router.push('/dashboard'), 500);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      setResponse(err.response?.data || { error: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-center mb-2">
            <div className="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center">
              <FiShield className="text-white text-2xl" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Create an account</CardTitle>
          <CardDescription className="text-center">
            Get started with GateKeeperPro today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800">
                <FiAlertCircle />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {response && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-mono text-blue-900 whitespace-pre-wrap">
                  {JSON.stringify(response, null, 2)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name or Company Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Global Icons"
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
                placeholder="+1234567890"
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
                placeholder="john.doe@example.com"
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
                placeholder="SecurePassword123!"
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
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <Button type="button" onClick={handleRegister} className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <div className="text-center text-sm text-zinc-600">
              Already have an account?{' '}
              <Link href="/login" className="text-zinc-900 font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
