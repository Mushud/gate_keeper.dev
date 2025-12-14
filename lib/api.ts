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
    }
  }
  return config;
});

// Response interceptor for error handling
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       if (typeof window !== 'undefined') {
//         localStorage.removeItem('token');
//         window.location.href = '/login';
//       }
//     }
//     return Promise.reject(error);
//   }
// );

export interface Account {
  _id: string;
  name: string;
  email: string;
  balance: number;
  status: string;
  createdAt: string;
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
  register: (data: { name: string; accountHolderNumber: string; email: string; password: string }) =>
    api.post('/api/account/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/api/account/login', data),
  
  getProfile: () =>
    api.get<{ payload: Account }>('/api/account/profile'),
};

// Projects API
export const projectsApi = {
  list: () =>
    api.get<{ payload: Project[] }>('/api/project/list'),
  
  create: (data: { name: string; senderID: string }) =>
    api.post('/api/project/create', data),
  
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
