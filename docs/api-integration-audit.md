# Pave Admin Hub API Integration Audit

**Scope:** Static comparison of this frontend with the user-provided `Pave.postman_collection.json`. No API requests were sent and no application code was changed.

## Executive summary

The active dashboard uses a centralized `fetch` client, session-token handling, typed response checks, React Query hooks, and loading/error/empty states. Core admin flows (login, member/role list, user details and transactions, block user, KYC queue/approval, transaction list/search/detail, analytics, group savings list/create, and notifications) call API routes instead of local business-data fixtures.

The main integration gaps are:

- Marketplace has no frontend API calls even though the collection documents product, category, and purchase APIs.
- Messaging is incorrectly marked as undocumented/unavailable. The collection has group-chat and one-to-one chat routes, although it does not establish that these provide an admin inbox or broadcasts.
- KYC rejection and general member invitation are visible UI actions without matching admin APIs. KYC rejection always shows an error; the reason is not sent.
- Savings only integrates group listing/creation; personal savings, contributions, and group maintenance/member operations are absent.
- Audit logs are documented but not integrated.
- The documented total-savings URL is duplicated from wallet balance, while the frontend calls a different, undocumented route. Revenue Overview has no URL in Postman.

No convincing mock member, transaction, KYC, notification, or analytics datasets were found in the active AdminApp path. Unsupported functionality/placeholders are the material risk, rather than silent sample-data fallbacks.

## Feature coverage

| Area | Current integration | Finding |
|---|---|---|
| Admin login/account creation | `POST /api/v1/admin/adminLogin` and `/adminRegister` | Match documented routes; account creation is gated to super admins. |
| Members | `/admin/adminViewAllUserRoles`, `/viewUserDetails`, `/viewUserTransactions`, `/blockUser` | Calls documented endpoints. The collection labels the directory route “View All User Roles”; confirm this returns the full member population. Search/filter/page slicing is client-side; no pagination parameters are used. |
| KYC | pending list and approval routes | Matches the documented list/approve APIs. Rejection is not available; reason input is discarded. |
| Transactions | list, meter search, and transaction detail | Matches documented admin endpoints. |
| Dashboard/analytics | member/wallet totals, vending, user stats, registrations, retention, cohorts, growth, leaderboard, system health | Most routes match. Total savings and revenue remain ambiguous (see below). |
| Savings | group list and create | Matches two group-saving endpoints. No group update/delete/detail or personal-saving/contribution calls. |
| Notifications | list, mark one/all read, delete one/all | Paths/methods match. Postman calls them user notifications; confirm they are appropriate for admin tokens. |
| Wallets | wallet aggregate and user/role dataset | No admin wallet list, per-user ledger, daily credit/debit aggregate, or export API is documented. Some metrics are explicitly unavailable; “Export Ledger” is enabled but has no handler. |
| Marketplace | no service calls or hooks | Missing integration despite documented category/product/purchase endpoints; UI disables Add Product as “API unavailable.” |
| Messaging | no service calls or hooks | Missing integration despite documented group and one-to-one chat routes; UI incorrectly says none are documented. Broadcast/admin inbox suitability is unverified. |
| Audit logs | no service calls or screen | `GET /api/v1/audit/audit-logs` is documented but not consumed. |
| Settings/profile | admin creation and role listing | No admin profile update, role assignment/permission, notification-preference, or logout endpoint is documented. Related controls are disabled. |

## Findings

### P1 — Marketplace APIs are documented but unused

The collection documents category list/detail and product create/read/update/delete, plus purchase create/read/list/update/delete and installment continuation. The active Marketplace section has no queries/mutations and disables Add Product. This is a direct integration gap. Category create/update/delete entries have blank URLs; the collection also labels category update/delete as GET, so those operations need backend confirmation.

### P1 — Messaging is misreported as unavailable

The collection includes seven group-chat and six one-to-one chat operations under `/api/v1/message/...`. No matching client/hooks exist. The UI says there are no messaging endpoints and disables messaging/broadcast controls. The documented chat APIs do not prove an admin inbox or broadcast API exists; confirm intended admin access before wiring them.

### P1 — KYC rejection is a dead action

The UI exposes rejection and collects a reason, but the handler only displays “KYC rejection is not available in the documented API.” Postman includes approval only. The reason is not persisted or submitted. Keep rejection classified as unsupported until the backend documents its route and payload.

### P1 — Member invitation has no matching general invite API

