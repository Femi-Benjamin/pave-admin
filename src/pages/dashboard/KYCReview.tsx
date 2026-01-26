// PAVE Admin - KYC Review Page

import { useState, useEffect } from 'react';
import { kycService } from '@/services/api';
import { KYCSubmission, KYCStatus } from '@/types';
import { formatDateTime, getUserById } from '@/data/mockData';
import {
  PageHeader,
  StatusBadge,
  DataTableWrapper,
  Pagination,
  LoadingTableSkeleton,
  EmptyState,
} from '@/components/ui/dashboard-components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileCheck,
  Eye,
  CheckCircle2,
  XCircle,
  User,
  CreditCard,
  Shield,
  Camera,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function KYCReviewPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<KYCStatus | 'all'>('all');
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await kycService.getSubmissions(statusFilter, currentPage, 10);
      if (response.success && response.data) {
        setSubmissions(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, statusFilter]);

  const handleApprove = async () => {
    if (!selectedKYC) return;
    setIsProcessing(true);
    try {
      const response = await kycService.approveKYC(selectedKYC.id);
      if (response.success) {
        toast.success('KYC approved successfully', {
          description: 'User wallet has been enabled.',
        });
        setIsDetailOpen(false);
        fetchSubmissions();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedKYC || !rejectionReason.trim()) return;
    setIsProcessing(true);
    try {
      const response = await kycService.rejectKYC(selectedKYC.id, rejectionReason);
      if (response.success) {
        toast.error('KYC rejected', {
          description: 'User has been notified.',
        });
        setIsRejectDialogOpen(false);
        setIsDetailOpen(false);
        setRejectionReason('');
        fetchSubmissions();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: KYCStatus) => {
    switch (status) {
      case 'approved':
        return <StatusBadge status="success">Approved</StatusBadge>;
      case 'rejected':
        return <StatusBadge status="error">Rejected</StatusBadge>;
      default:
        return <StatusBadge status="pending">Pending</StatusBadge>;
    }
  };

  const getLivenessStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <StatusBadge status="success">Passed</StatusBadge>;
      case 'failed':
        return <StatusBadge status="error">Failed</StatusBadge>;
      default:
        return <StatusBadge status="pending">Pending</StatusBadge>;
    }
  };

  const getFaceMatchColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC Review"
        subtitle="Review and approve user identity verification submissions"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as KYCStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingTableSkeleton rows={5} />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No KYC submissions"
          description="There are no KYC submissions matching your filter."
        />
      ) : (
        <DataTableWrapper>
          <thead>
            <tr>
              <th>User</th>
              <th>BVN / NIN</th>
              <th>Liveness</th>
              <th>Face Match</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((kyc) => {
              const user = getUserById(kyc.userId);
              return (
                <tr key={kyc.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.fullName}`}
                        alt={user?.fullName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{user?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm font-mono">{kyc.bvn}</p>
                    <p className="text-xs text-muted-foreground font-mono">{kyc.nin}</p>
                  </td>
                  <td>{getLivenessStatusBadge(kyc.livenessStatus)}</td>
                  <td>
                    {kyc.faceMatchScore > 0 ? (
                      <span className={`font-semibold ${getFaceMatchColor(kyc.faceMatchScore)}`}>
                        {kyc.faceMatchScore}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td>{getStatusBadge(kyc.status)}</td>
                  <td className="text-muted-foreground text-sm">
                    {formatDateTime(kyc.submittedAt)}
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedKYC(kyc);
                        setIsDetailOpen(true);
                      }}
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
      {!isLoading && submissions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* KYC Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedKYC && (() => {
            const user = getUserById(selectedKYC.userId);
            return (
              <>
                <DialogHeader>
                  <DialogTitle>KYC Submission Details</DialogTitle>
                  <DialogDescription>
                    Review the user's identity verification documents
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* User Info */}
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.fullName}`}
                      alt={user?.fullName}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{user?.fullName}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <p className="text-sm text-muted-foreground">{user?.phone}</p>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <h4 className="font-medium">BVN</h4>
                      </div>
                      <p className="font-mono text-lg">{selectedKYC.bvn}</p>
                    </div>
                    <div className="p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-5 h-5 text-primary" />
                        <h4 className="font-medium">NIN</h4>
                      </div>
                      <p className="font-mono text-lg">{selectedKYC.nin}</p>
                    </div>
                  </div>

                  {/* Face Capture */}
                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="w-5 h-5 text-primary" />
                      <h4 className="font-medium">Facial Capture</h4>
                    </div>
                    <div className="flex items-start gap-4">
                      <img
                        src={selectedKYC.faceImageUrl}
                        alt="Face capture"
                        className="w-24 h-24 rounded-lg object-cover border border-border"
                      />
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Liveness Check</span>
                          {getLivenessStatusBadge(selectedKYC.livenessStatus)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Face Match Score</span>
                          {selectedKYC.faceMatchScore > 0 ? (
                            <span className={`font-semibold ${getFaceMatchColor(selectedKYC.faceMatchScore)}`}>
                              {selectedKYC.faceMatchScore}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Timeline */}
                  <div className="p-4 rounded-lg border border-border">
                    <h4 className="font-medium mb-3">Status</h4>
                    <div className="flex items-center gap-2 mb-4">
                      {getStatusBadge(selectedKYC.status)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Submitted</span>
                        <span>{formatDateTime(selectedKYC.submittedAt)}</span>
                      </div>
                      {selectedKYC.reviewedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reviewed</span>
                          <span>{formatDateTime(selectedKYC.reviewedAt)}</span>
                        </div>
                      )}
                      {selectedKYC.rejectionReason && (
                        <div className="mt-3 p-3 rounded-lg bg-destructive/10 text-destructive">
                          <p className="font-medium mb-1">Rejection Reason:</p>
                          <p className="text-sm">{selectedKYC.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedKYC.status === 'pending' && (
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => setIsRejectDialogOpen(true)}
                      disabled={isProcessing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="bg-success hover:bg-success/90"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </DialogFooter>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Reject KYC Submission
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Face match score below threshold. Please resubmit with clearer photo."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
