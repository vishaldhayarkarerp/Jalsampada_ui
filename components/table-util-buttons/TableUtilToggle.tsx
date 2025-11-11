"use client";

import React, { Dispatch, SetStateAction } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Define types for the props
interface TableUtilToggleProps {
  label: string;
  inputProps: {
    checked: boolean;
    setChecked: Dispatch<SetStateAction<boolean>>;
  };
}

const TableUtilToggle: React.FC<TableUtilToggleProps> = ({ label, inputProps: { checked, setChecked } }) => {
  return (
    <div className="w-fit h-8 flex flex-row gap-2 rounded-full items-center border border-[#B9BBC6] bg-white px-3 py-2">
      <Switch
        id="toggle-switch"
        checked={checked}
        onClick={() => {
          setChecked((prev) => !prev);
        }}
      />
      <Label htmlFor="toggle-switch" className="cursor-pointer !text-xs">
        {label}
      </Label>
    </div>
  );
};

export default TableUtilToggle;
