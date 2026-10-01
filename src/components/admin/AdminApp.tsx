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
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ShopProductForm } from "./ShopProductForm";
import { useAuth } from "@/hooks/useAuth";
import { FullScreenChat } from "./FullScreenChat";
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
  usePendingAdminKyc,
} from "@/hooks/useAdmin";
import { toast } from "@/components/ui/sonner";
import type {
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
  phone: string;
  kyc: "approved" | "pending" | "rejected";
  joined: string;
  wallet: number;
  savings: number;
  status: "active" | "inactive" | "pending" | "suspended";
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
  status: "active" | "completed" | "paused";
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  stock: number;
  sales: number;
  status: "active" | "out_of_stock";
  description?: string;
  specs?: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  category: "kyc" | "wallet" | "savings" | "marketplace";
  actionSection: AdminSection;
}

export interface Conversation {
  id: number;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
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

// ─── Initial Mock Data ────────────────────────────────────────────────────────
const INITIAL_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Emeka Adeyemi",
    email: "emeka@email.com",
    phone: "+234 801 234 5678",
    kyc: "approved",
    joined: "Jun 1, 2024",
    wallet: 247500,
    savings: 382500,
    status: "active",
    group: "Community Thrift",
    accountNumber: "9928374610",
    bankName: "PAVE Virtual Bank / Providus",
    tier: "Tier 3 - Verified",
  },
  {
    id: "2",
    name: "Chinwe Okonkwo",
    email: "chinwe@email.com",
    phone: "+234 805 876 5432",
    kyc: "pending",
    joined: "Jun 5, 2024",
    wallet: 85000,
    savings: 120000,
    status: "active",
    group: "Community Thrift",
    accountNumber: "9928374611",
    bankName: "PAVE Virtual Bank / Providus",
    tier: "Tier 2 - Basic",
  },
  {
    id: "3",
    name: "Adewale Bello",
    email: "adewale@email.com",
    phone: "+234 809 123 4567",
    kyc: "rejected",
    joined: "Jun 8, 2024",
    wallet: 0,
    savings: 0,
    status: "inactive",
    group: "Staff Coop",
    accountNumber: "9928374612",
    bankName: "PAVE Virtual Bank / Providus",
    tier: "Tier 1 - Unverified",
  },
  {
    id: "4",
    name: "Fatima Hassan",
    email: "fatima@email.com",
    phone: "+234 803 987 6543",
    kyc: "approved",
    joined: "May 20, 2024",
    wallet: 178000,
    savings: 95000,
    status: "active",
    group: "Community Thrift",
    accountNumber: "9928374613",
    bankName: "PAVE Virtual Bank / Providus",
    tier: "Tier 3 - Verified",
  },
  {
    id: "5",
    name: "Oluwaseun Afolabi",
    email: "seun@email.com",
    phone: "+234 806 543 2109",
    kyc: "approved",
    joined: "May 15, 2024",
    wallet: 312000,
    savings: 450000,
    status: "active",
    group: "Staff Coop",
    accountNumber: "9928374614",
    bankName: "PAVE Virtual Bank / Providus",
    tier: "Tier 3 - Verified",
  },
  {
    id: "6",
    name: "Amaka Eze",
    email: "amaka@email.com",
    phone: "+234 802 345 6789",
    kyc: "pending",
    joined: "Jun 12, 2024",
    wallet: 0,
    savings: 0,
    status: "pending",
    group: "Community Thrift",
    accountNumber: "9928374615",
    bankName: "PAVE Virtual Bank / Providus",
    tier: "Tier 1 - Unverified",
  },
];

const INITIAL_SAVINGS_PROGRAMS: SavingsProgram[] = [
  {
    id: "1",
    name: "PAVE Community Thrift",
    type: "Monthly",
    members: 24,
    target: 1000000,
    collected: 680000,
    started: "Jan 1, 2024",
    nextCycle: "Jul 1, 2024",
    status: "active",
  },
  {
    id: "2",
    name: "Staff Cooperative",
    type: "Bi-weekly",
    members: 18,
    target: 500000,
    collected: 220000,
    started: "Mar 1, 2024",
    nextCycle: "Jun 21, 2024",
    status: "active",
  },
  {
    id: "3",
    name: "Holiday Savings",
    type: "Weekly",
    members: 12,
    target: 300000,
    collected: 300000,
    started: "Jan 15, 2024",
    nextCycle: "—",
    status: "completed",
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Samsung Galaxy S25 Ultra",
    category: "Electronics",
    price: 850000,
    image:
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
    stock: 15,
    sales: 8,
    status: "active",
    description:
      "Next-generation flagship smartphone with 200MP camera, built-in S-Pen, Titanium armor frame, and AI-powered productivity features.",
    specs: [
      "256GB / 512GB Storage",
      "12GB LPDDR5X RAM",
      "Dynamic AMOLED 2X 120Hz",
      "5000mAh All-Day Battery",
    ],
  },
  {
    id: "2",
    name: 'LG 55" OLED Smart TV',
    category: "Electronics",
    price: 680000,
    image: "/images/lg_oled_tv.jpg",
    stock: 6,
    sales: 3,
    status: "active",
    description:
      "Self-lit OLED pixels offering infinite contrast, 4K Cinema HDR, Dolby Vision IQ, and ultra-smooth gaming at 120Hz.",
    specs: [
      "4K Ultra HD (3,840 x 2,160)",
      "α9 Gen6 AI Processor",
      "Dolby Atmos Audio",
      "webOS 24 with ThinQ AI",
    ],
  },
  {
    id: "3",
    name: "Dyson V15 Vacuum",
    category: "Home",
    price: 185000,
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    stock: 0,
    sales: 22,
    status: "out_of_stock",
    description:
      "Intelligent cordless vacuum with laser illumination that reveals invisible micro-dust on hard floors.",
    specs: [
      "Up to 60 Mins Runtime",
      "Piezo Acoustic Dust Sensor",
      "Hyperdymium Motor (125,000rpm)",
      "Whole-machine HEPA Filtration",
    ],
  },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_1",
    title: "New KYC Submission",
    description: "Amaka Eze submitted verification documents for review.",
    time: "5m ago",
    read: false,
    category: "kyc",
    actionSection: "kyc",
  },
  {
    id: "notif_2",
    title: "Thrift Contribution Received",
    description: "₦50,000 deposited in PAVE Community Thrift by Emeka Adeyemi.",
    time: "22m ago",
    read: false,
    category: "savings",
    actionSection: "savings-programs",
  },
  {
    id: "notif_3",
    title: "Marketplace Plan Started",
    description:
      "Emeka initiated a 50% down payment plan for Galaxy S25 Ultra.",
    time: "1h ago",
    read: true,
    category: "marketplace",
    actionSection: "marketplace",
  },
  {
    id: "notif_4",
    title: "KYC Verified",
    description:
      "Chinwe Okonkwo's KYC verification was completed successfully.",
    time: "2h ago",
    read: true,
    category: "kyc",
    actionSection: "kyc",
  },
  {
    id: "notif_5",
    title: "Wallet Direct Deposit",
    description: "₦100,000 wallet funding by Oluwaseun via bank transfer.",
    time: "3h ago",
    read: true,
    category: "wallet",
    actionSection: "wallets",
  },
];

const REVENUE_DATA = [
  { month: "Jan", wallet: 4200000, savings: 3100000, marketplace: 850000 },
  { month: "Feb", wallet: 5800000, savings: 3800000, marketplace: 1200000 },
  { month: "Mar", wallet: 6200000, savings: 4200000, marketplace: 980000 },
  { month: "Apr", wallet: 7100000, savings: 5100000, marketplace: 1450000 },
  { month: "May", wallet: 8900000, savings: 6300000, marketplace: 1800000 },
  { month: "Jun", wallet: 9400000, savings: 7200000, marketplace: 2100000 },
];

const MEMBER_GROWTH = [
  { month: "Jan", members: 12 },
  { month: "Feb", members: 18 },
  { month: "Mar", members: 24 },
  { month: "Apr", members: 32 },
  { month: "May", members: 41 },
  { month: "Jun", members: 56 },
];

