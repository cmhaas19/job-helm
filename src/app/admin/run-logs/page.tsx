"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  History,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

interface RunLog {
  id: string;
  user_id: string;
  trigger_type: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  stats: any;
  error: string | null;
  profiles: { email: string };
}

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: string;
  onSort: (field: string) => void;
  className?: string;
}

function SortableHeader({ label, field, currentSort, currentOrder, onSort, className }: SortableHeaderProps) {
  const isActive = currentSort === field;
  return (
    <th
      className={`px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground group ${className || ""}`}
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentOrder === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
        )}
      </span>
    </th>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "running") return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

const PAGE_SIZE = 50;

export default function AdminRunLogsPage() {
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("started_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const loadLogs = useCallback(async () => {
    const res = await fetch(`/api/admin/run-logs?page=${page}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  }

  // Client-side sort within current page
  const sorted = [...logs].sort((a, b) => {
    let aVal: any;
    let bVal: any;
    switch (sortBy) {
      case "started_at": aVal = new Date(a.started_at).getTime(); bVal = new Date(b.started_at).getTime(); break;
      case "status": aVal = a.status; bVal = b.status; break;
      case "trigger_type": aVal = a.trigger_type; bVal = b.trigger_type; break;
      case "duration_ms": aVal = a.duration_ms ?? 0; bVal = b.duration_ms ?? 0; break;
      case "user": aVal = a.profiles?.email || ""; bVal = b.profiles?.email || ""; break;
      case "jobsFound": aVal = a.stats?.jobsFound ?? 0; bVal = b.stats?.jobsFound ?? 0; break;
      case "jobsEvaluated": aVal = a.stats?.jobsEvaluated ?? 0; bVal = b.stats?.jobsEvaluated ?? 0; break;
      default: aVal = 0; bVal = 0;
    }
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  function formatDuration(ms: number | null) {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  const startRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 p-6 lg:p-8 pb-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            System Run Logs
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {total} run{total !== 1 ? "s" : ""} across all users
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 px-6 lg:px-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-3 py-3 border-b border-border">
              <div className="h-4 w-4 bg-muted animate-pulse rounded-full" />
              <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-36 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-12 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : total === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="py-16 text-center">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No runs yet</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto px-6 lg:px-8">
            <table className="w-full min-w-[800px]">
              <thead className="sticky top-0 bg-background z-10 border-b">
                <tr>
                  <th className="px-3 py-3 w-[40px]"></th>
                  <SortableHeader label="Status" field="status" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[110px]" />
                  <SortableHeader label="User" field="user" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[200px]" />
                  <SortableHeader label="Type" field="trigger_type" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[110px]" />
                  <SortableHeader label="Started" field="started_at" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[160px]" />
                  <SortableHeader label="Duration" field="duration_ms" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[100px]" />
                  <SortableHeader label="Found" field="jobsFound" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[80px]" />
                  <SortableHeader label="Evaluated" field="jobsEvaluated" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[100px]" />
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Phase / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2.5">
                      <StatusIcon status={log.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        variant={
                          log.status === "completed"
                            ? "strong"
                            : log.status === "running"
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-muted-foreground truncate">
                        {log.profiles?.email || log.user_id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-muted-foreground">
                        {log.trigger_type === "scheduled" ? "Scheduled" : "On-Demand"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.started_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(log.duration_ms)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm font-medium">
                        {log.stats?.jobsFound ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm font-medium">
                        {log.stats?.jobsEvaluated ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {log.error ? (
                        <span className="text-xs text-destructive line-clamp-1">{log.error}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground capitalize whitespace-nowrap">
                          {log.stats?.phase?.replace(/_/g, " ") || "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fixed footer */}
          <div className="shrink-0 border-t bg-background px-6 lg:px-8 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {startRow}–{endRow} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
