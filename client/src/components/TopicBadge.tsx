interface TopicBadgeProps {
  topic: string;
}

export default function TopicBadge({ topic }: TopicBadgeProps) {
  // Assign color based on topic category
  const getColor = (t: string) => {
    if (t.startsWith("J")) return "bg-sky-50 text-sky-700 border-sky-200";
    if (t.startsWith("S") && t.includes("Algebra")) return "bg-violet-50 text-violet-700 border-violet-200";
    if (t.startsWith("S") && t.includes("Geometry")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (t.startsWith("S") && t.includes("Data")) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${getColor(topic)} max-w-[180px] truncate`}>
      {topic}
    </span>
  );
}
