// PAVE Admin - API Service Layer
// This layer abstracts API calls and can be switched from mock to real API

import {
  AdminUser,
  User,
  KYCSubmission,
  Wallet,
  Transaction,
  SavingsPlan,
  ThriftPlan,
  ActivityLog,
  DashboardKPIs,
  ChartDataPoint,
  ApiResponse,
  PaginatedResponse,
  UserFilters,
  TransactionFilters,
  KYCStatus,
} from '@/types';

import {
  mockAdminUsers,
  mockUsers,
  mockKYCSubmissions,
  mockWallets,
  mockTransactions,
  mockSavingsPlans,
  mockThriftPlans,
  mockActivityLogs,
  mockDashboardKPIs,
  mockTransactionVolumeData,
  mockSavingsVolumeData,
} from '@/data/mockData';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const USE_MOCK_DATA = !API_BASE_URL || API_BASE_URL === '';

// Simulate network delay for mock data
const simulateDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Generic API fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  if (USE_MOCK_DATA) {
    await simulateDelay(300);
    return { success: true, data: undefined };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'An error occurred',
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Auth Service
export const authService = {
  async login(email: string, password: string): Promise<ApiResponse<AdminUser>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(800);
      const admin = mockAdminUsers.find(a => a.email === email);
      if (admin && password === 'admin123') {
        return { success: true, data: admin };
      }
      return { success: false, error: 'Invalid email or password' };
    }
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(800);
      const admin = mockAdminUsers.find(a => a.email === email);
      if (admin) {
        return { success: true, data: { message: 'Password reset link sent to your email' } };
      }
      return { success: false, error: 'Email not found' };
    }
    return apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async logout(): Promise<ApiResponse<void>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(300);
      return { success: true };
    }
    return apiFetch('/api/auth/logout', { method: 'POST' });
  },
};

// Dashboard Service
export const dashboardService = {
  async getKPIs(): Promise<ApiResponse<DashboardKPIs>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      return { success: true, data: mockDashboardKPIs };
    }
    return apiFetch('/api/dashboard/kpis');
  },

  async getTransactionVolumeChart(): Promise<ApiResponse<ChartDataPoint[]>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(400);
      return { success: true, data: mockTransactionVolumeData };
    }
    return apiFetch('/api/dashboard/charts/transaction-volume');
  },

  async getSavingsVolumeChart(): Promise<ApiResponse<ChartDataPoint[]>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(400);
      return { success: true, data: mockSavingsVolumeData };
    }
    return apiFetch('/api/dashboard/charts/savings-volume');
  },

  async getRecentActivity(): Promise<ApiResponse<ActivityLog[]>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(400);
      return { success: true, data: mockActivityLogs.slice(0, 5) };
    }
    return apiFetch('/api/dashboard/recent-activity');
  },
};

// Users Service
export const usersService = {
  async getUsers(
    page: number = 1,
    limit: number = 10,
    filters?: UserFilters
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      let filtered = [...mockUsers];
      
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(
          u => u.fullName.toLowerCase().includes(search) ||
               u.email.toLowerCase().includes(search)
        );
      }
      
      if (filters?.kycStatus && filters.kycStatus !== 'all') {
        filtered = filtered.filter(u => u.kycStatus === filters.kycStatus);
      }

      const total = filtered.length;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);

      return {
        success: true,
        data: {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return apiFetch(`/api/users?${params}`);
  },

  async getUserById(id: string): Promise<ApiResponse<User>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(300);
      const user = mockUsers.find(u => u.id === id);
      if (user) {
        return { success: true, data: user };
      }
      return { success: false, error: 'User not found' };
    }
    return apiFetch(`/api/users/${id}`);
  },
};

