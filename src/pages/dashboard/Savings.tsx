// PAVE Admin - Savings Page

import { useState, useEffect } from 'react';
import { savingsService } from '@/services/api';
import { SavingsPlan } from '@/types';
import { formatCurrency, formatDate, getUserById } from '@/data/mockData';
import {
  PageHeader,
  StatusBadge,
  DataTableWrapper,
  Pagination,
  LoadingTableSkeleton,
  EmptyState,
} from '@/components/ui/dashboard-components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PiggyBank, Eye, Target, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function SavingsPage() {
  const [savingsPlans, setSavingsPlans] = useState<SavingsPlan[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SavingsPlan | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        const response = await savingsService.getSavingsPlans(currentPage, 10);
        if (response.success && response.data) {
          setSavingsPlans(response.data.data);
          setTotalPages(response.data.totalPages);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [currentPage]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <StatusBadge status="success">Active</StatusBadge>;
      case 'completed':
        return <StatusBadge status="info">Completed</StatusBadge>;
      case 'withdrawn':
        return <StatusBadge status="warning">Withdrawn</StatusBadge>;
      case 'cancelled':
        return <StatusBadge status="error">Cancelled</StatusBadge>;
      default:
        return <StatusBadge status="pending">{status}</StatusBadge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'flexible':
        return <StatusBadge status="info">Flexible</StatusBadge>;
      case 'fixed':
        return <StatusBadge status="pending">Fixed</StatusBadge>;
      default:
        return <StatusBadge status="pending">{type}</StatusBadge>;
    }
  };

  const getProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Plans"
        subtitle="View all user savings plans and their progress"
      />

      {/* Table */}
      {isLoading ? (
        <LoadingTableSkeleton rows={5} />
      ) : savingsPlans.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No savings plans found"
          description="There are no savings plans to display."
        />
      ) : (
        <DataTableWrapper>
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>User</th>
              <th>Type</th>
              <th>Progress</th>
              <th>Penalty</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {savingsPlans.map((plan) => {
              const user = getUserById(plan.userId);
              const progress = getProgress(plan.currentAmount, plan.targetAmount);
              return (
                <tr key={plan.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success-light flex items-center justify-center">
                        <PiggyBank className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Target: {formatCurrency(plan.targetAmount)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <img
                        src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.fullName}`}
                        alt={user?.fullName}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm">{user?.fullName}</span>
                    </div>
                  </td>
                  <td>{getTypeBadge(plan.type)}</td>
                  <td>
                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{formatCurrency(plan.currentAmount)}</span>
                        <span className="text-muted-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </td>
                  <td>
                    {plan.earlyWithdrawalPenaltyPct > 0 ? (
                      <span className="text-destructive font-medium">
                        {plan.earlyWithdrawalPenaltyPct}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </td>
                  <td>{getStatusBadge(plan.status)}</td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTableWrapper>
      )}

      {/* Pagination */}
      {!isLoading && savingsPlans.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Plan Detail Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="max-w-md">
          {selectedPlan && (() => {
            const user = getUserById(selectedPlan.userId);
            const progress = getProgress(selectedPlan.currentAmount, selectedPlan.targetAmount);
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedPlan.name}</DialogTitle>
                  <DialogDescription>
                    Savings plan details
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Progress */}
                  <div className="text-center p-6 rounded-xl bg-success-light">
                    <TrendingUp className="w-10 h-10 text-success mx-auto mb-2" />
                    <p className="text-3xl font-bold text-success">
                      {formatCurrency(selectedPlan.currentAmount)}
                    </p>
                    <p className="text-sm text-success/80 mt-1">
                      of {formatCurrency(selectedPlan.targetAmount)} target
                    </p>
                    <div className="mt-4">
                      <Progress value={progress} className="h-3" />
                      <p className="text-sm text-success/80 mt-2">{progress}% complete</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Owner</span>
                      <span className="font-medium">{user?.fullName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="capitalize font-medium">{selectedPlan.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Start Date</span>
                      <span>{formatDate(selectedPlan.startDate)}</span>
                    </div>
                    {selectedPlan.endDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">End Date</span>
                        <span>{formatDate(selectedPlan.endDate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      {getStatusBadge(selectedPlan.status)}
                    </div>
                  </div>

                  {/* Penalty Warning */}
                  {selectedPlan.earlyWithdrawalPenaltyPct > 0 && (
                    <div className="p-4 rounded-lg bg-warning-light border border-warning/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-warning">Early Withdrawal Penalty</p>
                          <p className="text-sm text-warning/80 mt-1">
                            {selectedPlan.earlyWithdrawalPenaltyPct}% penalty applies for early withdrawal
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
