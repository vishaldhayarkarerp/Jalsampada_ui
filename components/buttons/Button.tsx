import React, { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import "./Button.css";

type ButtonVariant = "button" | "icon" | "link-button" | "outline";
type ButtonType =
  | "primary-button"
  | "secondary-button"
  | "danger-button"
  | "link-primary"
  | string;
type ButtonSize = "button-small" | "button-medium" | "button-large" | string;

interface ButtonProps {
  variant?: ButtonVariant;
  type?: ButtonType;
  size?: ButtonSize;
  iconSrc?: string;
  alt?: string;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}
const Button: React.FC<ButtonProps> = ({
  variant = "button",
  type = "primary-button",
  size = "button-small",
  iconSrc = "../app/assets/icons/Leading Icon.svg",
  alt = "icon",
  children,
  onClick,
  className = "",
  disabled = false,
}) => {
  const isIcon = variant === "icon";
  const isLink = variant === "link-button";
  const isOutline = variant === "outline";

  return (
    <button
      className={cn(
        `button ${isIcon ? "icon" : ""} ${isLink ? "link-button" : ""} ${
          isOutline ? `outline-${type}` : type
        } ${size} !w-fit`,
        disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {isIcon && iconSrc ? (
        <Image src={iconSrc} alt={alt} width={24} height={24} />
      ) : (
        <span className="flex items-center gap-2">{children}</span>
      )}
    </button>
  );
};

export default Button;
