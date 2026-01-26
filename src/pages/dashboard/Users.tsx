// PAVE Admin - Users Page

import { useState, useEffect } from 'react';
import { usersService } from '@/services/api';
import { User, KYCStatus } from '@/types';
import { formatDate, getWalletByUserId, getSavingsByUserId, getThriftsByUserId } from '@/data/mockData';
import {
  PageHeader,
  StatusBadge,
  DataTableWrapper,
  Pagination,
  LoadingTableSkeleton,
  EmptyState,
} from '@/components/ui/dashboard-components';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Search, Users as UsersIcon, Mail, Phone, Calendar, Wallet, PiggyBank, UsersRound } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState<KYCStatus | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await usersService.getUsers(currentPage, 10, {
          search,
          kycStatus: kycFilter,
        });
        if (response.success && response.data) {
          setUsers(response.data.data);
          setTotalPages(response.data.totalPages);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [currentPage, search, kycFilter]);

  const getKYCStatusBadge = (status: KYCStatus) => {
    switch (status) {
      case 'approved':
        return <StatusBadge status="success">Approved</StatusBadge>;
      case 'rejected':
        return <StatusBadge status="error">Rejected</StatusBadge>;
      default:
        return <StatusBadge status="pending">Pending</StatusBadge>;
    }
  };

  const getWalletStatusBadge = (enabled: boolean) => {
    return enabled ? (
      <StatusBadge status="success">Enabled</StatusBadge>
    ) : (
      <StatusBadge status="warning">Disabled</StatusBadge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Manage and view all registered users"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={kycFilter} onValueChange={(v) => setKycFilter(v as KYCStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="KYC Status" />
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
      ) : users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      ) : (
        <DataTableWrapper>
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>KYC Status</th>
              <th>Wallet</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user.id}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <p className="text-sm">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.phone}</p>
                </td>
                <td>{getKYCStatusBadge(user.kycStatus)}</td>
                <td>{getWalletStatusBadge(user.walletEnabled)}</td>
                <td className="text-muted-foreground">{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </DataTableWrapper>
      )}

      {/* Pagination */}
      {!isLoading && users.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <img
                    src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.fullName}`}
                    alt={selectedUser.fullName}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <SheetTitle>{selectedUser.fullName}</SheetTitle>
                    <SheetDescription>{selectedUser.id}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {selectedUser.email}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {selectedUser.phone}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      Joined {formatDate(selectedUser.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {getKYCStatusBadge(selectedUser.kycStatus)}
                    {getWalletStatusBadge(selectedUser.walletEnabled)}
                  </div>
                </div>

                {/* Wallet */}
                {(() => {
                  const wallet = getWalletByUserId(selectedUser.id);
                  if (wallet) {
                    return (
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Wallet
                        </h4>
                        <div className="p-4 rounded-lg bg-muted/50 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">
                              ₦{wallet.balance.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Available Balance
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Savings */}
                {(() => {
                  const savings = getSavingsByUserId(selectedUser.id);
                  if (savings.length > 0) {
                    return (
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Savings Plans ({savings.length})
                        </h4>
                        <div className="space-y-3">
                          {savings.map((plan) => (
                            <div
                              key={plan.id}
                              className="p-4 rounded-lg bg-muted/50 flex items-center gap-4"
                            >
                              <div className="w-10 h-10 rounded-full bg-success-light flex items-center justify-center">
                                <PiggyBank className="w-5 h-5 text-success" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{plan.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-success rounded-full"
                                      style={{
                                        width: `${(plan.currentAmount / plan.targetAmount) * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round((plan.currentAmount / plan.targetAmount) * 100)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Thrifts */}
                {(() => {
                  const thrifts = getThriftsByUserId(selectedUser.id);
                  if (thrifts.length > 0) {
                    return (
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Thrift Plans ({thrifts.length})
                        </h4>
                        <div className="space-y-3">
                          {thrifts.map((plan) => (
                            <div
                              key={plan.id}
                              className="p-4 rounded-lg bg-muted/50 flex items-center gap-4"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <UsersRound className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{plan.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {plan.memberCount} members • ₦{plan.contributionAmount.toLocaleString()} {plan.frequency}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
