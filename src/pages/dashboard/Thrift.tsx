// PAVE Admin - Thrift Plans Page

import { useState, useEffect } from 'react';
import { thriftService } from '@/services/api';
import { ThriftPlan } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
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
import { UsersRound, Eye, Users, Calendar, AlertTriangle, Clock, Check, X } from 'lucide-react';

function ContributionCalendar({ plan }: { plan: ThriftPlan }) {
  return (
    <p className="text-sm text-muted-foreground">
      Contribution history is not included in the documented thrift API.
    </p>
  );
}

export default function ThriftPage() {
  const [thriftPlans, setThriftPlans] = useState<ThriftPlan[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ThriftPlan | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        const response = await thriftService.getThriftPlans(currentPage, 10);
        if (response.success && response.data) {
          setThriftPlans(response.data.data);
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
      case 'cancelled':
        return <StatusBadge status="error">Cancelled</StatusBadge>;
      default:
        return <StatusBadge status="pending">{status}</StatusBadge>;
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      daily: 'bg-info-light text-info',
      weekly: 'bg-primary/10 text-primary',
      monthly: 'bg-success-light text-success',
    };
    return (
      <span className={`status-badge ${colors[frequency as keyof typeof colors] || 'bg-muted'}`}>
        {frequency}
      </span>
    );
  };

  const getPenaltyLabel = (plan: ThriftPlan) => {
    if (plan.penaltyType === 'none') return 'None';
    if (plan.penaltyType === 'percentage') return `${plan.penaltyValue}%`;
    if (plan.penaltyType === 'fixed') return formatCurrency(plan.penaltyValue || 0);
    return plan.penaltyType;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thrift Plans (Ajo/Esusu)"
        subtitle="View and manage group contribution schemes"
      />

      {/* Table */}
      {isLoading ? (
        <LoadingTableSkeleton rows={5} />
      ) : thriftPlans.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No thrift plans found"
          description="There are no thrift plans to display."
        />
      ) : (
        <DataTableWrapper>
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Contribution</th>
              <th>Members</th>
              <th>Missed</th>
              <th>Penalty</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {thriftPlans.map((plan) => {
              return (
                <tr key={plan.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UsersRound className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          by user {plan.creatorUserId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="font-semibold">{formatCurrency(plan.contributionAmount)}</p>
                      <div className="mt-1">{getFrequencyBadge(plan.frequency)}</div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{plan.memberCount}</span>
                    </div>
                  </td>
                  <td>
                    {plan.missedCount > 0 ? (
                      <span className="text-destructive font-medium">{plan.missedCount}</span>
                    ) : (
                      <span className="text-success">0</span>
                    )}
                  </td>
                  <td>
                    <span className={plan.penaltyType !== 'none' ? 'text-warning font-medium' : 'text-muted-foreground'}>
                      {getPenaltyLabel(plan)}
                    </span>
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
      {!isLoading && thriftPlans.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Plan Detail Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="max-w-lg">
          {selectedPlan && (() => {
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedPlan.name}</DialogTitle>
                  <DialogDescription>
                    Created by user {selectedPlan.creatorUserId}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-primary">{selectedPlan.memberCount}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{formatCurrency(selectedPlan.contributionAmount)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{selectedPlan.frequency}</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{selectedPlan.durationMonths}</p>
                      <p className="text-xs text-muted-foreground">Months</p>
                    </div>
                  </div>

                  {/* Contribution Calendar */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Contribution Tracker</h4>
                    <ContributionCalendar plan={selectedPlan} />
                    <div className="flex items-center justify-center gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-success-light" />
                        <span className="text-muted-foreground">Paid</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-destructive/10" />
                        <span className="text-muted-foreground">Missed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-muted" />
                        <span className="text-muted-foreground">Upcoming</span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Start Date</span>
                      <span>{formatDate(selectedPlan.startDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      {getStatusBadge(selectedPlan.status)}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Missed Contributions</span>
                      <span className={selectedPlan.missedCount > 0 ? 'text-destructive font-medium' : ''}>
                        {selectedPlan.missedCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payout at Maturity</span>
                      <span>{selectedPlan.payoutAtMaturity ? 'Yes' : 'No (Rotating)'}</span>
                    </div>
                  </div>

                  {/* Penalty Info */}
                  {selectedPlan.penaltyType !== 'none' && (
                    <div className="p-4 rounded-lg bg-warning-light border border-warning/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-warning">Penalty Configuration</p>
                          <p className="text-sm text-warning/80 mt-1">
                            {selectedPlan.penaltyType === 'percentage'
                              ? `${selectedPlan.penaltyValue}% penalty on missed contributions`
                              : `${formatCurrency(selectedPlan.penaltyValue || 0)} flat fee per missed contribution`}
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
