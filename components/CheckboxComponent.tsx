import React from "react";
import { Checkbox } from "./ui/checkbox"

interface CheckboxComponentProps {
  id?: string;
  tabIndex?: number;
  label: string;
}

const CheckboxComponent: React.FC<CheckboxComponentProps> = ({ label }) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="checkbox-custom" />
      <label
        htmlFor="checkbox-custom"
        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer hover:text-secondary"
      >
        {label}
      </label>
    </div>
  );
};

export default CheckboxComponent;
