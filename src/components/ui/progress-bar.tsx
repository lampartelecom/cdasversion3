import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  color?: "primary" | "success" | "info";
  className?: string;
  showAnimation?: boolean;
}

export function ProgressBar({
  value,
  color = "primary",
  className,
  showAnimation = false,
}: ProgressBarProps) {
  const colorClasses = {
    primary: "bg-primary",
    success: "bg-success",
    info: "bg-info",
  };

  return (
    <div className={cn("h-1.5 bg-secondary rounded-full overflow-hidden", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-1000 ease-out",
          colorClasses[color],
          showAnimation && "animate-pulse"
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
