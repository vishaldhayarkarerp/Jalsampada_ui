"use client";

import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import UtilDropDownButton from "../table-util-buttons/UtilDropDownButton";
import { isSameDay } from "@/utils/CurrencyUtils";
import { DateRange } from "react-day-picker";

export interface DateRangePickerProps {
  dateProps: {
    date: DateRange | undefined;
    setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
  };
}

const CalendarIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Icons/calendar">
        <path
          id="Vector"
          d="M3.3335 5.83333C3.3335 5.3913 3.50909 4.96738 3.82165 4.65482C4.13421 4.34226 4.55814 4.16666 5.00016 4.16666H15.0002C15.4422 4.16666 15.8661 4.34226 16.1787 4.65482C16.4912 4.96738 16.6668 5.3913 16.6668 5.83333V15.8333C16.6668 16.2754 16.4912 16.6993 16.1787 17.0118C15.8661 17.3244 15.4422 17.5 15.0002 17.5H5.00016C4.55814 17.5 4.13421 17.3244 3.82165 17.0118C3.50909 16.6993 3.3335 16.2754 3.3335 15.8333V5.83333Z"
          stroke="#6B7280"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_2"
          d="M13.3335 2.5V5.83333"
          stroke="#6B7280"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_3"
          d="M6.6665 2.5V5.83333"
          stroke="#6B7280"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_4"
          d="M3.3335 9.16666H16.6668"
          stroke="#6B7280"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_5"
          d="M9.1665 12.5H9.99984"
          stroke="#6B7280"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_6"
          d="M10 12.5V15"
          stroke="#6B7280"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateProps: { date, setDate },
}) => {
  const isSameDayRange =
    date?.from && date?.to && isSameDay({ from: date.from, to: date.to });
  return (
    <div className={cn("cursor-pointer grid gap-2")}>
      <Popover>
        <PopoverTrigger asChild>
          <UtilDropDownButton
            id="date"
            leadingIcon={<CalendarIcon />}
            label={
              // FIX: Corrected the label logic to display the 'to' date when date.to exists
              date?.from ? ( // Check if 'from' date exists
                date.to ? ( // If 'from' exists, check if 'to' date exists
                  isSameDayRange ? ( // If both exist, check if they are the same day
                    format(date.from, "eee, LLL dd yyyy") // If same day, display only 'from' date
                  ) : (
                    // If different days, display the date range "from - to"
                    `${format(date.from, "eee, LLL dd yyyy")} - ${format(date.to, "eee, LLL dd yyyy")}`
                  )
                ) : (
                  // If 'from' exists but 'to' does NOT exist (selecting start of range)
                  format(date.from, "eee, LLL dd yyyy") // Display only 'from' date
                )
              ) : (
                // If 'from' does NOT exist (no date selected)
                "Pick a date" // Display default placeholder
              )
            }
            className={`${
              date?.from &&
              date.to &&
              !isSameDay({ from: date.from, to: date.to })
                ? "text-primary border-primary bg-secondary-hover"
                : ""
            }`}
            isActive={!!date?.from}
            isDatePicker={true}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from || undefined}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;
