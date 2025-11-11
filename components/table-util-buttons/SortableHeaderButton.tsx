import React from "react";
import { Button } from "../ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Define types for the props
interface SortableHeaderButtonProps {
  column: {
    id: string;
    toggleSorting: (desc: boolean) => void;
    getIsSorted: () => "asc" | "desc" | false; 
  };
  label: string;
  sortedProps: {
    sortedColumn: string | null;
    setSortedColumn: (columnId: string) => void;
  };
  className?: string;
  onSortChange?: (sort: { id: string; desc: boolean }) => void;
}

const SortableHeaderButton: React.FC<SortableHeaderButtonProps> = ({
  column,
  label,
  sortedProps: { sortedColumn, setSortedColumn },
  className,
  onSortChange,
}) => {
  const handleSort = () => {
    const currentSort = column.getIsSorted();
    const nextDesc = currentSort === "asc" ? true : false;
    
    setSortedColumn(column.id);
    
    if (onSortChange) {
      // Use external sorting when available
      onSortChange({
        id: column.id,
        desc: nextDesc,
      });
    } else {
      // Use internal table sorting
      column.toggleSorting(nextDesc);
    }
  };

  return (
    <Button
      variant="ghost"
      className={cn(`p-0 hover:bg-transparent`, className)}
      onClick={handleSort}
    >
      {label}
      {sortedColumn === column.id ? (
        column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <></>
      )}
    </Button>
  );
};

export default SortableHeaderButton;
