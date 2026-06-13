import { useLanguage } from "@/contexts/LanguageContext";
import { getTopicDisplayName } from "@/data/topicTranslations";

interface TopicBadgeProps {
  topic: string;
}

export default function TopicBadge({ topic }: TopicBadgeProps) {
  const { lang } = useLanguage();

  // Assign color based on topic category (uses English key for logic)
  const getColor = (t: string) => {
    if (t.startsWith("J")) return "bg-sky-50 text-sky-700 border-sky-200";
    if (t.startsWith("S")) return "bg-violet-50 text-violet-700 border-violet-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${getColor(topic)} max-w-[200px] truncate`}>
      {getTopicDisplayName(topic, lang)}
    </span>
  );
}
