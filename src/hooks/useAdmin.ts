import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/api";
import type { CreateAdminAccountInput } from "@/types";

const pendingKycQueryKey = ["admin", "pending-kyc"] as const;

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
