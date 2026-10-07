import type {
  AdminRole,
  AdminUser,
  ActivityLog,
  AdminBlockUserResponse,
  AdminKycApprovalResponse,
  AdminPendingKycUser,
  AdminTransaction,
  AdminTransactionsResponse,
  AdminUserDetails,
  AdminUserRole,
  AdminUserTransaction,
  ApiResponse,
  CreateAdminAccountInput,
  CreateAdminAccountResponse,
  DashboardKPIs,
  KYCStatus,
  PaginatedResponse,
  SavingsPlan,
  ThriftPlan,
  Transaction,
  TransactionFilters,
  User,
  UserFilters,
  Wallet,
} from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const responseMessage = (body: unknown, fallback: string) =>
  isRecord(body) && typeof body.message === "string" ? body.message : fallback;

function failedResponse<T>(response: ApiResponse<unknown>): ApiResponse<T> {
  return {
    success: false,
    error: response.error,
    message: response.message,
  };
}

function getStoredToken(): string | undefined {
  const token = localStorage.getItem("pave_admin_token");
  if (token) return token;

  const storedAuth = localStorage.getItem("pave_admin_auth");
  if (!storedAuth) return undefined;

  try {
    const parsed: unknown = JSON.parse(storedAuth);
    return isRecord(parsed) && typeof parsed.token === "string"
      ? parsed.token
      : undefined;
  } catch {
    return undefined;
  }
}

