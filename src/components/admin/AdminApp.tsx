import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Shield,
  PiggyBank,
  Wallet,
  ArrowLeftRight as TransactionsIcon,
  ShoppingBag,
  MessageSquare,
  BarChart2,
  Settings,
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  Search,
  Plus,
  MoreHorizontal,
  Check,
  X,
  Eye,
  Download,
  Upload,
  Trash2,
  Edit2,
  Mail,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Send,
  Megaphone,
  LogOut,
  Menu,
  Moon,
  Sun,
  DollarSign,
  Target,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  CreditCard,
  Building,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import {
  useAdminUserDetails,
  useAdminUserTransactions,
  useAdminTransactionDetails,
  useAdminTransactionSearch,
  useAdminTransactions,
  useAdminUserRoles,
  useApproveAdminKyc,
  useBlockAdminUser,
  useCreateAdminAccount,
  useCreateAdminSavingsGroup,
  useAdminSavingsGroups,
  usePendingAdminKyc,
  useAdminDashboardTotals,
  useAdminTotalSavings,
  useAdminTotalMembers,
  useAdminRevenueOverview,
  useAdminMemberGrowthByMonth,
  useAdminUserStatistics,
  useAdminDailyRegistrations,
  useAdminRetentionStatistics,
  useAdminCohortAnalysis,
  useAdminVendingGraph,
  useAdminYearlyVending,
  useAdminLeaderboard,
  useAdminTopPerformingUsers,
  useAdminSystemHealth,
  useAdminNotifications,
  useMarkAdminNotificationAsRead,
  useMarkAllAdminNotificationsAsRead,
  useDeleteAdminNotification,
  useDeleteAllAdminNotifications,
} from "@/hooks/useAdmin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  AdminDailyRegistration,
  AdminSavingsGroup,
} from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import type {
  AdminTransaction,
  AdminPendingKycUser,
  AdminTransactionUser,
  AdminUserRole,
} from "@/types";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export type AdminSection =
  | "dashboard"
  | "members"
  | "member-detail"
  | "kyc"
  | "kyc-detail"
  | "savings-programs"
  | "program-detail"
  | "wallets"
  | "transactions"
  | "marketplace"
  | "product-form"
  | "messaging"
  | "broadcast"
  | "reports"
  | "settings"
  | "notifications";

export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  kyc: string;
  joined: string;
  createdAt?: string;
  wallet?: number;
  savings?: number;
  status: string;
  group: string;
  accountNumber?: string;
  bankName?: string;
  tier?: string;
}

export interface KYCItem {
  id: string;
  name: string;
  email: string;
  submitted: string;
  nin: string;
  idType: string;
  status: "pending" | "reviewing" | "approved" | "rejected";
}

function mapPendingKycUser(user: AdminPendingKycUser): KYCItem {
  const name = `${user.firstName} ${user.lastName}`.trim();

  return {
    id: user.id,
    name: name || user.email,
    email: user.email,
    submitted: new Date(user.createdAt).toLocaleDateString(),
    nin: user.nin || "Not provided",
    idType: user.kycDocumentType || (user.nin ? "NIN" : "Not provided"),
    status: "pending",
  };
}

export interface SavingsProgram {
  id: string;
  name: string;
  type: string;
  members: number;
  target: number;
  collected: number;
  started: string;
  nextCycle: string;
  status: string;
}

export interface WalletLedgerItem {
  id: string;
  type: "credit" | "debit";
  title: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
  ref: string;
}

function mapAdminRoleToMember(user: AdminUserRole): Member {
  const balance =
    user.wallet !== undefined && Number.isFinite(Number(user.wallet))
      ? Number(user.wallet)
      : undefined;

  return {
    id: user._id,
    name: `${user.firstName} ${user.lastName}`.trim() || user.email,
    email: user.email,
    kyc: "Not available",
    joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Not available",
    ...(user.createdAt ? { createdAt: user.createdAt } : {}),
    ...(balance !== undefined ? { wallet: balance } : {}),
    status: user.isBlocked ? "Blocked" : "Not blocked",
    group: "Not available",
  };
}

function mapSavingsGroup(group: AdminSavingsGroup): SavingsProgram {
  return {
    id: group.id,
    name: group.name,
    type: group.frequency,
    members: group.currentMembers,
    target: group.targetAmount,
    collected: group.currentBalance,
    started: group.startDate
      ? new Date(group.startDate).toLocaleDateString()
      : "Not available",
    nextCycle: "Not available",
    status: group.status,
  };
}

function isAdminTransaction(value: unknown): value is AdminTransaction {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const transaction = value as Record<string, unknown>;
  const userId = transaction.userId;
  const validUserId =
    typeof userId === "string" ||
    (!!userId &&
      typeof userId === "object" &&
      !Array.isArray(userId) &&
      typeof (userId as Record<string, unknown>)._id === "string");

  return (
    typeof transaction._id === "string" &&
    validUserId &&
    typeof transaction.amount === "number" &&
    typeof transaction.reference === "string" &&
    typeof transaction.status === "string" &&
    typeof transaction.createdAt === "string"
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₦${n.toLocaleString()}`;
const pct = (a: number, b: number) => Math.min(100, Math.round((a / b) * 100));

// ─── Shared UI Components ────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  color = "#3730A3",
  bg = "#EEF2FF",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
  bg?: string;
}) {
  return (
    <div className="bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: bg, color }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${trend > 0 ? "text-[#059669]" : "text-[#DC2626]"}`}
          >
            {trend > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div
        className="text-2xl font-bold text-[#0D0F1C] dark:text-[#F0F2FF]"
        style={{
          fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
        }}
      >
        {value}
      </div>
      <div className="text-sm font-medium text-[#374151] dark:text-[#94A3B8] mt-0.5">
        {label}
      </div>
      {sub && (
        <div className="text-xs text-[#9CA3AF] dark:text-gray-400 mt-1">
          {sub}
        </div>
      )}
    </div>
  );
}

function QueryErrorNotice({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
    >
      <span>{error instanceof Error ? error.message : "Unable to load data"}</span>
      <button onClick={onRetry} className="font-semibold underline">
        Retry
      </button>
    </div>
  );
}

