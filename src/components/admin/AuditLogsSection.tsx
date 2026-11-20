import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAdminAuditLogs } from "@/hooks/useAdmin";

const PAGE_SIZE = 20;

export function AuditLogsSection() {
  const logs = useAdminAuditLogs();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = logs.data ?? [];
    return q
      ? rows.filter((l) =>
          [l.action, l.actor, l.description].some((v) => v.toLowerCase().includes(q)),
        )
      : rows;
  }, [logs.data, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D0F1C] dark:text-[#F0F2FF]">Audit Logs</h1>
        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
          Administrative and system activity recorded by the platform.
        </p>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search action, user or description"
          className="w-full rounded-xl bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-1 ring-[#E5E7EB] focus:ring-[#3730A3] dark:bg-[#111327] dark:ring-white/10"
        />
      </div>

      {logs.isLoading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#9CA3AF] dark:bg-[#111327]">
          Loading audit logs...
        </div>
      ) : logs.isError ? (
        <div className="rounded-2xl bg-white p-8 text-center dark:bg-[#111327]">
          <p role="alert" className="mb-3 text-sm text-red-600">{logs.error.message}</p>
          <button onClick={() => void logs.refetch()} className="font-semibold text-[#3730A3]">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#9CA3AF] dark:bg-[#111327]">
          {query ? "No logs match your search." : "No audit logs recorded yet."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#F1F3FB] bg-white shadow-sm dark:border-white/10 dark:bg-[#111327]">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[#9CA3AF]">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Action</th>
                <th className="p-4">User</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="cursor-pointer border-t border-[#F1F3FB] align-top hover:bg-[#F9FAFB] dark:border-white/10 dark:hover:bg-white/5"
                >
                  <td className="whitespace-nowrap p-4 text-[#6B7280]">
                    {log.createdAt && !Number.isNaN(Date.parse(log.createdAt))
                      ? new Date(log.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="p-4 font-medium capitalize">{log.action.replace(/_/g, " ")}</td>
                  <td className="p-4">{log.actor}</td>
                  <td className="p-4 text-[#6B7280]">
                    {log.description || "—"}
                    {expanded === log.id && (
                      <pre className="mt-2 max-w-xl overflow-x-auto rounded-lg bg-[#F1F3FB] p-3 text-xs dark:bg-white/5">
                        {JSON.stringify(
                          Object.fromEntries(
                            Object.entries(log.raw).filter(
                              ([k]) => !/password|token|secret/i.test(k),
                            ),
                          ),
                          null,
                          2,
                        )}
                      </pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-[#F1F3FB] p-4 text-sm dark:border-white/10">
            <span className="text-[#9CA3AF]">
              {filtered.length} log{filtered.length === 1 ? "" : "s"} · page {current} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
                className="rounded-lg border border-[#E1E5EF] px-3 py-1.5 font-medium disabled:opacity-40 dark:border-white/10"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={current === totalPages}
                onClick={() => setPage(current + 1)}
                className="rounded-lg border border-[#E1E5EF] px-3 py-1.5 font-medium disabled:opacity-40 dark:border-white/10"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