// KYC Service
export const kycService = {
  async getSubmissions(
    status?: KYCStatus | 'all',
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<KYCSubmission>>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      let filtered = [...mockKYCSubmissions];
      
      if (status && status !== 'all') {
        filtered = filtered.filter(k => k.status === status);
      }

      const total = filtered.length;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);

      return {
        success: true,
        data: {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && status !== 'all' ? { status } : {}),
    });
    return apiFetch(`/api/kyc?${params}`);
  },

  async getSubmissionById(id: string): Promise<ApiResponse<KYCSubmission>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(300);
      const submission = mockKYCSubmissions.find(k => k.id === id);
      if (submission) {
        return { success: true, data: submission };
      }
      return { success: false, error: 'KYC submission not found' };
    }
    return apiFetch(`/api/kyc/${id}`);
  },

  async approveKYC(id: string): Promise<ApiResponse<KYCSubmission>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(600);
      const idx = mockKYCSubmissions.findIndex(k => k.id === id);
      if (idx !== -1) {
        mockKYCSubmissions[idx] = {
          ...mockKYCSubmissions[idx],
          status: 'approved',
          reviewedAt: new Date().toISOString(),
        };
        return { success: true, data: mockKYCSubmissions[idx] };
      }
      return { success: false, error: 'KYC submission not found' };
    }
    return apiFetch(`/api/kyc/${id}/approve`, { method: 'POST' });
  },

  async rejectKYC(id: string, reason: string): Promise<ApiResponse<KYCSubmission>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(600);
      const idx = mockKYCSubmissions.findIndex(k => k.id === id);
      if (idx !== -1) {
        mockKYCSubmissions[idx] = {
          ...mockKYCSubmissions[idx],
          status: 'rejected',
          rejectionReason: reason,
          reviewedAt: new Date().toISOString(),
        };
        return { success: true, data: mockKYCSubmissions[idx] };
      }
      return { success: false, error: 'KYC submission not found' };
    }
    return apiFetch(`/api/kyc/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// Wallet Service
export const walletService = {
  async getWallets(
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Wallet>>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      const total = mockWallets.length;
      const start = (page - 1) * limit;
      const data = mockWallets.slice(start, start + limit);

      return {
        success: true,
        data: {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiFetch(`/api/wallets?${params}`);
  },

  async blockWallet(id: string): Promise<ApiResponse<Wallet>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(600);
      const idx = mockWallets.findIndex(w => w.id === id);
      if (idx !== -1) {
        mockWallets[idx] = {
          ...mockWallets[idx],
          status: 'blocked',
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: mockWallets[idx] };
      }
      return { success: false, error: 'Wallet not found' };
    }
    return apiFetch(`/api/wallets/${id}/block`, { method: 'POST' });
  },

  async unblockWallet(id: string): Promise<ApiResponse<Wallet>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(600);
      const idx = mockWallets.findIndex(w => w.id === id);
      if (idx !== -1) {
        mockWallets[idx] = {
          ...mockWallets[idx],
          status: 'enabled',
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: mockWallets[idx] };
      }
      return { success: false, error: 'Wallet not found' };
    }
    return apiFetch(`/api/wallets/${id}/unblock`, { method: 'POST' });
  },
};

// Transaction Service
export const transactionService = {
  async getTransactions(
    page: number = 1,
    limit: number = 10,
    filters?: TransactionFilters
  ): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      let filtered = [...mockTransactions];
      
      if (filters?.type && filters.type !== 'all') {
        filtered = filtered.filter(t => t.type === filters.type);
      }
      
      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter(t => t.status === filters.status);
      }

      const total = filtered.length;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);

      return {
        success: true,
        data: {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return apiFetch(`/api/transactions?${params}`);
  },

  async getTransactionById(id: string): Promise<ApiResponse<Transaction>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(300);
      const transaction = mockTransactions.find(t => t.id === id);
      if (transaction) {
        return { success: true, data: transaction };
      }
      return { success: false, error: 'Transaction not found' };
    }
    return apiFetch(`/api/transactions/${id}`);
  },
};

// Savings Service
export const savingsService = {
  async getSavingsPlans(
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<SavingsPlan>>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      const total = mockSavingsPlans.length;
      const start = (page - 1) * limit;
      const data = mockSavingsPlans.slice(start, start + limit);

      return {
        success: true,
        data: {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiFetch(`/api/savings?${params}`);
  },

  async getSavingsPlanById(id: string): Promise<ApiResponse<SavingsPlan>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(300);
      const plan = mockSavingsPlans.find(s => s.id === id);
      if (plan) {
        return { success: true, data: plan };
      }
      return { success: false, error: 'Savings plan not found' };
    }
    return apiFetch(`/api/savings/${id}`);
  },
};

// Thrift Service
export const thriftService = {
  async getThriftPlans(
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<ThriftPlan>>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      const total = mockThriftPlans.length;
      const start = (page - 1) * limit;
      const data = mockThriftPlans.slice(start, start + limit);

      return {
        success: true,
        data: {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiFetch(`/api/thrift?${params}`);
  },

  async getThriftPlanById(id: string): Promise<ApiResponse<ThriftPlan>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(300);
      const plan = mockThriftPlans.find(t => t.id === id);
      if (plan) {
        return { success: true, data: plan };
      }
      return { success: false, error: 'Thrift plan not found' };
    }
    return apiFetch(`/api/thrift/${id}`);
  },
};
