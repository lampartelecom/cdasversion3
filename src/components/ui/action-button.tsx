import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "success" | "info" | "warning" | "accent";
  className?: string;
}

const variantStyles = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  success: "bg-success text-success-foreground hover:bg-success/90",
  info: "bg-info text-info-foreground hover:bg-info/90",
  warning: "bg-warning text-warning-foreground hover:bg-warning/90",
  accent: "bg-accent text-accent-foreground hover:bg-accent/90",
};

export function ActionButton({
  label,
  icon,
  onClick,
  variant = "primary",
  className,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "action-card w-full",
        variantStyles[variant],
        className
      )}
    >
      <div className="p-2 rounded-full bg-white/20">
        {icon}
      </div>
      <span className="text-xs font-semibold text-center leading-tight">
        {label}
      </span>
    </button>
  );
}
