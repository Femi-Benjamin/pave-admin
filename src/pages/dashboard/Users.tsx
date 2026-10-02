// PAVE Admin - Users Page

import { useState, useEffect } from 'react';
import { usersService } from '@/services/api';
import { User, KYCStatus } from '@/types';
import { formatDate } from '@/utils/format';
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
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                        {user.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
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
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.fullName}
                      className="h-16 w-16 rounded-full"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                      {selectedUser.fullName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
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

                <p className="text-sm text-muted-foreground">
                  Wallet, savings, and thrift details are not included in the documented user-role response.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
