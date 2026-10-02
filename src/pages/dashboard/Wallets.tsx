// PAVE Admin - Wallets Page

import { useState, useEffect } from 'react';
import { walletService } from '@/services/api';
import { Wallet } from '@/types';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Wallet as WalletIcon, Lock, Unlock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionWallet, setActionWallet] = useState<{ wallet: Wallet; action: 'block' | 'unblock' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchWallets = async () => {
    setIsLoading(true);
    try {
      const response = await walletService.getWallets(currentPage, 10);
      if (response.success && response.data) {
        setWallets(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [currentPage]);

  const handleAction = async () => {
    if (!actionWallet) return;
    setIsProcessing(true);
    try {
      const response = actionWallet.action === 'block'
        ? await walletService.blockWallet(actionWallet.wallet.id)
        : await walletService.unblockWallet(actionWallet.wallet.id);
      
      if (response.success) {
        toast.success(
          actionWallet.action === 'block' ? 'Wallet blocked' : 'Wallet unblocked',
          { description: 'Action completed successfully.' }
        );
        fetchWallets();
      }
    } finally {
      setIsProcessing(false);
      setActionWallet(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enabled':
        return <StatusBadge status="success">Enabled</StatusBadge>;
      case 'blocked':
        return <StatusBadge status="error">Blocked</StatusBadge>;
      default:
        return <StatusBadge status="pending">Pending</StatusBadge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallets"
        subtitle="View and manage user wallets"
      />

      {/* Table */}
      {isLoading ? (
        <LoadingTableSkeleton rows={5} />
      ) : wallets.length === 0 ? (
        <EmptyState
          icon={WalletIcon}
          title="No wallets found"
          description="There are no wallets to display."
        />
      ) : (
        <DataTableWrapper>
          <thead>
            <tr>
              <th>User</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Last Activity</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((wallet) => {
              return (
                <tr key={wallet.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">User {wallet.userId}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="font-semibold">{formatCurrency(wallet.balance)}</p>
                  </td>
                  <td>{getStatusBadge(wallet.status)}</td>
                  <td className="text-muted-foreground text-sm">
                    {formatDateTime(wallet.updatedAt)}
                  </td>
                  <td className="text-muted-foreground text-sm">
                    {formatDateTime(wallet.createdAt)}
                  </td>
                  <td>
                    {wallet.status === 'enabled' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setActionWallet({ wallet, action: 'block' })}
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Block
                      </Button>
                    ) : wallet.status === 'blocked' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-success hover:text-success"
                        onClick={() => setActionWallet({ wallet, action: 'unblock' })}
                      >
                        <Unlock className="w-4 h-4 mr-1" />
                        Unblock
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTableWrapper>
      )}

      {/* Pagination */}
      {!isLoading && wallets.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionWallet} onOpenChange={() => setActionWallet(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionWallet?.action === 'block' ? 'Block Wallet' : 'Unblock Wallet'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionWallet?.action === 'block'
                ? 'This will prevent the user from making any transactions. Are you sure you want to block this wallet?'
                : 'This will restore the user\'s ability to make transactions. Are you sure you want to unblock this wallet?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isProcessing}
              className={actionWallet?.action === 'block' ? 'bg-destructive hover:bg-destructive/90' : 'bg-success hover:bg-success/90'}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : actionWallet?.action === 'block' ? (
                <Lock className="w-4 h-4 mr-2" />
              ) : (
                <Unlock className="w-4 h-4 mr-2" />
              )}
              {actionWallet?.action === 'block' ? 'Block' : 'Unblock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
