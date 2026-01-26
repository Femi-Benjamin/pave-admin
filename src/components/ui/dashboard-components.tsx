// PAVE Admin - Reusable UI Components

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function KPICard({ title, value, subtitle, icon: Icon, variant = 'primary', trend }: KPICardProps) {
  const iconClasses = {
    primary: 'kpi-card-icon-primary',
    success: 'kpi-card-icon-success',
    warning: 'kpi-card-icon-warning',
    info: 'kpi-card-icon-info',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="kpi-card"
    >
      <div className="flex items-start justify-between">
        <div className={iconClasses[variant]}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              trend.isPositive ? 'bg-success-light text-success' : 'bg-destructive/10 text-destructive'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-foreground">{value}</h3>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

// Status Badge Component
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'pending' | 'error' | 'info';
  children: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const classes = {
    success: 'status-badge-success',
    warning: 'status-badge-warning',
    pending: 'status-badge-pending',
    error: 'status-badge-error',
    info: 'status-badge-info',
  };

  return <span className={classes[status]}>{children}</span>;
}

// Dashboard Card Component
interface DashboardCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({ title, action, children, className }: DashboardCardProps) {
  return (
    <div className={cn('dashboard-card', className)}>
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">{title}</h3>
        {action}
      </div>
      <div className="dashboard-card-body">{children}</div>
    </div>
  );
}

// Skeleton Loader Component
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

// Loading Card Skeleton
export function LoadingCardSkeleton() {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="w-24 h-8" />
        <Skeleton className="w-32 h-4" />
      </div>
    </div>
  );
}

// Loading Table Skeleton
export function LoadingTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="w-32 h-8" />
        <Skeleton className="w-32 h-8" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="w-full h-16" />
        ))}
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon className="empty-state-icon" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Page Header Component
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Data Table Wrapper
interface DataTableWrapperProps {
  children: React.ReactNode;
}

export function DataTableWrapper({ children }: DataTableWrapperProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="data-table">{children}</table>
    </div>
  );
}

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
