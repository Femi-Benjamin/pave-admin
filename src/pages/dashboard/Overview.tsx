// PAVE Admin - Dashboard Overview Page

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { dashboardService, kycService, transactionService } from '@/services/api';
import {
  KPICard,
  DashboardCard,
  LoadingCardSkeleton,
  StatusBadge,
  PageHeader,
} from '@/components/ui/dashboard-components';
import { DashboardKPIs, ChartDataPoint, KYCSubmission, Transaction } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';
import {
  Users,
  UserCheck,
  ArrowLeftRight,
  PiggyBank,
  Target,
  FileCheck,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function DashboardOverview() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [transactionData, setTransactionData] = useState<ChartDataPoint[]>([]);
  const [savingsData, setSavingsData] = useState<ChartDataPoint[]>([]);
  const [recentKYC, setRecentKYC] = useState<KYCSubmission[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [kpiRes, txnChartRes, savingsChartRes, kycRes, txnRes] = await Promise.all([
          dashboardService.getKPIs(),
          dashboardService.getTransactionVolumeChart(),
          dashboardService.getSavingsVolumeChart(),
          kycService.getSubmissions('pending', 1, 3),
          transactionService.getTransactions(1, 5),
        ]);

        if (kpiRes.success && kpiRes.data) setKpis(kpiRes.data);
        if (txnChartRes.success && txnChartRes.data) setTransactionData(txnChartRes.data);
        if (savingsChartRes.success && savingsChartRes.data) setSavingsData(savingsChartRes.data);
        if (kycRes.success && kycRes.data) setRecentKYC(kycRes.data.data);
        if (txnRes.success && txnRes.data) setRecentTransactions(txnRes.data.data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getKYCStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <StatusBadge status="success">Approved</StatusBadge>;
      case 'rejected':
        return <StatusBadge status="error">Rejected</StatusBadge>;
      default:
        return <StatusBadge status="pending">Pending</StatusBadge>;
    }
  };

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <StatusBadge status="success">Completed</StatusBadge>;
      case 'failed':
        return <StatusBadge status="error">Failed</StatusBadge>;
      case 'reversed':
        return <StatusBadge status="warning">Reversed</StatusBadge>;
      default:
        return <StatusBadge status="pending">Pending</StatusBadge>;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Welcome back! Here's what's happening with PAVE today."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <LoadingCardSkeleton key={i} />)
        ) : (
          <>
            <KPICard
              icon={Users}
              title="Total Users"
              value={kpis?.totalUsers?.toLocaleString() || '0'}
              variant="primary"
              trend={{ value: 12, isPositive: true }}
            />
            <KPICard
              icon={UserCheck}
              title="Active Users"
              value={kpis?.activeUsers?.toLocaleString() || '0'}
              subtitle="Last 30 days"
              variant="success"
            />
            <KPICard
              icon={ArrowLeftRight}
              title="Transaction Volume"
              value={formatCurrency(kpis?.totalTransactionVolume || 0)}
              variant="info"
              trend={{ value: 8, isPositive: true }}
            />
            <KPICard
              icon={PiggyBank}
              title="Savings Volume"
              value={formatCurrency(kpis?.savingsVolume || 0)}
              variant="success"
            />
            <KPICard
              icon={Target}
              title="Thrift Completion"
              value={`${kpis?.thriftCompletionRate || 0}%`}
              variant="primary"
            />
            <KPICard
              icon={FileCheck}
              title="Pending KYC"
              value={kpis?.pendingKYC || 0}
              variant="warning"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Transaction Volume"
          action={
            <Link to="/dashboard/transactions" className="text-sm text-primary hover:underline">
              View all
            </Link>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={transactionData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(220, 9%, 46%)"
                  tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Volume']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(262, 83%, 58%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Savings Growth"
          action={
            <Link to="/dashboard/savings" className="text-sm text-primary hover:underline">
              View all
            </Link>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={savingsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(220, 9%, 46%)"
                  tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Savings']}
                />
                <Bar dataKey="value" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending KYC */}
        <DashboardCard
          title="Pending KYC Submissions"
          action={
            <Link to="/dashboard/kyc" className="text-sm text-primary hover:underline">
              Review all
            </Link>
          }
        >
          <div className="space-y-4">
            {recentKYC.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No pending KYC submissions
              </p>
            ) : (
              recentKYC.map((kyc) => {
                return (
                  <motion.div
                    key={kyc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-sm">User {kyc.userId}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(kyc.submittedAt)}
                        </p>
                      </div>
                    </div>
                    {getKYCStatusBadge(kyc.status)}
                  </motion.div>
                );
              })
            )}
          </div>
        </DashboardCard>

        {/* Recent Transactions */}
        <DashboardCard
          title="Recent Transactions"
          action={
            <Link to="/dashboard/transactions" className="text-sm text-primary hover:underline">
              View all
            </Link>
          }
        >
          <div className="space-y-4">
            {recentTransactions.map((txn) => {
              return (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === 'deposit'
                          ? 'bg-success-light text-success'
                          : txn.type === 'withdrawal'
                          ? 'bg-warning-light text-warning'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {txn.type === 'deposit' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <ArrowLeftRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm capitalize">{txn.type}</p>
                      <p className="text-xs text-muted-foreground">User {txn.userId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(txn.amount)}</p>
                    {getTransactionStatusBadge(txn.status)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
