"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  resume_text: string | null;
  created_at: string;
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "member" : "admin";
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    loadUsers();
  }

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  }

  const sorted = [...users].sort((a, b) => {
    let aVal: any;
    let bVal: any;
    switch (sortBy) {
      case "email": aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase(); break;
      case "full_name": aVal = (a.full_name || "").toLowerCase(); bVal = (b.full_name || "").toLowerCase(); break;
      case "role": aVal = a.role; bVal = b.role; break;
      case "created_at": aVal = new Date(a.created_at).getTime(); bVal = new Date(b.created_at).getTime(); break;
      default: aVal = 0; bVal = 0;
    }
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 p-6 lg:p-8 pb-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 px-6 lg:px-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-3 py-3 border-b border-border">
              <div className="h-4 w-40 bg-muted animate-pulse rounded" />
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="py-16 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No users</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto px-6 lg:px-8">
            <table className="w-full min-w-[600px]">
              <thead className="sticky top-0 bg-background z-10 border-b">
                <tr>
                  <SortableHeader label="Email" field="email" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Name" field="full_name" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[180px]" />
                  <SortableHeader label="Role" field="role" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[100px]" />
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[80px]">Resume</th>
                  <SortableHeader label="Joined" field="created_at" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[120px]" />
                  <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-[100px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2.5">
                      <span className="text-sm font-medium">{user.email}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-muted-foreground">
                        {user.full_name || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        variant={user.role === "admin" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      {user.resume_text ? (
                        <Badge variant="strong" className="text-xs">Yes</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRole(user.id, user.role)}
                      >
                        {user.role === "admin" ? "Demote" : "Promote"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="shrink-0 border-t bg-background px-6 lg:px-8 py-3">
            <span className="text-sm text-muted-foreground">
              {users.length} user{users.length !== 1 ? "s" : ""}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
