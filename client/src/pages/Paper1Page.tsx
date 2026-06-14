import { useLanguage } from "@/contexts/LanguageContext";
import { useParams } from "wouter";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import dseData from "@/data/dseData.json";
import YearSelector from "@/components/YearSelector";
import PerformanceBar from "@/components/PerformanceBar";
import TopicBadge from "@/components/TopicBadge";

export default function Paper1Page() {
  const { t, lang } = useLanguage();
  const params = useParams<{ year?: string }>();
  const [selectedYear, setSelectedYear] = useState(params.year || "2025");

  const years = useMemo(() => dseData.available_years.paper1, []);
  const yearData = useMemo(() => {
    return (dseData.paper1 as Record<string, Array<{ q: string; full: number; mean: number; pct: number }>>)[selectedYear] || [];
  }, [selectedYear]);

  const topics = useMemo(() => {
    return (dseData.paper1_topics as Record<string, Array<{ topic: string; questions: string }>>)[selectedYear] || [];
  }, [selectedYear]);

  // Stats
  const avgRate = yearData.length > 0
    ? (yearData.reduce((sum, q) => sum + q.pct, 0) / yearData.length).toFixed(1)
    : "0";
  const highest = yearData.length > 0 ? yearData.reduce((a, b) => a.pct > b.pct ? a : b) : null;
  const lowest = yearData.length > 0 ? yearData.reduce((a, b) => a.pct < b.pct ? a : b) : null;

  // Find topic for a question
  const getTopicForQuestion = (qStr: string) => {
    // Extract main question number (e.g. "7(a)" -> 7, "14(b)(i)" -> 14)
    const mainMatch = qStr.match(/^(\d+)/);
    if (!mainMatch) return null;
    const qNum = parseInt(mainMatch[1]);

    for (const t of topics) {
      const tqStr = String(t.questions);
      // Split by comma (not inside parentheses)
      const parts = tqStr.split(/,(?![^(]*\))/).map(s => s.trim());
      for (const part of parts) {
        // Extract leading number from each part
        const numMatch = part.match(/^(\d+)/);
        if (numMatch && parseInt(numMatch[1]) === qNum) {
          return t.topic;
        }
        // Handle ranges like "7-9"
        const cleaned = part.replace(/\([^)]*\)/g, "").trim();
        const rangeMatch = cleaned.match(/^(\d+)\s*-\s*(\d+)$/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1]);
          const end = parseInt(rangeMatch[2]);
          if (qNum >= start && qNum <= end) return t.topic;
        }
      }
    }
    return null;
  };

  return (
    <div className="py-8 md:py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            {t("paper1.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("paper1.desc")}</p>
        </div>

        {/* Year Selector */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <YearSelector
            years={years}
            selected={selectedYear}
            onChange={setSelectedYear}
          />
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground min-w-[200px]">{t("table.performance")}</th>
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
                          {topic && <TopicBadge topic={topic} />}
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
