import { useLanguage } from "@/contexts/LanguageContext";
import { useParams } from "wouter";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, FileText } from "lucide-react";
import dseData from "@/data/dseData.json";
import YearSelector from "@/components/YearSelector";
import PerformanceBar from "@/components/PerformanceBar";
import TopicBadge from "@/components/TopicBadge";
import { getTopicDisplayName } from "@/data/topicTranslations";

interface M2Question {
  q: string;
  full: number;
  mean: number;
  pct: number;
}

interface M2TopicEntry {
  topic: string;
  questions: string;
}

export default function M2Page() {
  const { t, lang } = useLanguage();
  const params = useParams<{ year?: string }>();
  const [selectedYear, setSelectedYear] = useState(params.year || "2025");

  const years = useMemo(() => dseData.available_years.m2, []);
  const yearData = useMemo(() => {
    return ((dseData.m2 as Record<string, M2Question[]>)[selectedYear] || []);
  }, [selectedYear]);

  // Get topic mapping for this year
  const topicMapping = useMemo(() => {
    const m2Topics = (dseData as any).m2_topics as Record<string, M2TopicEntry[]> | undefined;
    if (!m2Topics || !m2Topics[selectedYear]) return {};

    // Build a map: question number -> topic
    // Process normal topics first, then "Deleted / Out of Syllabus" entries last so they override
    const qToTopic: Record<string, string> = {};
    const normalEntries = m2Topics[selectedYear].filter(e => !e.topic.toLowerCase().includes('out of syllabus') && !e.topic.toLowerCase().includes('deleted'));
    const outEntries = m2Topics[selectedYear].filter(e => e.topic.toLowerCase().includes('out of syllabus') || e.topic.toLowerCase().includes('deleted'));

    const parseEntries = (entries: M2TopicEntry[], override: boolean) => {
      for (const entry of entries) {
        const questions = entry.questions;
        const parts = questions.split(",").map(s => s.trim());
        for (const part of parts) {
          const cleaned = part.replace(/^Q/, "").trim();
          if (!cleaned || cleaned === "-") continue;
          
          // Match patterns like "13a", "11b", "4a", "10c", "12b(i)", "12b(ii)"
          const match = cleaned.match(/^(\d+)([a-z])?(?:\(([^)]+)\))?/);
          if (match) {
            const qNum = match[1];
            const subPart = match[2] || "";
            const subSub = match[3] || "";
            
            let qKey = qNum;
            if (subPart) {
              qKey += `(${subPart})`;
            }
            if (subSub) {
              qKey += `(${subSub})`;
            }
            
            if (override || !qToTopic[qKey]) {
              qToTopic[qKey] = entry.topic;
            }
            // Only map main number if no sub-part specified (avoid overriding specific matches)
            if (!subPart && (override || !qToTopic[qNum])) {
              qToTopic[qNum] = entry.topic;
            }
          }
        }
      }
    };

    parseEntries(normalEntries, false);
    parseEntries(outEntries, true);
    return qToTopic;
  }, [selectedYear]);

  // Find topic for a question
  const getTopicForQuestion = (q: string): string | undefined => {
    // Try exact match first (e.g. "14(b)(i)")
    if (topicMapping[q]) return topicMapping[q];
    // Try parent sub-question (e.g. "14(b)" for "14(b)(i)")
    const parentMatch = q.match(/^(\d+\([a-z]\))/);
    if (parentMatch && topicMapping[parentMatch[1]]) return topicMapping[parentMatch[1]];
    // Try just the main question number
    const mainQ = q.match(/^(\d+)/);
    if (mainQ && topicMapping[mainQ[1]]) return topicMapping[mainQ[1]];
    return undefined;
  };

  // Stats
  const avgRate = yearData.length > 0
    ? (yearData.reduce((sum, q) => sum + q.pct, 0) / yearData.length).toFixed(1)
    : "0";
  const highest = yearData.length > 0 ? yearData.reduce((a, b) => a.pct > b.pct ? a : b) : null;
  const lowest = yearData.length > 0 ? yearData.reduce((a, b) => a.pct < b.pct ? a : b) : null;

  // PDF link
  const pdfLinks = dseData.m2_pdfs as Record<string, string> | undefined;
  const pdfUrl = pdfLinks?.[selectedYear];

  return (
    <div className="py-8 md:py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            {t("m2.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("m2.desc")}</p>
        </div>

        {/* Year Selector */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <YearSelector years={years} selected={selectedYear} onChange={setSelectedYear} />
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              {t("link.viewPaper")}
            </a>
          )}
        </div>

        {/* Stats Summary */}
        {yearData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="text-xs text-muted-foreground mb-1">{t("stats.avgRate")}</div>
              <div className="font-display font-bold text-xl text-primary">{avgRate}%</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="text-xs text-muted-foreground mb-1">{t("stats.totalQ")}</div>
              <div className="font-display font-bold text-xl text-foreground">{yearData.length}</div>
            </div>
            {highest && (
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  {t("stats.highest")}
                </div>
                <div className="font-display font-bold text-xl text-emerald-600">
                  Q{highest.q} ({highest.pct}%)
                </div>
              </div>
            )}
            {lowest && (
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  {t("stats.lowest")}
                </div>
                <div className="font-display font-bold text-xl text-red-600">
                  Q{lowest.q} ({lowest.pct}%)
                </div>
              </div>
            )}
          </div>
        )}

        {/* Questions Table */}
        {yearData.length > 0 ? (
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("table.question")}</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t("table.fullMarks")}</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t("table.mean")}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground min-w-[180px]">{t("table.performance")}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("table.topic")}</th>
                  </tr>
                </thead>
                <tbody>
                  {yearData.map((q, idx) => {
                    const topic = getTopicForQuestion(q.q);
                    return (
                      <motion.tr
                        key={q.q}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-medium text-foreground">Q{q.q}</td>
                        <td className="px-4 py-3 text-center font-mono text-muted-foreground">{q.full}</td>
                        <td className="px-4 py-3 text-center font-mono text-muted-foreground">{q.mean}</td>
                        <td className="px-4 py-3">
                          <PerformanceBar value={q.pct} />
                        </td>
                        <td className="px-4 py-3">
                          {topic ? (
                            <TopicBadge topic={topic} />
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            {t("misc.noData")}
          </div>
        )}
      </div>
    </div>
  );
}
