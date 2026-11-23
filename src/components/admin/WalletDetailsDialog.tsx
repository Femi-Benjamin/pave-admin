import { ArrowDownLeft, ArrowUpRight, Ban, UserCheck } from "lucide-react";
import { ScrollableRegion } from "@/components/ui/scrollable-region";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { AdminUserDetails, AdminUserTransaction } from "@/types";

export interface WalletMember {
  name: string;
  email: string;
  phone?: string;
  wallet?: number;
  accountNumber?: string;
  tier?: string;
}

interface QueryState<T> {
  data?: T;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

const naira = (n: unknown) => {
  const v = Number(n);
  return Number.isFinite(v)
    ? `₦${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";
};

const when = (value?: string | null, withTime = false) => {
  if (!value) return "Not available";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not available";
  return withTime ? d.toLocaleString() : d.toLocaleDateString();
};

const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export function WalletDetailsDialog({
  member,
  details,
  transactions,
  isTogglingBlock,
  onToggleBlock,
  onClose,
}: {
  member: WalletMember | null;
  details: QueryState<AdminUserDetails>;
  transactions: QueryState<AdminUserTransaction[]>;
  isTogglingBlock: boolean;
  onToggleBlock: () => void;
  onClose: () => void;
}) {
  const d = details.data;
  const blocked = !!d && (d.isBlocked || d.status.toLowerCase() === "blocked");
  const name = d?.fullName || member?.name || "";
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("") || "?";

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border-white/10 bg-white p-0 dark:bg-[#111327]">
        {member && (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b border-line p-6 pr-12 dark:border-white/10">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-lg font-bold text-ink-primary dark:bg-[#818CF8]/20 dark:text-[#818CF8]">
                {initials}
              </div>
              <div className="min-w-0">
                <DialogTitle
                  className="truncate text-lg font-bold text-[#0D0F1C] dark:text-[#F0F2FF]"
                  style={{ fontFamily: "var(--font-family-display, 'Bricolage Grotesque')" }}
                >
                  {name}
                </DialogTitle>
                <DialogDescription className="truncate text-xs text-ink-muted">
                  {[d?.email || member.email, d?.phone || member.phone].filter(Boolean).join(" · ")}
                </DialogDescription>
              </div>
            </div>

            <ScrollableRegion wrapperClassName="flex-1" className="p-6">
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#1E1B4B] to-[#3730A3] p-5 text-white shadow-lg">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                      Virtual NGN Account
                    </span>
                    <div className="mt-0.5 text-2xl font-bold tracking-tight">
                      {naira(d?.balance ?? member.wallet)}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      blocked ? "bg-red-500/25 text-red-100" : "bg-emerald-400/25 text-emerald-100"
                    }`}
                  >
                    {d?.status || "Loading…"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-white/15 pt-3 text-xs sm:grid-cols-3">
                  <div>
                    <div className="text-xs text-white/60">Account Number</div>
                    <div className="font-semibold tracking-wider">
                      {d?.accountNumber || member.accountNumber || "Not provided"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60">Account Name</div>
                    <div className="truncate font-semibold">{d?.accountName || "Not provided"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60">Account Tier</div>
                    <div className="font-semibold">{member.tier || "Tier 3 - Verified"}</div>
                  </div>
                </div>
              </div>

              {details.isLoading && <p className="mb-4 text-sm text-ink-muted">Loading user details…</p>}
              {details.isError && (
                <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {errMsg(details.error, "Unable to load user details")}
                  <button onClick={() => void details.refetch()} className="ml-3 font-semibold underline">
                    Retry
                  </button>
                </div>
              )}

              {d && (
                <>
                  <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl bg-[#F9FAFB] p-4 text-sm dark:bg-white/5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <div className="text-xs text-ink-muted">Address</div>
                      <div className="mt-1 font-medium text-[#374151] dark:text-gray-200">{d.address || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-muted">Signed up</div>
                      <div className="mt-1 font-medium text-[#374151] dark:text-gray-200">{when(d.signUpOn)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-muted">Last login</div>
                      <div className="mt-1 font-medium text-[#374151] dark:text-gray-200">{when(d.lastLogin, true)}</div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0D0F1C] dark:text-[#F0F2FF]" style={{ fontFamily: "var(--font-family-display)" }}>
                    Recent Ledger Activity
                  </h3>
                  <span className="text-xs text-ink-muted">{transactions.data?.length ?? 0} transactions</span>
                </div>
                <ScrollableRegion className="max-h-[19rem] space-y-2 pr-2" hint="More transactions">
                  {transactions.isLoading ? (
                    <p className="py-4 text-center text-sm text-ink-muted">Loading user transactions…</p>
                  ) : transactions.isError ? (
                    <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                      {errMsg(transactions.error, "Unable to load user transactions")}
                      <button onClick={() => void transactions.refetch()} className="ml-3 font-semibold underline">
                        Retry
                      </button>
                    </div>
                  ) : transactions.data?.length ? (
                    transactions.data.map((tx) => {
                      const credit = tx.type?.toLowerCase().includes("credit") ?? false;
                      return (
                        <div key={tx._id || tx.reference} className="flex items-center justify-between rounded-xl bg-[#F9FAFB] p-3 text-xs dark:bg-white/5">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${credit ? "bg-[#ECFDF5] text-[#047857] dark:bg-[#10B981]/15 dark:text-[#6EE7B7]" : "bg-[#FEF2F2] text-[#B91C1C] dark:bg-[#EF4444]/15 dark:text-[#FCA5A5]"}`}>
                              {credit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                                {tx.description || tx.type || "Transaction"}
                              </div>
                              <div className="truncate text-[11px] text-ink-muted">
                                {when(tx.createdAt, true)} · {tx.reference}
                              </div>
                              <div className="text-[11px] text-ink-muted">Status: {tx.status}</div>
                            </div>
                          </div>
                          <div className={`ml-3 shrink-0 font-bold ${credit ? "text-ink-success" : "text-ink-danger"}`}>
                            {naira(tx.amount)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="py-4 text-center text-sm text-ink-muted">No transactions found for this user.</p>
                  )}
                </ScrollableRegion>
              </div>
            </ScrollableRegion>
            {d && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-white px-6 py-4 shadow-[0_-10px_18px_-14px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-[#111327]">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${blocked ? "bg-[#DC2626]" : "bg-[#10B981]"}`}
                  />
                  <p className="text-sm text-ink-muted">
                    {blocked ? "This user is blocked and cannot sign in." : "This user is active."}
                  </p>
                </div>
                <button
                  onClick={onToggleBlock}
                  disabled={isTogglingBlock}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                    blocked ? "bg-[#3730A3] hover:bg-[#312E81]" : "bg-[#DC2626] hover:bg-[#B91C1C]"
                  }`}
                >
                  {blocked ? <UserCheck size={15} aria-hidden="true" /> : <Ban size={15} aria-hidden="true" />}
                  {isTogglingBlock ? "Updating…" : blocked ? "Unblock User" : "Block User"}
                </button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
