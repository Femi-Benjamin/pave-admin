// PAVE Admin - Transactions Page

import { useState, useEffect, useRef } from 'react';
import { transactionService } from '@/services/api';
import { Transaction, TransactionType, TransactionStatus } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeftRight,
  Search,
  Eye,
  Download,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  UsersRound,
  Printer,
} from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const response = await transactionService.getTransactions(currentPage, 10, {
          search,
          type: typeFilter,
          status: statusFilter,
        });
        if (response.success && response.data) {
          setTransactions(response.data.data);
          setTotalPages(response.data.totalPages);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchTransactions, 300);
    return () => clearTimeout(debounce);
  }, [currentPage, search, typeFilter, statusFilter]);

  const getStatusBadge = (status: TransactionStatus) => {
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

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="w-4 h-4" />;
      case 'withdrawal':
        return <TrendingDown className="w-4 h-4" />;
      case 'savings':
        return <PiggyBank className="w-4 h-4" />;
      case 'thrift':
        return <UsersRound className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return 'bg-success-light text-success';
      case 'withdrawal':
        return 'bg-warning-light text-warning';
      case 'savings':
        return 'bg-primary/10 text-primary';
      case 'thrift':
        return 'bg-info-light text-info';
    }
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Transaction Receipt - ${selectedTransaction?.reference}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #8b5cf6; }
            .receipt-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .label { color: #6b7280; }
            .value { font-weight: 500; }
            .amount { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; }
            .status-completed { background: #dcfce7; color: #16a34a; }
            .status-pending { background: #fef3c7; color: #d97706; }
            .status-failed { background: #fee2e2; color: #dc2626; }
            .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">PAVE</div>
            <p>Transaction Receipt</p>
          </div>
          ${printContent.innerHTML}
          <div class="footer">
            <p>Thank you for using PAVE</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="View and manage all platform transactions"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionType | 'all')}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
            <SelectItem value="savings">Savings</SelectItem>
            <SelectItem value="thrift">Thrift</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TransactionStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="reversed">Reversed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingTableSkeleton rows={5} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      ) : (
        <DataTableWrapper>
          <thead>
            <tr>
              <th>Type</th>
              <th>User</th>
              <th>Amount</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => {
              return (
                <tr key={txn.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(txn.type)}`}>
                        {getTypeIcon(txn.type)}
                      </div>
                      <span className="capitalize font-medium">{txn.type}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">User {txn.userId}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`font-semibold ${txn.type === 'deposit' ? 'text-success' : ''}`}>
                      {txn.type === 'deposit' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-sm text-muted-foreground">{txn.reference}</span>
                  </td>
                  <td>{getStatusBadge(txn.status)}</td>
                  <td className="text-muted-foreground text-sm">
                    {formatDateTime(txn.createdAt)}
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTransaction(txn)}
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
      {!isLoading && transactions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-md">
          {selectedTransaction && (() => {
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Transaction Details</DialogTitle>
                  <DialogDescription>
                    Reference: {selectedTransaction.reference}
                  </DialogDescription>
                </DialogHeader>

                <div ref={receiptRef} className="space-y-4 py-4">
                  {/* Amount */}
                  <div className="text-center py-4">
                    <p className={`text-3xl font-bold ${selectedTransaction.type === 'deposit' ? 'text-success' : ''}`}>
                      {selectedTransaction.type === 'deposit' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                    </p>
                    <div className="mt-2">
                      {getStatusBadge(selectedTransaction.status)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="capitalize font-medium">{selectedTransaction.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">User</span>
                      <span className="font-medium">User {selectedTransaction.userId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-mono">{selectedTransaction.reference}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span>{formatDateTime(selectedTransaction.createdAt)}</span>
                    </div>
                    {selectedTransaction.description && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Description</span>
                        <span>{selectedTransaction.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Receipt
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
