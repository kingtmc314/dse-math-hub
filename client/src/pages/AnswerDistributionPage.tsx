/*
 * Answer Distribution Analysis Page
 * Shows ABCD answer count tables for Total (45 questions), Section A (Q1-30), Section B (Q31-45)
 * Data is computed from dseData.json paper2 answers.
 */

import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Table2, TrendingUp } from "lucide-react";
import dseData from "@/data/dseData.json";

const paper2 = dseData.paper2 as Record<string, Array<{ q: number; ans: string; A: number; B: number; C: number; D: number }>>;
const YEARS = Object.keys(paper2).sort((a, b) => Number(a) - Number(b));
const OPTIONS: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

type SectionType = "total" | "secA" | "secB";

function computeDistribution(section: SectionType) {
  const result: Record<string, Record<string, number>> = {};
  for (const year of YEARS) {
    const questions = paper2[year];
    if (!questions) continue;
    const filtered = questions.filter(q => {
      if (section === "total") return true;
      if (section === "secA") return q.q >= 1 && q.q <= 30;
      if (section === "secB") return q.q >= 31 && q.q <= 45;
      return true;
    });
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const q of filtered) {
      const ans = q.ans.toUpperCase();
      if (counts[ans] !== undefined) counts[ans]++;
    }
    result[year] = counts;
  }
  return result;
}

const OPTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  B: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  C: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  D: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
};

function DistributionTable({ data, sectionLabel, expectedTotal }: { data: Record<string, Record<string, number>>; sectionLabel: string; expectedTotal: number }) {
  const { lang } = useLanguage();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center gap-2">
        <Table2 className="w-5 h-5 text-sky-500" />
        <h3 className="font-semibold text-slate-800">{sectionLabel}</h3>
        <span className="ml-auto text-xs text-slate-400">
          {lang === "zh" ? `每年 ${expectedTotal} 題` : `${expectedTotal} questions/year`}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-left font-semibold text-slate-600 sticky left-0 bg-slate-50 z-10 min-w-[60px]">
                {lang === "zh" ? "答案" : "Ans"}
              </th>
              {YEARS.map(year => (
                <th key={year} className="px-3 py-3 text-center font-medium text-slate-600 min-w-[52px]">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OPTIONS.map((opt, idx) => (
              <tr key={opt} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                <td className={`px-4 py-3 font-bold sticky left-0 z-10 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${OPTION_COLORS[opt].bg} ${OPTION_COLORS[opt].text} border ${OPTION_COLORS[opt].border}`}>
                    {opt}
                  </span>
                </td>
                {YEARS.map(year => {
                  const count = data[year]?.[opt] || 0;
                  return (
                    <td key={year} className="px-3 py-3 text-center font-medium text-slate-700">
                      {count}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AnswerDistributionPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<SectionType>("total");

  const totalDist = useMemo(() => computeDistribution("total"), []);
  const secADist = useMemo(() => computeDistribution("secA"), []);
  const secBDist = useMemo(() => computeDistribution("secB"), []);

  const tabs: Array<{ key: SectionType; label: string; labelEn: string }> = [
    { key: "total", label: "全卷 (Q1-45)", labelEn: "Total (Q1-45)" },
    { key: "secA", label: "Section A (Q1-30)", labelEn: "Section A (Q1-30)" },
    { key: "secB", label: "Section B (Q31-45)", labelEn: "Section B (Q31-45)" },
  ];

  const activeData = activeTab === "total" ? totalDist : activeTab === "secA" ? secADist : secBDist;
  const expectedTotal = activeTab === "total" ? 45 : activeTab === "secA" ? 30 : 15;

  // Compute insights
  const insights = useMemo(() => {
    const avgCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const year of YEARS) {
      for (const opt of OPTIONS) {
        avgCounts[opt] += activeData[year]?.[opt] || 0;
      }
    }
    for (const opt of OPTIONS) {
      avgCounts[opt] = Math.round((avgCounts[opt] / YEARS.length) * 10) / 10;
    }
    return avgCounts;
  }, [activeData]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container max-w-5xl py-8 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {lang === "zh" ? "答案分佈分析" : "Answer Distribution Analysis"}
          </h1>
          <p className="text-slate-500">
            {lang === "zh"
              ? "分析歷年 Paper II 各選項 (A/B/C/D) 作為正確答案的出現次數"
              : "Analyze the frequency of each option (A/B/C/D) as the correct answer across years"}
          </p>
        </motion.div>

        {/* Tab Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-1"
        >
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-180 ${
                activeTab === tab.key
                  ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
              style={{ transform: activeTab === tab.key ? "scale(1)" : "scale(0.98)" }}
            >
              {lang === "zh" ? tab.label : tab.labelEn}
            </button>
          ))}
        </motion.div>

        {/* Insights Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-4 gap-3 mb-6"
        >
          {OPTIONS.map(opt => (
            <div key={opt} className={`rounded-xl p-4 border ${OPTION_COLORS[opt].bg} ${OPTION_COLORS[opt].border}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className={`w-3.5 h-3.5 ${OPTION_COLORS[opt].text}`} />
                <span className={`text-xs font-medium ${OPTION_COLORS[opt].text}`}>
                  {lang === "zh" ? `${opt} 平均` : `Avg ${opt}`}
                </span>
              </div>
              <p className={`text-2xl font-bold ${OPTION_COLORS[opt].text}`}>
                {insights[opt]}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Distribution Table */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DistributionTable
            data={activeData}
            sectionLabel={
              lang === "zh"
                ? tabs.find(t => t.key === activeTab)!.label
                : tabs.find(t => t.key === activeTab)!.labelEn
            }
            expectedTotal={expectedTotal}
          />
        </motion.div>

        {/* Key Observation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5"
        >
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-800 mb-1">
                {lang === "zh" ? "規律觀察" : "Key Observation"}
              </h4>
              <p className="text-sm text-amber-700 leading-relaxed">
                {lang === "zh"
                  ? "歷年 DSE Paper II 的答案分佈非常均勻，全卷 45 題中 ABCD 各佔約 11-12 題。Section A (30 題) 各佔 7-8 題，Section B (15 題) 各佔 3-4 題。這表明考評局刻意維持答案分佈的平衡。"
                  : "The answer distribution across DSE Paper II is remarkably uniform. In the full paper (45 questions), each option appears approximately 11-12 times. Section A (30 questions) has 7-8 per option, and Section B (15 questions) has 3-4 per option. This indicates HKEAA deliberately maintains balanced answer distributions."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
