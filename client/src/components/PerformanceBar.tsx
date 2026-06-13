interface PerformanceBarProps {
  value: number; // 0-100
}

export default function PerformanceBar({ value }: PerformanceBarProps) {
  const getColor = (v: number) => {
    if (v >= 75) return "bg-emerald-500";
    if (v >= 50) return "bg-sky-500";
    if (v >= 30) return "bg-amber-500";
    return "bg-red-500";
  };

  const getTextColor = (v: number) => {
    if (v >= 75) return "text-emerald-700";
    if (v >= 50) return "text-sky-700";
    if (v >= 30) return "text-amber-700";
    return "text-red-700";
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${getColor(value)} transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className={`font-mono text-xs font-medium w-12 text-right ${getTextColor(value)}`}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}
