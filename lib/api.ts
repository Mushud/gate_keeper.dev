import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request:', config.method?.toUpperCase(), config.url, 'with token');
    } else {
      console.log('API Request:', config.method?.toUpperCase(), config.url, 'without token');
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status, error.response?.data);
    // Don't auto-redirect on 401 - let individual components handle auth failures
    // This prevents redirect loops when checkAuth fails
    return Promise.reject(error);
  }
);

export interface Account {
  _id: string;
  accountID: string;
  name: string;
  email: string;
  balance: number;
  status: string;
  createdAt: string;
  accountHolderNumber?: string;
  verified?: boolean;
}

export interface Member {
  memberId: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'developer' | 'viewer';
  status: 'pending' | 'active' | 'disabled';
  assignedProjects?: Project[];
  createdAt: string;
}

export interface AuthUser extends Account {
  isMember?: boolean;
  role?: 'admin' | 'developer' | 'viewer';
  member?: Member;
}

export interface Project {
  _id: string;
  name: string;
  key: string;
  senderID: string;
  account: string;
  status: string;
  createdAt: string;
}

export interface CheckoutSession {
  sessionToken: string;
  projectName: string;
  checkoutUrl: string;
  status: string;
  phoneNumber?: string;
  verifiedAt?: string;
  expiresAt: string;
}

export interface OTPRecord {
  _id: string;
  receiver: string;
  reference: string;
  name?: string;
  type: string;
  verified: boolean;
  expiresAt: string;
  createdAt: string;
}

// Auth API
export const authApi = {
  register: (data: { name: string; accountHolderNumber?: string; email: string; password: string }) =>
    api.post<{ payload: Account; token: string }>('/api/account/register', data),
  
  login: (data: { email: string; password: string; accountId?: string }) =>
    api.post<{ 
      message: string; 
      requiresOTP?: boolean; 
      reference?: string;
      maskedPhone?: string;
      maskedEmail?: string;
      token?: string;
      isMember?: boolean;
      role?: string;
      // Multi-account selection
      selectAccount?: boolean;
      accounts?: Array<{
        accountId: string;
        accountName: string;
        role: string;
        isOwner: boolean;
      }>;
    }>('/api/account/login', data),
  
  verifyLoginOTP: (data: { reference: string; otp: string }) =>
    api.post<{ 
      message: string; 
      token: string; 
      account: Account;
      isMember?: boolean;
      role?: 'admin' | 'developer' | 'viewer';
      member?: Member;
    }>('/api/account/verify-login-otp', data),
  
  resendLoginOTP: (data: { reference: string }) =>
    api.post<{ message: string }>('/api/account/resend-login-otp', data),
  
  getProfile: () =>
    api.get<{ payload: Account }>('/api/account/profile'),
  
  getAccessibleAccounts: () =>
    api.get<{ accounts: Array<{
      accountId: string;
      accountName: string;
      isOwner: boolean;
      role: string;
    }> }>('/api/account/accessible-accounts'),
  
  switchAccount: (accountId: string) =>
    api.post<{
      message: string;
      token: string;
      account: Account;
      isMember: boolean;
      role: string;
      member?: Member;
      accessibleAccounts: Array<{
        accountId: string;
        accountName: string;
        isOwner: boolean;
        role: string;
        isCurrent: boolean;
      }>;
    }>('/api/account/switch', { accountId }),
};

// Members API
export const membersApi = {
  list: () =>
    api.get<{ members: Member[]; count: number }>('/api/account/members'),
  
  invite: (data: { email: string; name?: string; phone: string; role: string }) =>
    api.post<{ message: string; memberId: string; role: string }>('/api/account/members/invite', data),
  
  getInviteDetails: (token: string) =>
    api.get<{ email: string; name?: string; phone?: string; role: string; accountName: string; expiresAt: string }>(`/api/account/members/invite/${token}`),
  
  acceptInvite: (data: { token: string; name?: string; phone?: string; password: string }) =>
    api.post<{ message: string; email: string; accountName: string; role: string }>('/api/account/members/accept-invite', data),
  
  getMember: (memberId: string) =>
    api.get<Member>(`/api/account/members/${memberId}`),
  
  updateMember: (memberId: string, data: { role?: string; status?: string; name?: string; phone?: string }) =>
    api.put<{ message: string; member: Member }>(`/api/account/members/${memberId}`, data),
  
  removeMember: (memberId: string) =>
    api.delete<{ message: string }>(`/api/account/members/${memberId}`),
  
  assignProjects: (memberId: string, projectIds: string[]) =>
    api.put<{ message: string; member: Member }>(`/api/account/members/${memberId}/projects`, { projectIds }),
  
  invalidateSessions: (memberId: string) =>
    api.post<{ message: string }>(`/api/account/members/${memberId}/invalidate-sessions`),

  // Member self-service endpoints
  getProfile: () =>
    api.get<{ memberId: string; email: string; name: string; phone: string; role: string; status: string; accountName: string; accountID: string; createdAt: string }>('/api/member/profile'),
  
  updateProfile: (data: { name?: string }) =>
    api.put<{ message: string; member: Member }>('/api/member/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<{ message: string }>('/api/member/change-password', data),
};

// Projects API
export const projectsApi = {
  list: () =>
    api.get<{ projects: Project[] }>('/api/projects'),
  
  create: (data: { name: string; senderID: string }) =>
    api.post('/api/create_project', data),
  
  getOTPRecords: (projectId: string, limit?: number) =>
    api.post('/api/project/otp_records', { project: projectId, limit }),
};

// Checkout API
export const checkoutApi = {
  create: (data: {
    project: string;
    successUrl: string;
    statusCallback?: string;
    metadata?: Record<string, any>;
  }) =>
    api.post<{ sessionToken: string; checkoutUrl: string }>('/api/checkout/create', data),
};

export default api;
