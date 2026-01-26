// PAVE Admin - Mock Data / Seed Data

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
} from '@/types';

// Helper to generate random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Helper to generate random date within range
const randomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
};

// Helper to format currency
export const formatCurrency = (amount: number, currency = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper to format date
export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: string): string => {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Admin Users
export const mockAdminUsers: AdminUser[] = [
  {
    id: 'admin_001',
    name: 'Chinedu Okonkwo',
    email: 'chinedu@pave.ng',
    role: 'super_admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chinedu',
    createdAt: '2024-01-15T08:00:00Z',
    lastLoginAt: '2025-01-26T09:30:00Z',
  },
  {
    id: 'admin_002',
    name: 'Amaka Eze',
    email: 'amaka@pave.ng',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amaka',
    createdAt: '2024-03-20T10:00:00Z',
    lastLoginAt: '2025-01-25T14:20:00Z',
  },
];

// Users
export const mockUsers: User[] = [
  {
    id: 'user_001',
    fullName: 'Oluwaseun Adeyemi',
    email: 'seun.adeyemi@email.com',
    phone: '+234 803 456 7890',
    createdAt: '2024-06-15T10:30:00Z',
    kycStatus: 'approved',
    walletEnabled: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Seun',
  },
  {
    id: 'user_002',
    fullName: 'Fatima Bello',
    email: 'fatima.bello@email.com',
    phone: '+234 802 123 4567',
    createdAt: '2024-07-20T14:15:00Z',
    kycStatus: 'pending',
    walletEnabled: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
  },
  {
    id: 'user_003',
    fullName: 'Emeka Nwosu',
    email: 'emeka.nwosu@email.com',
    phone: '+234 805 987 6543',
    createdAt: '2024-08-10T09:00:00Z',
    kycStatus: 'approved',
    walletEnabled: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emeka',
  },
  {
    id: 'user_004',
    fullName: 'Ngozi Okafor',
    email: 'ngozi.okafor@email.com',
    phone: '+234 809 111 2222',
    createdAt: '2024-09-05T16:45:00Z',
    kycStatus: 'rejected',
    walletEnabled: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ngozi',
  },
  {
    id: 'user_005',
    fullName: 'Yusuf Abdullahi',
    email: 'yusuf.abdullahi@email.com',
    phone: '+234 807 333 4444',
    createdAt: '2024-10-12T11:20:00Z',
    kycStatus: 'approved',
    walletEnabled: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yusuf',
  },
  {
    id: 'user_006',
    fullName: 'Chioma Ibe',
    email: 'chioma.ibe@email.com',
    phone: '+234 806 555 6666',
    createdAt: '2024-11-01T08:30:00Z',
    kycStatus: 'pending',
    walletEnabled: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chioma',
  },
  {
    id: 'user_007',
    fullName: 'Ibrahim Musa',
    email: 'ibrahim.musa@email.com',
    phone: '+234 808 777 8888',
    createdAt: '2024-11-15T13:00:00Z',
    kycStatus: 'approved',
    walletEnabled: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ibrahim',
  },
  {
    id: 'user_008',
    fullName: 'Aisha Mohammed',
    email: 'aisha.mohammed@email.com',
    phone: '+234 801 999 0000',
    createdAt: '2024-12-01T10:00:00Z',
    kycStatus: 'pending',
    walletEnabled: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha',
  },
];

// KYC Submissions
export const mockKYCSubmissions: KYCSubmission[] = [
  {
    id: 'kyc_001',
    userId: 'user_001',
    bvn: '22345678901',
    nin: '12345678901',
    faceImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Seun',
    livenessStatus: 'passed',
    faceMatchScore: 95.5,
    status: 'approved',
    submittedAt: '2024-06-16T11:00:00Z',
    reviewedAt: '2024-06-16T14:30:00Z',
    reviewedBy: 'admin_001',
  },
  {
    id: 'kyc_002',
    userId: 'user_002',
    bvn: '22345678902',
    nin: '12345678902',
    faceImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    livenessStatus: 'pending',
    faceMatchScore: 0,
    status: 'pending',
    submittedAt: '2025-01-25T09:00:00Z',
  },
  {
    id: 'kyc_003',
    userId: 'user_003',
    bvn: '22345678903',
    nin: '12345678903',
    faceImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emeka',
    livenessStatus: 'passed',
    faceMatchScore: 92.0,
    status: 'approved',
    submittedAt: '2024-08-11T10:00:00Z',
    reviewedAt: '2024-08-11T15:00:00Z',
    reviewedBy: 'admin_002',
  },
  {
    id: 'kyc_004',
    userId: 'user_004',
    bvn: '22345678904',
    nin: '12345678904',
    faceImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ngozi',
    livenessStatus: 'failed',
    faceMatchScore: 45.0,
    status: 'rejected',
    rejectionReason: 'Face match score below threshold. Please resubmit with clearer photo.',
    submittedAt: '2024-09-06T08:00:00Z',
    reviewedAt: '2024-09-06T12:00:00Z',
    reviewedBy: 'admin_001',
  },
  {
    id: 'kyc_005',
    userId: 'user_006',
    bvn: '22345678906',
    nin: '12345678906',
    faceImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chioma',
    livenessStatus: 'pending',
    faceMatchScore: 0,
    status: 'pending',
    submittedAt: '2025-01-24T14:00:00Z',
  },
  {
    id: 'kyc_006',
    userId: 'user_008',
    bvn: '22345678908',
    nin: '12345678908',
    faceImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha',
    livenessStatus: 'passed',
    faceMatchScore: 88.5,
    status: 'pending',
    submittedAt: '2025-01-26T08:00:00Z',
  },
];

// Wallets
export const mockWallets: Wallet[] = [
  {
    id: 'wallet_001',
    userId: 'user_001',
    balance: 250000,
    status: 'enabled',
    currency: 'NGN',
    updatedAt: '2025-01-25T18:00:00Z',
    createdAt: '2024-06-16T15:00:00Z',
  },
  {
    id: 'wallet_002',
    userId: 'user_002',
    balance: 0,
    status: 'pending',
    currency: 'NGN',
    updatedAt: '2024-07-20T14:15:00Z',
    createdAt: '2024-07-20T14:15:00Z',
  },
  {
    id: 'wallet_003',
    userId: 'user_003',
    balance: 1500000,
    status: 'enabled',
    currency: 'NGN',
    updatedAt: '2025-01-26T10:00:00Z',
    createdAt: '2024-08-11T16:00:00Z',
  },
  {
    id: 'wallet_004',
    userId: 'user_004',
    balance: 0,
    status: 'blocked',
    currency: 'NGN',
    updatedAt: '2024-09-06T12:00:00Z',
    createdAt: '2024-09-05T16:45:00Z',
  },
  {
    id: 'wallet_005',
    userId: 'user_005',
    balance: 75000,
    status: 'enabled',
    currency: 'NGN',
    updatedAt: '2025-01-20T09:00:00Z',
    createdAt: '2024-10-13T08:00:00Z',
  },
  {
    id: 'wallet_006',
    userId: 'user_007',
    balance: 450000,
    status: 'enabled',
    currency: 'NGN',
    updatedAt: '2025-01-25T16:30:00Z',
    createdAt: '2024-11-16T10:00:00Z',
  },
];

// Transactions
export const mockTransactions: Transaction[] = [
  {
    id: 'txn_001',
    userId: 'user_001',
    type: 'deposit',
    amount: 100000,
    status: 'completed',
    reference: 'DEP-2025012601',
    description: 'Bank transfer deposit',
    createdAt: '2025-01-26T08:30:00Z',
  },
  {
    id: 'txn_002',
    userId: 'user_003',
    type: 'withdrawal',
    amount: 50000,
    status: 'completed',
    reference: 'WTH-2025012501',
    description: 'Withdrawal to GTBank',
    createdAt: '2025-01-25T14:00:00Z',
  },
  {
    id: 'txn_003',
    userId: 'user_001',
    type: 'savings',
    amount: 25000,
    status: 'completed',
    reference: 'SAV-2025012401',
    description: 'Savings contribution',
    createdAt: '2025-01-24T10:00:00Z',
  },
  {
    id: 'txn_004',
    userId: 'user_005',
    type: 'thrift',
    amount: 10000,
    status: 'completed',
    reference: 'THR-2025012301',
    description: 'Weekly Ajo contribution',
    createdAt: '2025-01-23T09:00:00Z',
  },
  {
    id: 'txn_005',
    userId: 'user_007',
    type: 'deposit',
    amount: 200000,
    status: 'pending',
    reference: 'DEP-2025012602',
    description: 'Card payment pending',
    createdAt: '2025-01-26T10:00:00Z',
  },
  {
    id: 'txn_006',
    userId: 'user_003',
    type: 'savings',
    amount: 100000,
    status: 'completed',
    reference: 'SAV-2025012201',
    description: 'Fixed savings lock',
    createdAt: '2025-01-22T11:30:00Z',
  },
  {
    id: 'txn_007',
    userId: 'user_001',
    type: 'withdrawal',
    amount: 30000,
    status: 'failed',
    reference: 'WTH-2025012101',
    description: 'Insufficient balance',
    createdAt: '2025-01-21T15:00:00Z',
  },
  {
    id: 'txn_008',
    userId: 'user_007',
    type: 'thrift',
    amount: 15000,
    status: 'completed',
    reference: 'THR-2025012001',
    description: 'Monthly Esusu contribution',
    createdAt: '2025-01-20T08:00:00Z',
  },
];

// Savings Plans
export const mockSavingsPlans: SavingsPlan[] = [
  {
    id: 'sav_001',
    userId: 'user_001',
    type: 'flexible',
    name: 'Emergency Fund',
    targetAmount: 500000,
    currentAmount: 175000,
    startDate: '2024-09-01T00:00:00Z',
    status: 'active',
    earlyWithdrawalPenaltyPct: 0,
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'sav_002',
    userId: 'user_003',
    type: 'fixed',
    name: 'House Rent',
    targetAmount: 1200000,
    currentAmount: 1200000,
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T00:00:00Z',
    status: 'completed',
    earlyWithdrawalPenaltyPct: 10,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sav_003',
    userId: 'user_005',
    type: 'fixed',
    name: 'Car Purchase',
    targetAmount: 5000000,
    currentAmount: 750000,
    startDate: '2024-11-01T00:00:00Z',
    endDate: '2025-10-31T00:00:00Z',
    status: 'active',
    earlyWithdrawalPenaltyPct: 15,
    createdAt: '2024-11-01T00:00:00Z',
  },
  {
    id: 'sav_004',
    userId: 'user_007',
    type: 'flexible',
    name: 'Travel Fund',
    targetAmount: 300000,
    currentAmount: 220000,
    startDate: '2024-12-01T00:00:00Z',
    status: 'active',
    earlyWithdrawalPenaltyPct: 0,
    createdAt: '2024-12-01T00:00:00Z',
  },
];

// Thrift Plans
export const mockThriftPlans: ThriftPlan[] = [
  {
    id: 'thr_001',
    creatorUserId: 'user_001',
    name: 'Office Ajo Group',
    contributionAmount: 10000,
    frequency: 'weekly',
    durationMonths: 6,
    startDate: '2024-10-01T00:00:00Z',
    status: 'active',
    memberCount: 12,
    missedCount: 2,
    penaltyType: 'percentage',
    penaltyValue: 5,
    payoutAtMaturity: true,
    createdAt: '2024-09-25T00:00:00Z',
  },
  {
    id: 'thr_002',
    creatorUserId: 'user_003',
    name: 'Family Esusu',
    contributionAmount: 50000,
    frequency: 'monthly',
    durationMonths: 12,
    startDate: '2024-06-01T00:00:00Z',
    status: 'active',
    memberCount: 8,
    missedCount: 0,
    penaltyType: 'fixed',
    penaltyValue: 2000,
    payoutAtMaturity: false,
    createdAt: '2024-05-20T00:00:00Z',
  },
  {
    id: 'thr_003',
    creatorUserId: 'user_005',
    name: 'Business Partners Contribution',
    contributionAmount: 25000,
    frequency: 'weekly',
    durationMonths: 3,
    startDate: '2024-12-01T00:00:00Z',
    status: 'active',
    memberCount: 5,
    missedCount: 1,
    penaltyType: 'percentage',
    penaltyValue: 10,
    payoutAtMaturity: true,
    createdAt: '2024-11-28T00:00:00Z',
  },
  {
    id: 'thr_004',
    creatorUserId: 'user_007',
    name: 'Friends Daily Save',
    contributionAmount: 2000,
    frequency: 'daily',
    durationMonths: 1,
    startDate: '2025-01-01T00:00:00Z',
    status: 'completed',
    memberCount: 4,
    missedCount: 3,
    penaltyType: 'none',
    payoutAtMaturity: true,
    createdAt: '2024-12-28T00:00:00Z',
  },
];

// Activity Logs
export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'log_001',
    adminId: 'admin_001',
    action: 'KYC Approved',
    details: 'Approved KYC for Oluwaseun Adeyemi',
    entityType: 'kyc',
    entityId: 'kyc_001',
    createdAt: '2024-06-16T14:30:00Z',
  },
  {
    id: 'log_002',
    userId: 'user_003',
    action: 'Deposit',
    details: 'Deposited ₦1,500,000 via bank transfer',
    entityType: 'transaction',
    entityId: 'txn_002',
    createdAt: '2025-01-25T14:00:00Z',
  },
  {
    id: 'log_003',
    adminId: 'admin_001',
    action: 'KYC Rejected',
    details: 'Rejected KYC for Ngozi Okafor - Face match failed',
    entityType: 'kyc',
    entityId: 'kyc_004',
    createdAt: '2024-09-06T12:00:00Z',
  },
  {
    id: 'log_004',
    userId: 'user_001',
    action: 'Savings Created',
    details: 'Created Emergency Fund savings plan',
    entityType: 'savings',
    entityId: 'sav_001',
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'log_005',
    userId: 'user_005',
    action: 'Thrift Joined',
    details: 'Joined Business Partners Contribution thrift',
    entityType: 'thrift',
    entityId: 'thr_003',
    createdAt: '2024-12-01T08:00:00Z',
  },
];

