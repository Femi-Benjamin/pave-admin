import { useState, type ReactNode } from "react";
import { Check, ChevronDown, Copy, Zap } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import type { AdminTransaction } from "@/types";

const money = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n)
    ? `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;
};

const dateTime = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

const present = (value: unknown): value is string | number =>
  value !== undefined && value !== null && String(value).trim() !== "";

const statusStyle = (status: string) => {
  const s = status.toLowerCase();
  if (["successful", "success", "completed", "complete"].includes(s))
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30";
  if (["failed", "error", "declined", "cancelled", "canceled"].includes(s))
    return "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/30";
  return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30";
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyle(status)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(`${label} copied`);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Unable to copy");
        }
      }}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#EEF2FF] hover:text-[#3730A3] dark:text-[#94A3B8] dark:hover:bg-white/10"
    >
      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{title}</h3>
      <div className="divide-y divide-[#F1F3FB] rounded-2xl border border-[#F1F3FB] bg-white px-4 dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.03]">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
  copy,
  strong,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  copy?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 text-sm">
      <dt className="shrink-0 text-[#6B7280] dark:text-[#94A3B8]">{label}</dt>
      <dd
        className={`flex min-w-0 items-center gap-1 text-right text-[#0D0F1C] dark:text-[#F0F2FF] ${
          strong ? "font-semibold" : "font-medium"
        } ${mono ? "font-mono text-xs" : ""}`}
      >
        <span className="min-w-0 break-all">{value}</span>
        {copy && <CopyButton value={copy} label={label} />}
      </dd>
    </div>
  );
}

const groupDigits = (token: string) => token.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();

export function TransactionDetailsDialog({
  transaction,
  userName,
  userEmail,
  isRefreshing,
  error,
  onRetry,
  onClose,
}: {
  transaction: AdminTransaction | null;
  userName: string;
  userEmail?: string;
  isRefreshing: boolean;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  const t = transaction;
  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("") || "?";

  const meterRows: [string, string | number | undefined][] = t
    ? [
        ["Meter number", t.meterNumber],
        ["Meter account no.", t.meterAccountNumber],
        ["Vend type", t.vendType],
        ["Subclass", t.subclass],
        ["Tariff", t.tariff],
        [
          "Units",
          present(t.unitsActual) ? `${t.unitsActual} ${t.unitName || ""}`.trim() : undefined,
        ],
      ]
    : [];
  const feeRows: [string, number | undefined][] = t
    ? [
        ["Transaction fees", t.transactionFees],
        ["Vendor fees", t.vendorTransactionFees],
        ["Client fees", t.clientTransactionFees],
        ["VAT", t.vat],
      ]
    : [];
  const shownMeter = meterRows.filter(([, v]) => present(v));
  const shownFees = feeRows.filter(([, v]) => present(v));
  const token = t?.tokenDec || t?.tokenHex;
  const [showAll, setShowAll] = useState(false);

  // Every field the API can return, shown in full (including empty ones) for
  // anyone who needs the raw record rather than the summary above.
  const allFields: [string, string | number | undefined, boolean?][] = t
    ? [
        ["ID", t._id, true],
        ["Reference", t.reference, true],
        ["Type", t.type],
        ["Amount", money(t.amount) ?? undefined],
        ["Status", t.status],
        ["Meter number", t.meterNumber],
        ["Meter account number", t.meterAccountNumber],
        ["Description", t.description],
        ["Vend type", t.vendType],
        ["Subclass", t.subclass],
        ["Tariff", t.tariff],
        ["Units", present(t.unitsActual) ? `${t.unitsActual} ${t.unitName || ""}`.trim() : undefined],
        ["Transaction fees", money(t.transactionFees) ?? undefined],
        ["Vendor transaction fees", money(t.vendorTransactionFees) ?? undefined],
        ["Client transaction fees", money(t.clientTransactionFees) ?? undefined],
        ["VAT", money(t.vat) ?? undefined],
        ["Token (hex)", t.tokenHex, true],
        ["Token (decimal)", t.tokenDec, true],
        ["Vend time", dateTime(t.vendTime) ?? undefined],
        ["Created", dateTime(t.createdAt) ?? undefined],
        ["Updated", dateTime(t.updatedAt) ?? undefined],
        ["User ID", typeof t.userId === "string" ? t.userId : t.userId?._id, true],
      ]
    : [];

  return (
    <Dialog open={!!t} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-3xl border-white/10 bg-white p-0 dark:bg-[#111327]"
      >
        {t && (
          <>
            <header className="shrink-0 border-b border-[#F1F3FB] px-6 pb-5 pt-6 pr-12 dark:border-white/10">
              <DialogTitle className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Transaction details
              </DialogTitle>
              <DialogDescription className="sr-only">
                Full breakdown for transaction {t.reference}
              </DialogDescription>
              <div
                className="mt-3 text-4xl font-bold tracking-tight text-[#0D0F1C] dark:text-[#F0F2FF]"
                style={{ fontFamily: "var(--font-family-display, 'Bricolage Grotesque')" }}
              >
                {money(t.amount) ?? "—"}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <StatusPill status={t.status} />
                <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  {dateTime(t.createdAt) ?? ""}
                </span>
              </div>
              {t.description && (
                <p className="mt-3 break-all text-sm text-[#4B5563] dark:text-[#CBD5E1]">{t.description}</p>
              )}
            </header>

            <div className="admin-dialog-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-[#F9FAFB] px-6 py-5 dark:bg-[#0D0F20]">
              {isRefreshing && (
                <p className="text-xs text-[#9CA3AF]">Refreshing latest details…</p>
              )}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                >
                  {error}
                  <button onClick={onRetry} className="ml-2 font-semibold underline">
                    Retry
                  </button>
                </div>
              )}

              {token && (
                <div className="rounded-2xl bg-gradient-to-br from-[#3730A3] to-[#4F46E5] p-4 text-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80">
                      <Zap size={14} />
                      Electricity token
                    </div>
                    <button
                      type="button"
                      aria-label="Copy token"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(token.replace(/\s+/g, ""));
                          toast.success("Token copied");
                        } catch {
                          toast.error("Unable to copy");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold hover:bg-white/25"
                    >
                      <Copy size={12} />
                      Copy
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xl tracking-wider">
                    {groupDigits(token).split(" ").map((group, i) => (
                      <span key={i}>{group}</span>
                    ))}
                  </div>
                </div>
              )}

              <Section title="Customer">
                <div className="flex items-center gap-3 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-sm font-bold text-[#3730A3] dark:bg-[#818CF8]/20 dark:text-[#818CF8]">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
                      {userName}
                    </div>
                    {userEmail && (
                      <div className="truncate text-xs text-[#6B7280] dark:text-[#94A3B8]">{userEmail}</div>
                    )}
                  </div>
                </div>
              </Section>

              {shownMeter.length > 0 && (
                <Section title="Meter & vend">
                  {shownMeter.map(([label, value]) => (
                    <Row key={label} label={label} value={String(value)} />
                  ))}
                </Section>
              )}

              <Section title="Payment breakdown">
                <Row label="Amount" value={money(t.amount) ?? "—"} strong />
                {shownFees.map(([label, value]) => (
                  <Row key={label} label={label} value={money(value) ?? "—"} />
                ))}
              </Section>

              <Section title="Timeline">
                <Row label="Created" value={dateTime(t.createdAt) ?? "—"} />
                {dateTime(t.vendTime) && <Row label="Vended" value={dateTime(t.vendTime)} />}
                {dateTime(t.updatedAt) && <Row label="Last updated" value={dateTime(t.updatedAt)} />}
              </Section>

              <Section title="References">
                <Row label="Reference" value={t.reference} mono copy={t.reference} />
                {present(t._id) && <Row label="Transaction ID" value={t._id} mono copy={t._id} />}
              </Section>

              <Collapsible open={showAll} onOpenChange={setShowAll}>
                <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#3730A3] transition-colors hover:bg-[#F5F6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3730A3] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#818CF8] dark:hover:bg-white/5">
                  <span>
                    {showAll ? "Hide all details" : "View all details"}
                    <span className="ml-2 text-xs font-medium text-[#9CA3AF]">
                      {allFields.length} fields
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${showAll ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {allFields.map(([label, value, mono]) => (
                      <div
                        key={label}
                        className="min-w-0 rounded-xl border border-[#F1F3FB] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]"
                      >
                        <dt className="text-[11px] font-medium text-[#9CA3AF]">{label}</dt>
                        <dd
                          className={`mt-0.5 break-all text-sm font-medium text-[#0D0F1C] dark:text-[#F0F2FF] ${
                            mono ? "font-mono text-xs" : ""
                          }`}
                        >
                          {present(value) ? String(value) : <span className="text-[#9CA3AF]">—</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
