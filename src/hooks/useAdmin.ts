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
