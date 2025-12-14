'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, Account } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: Account | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Checking auth with token:', token.substring(0, 20) + '...');
        const { data } = await authApi.getProfile();
        console.log('Auth check successful, user:', data.payload);
        setUser(data.payload);
      } else {
        console.log('No token found in localStorage');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await authApi.login({ email, password });
      console.log('Login successful, token:', data.token.substring(0, 20) + '...');
      console.log('User data:', data.payload);
      localStorage.setItem('token', data.token);
      setUser(data.payload);
      setLoading(false);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { data } = await authApi.register({ name, email, password });
      console.log('Registration successful, token:', data.token.substring(0, 20) + '...');
      localStorage.setItem('token', data.token);
      setUser(data.payload);
      setLoading(false);
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const { data } = await authApi.getProfile();
      setUser(data.payload);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
