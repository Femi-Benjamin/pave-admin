import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService, notificationService } from "@/services/api";
import type {
  CreateAdminAccountInput,
} from "@/types";
import type {
  CreateAdminSavingsGroupInput,
} from "@/services/api";

const pendingKycQueryKey = ["admin", "pending-kyc"] as const;
const notificationsQueryKey = ["admin", "notifications"] as const;

export function useAdminNotifications(enabled = true) {
  return useQuery({
    queryKey: notificationsQueryKey,
    enabled,
    queryFn: async () => {
      const response = await notificationService.getAll();
      if (!response.success || !response.data) {
        throw new Error(
          response.error || response.message || "Unable to load notifications",
        );
      }
      return response.data;
    },
  });
}

export function useMarkAdminNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await notificationService.markAsRead(notificationId);
      if (!response.success) {
        throw new Error(
          response.error || response.message || "Unable to mark notification as read",
        );
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
}

export function useMarkAllAdminNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await notificationService.markAllAsRead();
      if (!response.success) {
        throw new Error(
          response.error || response.message || "Unable to mark all notifications as read",
        );
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
}

export function useDeleteAdminNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await notificationService.deleteById(notificationId);
      if (!response.success) {
        throw new Error(
          response.error || response.message || "Unable to delete notification",
        );
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
}

export function useDeleteAllAdminNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await notificationService.deleteAll();
      if (!response.success) {
        throw new Error(
          response.error || response.message || "Unable to delete notifications",
        );
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
}

export function usePendingAdminKyc(enabled = true) {
  return useQuery({
    queryKey: pendingKycQueryKey,
    enabled,
    queryFn: async () => {
      const response = await adminService.getPendingKyc();

      if (!response.success || !response.data) {
        throw new Error(
          response.error || response.message || "Unable to load pending KYC submissions",
        );
      }

      return response.data;
    },
  });
}

export function useApproveAdminKyc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await adminService.approveKyc(userId);

      if (!response.success) {
        throw new Error(response.error || response.message || "Unable to approve KYC");
      }

      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pendingKycQueryKey });
    },
  });
}

export function useAdminUserDetails(email: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["admin", "user-details", email],
    enabled: enabled && !!email,
    queryFn: async () => {
      if (!email) {
        throw new Error("An email address is required to load user details");
      }

      const response = await adminService.getUserDetails(email);

      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load user details");
      }

      return response.data;
    },
  });
}

export function useAdminUserTransactions(email: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["admin", "user-transactions", email],
    enabled: enabled && !!email,
    queryFn: async () => {
      if (!email) {
        throw new Error("An email address is required to load user transactions");
      }

      const response = await adminService.getUserTransactions(email);

      if (!response.success || !response.data) {
        throw new Error(
          response.error || response.message || "Unable to load user transactions",
        );
      }

      return response.data;
    },
  });
}

export function useBlockAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const response = await adminService.blockUser(email);

      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to block user");
      }

      return response.data;
    },
    onSuccess: async (user) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin", "user-details", user.email],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "user-transactions", user.email],
        }),
        queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] }),
      ]);
    },
  });
}

export function useAdminTransactions(enabled = true) {
  return useQuery({
    queryKey: ["admin", "transactions"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getAllTransactions();

      if (!response.success || !response.data) {
        throw new Error(
          response.error || response.message || "Unable to load transactions",
        );
      }

      return response.data;
    },
  });
}

export function useAdminTransactionSearch(meterNumber: string, enabled = true) {
  return useQuery({
    queryKey: ["admin", "transaction-search", meterNumber],
    enabled: enabled && !!meterNumber,
    queryFn: async () => {
      if (!meterNumber) {
        throw new Error("A meter number is required to search transactions");
      }

      const response = await adminService.searchTransactionsByMeter(meterNumber);
      if (!response.success || !response.data) {
        throw new Error(
          response.error || response.message || "Unable to search transactions",
        );
      }

      return response.data;
    },
  });
}

export function useAdminUserRoles(enabled = true) {
  return useQuery({
    queryKey: ["admin", "user-roles"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getAllUserRoles();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load users");
      }

      return response.data;
    },
  });
}

export function useAdminTransactionDetails(
  transactionId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["admin", "transaction", transactionId],
    enabled: enabled && !!transactionId,
    queryFn: async () => {
      if (!transactionId) {
        throw new Error("A transaction ID is required");
      }

      const response = await adminService.getTransactionById(transactionId);
      if (!response.success || !response.data) {
        throw new Error(
          response.error || response.message || "Unable to load transaction details",
        );
      }

      return response.data;
    },
  });
}

