"use client";
import React from "react";
import Image from "next/image";
// Define the types for the props
interface TableUtilFilterButtonProps {
  label: string;
  icon: string | any; // Can be string path or imported SVG object
  badgeCount?: number;
  onClick?: any
}

const TableUtilFilterButton: React.FC<TableUtilFilterButtonProps> = ({
  label,
  icon,
  badgeCount,
  onClick
}) => {
  // Handle both string paths and imported SVG objects
  const iconSrc = typeof icon === 'string' ? icon : icon.src || icon;
  
  return (
    <div className="w-fit cursor-pointer h-8 flex flex-row gap-2 rounded-full items-center border border-[#B9BBC6] bg-white px-3 py-2 text-xs" onClick={onClick} >
      <Image src={iconSrc} alt="Calendar icon" width={16} height={16} />
      <span className="font-medium">{label}</span>

      {badgeCount ? (
        <span className="rounded-full border border-[#8DA4EF] w-6 h-6 flex bg-[#F4FAFF] text-gray-600 items-center text-xs font-medium justify-center">
          {badgeCount}
        </span>
      ) : (
        <></>
      )}
    </div>
  );
};

export default TableUtilFilterButton;
