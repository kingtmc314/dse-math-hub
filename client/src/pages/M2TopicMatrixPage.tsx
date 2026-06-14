import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dseData from "@/data/dseData.json";
import { getTopicDisplayName, getTopicSortKey } from "@/data/topicTranslations";

const YEARS = [
  "2012", "2013", "2014", "2015", "2016", "2017", "2018",
  "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"
];

export default function M2TopicMatrixPage() {
  const { lang } = useLanguage();
  const tableRef = useRef<HTMLDivElement>(null);

  const m2Topics = (dseData as any).m2_topics as Record<string, Array<{ topic: string; questions: string }>> || {};

  const matrixData = useMemo(() => {
    const topicSet = new Set<string>();
    for (const yearTopics of Object.values(m2Topics)) {
      for (const t of yearTopics) {
        topicSet.add(t.topic);
      }
    }

    const sortedTopics = Array.from(topicSet).sort((a, b) => getTopicSortKey(a) - getTopicSortKey(b));

    const matrix: Record<string, Record<string, string>> = {};
    for (const topic of sortedTopics) {
      matrix[topic] = {};
    }

    for (const year of YEARS) {
      const yearData = m2Topics[year] || [];
      for (const entry of yearData) {
        if (matrix[entry.topic]) {
          if (matrix[entry.topic][year]) {
            matrix[entry.topic][year] += ", " + entry.questions;
          } else {
            matrix[entry.topic][year] = entry.questions;
          }
        }
      }
    }

    return { sortedTopics, matrix };
  }, []);

  const topicFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const topic of matrixData.sortedTopics) {
      freq[topic] = YEARS.filter(y => matrixData.matrix[topic][y]).length;
    }
    return freq;
  }, [matrixData]);

  const scrollTable = (direction: "left" | "right") => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  return (
    <div className="py-8 md:py-12">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="mb-6">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            {lang === "zh" ? "M2 課題考題分佈" : "M2 Topic-Question Matrix"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {lang === "zh" ? "顯示每個 M2 課題在各年份出現的題號" : "Shows which questions appear for each M2 topic across all years"}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-violet-100 border border-violet-300"></span>
            {lang === "zh" ? "有出題" : "Has questions"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-50 border border-gray-200"></span>
            {lang === "zh" ? "未出題" : "No questions"}
          </span>
          <span className="ml-auto text-muted-foreground/70">
            {lang === "zh"
              ? `共 ${matrixData.sortedTopics.length} 個課題 × ${YEARS.length} 年`
              : `${matrixData.sortedTopics.length} topics × ${YEARS.length} years`}
          </span>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-2 mb-2 justify-end">
          <button onClick={() => scrollTable("left")} className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={() => scrollTable("right")} className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Matrix Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div ref={tableRef} className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-violet-50/50 to-purple-50/50">
                  <th className="sticky left-0 z-20 bg-violet-50/80 px-3 py-3 text-left font-semibold text-gray-700 border-b border-r border-gray-200 min-w-[200px] max-w-[260px]">
                    {lang === "zh" ? "課題" : "Topic"}
                  </th>
                  <th className="sticky z-10 bg-violet-50/80 px-2 py-3 text-center font-semibold text-gray-500 border-b border-r border-gray-200 min-w-[40px]" style={{ left: "200px" }}>
                    {lang === "zh" ? "次" : "#"}
                  </th>
                  {YEARS.map(year => (
                    <th key={year} className="px-2 py-3 text-center font-semibold text-gray-600 border-b border-gray-200 min-w-[60px] whitespace-nowrap">
                      {year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.sortedTopics.map((topic) => (
                  <tr key={topic} className="hover:bg-violet-50/30 transition-colors group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-violet-50/30 px-3 py-2 border-b border-r border-gray-100 font-medium text-gray-700 text-[11px] leading-tight transition-colors">
                      {getTopicDisplayName(topic, lang)}
                    </td>
                    <td className="sticky bg-white group-hover:bg-violet-50/30 px-2 py-2 text-center border-b border-r border-gray-100 font-bold transition-colors" style={{ left: "200px" }}>
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                        topicFrequency[topic] >= 12 ? "bg-violet-100 text-violet-700" :
                        topicFrequency[topic] >= 8 ? "bg-purple-100 text-purple-700" :
                        topicFrequency[topic] >= 4 ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {topicFrequency[topic]}
                      </span>
                    </td>
                    {YEARS.map(year => {
                      const questions = matrixData.matrix[topic][year];
                      return (
                        <td key={year} className={`px-1.5 py-2 text-center border-b border-gray-100 transition-colors ${
                          questions ? "bg-violet-50/60 group-hover:bg-violet-100/60" : "group-hover:bg-gray-50"
                        }`}>
                          {questions ? (
                            <span className="text-[10px] font-medium text-violet-800 leading-tight block">{questions}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{lang === "zh" ? "課題總數" : "Total Topics"}</p>
            <p className="text-xl font-bold text-gray-900">{matrixData.sortedTopics.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{lang === "zh" ? "年份跨度" : "Year Span"}</p>
            <p className="text-xl font-bold text-gray-900">2012–2026</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{lang === "zh" ? "每年必出" : "Every Year"}</p>
            <p className="text-xl font-bold text-violet-600">{matrixData.sortedTopics.filter(t => topicFrequency[t] >= YEARS.length).length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{lang === "zh" ? "高頻課題 (≥12年)" : "High Freq (≥12yr)"}</p>
            <p className="text-xl font-bold text-purple-600">{matrixData.sortedTopics.filter(t => topicFrequency[t] >= 12).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
