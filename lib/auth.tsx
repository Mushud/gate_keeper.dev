'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, Account } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Session timeout: 3 hours of inactivity
const SESSION_TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const ACTIVITY_CHECK_INTERVAL_MS = 60 * 1000; // Check every minute
const LAST_ACTIVITY_KEY = 'lastActivityTime';

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
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  // Update last activity time
  const updateLastActivity = useCallback(() => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }, []);

  // Check if session has timed out due to inactivity
  const checkSessionTimeout = useCallback(() => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivity) return false;
    
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
    return timeSinceLastActivity > SESSION_TIMEOUT_MS;
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);

  // Session timeout logout with message
  const sessionTimeoutLogout = useCallback(() => {
    console.log('Session timed out due to inactivity');
    localStorage.removeItem('token');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
    router.push('/login?reason=timeout');
  }, [router]);

  useEffect(() => {
    if (!authChecked) {
      checkAuth();
    }
  }, [authChecked]);

  // Set up activity tracking and session timeout checking
  useEffect(() => {
    if (!user) return;

    // Initialize last activity
    updateLastActivity();

    // Activity events to track
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Throttled activity handler (update at most once per minute)
    let lastUpdate = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) { // Throttle to once per minute
        updateLastActivity();
        lastUpdate = now;
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check for session timeout periodically
    const intervalId = setInterval(() => {
      if (checkSessionTimeout()) {
        sessionTimeoutLogout();
      }
    }, ACTIVITY_CHECK_INTERVAL_MS);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [user, updateLastActivity, checkSessionTimeout, sessionTimeoutLogout]);

  const checkAuth = async () => {
    try {
      // Check for session timeout before making API call
      if (checkSessionTimeout()) {
        console.log('Session timed out, clearing token');
        localStorage.removeItem('token');
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        setLoading(false);
        setAuthChecked(true);
        return;
      }

      const token = localStorage.getItem('token');
      if (token) {
        console.log('Checking auth with token:', token.substring(0, 20) + '...');
        const { data } = await authApi.getProfile();
        console.log('Auth check successful, user:', data.payload);
        setUser(data.payload);
        updateLastActivity();
      } else {
        console.log('No token found in localStorage');
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      // Handle specific error codes for expired/invalidated tokens
      if (error?.response?.data?.code === 'TOKEN_EXPIRED' || 
          error?.response?.data?.code === 'TOKEN_INVALIDATED' ||
          error?.response?.status === 401) {
        console.log('Token expired or invalidated, clearing');
      }
      localStorage.removeItem('token');
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      setUser(null);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await authApi.login({ email, password });
      console.log('Login successful, token:', data.token.substring(0, 20) + '...');
      console.log('User data:', data.payload);
      localStorage.setItem('token', data.token);
      updateLastActivity(); // Start session tracking
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
      updateLastActivity(); // Start session tracking
      setUser(data.payload);
      setLoading(false);
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const { data } = await authApi.getProfile();
      setUser(data.payload);
      updateLastActivity();
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      // If token is expired/invalidated during refresh, logout
      if (error?.response?.status === 401) {
        logout();
      }
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
