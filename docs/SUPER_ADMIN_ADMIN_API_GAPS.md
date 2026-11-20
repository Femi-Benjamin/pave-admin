# Super Admin and Admin RBAC: API Gaps

## Scope and evidence

This document compares the current Admin Hub role UI with `Pave.postman_collection.json` and `docs/api-integration-audit.md`. It describes documented routes and frontend visibility only. A Postman request or a frontend role check does not prove that the backend authorizes the operation.

## Implemented frontend behavior

- Admin login reads the returned `role` and recognizes `admin`, `superadmin`, and `super_admin` (normalizing the latter two to `super_admin`). Login behavior is implemented in `src/services/api.ts`.
- The Settings view exposes account creation only when the current session role is `super_admin`.
- Account creation sends the fields shown by the collection (`firstName`, `lastName`, `email`, `phoneNumber`, `address`, `city`, and `state`). The collection's `adminRegister` example does not include a role field, so the UI no longer offers role assignment or super-admin creation through this request.
- The role capability panel describes only this documented distinction. Admins retain the existing operational dashboard UI. No other admin/super-admin differences are inferred.

These are client-side controls. The browser session can be changed by a user; the checks are not an authorization boundary.

## Documented operation support

| Operation | Frontend role treatment | Collection evidence | Backend authorization status |
|---|---|---|---|
| `POST /api/v1/admin/adminLogin` | Both roles use the shared login flow | Admin folder, `admin Login` request | Unknown; collection provides no role policy |
| `POST /api/v1/admin/adminRegister` | Super Admin only in the UI | Under `Admin / Super Admin Create Admin account / Create Admin Account`; example body has no `role` field | Unknown; folder placement suggests intended Super Admin use but does not prove server enforcement |
| `PUT /api/v1/admin/adminApprovedKyc/:userId` | Existing operational KYC action remains available to signed-in Admin Hub users | Request is in the same folder as admin login and creation | Unknown; folder placement does not establish whether Admins, Super Admins, or both may approve |
| Member, wallet, transaction, analytics, savings, and notification operations already integrated in the Admin Hub | Existing UI remains available to both roles | Documented in Admin collection folders and consumed by the current hooks/services | Unknown for each route; no role matrix or authorization responses are supplied |

The collection also has `GET /api/v1/admin/adminViewAllUserRoles`, used for the member/role data UI. Its name and example do not establish that it lists administrator accounts or grants role-management capability.

## Backend APIs and policy needed

The collection does not document APIs or rules for:

- Listing administrator accounts separately from ordinary members.
- Assigning, changing, or removing an Admin or Super Admin role.
- Defining or retrieving permission sets, including per-section/action permissions.
- Disabling, blocking, or revoking an administrator session/account.
- Creating a Super Admin account or changing an account into Super Admin.
- General member invitations, KYC rejection, audit-log filtering, wallet ledger/export, or admin profile/preference updates (see the historical audit for related integration gaps).

Please provide a backend authorization matrix for `admin` and `super_admin` for every privileged endpoint, including whether the server checks role claims on every request. Confirm whether `adminRegister` is restricted to Super Admin server-side and which role it assigns when `role` is omitted. If role assignment is supported, document its endpoint, accepted values, request/response schema, and safeguards against privilege escalation. Document an administrator-list endpoint and any permission, deactivation, and session-revocation endpoints if those capabilities are required.

## Security and validation status

- No backend authorization behavior was verified in this frontend-only workspace review.
- No API requests were sent as either role, and the Postman collection's saved responses are not treated as proof of access control.
- Frontend RBAC reduces accidental access to the documented account-creation UI. The backend must independently enforce the same policy before the operation is considered secure.
