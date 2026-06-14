/*
 * MC Answer Rate Lookup Page
 * Design: Clean card-based layout with dropdown selectors for year and question number.
 * Shows correct answer, answer rate, option distribution bar chart, topic badge, and solution.
 */

import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import dseData from "@/data/dseData.json";
import TopicBadge from "@/components/TopicBadge";
import { getTopicDisplayName } from "@/data/topicTranslations";

const paper2 = dseData.paper2 as Record<string, Array<{ q: number; ans: string; A: number; B: number; C: number; D: number }>>;
const paper2Topics = dseData.paper2_topics as Record<string, Array<{ topic: string; questions: string }>>;

const YEARS = Object.keys(paper2).sort((a, b) => Number(b) - Number(a));
const QUESTIONS = Array.from({ length: 45 }, (_, i) => i + 1);

export default function MCLookupPage() {
  const { lang, t } = useLanguage();
  const [selectedYear, setSelectedYear] = useState(YEARS[0]);
  const [selectedQ, setSelectedQ] = useState(1);

  // Get question data
  const questionData = useMemo(() => {
    const yearData = paper2[selectedYear];
    if (!yearData) return null;
    return yearData.find(q => q.q === selectedQ) || null;
  }, [selectedYear, selectedQ]);

  // Get topic for this question
  const questionTopic = useMemo(() => {
    const topicsForYear = paper2Topics[selectedYear];
    if (!topicsForYear) return null;
    for (const t of topicsForYear) {
      const qNums = t.questions.split(",").map(s => s.trim());
      if (qNums.includes(String(selectedQ))) {
        return t.topic;
      }
    }
    return null;
  }, [selectedYear, selectedQ]);


  const options: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container max-w-3xl py-8 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {lang === "zh" ? "MC 答對率查詢器" : "MC Answer Rate Lookup"}
          </h1>
          <p className="text-slate-500">
            {lang === "zh"
              ? "選擇年份和題號，即時查看答對率、選項分佈及題解"
              : "Select year and question number to view answer rate, option distribution and solution"}
          </p>
        </motion.div>

        {/* Selector Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Search className="w-5 h-5 text-sky-500" />
            <h2 className="font-semibold text-slate-800">
              {lang === "zh" ? "查詢條件" : "Search Criteria"}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Year Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                {lang === "zh" ? "年份" : "Year"}
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all cursor-pointer"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Question Number Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                {lang === "zh" ? "題號" : "Question"}
              </label>
              <select
                value={selectedQ}
                onChange={(e) => setSelectedQ(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all cursor-pointer"
              >
                {QUESTIONS.map(q => (
                  <option key={q} value={q}>Q{q}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Result Card */}
        <AnimatePresence mode="wait">
          {questionData && (
            <motion.div
              key={`${selectedYear}-${selectedQ}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Answer & Rate Header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                      <span className="text-sky-600 font-bold text-sm">Q{selectedQ}</span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{selectedYear} Paper II</p>
                      <p className="font-semibold text-slate-800">
                        {lang === "zh" ? `第 ${selectedQ} 題` : `Question ${selectedQ}`}
                      </p>
                    </div>
                  </div>
                  {questionTopic && <TopicBadge topic={questionTopic} />}
                </div>

                {/* Correct Answer & Rate */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">
                        {lang === "zh" ? "正確答案" : "Correct Answer"}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-700">{questionData.ans}</p>
                  </div>
                  <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BarChart3 className="w-4 h-4 text-sky-500" />
                      <span className="text-xs font-medium text-sky-600">
                        {lang === "zh" ? "答對率" : "Correct Rate"}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-sky-700">
                      {questionData[questionData.ans as "A" | "B" | "C" | "D"]}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Option Distribution */}
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {lang === "zh" ? "選項分佈" : "Option Distribution"}
                </h3>
                <div className="space-y-3">
                  {options.map(opt => {
                    const pct = questionData[opt];
                    const isCorrect = opt === questionData.ans;
                    return (
                      <div key={opt} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isCorrect
                            ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {opt}
                        </div>
                        <div className="flex-1">
                          <div className="h-7 bg-slate-100 rounded-lg overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                              className={`h-full rounded-lg ${
                                isCorrect
                                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                  : "bg-gradient-to-r from-slate-300 to-slate-400"
                              }`}
                            />
                            <span className={`absolute inset-0 flex items-center px-3 text-xs font-semibold ${
                              pct > 40 ? "text-white" : "text-slate-600"
                            }`}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                        {isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        )}
                        {!isCorrect && pct > questionData[questionData.ans as "A" | "B" | "C" | "D"] && (
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>


            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
