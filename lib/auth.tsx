'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, membersApi, Account, Member } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Session timeout: 3 hours of inactivity
const SESSION_TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const ACTIVITY_CHECK_INTERVAL_MS = 60 * 1000; // Check every minute
const LAST_ACTIVITY_KEY = 'lastActivityTime';
const USER_ROLE_KEY = 'userRole';
const IS_MEMBER_KEY = 'isMember';
const MEMBER_INFO_KEY = 'memberInfo';
const ACCESSIBLE_ACCOUNTS_KEY = 'accessibleAccounts';

type UserRole = 'admin' | 'developer' | 'viewer' | 'owner';

interface AccessibleAccount {
  accountId: string;
  accountName: string;
  isOwner: boolean;
  role: string;
  isCurrent?: boolean;
}

interface AuthContextType {
  user: Account | null;
  loading: boolean;
  role: UserRole;
  isMember: boolean;
  member: Member | null;
  accessibleAccounts: AccessibleAccount[];
  hasMultipleAccounts: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchAccount: (accountId: string) => Promise<void>;
  hasPermission: (action: 'create_project' | 'edit_project' | 'delete_project' | 'manage_members' | 'view_billing') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [role, setRole] = useState<UserRole>('admin');
  const [isMember, setIsMember] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [accessibleAccounts, setAccessibleAccounts] = useState<AccessibleAccount[]>([]);
  const router = useRouter();

  const hasMultipleAccounts = accessibleAccounts.length > 1;