// Dashboard KPIs
export const mockDashboardKPIs: DashboardKPIs = {
  totalUsers: 8,
  activeUsers: 6,
  totalTransactionVolume: 530000,
  savingsVolume: 2345000,
  thriftCompletionRate: 85.5,
  pendingKYC: 3,
};

// Chart data - Transaction volume over time
export const mockTransactionVolumeData: ChartDataPoint[] = [
  { date: '2025-01-01', value: 450000, label: 'Jan 1' },
  { date: '2025-01-05', value: 680000, label: 'Jan 5' },
  { date: '2025-01-10', value: 520000, label: 'Jan 10' },
  { date: '2025-01-15', value: 890000, label: 'Jan 15' },
  { date: '2025-01-20', value: 1200000, label: 'Jan 20' },
  { date: '2025-01-25', value: 950000, label: 'Jan 25' },
];

// Chart data - Savings volume over time
export const mockSavingsVolumeData: ChartDataPoint[] = [
  { date: '2025-01-01', value: 1800000, label: 'Jan 1' },
  { date: '2025-01-05', value: 1950000, label: 'Jan 5' },
  { date: '2025-01-10', value: 2100000, label: 'Jan 10' },
  { date: '2025-01-15', value: 2200000, label: 'Jan 15' },
  { date: '2025-01-20', value: 2280000, label: 'Jan 20' },
  { date: '2025-01-25', value: 2345000, label: 'Jan 25' },
];

// Get user by ID helper
export const getUserById = (userId: string): User | undefined => {
  return mockUsers.find(user => user.id === userId);
};

// Get KYC by user ID helper
export const getKYCByUserId = (userId: string): KYCSubmission | undefined => {
  return mockKYCSubmissions.find(kyc => kyc.userId === userId);
};

// Get wallet by user ID helper
export const getWalletByUserId = (userId: string): Wallet | undefined => {
  return mockWallets.find(wallet => wallet.userId === userId);
};

// Get transactions by user ID helper
export const getTransactionsByUserId = (userId: string): Transaction[] => {
  return mockTransactions.filter(txn => txn.userId === userId);
};

// Get savings by user ID helper
export const getSavingsByUserId = (userId: string): SavingsPlan[] => {
  return mockSavingsPlans.filter(plan => plan.userId === userId);
};

// Get thrifts by user ID helper
export const getThriftsByUserId = (userId: string): ThriftPlan[] => {
  return mockThriftPlans.filter(plan => plan.creatorUserId === userId);
};
