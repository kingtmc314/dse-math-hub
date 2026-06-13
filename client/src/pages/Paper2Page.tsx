import { useLanguage } from "@/contexts/LanguageContext";
import { useParams } from "wouter";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import dseData from "@/data/dseData.json";
import YearSelector from "@/components/YearSelector";
import TopicBadge from "@/components/TopicBadge";

interface Paper2Question {
  q: number;
  ans: string;
  A: number;
  B: number;
  C: number;
  D: number;
}

export default function Paper2Page() {
  const { t, lang } = useLanguage();
  const params = useParams<{ year?: string }>();
  const [selectedYear, setSelectedYear] = useState(params.year || "2025");

  const years = useMemo(() => dseData.available_years.paper2, []);
  const yearData = useMemo(() => {
    return ((dseData.paper2 as Record<string, Paper2Question[]>)[selectedYear] || []);
  }, [selectedYear]);

  const topics = useMemo(() => {
    return (dseData.paper2_topics as Record<string, Array<{ topic: string; questions: string }>>)[selectedYear] || [];
  }, [selectedYear]);

  const pdfId = (dseData.paper2_pdfs as Record<string, string>)[selectedYear];
  const pdfUrl = pdfId ? `https://drive.google.com/file/d/${pdfId}/view` : null;

  const solutionUrl = (dseData.mathseasy_links as Record<string, string>)[selectedYear];

  // Stats
  const avgRate = yearData.length > 0
    ? (yearData.reduce((sum, q) => {
        const correctRate = q[q.ans as keyof Pick<Paper2Question, "A" | "B" | "C" | "D">] || 0;
        return sum + correctRate;
      }, 0) / yearData.length).toFixed(1)
    : "0";

  // Find topic for a question number
  const getTopicForQuestion = (qNum: number) => {
    for (const t of topics) {
      const tqStr = String(t.questions);
      const nums = tqStr.split(",").map(s => s.trim());
      if (nums.includes(String(qNum))) return t.topic;
      // Check ranges like "1-3"
      for (const n of nums) {
        if (n.includes("-")) {
          const [start, end] = n.split("-").map(Number);
          if (qNum >= start && qNum <= end) return t.topic;
        }
        if (Number(n) === qNum) return t.topic;
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
            {t("paper2.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("paper2.desc")}</p>
        </div>

        {/* Year Selector + Actions */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <YearSelector years={years} selected={selectedYear} onChange={setSelectedYear} />
          <div className="flex gap-2">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-border/60 hover:bg-muted transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t("link.viewPaper")}
              </a>
            )}
            {solutionUrl && (
              <a
                href={solutionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t("link.viewSolution")}
              </a>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        {yearData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="text-xs text-muted-foreground mb-1">{t("stats.avgRate")}</div>
              <div className="font-display font-bold text-xl text-primary">{avgRate}%</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="text-xs text-muted-foreground mb-1">{t("stats.totalQ")}</div>
              <div className="font-display font-bold text-xl text-foreground">{yearData.length}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="text-xs text-muted-foreground mb-1">{lang === "zh" ? "年份" : "Year"}</div>
              <div className="font-display font-bold text-xl text-foreground">{selectedYear}</div>
            </div>
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
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t("table.answer")}</th>
                    <th className="text-center px-3 py-3 font-medium text-muted-foreground">A</th>
                    <th className="text-center px-3 py-3 font-medium text-muted-foreground">B</th>
                    <th className="text-center px-3 py-3 font-medium text-muted-foreground">C</th>
                    <th className="text-center px-3 py-3 font-medium text-muted-foreground">D</th>
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
                        transition={{ delay: idx * 0.015 }}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-medium text-foreground">Q{q.q}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-mono font-bold text-sm">
                            {q.ans}
                          </span>
                        </td>
                        {(["A", "B", "C", "D"] as const).map((opt) => (
                          <td key={opt} className="px-3 py-3 text-center">
                            <MCOptionCell
                              value={q[opt]}
                              isCorrect={q.ans === opt}
                            />
                          </td>
                        ))}
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

function MCOptionCell({ value, isCorrect }: { value: number; isCorrect: boolean }) {
  const getBarColor = (v: number, correct: boolean) => {
    if (correct) return "bg-emerald-500";
    if (v > 30) return "bg-red-400";
    return "bg-gray-300";
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${getBarColor(value, isCorrect)}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className={`font-mono text-xs ${isCorrect ? "font-bold text-emerald-700" : "text-muted-foreground"}`}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}
