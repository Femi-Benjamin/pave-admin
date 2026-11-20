import type { AdminRole } from "@/types";

export type AdminCapability = "create_admin_account";

// The Postman collection documents adminRegister under its Super Admin folder.
// Other role permissions are not defined by the available backend contract.
export function hasAdminCapability(
  role: AdminRole | undefined,
  capability: AdminCapability,
): boolean {
  if (capability === "create_admin_account") return role === "super_admin";
  return false;
}

export const documentedAdminRolePolicy = [
  {
    role: "Super Admin" as const,
    description: "Can create admin accounts in the supported Admin Hub UI.",
  },
  {
    role: "Admin" as const,
    description: "Uses the operational Admin Hub sections. No additional role-specific permissions are documented.",
  },
];
