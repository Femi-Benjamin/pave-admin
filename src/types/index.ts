// PAVE Admin - TypeScript Types

export type AdminRole = 'admin' | 'super_admin';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  token?: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateAdminAccountInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  role?: 'admin' | 'superadmin';
}

export interface CreateAdminAccountResponse {
  message: string;
  user: Record<string, unknown>;
}

export interface AdminPendingKycUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  nin?: string | null;
  kycDocumentType?: string | null;
  isKycVerified: boolean;
  kycStatus: KYCStatus;
  createdAt: string;
}

export interface AdminKycApprovalResponse {
  id: string;
  isKycVerified: boolean;
  kycStatus: KYCStatus;
}

export interface AdminUserDetails {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  balance: number;
  accountName: string | null;
  accountNumber: string | null;
  signUpOn: string;
  lastLogin: string | null;
  address: string | null;
  status: string;
  isBlocked?: boolean;
}

export interface AdminUserTransaction {
  _id: string;
  userId: string;
  amount: number;
  reference: string;
  status: string;
  description?: string;
  type?: string;
  createdAt: string;
  updatedAt?: string;
  meterNumber?: string;
  meterAccountNumber?: string;
  transactionFees?: number;
}

export interface AdminBlockUserResponse {
  id: string;
  fullName: string;
  email: string;
  isBlocked: boolean;
  statusMessage: string;
}

export interface AdminTransactionUser {
  _id: string;
  email?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface AdminTransaction {
  _id: string;
  userId: string | AdminTransactionUser;
  amount: number;
  reference: string;
  status: string;
  description?: string;
  type?: string;
  createdAt: string;
  updatedAt?: string;
  meterNumber?: string;
  meterAccountNumber?: string;
  tariff?: string;
  vendType?: string;
  subclass?: string;
  vendTime?: string;
  unitsActual?: number;
  unitName?: string;
  transactionFees?: number;
  vendorTransactionFees?: number;
  clientTransactionFees?: number;
  vat?: number;
  tokenHex?: string;
  tokenDec?: string;
}

export interface AdminTransactionsResponse {
  totalTransactions: number;
  data: AdminTransaction[];
}

export interface AdminUserRole {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isBlocked: boolean;
  wallet?: string;
  createdAt?: string;
}

export type KYCStatus = 'pending' | 'approved' | 'rejected';
export type WalletStatus = 'enabled' | 'blocked' | 'pending';
export type TransactionType = 'deposit' | 'withdrawal' | 'savings' | 'thrift';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';
export type SavingsType = 'flexible' | 'fixed';
export type SavingsStatus = 'active' | 'completed' | 'withdrawn' | 'cancelled';
export type ThriftFrequency = 'daily' | 'weekly' | 'monthly';
export type ThriftStatus = 'active' | 'completed' | 'cancelled';
export type PenaltyType = 'percentage' | 'fixed' | 'none';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  kycStatus: KYCStatus;
  walletEnabled: boolean;
  avatar?: string;
}

export interface KYCSubmission {
  id: string;
  userId: string;
  bvn: string;
  nin: string;
  faceImageUrl: string;
  livenessStatus: 'passed' | 'failed' | 'pending';
  faceMatchScore: number;
  status: KYCStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  status: WalletStatus;
  currency: string;
  updatedAt: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference: string;
  description?: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface SavingsPlan {
  id: string;
  userId: string;
  type: SavingsType;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate?: string;
  status: SavingsStatus;
  earlyWithdrawalPenaltyPct: number;
  createdAt: string;
}

export interface ThriftPlan {
  id: string;
  creatorUserId: string;
  name: string;
  contributionAmount: number;
  frequency: ThriftFrequency;
  durationMonths: number;
  startDate: string;
  status: ThriftStatus;
  memberCount: number;
  missedCount: number;
  penaltyType: PenaltyType;
  penaltyValue?: number;
  payoutAtMaturity: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  adminId?: string;
  action: string;
  details: string;
  entityType: 'user' | 'kyc' | 'wallet' | 'transaction' | 'savings' | 'thrift';
  entityId: string;
  createdAt: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard KPI types
export interface DashboardKPIs {
  totalUsers: number;
  activeUsers: number;
  totalTransactionVolume: number;
  savingsVolume: number;
  thriftCompletionRate: number;
  pendingKYC: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// Filter types
export interface UserFilters {
  search?: string;
  kycStatus?: KYCStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export interface TransactionFilters {
  search?: string;
  type?: TransactionType | 'all';
  status?: TransactionStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
}