const PIE_DATA = [
  { name: "Approved", value: 68, color: "#059669" },
  { name: "Pending", value: 20, color: "#D97706" },
  { name: "Rejected", value: 12, color: "#DC2626" },
];

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
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Admin Benjamin 👋"
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
          value="56"
          sub="+8 this month"
          icon={<Users size={20} />}
          trend={14}
        />
        <StatCard
          label="Total Wallet"
          value="₦12.4M"
          sub="Across all members"
          icon={<Wallet size={20} />}
          trend={22}
          color="#059669"
          bg="#ECFDF5"
        />
        <StatCard
          label="Total Savings"
          value="₦8.9M"
          sub="Active goals: 142"
          icon={<PiggyBank size={20} />}
          trend={18}
          color="#D97706"
          bg="#FFFBEB"
        />
        <StatCard
          label="KYC Pending"
          value="3"
          sub="Needs your review"
          icon={<Shield size={20} />}
          color="#DC2626"
          bg="#FEF2F2"
        />
      </div>

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
            <Badge color="indigo">Last 6 months</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="walletGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3730A3" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3730A3" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                dataKey="wallet"
                stroke="#3730A3"
                strokeWidth={2.5}
                fill="url(#walletGrad)"
                name="Wallet"
              />
              <Area
                type="monotone"
                dataKey="savings"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#savingsGrad)"
                name="Savings"
              />
            </AreaChart>
          </ResponsiveContainer>
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
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={PIE_DATA}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
                strokeWidth={0}
              >
                {PIE_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: unknown) => `${String(v)}%`}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-2">
            {PIE_DATA.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: d.color }}
                  />
                  <span className="text-[#6B7280] dark:text-[#94A3B8]">
                    {d.name}
                  </span>
                </div>
                <span className="font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                  {d.value}%
                </span>
              </div>
            ))}
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
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={MEMBER_GROWTH}>
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
                name="Members"
              />
            </BarChart>
          </ResponsiveContainer>
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
            Recent Activity
          </h3>
          <div className="flex flex-col gap-3">
            {[
              {
                icon: "👤",
                text: "Amaka Eze submitted KYC",
                time: "5m ago",
                color: "#3730A3",
              },
              {
                icon: "💰",
                text: "₦50,000 deposited in Community Thrift",
                time: "22m ago",
                color: "#059669",
              },
              {
                icon: "🛍️",
                text: "Emeka started payment plan for Galaxy S25",
                time: "1h ago",
                color: "#7C3AED",
              },
              {
                icon: "✅",
                text: "Chinwe Okonkwo's KYC approved",
                time: "2h ago",
                color: "#059669",
              },
              {
                icon: "💳",
                text: "₦100,000 wallet funding by Oluwaseun",
                time: "3h ago",
                color: "#059669",
              },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                  style={{ background: `${a.color}15` }}
                >
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#374151] dark:text-[#F0F2FF] truncate">
                    {a.text}
                  </div>
                </div>
                <div className="text-xs text-[#9CA3AF] flex-shrink-0">
                  {a.time}
                </div>
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
              3 KYC Submissions Awaiting Review
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
function MembersSection({
  members,
  onNav,
  setSelectedMember,
  onInvite,
}: {
  members: Member[];
  onNav: (s: AdminSection) => void;
  setSelectedMember: (m: Member) => void;
  onInvite: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = members.filter(
    (m) =>
      (filter === "All" ||
        m.kyc.toLowerCase() === filter.toLowerCase() ||
        m.status.toLowerCase() === filter.toLowerCase()) &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search)),
  );

  return (
    <div>
      <PageHeader
        title="Member Management"
        subtitle={`${members.length} total members`}
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
      <div className="bg-white dark:bg-[#111327] rounded-2xl border border-[#F1F3FB] dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#F1F3FB] dark:border-white/10 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-2.5">
            <Search size={16} className="text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="flex-1 bg-transparent text-sm outline-none text-[#0D0F1C] dark:text-[#F0F2FF] placeholder:text-[#9CA3AF]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["All", "Active", "Pending", "Approved"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead className="bg-[#F9FAFB] dark:bg-white/5 border-b border-[#F1F3FB] dark:border-white/10">
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
              {filtered.map((m) => (
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
                    {fmt(m.wallet)}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                    {fmt(m.savings)}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge
                      color={
                        m.kyc === "approved"
                          ? "green"
                          : m.kyc === "pending"
                            ? "gold"
                            : "red"
                      }
                    >
                      {m.kyc}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge
                      color={
                        m.status === "active"
                          ? "green"
                          : m.status === "pending"
                            ? "gold"
                            : "gray"
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
      </div>
    </div>
  );
}

// ─── Member Detail Section ───────────────────────────────────────────────────
function MemberDetailSection({
  member,
  onBack,
  onUpdateMember,
}: {
  member: Member;
  onBack: () => void;
  onUpdateMember?: (id: string, updates: Partial<Member>) => void;
}) {
  const m = member || INITIAL_MEMBERS[0];
  const [kycStatus, setKycStatus] = useState<
    "approved" | "pending" | "rejected"
  >(m.kyc);
  const [memberStatus, setMemberStatus] = useState<
    "active" | "inactive" | "pending" | "suspended"
  >(m.status);

  const handleApprove = () => {
    setKycStatus("approved");
    setMemberStatus("active");
    if (onUpdateMember)
      onUpdateMember(m.id, { kyc: "approved", status: "active" });
  };

  const handleSuspend = () => {
    setMemberStatus("suspended");
    if (onUpdateMember) onUpdateMember(m.id, { status: "suspended" });
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
            Member since {m.joined}
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
            <div className="text-sm text-[#9CA3AF]">{m.phone}</div>
          </div>
          <Badge
            color={
              kycStatus === "approved"
                ? "green"
                : kycStatus === "pending"
                  ? "gold"
                  : "red"
            }
          >
            KYC: {kycStatus}
          </Badge>
          <div className="grid grid-cols-2 gap-3 w-full">
            <button className="py-2 bg-[#EEF2FF] dark:bg-[#818CF8]/20 text-[#3730A3] dark:text-[#818CF8] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90">
              <Mail size={13} />
              Email
            </button>
            <button className="py-2 bg-[#ECFDF5] dark:bg-[#10B981]/20 text-[#059669] dark:text-[#10B981] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90">
              <MessageSquare size={13} />
              Message
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
                {fmt(m.wallet)}
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
                {fmt(m.savings)}
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
                ["Status", memberStatus],
                ["Joined", m.joined],
                ["KYC Status", kycStatus],
                ["Account Number", m.accountNumber || "9928374610"],
                ["Bank Tier", m.tier || "Tier 3 - Verified"],
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
              onClick={handleApprove}
              className="flex-1 py-2.5 bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5] dark:bg-[#10B981]/20 dark:text-[#10B981] rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Approve KYC
            </button>
            <button
              onClick={handleSuspend}
              className="flex-1 py-2.5 bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] dark:bg-[#EF4444]/20 dark:text-[#EF4444] rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Suspend Member
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
                {["ID Front", "ID Back", "Selfie"].map((doc) => (
                  <div
                    key={doc}
                    onClick={() => setPreviewDoc(`${k.name} - ${doc}`)}
                    className="aspect-[4/3] bg-[#F1F3FB] dark:bg-white/5 rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#EEF2FF] dark:hover:bg-white/10 transition-colors border border-transparent hover:border-[#3730A3]/20"
                  >
                    <div className="text-center">
                      <Eye size={20} className="text-[#9CA3AF] mx-auto" />
                      <div className="text-xs text-[#9CA3AF] font-medium mt-1">
                        {doc}
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
                  <Shield
                    size={48}
                    className="text-[#3730A3] mx-auto mb-2 opacity-50"
                  />
                  <p className="text-sm font-medium text-[#374151] dark:text-gray-300">
                    Government Verified Identification
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    High resolution document verification verified by Nimc /
                    FRSC
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
  programs,
  onAddProgram,
}: {
  programs: SavingsProgram[];
  onAddProgram: (p: SavingsProgram) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Monthly",
    target: "",
    desc: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.target) return;
    const targetNum = Number(form.target.replace(/[^0-9]/g, "")) || 500000;
    onAddProgram({
      id: String(Date.now()),
      name: form.name,
      type: form.type,
      members: 1,
      target: targetNum,
      collected: 0,
      started: "Just now",
      nextCycle: "Next month",
      status: "active",
    });
    setForm({ name: "", type: "Monthly", target: "", desc: "" });
    setShowForm(false);
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
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-[#F1F3FB] dark:bg-[#1E2140] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                >
                  {["Daily", "Weekly", "Bi-weekly", "Monthly"].map((t) => (
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
                className="flex-1 py-2.5 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
              >
                Create Program
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        {programs.map((p) => (
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
    </div>
  );
}

// ─── Wallets Section with Detailed Member Wallet Modal ────────────────────────
function WalletsSection({
  members,
  onSelectMember,
}: {
  members: Member[];
  onSelectMember: (m: Member) => void;
}) {
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
          value="₦12.4M"
          sub="All members"
          icon={<Wallet size={20} />}
          trend={22}
        />
        <StatCard
          label="Today's Credits"
          value="₦840K"
          sub="12 transactions"
          icon={<ArrowDownLeft size={20} />}
          trend={8}
          color="#059669"
          bg="#ECFDF5"
        />
        <StatCard
          label="Today's Debits"
          value="₦320K"
          sub="28 transactions"
          icon={<ArrowUpRight size={20} />}
          color="#DC2626"
          bg="#FEF2F2"
        />
        <StatCard
          label="Avg. Balance"
          value="₦221K"
          sub="Per member"
          icon={<DollarSign size={20} />}
          color="#7C3AED"
          bg="#F5F3FF"
        />
      </div>
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
              Click any member to inspect detailed account ledger & statements
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
              {members.map((m) => (
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
                          {m.accountNumber || "9928374610"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-sm text-[#0D0F1C] dark:text-[#F0F2FF]">
                    {fmt(m.wallet)}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-[#059669]">
                    +{fmt(Math.round(m.wallet * 0.4))}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-[#DC2626]">
                    -{fmt(Math.round(m.wallet * 0.15))}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#9CA3AF]">
                    Jun 14, 2024
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
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | undefined
  >();
  const transactionsQuery = useAdminTransactions();
  const searchQuery = useAdminTransactionSearch(searchedMeterNumber);
  const usersQuery = useAdminUserRoles();
  const transactionDetailsQuery = useAdminTransactionDetails(
    selectedTransactionId,
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
  const searchedTransactions = searchQuery.data || [];

  const getUser = (
    transactionUserId: string | AdminTransactionUser,
  ): AdminTransactionUser | AdminUserRole | undefined => {
    if (typeof transactionUserId !== "string") {
      return transactionUserId;
    }

    return userById.get(transactionUserId);
  };

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
            onClick={() => setSelectedTransactionId(transactionId)}
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
              : String(transactionsQuery.data?.totalTransactions ?? 0)
          }
          icon={<TransactionsIcon size={20} />}
        />
        <StatCard
          label="Users"
          value={usersQuery.isLoading ? "..." : String(users.length)}
          icon={<Users size={20} />}
          color="#7C3AED"
          bg="#F5F3FF"
        />
        <StatCard
          label="Blocked Users"
          value={
            usersQuery.isLoading
              ? "..."
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
        {searchedMeterNumber && !searchQuery.isLoading && !searchQuery.isError && (
          <div className="mt-4 overflow-x-auto">
            <h3 className="mb-2 text-sm font-semibold">
              Search results ({searchedTransactions.length})
            </h3>
            {searchedTransactions.length ? (
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
              {transactionsQuery.data?.totalTransactions ?? 0} transactions
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Filter by user
            </span>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="max-w-[240px] rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1E2140]"
            >
              <option value="all">All users</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} ({user.role})
                </option>
              ))}
            </select>
          </label>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-[#F9FAFB] text-xs uppercase text-[#9CA3AF] dark:bg-white/5">
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

      {selectedTransactionId && (
        <section className="rounded-2xl border border-[#F1F3FB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111327]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
              Transaction Details
            </h2>
            <button
              onClick={() => setSelectedTransactionId(undefined)}
              className="text-sm font-semibold text-[#6B7280] hover:text-[#0D0F1C] dark:text-gray-300"
            >
              Close
            </button>
          </div>
          {transactionDetailsQuery.isLoading ? (
            <p className="text-sm text-[#9CA3AF]">Loading transaction details...</p>
          ) : transactionDetailsQuery.isError ? (
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
          ) : transactionDetailsQuery.data ? (
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {[
                ["ID", transactionDetailsQuery.data._id],
                ["Reference", transactionDetailsQuery.data.reference],
                ["Amount", fmt(Number(transactionDetailsQuery.data.amount))],
                ["Status", transactionDetailsQuery.data.status],
                ["Meter number", transactionDetailsQuery.data.meterNumber || "—"],
                ["Description", transactionDetailsQuery.data.description || "—"],
                ["Created", new Date(transactionDetailsQuery.data.createdAt).toLocaleString()],
                [
                  "User",
                  typeof transactionDetailsQuery.data.userId === "string"
                    ? userById.get(transactionDetailsQuery.data.userId)?.email ||
                      transactionDetailsQuery.data.userId
                    : transactionDetailsQuery.data.userId.email ||
                      transactionDetailsQuery.data.userId._id,
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#F9FAFB] p-3 dark:bg-white/5">
                  <dt className="text-xs text-[#9CA3AF]">{label}</dt>
                  <dd className="mt-1 break-all font-medium text-[#374151] dark:text-gray-200">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      )}
    </div>
  );
}

// ─── Marketplace Section with Detailed Product Modal ─────────────────────────
function MarketplaceSection({
  products,
  onAddProduct,
  onDeleteProduct,
  onSelectProduct,
}: {
  products: Product[];
  onAddProduct: (p: Product) => void;
  onDeleteProduct: (p: Product) => void;
  onSelectProduct: (p: Product) => void;
}) {
  const [uiMode, setUiMode] = useState<"classic" | "coop">(() => {
    return (
      (localStorage.getItem("pave_marketplace_add_ui_mode") as
        | "classic"
        | "coop") || "coop"
    );
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Electronics",
    price: "",
    stock: "",
  });

  const handleSelectUiMode = (mode: "classic" | "coop") => {
    setUiMode(mode);
    localStorage.setItem("pave_marketplace_add_ui_mode", mode);
    setShowForm(true);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    const priceNum = Number(form.price.replace(/[^0-9]/g, "")) || 100000;
    const stockNum = Number(form.stock) || 10;
    onAddProduct({
      id: String(Date.now()),
      name: form.name,
      category: form.category,
      price: priceNum,
      stock: stockNum,
      sales: 0,
      image:
        "https://images.unsplash.com/photo-1593359677879-a4bb92f4834d?w=400&h=400&fit=crop",
      status: stockNum > 0 ? "active" : "out_of_stock",
      description:
        "Brand new item available with standard 50% down payment plan.",
      specs: ["1 Year Official Warranty", "Express Hub Pickup"],
    });
    setForm({ name: "", category: "Electronics", price: "", stock: "" });
    setShowForm(false);
  };

  return (
    <div>
      <PageHeader
        title="Marketplace"
        subtitle="Manage products and installment listings"
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* UI Mode Selector - without 'Add UI:' label */}
            <div className="bg-[#F1F3FB] dark:bg-white/5 p-1 rounded-xl flex items-center gap-1 border border-[#E5E7EB] dark:border-white/10 text-xs">
              <button
                type="button"
                onClick={() => handleSelectUiMode("classic")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  uiMode === "classic"
                    ? "bg-white dark:bg-[#3730A3] text-[#3730A3] dark:text-white shadow-sm font-semibold"
                    : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0D0F1C] dark:hover:text-white"
                }`}
                title="Use Classic Add Product form"
              >
                Classic Form
              </button>
              <button
                type="button"
                onClick={() => handleSelectUiMode("coop")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  uiMode === "coop"
                    ? "bg-[#3730A3] text-white shadow-sm font-semibold"
                    : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0D0F1C] dark:hover:text-white"
                }`}
                title="Use new Shop Product form"
              >
                <Sparkles
                  size={12}
                  className={uiMode === "coop" ? "text-amber-300" : ""}
                />
                Shop Product (New)
              </button>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {showForm &&
          (uiMode === "coop" ? (
            <ShopProductForm
              key="shop-product-form"
              onAddProduct={onAddProduct}
              onClose={() => setShowForm(false)}
              onSwitchToClassic={() => {
                setUiMode("classic");
                localStorage.setItem("pave_marketplace_add_ui_mode", "classic");
              }}
            />
          ) : (
            <motion.form
              key="classic-product-form"
              onSubmit={handleAdd}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-[#111327] rounded-2xl p-6 border border-[#F1F3FB] dark:border-white/10 mb-5 shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
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
                    Add New Product (Classic UI)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUiMode("coop");
                      localStorage.setItem(
                        "pave_marketplace_add_ui_mode",
                        "coop"
                      );
                    }}
                    className="px-2.5 py-1 bg-[#EEF2FF] dark:bg-white/10 hover:bg-[#E0E7FF] text-[#3730A3] dark:text-[#818CF8] rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Switch to the new Shop Product form"
                  >
                    <Sparkles size={12} />
                    Switch to Shop Product (New)
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}>
                    <X size={18} className="text-[#9CA3AF]" />
                  </button>
                </div>
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Product Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Samsung Galaxy S25"
                  required
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full bg-[#F1F3FB] dark:bg-[#1E2140] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                >
                  {["Electronics", "Fashion", "Home", "Kitchen"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Price (₦)
                </label>
                <input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="850000"
                  required
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Stock Quantity
                </label>
                <input
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="15"
                  required
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                  Product Image
                </label>
                <button
                  type="button"
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl py-3 text-sm text-[#9CA3AF] flex items-center justify-center gap-2 hover:bg-[#EEF2FF] dark:hover:bg-white/10 transition-colors"
                >
                  <Upload size={16} />
                  Upload Image
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border-2 border-[#E5E7EB] dark:border-white/10 rounded-xl text-sm font-medium text-[#374151] dark:text-gray-300 hover:bg-[#F9FAFB]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                Publish Product
              </button>
            </div>
          </motion.form>
        ))}
      </AnimatePresence>

      <div className="bg-white dark:bg-[#111327] rounded-2xl border border-[#F1F3FB] dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-[#F9FAFB] dark:bg-white/5 border-b border-[#F1F3FB] dark:border-white/10">
              <tr>
                {[
                  "Product",
                  "Category",
                  "Price",
                  "50% Down",
                  "Stock",
                  "Sales",
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
              {products.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className="hover:bg-[#F9FAFB] dark:hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <ImageWithFallback
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 rounded-xl object-cover bg-[#F1F3FB] dark:bg-white/5 flex-shrink-0"
                      />
                      <span className="text-sm font-medium text-[#0D0F1C] dark:text-[#F0F2FF] group-hover:text-[#3730A3] dark:group-hover:text-[#818CF8] transition-colors">
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge color="gray">{p.category}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                    {fmt(p.price)}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-[#7C3AED]">
                    {fmt(p.price / 2)}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#0D0F1C] dark:text-[#F0F2FF]">
                    {p.stock}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#0D0F1C] dark:text-[#F0F2FF]">
                    {p.sales}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge color={p.status === "active" ? "green" : "red"}>
                      {p.status === "active" ? "Active" : "Out of Stock"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onSelectProduct(p)}
                        className="w-7 h-7 rounded-lg bg-[#EEF2FF] dark:bg-[#818CF8]/20 flex items-center justify-center text-[#3730A3] dark:text-[#818CF8] hover:opacity-90 transition-colors"
                        title="Edit product details"
                        aria-label="Edit product details"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p)}
                        className="w-7 h-7 rounded-lg bg-[#FEF2F2] dark:bg-[#EF4444]/20 flex items-center justify-center text-[#DC2626] dark:text-[#EF4444] hover:opacity-90 transition-colors"
                        title="Delete product"
                        aria-label="Delete product"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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

// ─── Messaging Section ────────────────────────────────────────────────────────
function MessagingSection() {
  const [tab, setTab] = useState<"inbox" | "broadcast">("inbox");
  const [msg, setMsg] = useState("");
  const [subject, setSubject] = useState("");
  const [sent, setSent] = useState(false);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);

  const conversations: Conversation[] = [
    {
      id: 1,
      name: "Emeka Adeyemi",
      lastMsg: "When is the next payout?",
      time: "5m",
      unread: 1,
    },
    {
      id: 2,
      name: "Chinwe Okonkwo",
      lastMsg: "Thank you for approving my KYC!",
      time: "1h",
      unread: 0,
    },
    {
      id: 3,
      name: "Fatima Hassan",
      lastMsg: "Can I change my savings frequency?",
      time: "2h",
      unread: 2,
    },
    {
      id: 4,
      name: "Oluwaseun Afolabi",
      lastMsg: "Got it, thanks!",
      time: "1d",
      unread: 0,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Messaging & Broadcasts"
        subtitle="Communicate with your members"
      />
      <div className="bg-white dark:bg-[#111327] rounded-2xl overflow-hidden border border-[#F1F3FB] dark:border-white/10 shadow-sm">
        <div className="flex border-b border-[#F1F3FB] dark:border-white/10">
          {(["inbox", "broadcast"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-[#3730A3] text-white"
                  : "text-[#9CA3AF] hover:bg-[#F9FAFB] dark:hover:bg-white/5"
              }`}
            >
              {t === "inbox" ? (
                <>
                  <MessageSquare size={15} className="inline mr-2" />
                  Inbox
                </>
              ) : (
                <>
                  <Megaphone size={15} className="inline mr-2" />
                  Broadcast
                </>
              )}
            </button>
          ))}
        </div>
        {tab === "inbox" ? (
          <div className="divide-y divide-[#F9FAFB] dark:divide-white/5">
            {conversations.map((c, i) => (
              <button
                key={i}
                onClick={() => setActiveChat(c)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#EEF2FF] dark:bg-[#818CF8]/20 flex items-center justify-center text-[#3730A3] dark:text-[#818CF8] text-sm font-bold flex-shrink-0">
                  {c.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                      {c.name}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">{c.time}</span>
                  </div>
                  <div className="text-sm text-[#9CA3AF] truncate mt-0.5">
                    {c.lastMsg}
                  </div>
                </div>
                {c.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#3730A3] text-white flex items-center justify-center flex-shrink-0 text-[11px] font-bold">
                    {c.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-5">
            {!sent ? (
              <div className="flex flex-col gap-4 max-w-2xl">
                <div>
                  <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                    Send To
                  </label>
                  <select className="w-full bg-[#F1F3FB] dark:bg-[#1E2140] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]">
                    <option>All Members (56)</option>
                    <option>Community Thrift Group (24)</option>
                    <option>Staff Cooperative (18)</option>
                    <option>Pending KYC Members (3)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                    Subject
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Monthly Contribution Reminder"
                    className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    rows={6}
                    placeholder="Type your broadcast message here..."
                    className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] resize-none text-[#0D0F1C] dark:text-[#F0F2FF]"
                  />
                </div>
                <div className="flex gap-3">
                  <button className="px-5 py-2.5 border-2 border-[#E5E7EB] dark:border-white/10 rounded-xl text-sm font-medium hover:bg-[#F9FAFB] text-[#374151] dark:text-gray-300">
                    Schedule
                  </button>
                  <button
                    onClick={() => setSent(true)}
                    disabled={!msg || !subject}
                    className="px-6 py-2.5 bg-[#3730A3] text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#312E81] transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Send size={15} />
                    Send Broadcast
                  </button>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-12 gap-4"
              >
                <div className="w-16 h-16 bg-[#ECFDF5] dark:bg-[#10B981]/20 rounded-full flex items-center justify-center">
                  <CheckCircle size={36} className="text-[#059669]" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-[#0D0F1C] dark:text-[#F0F2FF]">
                    Broadcast Sent!
                  </div>
                  <div className="text-sm text-[#9CA3AF]">
                    Your message has been delivered to all selected members.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSent(false);
                    setMsg("");
                    setSubject("");
                  }}
                  className="px-5 py-2.5 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Send Another
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Full Screen Chat */}
      <AnimatePresence>
        {activeChat && (
          <FullScreenChat
            conversation={activeChat}
            onClose={() => setActiveChat(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Reports Section ──────────────────────────────────────────────────────────
function ReportsSection() {
  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Insights across your platform"
        action={
          <button className="px-4 py-2 bg-[#059669] text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#047857] transition-colors shadow-sm">
            <Download size={16} />
            Export Report
          </button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Revenue"
          value="₦24.6M"
          sub="All time"
          icon={<DollarSign size={20} />}
          trend={31}
        />
        <StatCard
          label="Active Members"
          value="52"
          sub="93% of total"
          icon={<Users size={20} />}
          trend={14}
          color="#059669"
          bg="#ECFDF5"
        />
        <StatCard
          label="Savings Goals"
          value="142"
          sub="Active goals"
          icon={<Target size={20} />}
          trend={22}
          color="#D97706"
          bg="#FFFBEB"
        />
        <StatCard
          label="Marketplace Sales"
          value="33"
          sub="₦6.1M in orders"
          icon={<ShoppingBag size={20} />}
          trend={45}
          color="#7C3AED"
          bg="#F5F3FF"
        />
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
            Monthly Revenue
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={REVENUE_DATA}>
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
                tickFormatter={(v) => `₦${v / 1000000}M`}
              />
              <Tooltip
                formatter={(v: unknown) => `₦${Number(v).toLocaleString()}`}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="wallet" stackId="a" fill="#3730A3" name="Wallet" />
              <Bar
                dataKey="savings"
                stackId="a"
                fill="#059669"
                name="Savings"
              />
              <Bar
                dataKey="marketplace"
                stackId="a"
                fill="#D97706"
                radius={[6, 6, 0, 0]}
                name="Marketplace"
              />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
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
            Member Growth
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MEMBER_GROWTH}>
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
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F3FB"
                vertical={false}
              />
              <Line
                type="monotone"
                dataKey="members"
                stroke="#3730A3"
                strokeWidth={3}
                dot={{ fill: "#3730A3", r: 5 }}
                activeDot={{ r: 7 }}
                name="Members"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────
function SettingsSection() {
  const { admin } = useAuth();
  const canManageAdmins = admin?.role === "super_admin";
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [saved, setSaved] = useState(false);
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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

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

  const notificationToggles: Array<{
    label: string;
    value: boolean;
    setter: (v: boolean) => void;
  }> = [
    { label: "Email Notifications", value: emailNotif, setter: setEmailNotif },
    { label: "SMS Alerts", value: smsNotif, setter: setSmsNotif },
  ];

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
              BO
            </div>
            <div>
              <div className="font-bold text-[#0D0F1C] dark:text-[#F0F2FF]">
                Benjamin Okonkwo
              </div>
              <div className="text-sm text-[#9CA3AF]">benjamin@pave.com</div>
              <Badge color="indigo">Super Admin</Badge>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {[
              ["Organization Name", "Okonkwo Community Group"],
              ["Phone Number", "+234 803 123 4567"],
              ["Timezone", "Africa/Lagos"],
            ].map(([k, v]) => (
              <div key={k}>
                <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1">
                  {k}
                </label>
                <input
                  defaultValue={v}
                  className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                />
              </div>
            ))}
            <button
              onClick={handleSave}
              className="py-2.5 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-sm font-semibold transition-colors mt-2 shadow-sm flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <Check size={16} />
                  Saved Successfully!
                </>
              ) : (
                "Save Changes"
              )}
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
            {notificationToggles.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-3 border-b border-[#F9FAFB] dark:border-white/5 last:border-0"
              >
                <span className="text-sm font-medium text-[#0D0F1C] dark:text-[#F0F2FF]">
                  {item.label}
                </span>
                <button
                  onClick={() => item.setter(!item.value)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${item.value ? "bg-[#3730A3]" : "bg-[#D1D5DB] dark:bg-gray-700"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.value ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            ))}
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
            {["Super Admin", "Admin", "Moderator", "Viewer"].map((r) => (
              <div
                key={r}
                className="flex items-center justify-between py-2.5 border-b border-[#F9FAFB] dark:border-white/5 last:border-0"
              >
                <span className="text-sm font-medium text-[#0D0F1C] dark:text-[#F0F2FF]">
                  {r}
                </span>
                <div className="flex gap-1.5">
                  <button className="text-xs px-2.5 py-1 bg-[#EEF2FF] dark:bg-[#818CF8]/20 text-[#3730A3] dark:text-[#818CF8] rounded-lg font-medium hover:opacity-90">
                    Permissions
                  </button>
                  <button className="text-xs px-2.5 py-1 bg-[#F1F3FB] dark:bg-white/5 text-[#374151] dark:text-gray-300 rounded-lg font-medium hover:opacity-90">
                    Assign
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
  const { logout } = useAuth();

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
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [selectedMember, setSelectedMember] = useState<Member>(
    INITIAL_MEMBERS[0],
  );
  const [kycQueue, setKycQueue] = useState<KYCItem[]>([]);
  const [savingsPrograms, setSavingsPrograms] = useState<SavingsProgram[]>(
    INITIAL_SAVINGS_PROGRAMS,
  );
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS,
  );

  useEffect(() => {
    if (pendingKycQuery.data) {
      setKycQueue(pendingKycQuery.data.map(mapPendingKycUser));
    }
  }, [pendingKycQuery.data]);

  // Modals & Interactive View States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editProductForm, setEditProductForm] = useState<Product | null>(null);
  const [isEditProductSaved, setIsEditProductSaved] = useState(false);
  const [productModalTab, setProductModalTab] = useState<"edit" | "preview">(
    "edit",
  );
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
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
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  // Global Search
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  // Close search and notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(e.target as Node)
      ) {
        setShowNotificationDropdown(false);
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
      navigate(`/dashboard/members/${selectedMember?.id || 1}`);
    } else if (s === "notifications") {
      navigate("/dashboard/notifications");
    } else {
      navigate("/dashboard");
    }
  };

  // Search Results Computation
  const q = searchQuery.trim().toLowerCase();
  const searchResults = {
    members: q
      ? members.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.group.toLowerCase().includes(q),
        )
      : [],
    products: q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q),
        )
      : [],
    programs: q
      ? savingsPrograms.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.type.toLowerCase().includes(q),
        )
      : [],
  };
  const hasSearchResults =
    searchResults.members.length > 0 ||
    searchResults.products.length > 0 ||
    searchResults.programs.length > 0;

  // Action handlers
  const handleApproveKYC = async (id: string) => {
    const pendingUser = kycQueue.find((kyc) => kyc.id === id);
    if (!pendingUser) return;

    try {
      await approveKycMutation.mutateAsync(pendingUser.id);
      setKycQueue((prev) => prev.filter((kyc) => kyc.id !== id));
      setMembers((prev) =>
        prev.map((member) =>
          member.email === pendingUser.email
            ? { ...member, kyc: "approved" as const, status: "active" as const }
            : member,
        ),
      );
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
      setMembers((prev) =>
        prev.map((member) =>
          member.email === result.email
            ? {
                ...member,
                status: result.isBlocked ? "suspended" : "active",
              }
            : member,
        ),
      );
      setSelectedWalletMember((current) =>
        current?.email === result.email
          ? { ...current, status: result.isBlocked ? "suspended" : "active" }
          : current,
      );
      toast.success(result.statusMessage || "User status updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to block user",
      );
    }
  };

  const handleRejectKYC = (id: string, _reason: string) => {
    setKycQueue((prev) => prev.filter((k) => k.id !== id));
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, kyc: "rejected" as const } : m)),
    );
  };

  const handleAddProgram = (newP: SavingsProgram) => {
    setSavingsPrograms((prev) => [newP, ...prev]);
  };

  const handleAddProduct = (newPr: Product) => {
    setProducts((prev) => [newPr, ...prev]);
  };

  const handleOpenEditProduct = (p: Product) => {
    setSelectedProduct(p);
    setEditProductForm({
      ...p,
      specs:
        p.specs && p.specs.length > 0
          ? [...p.specs]
          : [
              "Official 1-Year Warranty",
              "Express Hub Pickup in Lagos/Abuja",
              "Eligible for 50% down installment plan",
            ],
    });
    setProductModalTab("edit");
    setIsEditProductSaved(false);
  };

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductForm) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === editProductForm.id ? editProductForm : p)),
    );
    setSelectedProduct(editProductForm);
    setIsEditProductSaved(true);
    setTimeout(() => setIsEditProductSaved(false), 2500);
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete) return;
    setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
    if (selectedProduct?.id === productToDelete.id) {
      setSelectedProduct(null);
      setEditProductForm(null);
    }
    setProductToDelete(null);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (selectedProduct?.id === id) {
      setSelectedProduct(null);
      setEditProductForm(null);
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
    );
    setShowNotificationDropdown(false);
    nav(notif.actionSection);
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;
    setMembers((prev) => [
      {
        id: String(Date.now()),
        name: inviteName,
        email: inviteEmail,
        phone: "+234 800 000 0000",
        kyc: "pending" as const,
        joined: "Just now",
        wallet: 0,
        savings: 0,
        status: "pending" as const,
        group: "Community Thrift",
        accountNumber: `99283746${Math.floor(10 + Math.random() * 90)}`,
        bankName: "PAVE Virtual Bank / Providus",
        tier: "Tier 1 - Unverified",
      },
      ...prev,
    ]);
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setShowInviteModal(false);
      setInviteName("");
      setInviteEmail("");
    }, 1500);
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
            onUpdateMember={(id, updates) => {
              setMembers((prev) =>
                prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
              );
            }}
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
            programs={savingsPrograms}
            onAddProgram={handleAddProgram}
          />
        );
      case "wallets":
        return (
          <WalletsSection
            members={members}
            onSelectMember={(m) => setSelectedWalletMember(m)}
          />
        );
      case "transactions":
        return <AdminTransactionsSection />;
      case "marketplace":
      case "product-form":
        return (
          <MarketplaceSection
            products={products}
            onAddProduct={handleAddProduct}
            onDeleteProduct={(p) => setProductToDelete(p)}
            onSelectProduct={handleOpenEditProduct}
          />
        );
      case "messaging":
      case "broadcast":
        return <MessagingSection />;
      case "reports":
        return <ReportsSection />;
      case "settings":
        return <SettingsSection />;
      case "notifications":
        return (
          <div>
            <PageHeader
              title="Notifications"
              subtitle="All system updates, member alerts and operational notices"
              action={
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="px-4 py-2 bg-[#EEF2FF] dark:bg-[#818CF8]/20 text-[#3730A3] dark:text-[#818CF8] rounded-xl text-xs font-semibold flex items-center gap-2 hover:opacity-90"
                >
                  <CheckCheck size={14} />
                  Mark all as read
                </button>
              }
            />
            <div className="bg-white dark:bg-[#111327] rounded-2xl border border-[#F1F3FB] dark:border-white/10 divide-y divide-[#F9FAFB] dark:divide-white/5 overflow-hidden shadow-sm">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-[#F9FAFB] dark:hover:bg-white/5 cursor-pointer transition-colors ${
                    !n.read ? "bg-[#EEF2FF]/40 dark:bg-[#818CF8]/5" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] dark:bg-[#818CF8]/20 text-[#3730A3] dark:text-[#818CF8] flex items-center justify-center flex-shrink-0">
                    <Bell size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-[#0D0F1C] dark:text-[#F0F2FF]">
                        {n.title}
                      </span>
                      <span className="text-xs text-[#9CA3AF] flex-shrink-0">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
                      {n.description}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-[#3730A3] flex-shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
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
      className={`${isDark ? "dark" : ""} fixed inset-0 flex h-screen w-screen overflow-hidden bg-[#F7F8FF] dark:bg-[#0A0B18] text-[#0D0F1C] dark:text-[#F0F2FF]`}
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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
                  placeholder="Search members, transactions, products..."
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
                                  {fmt(m.wallet)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.products.length > 0 && (
                          <div className="p-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] px-3 py-1">
                              Marketplace Products (
                              {searchResults.products.length})
                            </div>
                            {searchResults.products.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  handleOpenEditProduct(p);
                                  setIsSearchFocused(false);
                                  setSearchQuery("");
                                  nav("marketplace");
                                }}
                                className="w-full px-3 py-2 rounded-xl flex items-center justify-between hover:bg-[#F9FAFB] dark:hover:bg-white/5 text-left transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <ImageWithFallback
                                    src={p.image}
                                    alt={p.name}
                                    className="w-7 h-7 rounded-lg object-cover"
                                  />
                                  <div>
                                    <div className="text-sm font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                                      {p.name}
                                    </div>
                                    <div className="text-xs text-[#9CA3AF]">
                                      {p.category} · Stock: {p.stock}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-[#3730A3] dark:text-[#818CF8]">
                                  {fmt(p.price)}
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

            {/* Notification Bell with Dropdown UI */}
            <div ref={notifContainerRef} className="relative">
              <button
                onClick={() =>
                  setShowNotificationDropdown(!showNotificationDropdown)
                }
                className="relative w-9 h-9 rounded-xl bg-[#F1F3FB] dark:bg-white/5 flex items-center justify-center hover:bg-[#EEF2FF] dark:hover:bg-white/10 transition-colors"
                title="Notifications"
              >
                <Bell
                  size={17}
                  className="text-[#374151] dark:text-[#F0F2FF]"
                />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#DC2626] rounded-full border-2 border-white dark:border-[#0D0F20]" />
                )}
              </button>

              <AnimatePresence>
                {showNotificationDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#111327] rounded-2xl shadow-2xl border border-[#F1F3FB] dark:border-white/10 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-[#F1F3FB] dark:border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0D0F1C] dark:text-[#F0F2FF]">
                          Notifications
                        </span>
                        {unreadNotifCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#3730A3] text-white text-[11px] font-bold">
                            {unreadNotifCount} new
                          </span>
                        )}
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={handleMarkAllNotificationsRead}
                          className="text-xs text-[#3730A3] dark:text-[#818CF8] font-semibold hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-[#F9FAFB] dark:divide-white/5">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 flex items-start gap-3 hover:bg-[#F9FAFB] dark:hover:bg-white/5 cursor-pointer transition-colors ${
                            !n.read ? "bg-[#EEF2FF]/30 dark:bg-[#818CF8]/5" : ""
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-[#818CF8]/20 text-[#3730A3] dark:text-[#818CF8] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {n.category === "kyc" && <Shield size={15} />}
                            {n.category === "savings" && (
                              <PiggyBank size={15} />
                            )}
                            {n.category === "marketplace" && (
                              <ShoppingBag size={15} />
                            )}
                            {n.category === "wallet" && <Wallet size={15} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                                {n.title}
                              </span>
                              <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">
                                {n.time}
                              </span>
                            </div>
                            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5 leading-snug">
                              {n.description}
                            </p>
                          </div>
                          {!n.read && (
                            <div className="w-2 h-2 rounded-full bg-[#3730A3] flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-2.5 border-t border-[#F1F3FB] dark:border-white/10 text-center bg-[#F9FAFB] dark:bg-white/5">
                      <button
                        onClick={() => {
                          setShowNotificationDropdown(false);
                          nav("notifications");
                        }}
                        className="text-xs font-semibold text-[#3730A3] dark:text-[#818CF8] hover:underline"
                      >
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar Initials */}
            <div
              className="w-9 h-9 rounded-full bg-[#3730A3] flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
              title="Admin Benjamin Okonkwo"
              onClick={() => nav("settings")}
            >
              BO
            </div>
          </div>
        </header>

        {/* Scrollable Page Body: Locked window scroll with clean interior scrolling */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8 overscroll-contain">
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
      <AnimatePresence>
        {selectedProduct && editProductForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#111327] rounded-3xl p-6 sm:p-7 w-full max-w-2xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F3FB] dark:border-white/10 mb-5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="text-lg font-bold text-[#0D0F1C] dark:text-[#F0F2FF]"
                    style={{
                      fontFamily:
                        "var(--font-family-display, 'Bricolage Grotesque')",
                    }}
                  >
                    Edit Product
                  </span>
                  <Badge color="gray">{editProductForm.category}</Badge>
                  <Badge
                    color={
                      editProductForm.status === "active" ? "green" : "red"
                    }
                  >
                    {editProductForm.status === "active"
                      ? "In Stock"
                      : "Out of Stock"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mode Switcher */}
                  <div className="bg-[#F1F3FB] dark:bg-white/5 p-1 rounded-xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setProductModalTab("edit")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        productModalTab === "edit"
                          ? "bg-white dark:bg-[#3730A3] text-[#3730A3] dark:text-white shadow-sm"
                          : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0D0F1C]"
                      }`}
                    >
                      <Edit2 size={13} />
                      Edit Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab("preview")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        productModalTab === "preview"
                          ? "bg-white dark:bg-[#3730A3] text-[#3730A3] dark:text-white shadow-sm"
                          : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0D0F1C]"
                      }`}
                    >
                      <Eye size={13} />
                      Preview
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="w-8 h-8 rounded-full bg-[#F1F3FB] dark:bg-white/5 flex items-center justify-center text-[#9CA3AF] hover:text-foreground transition-colors ml-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Edit Mode View */}
              {productModalTab === "edit" ? (
                <form onSubmit={handleSaveProductEdit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Product Name */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                        Product Name *
                      </label>
                      <input
                        value={editProductForm.name}
                        onChange={(e) =>
                          setEditProductForm({
                            ...editProductForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g. Samsung Galaxy S25 Ultra"
                        required
                        className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                        Category
                      </label>
                      <select
                        value={editProductForm.category}
                        onChange={(e) =>
                          setEditProductForm({
                            ...editProductForm,
                            category: e.target.value,
                          })
                        }
                        className="w-full bg-[#F1F3FB] dark:bg-[#1E2140] rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                      >
                        {[
                          "Electronics",
                          "Fashion",
                          "Home",
                          "Kitchen",
                          "Appliances",
                          "Gadgets",
                        ].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                        Retail Price (₦) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editProductForm.price}
                        onChange={(e) =>
                          setEditProductForm({
                            ...editProductForm,
                            price: Number(e.target.value) || 0,
                          })
                        }
                        required
                        className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                      />
                    </div>

                    {/* Stock */}
                    <div>
                      <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editProductForm.stock}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setEditProductForm({
                            ...editProductForm,
                            stock: val,
                            status: val > 0 ? "active" : "out_of_stock",
                          });
                        }}
                        required
                        className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                        Availability Status
                      </label>
                      <select
                        value={editProductForm.status}
                        onChange={(e) =>
                          setEditProductForm({
                            ...editProductForm,
                            status: e.target.value as "active" | "out_of_stock",
                          })
                        }
                        className="w-full bg-[#F1F3FB] dark:bg-[#1E2140] rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                      >
                        <option value="active">Active (In Stock)</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>

                    {/* Image URL */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                        Product Image URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={editProductForm.image}
                          onChange={(e) =>
                            setEditProductForm({
                              ...editProductForm,
                              image: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="flex-1 bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                        />
                        <ImageWithFallback
                          src={editProductForm.image}
                          alt="preview"
                          className="w-10 h-10 rounded-xl object-cover border border-[#E5E7EB] dark:border-white/10 flex-shrink-0"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                        Product Description
                      </label>
                      <textarea
                        rows={3}
                        value={editProductForm.description || ""}
                        onChange={(e) =>
                          setEditProductForm({
                            ...editProductForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Detailed description of features, warranty, and specifications..."
                        className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#3730A3] resize-none text-[#0D0F1C] dark:text-[#F0F2FF]"
                      />
                    </div>

                    {/* Specifications (One per line) */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                        Key Specifications (Enter each spec on a new line)
                      </label>
                      <textarea
                        rows={3}
                        value={(editProductForm.specs || []).join("\n")}
                        onChange={(e) =>
                          setEditProductForm({
                            ...editProductForm,
                            specs: e.target.value
                              .split("\n")
                              .filter((s) => s.trim().length > 0),
                          })
                        }
                        placeholder="1 Year Warranty&#10;5000mAh Battery&#10;Express Delivery"
                        className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#3730A3] resize-none text-[#0D0F1C] dark:text-[#F0F2FF]"
                      />
                    </div>
                  </div>

                  {/* Dynamic Pricing Calculation Preview */}
                  <div className="bg-[#EEF2FF] dark:bg-[#818CF8]/10 rounded-2xl p-4 mt-2">
                    <div className="text-xs text-[#3730A3] dark:text-[#818CF8] font-semibold uppercase tracking-wider">
                      Auto-Calculated Installment Breakdown
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#3730A3]/10 text-xs">
                      <div>
                        <span className="text-[#6B7280] block">
                          50% Down Payment:
                        </span>
                        <span className="font-bold text-[#7C3AED] text-sm">
                          {fmt(editProductForm.price * 0.5)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block">
                          3-Month Plan:
                        </span>
                        <span className="font-bold text-[#0D0F1C] dark:text-white text-sm">
                          {fmt(Math.round((editProductForm.price * 0.5) / 3))}
                          /mo
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block">
                          6-Month Plan:
                        </span>
                        <span className="font-bold text-[#0D0F1C] dark:text-white text-sm">
                          {fmt(Math.round((editProductForm.price * 0.5) / 6))}
                          /mo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Footer Action Buttons */}
                  <div className="pt-3 border-t border-[#F1F3FB] dark:border-white/10 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setProductToDelete(editProductForm)}
                      className="px-4 py-2.5 bg-[#FEF2F2] dark:bg-[#EF4444]/20 hover:bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      Delete Product
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(null)}
                        className="px-4 py-2.5 border border-[#E5E7EB] dark:border-white/10 rounded-xl text-xs font-semibold text-[#374151] dark:text-gray-300 hover:bg-[#F9FAFB] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        {isEditProductSaved ? (
                          <>
                            <Check size={15} />
                            Saved Successfully!
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* Member Preview Mode */
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <ImageWithFallback
                        src={editProductForm.image}
                        alt={editProductForm.name}
                        className="w-full aspect-square rounded-2xl object-cover bg-[#F1F3FB] dark:bg-white/5 border border-[#F1F3FB] dark:border-white/10"
                      />
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-[#F9FAFB] dark:bg-white/5 p-3 rounded-xl text-center">
                          <div className="text-xs text-[#9CA3AF]">
                            Stock Level
                          </div>
                          <div className="text-lg font-bold text-[#0D0F1C] dark:text-[#F0F2FF] mt-0.5">
                            {editProductForm.stock} units
                          </div>
                        </div>
                        <div className="bg-[#F9FAFB] dark:bg-white/5 p-3 rounded-xl text-center">
                          <div className="text-xs text-[#9CA3AF]">
                            Total Sales
                          </div>
                          <div className="text-lg font-bold text-[#059669] mt-0.5">
                            {editProductForm.sales} sold
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <h2
                        className="text-xl sm:text-2xl font-bold text-[#0D0F1C] dark:text-[#F0F2FF] mb-2"
                        style={{
                          fontFamily:
                            "var(--font-family-display, 'Bricolage Grotesque')",
                        }}
                      >
                        {editProductForm.name}
                      </h2>

                      <div className="bg-[#EEF2FF] dark:bg-[#818CF8]/10 rounded-2xl p-4 my-3">
                        <div className="text-xs text-[#3730A3] dark:text-[#818CF8] font-semibold uppercase tracking-wider">
                          Pricing & Installments
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span
                            className="text-2xl font-black text-[#3730A3] dark:text-[#818CF8]"
                            style={{ fontFamily: "var(--font-family-display)" }}
                          >
                            {fmt(editProductForm.price)}
                          </span>
                          <span className="text-xs text-[#6B7280]">
                            retail price
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#3730A3]/10 text-xs flex justify-between">
                          <span className="text-[#374151] dark:text-gray-300 font-medium">
                            50% Down Payment:
                          </span>
                          <span className="font-bold text-[#7C3AED]">
                            {fmt(editProductForm.price * 0.5)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs flex justify-between">
                          <span className="text-[#374151] dark:text-gray-300 font-medium">
                            3-Month Monthly:
                          </span>
                          <span className="font-semibold text-[#0D0F1C] dark:text-white">
                            {fmt(Math.round((editProductForm.price * 0.5) / 3))}
                            /mo
                          </span>
                        </div>
                        <div className="mt-1 text-xs flex justify-between">
                          <span className="text-[#374151] dark:text-gray-300 font-medium">
                            6-Month Monthly:
                          </span>
                          <span className="font-semibold text-[#0D0F1C] dark:text-white">
                            {fmt(Math.round((editProductForm.price * 0.5) / 6))}
                            /mo
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8] leading-relaxed mb-4">
                        {editProductForm.description ||
                          "Top rated electronic and consumer device eligible for automated PAVE thrift installment plans."}
                      </p>

                      <div className="space-y-2 mb-6">
                        <div className="text-xs font-bold uppercase text-[#9CA3AF] tracking-wider">
                          Specifications
                        </div>
                        {(
                          editProductForm.specs || [
                            "Official 1-Year Warranty",
                            "Free hub delivery in Lagos/Abuja",
                          ]
                        ).map((sp, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs text-[#374151] dark:text-gray-300"
                          >
                            <Check size={14} className="text-[#059669]" />
                            <span>{sp}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto flex gap-3">
                        <button
                          type="button"
                          onClick={() => setProductModalTab("edit")}
                          className="flex-1 py-2.5 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Edit2 size={13} />
                          Edit These Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductToDelete(editProductForm)}
                          className="px-4 py-2.5 bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#DC2626] rounded-xl text-xs font-semibold hover:bg-[#FEE2E2] transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Product Warning Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setProductToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#111327] rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl border border-white/10"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] dark:bg-[#EF4444]/20 flex items-center justify-center mx-auto mb-4 text-[#DC2626]">
                <AlertTriangle size={30} />
              </div>

              <h3
                style={{
                  fontFamily:
                    "var(--font-family-display, 'Bricolage Grotesque')",
                  fontWeight: 700,
                  fontSize: 20,
                }}
                className="text-center text-[#0D0F1C] dark:text-[#F0F2FF]"
              >
                Delete Product?
              </h3>

              <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm text-center mt-2 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                  "{productToDelete.name}"
                </span>
                ? This will permanently remove the item from the marketplace
                catalog and cannot be undone.
              </p>

              {/* Product Mini Preview Card */}
              <div className="flex items-center gap-3 bg-[#F9FAFB] dark:bg-white/5 rounded-2xl p-3.5 mt-5 border border-[#F1F3FB] dark:border-white/10">
                <ImageWithFallback
                  src={productToDelete.image}
                  alt={productToDelete.name}
                  className="w-12 h-12 rounded-xl object-cover bg-white dark:bg-white/10 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#0D0F1C] dark:text-[#F0F2FF] truncate">
                    {productToDelete.name}
                  </div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">
                    {productToDelete.category} · Stock: {productToDelete.stock}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-[#3730A3] dark:text-[#818CF8]">
                    {fmt(productToDelete.price)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-2.5 border-2 border-[#E5E7EB] dark:border-white/10 rounded-xl text-sm font-semibold hover:bg-[#F9FAFB] dark:hover:bg-white/5 text-[#374151] dark:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteProduct}
                  className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Trash2 size={16} />
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Wallet Ledger & Account Detail Modal */}
      <AnimatePresence>
        {selectedWalletMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedWalletMember(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#111327] rounded-3xl p-6 sm:p-7 w-full max-w-2xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F3FB] dark:border-white/10 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] dark:bg-[#818CF8]/20 flex items-center justify-center text-[#3730A3] dark:text-[#818CF8] text-lg font-bold">
                    {selectedWalletMember.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h2
                      className="text-lg font-bold text-[#0D0F1C] dark:text-[#F0F2FF]"
                      style={{
                        fontFamily:
                          "var(--font-family-display, 'Bricolage Grotesque')",
                      }}
                    >
                      {userDetailsQuery.data?.fullName || selectedWalletMember.name}
                    </h2>
                    <p className="text-xs text-[#9CA3AF]">
                      {userDetailsQuery.data?.email || selectedWalletMember.email} ·{" "}
                      {userDetailsQuery.data?.phone || selectedWalletMember.phone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWalletMember(null)}
                  className="w-8 h-8 rounded-full bg-[#F1F3FB] dark:bg-white/5 flex items-center justify-center text-[#9CA3AF] hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Account Card */}
              <div className="bg-gradient-to-r from-[#1E1B4B] to-[#3730A3] text-white rounded-2xl p-5 shadow-lg mb-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">
                      Virtual NGN Account
                    </span>
                    <div className="text-2xl font-bold tracking-tight font-display mt-0.5">
                      {fmt(userDetailsQuery.data?.balance ?? selectedWalletMember.wallet)}
                    </div>
                  </div>
                  <Badge
                    color={
                      userDetailsQuery.data?.isBlocked ||
                      userDetailsQuery.data?.status.toLowerCase() === "blocked"
                        ? "red"
                        : "green"
                    }
                  >
                    {userDetailsQuery.data?.status || "Loading status..."}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-white/15 text-xs">
                  <div>
                    <div className="text-white/60 text-[11px]">
                      Account Number
                    </div>
                    <div className="font-semibold tracking-wider">
                      {userDetailsQuery.data?.accountNumber ||
                        selectedWalletMember.accountNumber ||
                        "Not provided"}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 text-[11px]">
                      Account Name
                    </div>
                    <div className="font-semibold truncate">
                      {userDetailsQuery.data?.accountName || "Not provided"}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 text-[11px]">
                      Account Tier
                    </div>
                    <div className="font-semibold">
                      {selectedWalletMember.tier || "Tier 3 - Verified"}
                    </div>
                  </div>
                </div>
              </div>

              {userDetailsQuery.isLoading && (
                <p className="mb-4 text-sm text-[#9CA3AF]">
                  Loading user details...
                </p>
              )}
              {userDetailsQuery.isError && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                >
                  {userDetailsQuery.error instanceof Error
                    ? userDetailsQuery.error.message
                    : "Unable to load user details"}
                  <button
                    onClick={() => void userDetailsQuery.refetch()}
                    className="ml-3 font-semibold underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              {userDetailsQuery.data && (
                <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl bg-[#F9FAFB] p-4 text-sm dark:bg-white/5 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-[#9CA3AF]">Address</div>
                    <div className="mt-1 font-medium text-[#374151] dark:text-gray-200">
                      {userDetailsQuery.data.address || "Not provided"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9CA3AF]">Signed up</div>
                    <div className="mt-1 font-medium text-[#374151] dark:text-gray-200">
                      {new Date(userDetailsQuery.data.signUpOn).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9CA3AF]">Last login</div>
                    <div className="mt-1 font-medium text-[#374151] dark:text-gray-200">
                      {userDetailsQuery.data.lastLogin
                        ? new Date(userDetailsQuery.data.lastLogin).toLocaleString()
                        : "Not available"}
                    </div>
                  </div>
                </div>
              )}
              {userDetailsQuery.data && (
                <div className="mb-5">
                  {userDetailsQuery.data.isBlocked ||
                  userDetailsQuery.data.status.toLowerCase() === "blocked" ? (
                    <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
                      This user is blocked.
                    </div>
                  ) : (
                    <button
                      onClick={() => void handleBlockUser()}
                      disabled={blockUserMutation.isPending}
                      className="rounded-xl bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {blockUserMutation.isPending
                        ? "Updating..."
                        : "Block User"}
                    </button>
                  )}
                </div>
              )}

              {/* Transaction Ledger */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-sm font-bold text-[#0D0F1C] dark:text-[#F0F2FF]"
                    style={{ fontFamily: "var(--font-family-display)" }}
                  >
                    Recent Ledger Activity
                  </h3>
                  <span className="text-xs text-[#9CA3AF]">
                    {userTransactionsQuery.data?.length ?? 0} transactions
                  </span>
                </div>
                <div className="space-y-2">
                  {userTransactionsQuery.isLoading ? (
                    <p className="py-4 text-center text-sm text-[#9CA3AF]">
                      Loading user transactions...
                    </p>
                  ) : userTransactionsQuery.isError ? (
                    <div
                      role="alert"
                      className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
                    >
                      {userTransactionsQuery.error instanceof Error
                        ? userTransactionsQuery.error.message
                        : "Unable to load user transactions"}
                      <button
                        onClick={() => void userTransactionsQuery.refetch()}
                        className="ml-3 font-semibold underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : userTransactionsQuery.data?.length ? (
                    userTransactionsQuery.data.map((tx) => {
                      const isCredit =
                        tx.type?.toLowerCase().includes("credit") ?? false;

                      return (
                        <div
                          key={tx._id}
                          className="flex items-center justify-between rounded-xl bg-[#F9FAFB] p-3 text-xs dark:bg-white/5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${isCredit ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"}`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft size={16} />
                              ) : (
                                <ArrowUpRight size={16} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                                {tx.description || tx.type || "Transaction"}
                              </div>
                              <div className="truncate text-[10px] text-[#9CA3AF]">
                                {new Date(tx.createdAt).toLocaleString()} ·{" "}
                                {tx.reference}
                              </div>
                              <div className="text-[10px] text-[#9CA3AF]">
                                Status: {tx.status}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`ml-3 flex-shrink-0 font-bold ${isCredit ? "text-[#059669]" : "text-[#DC2626]"}`}
                          >
                            {fmt(tx.amount)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="py-4 text-center text-sm text-[#9CA3AF]">
                      No transactions found for this user.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[#F1F3FB] dark:border-white/10">
                <button
                  onClick={() => {
                    const addAmount = 50000;
                    setMembers((prev) =>
                      prev.map((m) =>
                        m.id === selectedWalletMember.id
                          ? { ...m, wallet: m.wallet + addAmount }
                          : m,
                      ),
                    );
                    setSelectedWalletMember((prev) =>
                      prev
                        ? { ...prev, wallet: prev.wallet + addAmount }
                        : null,
                    );
                  }}
                  className="flex-1 py-2.5 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  Manual Credit (+₦50,000)
                </button>
                <button
                  onClick={() => {
                    alert(
                      `Statement exported for ${selectedWalletMember.name}`,
                    );
                  }}
                  className="flex-1 py-2.5 bg-[#F1F3FB] dark:bg-white/5 hover:bg-[#EEF2FF] text-[#374151] dark:text-gray-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download size={14} />
                  Download PDF Statement
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.form
              onSubmit={handleInviteSubmit}
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

              {!inviteSent ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                      Full Name
                    </label>
                    <input
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. Kenneth Igwe"
                      required
                      className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. kenneth@example.com"
                      required
                      className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] text-[#0D0F1C] dark:text-[#F0F2FF]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#374151] dark:text-gray-300 block mb-1.5">
                      Assigned Group
                    </label>
                    <select className="w-full bg-[#F1F3FB] dark:bg-[#1E2140] rounded-xl px-4 py-3 text-sm outline-none text-[#0D0F1C] dark:text-[#F0F2FF]">
                      <option>Community Thrift Group</option>
                      <option>Staff Cooperative</option>
                      <option>VIP Investors Club</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1 py-2.5 border-2 border-[#E5E7EB] dark:border-white/10 rounded-xl text-sm font-medium hover:bg-[#F9FAFB] text-[#374151] dark:text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                    >
                      Send Invitation
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 bg-[#ECFDF5] rounded-full flex items-center justify-center">
                    <CheckCircle size={32} className="text-[#059669]" />
                  </div>
                  <div className="font-bold text-lg text-[#0D0F1C] dark:text-[#F0F2FF]">
                    Invitation Sent!
                  </div>
                  <p className="text-xs text-[#9CA3AF]">
                    The member has been invited to complete registration and
                    KYC.
                  </p>
                </div>
              )}
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminApp;
