import { useLanguage } from "@/contexts/LanguageContext";
import { getTopicDisplayName } from "@/data/topicTranslations";
import { AlertTriangle } from "lucide-react";

interface TopicBadgeProps {
  topic: string;
}

export default function TopicBadge({ topic }: TopicBadgeProps) {
  const { lang } = useLanguage();

  const isOutOfSyllabus =
    topic.toLowerCase().includes("out of syllabus") ||
    topic.toLowerCase().includes("deleted");

  // Assign color based on topic category
  const getColor = (t: string) => {
    if (isOutOfSyllabus) return "bg-red-50 text-red-700 border-red-300";
    if (t.startsWith("J")) return "bg-sky-50 text-sky-700 border-sky-200";
    if (t.startsWith("S")) return "bg-violet-50 text-violet-700 border-violet-200";
    if (/^\d/.test(t)) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  if (isOutOfSyllabus) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${getColor(topic)}`}>
        <AlertTriangle className="w-3 h-3" />
        {lang === "zh" ? "不在課程範圍" : "Out C"}
      </span>
    );
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${getColor(topic)} max-w-[200px] truncate`}>
      {getTopicDisplayName(topic, lang)}
    </span>
  );
}