async function requestApi(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<unknown>> {
  if (!API_BASE_URL) {
    return {
      success: false,
      error: "VITE_API_BASE_URL is not configured.",
    };
  }

  try {
    const token = getStoredToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    const contentType = response.headers.get("content-type") || "";
    const body: unknown = contentType.includes("application/json")
      ? await response.json()
      : undefined;

    if (!response.ok) {
      return {
        success: false,
        error: responseMessage(body, `Request failed (${response.status})`),
      };
    }
    if (isRecord(body) && (body.success === false || body.status === false)) {
      return { success: false, error: responseMessage(body, "Request failed") };
    }

    return {
      success: true,
      data: body,
      message: responseMessage(body, ""),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await requestApi(endpoint, options);
  if (!response.success) return failedResponse<T>(response);
  const body = response.data;

  return {
    ...response,
    data: (isRecord(body) && "data" in body ? body.data : body) as T,
  };
}

async function apiFetchRaw<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await requestApi(endpoint, options);
  return response.success
    ? { ...response, data: response.data as T }
    : failedResponse<T>(response);
}

function unavailable<T>(capability: string): ApiResponse<T> {
  return {
    success: false,
    error: `The documented API collection does not provide ${capability}.`,
  };
}

function mapAdminRole(value: unknown): AdminUserRole | undefined {
  if (!isRecord(value)) return undefined;
  if (
    typeof value._id !== "string" ||
    typeof value.email !== "string" ||
    typeof value.role !== "string"
  ) {
    return undefined;
  }

  return {
    _id: value._id,
    email: value.email,
    role: value.role,
    firstName: typeof value.firstName === "string" ? value.firstName : "",
    lastName: typeof value.lastName === "string" ? value.lastName : "",
    isBlocked: value.isBlocked === true,
    ...(typeof value.wallet === "string" || typeof value.wallet === "number"
      ? { wallet: String(value.wallet) }
      : {}),
  };
}

function mapVendingPoints(value: unknown): AdminVendingPoint[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const points = value.map((point): AdminVendingPoint | undefined => {
    if (
      !isRecord(point) ||
      typeof point.totalAmount !== "number" ||
      typeof point.totalUnits !== "number"
    ) {
      return undefined;
    }
    return {
      totalAmount: point.totalAmount,
      totalUnits: point.totalUnits,
      ...(typeof point.date === "string" ? { date: point.date } : {}),
      ...(typeof point.week === "string" ? { week: point.week } : {}),
      ...(typeof point.month === "string" ? { month: point.month } : {}),
      ...(typeof point.year === "string" ? { year: point.year } : {}),
    };
  });
  return points.some((point) => !point)
    ? undefined
    : points.filter((point): point is AdminVendingPoint => point !== undefined);
}

function mapAdminTransaction(value: unknown): AdminTransaction | undefined {
  if (
    !isRecord(value) ||
    typeof value._id !== "string" ||
    typeof value.amount !== "number" ||
    typeof value.reference !== "string" ||
    typeof value.status !== "string" ||
    typeof value.createdAt !== "string"
  ) {
    return undefined;
  }
  const userId =
    typeof value.userId === "string"
      ? value.userId
      : isRecord(value.userId) && typeof value.userId._id === "string"
        ? {
            _id: value.userId._id,
            ...(typeof value.userId.email === "string" ? { email: value.userId.email } : {}),
            ...(typeof value.userId.fullName === "string" ? { fullName: value.userId.fullName } : {}),
            ...(typeof value.userId.firstName === "string" ? { firstName: value.userId.firstName } : {}),
            ...(typeof value.userId.lastName === "string" ? { lastName: value.userId.lastName } : {}),
            ...(typeof value.userId.phoneNumber === "string" ? { phoneNumber: value.userId.phoneNumber } : {}),
          }
        : undefined;
  if (userId === undefined) return undefined;
  return {
    _id: value._id,
    userId,
    amount: value.amount,
    reference: value.reference,
    status: value.status,
    createdAt: value.createdAt,
    ...(typeof value.description === "string" ? { description: value.description } : {}),
    ...(typeof value.type === "string" ? { type: value.type } : {}),
    ...(typeof value.updatedAt === "string" ? { updatedAt: value.updatedAt } : {}),
    ...(typeof value.meterNumber === "string" ? { meterNumber: value.meterNumber } : {}),
    ...(typeof value.meterAccountNumber === "string" ? { meterAccountNumber: value.meterAccountNumber } : {}),
    ...(typeof value.tariff === "string" ? { tariff: value.tariff } : {}),
    ...(typeof value.vendType === "string" ? { vendType: value.vendType } : {}),
    ...(typeof value.subclass === "string" ? { subclass: value.subclass } : {}),
    ...(typeof value.vendTime === "string" ? { vendTime: value.vendTime } : {}),
    ...(typeof value.unitsActual === "number" ? { unitsActual: value.unitsActual } : {}),
    ...(typeof value.unitName === "string" ? { unitName: value.unitName } : {}),
    ...(typeof value.transactionFees === "number" ? { transactionFees: value.transactionFees } : {}),
    ...(typeof value.vendorTransactionFees === "number" ? { vendorTransactionFees: value.vendorTransactionFees } : {}),
    ...(typeof value.clientTransactionFees === "number" ? { clientTransactionFees: value.clientTransactionFees } : {}),
    ...(typeof value.vat === "number" ? { vat: value.vat } : {}),
    ...(typeof value.tokenHex === "string" ? { tokenHex: value.tokenHex } : {}),
    ...(typeof value.tokenDec === "string" ? { tokenDec: value.tokenDec } : {}),
  };
}

export interface AdminDashboardTotals {
  totalWalletBalance: number;
}

export interface AdminRevenuePoint {
  month: string;
  revenue: number;
}

export interface AdminMemberGrowthPoint {
  month: string;
  members: number;
}

export interface AdminUserStatistics {
  totalUsers: number;
  activeUsersLast24Hours: number;
  registrations: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
}

export interface AdminDailyRegistration {
  date: string;
  registrations: number;
  names?: string[];
}

export interface AdminRetentionStatistics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  retentionRate: string;
}

export interface AdminCohort {
  cohort: string;
  totalRegistered: number;
  activeUsersInCohort: number;
}

export interface AdminVendingPoint {
  totalAmount: number;
  totalUnits: number;
  date?: string;
  week?: string;
  month?: string;
  year?: string;
}

export interface AdminVendingGraph {
  daily: AdminVendingPoint[];
  weekly: AdminVendingPoint[];
  monthly: AdminVendingPoint[];
  yearly: AdminVendingPoint[];
}

export interface AdminYearlyVending {
  summary: {
    totalAmount: number;
    totalUnits: number;
    count: number;
  };
  data: AdminTransaction[];
}

export interface AdminLeaderboard {
  topByAmount: AdminLeaderboardEntry[];
  topByUnits: AdminLeaderboardEntry[];
  topByTransactions: AdminLeaderboardEntry[];
}

export interface AdminLeaderboardEntry {
  totalAmount: number;
  totalUnits: number;
  transactionCount: number;
  userId: string;
  fullName: string;
  email: string;
}

export interface AdminSystemHealth {
  system: Record<string, unknown>;
  revenue: Record<string, unknown>;
  performance: Record<string, unknown>;
}

export interface AdminNotification {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotifications {
  notifications: AdminNotification[];
  unreadCount: number;
  readCount: number;
}

export interface AdminSavingsGroup {
  id: string;
  userId: string;
  name: string;
  description: string;
  image: string;
  targetAmount: number;
  contributionAmount: number;
  currentBalance: number;
  currency: string;
  frequency: string;
  maxMembers: number;
  currentMembers: number;
  startDate: string;
  endDate: string;
  visibility: string;
  status: string;
  createdAt: string;
}

export interface CreateAdminSavingsGroupInput {
  name: string;
  description: string;
  targetAmount: number;
  contributionAmount: number;
  currency: string;
  frequency: string;
  maxMembers: number;
  startDate: string;
  endDate: string;
  visibility: string;
  image: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AdminUser> {
    const response = await apiFetch<Record<string, unknown>>(
      "/api/v1/admin/adminLogin",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || "Login failed");
    }

    const payload = response.data;
    const user = isRecord(payload.user) ? payload.user : payload;
    const id = typeof user.id === "string" ? user.id : user._id;
    const role: AdminRole | undefined =
      user.role === "superadmin" || user.role === "super_admin"
        ? "super_admin"
        : user.role === "admin"
          ? "admin"
          : undefined;
    const token =
      typeof payload.token === "string"
        ? payload.token
        : typeof payload.accessToken === "string"
          ? payload.accessToken
          : undefined;
    if (
      typeof id !== "string" ||
      typeof user.email !== "string" ||
      !token ||
      (role !== "admin" && role !== "super_admin")
    ) {
      throw new Error("The login response did not contain a valid admin account.");
    }

    return {
      id,
      name:
        typeof user.name === "string"
          ? user.name
          : typeof user.fullName === "string"
            ? user.fullName
            : `${typeof user.firstName === "string" ? user.firstName : ""} ${
                typeof user.lastName === "string" ? user.lastName : ""
              }`.trim(),
      email: user.email,
      role,
      createdAt: typeof user.createdAt === "string" ? user.createdAt : "",
      token,
    };
  },
  async forgotPassword(_email: string) {
    return unavailable<{ message: string }>("password reset");
  },
  async logout(): Promise<ApiResponse<void>> {
    return { success: true };
  },
};

export const adminService = {
  createAdminAccount(input: CreateAdminAccountInput) {
    return apiFetch<CreateAdminAccountResponse>("/api/v1/admin/adminRegister", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  getPendingKyc() {
    return apiFetch<AdminPendingKycUser[]>("/api/v1/admin/getAllPendingKyc");
  },
  approveKyc(userId: string) {
    return apiFetch<AdminKycApprovalResponse>(
      `/api/v1/admin/adminApprovedKyc/${encodeURIComponent(userId)}`,
      { method: "PUT" },
    );
  },
  getUserDetails(email: string) {
    const params = new URLSearchParams({ email });
    return apiFetch<AdminUserDetails>(
      `/api/v1/admin/viewUserDetails?${params.toString()}`,
    );
  },
  getUserTransactions(email: string) {
    const params = new URLSearchParams({ email });
    return apiFetch<AdminUserTransaction[]>(
      `/api/v1/admin/viewUserTransactions?${params.toString()}`,
    );
  },
  blockUser(email: string) {
    const params = new URLSearchParams({ email });
    return apiFetch<AdminBlockUserResponse>(
      `/api/v1/admin/blockUser?${params.toString()}`,
      { method: "POST" },
    );
  },
  async getAllTransactions(): Promise<ApiResponse<AdminTransactionsResponse>> {
    const response = await apiFetchRaw<unknown>(
      "/api/v1/admin/adminViewAllTransactions",
    );
    if (!response.success) return failedResponse<AdminTransactionsResponse>(response);
    if (!isRecord(response.data)) {
      return { success: false, error: "The all-transactions response was malformed." };
    }
    const { totalTransactions, data } = response.data;
    if (typeof totalTransactions !== "number" || !Array.isArray(data)) {
      return {
        success: false,
        error: "The all-transactions response did not match the documented shape.",
      };
    }
    return {
      ...response,
      data: { totalTransactions, data: data as AdminTransaction[] },
    };
  },
  async searchTransactionsByMeter(meterNumber: string) {
    const params = new URLSearchParams({ meterNumber });
    return apiFetch<unknown>(
      `/api/v1/admin/searchTransactions?${params.toString()}`,
    );
  },
  async getAllUserRoles(): Promise<ApiResponse<AdminUserRole[]>> {
    const response = await apiFetch<unknown>("/api/v1/admin/adminViewAllUserRoles");
    if (!response.success) return failedResponse<AdminUserRole[]>(response);
    if (!Array.isArray(response.data)) {
      return { success: false, error: "The user-roles response was malformed." };
    }
    const users = response.data.map(mapAdminRole);
    if (users.some((user) => !user)) {
      return {
        success: false,
        error: "The user-roles response did not match the documented shape.",
      };
    }
    return { ...response, data: users as AdminUserRole[] };
  },
  getTransactionById(transactionId: string) {
    return apiFetch<AdminTransaction>(
      `/api/v1/admin/adminViewTransactionById/${encodeURIComponent(transactionId)}`,
    );
  },
  async getDashboardTotals(): Promise<ApiResponse<AdminDashboardTotals>> {
    const response = await apiFetch<Record<string, unknown>>(
      "/api/v1/admin/getAllTotalWalletBalance",
    );
    if (!response.success) return failedResponse<AdminDashboardTotals>(response);
    if (
      !response.data ||
      typeof response.data.totalWalletBalance !== "number"
    ) {
      return {
        success: false,
        error:
          "The wallet-balance response did not include a numeric totalWalletBalance value.",
      };
    }
    return {
      ...response,
      data: { totalWalletBalance: response.data.totalWalletBalance },
    };
  },
  async getTotalSavings(): Promise<ApiResponse<number>> {
    const response = await apiFetch<Record<string, unknown>>(
      "/api/v1/admin/getTotalSavings",
    );
    if (!response.success) return failedResponse<number>(response);
    if (!response.data || typeof response.data.totalSavings !== "number") {
      return {
        success: false,
        error: "The total-savings response did not include a numeric totalSavings value.",
      };
    }
    return { ...response, data: response.data.totalSavings };
  },
  async getTotalMembers(): Promise<ApiResponse<number>> {
    const response = await apiFetch<unknown>(
      "/api/v1/admin/getAllTotalMembers",
    );
    if (!response.success) return failedResponse<number>(response);
    if (!isRecord(response.data) || typeof response.data.count !== "number") {
      return {
        success: false,
        error: "The total-members response did not include a numeric count.",
      };
    }
    return { ...response, data: response.data.count };
  },
  async getRevenueOverview(): Promise<ApiResponse<AdminRevenuePoint[]>> {
    const response = await apiFetch<unknown>("/api/v1/admin/revenueOverview");
    if (!response.success) return failedResponse<AdminRevenuePoint[]>(response);
    if (!Array.isArray(response.data)) {
      return {
        success: false,
        error: "The revenue-overview response did not contain an array.",
      };
    }
    const points = response.data.map((point): AdminRevenuePoint | undefined => {
      if (
        !isRecord(point) ||
        typeof point.month !== "string" ||
        typeof point.revenue !== "number"
      ) {
        return undefined;
      }
      return { month: point.month, revenue: point.revenue };
    });
    if (points.some((point) => !point)) {
      return {
        success: false,
        error: "The revenue-overview response did not match the documented shape.",
      };
    }
    return { ...response, data: points as AdminRevenuePoint[] };
  },
  async getMemberGrowthByMonth(): Promise<ApiResponse<AdminMemberGrowthPoint[]>> {
    const response = await apiFetch<unknown>(
      "/api/v1/admin/getMemberGrowthByMonth",
    );
    if (!response.success) {
      return failedResponse<AdminMemberGrowthPoint[]>(response);
    }
    if (!Array.isArray(response.data)) {
      return {
        success: false,
        error: "The monthly member-growth response was not an array.",
      };
    }
    const points = response.data.map(
      (point): AdminMemberGrowthPoint | undefined => {
        if (!isRecord(point)) return undefined;
        const month =
          typeof point.month === "string"
            ? point.month
            : typeof point.date === "string"
              ? point.date
              : undefined;
        const members = [
          point.members,
          point.count,
          point.totalMembers,
          point.memberCount,
          point.member_count,
        ]
          .map((value) => {
            if (typeof value === "number") {
              return Number.isFinite(value) ? value : undefined;
            }
            if (typeof value !== "string" || value.trim() === "") {
              return undefined;
            }
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : undefined;
          })
          .find((value) => value !== undefined);
        return month !== undefined && members !== undefined
          ? { month, members }
          : undefined;
      },
    );
    if (points.some((point) => !point)) {
      return {
        success: false,
        error:
          "The monthly member-growth response did not include month and members/count values.",
      };
    }
    return { ...response, data: points as AdminMemberGrowthPoint[] };
  },
  async getUserStatistics(): Promise<ApiResponse<AdminUserStatistics>> {
    const response = await apiFetchRaw<unknown>("/api/v1/admin/user/stats");
    if (!response.success || !isRecord(response.data) || !isRecord(response.data.stats)) {
      return response.success
        ? { success: false, error: "The user-statistics response was malformed." }
        : failedResponse<AdminUserStatistics>(response);
    }
    const stats = response.data.stats;
    if (
      typeof stats.totalUsers !== "number" ||
      typeof stats.activeUsersLast24Hours !== "number" ||
      !isRecord(stats.registrations) ||
      typeof stats.registrations.today !== "number" ||
      typeof stats.registrations.thisWeek !== "number" ||
      typeof stats.registrations.thisMonth !== "number" ||
      typeof stats.registrations.thisYear !== "number"
    ) {
      return {
        success: false,
        error: "The user-statistics response did not match the documented shape.",
      };
    }
    return {
      ...response,
      data: {
        totalUsers: stats.totalUsers,
        activeUsersLast24Hours: stats.activeUsersLast24Hours,
        registrations: {
          today: stats.registrations.today,
          thisWeek: stats.registrations.thisWeek,
          thisMonth: stats.registrations.thisMonth,
          thisYear: stats.registrations.thisYear,
        },
      },
    };
  },
  async getDailyRegistrations(): Promise<ApiResponse<AdminDailyRegistration[]>> {
    const response = await apiFetch<unknown>("/api/v1/admin/user/daily");
    if (!response.success) return failedResponse<AdminDailyRegistration[]>(response);
    if (!Array.isArray(response.data)) {
      return {
        success: false,
        error: "The daily-registrations response did not contain an array.",
      };
    }
    const registrations = response.data.map(
      (row): AdminDailyRegistration | undefined => {
        if (
          !isRecord(row) ||
          typeof row.date !== "string" ||
          typeof row.registrations !== "number" ||
          (row.names !== undefined &&
            (!Array.isArray(row.names) ||
              row.names.some((name) => typeof name !== "string")))
        ) {
          return undefined;
        }
        return {
          date: row.date,
          registrations: row.registrations,
          ...(Array.isArray(row.names) ? { names: row.names as string[] } : {}),
        };
      },
    );
    if (registrations.some((row) => !row)) {
      return {
        success: false,
        error: "The daily-registrations response did not match the documented shape.",
      };
    }
    return {
      ...response,
      data: registrations.filter(
        (row): row is AdminDailyRegistration => row !== undefined,
      ),
    };
  },
  async getRetentionStatistics(): Promise<ApiResponse<AdminRetentionStatistics>> {
    const response = await apiFetchRaw<unknown>("/api/v1/admin/getRetentionStats");
    if (!response.success) return failedResponse<AdminRetentionStatistics>(response);
    if (!isRecord(response.data)) {
      return { success: false, error: "The retention response was malformed." };
    }
    const { dailyActiveUsers, monthlyActiveUsers, retentionRate } = response.data;
    if (
      typeof dailyActiveUsers !== "number" ||
      typeof monthlyActiveUsers !== "number" ||
      typeof retentionRate !== "string" ||
      !/^\d+(?:\.\d+)?%$/.test(retentionRate)
    ) {
      return {
        success: false,
        error: "The retention response did not match the documented shape.",
      };
    }
    return {
      ...response,
      data: { dailyActiveUsers, monthlyActiveUsers, retentionRate },
    };
  },
  async getCohortAnalysis(): Promise<ApiResponse<AdminCohort[]>> {
    const response = await apiFetch<unknown>("/api/v1/admin/getCohortAnalysis");
    if (!response.success) return failedResponse<AdminCohort[]>(response);
    if (!Array.isArray(response.data)) {
      return {
        success: false,
        error: "The cohort-analysis response did not contain an array.",
      };
    }
    const cohorts = response.data.map((row): AdminCohort | undefined => {
      if (
        !isRecord(row) ||
        typeof row.cohort !== "string" ||
        typeof row.totalRegistered !== "number" ||
        typeof row.activeUsersInCohort !== "number"
      ) {
        return undefined;
      }
      return {
        cohort: row.cohort,
        totalRegistered: row.totalRegistered,
        activeUsersInCohort: row.activeUsersInCohort,
      };
    });
    if (cohorts.some((row) => !row)) {
      return {
        success: false,
        error: "The cohort-analysis response did not match the documented shape.",
      };
    }
    return {
      ...response,
      data: cohorts.filter((row): row is AdminCohort => row !== undefined),
    };
  },
  async getVendingGraph(): Promise<ApiResponse<AdminVendingGraph>> {
    const response = await apiFetchRaw<unknown>("/api/v1/admin/vending/graph");
    if (!response.success) return failedResponse<AdminVendingGraph>(response);
    if (!isRecord(response.data)) {
      return { success: false, error: "The vending graph response was malformed." };
    }
    const keys = ["daily", "weekly", "monthly", "yearly"] as const;
    const points = keys.map((key) => mapVendingPoints(response.data[key]));
    if (points.some((series) => !series)) {
      return {
        success: false,
        error: "The vending graph response did not match the documented shape.",
      };
    }
    return {
      ...response,
      data: {
        daily: points[0] ?? [],
        weekly: points[1] ?? [],
        monthly: points[2] ?? [],
        yearly: points[3] ?? [],
      },
    };
  },
  async getYearlyVending(): Promise<ApiResponse<AdminYearlyVending>> {
    const response = await apiFetchRaw<unknown>("/api/v1/admin/vending/yearly");
    if (
      !response.success ||
      !isRecord(response.data) ||
      !isRecord(response.data.summary) ||
      !Array.isArray(response.data.data)
    ) {
      return response.success
        ? { success: false, error: "The yearly vending response was malformed." }
        : failedResponse<AdminYearlyVending>(response);
    }
    const { summary } = response.data;
    const rows = response.data.data.map(mapAdminTransaction);
    if (
      typeof summary.totalAmount !== "number" ||
      typeof summary.totalUnits !== "number" ||
      typeof summary.count !== "number" ||
      rows.some((row) => !row)
    ) {
      return {
        success: false,
        error: "The yearly vending response did not match the documented shape.",
      };
    }
    return {
      ...response,
      data: {
        summary: {
          totalAmount: summary.totalAmount,
          totalUnits: summary.totalUnits,
          count: summary.count,
        },
        data: rows.filter((row): row is AdminTransaction => row !== undefined),
      },
    };
  },
  async getLeaderboard(): Promise<ApiResponse<{ leaderboards: AdminLeaderboard }>> {
    const response = await apiFetchRaw<unknown>("/api/v1/admin/getUserLeaderboard");
    if (
      !response.success ||
      !isRecord(response.data) ||
      !isRecord(response.data.leaderboards)
    ) {
      return response.success
        ? { success: false, error: "The leaderboard response was malformed." }
        : failedResponse<{ leaderboards: AdminLeaderboard }>(response);
    }
    const keys = ["topByAmount", "topByUnits", "topByTransactions"] as const;
    const parsed: AdminLeaderboard = {
      topByAmount: [],
      topByUnits: [],
      topByTransactions: [],
    };
    for (const key of keys) {
      const rows = response.data.leaderboards[key];
      if (!Array.isArray(rows)) {
        return {
          success: false,
          error: "The leaderboard response did not match the documented shape.",
        };
      }
      const mapped = rows.map((row): AdminLeaderboardEntry | undefined => {
        if (
          !isRecord(row) ||
          typeof row.totalAmount !== "number" ||
          typeof row.totalUnits !== "number" ||
          typeof row.transactionCount !== "number" ||
          typeof row.userId !== "string" ||
          typeof row.fullName !== "string" ||
          typeof row.email !== "string"
        ) {
          return undefined;
        }
        return {
          totalAmount: row.totalAmount,
          totalUnits: row.totalUnits,
          transactionCount: row.transactionCount,
          userId: row.userId,
          fullName: row.fullName,
          email: row.email,
        };
      });
      if (mapped.some((row) => !row)) {
        return {
          success: false,
          error: "A leaderboard row did not match the documented shape.",
        };
      }
      parsed[key] = mapped.filter(
        (row): row is AdminLeaderboardEntry => row !== undefined,
      );
    }
    return {
      ...response,
      data: { leaderboards: parsed },
    };
  },
  async getTopPerformingUsers(): Promise<
    ApiResponse<AdminLeaderboardEntry[]>
  > {
    const response = await apiFetch<unknown>(
      "/api/v1/admin/getTopPerformingUsers",
    );
    if (!response.success) {
      return failedResponse<AdminLeaderboardEntry[]>(response);
    }
    if (!Array.isArray(response.data)) {
      return {
        success: false,
        error: "The top-performing-users response did not contain an array.",
      };
    }
    const entries = response.data.map(
      (row): AdminLeaderboardEntry | undefined => {
        if (
          !isRecord(row) ||
          typeof row.totalAmount !== "number" ||
          typeof row.totalUnits !== "number" ||
          typeof row.transactionCount !== "number" ||
          typeof row.userId !== "string" ||
          typeof row.fullName !== "string" ||
          typeof row.email !== "string"
        ) {
          return undefined;
        }
        return {
          totalAmount: row.totalAmount,
          totalUnits: row.totalUnits,
          transactionCount: row.transactionCount,
          userId: row.userId,
          fullName: row.fullName,
          email: row.email,
        };
      },
    );
    if (entries.some((entry) => !entry)) {
      return {
        success: false,
        error: "The top-performing-users response did not match the documented shape.",
      };
    }
    return {
      ...response,
      data: entries.filter(
        (entry): entry is AdminLeaderboardEntry => entry !== undefined,
      ),
    };
  },
  async getSystemHealthSummary(): Promise<ApiResponse<AdminSystemHealth>> {
    const response = await apiFetch<unknown>(
      "/api/v1/admin/getSystemHealthSummary",
    );
    if (!response.success) {
      return failedResponse<AdminSystemHealth>(response);
    }
    if (
      !isRecord(response.data) ||
      !isRecord(response.data.system) ||
      !isRecord(response.data.revenue) ||
      !isRecord(response.data.performance)
    ) {
      return {
        success: false,
        error: "The system-health response did not match the documented shape.",
      };
    }
    return {
      ...response,
      data: {
        system: response.data.system,
        revenue: response.data.revenue,
        performance: response.data.performance,
      },
    };
  },
  getSavingsGroups() {
    return apiFetch<AdminSavingsGroup[]>("/api/v1/group-saving/get-all-groups");
  },
  createSavingsGroup(input: CreateAdminSavingsGroupInput) {
    return apiFetch<AdminSavingsGroup>("/api/v1/group-saving/create-group", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

export const notificationService = {
  async getAll(): Promise<ApiResponse<AdminNotifications>> {
    const response = await apiFetch<unknown>(
      "/api/v1/notifications/getUserNotifications",
    );
    if (!response.success) return failedResponse<AdminNotifications>(response);
    if (!isRecord(response.data) || !Array.isArray(response.data.notifications)) {
      return {
        success: false,
        error: "The notifications response did not match the documented shape.",
      };
    }

    const notifications = response.data.notifications.map(
      (notification): AdminNotification | undefined => {
        const id = isRecord(notification)
          ? typeof notification.id === "string"
            ? notification.id
            : typeof notification._id === "string"
              ? notification._id
              : undefined
          : undefined;
        if (
          !isRecord(notification) ||
          id === undefined ||
          typeof notification.userId !== "string" ||
          typeof notification.type !== "string" ||
          typeof notification.message !== "string" ||
          typeof notification.isRead !== "boolean" ||
          typeof notification.createdAt !== "string" ||
          typeof notification.updatedAt !== "string"
        ) {
          return undefined;
        }
        return {
          id,
          userId: notification.userId,
          type: notification.type,
          message: notification.message,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          updatedAt: notification.updatedAt,
        };
      },
    );
    if (
      notifications.some((notification) => !notification) ||
      typeof response.data.unReadcount !== "number" ||
      typeof response.data.readcount !== "number"
    ) {
      return {
        success: false,
        error: "The notifications response did not match the documented shape.",
      };
    }

    return {
      ...response,
      data: {
        notifications: notifications.filter(
          (notification): notification is AdminNotification =>
            notification !== undefined,
        ),
        unreadCount: response.data.unReadcount,
        readCount: response.data.readcount,
      },
    };
  },
  async markAsRead(id: string): Promise<ApiResponse<void>> {
    const response = await requestApi(
      `/api/v1/notifications/mark-as-read/${encodeURIComponent(id)}`,
      { method: "PATCH" },
    );
    return response.success
      ? { success: true, message: response.message }
      : failedResponse<void>(response);
  },
  async markAllAsRead(): Promise<ApiResponse<void>> {
    const response = await requestApi(
      "/api/v1/notifications/mark-all-as-read",
      { method: "PATCH" },
    );
    return response.success
      ? { success: true, message: response.message }
      : failedResponse<void>(response);
  },
  async deleteById(id: string): Promise<ApiResponse<void>> {
    const response = await requestApi(
      `/api/v1/notifications/delete/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    return response.success
      ? { success: true, message: response.message }
      : failedResponse<void>(response);
  },
  async deleteAll(): Promise<ApiResponse<void>> {
    const response = await requestApi("/api/v1/notifications/delete-all", {
      method: "DELETE",
    });
    return response.success
      ? { success: true, message: response.message }
      : failedResponse<void>(response);
  },
};

export const dashboardService = {
  getKPIs: () => unavailable<DashboardKPIs>("the legacy dashboard KPI endpoint"),
  getTransactionVolumeChart: () =>
    unavailable<{ date: string; value: number }[]>("the legacy transaction chart endpoint"),
  getSavingsVolumeChart: () =>
    unavailable<{ date: string; value: number }[]>("the legacy savings chart endpoint"),
  getRecentActivity: () => unavailable<ActivityLog[]>("an admin activity feed"),
};

export const usersService = {
  getUsers: (_page?: number, _limit?: number, _filters?: UserFilters) =>
    unavailable<PaginatedResponse<User>>("the legacy paginated users endpoint"),
  getUserById: (_id: string) => unavailable<User>("the legacy user-by-id endpoint"),
};

export const kycService = {
  getSubmissions: (
    _status?: KYCStatus | "all",
    _page?: number,
    _limit?: number,
  ) => unavailable<PaginatedResponse<import("@/types").KYCSubmission>>(
    "the legacy paginated KYC endpoint",
  ),
  getSubmissionById: (_id: string) =>
    unavailable<import("@/types").KYCSubmission>("the legacy KYC-by-id endpoint"),
  approveKYC: (_id: string) =>
    unavailable<import("@/types").KYCSubmission>("the legacy KYC approval endpoint"),
  rejectKYC: (_id: string, _reason: string) =>
    unavailable<import("@/types").KYCSubmission>("KYC rejection"),
};

export const walletService = {
  getWallets: (_page?: number, _limit?: number) =>
    unavailable<PaginatedResponse<Wallet>>("an admin wallet listing endpoint"),
  blockWallet: (_id: string) => unavailable<Wallet>("wallet blocking by ID"),
  unblockWallet: (_id: string) => unavailable<Wallet>("wallet unblocking"),
};

export const transactionService = {
  getTransactions: (
    _page?: number,
    _limit?: number,
    _filters?: TransactionFilters,
  ) => unavailable<PaginatedResponse<Transaction>>("the legacy transaction listing endpoint"),
  getTransactionById: (_id: string) =>
    unavailable<Transaction>("the legacy transaction-by-id endpoint"),
};

export const savingsService = {
  getSavingsPlans: (_page?: number, _limit?: number) =>
    unavailable<PaginatedResponse<SavingsPlan>>("an admin personal-savings listing endpoint"),
  getSavingsPlanById: (_id: string) =>
    unavailable<SavingsPlan>("an admin personal-savings-by-id endpoint"),
};

export const thriftService = {
  getThriftPlans: (_page?: number, _limit?: number) =>
    unavailable<PaginatedResponse<ThriftPlan>>("an admin thrift-plan listing endpoint"),
  getThriftPlanById: (_id: string) =>
    unavailable<ThriftPlan>("an admin thrift-plan-by-id endpoint"),
};
