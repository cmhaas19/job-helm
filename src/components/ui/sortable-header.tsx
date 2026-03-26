"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: string;
  onSort: (field: string) => void;
  className?: string;
}

export function SortableHeader({ label, field, currentSort, currentOrder, onSort, className }: SortableHeaderProps) {
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

export function useTableSort(defaultField: string, defaultOrder: string = "desc") {
  const [sortBy, setSortBy] = useState(defaultField);
  const [sortOrder, setSortOrder] = useState(defaultOrder);

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  }

  return { sortBy, sortOrder, handleSort } as const;
}
