// components/TimeAgo.tsx
import React, { useState, useEffect } from "react";
import { formatTimeAgo, formatFullTimestamp, cn } from "@/lib/utils";

interface TimeAgoProps {
  date: string | undefined;
  className?: string;
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState(formatTimeAgo(date));

  useEffect(() => {
    if (!date) return;

    // Update every minute
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(date));
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [date]);

  if (!date) return <span className="text-gray-400">—</span>;

  return (
    <span
      title={formatFullTimestamp(date)} // Native browser tooltip for the full date
      className={cn(
        "text-xs text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap",
        className
      )}
    >
      {timeAgo}
    </span>
  );
}