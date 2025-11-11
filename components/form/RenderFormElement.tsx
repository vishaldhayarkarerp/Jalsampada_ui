import { Checkbox } from "../ui/checkbox";
import SelectInput from "./Select";
import { Switch } from "../ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import React from "react";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

export type InputValueTypes = "text" | "number" | "email" | "password" | "date";

export type RenderFormElementProps = {
  name?: string;
  label?: string;
  value?: any;
  onChange: (value: any) => void;
  InputValueType?: InputValueTypes;
  inputType: "input" | "select" | "checkbox" | "switch" | "textarea" | "radio";
  data?: { label: string; value: any }[];
  multiple?: boolean;
  url?: string;
  promise?: () => Promise<any>;
  transformData?: (data: any) => any;
  labelClassName?: string;
  required?: boolean;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  radioGroupClass?: string;
  borderLess?: boolean;
  placeholder?: string;
  error?: string;

  readonly?: boolean;
  placeholderflag?: boolean;
};

const RenderFormElement: React.FC<RenderFormElementProps> = ({
  placeholder,
  label,
  value,
  onChange,
  inputType,
  InputValueType = "text",
  data,
  multiple,
  labelClassName,
  url,
  promise,
  transformData,
  required,
  min,
  max,
  allowNegative,
  radioGroupClass,
  borderLess,
  error,
  readonly,
  placeholderflag,
}) => {
  const effectivePlaceholder = placeholder || label;

  const renderInput = () => {
    if (label === "Effective from" || label === "Requisition Date") {
      const date = value ? new Date(value) : undefined;

      return (
        <div className="flex flex-col space-y-2">
          {readonly ? (
            <div
              className={`relative flex items-center ${borderLess ? "border-0" : "border border-[#D9D9E0] rounded-md"}`}
            >
              <input
                type="text"
                className="outline-none px-4 py-2 h-[40px] w-full"
                readOnly
                value={date ? format(date, "dd/MM/yyyy") : ""}
                placeholder="Pick a date"
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <div
                  className={`relative flex items-center cursor-pointer ${borderLess ? "border-0" : "border border-[#D9D9E0] rounded-md"}`}
                >
                  <input
                    type="text"
                    className="outline-none px-4 py-2 h-[40px] w-full cursor-pointer"
                    readOnly
                    value={date ? format(date, "dd/MM/yyyy") : ""}
                    placeholder="Pick a date"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    onChange(newDate);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      );
    }

    if (label === "Valid from/to") {
      const range = value || { from: new Date(), to: new Date() };

      return (
        <div className="flex flex-col space-y-2">
          <Popover>
            <PopoverTrigger asChild>
              <div
                className={`relative flex items-center cursor-pointer ${borderLess ? "border-0" : "border border-[#D9D9E0] rounded-md"
                  }`}
              >
                <input
                  type="text"
                  className="outline-none px-4 py-2 h-[40px] w-full cursor-pointer"
                  readOnly
                  value={
                    range?.from && range?.to
                      ? `${format(new Date(range.from), "dd/MM/yyyy")} - ${format(
                        new Date(range.to), "dd/MM/yyyy"
                      )}`
                      : ""
                  }
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={range}
                onSelect={(newRange) => {
                  if (newRange?.from && newRange?.to) {
                    onChange(newRange);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    return (
      <input
        type={InputValueType}
        placeholder={placeholderflag ? "" : "" + effectivePlaceholder}
        className={`outline-none px-4 py-2 h-[40px] w-full ${borderLess ? "border-0" : "border border-[#D9D9E0] rounded-md"
          }`}
        value={value || ""}
        min={typeof min !== "undefined" ? min : undefined}
        max={typeof max !== "undefined" ? max : undefined}
        onChange={(e) => {
          let newValue = e.target.value;

          // Enforce max value for number inputs
          if (InputValueType === "number" && typeof max !== "undefined" && max !== null) {
            const numValue = parseFloat(newValue);
            if (!isNaN(numValue) && numValue > max) {
              newValue = max.toString();
            }
          }

          onChange(newValue);
        }}
        onBlur={(e) => {
          // Additional validation on blur for number inputs
          if (InputValueType === "number" && typeof max !== "undefined" && max !== null) {
            const numValue = parseFloat(e.target.value);
            if (!isNaN(numValue) && numValue > max) {
              onChange(max.toString());
            }
          }
        }}
        readOnly={readonly}
        onKeyDown={(e) => {
          if (
            InputValueType === "number" &&
            ((!allowNegative &&
              (e.key === "-" || e.key === "e" || e.key === "E")) ||
              (allowNegative && (e.key === "e" || e.key === "E")))
          ) {
            e.preventDefault();
          }
        }}
      />
    );
  };

  const renderTextArea = () => (
    <textarea
      placeholder={"Enter " + effectivePlaceholder}
      className={`outline-none px-4 py-2 w-full resize-none min-h-[80px] ${borderLess ? "border-0" : "border border-[#D9D9E0] rounded-md"
        }`}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  return (
    <div className={`${labelClassName ?? ""}`}>
      {inputType !== "checkbox" &&
        inputType !== "switch" &&
        inputType !== "radio" && (
          <div className="text-sm mb-2 text-[#1C2024]">
            {label} {required && <span className="text-red-500">*</span>}
          </div>
        )}

      {inputType === "input" && renderInput()}

      {inputType === "textarea" && renderTextArea()}

      {inputType === "select" && (
        <SelectInput
          multiple={multiple}
          data={data || []}
          url={url}
          promise={promise}
          transformData={transformData}
          placeholder={placeholder || (!value ? `Select ${effectivePlaceholder}` : "Select")}
          value={value}
          selValue={value}
          onValueChange={onChange}
          borderLess={borderLess}
        />
      )}

      {inputType === "checkbox" && (
        <div
          className={`flex items-center gap-2 px-2 py-1`}
        >
          <Checkbox
            checked={value}
            onCheckedChange={onChange}
            id={`checkbox-${label}`}
          />
          <label
            className={`text-sm text-[#1C2024] ${labelClassName ?? ""}`}
            htmlFor={`checkbox-${label}`}
          >
            {label}
          </label>
        </div>
      )}

      {inputType === "switch" && (
        <div
          className={`flex items-center gap-2 px-2 py-1 `}
        >
          <Switch
            checked={value}
            onCheckedChange={onChange}
            id={`switch-${label}`}
          />
          <label
            className="text-xs font-medium text-[#1C2024]"
            htmlFor={`switch-${label}`}
          >
            {label}
          </label>
        </div>
      )}

      {inputType === "radio" && data && (
        <RadioGroup
          value={value}
          onValueChange={onChange}
          className={`${radioGroupClass || "flex gap-6"
            } px-2 py-1 `}
        >
          {data.map((item) => (
            <div key={item.value} className="flex items-center gap-2">
              <RadioGroupItem value={item.value} id={`radio-${item.value}`} />
              <label
                htmlFor={`radio-${item.value}`}
                className="text-sm text-[#1C2024]"
              >
                {item.label}
              </label>
            </div>
          ))}
        </RadioGroup>
      )}

      {error && (
        <div className="text-red-500 text-xs mt-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default RenderFormElement;