  // Permission helper
  const hasPermission = useCallback((action: 'create_project' | 'edit_project' | 'delete_project' | 'manage_members' | 'view_billing'): boolean => {
    switch (action) {
      case 'create_project':
        return role === 'admin' || role === 'developer' || role === 'owner';
      case 'edit_project':
        return role === 'admin' || role === 'developer' || role === 'owner';
      case 'delete_project':
        return role === 'admin' || role === 'owner';
      case 'manage_members':
        return role === 'admin' || role === 'owner';
      case 'view_billing':
        return true; // All roles can view billing
      default:
        return false;
    }
  }, [role]);

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
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(IS_MEMBER_KEY);
    localStorage.removeItem(MEMBER_INFO_KEY);
    localStorage.removeItem(ACCESSIBLE_ACCOUNTS_KEY);
    setUser(null);
    setRole('admin');
    setIsMember(false);
    setMember(null);
    setAccessibleAccounts([]);
    router.push('/login');
  }, [router]);

  // Session timeout logout with message
  const sessionTimeoutLogout = useCallback(() => {
    console.log('Session timed out due to inactivity');
    localStorage.removeItem('token');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(IS_MEMBER_KEY);
    localStorage.removeItem(MEMBER_INFO_KEY);
    localStorage.removeItem(ACCESSIBLE_ACCOUNTS_KEY);
    setUser(null);
    setRole('admin');
    setIsMember(false);
    setMember(null);
    setAccessibleAccounts([]);
    router.push('/login?reason=timeout');
  }, [router]);

  // Switch account function
  const switchAccount = useCallback(async (accountId: string) => {
    try {
      setLoading(true);
      const { data } = await authApi.switchAccount(accountId);
      
      // Update token
      localStorage.setItem('token', data.token);
      
      // Update role and member info
      const newRole = data.isMember ? data.role : 'owner';
      setRole(newRole as UserRole);
      setIsMember(data.isMember);
      setMember(data.member || null);
      
      localStorage.setItem(USER_ROLE_KEY, newRole);
      localStorage.setItem(IS_MEMBER_KEY, data.isMember.toString());
      if (data.member) {
        localStorage.setItem(MEMBER_INFO_KEY, JSON.stringify(data.member));
      } else {
        localStorage.removeItem(MEMBER_INFO_KEY);
      }
      
      // Update accessible accounts with current marker
      if (data.accessibleAccounts) {
        setAccessibleAccounts(data.accessibleAccounts);
        localStorage.setItem(ACCESSIBLE_ACCOUNTS_KEY, JSON.stringify(data.accessibleAccounts));
      }
      
      // Refresh user profile
      const profileRes = await authApi.getProfile();
      setUser(profileRes.data.payload);
      updateLastActivity();
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to switch account:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router, updateLastActivity]);

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
        
        // Restore role/member info from localStorage
        const storedRole = localStorage.getItem(USER_ROLE_KEY) as UserRole | null;
        const storedIsMember = localStorage.getItem(IS_MEMBER_KEY) === 'true';
        const storedMemberInfo = localStorage.getItem(MEMBER_INFO_KEY);
        const storedAccessibleAccounts = localStorage.getItem(ACCESSIBLE_ACCOUNTS_KEY);
        
        if (storedRole) {
          setRole(storedRole);
        }
        setIsMember(storedIsMember);
        if (storedMemberInfo) {
          try {
            setMember(JSON.parse(storedMemberInfo));
          } catch {
            setMember(null);
          }
        }
        
        // Restore accessible accounts from localStorage or fetch them
        if (storedAccessibleAccounts) {
          try {
            setAccessibleAccounts(JSON.parse(storedAccessibleAccounts));
          } catch {
            setAccessibleAccounts([]);
          }
        } else {
          // Fetch accessible accounts if not cached
          try {
            const accountsRes = await authApi.getAccessibleAccounts();
            if (accountsRes.data?.accounts) {
              setAccessibleAccounts(accountsRes.data.accounts);
              localStorage.setItem(ACCESSIBLE_ACCOUNTS_KEY, JSON.stringify(accountsRes.data.accounts));
            }
          } catch {
            // Ignore errors - not critical
            console.log('Could not fetch accessible accounts');
          }
        }
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
      localStorage.removeItem(USER_ROLE_KEY);
      localStorage.removeItem(IS_MEMBER_KEY);
      localStorage.removeItem(MEMBER_INFO_KEY);
      localStorage.removeItem(ACCESSIBLE_ACCOUNTS_KEY);
      setUser(null);
      setRole('admin');
      setIsMember(false);
      setMember(null);
      setAccessibleAccounts([]);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await authApi.login({ email, password });
      
      // If OTP is required, don't set token yet (handled by verify-otp page)
      if (data.requiresOTP) {
        console.log('OTP verification required');
        return; // Let the login page handle redirect to OTP verification
      }
      
      // Direct login (fallback if OTP not required)
      if (data.token) {
        console.log('Login successful, token:', data.token.substring(0, 20) + '...');
        localStorage.setItem('token', data.token);
        updateLastActivity(); // Start session tracking
        // Fetch user profile after login
        const profileRes = await authApi.getProfile();
        setUser(profileRes.data.payload);
        setLoading(false);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { data } = await authApi.register({ name, email, password });
      if (data.token) {
        console.log('Registration successful, token:', data.token.substring(0, 20) + '...');
        localStorage.setItem('token', data.token);
        updateLastActivity(); // Start session tracking
        setUser(data.payload);
        setLoading(false);
        router.push('/dashboard');
      }
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
      
      // Also refresh member data if user is a member
      if (isMember) {
        try {
          const memberProfile = await membersApi.getProfile();
          const updatedMember = {
            memberId: memberProfile.data.memberId,
            email: memberProfile.data.email,
            name: memberProfile.data.name,
            phone: memberProfile.data.phone,
            role: memberProfile.data.role as 'admin' | 'developer' | 'viewer',
            status: memberProfile.data.status as 'pending' | 'active' | 'disabled',
            createdAt: memberProfile.data.createdAt,
          };
          setMember(updatedMember);
          localStorage.setItem(MEMBER_INFO_KEY, JSON.stringify(updatedMember));
        } catch (memberError) {
          console.error('Failed to refresh member profile:', memberError);
        }
      }
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      // If token is expired/invalidated during refresh, logout
      if (error?.response?.status === 401) {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, role, isMember, member, accessibleAccounts, hasMultipleAccounts, login, register, logout, refreshUser, switchAccount, hasPermission }}>
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
