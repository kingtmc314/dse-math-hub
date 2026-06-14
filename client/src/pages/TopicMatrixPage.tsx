import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Grid3X3, BookOpen, Calculator, Sigma, ChevronLeft, ChevronRight } from "lucide-react";
import dseData from "@/data/dseData.json";
import { getTopicDisplayName, getTopicSortKey } from "@/data/topicTranslations";

type PaperType = "paper1" | "paper2" | "m2";

const YEARS = [
  "2012", "2013", "2014", "2015", "2016", "2017", "2018",
  "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"
];

export default function TopicMatrixPage() {
  const { lang } = useLanguage();
  const [activePaper, setActivePaper] = useState<PaperType>("paper1");
  const tableRef = useRef<HTMLDivElement>(null);

  // Build matrix data: for each topic, what questions appear in each year
  const matrixData = useMemo(() => {
    const topicSet = new Set<string>();
    const matrix: Record<string, Record<string, string>> = {};

    if (activePaper === "paper2") {
      // Paper 2: new flat format {year: {q: topic_name}}
      const p2Source = dseData.paper2_topics as Record<string, Record<string, string>>;
      for (const yearTopicMap of Object.values(p2Source)) {
        for (const topicName of Object.values(yearTopicMap)) topicSet.add(topicName);
      }
      const sortedTopics = Array.from(topicSet).sort((a, b) => {
        const catA = a.startsWith("J") ? 0 : a.startsWith("S") ? 1 : 2;
        const catB = b.startsWith("J") ? 0 : b.startsWith("S") ? 1 : 2;
        if (catA !== catB) return catA - catB;
        return getTopicSortKey(a) - getTopicSortKey(b);
      });
      for (const topic of sortedTopics) matrix[topic] = {};
      for (const year of YEARS) {
        const yearTopicMap = p2Source[year] || {};
        for (const [qNum, topicName] of Object.entries(yearTopicMap)) {
          if (matrix[topicName] !== undefined) {
            if (matrix[topicName][year]) matrix[topicName][year] += ", " + qNum;
            else matrix[topicName][year] = qNum;
          }
        }
      }
      return { sortedTopics, matrix };
    }

    // Paper 1 and M2: old array format {year: [{topic, questions}]}
    let topicsSource: Record<string, Array<{ topic: string; questions: string }>>;
    if (activePaper === "paper1") {
      topicsSource = dseData.paper1_topics as any;
    } else {
      topicsSource = (dseData as any).m2_topics as any || {};
    }

    for (const yearTopics of Object.values(topicsSource)) {
      for (const t of yearTopics) topicSet.add(t.topic);
    }

    const sortedTopics = Array.from(topicSet).sort((a, b) => {
      if (activePaper === "m2") return getTopicSortKey(a) - getTopicSortKey(b);
      const catA = a.startsWith("J") ? 0 : a.startsWith("S") ? 1 : 2;
      const catB = b.startsWith("J") ? 0 : b.startsWith("S") ? 1 : 2;
      if (catA !== catB) return catA - catB;
      return getTopicSortKey(a) - getTopicSortKey(b);
    });

    for (const topic of sortedTopics) matrix[topic] = {};
    for (const year of YEARS) {
      const yearData = topicsSource[year] || [];
      for (const entry of yearData) {
        if (matrix[entry.topic] !== undefined) {
          if (matrix[entry.topic][year]) matrix[entry.topic][year] += ", " + entry.questions;
          else matrix[entry.topic][year] = entry.questions;
        }
      }
    }

    return { sortedTopics, matrix };
  }, [activePaper]);

  // Count how many years each topic appears
  const topicFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const topic of matrixData.sortedTopics) {
      freq[topic] = YEARS.filter(y => matrixData.matrix[topic][y]).length;
    }
    return freq;
  }, [matrixData]);

  const scrollTable = (direction: "left" | "right") => {
    if (tableRef.current) {
      const scrollAmount = 200;
      tableRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {lang === "zh" ? "課題考題分佈" : "Topic-Question Matrix"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            {lang === "zh"
              ? "顯示每個課題在各年份出現的題號，方便針對性溫習"
              : "Shows which questions appear for each topic across all years for targeted revision"}
          </p>
        </motion.div>

        {/* Paper Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActivePaper("paper1")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activePaper === "paper1"
                ? "bg-teal-600 text-white shadow-md shadow-teal-200"
                : "bg-white text-gray-600 border border-gray-200 hover:border-teal-300 hover:text-teal-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {lang === "zh" ? "卷一 (長題目)" : "Paper 1 (Long Q)"}
          </button>
          <button
            onClick={() => setActivePaper("paper2")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activePaper === "paper2"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-200"
                : "bg-white text-gray-600 border border-gray-200 hover:border-cyan-300 hover:text-cyan-700"
            }`}
          >
            <Calculator className="w-4 h-4" />
            {lang === "zh" ? "卷二 (MC)" : "Paper 2 (MC)"}
          </button>
          <button
            onClick={() => setActivePaper("m2")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activePaper === "m2"
                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                : "bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-700"
            }`}
          >
            <Sigma className="w-4 h-4" />
            {lang === "zh" ? "延伸 M2" : "M2"}
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-teal-100 border border-teal-300"></span>
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
          <button
            onClick={() => scrollTable("left")}
            className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => scrollTable("right")}
            className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Matrix Table */}
        <motion.div
          key={activePaper}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div ref={tableRef} className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-gray-50">
                  <th className="sticky left-0 z-20 bg-slate-50 px-3 py-3 text-left font-semibold text-gray-700 border-b border-r border-gray-200 min-w-[200px] max-w-[260px]">
                    {lang === "zh" ? "課題" : "Topic"}
                  </th>
                  <th className="sticky left-0 z-10 bg-slate-50 px-2 py-3 text-center font-semibold text-gray-500 border-b border-r border-gray-200 min-w-[40px]" style={{ left: "200px" }}>
                    {lang === "zh" ? "次" : "#"}
                  </th>
                  {YEARS.map(year => (
                    <th
                      key={year}
                      className="px-2 py-3 text-center font-semibold text-gray-600 border-b border-gray-200 min-w-[60px] whitespace-nowrap"
                    >
                      {year}
                    </th>
                  ))}
                </tr>
              </thead>
              {matrixData.sortedTopics.map((topic, idx) => {
                  const isJunior = topic.startsWith("J");
                  const isSenior = topic.startsWith("S");
                  const isOutOfSyllabus = topic === "Out of Syllabus" || topic === "Deleted / Out of Syllabus";
                  // Add section divider between J and S topics (only for compulsory)
                  const prevTopic = idx > 0 ? matrixData.sortedTopics[idx - 1] : null;
                  const showDivider = activePaper !== "m2" && prevTopic && (
                    (prevTopic.startsWith("J") && isSenior) ||
                    (prevTopic.startsWith("S") && isOutOfSyllabus)
                  );

                  return (
                    <tbody key={topic}>
                      {showDivider && (
                        <tr>
                          <td
                            colSpan={YEARS.length + 2}
                            className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200"
                          >
                            {isSenior
                              ? (lang === "zh" ? "高中課題" : "Senior Topics")
                              : (lang === "zh" ? "其他" : "Others")}
                          </td>
                        </tr>
                      )}
                      {idx === 0 && activePaper !== "m2" && isJunior && (
                        <tr>
                          <td
                            colSpan={YEARS.length + 2}
                            className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200"
                          >
                            {lang === "zh" ? "初中課題" : "Junior Topics"}
                          </td>
                        </tr>
                      )}
                      <tr
                        className="hover:bg-teal-50/30 transition-colors group"
                      >
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-teal-50/30 px-3 py-2 border-b border-r border-gray-100 font-medium text-gray-700 text-[11px] leading-tight transition-colors">
                          {getTopicDisplayName(topic, lang)}
                        </td>
                        <td
                          className="sticky bg-white group-hover:bg-teal-50/30 px-2 py-2 text-center border-b border-r border-gray-100 font-bold transition-colors"
                          style={{ left: "200px" }}
                        >
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                            topicFrequency[topic] >= 12
                              ? "bg-teal-100 text-teal-700"
                              : topicFrequency[topic] >= 8
                              ? "bg-cyan-100 text-cyan-700"
                              : topicFrequency[topic] >= 4
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {topicFrequency[topic]}
                          </span>
                        </td>
                        {YEARS.map(year => {
                          const questions = matrixData.matrix[topic][year];
                          return (
                            <td
                              key={year}
                              className={`px-1.5 py-2 text-center border-b border-gray-100 transition-colors ${
                                questions
                                  ? "bg-teal-50/60 group-hover:bg-teal-100/60"
                                  : "group-hover:bg-gray-50"
                              }`}
                            >
                              {questions ? (
                                <span className="text-[10px] font-medium text-teal-800 leading-tight block">
                                  {questions}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  );
                })}
            </table>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              {lang === "zh" ? "課題總數" : "Total Topics"}
            </p>
            <p className="text-xl font-bold text-gray-900">{matrixData.sortedTopics.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              {lang === "zh" ? "年份跨度" : "Year Span"}
            </p>
            <p className="text-xl font-bold text-gray-900">2012–2026</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              {lang === "zh" ? "每年必出" : "Every Year"}
            </p>
            <p className="text-xl font-bold text-teal-600">
              {matrixData.sortedTopics.filter(t => topicFrequency[t] >= YEARS.length).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              {lang === "zh" ? "高頻課題 (≥12年)" : "High Freq (≥12yr)"}
            </p>
            <p className="text-xl font-bold text-cyan-600">
              {matrixData.sortedTopics.filter(t => topicFrequency[t] >= 12).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