Invite controls open a modal; no general member-invitation call exists. Postman’s `group-saving/invite-member` is group-specific and does not establish a directory invitation endpoint.

### P1 — Savings integration covers only group list/create

Postman also documents personal-saving create/list/detail/update/delete/withdrawal, contribution operations, and group detail/update/delete/join/contribute/withdrawal/leave/invite operations. The active admin client only calls group list and create. These may be end-user operations, so confirm admin permissions and product scope before adding them.

### P2 — Total-savings endpoint conflicts with Postman

Frontend calls `GET /api/v1/admin/getTotalSavings`. Postman’s “get Total Savings” request instead points to `/api/v1/admin/getAllTotalWalletBalance`, the same URL as the wallet-balance entry. The frontend route is plausible but unverified from this collection; confirm the canonical endpoint and response shape.

### P2 — Revenue Overview has no documented URL

Postman’s Revenue Overview request has method GET but an empty URL. Frontend calls `GET /api/v1/admin/revenueOverview` and expects an array of `{ month, revenue }`; neither path nor response shape can be checked against the supplied collection.

### P2 — Audit logs are omitted from the frontend

`GET /api/v1/audit/audit-logs` is documented, but there is no matching API call or screen. Current Reports uses analytics endpoints only.

### P2 — Wallet UI exposes unsupported data/actions

The aggregate wallet balance and role/member API are used, but no per-member wallet listing or ledger route is documented. Monthly in/out and last-activity cells are blank; daily credit/debit metrics say unavailable. Export Ledger is enabled without an action handler. These are unsupported placeholders, not mock data.

### P2 — Forgot password is stubbed although generic auth reset routes exist

`authService.forgotPassword` always returns unavailable. Postman documents `/api/v1/auth/forgotPassword` and `/api/v1/auth/resetPassword` under user Authentication, not admin Authentication. Admin applicability and payloads are unspecified, so the UI flow cannot currently complete.

### P3 — Legacy dashboard service exports always return unavailable

The legacy `dashboardService`, `usersService`, `kycService`, `walletService`, `transactionService`, `savingsService`, and `thriftService` are stubs. Current `App.tsx` routes to `AdminApp`, whose active flows use newer hooks; the separate `src/pages/dashboard/*` modules still import those stubs. Reusing/routing those pages would show unavailable data.

## Mock-data assessment

- Active member, KYC, transaction, savings-group, notification, and analytics views consume API hooks and show load/error/empty states.
- No seed arrays or sample business-data fallback were identified in the active admin data path. On request failures, the active flow does not silently substitute operational sample data.
- Some figures are derived client-side from returned records (for example, average wallet balance and registration-period counts). Registration counts are trustworthy only if the user/role endpoint returns the full population.
- “Not available,” em dashes, and “Unavailable” are placeholders, not fabricated API results.

## Collection/environment caveats

- The collection contains 134 requests; many are user-facing flows outside this Admin Hub’s scope. Its admin folders contain 25 requests. Unrelated bill payment, transfer, PIN, MFA, and user-auth routes are not counted here as admin omissions.
- URLs mix literal `localhost:9860`, unresolved variables (`localPaveUrl`, `livePaveUrl`, `localCadlanUrl`, `liveCadlanUrl`, `liveOnrenderPaveUrl`), and missing URLs. No Postman environment file was supplied; host equivalence cannot be confirmed.
- Repository `.env` sets `VITE_API_BASE_URL=https://pave-uuh6.onrender.com`; frontend paths are relative to that base. The collection does not prove this deployment serves every documented local/variable route.
- Collection metadata is inconsistent in some places (duplicate savings URL, blank revenue/category-creation URLs, and category update/delete methods). Treat those as documentation questions pending backend confirmation.

## Recommended follow-up

1. Confirm canonical revenue/total-savings routes and response shapes; correct either the collection or frontend contract.
2. Confirm admin access for marketplace and chat APIs, then connect supported flows.
3. Document admin endpoints for KYC rejection (including reason), general member invitations, and any required audit-log or wallet-ledger/export features.
4. Confirm whether generic forgot/reset-password routes support admins and document payloads.
5. Add remaining savings operations only after confirming admin authorization and product scope.

## Files reviewed

`src/App.tsx`, `src/services/api.ts`, `src/hooks/useAdmin.ts`, `src/components/admin/AdminApp.tsx`, `src/contexts/AuthContext.tsx`, `src/pages/Login.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/dashboard/*`, `.env`, and the user-provided `Pave.postman_collection.json`.
