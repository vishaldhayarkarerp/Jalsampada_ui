"use client";
import { JSX, useEffect, useState } from "react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";

interface SelectInputProps {
  placeholder: string;
  selValue?: string | string[] | undefined;
  data?: { label: string; value: string }[];
  url?: string;
  promise?: () => Promise<any>;
  transformData?: (data: any[]) => { label: string; value: string }[];
  borderLess?: boolean;
  value?: string | string[];
  className?: string;
  size?: "sm" | "default";
  onValueChange?: (value: any) => void;
  multiple?: boolean;
}

function getLabelForValue(
  value: string | undefined,
  options: { label: string; value: string }[]
) {
  return options.find((opt) => opt.value === value)?.label || "";
}

export default function SelectInput({
  placeholder,
  data: localData,
  url,
  promise,
  transformData,
  borderLess = false,
  value,
  multiple,
  size = "default",
  onValueChange,
  selValue,
  className,
}: SelectInputProps): JSX.Element {
  const [selValues, setSelValues] = useState<string[]>(
    multiple && Array.isArray(value) ? value : []
  );
  const [options, setOptions] = useState(localData || []);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  // Ensure only one dropdown stays open at a time across the app
  useEffect(() => {
    const handleCloseAll = () => setOpen(false);
    // Use a global custom event to close other selects
    window.addEventListener("close-all-selects", handleCloseAll);
    return () => {
      window.removeEventListener("close-all-selects", handleCloseAll);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let serverData = [];

        if (promise) {
          const res = await promise();
          serverData = res;
        } else if (url) {
          const res = await fetch(url); // 🚫 No query string
          const json = await res.json();
          serverData = json || [];
        }

        const transformed = transformData
          ? transformData(serverData)
          : serverData;

        setOptions(transformed);
      } catch {
      }
    };

    if (url || promise) {
      fetchData();
    } else {
      setOptions(localData || []);
    }
  }, [url, localData, promise, transformData]);

  useEffect(() => {
    if (multiple && Array.isArray(value)) {
      setSelValues(value);
    } else if (multiple) {
      setSelValues([]);
    }
  }, [value, multiple]);

  const selectPlaceholder = multiple
    ? selValues.length > 0
      ? `${selValues.length} Selected`
      : placeholder
    : value
      ? getLabelForValue(value as string, options)
      : placeholder;

  return (
    <Select
      open={open}
      onOpenChange={(next) => {
        // When opening this select, ask others to close first
        if (next) {
          try {
            window.dispatchEvent(new CustomEvent("close-all-selects"));
          } catch {
            // no-op: window may be unavailable in some environments
          }
        }
        setOpen(next);
      }}
      value={multiple ? undefined : (value as string)}
      onValueChange={onValueChange}
      defaultValue={
        !multiple && typeof selValue === "string" ? selValue : undefined
      }
    >
      <SelectTrigger
        className={cn("w-full", borderLess && "border-0 shadow-none", className)}
      >
        {multiple ? (
          <span className="text-sm text-muted-foreground">
            {selectPlaceholder}
          </span>
        ) : (
          <SelectValue placeholder={placeholder}>
            {value ? getLabelForValue(value as string, options) : placeholder}
          </SelectValue>
        )}
        <Image src={'/assets/icons/CaretDownDark.svg'} height={16} width={16} alt="caret icon" />
      </SelectTrigger>

      {!multiple ? (
        <SelectContent position="popper" className="border border-[#D9D9E0] [&>div]:!px-0 [&>div]:!py-0 z-[300]">
          <div className="flex items-center border-b border-b-[#D9D9E0] px-3" cmdk-input-wrapper="">
            <svg className="mr-2 h-4 w-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {options
            ?.filter((opt) =>
              (opt?.label?.toLowerCase() || '').includes(search.toLowerCase()) ||
              (opt?.value?.toLowerCase() || '').includes(search.toLowerCase())
            )
            .map((opt, index) => (
              <SelectItem
                key={opt?.value + index}
                value={opt?.value || ''}
                className="h-9 cursor-pointer w-full px-4 py-2 flex text-[#1C2024] text-sm hover:bg-[#E6F4FE] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE]"
              >
                {opt?.label || ''}
              </SelectItem>
            ))}
          {options && options.length > 0 &&
            options.filter((opt) =>
              (opt?.label?.toLowerCase() || '').includes(search.toLowerCase()) ||
              (opt?.value?.toLowerCase() || '').includes(search.toLowerCase())
            ).length === 0 && (
              <div className="px-4 py-2 text-sm text-[#60646C]">No results found.</div>
            )}
        </SelectContent>
      ) : (
        <SelectContent position="popper" className="border border-[#D9D9E0] [&>div]:!px-0 [&>div]:!py-0 z-[300]">
          <Command>
            <CommandInput
              placeholder="Search"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="[&>div]:!px-0 [&>div]:!mx-0 [&>div]:!pb-2">
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup className="px-0 py-0">
                {/* All option - only show when more than 1 option */}
                {options.length > 0 && (
                  <CommandItem
                    key="all"
                    className="h-9 cursor-pointer w-full px-4 py-2 flex text-[#1C2024] text-sm hover:bg-[#E6F4FE] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE] border-b border-[#E5E7EB]"
                  >
                    <Checkbox
                      checked={selValues.length === options.length && options.length > 0}
                      onCheckedChange={(checked) => {
                        let updated: string[];
                        if (checked) {
                          updated = options.map(opt => opt?.value || '');
                        } else {
                          updated = [];
                        }
                        setSelValues(updated);
                        onValueChange?.(updated);
                      }}
                      id="select-all"
                    />
                    <label
                      className="pl-2 pr-4 cursor-pointer"
                      htmlFor="select-all"
                    >
                      All
                    </label>
                  </CommandItem>
                )}
                {options?.map((opt) => (
                  <CommandItem
                    key={opt?.value || ''}
                    className="h-9 cursor-pointer w-full px-4 py-2 flex text-[#1C2024] text-sm hover:bg-[#E6F4FE] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE]"
                  >
                    <Checkbox
                      checked={selValues.includes(opt?.value || '')}
                      onCheckedChange={(checked) => {
                        let updated = [...selValues];
                        if (checked) {
                          updated.push(opt?.value || '');
                        } else {
                          updated = updated.filter((v) => v !== (opt?.value || ''));
                        }
                        setSelValues(updated);
                        onValueChange?.(updated);
                      }}
                      id={opt?.label || ''}
                    />
                    <label
                      className="pl-2 pr-4 cursor-pointer"
                      htmlFor={opt?.label || ''}
                    >
                      {opt?.label || ''}
                    </label>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </SelectContent>
      )}
    </Select>
  );
}