function Badge({
  children,
  color = "indigo",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  const colors: Record<string, string> = {
    indigo:
      "bg-[#EEF2FF] text-[#3730A3] dark:bg-[#818CF8]/20 dark:text-[#818CF8]",
    green:
      "bg-[#ECFDF5] text-[#059669] dark:bg-[#10B981]/20 dark:text-[#10B981]",
    gold: "bg-[#FFFBEB] text-[#D97706] dark:bg-[#FBBF24]/20 dark:text-[#FBBF24]",
    red: "bg-[#FEF2F2] text-[#DC2626] dark:bg-[#EF4444]/20 dark:text-[#EF4444]",
    gray: "bg-[#F3F4F6] text-[#6B7280] dark:bg-white/10 dark:text-gray-300",
    purple:
      "bg-[#F5F3FF] text-[#7C3AED] dark:bg-[#A78BFA]/20 dark:text-[#A78BFA]",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${colors[color] || colors.indigo}`}
    >
      {children}
    </span>
  );
}

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1
          className="text-2xl lg:text-[26px] font-bold text-[#0D0F1C] dark:text-[#F0F2FF]"
          style={{
            fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ─── Dashboard Section ────────────────────────────────────────────────────────
function DashboardSection({
  onNav,
  onInvite,
}: {
  onNav: (s: AdminSection) => void;
  onInvite: () => void;
}) {
  const totalsQuery = useAdminDashboardTotals();
  const savingsQuery = useAdminTotalSavings();
  const membersQuery = useAdminTotalMembers();
  const members = membersQuery.data;
  const revenueQuery = useAdminRevenueOverview();
  const memberGrowthQuery = useAdminMemberGrowthByMonth();
  const pendingKycQuery = usePendingAdminKyc();
  const transactionsQuery = useAdminTransactions();
  const revenueData = revenueQuery.data ?? [];
  const memberGrowth = memberGrowthQuery.data ?? [];
  const [selectedMemberGrowth, setSelectedMemberGrowth] = useState<{ month: string; members: number } | null>(null);
  const recentTransactions = [...(transactionsQuery.data?.data ?? [])]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={onInvite}
              className="px-4 py-2 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
              style={{
                fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
              }}
            >
              <UserPlus size={16} />
              Invite Member
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={membersQuery.isLoading ? "..." : members === undefined ? "Unavailable" : members.toLocaleString()}
          sub="From the admin member count endpoint"
          icon={<Users size={20} />}
        />
        <StatCard
          label="Total Wallet"
          value={totalsQuery.isLoading ? "..." : totalsQuery.data?.totalWalletBalance === undefined ? "Unavailable" : fmt(totalsQuery.data.totalWalletBalance)}
          sub="Across all members"
          icon={<Wallet size={20} />}
          color="#059669"
          bg="#ECFDF5"
        />
        <StatCard
          label="Total Savings"
          value={savingsQuery.isLoading ? "..." : savingsQuery.data === undefined ? "Unavailable" : fmt(savingsQuery.data)}
          sub="Backend total"
          icon={<PiggyBank size={20} />}
          color="#D97706"
          bg="#FFFBEB"
        />
        <StatCard
          label="KYC Pending"
          value={pendingKycQuery.isLoading ? "..." : pendingKycQuery.data ? String(pendingKycQuery.data.length) : pendingKycQuery.isError ? "Unavailable" : "0"}
          sub="Needs your review"
          icon={<Shield size={20} />}
          color="#DC2626"
          bg="#FEF2F2"
        />
      </div>
      {totalsQuery.isError && (
        <QueryErrorNotice
          error={totalsQuery.error}
          onRetry={() => void totalsQuery.refetch()}
        />
      )}
      {savingsQuery.isError && (
        <QueryErrorNotice
          error={savingsQuery.error}
          onRetry={() => void savingsQuery.refetch()}
        />
      )}
      {membersQuery.isError && (
        <QueryErrorNotice
          error={membersQuery.error}
          onRetry={() => void membersQuery.refetch()}
        />
      )}
      {pendingKycQuery.isError && (
        <QueryErrorNotice
          error={pendingKycQuery.error}
          onRetry={() => void pendingKycQuery.refetch()}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3
              style={{
                fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
                fontWeight: 700,
                fontSize: 16,
              }}
              className="text-[#0D0F1C] dark:text-[#F0F2FF]"
            >
              Revenue Overview
            </h3>
            <Badge color="indigo">Monthly</Badge>
          </div>
            {revenueQuery.isLoading ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-[#9CA3AF]">Loading revenue overview...</div>
            ) : revenueQuery.isError ? (
            <div className="flex h-[220px] flex-col items-center justify-center gap-3 text-sm text-red-600">
                <span>{revenueQuery.error.message}</span>
                <button onClick={() => void revenueQuery.refetch()} className="font-semibold text-[#3730A3]">Retry</button>
            </div>
            ) : revenueData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-[#9CA3AF]">No revenue overview data found.</div>
          ) : (
          <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3730A3" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3730A3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tickFormatter={(value: string) => {
                  const date = new Date(value);
                  return Number.isNaN(date.getTime())
                    ? value
                    : date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
                }}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(v: unknown, n: unknown) => [
                  `₦${Number(v).toLocaleString()}`,
                  String(n),
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  fontSize: 12,
                }}
              />
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F3FB"
                vertical={false}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3730A3"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 shadow-sm">
          <h3
            style={{
              fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
              fontWeight: 700,
              fontSize: 16,
            }}
            className="mb-4 text-[#0D0F1C] dark:text-[#F0F2FF]"
          >
            KYC Status
          </h3>
          <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
            {pendingKycQuery.isLoading ? (
              <span className="text-sm text-[#9CA3AF]">Loading pending KYC...</span>
            ) : pendingKycQuery.isError ? (
              <>
                <span className="text-sm text-red-600">{pendingKycQuery.error.message}</span>
                <button onClick={() => void pendingKycQuery.refetch()} className="text-sm font-semibold text-[#3730A3]">Retry</button>
              </>
            ) : (
              <>
                <span className="text-4xl font-bold text-[#D97706]">{pendingKycQuery.data.length}</span>
                <span className="text-sm text-[#6B7280] dark:text-[#94A3B8]">Pending submissions</span>
                <span className="max-w-[230px] text-xs text-[#9CA3AF]">The API collection does not provide approved/rejected counts for a KYC breakdown chart.</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 shadow-sm">
          <h3
            style={{
              fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
              fontWeight: 700,
              fontSize: 16,
            }}
            className="mb-4 text-[#0D0F1C] dark:text-[#F0F2FF]"
          >
            Member Growth
          </h3>
          {memberGrowthQuery.isLoading ? (
            <div className="flex h-[160px] items-center justify-center text-sm text-[#9CA3AF]">Loading member growth...</div>
          ) : memberGrowthQuery.isError ? (
            <div className="flex h-[160px] flex-col items-center justify-center gap-3 text-sm text-red-600">
              <span>{memberGrowthQuery.error.message}</span>
              <button onClick={() => void memberGrowthQuery.refetch()} className="font-semibold text-[#3730A3]">Retry</button>
            </div>
          ) : memberGrowth.length === 0 ? (
            <div className="flex h-[160px] items-center justify-center text-sm text-[#9CA3AF]">No monthly member growth data found.</div>
          ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={memberGrowth}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="members"
                fill="#3730A3"
                radius={[6, 6, 0, 0]}
                name="Registrations"
                cursor="pointer"
                onClick={(_, index) => {
                  const point = memberGrowth[index];
                  if (point) setSelectedMemberGrowth(point);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
          )}
                  {selectedMemberGrowth ? (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-[#DDE3FF] bg-[#F5F6FF] px-4 py-3 dark:border-[#818CF8]/20 dark:bg-[#818CF8]/10" role="status">
              <div>
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#A5B4FC]">{selectedMemberGrowth.month}</p>
                <p className="text-sm font-semibold text-[#1F2937] dark:text-[#F0F2FF]">
                  {selectedMemberGrowth.members.toLocaleString()} registered users
                </p>
              </div>
              <button type="button" onClick={() => setSelectedMemberGrowth(null)} className="rounded-lg px-2 py-1 text-xs font-semibold text-[#3730A3] hover:bg-white dark:text-[#A5B4FC] dark:hover:bg-white/10">
                Clear
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-[#9CA3AF]">Select a month to see its registration total.</p>
          )}</div>

        <div className="bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 shadow-sm">
          <h3
            style={{
              fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
              fontWeight: 700,
              fontSize: 16,
            }}
            className="mb-4 text-[#0D0F1C] dark:text-[#F0F2FF]"
          >
            Recent Transactions
          </h3>
          <div className="flex flex-col gap-3">
            {transactionsQuery.isLoading ? <div className="text-sm text-[#9CA3AF]">Loading transactions...</div> : null}
            {transactionsQuery.isError ? (
              <div className="text-sm text-red-600">
                <p>{transactionsQuery.error.message}</p>
                <button onClick={() => void transactionsQuery.refetch()} className="mt-2 font-semibold text-[#3730A3]">Retry</button>
              </div>
            ) : null}
            {!transactionsQuery.isLoading && !transactionsQuery.isError && recentTransactions.length === 0 ? (
              <div className="text-sm text-[#9CA3AF]">No transactions found.</div>
            ) : null}
            {recentTransactions.map((transaction) => (
              <div key={transaction._id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF2FF] text-[#3730A3]">
                  <TransactionsIcon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-[#374151] dark:text-[#F0F2FF]">
                    {transaction.description || transaction.type || transaction.reference}
                  </div>
                  <div className="text-xs text-[#9CA3AF]">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex-shrink-0 text-xs font-semibold">{fmt(Number(transaction.amount))}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#FFFBEB] dark:bg-[#FBBF24]/10 border border-[#FCD34D] dark:border-[#FBBF24]/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-[#FEF3C7] dark:bg-[#FBBF24]/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield size={22} className="text-[#D97706]" />
          </div>
          <div>
            <div className="font-bold text-[#92400E] dark:text-[#FBBF24]">
              {pendingKycQuery.data?.length ?? "—"} KYC Submissions Awaiting Review
            </div>
            <div className="text-sm text-[#B45309] dark:text-[#FBBF24]/80">
              Members are waiting for account activation
            </div>
          </div>
        </div>
        <button
          onClick={() => onNav("kyc")}
          className="px-5 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl text-sm font-semibold transition-colors flex-shrink-0 shadow-sm"
        >
          Review Now
        </button>
      </div>
    </div>
  );
}

// ─── Members Section ──────────────────────────────────────────────────────────
type RegistrationPeriod = "today" | "7days" | "month" | "all";

function MembersSection({
  members,
  isLoading,
  error,
  onRetry,
  onNav,
  setSelectedMember,
  onInvite,
}: {
  members: Member[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onNav: (s: AdminSection) => void;
  setSelectedMember: (m: Member) => void;
  onInvite: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [registrationPeriod, setRegistrationPeriod] = useState<RegistrationPeriod>("month");
  const [memberPage, setMemberPage] = useState(1);
  const pageSize = 25;
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setHours(0, 0, 0, 0);
  if (registrationPeriod === "7days") {
    periodStart.setDate(periodStart.getDate() - 6);
  } else if (registrationPeriod === "month") {
    periodStart.setDate(1);
  }
  const datedMembers = members.filter((member) => {
    if (!member.createdAt) return false;
    return Number.isFinite(new Date(member.createdAt).getTime());
  });
  const matchesRegistrationPeriod = (member: Member) => {
    if (registrationPeriod === "all") return true;
    if (!member.createdAt || !Number.isFinite(new Date(member.createdAt).getTime())) return false;
    const createdAt = new Date(member.createdAt);
    return createdAt <= now && createdAt >= periodStart;
  };
  const registrationCount =
    members.length > 0 && datedMembers.length === 0
      ? undefined
      : datedMembers.filter(matchesRegistrationPeriod).length;
  const registrationPeriodLabel = {
    today: "Today",
    "7days": "Last 7 days",
    month: "This month",
    all: "All time",
  }[registrationPeriod];

  const filtered = members.filter(
    (m) =>
      matchesRegistrationPeriod(m) &&
      (filter === "All" ||
        (filter === "Blocked" && m.status === "Blocked") ||
        (filter === "Not blocked" && m.status === "Not blocked")) &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        (m.phone || "").includes(search)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(memberPage, totalPages);
  const visibleMembers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstVisibleMember = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleMember = Math.min(currentPage * pageSize, filtered.length);

  return (
    <div>
      <PageHeader
        title="Member Management"
        subtitle={isLoading ? "Loading members..." : `${members.length} members returned by the API`}
        action={
          <button
            onClick={onInvite}
            className="px-4 py-2 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <UserPlus size={16} />
            Invite Member
          </button>
        }
      />
      <section className="mb-4 flex flex-col gap-4 rounded-2xl border border-[#E8EAF4] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111327] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8A91A5]">New registrations</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111827] dark:text-[#F0F2FF]">
              {isLoading ? "…" : error ? "Unavailable" : registrationCount === undefined ? "Unavailable" : registrationCount.toLocaleString()}
            </span>
            <span className="text-sm text-[#6B7280] dark:text-[#94A3B8]">{registrationPeriodLabel}</span>
          </div>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            {datedMembers.length.toLocaleString()} of {members.length.toLocaleString()} members have a registration date.
          </p>
        </div>
        <div className="w-full sm:w-52">
          <label htmlFor="member-registration-period" className="mb-1.5 block text-xs font-medium text-[#6B7280] dark:text-[#94A3B8]">
            Registration period
          </label>
          <Select value={registrationPeriod} onValueChange={(value) => { setRegistrationPeriod(value as RegistrationPeriod); setMemberPage(1); }}>
            <SelectTrigger id="member-registration-period" className="h-10 rounded-xl border-[#E1E5EF] bg-[#F8F9FC] dark:border-white/10 dark:bg-white/5">
              <SelectValue placeholder="Choose a period" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-xl">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>      <div className="bg-white dark:bg-[#111327] rounded-2xl border border-[#F1F3FB] dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#F1F3FB] dark:border-white/10 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-2.5">
            <Search size={16} className="text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setMemberPage(1); }}
              placeholder="Search members..."
              className="flex-1 bg-transparent text-sm outline-none text-[#0D0F1C] dark:text-[#F0F2FF] placeholder:text-[#9CA3AF]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["All", "Blocked", "Not blocked"].map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setMemberPage(1); }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filter === f
                    ? "bg-[#3730A3] text-white"
                    : "bg-[#F1F3FB] dark:bg-white/5 text-[#374151] dark:text-gray-300 hover:bg-[#EEF2FF]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading users...</div>
        ) : error ? (
          <div className="p-8 text-center">
            <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>
            <button onClick={onRetry} className="text-sm font-semibold text-[#3730A3]">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#9CA3AF]">
            {members.length === 0 ? "No users found." : `No users registered ${registrationPeriodLabel.toLowerCase()} match these filters.`}
          </div>
        ) : (
        <>
        <div className="flex flex-col gap-1 border-b border-[#F1F3FB] px-4 py-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[#1F2937] dark:text-[#F0F2FF]">
            {filtered.length.toLocaleString()} members registered {registrationPeriodLabel.toLowerCase()}
          </p>
          <p className="text-xs text-[#8A91A5]">Showing {firstVisibleMember.toLocaleString()}–{lastVisibleMember.toLocaleString()}</p>
        </div>
        <div className="max-h-[min(65vh,640px)] overflow-auto">
          <table className="w-full min-w-[650px]">
            <thead className="sticky top-0 z-10 bg-[#F9FAFB] dark:bg-[#17192F] border-b border-[#F1F3FB] dark:border-white/10">
              <tr>
                {[
                  "Member",
                  "Group",
                  "Wallet Balance",
                  "Savings",
                  "KYC",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9FAFB] dark:divide-white/5">
              {visibleMembers.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#EEF2FF] dark:bg-[#818CF8]/20 flex items-center justify-center text-[#3730A3] dark:text-[#818CF8] text-sm font-bold flex-shrink-0">
                        {m.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#0D0F1C] dark:text-[#F0F2FF]">
                          {m.name}
                        </div>
                        <div className="text-xs text-[#9CA3AF]">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#6B7280] dark:text-[#94A3B8]">
                    {m.group}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                    {m.wallet === undefined ? "—" : fmt(m.wallet)}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                    {m.savings === undefined ? "—" : fmt(m.savings)}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge color="gray">{m.kyc}</Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge
                      color={
                        m.status === "Blocked" ? "red" : "gray"
                      }
                    >
                      {m.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setSelectedMember(m);
                        onNav("member-detail");
                      }}
                      className="text-[#3730A3] dark:text-[#818CF8] text-xs font-semibold hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#F1F3FB] px-4 py-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#8A91A5]">Page {currentPage} of {totalPages} · 25 members per page</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMemberPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-lg border border-[#E1E5EF] px-3 py-1.5 text-sm font-medium text-[#374151] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-gray-300">Previous</button>
            <button type="button" onClick={() => setMemberPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-[#E1E5EF] px-3 py-1.5 text-sm font-medium text-[#374151] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-gray-300">Next</button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

// ─── Member Detail Section ───────────────────────────────────────────────────
function MemberDetailSection({
  member,
  onBack,
}: {
  member: Member | null;
  onBack: () => void;
}) {
  const detailsQuery = useAdminUserDetails(member?.email, !!member);
  const blockUser = useBlockAdminUser();

  if (!member) {
    return (
      <div className="rounded-2xl border border-[#F1F3FB] bg-white p-8 text-center text-sm text-[#9CA3AF] dark:border-white/10 dark:bg-[#111327]">
        Select a member from the users list to view details.
        <button onClick={onBack} className="ml-2 font-semibold text-[#3730A3]">Back to members</button>
      </div>
    );
  }
  if (detailsQuery.isLoading) {
    return <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#9CA3AF] dark:bg-[#111327]">Loading member details...</div>;
  }
  if (detailsQuery.isError || !detailsQuery.data) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center dark:bg-[#111327]">
        <p role="alert" className="mb-3 text-sm text-red-600">
          {detailsQuery.error instanceof Error ? detailsQuery.error.message : "Unable to load member details"}
        </p>
        <button onClick={() => void detailsQuery.refetch()} className="font-semibold text-[#3730A3]">Retry</button>
      </div>
    );
  }

  const m = { ...member, ...detailsQuery.data };
  const blocked = detailsQuery.data.isBlocked === true;
  const handleBlock = async () => {
    try {
      const response = await blockUser.mutateAsync(m.email);
      toast.success(response.statusMessage || "User blocked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to block user");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white dark:bg-[#111327] border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center hover:bg-[#F9FAFB] transition-colors"
        >
          <ChevronLeft
            size={18}
            className="text-[#374151] dark:text-gray-300"
          />
        </button>
        <div>
          <h1
            className="text-2xl font-bold text-[#0D0F1C] dark:text-[#F0F2FF]"
            style={{
              fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
            }}
          >
            {m.name}
          </h1>
          <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">
            Member since {m.signUpOn ? new Date(m.signUpOn).toLocaleDateString() : "Not available"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 flex flex-col items-center text-center gap-4 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#EEF2FF] dark:bg-[#818CF8]/20 flex items-center justify-center text-[#3730A3] dark:text-[#818CF8] text-2xl font-bold">
            {m.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <div className="font-bold text-lg text-[#0D0F1C] dark:text-[#F0F2FF]">
              {m.name}
            </div>
            <div className="text-sm text-[#9CA3AF]">{m.email}</div>
            <div className="text-sm text-[#9CA3AF]">{m.phone || "Not available"}</div>
          </div>
          <Badge color="gray">KYC: Not available</Badge>
          <div className="grid grid-cols-2 gap-3 w-full">
            <a href={`mailto:${m.email}`} className="py-2 bg-[#EEF2FF] dark:bg-[#818CF8]/20 text-[#3730A3] dark:text-[#818CF8] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90">
              <Mail size={13} />
              Email
            </a>
            <button disabled title="Messaging API is not available" className="py-2 bg-[#ECFDF5] dark:bg-[#10B981]/20 text-[#059669] dark:text-[#10B981] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 opacity-50">
              <MessageSquare size={13} />
              Message unavailable
            </button>
          </div>
        </div>
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#111327] rounded-2xl p-4 border border-[#F1F3FB] dark:border-white/10 shadow-sm">
              <div className="text-xs text-[#9CA3AF] mb-1">Wallet Balance</div>
              <div
                className="text-xl font-bold text-[#0D0F1C] dark:text-[#F0F2FF]"
                style={{
                  fontFamily:
                    "var(--font-family-display, 'Bricolage Grotesque')",
                }}
              >
                {m.balance === undefined ? "—" : fmt(Number(m.balance))}
              </div>
            </div>
            <div className="bg-white dark:bg-[#111327] rounded-2xl p-4 border border-[#F1F3FB] dark:border-white/10 shadow-sm">
              <div className="text-xs text-[#9CA3AF] mb-1">Total Savings</div>
              <div
                className="text-xl font-bold text-[#059669]"
                style={{
                  fontFamily:
                    "var(--font-family-display, 'Bricolage Grotesque')",
                }}
              >
                —
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 shadow-sm">
            <div className="font-semibold text-[#0D0F1C] dark:text-[#F0F2FF] mb-3">
              Member Info
            </div>
            <div className="flex flex-col gap-2">
              {[
                ["Group", m.group],
                ["Status", m.status || "Not available"],
                ["Joined", m.signUpOn ? new Date(m.signUpOn).toLocaleDateString() : "Not available"],
                ["KYC Status", "Not available"],
                ["Account Number", m.accountNumber || "Not available"],
                ["Bank Tier", "Not available"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between text-sm py-1 border-b border-[#F9FAFB] dark:border-white/5 last:border-0"
                >
                  <span className="text-[#9CA3AF]">{k}</span>
                  <span className="font-medium capitalize text-[#0D0F1C] dark:text-[#F0F2FF]">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => void handleBlock()}
              disabled={blocked || blockUser.isPending}
              className="flex-1 py-2.5 bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] dark:bg-[#EF4444]/20 dark:text-[#EF4444] rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {blocked ? "User Blocked" : blockUser.isPending ? "Blocking..." : "Block Member"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KYC Section ─────────────────────────────────────────────────────────────
function KYCSection({
  queue,
  onApprove,
  onReject,
  isLoading,
  loadError,
  onRetry,
}: {
  queue: KYCItem[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  isLoading: boolean;
  loadError: string | null;
  onRetry: () => void;
}) {
  const [action, setAction] = useState<{
    id: string;
    type: "approve" | "reject";
  } | null>(null);
  const [reason, setReason] = useState("");
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  const confirmAction = () => {
    if (!action) return;
    if (action.type === "approve") {
      onApprove(action.id);
    } else {
      onReject(action.id, reason);
    }
    setAction(null);
    setReason("");
  };

  return (
    <div>
      <PageHeader
        title="KYC Review"
        subtitle={`${queue.length} pending reviews`}
      />
      {isLoading ? (
        <div className="rounded-2xl border border-[#F1F3FB] bg-white p-8 text-center text-sm text-[#9CA3AF] shadow-sm dark:border-white/10 dark:bg-[#111327]">
          Loading pending KYC submissions...
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900 dark:bg-[#111327]">
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>
          <button
            onClick={onRetry}
            className="rounded-xl bg-[#3730A3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#312E81]"
          >
            Retry
          </button>
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-white dark:bg-[#111327] rounded-2xl p-16 border border-[#F1F3FB] dark:border-white/10 flex flex-col items-center gap-4 text-center shadow-sm">
          <CheckCircle size={48} className="text-[#059669]" />
          <h3
            style={{
              fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
              fontWeight: 700,
              fontSize: 18,
            }}
            className="text-[#0D0F1C] dark:text-[#F0F2FF]"
          >
            All caught up!
          </h3>
          <p className="text-[#9CA3AF] text-sm max-w-sm">
            No KYC submissions are currently pending review. Great job
            maintaining customer verifications!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {queue.map((k) => (
            <div
              key={k.id}
              className="bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#EEF2FF] dark:bg-[#818CF8]/20 flex items-center justify-center text-[#3730A3] dark:text-[#818CF8] font-bold">
                    {k.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                      {k.name}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">
                      {k.email} · Submitted {k.submitted}
                    </div>
                  </div>
                </div>
                <Badge color={k.status === "reviewing" ? "indigo" : "gold"}>
                  {k.status}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  ["NIN", k.nin],
                  ["ID Type", k.idType],
                  ["Submitted", k.submitted],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    className="bg-[#F9FAFB] dark:bg-white/5 rounded-xl p-3"
                  >
                    <div className="text-xs text-[#9CA3AF]">{l}</div>
                    <div className="text-sm font-semibold text-[#0D0F1C] dark:text-[#F0F2FF] mt-0.5">
                      {v}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {["Document image"].map((doc) => (
                  <div
                    key={doc}
                    onClick={() => setPreviewDoc(`${k.name} - ${doc}`)}
                    className="aspect-[4/3] bg-[#F1F3FB] dark:bg-white/5 rounded-xl flex items-center justify-center cursor-pointer border border-dashed border-[#D1D5DB] dark:border-white/10"
                  >
                    <div className="text-center">
                      <Eye size={20} className="text-[#9CA3AF] mx-auto" />
                      <div className="text-xs text-[#9CA3AF] font-medium mt-1">
                      Not included in API response
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setAction({ id: k.id, type: "approve" })}
                  className="flex-1 py-2.5 bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] dark:bg-[#10B981]/20 dark:text-[#10B981] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  onClick={() => setAction({ id: k.id, type: "reject" })}
                  className="flex-1 py-2.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] dark:bg-[#EF4444]/20 dark:text-[#EF4444] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setPreviewDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-[#111327] rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-[#0D0F1C] dark:text-[#F0F2FF]">
                  {previewDoc}
                </h3>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-[#9CA3AF] hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="aspect-[16/10] bg-[#F1F3FB] dark:bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-center p-6">
                  <Shield size={48} className="text-[#3730A3] mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium text-[#374151] dark:text-gray-300">
                    Document image unavailable
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    The pending-KYC API does not include a document URL or image.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-5 py-2 bg-[#3730A3] text-white rounded-xl text-sm font-medium hover:bg-[#312E81]"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {action && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-[#111327] rounded-2xl p-6 w-full max-w-sm shadow-xl border border-white/10"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${action.type === "approve" ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"}`}
              >
                {action.type === "approve" ? (
                  <CheckCircle size={32} />
                ) : (
                  <XCircle size={32} />
                )}
              </div>
              <h3
                style={{
                  fontFamily:
                    "var(--font-family-display, 'Bricolage Grotesque')",
                  fontWeight: 700,
                  fontSize: 18,
                }}
                className="text-center text-[#0D0F1C] dark:text-[#F0F2FF]"
              >
                {action.type === "approve" ? "Approve KYC?" : "Reject KYC?"}
              </h3>
              <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm text-center mt-2">
                {action.type === "approve"
                  ? "This member will gain full access to PAVE wallet and savings features."
                  : "Please provide a reason for rejecting this verification."}
              </p>
              {action.type === "reject" && (
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Document blurry or name mismatch..."
                  className="w-full mt-4 bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] resize-none text-[#0D0F1C] dark:text-[#F0F2FF]"
                />
              )}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => {
                    setAction(null);
                    setReason("");
                  }}
                  className="flex-1 py-2.5 border-2 border-[#E5E7EB] dark:border-white/10 rounded-xl text-sm font-medium hover:bg-[#F9FAFB] dark:hover:bg-white/5 text-[#374151] dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
                    action.type === "approve"
                      ? "bg-[#059669] hover:bg-[#047857]"
                      : "bg-[#DC2626] hover:bg-[#B91C1C]"
                  }`}
                >
                  {action.type === "approve" ? "Approve" : "Reject"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Savings Programs Section ─────────────────────────────────────────────────
function SavingsProgramsSection({
  groups,
  isLoading,
  error,
  onRetry,
}: {
  groups: SavingsProgram[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    frequency: "monthly",
    target: "",
    contributionAmount: "",
    maxMembers: "",
    desc: "",
    startDate: "",
    endDate: "",
    visibility: "private",
  });
  const createGroup = useCreateAdminSavingsGroup();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmount = Number(form.target);
    const contributionAmount = Number(form.contributionAmount);
    const maxMembers = Number(form.maxMembers);
    if (
      !form.name.trim() ||
      !form.startDate ||
      !form.endDate ||
      !Number.isFinite(targetAmount) ||
      !Number.isFinite(contributionAmount) ||
      !Number.isInteger(maxMembers) ||
      targetAmount <= 0 ||
      contributionAmount <= 0 ||
      maxMembers <= 0
    ) {
      toast.error("Complete all required group fields with valid amounts and dates.");
      return;
    }

    try {
      await createGroup.mutateAsync({
        name: form.name.trim(),
        description: form.desc.trim(),
        targetAmount,
        contributionAmount,
        currency: "NGN",
        frequency: form.frequency,
        maxMembers,
        startDate: form.startDate,
        endDate: form.endDate,
        visibility: form.visibility,
        image: "",
      });
      toast.success("Savings group created successfully");
      setForm({
        name: "",
        frequency: "monthly",
        target: "",
        contributionAmount: "",
        maxMembers: "",
        desc: "",
        startDate: "",
        endDate: "",
        visibility: "private",
      });
      setShowForm(false);
    } catch (createError) {
      toast.error(
        createError instanceof Error
          ? createError.message
          : "Unable to create savings group",
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Savings Programs"
        subtitle="Manage community savings groups"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Program
          </button>
        }
      />

      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleCreate}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-[#111327] rounded-2xl p-6 border border-[#F1F3FB] dark:border-white/10 mb-5 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                style={{
                  fontFamily:
                    "var(--font-family-display, 'Bricolage Grotesque')",
                  fontWeight: 700,
                  fontSize: 16,
                }}
                className="text-[#0D0F1C] dark:text-[#F0F2FF]"
              >
                Create New Program
              </h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X size={18} className="text-[#9CA3AF]" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Program Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Q3 Community Thrift"
                  required
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Frequency
                </label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="w-full bg-[#F1F3FB] dark:bg-[#1E2140] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                >
                  {["daily", "weekly", "monthly"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Target Amount (₦)
                </label>
                <input
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  placeholder="1000000"
                  required
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Description
                </label>
                <input
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  placeholder="Brief description of group goal"
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Contribution Amount (₦)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.contributionAmount}
                  onChange={(e) => setForm({ ...form, contributionAmount: e.target.value })}
                  required
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Maximum Members
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxMembers}
                  onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
                  required
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Visibility
                </label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                  className="w-full bg-[#F1F3FB] dark:bg-[#1E2140] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border-2 border-[#E5E7EB] dark:border-white/10 rounded-xl text-sm font-medium hover:bg-[#F9FAFB] dark:hover:bg-white/5 text-[#374151] dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createGroup.isPending}
                className="flex-1 py-2.5 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
              >
                {createGroup.isPending ? "Creating..." : "Create Program"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#9CA3AF] dark:bg-[#111327]">Loading savings groups...</div>
      ) : error ? (
        <div className="rounded-2xl bg-white p-8 text-center dark:bg-[#111327]">
          <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>
          <button onClick={onRetry} className="font-semibold text-[#3730A3]">Retry</button>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D7DDEC] bg-white p-10 text-center dark:border-white/10 dark:bg-[#111327]">
          <h3 className="text-base font-semibold text-[#1F2937] dark:text-[#F0F2FF]">No savings programs yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280] dark:text-[#94A3B8]">
            The savings-groups API returned no programs. Create the first program to get started.
          </p>
          <button type="button" onClick={() => setShowForm(true)} className="mt-5 rounded-xl bg-[#3730A3] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#312E81]">
            Create first program
          </button>
        </div>
      ) : (
      <div className="flex flex-col gap-4">
        {groups.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    style={{
                      fontFamily:
                        "var(--font-family-display, 'Bricolage Grotesque')",
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                    className="text-[#0D0F1C] dark:text-[#F0F2FF]"
                  >
                    {p.name}
                  </h3>
                  <Badge
                    color={
                      p.status === "active"
                        ? "green"
                        : p.status === "completed"
                          ? "indigo"
                          : "gray"
                    }
                  >
                    {p.status}
                  </Badge>
                </div>
                <div className="text-sm text-[#9CA3AF] mt-0.5">
                  {p.type} · {p.members} members · Started {p.started}
                </div>
              </div>
              <button className="text-[#9CA3AF] hover:text-[#374151]">
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="h-2.5 bg-[#F1F3FB] dark:bg-white/5 rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct(p.collected, p.target)}%` }}
                transition={{ duration: 1 }}
                className="h-full rounded-full bg-[#3730A3]"
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                ["Target", fmt(p.target)],
                ["Collected", fmt(p.collected)],
                ["Progress", `${pct(p.collected, p.target)}%`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-[#9CA3AF]">{k}</div>
                  <div className="font-semibold text-[#0D0F1C] dark:text-[#F0F2FF] text-sm">
                    {v}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#F9FAFB] dark:border-white/5">
              <div className="text-xs text-[#9CA3AF]">
                Next cycle: {p.nextCycle}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-[#EEF2FF] dark:bg-[#818CF8]/20 text-[#3730A3] dark:text-[#818CF8] rounded-lg text-xs font-semibold hover:opacity-90">
                  <Users size={12} className="inline mr-1" />
                  Members
                </button>
                <button className="px-3 py-1.5 bg-[#F1F3FB] dark:bg-white/5 text-[#374151] dark:text-gray-300 rounded-lg text-xs font-semibold hover:opacity-90">
                  <Edit2 size={12} className="inline mr-1" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

// ─── Wallets Section with Detailed Member Wallet Modal ────────────────────────
function WalletsSection({
  members,
  isLoading,
  error,
  onRetry,
  onSelectMember,
}: {
  members: Member[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectMember: (m: Member) => void;
}) {
  const totalsQuery = useAdminDashboardTotals();
  const totalWalletBalance = totalsQuery.data?.totalWalletBalance;
  const averageBalance =
    totalWalletBalance !== undefined && members.length > 0
      ? totalWalletBalance / members.length
      : undefined;

  return (
    <div>
      <PageHeader
        title="Wallet Monitoring"
        subtitle="Real-time member wallet activity and ledger"
        action={
          <button className="px-4 py-2 bg-[#F1F3FB] dark:bg-white/10 text-[#374151] dark:text-gray-200 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#E5E7EB] transition-colors">
            <Download size={16} />
            Export Ledger
          </button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Wallet Funds"
          value={totalsQuery.isLoading ? "..." : totalWalletBalance === undefined ? "Unavailable" : fmt(totalWalletBalance)}
          sub="All members"
          icon={<Wallet size={20} />}
        />
        <StatCard
          label="Today's Credits"
          value="Unavailable"
          sub="No daily wallet-credit aggregate endpoint"
          icon={<ArrowDownLeft size={20} />}
          color="#059669"
          bg="#ECFDF5"
        />
        <StatCard
          label="Today's Debits"
          value="Unavailable"
          sub="No daily wallet-debit aggregate endpoint"
          icon={<ArrowUpRight size={20} />}
          color="#DC2626"
          bg="#FEF2F2"
        />
        <StatCard
          label="Avg. Balance"
          value={averageBalance === undefined ? "Unavailable" : fmt(averageBalance)}
          sub={averageBalance === undefined ? "Requires wallet totals and member count" : "Total wallet balance ÷ returned members"}
          icon={<DollarSign size={20} />}
          color="#7C3AED"
          bg="#F5F3FF"
        />
      </div>
      {totalsQuery.isError && (
        <QueryErrorNotice
          error={totalsQuery.error}
          onRetry={() => void totalsQuery.refetch()}
        />
      )}
      <div className="bg-white dark:bg-[#111327] rounded-2xl border border-[#F1F3FB] dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#F1F3FB] dark:border-white/10 flex items-center justify-between">
          <div>
            <h3
              style={{
                fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
                fontWeight: 700,
                fontSize: 16,
              }}
              className="text-[#0D0F1C] dark:text-[#F0F2FF]"
            >
              Member Wallet Balances
            </h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Click any user to inspect documented account details and transaction history
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead className="bg-[#F9FAFB] dark:bg-white/5">
              <tr>
                {[
                  "Member",
                  "Balance",
                  "This Month In",
                  "This Month Out",
                  "Last Activity",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9FAFB] dark:divide-white/5">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-sm text-[#9CA3AF]">Loading wallet users...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="p-8 text-center text-sm text-red-600">
                  {error} <button onClick={onRetry} className="ml-2 font-semibold text-[#3730A3]">Retry</button>
                </td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-sm text-[#9CA3AF]">No wallet users found.</td></tr>
              ) : members.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => onSelectMember(m)}
                  className="hover:bg-[#F9FAFB] dark:hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#EEF2FF] dark:bg-[#818CF8]/20 flex items-center justify-center text-[#3730A3] dark:text-[#818CF8] text-xs font-bold">
                        {m.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#0D0F1C] dark:text-[#F0F2FF] group-hover:text-[#3730A3] dark:group-hover:text-[#818CF8] transition-colors">
                          {m.name}
                        </div>
                        <div className="text-[11px] text-[#9CA3AF]">
                          {m.accountNumber || "Not available"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-sm text-[#0D0F1C] dark:text-[#F0F2FF]">
                    {m.wallet === undefined ? "—" : fmt(m.wallet)}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-[#9CA3AF]">—</td>
                  <td className="px-4 py-3.5 text-sm font-medium text-[#9CA3AF]">—</td>
                  <td className="px-4 py-3.5 text-xs text-[#9CA3AF]">
                    Not available from the user-role API
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-xs font-semibold text-[#3730A3] dark:text-[#818CF8] group-hover:underline">
                      View Details →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminTransactionsSection() {
  const [meterNumberInput, setMeterNumberInput] = useState("");
  const [searchedMeterNumber, setSearchedMeterNumber] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<AdminTransaction | null>(null);
  const transactionsQuery = useAdminTransactions();
  const searchQuery = useAdminTransactionSearch(searchedMeterNumber);
  const usersQuery = useAdminUserRoles();
  const transactionDetailsQuery = useAdminTransactionDetails(
    selectedTransaction?._id,
  );
  const users = usersQuery.data || [];
  const userById = new Map(users.map((user) => [user._id, user]));
  const transactions = transactionsQuery.data?.data || [];
  const filteredTransactions =
    selectedUserId === "all"
      ? transactions
      : transactions.filter((transaction) => {
          const transactionUserId =
            typeof transaction.userId === "string"
              ? transaction.userId
              : transaction.userId._id;
          return transactionUserId === selectedUserId;
        });
  const searchData = searchQuery.data;
  const searchedTransactions = Array.isArray(searchData)
    ? searchData.filter(isAdminTransaction)
    : [];
  const hasUnsupportedSearchResults =
    searchData !== undefined &&
    (!Array.isArray(searchData) ||
      searchedTransactions.length !== searchData.length);

  const getUser = (
    transactionUserId: string | AdminTransactionUser,
  ): AdminTransactionUser | AdminUserRole | undefined => {
    if (typeof transactionUserId !== "string") {
      return transactionUserId;
    }

    return userById.get(transactionUserId);
  };

  const transactionDetails = transactionDetailsQuery.data ?? selectedTransaction;
  const detailUser = transactionDetails
    ? getUser(transactionDetails.userId)
    : undefined;
  const detailUserName =
    detailUser && "fullName" in detailUser && typeof detailUser.fullName === "string"
      ? detailUser.fullName
      : detailUser
        ? `${detailUser.firstName || ""} ${detailUser.lastName || ""}`.trim()
        : "";
  const detailUserLabel = detailUser
    ? detailUserName || detailUser.email || detailUser._id
    : transactionDetails
      ? typeof transactionDetails.userId === "string"
        ? transactionDetails.userId
        : transactionDetails.userId._id
      : "—";

  const renderTransactionRow = (
    transaction: (typeof transactions)[number],
  ) => {
    const user = getUser(transaction.userId);
    const fullName =
      user && "fullName" in user && typeof user.fullName === "string"
        ? user.fullName
        : "";
    const displayName = user
      ? fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.email ||
        "Unknown user"
      : "Unknown user";
    const transactionId = transaction._id;

    return (
      <tr key={transactionId}>
        <td className="px-4 py-3 text-sm">
          <div className="font-medium text-[#0D0F1C] dark:text-[#F0F2FF]">
            {displayName}
          </div>
          <div className="text-xs text-[#9CA3AF]">
            {user?.email || ""}
          </div>
        </td>
        <td className="px-4 py-3 font-mono text-xs">{transaction.reference}</td>
        <td className="px-4 py-3 text-sm">
          {transaction.meterNumber || "—"}
        </td>
        <td className="px-4 py-3 text-sm font-semibold">
          {fmt(Number(transaction.amount))}
        </td>
        <td className="px-4 py-3 text-sm">{transaction.status}</td>
        <td className="px-4 py-3 text-xs text-[#6B7280] dark:text-[#94A3B8]">
          {new Date(transaction.createdAt).toLocaleString()}
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => setSelectedTransaction(transaction)}
            className="text-xs font-semibold text-[#3730A3] hover:underline dark:text-[#818CF8]"
          >
            View
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="Search and review platform transactions, users, and transaction details"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Transactions"
          value={
            transactionsQuery.isLoading
              ? "..."
              : transactionsQuery.isError
                ? "Unavailable"
                : String(transactionsQuery.data?.totalTransactions ?? 0)
          }
          icon={<TransactionsIcon size={20} />}
        />
        <StatCard
          label="Users"
          value={usersQuery.isLoading ? "..." : usersQuery.isError ? "Unavailable" : String(users.length)}
          icon={<Users size={20} />}
          color="#7C3AED"
          bg="#F5F3FF"
        />
        <StatCard
          label="Blocked Users"
          value={
            usersQuery.isLoading
              ? "..."
              : usersQuery.isError
                ? "Unavailable"
              : String(users.filter((user) => user.isBlocked).length)
          }
          icon={<Shield size={20} />}
          color="#DC2626"
          bg="#FEF2F2"
        />
      </div>

      <section className="rounded-2xl border border-[#F1F3FB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111327]">
        <div className="mb-4">
          <h2 className="font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
            Search by meter number
          </h2>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Search uses the meterNumber parameter from the Admin Search Transactions endpoint.
          </p>
        </div>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setSearchedMeterNumber(meterNumberInput.trim());
          }}
        >
          <input
            value={meterNumberInput}
            onChange={(event) => setMeterNumberInput(event.target.value)}
            placeholder="Enter meter number"
            className="min-w-0 flex-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-sm outline-none focus:border-[#3730A3] dark:border-white/10 dark:bg-white/5"
          />
          <button
            type="submit"
            disabled={!meterNumberInput.trim() || searchQuery.isFetching}
            className="rounded-xl bg-[#3730A3] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#312E81] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searchQuery.isFetching ? "Searching..." : "Search"}
          </button>
          {searchedMeterNumber && (
            <button
              type="button"
              onClick={() => {
                setSearchedMeterNumber("");
                setMeterNumberInput("");
              }}
              className="rounded-xl bg-[#F1F3FB] px-4 py-2.5 text-sm font-semibold text-[#374151] dark:bg-white/10 dark:text-gray-200"
            >
              Clear
            </button>
          )}
        </form>
        {searchQuery.isError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {searchQuery.error instanceof Error
              ? searchQuery.error.message
              : "Unable to search transactions"}
          </p>
        )}
        {searchedMeterNumber && !searchQuery.isLoading && !searchQuery.isError && hasUnsupportedSearchResults && (
          <p role="alert" className="mt-3 text-sm text-amber-700">
            Search completed, but the Postman collection does not document this endpoint&apos;s response shape, so the result cannot be safely displayed.
          </p>
        )}
        {searchedMeterNumber && !searchQuery.isLoading && !searchQuery.isError && (
          <div className="mt-4 overflow-x-auto">
            <h3 className="mb-2 text-sm font-semibold">
              Search results ({searchedTransactions.length})
            </h3>
            {hasUnsupportedSearchResults ? null : searchedTransactions.length ? (
              <table className="w-full min-w-[750px] text-left">
                <thead className="text-xs uppercase text-[#9CA3AF]">
                  <tr>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Reference</th>
                    <th className="px-4 py-2">Meter</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Details</th>
                  </tr>
                </thead>
                <tbody>{searchedTransactions.map(renderTransactionRow)}</tbody>
              </table>
            ) : (
              <p className="py-3 text-sm text-[#9CA3AF]">
                No transactions found for this meter number.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#F1F3FB] bg-white shadow-sm dark:border-white/10 dark:bg-[#111327]">
        <div className="flex flex-col justify-between gap-3 border-b border-[#F1F3FB] p-5 dark:border-white/10 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
              All Transactions
            </h2>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {transactionsQuery.isError
                ? "Transaction count unavailable"
                : `${transactionsQuery.data?.totalTransactions ?? 0} transactions`}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <label id="transaction-user-filter-label" className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8]">
              Filter by user
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger aria-labelledby="transaction-user-filter-label" className="h-10 w-full rounded-xl border-[#E1E5EF] bg-[#F8F9FC] text-sm shadow-sm dark:border-white/10 dark:bg-white/5 sm:w-[250px]">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-72 min-w-[250px] rounded-xl">
                <SelectItem value="all">All users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {(user.firstName + " " + user.lastName).trim() || user.email} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {transactionsQuery.isLoading ? (
          <div className="p-5 text-sm text-[#9CA3AF]">
            Loading all transactions...
          </div>
        ) : transactionsQuery.isError ? (
          <div className="p-5 text-sm text-red-600" role="alert">
            {transactionsQuery.error instanceof Error
              ? transactionsQuery.error.message
              : "Unable to load transactions"}
            <button
              onClick={() => void transactionsQuery.refetch()}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : filteredTransactions.length ? (
          <div className="max-h-[65dvh] overflow-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="sticky top-0 z-10 bg-[#F9FAFB] text-xs uppercase text-[#9CA3AF] dark:bg-[#17192E]">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Meter</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3FB] dark:divide-white/5">
                {filteredTransactions.map(renderTransactionRow)}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[#9CA3AF]">
            No transactions found.
          </div>
        )}
      </section>

      {usersQuery.isError && (
        <p role="alert" className="text-sm text-red-600">
          {usersQuery.error instanceof Error
            ? usersQuery.error.message
            : "Unable to load user roles"}
          <button
            onClick={() => void usersQuery.refetch()}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </p>
      )}

      <Dialog
        open={!!selectedTransaction}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
      >
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden border-[#D7DCE5] bg-white text-[#111827] shadow-2xl dark:border-white/15 dark:bg-[#111827] dark:text-[#F9FAFB]">
          <DialogHeader className="shrink-0 pr-6">
            <DialogTitle className="text-[#111827] dark:text-[#F9FAFB]">
              Transaction Details
            </DialogTitle>
            <DialogDescription className="break-all text-[#4B5563] dark:text-[#D1D5DB]">
              {transactionDetails?.reference ??
                "Full details for the selected transaction"}
            </DialogDescription>
          </DialogHeader>
          <div className="admin-dialog-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-2">
            {transactionDetailsQuery.isLoading && (
              <p className="text-sm text-[#9CA3AF]">Loading additional transaction details...</p>
            )}
            {transactionDetailsQuery.isError && (
              <div role="alert" className="text-sm text-red-600">
                {transactionDetailsQuery.error instanceof Error
                  ? transactionDetailsQuery.error.message
                  : "Unable to load transaction details"}
                <button
                  onClick={() => void transactionDetailsQuery.refetch()}
                  className="ml-3 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}
            {transactionDetails && (
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {[
                  ["ID", transactionDetails._id],
                  ["Reference", transactionDetails.reference],
                  ["Amount", fmt(Number(transactionDetails.amount))],
                  ["Status", transactionDetails.status],
                  ["Meter number", transactionDetails.meterNumber || "—"],
                  ["Meter account number", transactionDetails.meterAccountNumber || "—"],
                  ["Description", transactionDetails.description || "—"],
                  ["Vend type", transactionDetails.vendType || "—"],
                  ["Subclass", transactionDetails.subclass || "—"],
                  ["Tariff", transactionDetails.tariff || "—"],
                  [
                    "Units",
                    transactionDetails.unitsActual === undefined
                      ? "—"
                      : `${transactionDetails.unitsActual} ${transactionDetails.unitName || ""}`.trim(),
                  ],
                  [
                    "Transaction fees",
                    transactionDetails.transactionFees === undefined
                      ? "—"
                      : fmt(transactionDetails.transactionFees),
                  ],
                  [
                    "Vendor transaction fees",
                    transactionDetails.vendorTransactionFees === undefined
                      ? "—"
                      : fmt(transactionDetails.vendorTransactionFees),
                  ],
                  [
                    "Client transaction fees",
                    transactionDetails.clientTransactionFees === undefined
                      ? "—"
                      : fmt(transactionDetails.clientTransactionFees),
                  ],
                  [
                    "VAT",
                    transactionDetails.vat === undefined
                      ? "—"
                      : fmt(transactionDetails.vat),
                  ],
                  ["Token (hex)", transactionDetails.tokenHex || "—"],
                  ["Token (decimal)", transactionDetails.tokenDec || "—"],
                  [
                    "Vend time",
                    transactionDetails.vendTime
                      ? new Date(transactionDetails.vendTime).toLocaleString()
                      : "—",
                  ],
                  [
                    "Created",
                    new Date(transactionDetails.createdAt).toLocaleString(),
                  ],
                  [
                    "Updated",
                    transactionDetails.updatedAt
                      ? new Date(transactionDetails.updatedAt).toLocaleString()
                      : "—",
                  ],
                  ["User", detailUserLabel],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-xl border border-[#DDE2EA] bg-[#F3F5F9] p-3 shadow-sm dark:border-white/15 dark:bg-[#202438]"
                  >
                    <dt className="text-xs font-semibold text-[#4B5563] dark:text-[#D1D5DB]">
                      {label}
                    </dt>
                    <dd className="mt-1 break-all font-semibold leading-5 text-[#111827] dark:text-[#F9FAFB]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Marketplace Section with Detailed Product Modal ─────────────────────────
function MarketplaceSection() {
  return <div>
    <PageHeader title="Marketplace" subtitle="Manage products and installment listings" action={<button disabled title="Marketplace API is not available" className="px-4 py-2 bg-[#3730A3] text-white rounded-xl text-sm font-medium flex items-center gap-2 opacity-50 cursor-not-allowed"><Plus size={16} />Add Product unavailable</button>} />
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Product listing, inventory, and order-management endpoints are not present in the documented API collection.</div>
    <div className="bg-white dark:bg-[#111327] rounded-2xl border border-[#F1F3FB] dark:border-white/10 overflow-hidden shadow-sm">
      <div className="overflow-x-auto"><table className="w-full min-w-[700px]">
        <thead className="bg-[#F9FAFB] dark:bg-white/5"><tr>{["Product", "Category", "Price", "Installment", "Stock", "Sales", "Status", ""].map((heading) => <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">{heading}</th>)}</tr></thead>
        <tbody><tr><td colSpan={8} className="p-10 text-center text-sm text-[#9CA3AF]">No marketplace data available. A documented marketplace API is required to load products.</td></tr></tbody>
      </table></div>
    </div>
  </div>;
}
function MessagingSection() {
  const [tab, setTab] = useState<"inbox" | "broadcast">("inbox");
  return <div>
    <PageHeader title="Messaging & Broadcasts" subtitle="Communicate with your members" />
    <div className="bg-white dark:bg-[#111327] rounded-2xl overflow-hidden border border-[#F1F3FB] dark:border-white/10 shadow-sm">
      <div className="flex border-b border-[#F1F3FB] dark:border-white/10">{(["inbox", "broadcast"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`flex-1 py-3.5 text-sm font-semibold ${tab === item ? "bg-[#3730A3] text-white" : "text-[#9CA3AF] hover:bg-[#F9FAFB] dark:hover:bg-white/5"}`}>{item === "inbox" ? <><MessageSquare size={15} className="inline mr-2" />Inbox</> : <><Megaphone size={15} className="inline mr-2" />Broadcast</>}</button>)}</div>
      {tab === "inbox" ? <div className="p-12 text-center text-sm text-[#9CA3AF]">Messaging is unavailable because the documented API collection has no inbox or messaging endpoints.</div> : <div className="p-5"><div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Broadcast delivery is unavailable because the documented API collection has no broadcast endpoint.</div><div className="flex max-w-2xl flex-col gap-4"><label className="text-xs font-medium">Send To<select disabled className="mt-1.5 w-full rounded-xl bg-[#F1F3FB] px-4 py-3 text-sm"><option>Recipients unavailable</option></select></label><label className="text-xs font-medium">Subject<input disabled placeholder="Subject" className="mt-1.5 w-full rounded-xl bg-[#F1F3FB] px-4 py-3 text-sm" /></label><label className="text-xs font-medium">Message<textarea disabled rows={6} placeholder="Broadcast message" className="mt-1.5 w-full resize-none rounded-xl bg-[#F1F3FB] px-4 py-3 text-sm" /></label><div className="flex gap-3"><button disabled className="rounded-xl border-2 border-[#E5E7EB] px-5 py-2.5 text-sm opacity-50">Schedule unavailable</button><button disabled className="flex items-center gap-2 rounded-xl bg-[#3730A3] px-6 py-2.5 text-sm font-semibold text-white opacity-50"><Send size={15} />Send unavailable</button></div></div></div>}
    </div>
  </div>;
}
function ReportsSection() {
  const memberCount = useAdminTotalMembers();
  const userStats = useAdminUserStatistics();
  const retention = useAdminRetentionStatistics();
  const yearly = useAdminYearlyVending();
  const vending = useAdminVendingGraph();
  const registrations = useAdminDailyRegistrations();
  const cohorts = useAdminCohortAnalysis();
  const leaderboard = useAdminLeaderboard();
  const topContributors = useAdminTopPerformingUsers();
  const health = useAdminSystemHealth();
  const groups = useAdminSavingsGroups();
  const monthly = vending.data?.monthly ?? [];
  const topUsers = leaderboard.data?.leaderboards.topByAmount ?? [];
  const retryNotice = (query: { isLoading: boolean; isError: boolean; error: Error | null; refetch: () => Promise<unknown> }, empty: boolean, label: string) => query.isLoading ? <p className="py-10 text-center text-sm text-[#9CA3AF]">Loading {label}...</p> : query.isError ? <div role="alert" className="py-8 text-center text-sm text-red-600">{query.error?.message}<button onClick={() => void query.refetch()} className="ml-2 font-semibold">Retry</button></div> : empty ? <p className="py-10 text-center text-sm text-[#9CA3AF]">No {label} found.</p> : null;
  const healthFields = (values: Record<string, unknown>) => Object.entries(values).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value));

  return <div>
    <PageHeader title="Reports & Analytics" subtitle="Insights from documented platform analytics" action={<button disabled title="A report export endpoint is not available in the documented API" className="px-4 py-2 bg-[#059669] text-white rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed"><Download size={16} /> Export unavailable</button>} />
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
      <StatCard label="Total Members" value={memberCount.isLoading ? "..." : memberCount.data === undefined ? "Unavailable" : memberCount.data.toLocaleString()} sub="Admin member count" icon={<Users size={20} />} />
      <StatCard label="Active Users (24h)" value={userStats.isLoading ? "..." : userStats.data?.activeUsersLast24Hours.toLocaleString() ?? "Unavailable"} sub="Admin user statistics" icon={<Users size={20} />} color="#059669" bg="#ECFDF5" />
      <StatCard label="Registrations (month)" value={userStats.isLoading ? "..." : userStats.data?.registrations.thisMonth.toLocaleString() ?? "Unavailable"} sub="From user statistics" icon={<UserPlus size={20} />} color="#2563EB" bg="#EFF6FF" />
      <StatCard label="Yearly Vending Amount" value={yearly.isLoading ? "..." : yearly.data ? fmt(yearly.data.summary.totalAmount) : "Unavailable"} sub={yearly.data ? `${yearly.data.summary.count} transactions` : "Vending summary"} icon={<DollarSign size={20} />} color="#D97706" bg="#FFFBEB" />
      <StatCard label="Retention Rate" value={retention.isLoading ? "..." : retention.data?.retentionRate ?? "Unavailable"} sub="Admin retention statistics" icon={<TrendingUp size={20} />} color="#7C3AED" bg="#F5F3FF" />
    </div>
    {memberCount.isError && <QueryErrorNotice error={memberCount.error} onRetry={() => void memberCount.refetch()} />}
    {userStats.isError && <QueryErrorNotice error={userStats.error} onRetry={() => void userStats.refetch()} />}
    {retention.isError && <QueryErrorNotice error={retention.error} onRetry={() => void retention.refetch()} />}
    {yearly.isError && <QueryErrorNotice error={yearly.error} onRetry={() => void yearly.refetch()} />}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section className="rounded-2xl bg-white dark:bg-[#111327] p-5 shadow-sm"><h3 className="mb-4 font-bold">Monthly Vending Activity</h3>{retryNotice(vending, !monthly.length, "monthly vending data") ?? <ResponsiveContainer width="100%" height={200}><BarChart data={monthly}><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v: unknown) => fmt(Number(v))} /><CartesianGrid strokeDasharray="3 3" vertical={false} /><Bar dataKey="totalAmount" fill="#3730A3" name="Vending amount" /></BarChart></ResponsiveContainer>}</section>
      <section className="rounded-2xl bg-white dark:bg-[#111327] p-5 shadow-sm"><h3 className="mb-4 font-bold">Daily Registrations</h3>{retryNotice(registrations, !registrations.data?.length, "registration data") ?? <ResponsiveContainer width="100%" height={200}><LineChart data={registrations.data}><XAxis dataKey="date" /><YAxis /><Tooltip /><CartesianGrid strokeDasharray="3 3" vertical={false} /><Line type="monotone" dataKey="registrations" stroke="#3730A3" strokeWidth={3} name="Registrations" /></LineChart></ResponsiveContainer>}</section>
    </div>
    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section className="rounded-2xl border border-[#F1F3FB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111327]"><h3 className="mb-4 font-bold">Cohort Analysis</h3>{cohorts.isLoading ? <p className="text-sm text-[#9CA3AF]">Loading cohorts...</p> : cohorts.isError ? <div role="alert" className="text-sm text-red-600">{cohorts.error.message}<button onClick={() => void cohorts.refetch()} className="ml-2 font-semibold">Retry</button></div> : !cohorts.data?.length ? <p className="text-sm text-[#9CA3AF]">No cohort data found.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-[#9CA3AF]"><tr><th className="py-2">Cohort</th><th className="py-2">Registered</th><th className="py-2">Active</th></tr></thead><tbody>{cohorts.data.map((row) => <tr key={row.cohort}><td className="py-2">{row.cohort}</td><td className="py-2">{row.totalRegistered}</td><td className="py-2">{row.activeUsersInCohort}</td></tr>)}</tbody></table></div>}</section>
      <section className="rounded-2xl border border-[#F1F3FB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111327]"><h3 className="mb-4 font-bold">Top Users by Vending Amount</h3>{leaderboard.isLoading ? <p className="text-sm text-[#9CA3AF]">Loading leaderboard...</p> : leaderboard.isError ? <div role="alert" className="text-sm text-red-600">{leaderboard.error.message}<button onClick={() => void leaderboard.refetch()} className="ml-2 font-semibold">Retry</button></div> : !topUsers.length ? <p className="text-sm text-[#9CA3AF]">No leaderboard users found.</p> : topUsers.map((row) => <div key={row.userId} className="flex justify-between gap-3 border-b border-[#F1F3FB] py-2 text-sm dark:border-white/10"><div><div className="font-semibold">{row.fullName}</div><div className="text-xs text-[#9CA3AF]">{row.email}</div></div><div className="text-right"><div>{fmt(row.totalAmount)}</div><div className="text-xs text-[#9CA3AF]">{row.transactionCount} transactions</div></div></div>)}</section>
    </div>
    <section className="mt-4 rounded-2xl border border-[#F1F3FB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111327]">
      <h3 className="mb-4 font-bold">Top Performing Users in Contribution</h3>
      {topContributors.isLoading ? (
        <p className="text-sm text-[#9CA3AF]">Loading top contributors...</p>
      ) : topContributors.isError ? (
        <div role="alert" className="text-sm text-red-600">
          {topContributors.error.message}
          <button
            onClick={() => void topContributors.refetch()}
            className="ml-2 font-semibold"
          >
            Retry
          </button>
        </div>
      ) : !topContributors.data?.length ? (
        <p className="text-sm text-[#9CA3AF]">No top contributors found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-[#9CA3AF]">
              <tr>
                <th className="py-2">Member</th>
                <th className="py-2">Email</th>
                <th className="py-2">Contribution</th>
                <th className="py-2">Units</th>
                <th className="py-2">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {topContributors.data.map((row) => (
                <tr key={row.userId}>
                  <td className="py-2 font-medium">{row.fullName}</td>
                  <td className="py-2">{row.email}</td>
                  <td className="py-2">{fmt(row.totalAmount)}</td>
                  <td className="py-2">{row.totalUnits.toLocaleString()}</td>
                  <td className="py-2">{row.transactionCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">{(["system", "revenue", "performance"] as const).map((category) => { const values = health.data?.[category]; return <section key={category} className="rounded-2xl border border-[#F1F3FB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111327]"><h3 className="mb-3 font-bold capitalize">{category} Health</h3>{health.isLoading ? <p className="text-sm text-[#9CA3AF]">Loading...</p> : health.isError ? <div role="alert" className="text-sm text-red-600">{health.error.message}<button onClick={() => void health.refetch()} className="ml-2 font-semibold">Retry</button></div> : values && healthFields(values).length ? healthFields(values).map(([key, value]) => <div key={key} className="flex justify-between border-b border-[#F1F3FB] py-1.5 text-xs dark:border-white/10"><span className="text-[#9CA3AF]">{key}</span><span>{String(value)}</span></div>) : <p className="text-sm text-[#9CA3AF]">No summary fields provided.</p>}</section>; })}</div>
    {groups.isLoading ? <p className="mt-4 text-sm text-[#9CA3AF]">Loading savings group count...</p> : groups.isError ? <p role="alert" className="mt-4 text-sm text-red-600">Savings groups: {groups.error.message}<button onClick={() => void groups.refetch()} className="ml-2 font-semibold">Retry</button></p> : <p className="mt-4 text-sm text-[#6B7280] dark:text-[#94A3B8]">Savings groups: {groups.data?.length ?? 0} returned by the savings-groups API.</p>}
  </div>;
}

function NotificationsSection() {
  const notifications = useAdminNotifications();
  const markAsRead = useMarkAdminNotificationAsRead();
  const markAllAsRead = useMarkAllAdminNotificationsAsRead();
  const deleteNotification = useDeleteAdminNotification();
  const deleteAll = useDeleteAllAdminNotifications();

  const handleAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update notifications",
      );
    }
  };

  const handleDeleteAll = () => {
    if (
      window.confirm(
        "Delete all notifications? This action cannot be undone.",
      )
    ) {
      void handleAction(
        () => deleteAll.mutateAsync(),
        "All notifications deleted",
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Review and manage your notifications."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                void handleAction(
                  () => markAllAsRead.mutateAsync(),
                  "All notifications marked as read",
                )
              }
              disabled={
                !notifications.data?.unreadCount ||
                markAllAsRead.isPending ||
                notifications.isLoading
              }
              className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10"
            >
              <CheckCheck size={16} className="mr-2 inline" />
              Mark all as read
            </button>
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={
                !notifications.data?.notifications.length ||
                deleteAll.isPending ||
                notifications.isLoading
              }
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} className="mr-2 inline" />
              Delete all
            </button>
          </div>
        }
      />

      {notifications.isLoading ? (
        <div className="rounded-2xl border border-[#F1F3FB] bg-white p-8 text-center text-sm text-[#9CA3AF] shadow-sm dark:border-white/10 dark:bg-[#111327]">
          Loading notifications...
        </div>
      ) : notifications.isError ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-white p-8 text-center text-sm text-red-600 shadow-sm dark:bg-[#111327]"
        >
          <p>{notifications.error.message}</p>
          <button
            type="button"
            onClick={() => void notifications.refetch()}
            className="mt-3 font-semibold"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Unread"
              value={String(notifications.data.unreadCount)}
              sub="Needs your attention"
              icon={<Bell size={20} />}
              color="#D97706"
              bg="#FFFBEB"
            />
            <StatCard
              label="Read"
              value={String(notifications.data.readCount)}
              sub="Previously viewed"
              icon={<CheckCheck size={20} />}
              color="#059669"
              bg="#ECFDF5"
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#F1F3FB] bg-white shadow-sm dark:border-white/10 dark:bg-[#111327]">
            {notifications.data.notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#9CA3AF]">
                You have no notifications.
              </div>
            ) : (
              <ul className="divide-y divide-[#F1F3FB] dark:divide-white/10">
                {notifications.data.notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`flex items-start justify-between gap-4 p-5 ${
                      notification.isRead ? "" : "bg-indigo-50/50 dark:bg-indigo-950/20"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#111827] dark:text-[#F0F2FF]">
                          {notification.type.replaceAll("_", " ")}
                        </span>
                        {!notification.isRead && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                            Unread
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#4B5563] dark:text-[#CBD5E1]">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-[#9CA3AF]">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {!notification.isRead && (
                        <button
                          type="button"
                          aria-label="Mark notification as read"
                          title="Mark as read"
                          disabled={markAsRead.isPending}
                          onClick={() =>
                            void handleAction(
                              () => markAsRead.mutateAsync(notification.id),
                              "Notification marked as read",
                            )
                          }
                          className="rounded-lg p-2 text-[#059669] hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-950/30"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label="Delete notification"
                        title="Delete notification"
                        disabled={deleteNotification.isPending}
                        onClick={() =>
                          void handleAction(
                            () => deleteNotification.mutateAsync(notification.id),
                            "Notification deleted",
                          )
                        }
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SettingsSection() {
  const { admin } = useAuth();
  const canManageAdmins = admin?.role === "super_admin";
  const rolesQuery = useAdminUserRoles(canManageAdmins);
  const [adminForm, setAdminForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    role: "admin" as "admin" | "superadmin",
  });
  const createAdminAccount = useCreateAdminAccount();

  const handleAdminFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setAdminForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageAdmins) {
      toast.error("Only super administrators can create admin accounts.");
      return;
    }

    try {
      await createAdminAccount.mutateAsync(adminForm);
      toast.success("Admin account created successfully");
      setAdminForm({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
        city: "",
        state: "",
        role: "admin",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create admin account",
      );
    }
  };

  const adminName = admin?.name || "Not available";
  const adminInitials = adminName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div>
      <PageHeader
        title="Settings & Permissions"
        subtitle="Configure platform and administrative access"
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 shadow-sm">
          <h3
            style={{
              fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
              fontWeight: 700,
              fontSize: 16,
            }}
            className="mb-4 text-[#0D0F1C] dark:text-[#F0F2FF]"
          >
            Admin Profile
          </h3>
          <div className="flex items-center gap-4 mb-5 p-4 bg-[#F9FAFB] dark:bg-white/5 rounded-xl">
            <div className="w-14 h-14 rounded-full bg-[#EEF2FF] dark:bg-[#818CF8]/20 flex items-center justify-center text-[#3730A3] dark:text-[#818CF8] text-xl font-bold">
              {adminInitials}
            </div>
            <div>
              <div className="font-bold text-[#0D0F1C] dark:text-[#F0F2FF]">
                {adminName}
              </div>
              <div className="text-sm text-[#9CA3AF]">{admin?.email || "Not available"}</div>
              <Badge color="indigo">{admin?.role || "Role unavailable"}</Badge>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {["Organization Name", "Phone Number", "Timezone"].map((k) => (
              <div key={k}>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1">
                  {k}
                </label>
                <input
                  value="Not available"
                  disabled
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent text-[#9CA3AF]"
                />
              </div>
            ))}
            <button
              disabled
              title="Admin profile updates are not available in the documented API"
              className="py-2.5 bg-[#3730A3] text-white rounded-xl text-sm font-semibold mt-2 shadow-sm flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
            >
              Save Changes unavailable
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {canManageAdmins && <div className="bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 shadow-sm">
            <h3
              style={{
                fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
                fontWeight: 700,
                fontSize: 16,
              }}
              className="mb-1 text-[#0D0F1C] dark:text-[#F0F2FF]"
            >
              Create Admin Account
            </h3>
            <p className="mb-4 text-sm text-[#9CA3AF]">
              Add an administrator to the Pave platform.
            </p>
            <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["firstName", "First name"],
                ["lastName", "Last name"],
                ["email", "Email address"],
                ["phoneNumber", "Phone number"],
                ["address", "Address"],
                ["city", "City"],
                ["state", "State"],
              ].map(([name, label]) => (
                <label
                  key={name}
                  className={name === "address" ? "sm:col-span-2" : ""}
                >
                  <span className="mb-1 block text-xs font-medium text-[#374151] dark:text-gray-300">
                    {label}
                  </span>
                  <input
                    name={name}
                    type={name === "email" ? "email" : "text"}
                    value={adminForm[name as keyof typeof adminForm]}
                    onChange={handleAdminFormChange}
                    required
                    className="w-full rounded-xl border border-transparent bg-[#F1F3FB] px-4 py-3 text-sm text-[#0D0F1C] outline-none focus:border-[#3730A3] dark:bg-white/5 dark:text-[#F0F2FF]"
                  />
                </label>
              ))}
              <label>
                <span className="mb-1 block text-xs font-medium text-[#374151] dark:text-gray-300">
                  Role
                </span>
                <select
                  name="role"
                  value={adminForm.role}
                  onChange={handleAdminFormChange}
                  className="w-full rounded-xl border border-transparent bg-[#F1F3FB] px-4 py-3 text-sm text-[#0D0F1C] outline-none focus:border-[#3730A3] dark:bg-white/5 dark:text-[#F0F2FF]"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={createAdminAccount.isPending}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#3730A3] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#312E81] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
              >
                {createAdminAccount.isPending ? "Creating account..." : "Create Admin Account"}
              </button>
            </form>
          </div>}
          <div className="bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 shadow-sm">
            <h3
              style={{
                fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
                fontWeight: 700,
                fontSize: 16,
              }}
              className="mb-4 text-[#0D0F1C] dark:text-[#F0F2FF]"
            >
              Notifications
            </h3>
            <p className="text-sm text-[#9CA3AF]">
              Notification preferences are not available in the documented API.
            </p>
          </div>
          <div className="bg-white dark:bg-[#111327] rounded-2xl p-5 border border-[#F1F3FB] dark:border-white/10 shadow-sm">
            <h3
              style={{
                fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
                fontWeight: 700,
                fontSize: 16,
              }}
              className="mb-4 text-[#0D0F1C] dark:text-[#F0F2FF]"
            >
              Role Management
            </h3>
            {rolesQuery.isLoading ? (
              <p className="py-3 text-sm text-[#9CA3AF]">Loading admin roles...</p>
            ) : rolesQuery.isError ? (
              <div className="py-3 text-sm text-red-600">
                <p>{rolesQuery.error.message}</p>
                <button onClick={() => void rolesQuery.refetch()} className="mt-2 font-semibold text-[#3730A3]">Retry</button>
              </div>
            ) : Array.from(new Set((rolesQuery.data ?? []).map((user) => user.role))).length === 0 ? (
              <p className="py-3 text-sm text-[#9CA3AF]">No user roles found.</p>
            ) : Array.from(new Set((rolesQuery.data ?? []).map((user) => user.role))).map((r) => (
              <div
                key={r}
                className="flex items-center justify-between py-2.5 border-b border-[#F9FAFB] dark:border-white/5 last:border-0"
              >
                <span className="text-sm font-medium text-[#0D0F1C] dark:text-[#F0F2FF]">
                  {r}
                </span>
                <div className="flex gap-1.5">
                  <button disabled title="Role permissions are not available in the documented API" className="text-xs px-2.5 py-1 bg-[#EEF2FF] dark:bg-[#818CF8]/20 text-[#3730A3] dark:text-[#818CF8] rounded-lg font-medium opacity-50 cursor-not-allowed">
                    Permissions unavailable
                  </button>
                  <button disabled title="Role assignment is not available in the documented API" className="text-xs px-2.5 py-1 bg-[#F1F3FB] dark:bg-white/5 text-[#374151] dark:text-gray-300 rounded-lg font-medium opacity-50 cursor-not-allowed">
                    Assign unavailable
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Navigation Items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
  },
  { id: "members", icon: Users, label: "Members", path: "/dashboard/members" },
  { id: "kyc", icon: Shield, label: "KYC Review", path: "/dashboard/kyc" },
  {
    id: "savings-programs",
    icon: PiggyBank,
    label: "Savings Programs",
    path: "/dashboard/savings-programs",
  },
  {
    id: "wallets",
    icon: Wallet,
    label: "Wallet Monitor",
    path: "/dashboard/wallets",
  },
  {
    id: "transactions",
    icon: TransactionsIcon,
    label: "Transactions",
    path: "/dashboard/transactions",
  },
  {
    id: "marketplace",
    icon: ShoppingBag,
    label: "Marketplace",
    path: "/dashboard/marketplace",
  },
  {
    id: "messaging",
    icon: MessageSquare,
    label: "Messaging",
    path: "/dashboard/messaging",
  },
  {
    id: "reports",
    icon: BarChart2,
    label: "Reports",
    path: "/dashboard/reports",
  },
  {
    id: "settings",
    icon: Settings,
    label: "Settings",
    path: "/dashboard/settings",
  },
];

// ─── Main Admin App ───────────────────────────────────────────────────────────
export function AdminApp({
  isDark: externalIsDark,
  toggleDark: externalToggleDark,
}: {
  isDark?: boolean;
  toggleDark?: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, admin } = useAuth();

  // Dark mode state
  const [internalIsDark, setInternalIsDark] = useState(() => {
    return (
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("pave_dark") === "true"
    );
  });
  const isDark = externalIsDark !== undefined ? externalIsDark : internalIsDark;

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleDark = () => {
    if (externalToggleDark) {
      externalToggleDark();
    } else {
      const next = !internalIsDark;
      setInternalIsDark(next);
      localStorage.setItem("pave_dark", String(next));
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // Section syncing with URL route
  const getSectionFromPath = (path: string): AdminSection => {
    if (path.includes("/members/") && !path.endsWith("/members"))
      return "member-detail";
    if (path.includes("/members") || path.includes("/users")) return "members";
    if (path.includes("/kyc")) return "kyc";
    if (path.includes("/savings")) return "savings-programs";
    if (path.includes("/wallets")) return "wallets";
    if (path.includes("/transactions")) return "transactions";
    if (path.includes("/marketplace")) return "marketplace";
    if (path.includes("/messaging")) return "messaging";
    if (path.includes("/reports")) return "reports";
    if (path.includes("/settings")) return "settings";
    if (path.includes("/notifications")) return "notifications";
    return "dashboard";
  };

  const [section, setSection] = useState<AdminSection>(() =>
    getSectionFromPath(location.pathname),
  );
  const pendingKycQuery = usePendingAdminKyc(
    section === "kyc" || section === "kyc-detail",
  );
  const userRolesQuery = useAdminUserRoles();
  const members = (userRolesQuery.data ?? []).map(mapAdminRoleToMember);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const kycQueue = (pendingKycQuery.data ?? []).map(mapPendingKycUser);
  const savingsGroupsQuery = useAdminSavingsGroups(
    section === "savings-programs" || section === "program-detail",
  );
  const savingsPrograms = (savingsGroupsQuery.data ?? []).map(mapSavingsGroup);

  // Modals & Interactive View States
  const [selectedWalletMember, setSelectedWalletMember] =
    useState<Member | null>(null);
  const approveKycMutation = useApproveAdminKyc();
  const userDetailsQuery = useAdminUserDetails(
    selectedWalletMember?.email,
    !!selectedWalletMember,
  );
  const userTransactionsQuery = useAdminUserTransactions(
    selectedWalletMember?.email,
    !!selectedWalletMember,
  );
  const blockUserMutation = useBlockAdminUser();
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Global Search
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const q = searchQuery.trim().toLowerCase();
  const searchGroupsQuery = useAdminSavingsGroups(!!q);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search and notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync section state on route path change
  useEffect(() => {
    const s = getSectionFromPath(location.pathname);
    setSection(s);
  }, [location.pathname]);

  const nav = (s: AdminSection) => {
    setSection(s);
    const navItem = NAV_ITEMS.find((n) => n.id === s);
    if (navItem) {
      navigate(navItem.path);
    } else if (s === "member-detail") {
      navigate(
        selectedMember
          ? `/dashboard/members/${selectedMember.id}`
          : "/dashboard/members",
      );
    } else if (s === "notifications") {
      navigate("/dashboard/notifications");
    } else {
      navigate("/dashboard");
    }
  };

  // Search Results Computation
  const searchResults = {
    members: q
      ? members.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.group.toLowerCase().includes(q),
        )
      : [],
    programs: q
      ? (searchGroupsQuery.data ?? []).map(mapSavingsGroup).filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.type.toLowerCase().includes(q),
        )
      : [],
  };
  const hasSearchResults =
    searchResults.members.length > 0 ||
    searchResults.programs.length > 0;

  // Action handlers
  const handleApproveKYC = async (id: string) => {
    const pendingUser = kycQueue.find((kyc) => kyc.id === id);
    if (!pendingUser) return;

    try {
      await approveKycMutation.mutateAsync(pendingUser.id);
      toast.success("KYC approved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to approve KYC",
      );
    }
  };

  const handleBlockUser = async () => {
    if (!selectedWalletMember) return;

    try {
      const result = await blockUserMutation.mutateAsync(
        selectedWalletMember.email,
      );
      toast.success(result.statusMessage || "User status updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to block user",
      );
    }
  };

  const handleRejectKYC = (_id: string, _reason: string) => {
    toast.error("KYC rejection is not available in the documented API.");
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (e) {
      console.log(e);
    }
    navigate("/login");
  };

  const renderSection = () => {
    switch (section) {
      case "dashboard":
        return (
          <DashboardSection
            onNav={nav}
            onInvite={() => setShowInviteModal(true)}
          />
        );
      case "members":
        return (
          <MembersSection
            members={members}
            isLoading={userRolesQuery.isLoading}
            error={
              userRolesQuery.error instanceof Error
                ? userRolesQuery.error.message
                : userRolesQuery.isError
                  ? "Unable to load users"
                  : null
            }
            onRetry={() => void userRolesQuery.refetch()}
            onNav={nav}
            setSelectedMember={setSelectedMember}
            onInvite={() => setShowInviteModal(true)}
          />
        );
      case "member-detail":
        return (
          <MemberDetailSection
            member={selectedMember}
            onBack={() => nav("members")}
          />
        );
      case "kyc":
      case "kyc-detail":
        return (
          <KYCSection
            queue={kycQueue}
            onApprove={handleApproveKYC}
            onReject={handleRejectKYC}
            isLoading={pendingKycQuery.isLoading}
            loadError={
              pendingKycQuery.error instanceof Error
                ? pendingKycQuery.error.message
                : pendingKycQuery.isError
                  ? "Unable to load pending KYC submissions"
                  : null
            }
            onRetry={() => {
              void pendingKycQuery.refetch();
            }}
          />
        );
      case "savings-programs":
      case "program-detail":
        return (
          <SavingsProgramsSection
            groups={savingsPrograms}
            isLoading={savingsGroupsQuery.isLoading}
            error={
              savingsGroupsQuery.error instanceof Error
                ? savingsGroupsQuery.error.message
                : savingsGroupsQuery.isError
                  ? "Unable to load savings groups"
                  : null
            }
            onRetry={() => void savingsGroupsQuery.refetch()}
          />
        );
      case "wallets":
        return (
          <WalletsSection
            members={members}
            isLoading={userRolesQuery.isLoading}
            error={
              userRolesQuery.error instanceof Error
                ? userRolesQuery.error.message
                : userRolesQuery.isError
                  ? "Unable to load wallet users"
                  : null
            }
            onRetry={() => void userRolesQuery.refetch()}
            onSelectMember={(m) => setSelectedWalletMember(m)}
          />
        );
      case "transactions":
        return <AdminTransactionsSection />;
      case "marketplace":
      case "product-form":
        return <MarketplaceSection />;
      case "messaging":
      case "broadcast":
        return <MessagingSection />;
      case "reports":
        return <ReportsSection />;
      case "settings":
        return <SettingsSection />;
      case "notifications":
        return <NotificationsSection />;
      default:
        return (
          <DashboardSection
            onNav={nav}
            onInvite={() => setShowInviteModal(true)}
          />
        );
    }
  };

  return (
    <div
      className={`${isDark ? "dark" : ""} fixed inset-0 flex h-[100dvh] w-full overflow-hidden bg-[#F7F8FF] dark:bg-[#0A0B18] text-[#0D0F1C] dark:text-[#F0F2FF]`}
      style={{
        backgroundColor: isDark ? "#0A0B18" : "#F7F8FF",
        color: isDark ? "#F0F2FF" : "#0D0F1C",
        fontFamily: "var(--font-family-body, 'DM Sans')",
      }}
    >
      {/* Mobile Backdrop Overlay (only on mobile phones when drawer is open) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar: In-flow collapsible on tablet & large screens, off-canvas drawer on mobile */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-20 bg-white dark:bg-[#0D0F20] border-r border-[#F1F3FB] dark:border-white/10 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 ${
          sidebarOpen
            ? "translate-x-0 w-60 shadow-2xl md:shadow-none"
            : "-translate-x-full md:translate-x-0 md:w-16 shadow-none"
        }`}
      >
        {/* Logo and close button */}
        <div className="p-4 flex items-center justify-between border-b border-[#F1F3FB] dark:border-white/10 min-h-[61px]">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/pave_logo.png"
              alt="PAVE"
              className="w-9 h-9 rounded-xl object-contain flex-shrink-0 shadow-sm"
            />
            {sidebarOpen && (
              <div className="min-w-0">
                <div
                  style={{
                    fontFamily:
                      "var(--font-family-display, 'Bricolage Grotesque')",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                  className="text-[#0D0F1C] dark:text-[#F0F2FF] tracking-tight leading-none"
                >
                  PAVE
                </div>
                <div className="text-xs text-[#9CA3AF] mt-0.5">Admin</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden w-9 h-9 rounded-xl bg-[#F1F3FB] dark:bg-white/5 flex items-center justify-center text-[#374151] dark:text-[#F0F2FF] hover:bg-[#EEF2FF] dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle Navigation"
              title="Close navigation"
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-2.5 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active =
              section === item.id ||
              (section === "member-detail" && item.id === "members") ||
              (section === "kyc-detail" && item.id === "kyc") ||
              (section === "program-detail" &&
                item.id === "savings-programs") ||
              (section === "product-form" && item.id === "marketplace") ||
              (section === "broadcast" && item.id === "messaging");

            return (
              <button
                key={item.id}
                onClick={() => {
                  nav(item.id as AdminSection);
                }}
                title={!sidebarOpen ? item.label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  active
                    ? "bg-[#EEF2FF] dark:bg-[#818CF8]/20 text-[#3730A3] dark:text-[#818CF8] font-semibold shadow-sm"
                    : "text-[#9CA3AF] hover:bg-[#F9FAFB] dark:hover:bg-white/5 hover:text-[#374151] dark:hover:text-[#F0F2FF]"
                } ${sidebarOpen ? "" : "justify-center px-0"}`}
              >
                <item.icon size={19} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span
                    className="text-sm truncate"
                    style={{
                      fontFamily:
                        "var(--font-family-display, 'Bricolage Grotesque')",
                    }}
                  >
                    {item.label}
                  </span>
                )}
                {item.id === "kyc" && kycQueue.length > 0 && (
                  <span
                    className={`bg-[#DC2626] rounded-full text-white text-[10px] font-bold flex items-center justify-center ${
                      sidebarOpen
                        ? "ml-auto px-2 py-0.5"
                        : "absolute top-2 right-2 w-2 h-2 p-0"
                    }`}
                  >
                    {sidebarOpen ? kycQueue.length : ""}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-[#F1F3FB] dark:border-white/10">
          <button
            onClick={handleSignOut}
            title={!sidebarOpen ? "Sign Out" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-[#EF4444]/15 transition-all w-full font-medium ${
              sidebarOpen ? "" : "justify-center px-0"
            }`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-[#0D0F20] border-b border-[#F1F3FB] dark:border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 flex-shrink-0 z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0 max-w-lg">
            {/* Hamburger Button: Toggles sidebar on all screens (large, tablet, mobile) */}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="w-9 h-9 rounded-xl bg-[#F1F3FB] dark:bg-white/5 flex items-center justify-center flex-shrink-0 hover:bg-[#EEF2FF] dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle Navigation"
              title={sidebarOpen ? "Collapse navigation" : "Expand navigation"}
            >
              <Menu size={18} className="text-[#374151] dark:text-[#F0F2FF]" />
            </button>

            {/* Global Search Input with Functional Search Dropdown */}
            <div ref={searchContainerRef} className="relative flex-1">
              <div className="flex items-center gap-2 bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-3.5 py-2 transition-all focus-within:ring-2 focus-within:ring-[#3730A3]/20">
                <Search size={16} className="text-[#9CA3AF] flex-shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search members and savings groups..."
                  className="w-full bg-transparent text-sm outline-none text-[#0D0F1C] dark:text-[#F0F2FF] placeholder:text-[#9CA3AF]"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchFocused(false);
                    }}
                    className="text-[#9CA3AF] hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Functional Search Results Popup */}
              <AnimatePresence>
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111327] rounded-2xl shadow-2xl border border-[#F1F3FB] dark:border-white/10 overflow-hidden z-50 max-h-[380px] overflow-y-auto"
                  >
                    {!hasSearchResults ? (
                      <div className="p-5 text-center text-sm text-[#9CA3AF]">
                        No results found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    ) : (
                      <div className="py-2 divide-y divide-[#F9FAFB] dark:divide-white/5">
                        {searchResults.members.length > 0 && (
                          <div className="p-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] px-3 py-1">
                              Members ({searchResults.members.length})
                            </div>
                            {searchResults.members.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setSelectedMember(m);
                                  setIsSearchFocused(false);
                                  setSearchQuery("");
                                  nav("member-detail");
                                }}
                                className="w-full px-3 py-2 rounded-xl flex items-center justify-between hover:bg-[#F9FAFB] dark:hover:bg-white/5 text-left transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-[#EEF2FF] dark:bg-[#818CF8]/20 text-[#3730A3] font-bold text-xs flex items-center justify-center">
                                    {m.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                                      {m.name}
                                    </div>
                                    <div className="text-xs text-[#9CA3AF]">
                                      {m.email} · {m.group}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-[#059669]">
                                  {m.wallet === undefined ? "—" : fmt(m.wallet)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.programs.length > 0 && (
                          <div className="p-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] px-3 py-1">
                              Savings Programs ({searchResults.programs.length})
                            </div>
                            {searchResults.programs.map((pr) => (
                              <button
                                key={pr.id}
                                onClick={() => {
                                  setIsSearchFocused(false);
                                  setSearchQuery("");
                                  nav("savings-programs");
                                }}
                                className="w-full px-3 py-2 rounded-xl flex items-center justify-between hover:bg-[#F9FAFB] dark:hover:bg-white/5 text-left transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <PiggyBank
                                    size={18}
                                    className="text-[#D97706]"
                                  />
                                  <div>
                                    <div className="text-sm font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                                      {pr.name}
                                    </div>
                                    <div className="text-xs text-[#9CA3AF]">
                                      {pr.type} · {pr.members} members
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                                  {fmt(pr.collected)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Action Icons: Dark Mode, Notifications, Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDark}
              className="w-9 h-9 rounded-xl bg-[#F1F3FB] dark:bg-white/5 flex items-center justify-center hover:bg-[#EEF2FF] dark:hover:bg-white/10 transition-colors"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun size={17} className="text-[#D97706]" />
              ) : (
                <Moon size={17} className="text-[#374151]" />
              )}
            </button>

            <button
              onClick={() => nav("notifications")}
              title="View notifications"
              aria-label="View notifications"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F3FB] transition-colors hover:bg-[#EEF2FF] dark:bg-white/5 dark:hover:bg-white/10"
            >
              <Bell size={17} className="text-[#374151] dark:text-[#F0F2FF]" />
            </button>

            {/* Profile Avatar Initials */}
            <div
              className="w-9 h-9 rounded-full bg-[#3730A3] flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
              title={admin?.name || "Admin account"}
              onClick={() => nav("settings")}
            >
              {admin?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>
          </div>
        </header>

        {/* Scrollable Page Body: Locked window scroll with clean interior scrolling */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8 overscroll-contain">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="max-w-7xl mx-auto"
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Product Edit & Detail Modal */}
      {/* Global Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-[#111327] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  style={{
                    fontFamily:
                      "var(--font-family-display, 'Bricolage Grotesque')",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                  className="text-[#0D0F1C] dark:text-[#F0F2FF]"
                >
                  Invite New Member
                </h3>
                <button type="button" onClick={() => setShowInviteModal(false)}>
                  <X size={18} className="text-[#9CA3AF]" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  The documented API collection has no member invitation endpoint. No invitation can be sent from this screen.
                </p>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-full rounded-xl border-2 border-[#E5E7EB] py-2.5 text-sm font-medium text-[#374151] dark:border-white/10 dark:text-gray-300"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminApp;