export function useCreateAdminAccount() {
  return useMutation({
    mutationFn: async (input: CreateAdminAccountInput) => {
      const response = await adminService.createAdminAccount(input);

      if (!response.success) {
        throw new Error(response.error || response.message || "Unable to create admin account");
      }

      return response.data;
    },
  });
}

export function useAdminDashboardTotals(enabled = true) {
  return useQuery({
    queryKey: ["admin", "dashboard-totals"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getDashboardTotals();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load dashboard totals");
      }
      return response.data;
    },
  });
}

export function useAdminTotalSavings(enabled = true) {
  return useQuery({
    queryKey: ["admin", "total-savings"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getTotalSavings();
      if (!response.success || response.data === undefined) {
        throw new Error(response.error || response.message || "Unable to load total savings");
      }
      return response.data;
    },
  });
}

export function useAdminTotalMembers(enabled = true) {
  return useQuery({
    queryKey: ["admin", "total-members"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getTotalMembers();
      if (!response.success || response.data === undefined) {
        throw new Error(response.error || response.message || "Unable to load total members");
      }
      return response.data;
    },
  });
}

export function useAdminRevenueOverview(enabled = true) {
  return useQuery({
    queryKey: ["admin", "revenue-overview"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getRevenueOverview();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load revenue overview");
      }
      return response.data;
    },
  });
}

export function useAdminMemberGrowthByMonth(enabled = true) {
  return useQuery({
    queryKey: ["admin", "member-growth-by-month"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getMemberGrowthByMonth();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load monthly member growth");
      }
      return response.data;
    },
  });
}

export function useAdminUserStatistics(enabled = true) {
  return useQuery({
    queryKey: ["admin", "user-statistics"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getUserStatistics();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load user statistics");
      }
      return response.data;
    },
  });
}

export function useAdminDailyRegistrations(enabled = true) {
  return useQuery({
    queryKey: ["admin", "daily-registrations"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getDailyRegistrations();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load daily registrations");
      }
      return response.data;
    },
  });
}

export function useAdminRetentionStatistics(enabled = true) {
  return useQuery({
    queryKey: ["admin", "retention-statistics"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getRetentionStatistics();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load retention statistics");
      }
      return response.data;
    },
  });
}

export function useAdminCohortAnalysis(enabled = true) {
  return useQuery({
    queryKey: ["admin", "cohort-analysis"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getCohortAnalysis();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load cohort analysis");
      }
      return response.data;
    },
  });
}

export function useAdminVendingGraph(enabled = true) {
  return useQuery({
    queryKey: ["admin", "vending-graph"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getVendingGraph();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load vending graph");
      }
      return response.data;
    },
  });
}

export function useAdminYearlyVending(enabled = true) {
  return useQuery({
    queryKey: ["admin", "vending-yearly"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getYearlyVending();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load yearly vending data");
      }
      return response.data;
    },
  });
}

export function useAdminLeaderboard(enabled = true) {
  return useQuery({
    queryKey: ["admin", "leaderboard"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getLeaderboard();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load user leaderboard");
      }
      return response.data;
    },
  });
}

export function useAdminTopPerformingUsers(enabled = true) {
  return useQuery({
    queryKey: ["admin", "top-performing-contributors"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getTopPerformingUsers();
      if (!response.success || !response.data) {
        throw new Error(
          response.error ||
            response.message ||
            "Unable to load top-performing contributors",
        );
      }
      return response.data;
    },
  });
}

export function useAdminSystemHealth(enabled = true) {
  return useQuery({
    queryKey: ["admin", "system-health"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getSystemHealthSummary();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load system health");
      }
      return response.data;
    },
  });
}

export function useAdminSavingsGroups(enabled = true) {
  return useQuery({
    queryKey: ["admin", "savings-groups"],
    enabled,
    queryFn: async () => {
      const response = await adminService.getSavingsGroups();
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to load savings groups");
      }
      return response.data;
    },
  });
}

export function useCreateAdminSavingsGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAdminSavingsGroupInput) => {
      const response = await adminService.createSavingsGroup(input);
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || "Unable to create savings group");
      }
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "savings-groups"] });
    },
  });
}
