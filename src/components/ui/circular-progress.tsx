interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: "success" | "warning" | "destructive" | "info" | "primary";
  label?: string;
  sublabel?: string;
}

const colorMap = {
  success: "hsl(152, 65%, 35%)",
  warning: "hsl(38, 92%, 50%)",
  destructive: "hsl(0, 72%, 51%)",
  info: "hsl(205, 85%, 50%)",
  primary: "hsl(152, 65%, 28%)",
};

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  color = "primary",
  label,
  sublabel,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      {sublabel && (
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          {sublabel}
        </span>
      )}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(215, 20%, 92%)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorMap[color]}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{value}%</span>
        </div>
      </div>
      {label && (
        <span className="text-xs text-muted-foreground font-medium">
          {label}
        </span>
      )}
    </div>
  );
}
