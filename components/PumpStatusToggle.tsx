"use client";

import * as React from "react";

interface PumpStatusToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const PumpStatusToggle: React.FC<PumpStatusToggleProps> = ({
  checked = false,
  onChange,
  disabled = false,
  className = "",
}) => {
  const [isChecked, setIsChecked] = React.useState(checked);

  React.useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleToggle = () => {
    if (disabled) return;
    
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    onChange?.(newChecked);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative inline-flex flex-shrink-0 cursor-pointer rounded-full
          transition-all duration-250 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/40
          w-13 h-6 shadow-md border border-gray-200/50
          ${isChecked 
            ? "bg-emerald-500 border-emerald-400/50 shadow-emerald-500/20" 
            : "bg-red-500 border-red-400/50 shadow-red-500/20"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"}
          ${className}
        `}
        role="switch"
        aria-checked={isChecked}
      >
        <span className="sr-only">Pump Status Toggle</span>
        
        {/* Toggle Dot */}
        <span
          className={`
            pointer-events-none relative inline-block transform rounded-full
            bg-white shadow-md transition-all duration-250 ease-in-out
            w-5 h-5 top-0.5 ring-1 ring-gray-200/50
            ${isChecked ? "translate-x-7 ring-emerald-100/50" : "translate-x-0.5"}
          `}
        />
        
        {/* Subtle inner highlight */}
        <span className={`
          absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-0
          transition-opacity duration-250
          ${isChecked ? "opacity-100" : "opacity-0"}
        `} />
      </button>
      
      {/* Status Text */}
      <span className={`
        text-sm font-semibold transition-all duration-250 tracking-wide
        ${isChecked ? "text-emerald-700" : "text-red-600"}
      `}>
        {isChecked ? "START" : "STOP"}
      </span>
    </div>
  );
};
