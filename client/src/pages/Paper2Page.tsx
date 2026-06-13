import { useLanguage } from "@/contexts/LanguageContext";
import { useParams } from "wouter";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, CheckCircle2, ChevronDown, ExternalLink } from "lucide-react";
import dseData from "@/data/dseData.json";
import solutionsData from "@/data/solutions.json";
import YearSelector from "@/components/YearSelector";
import TopicBadge from "@/components/TopicBadge";
import { SolutionBlock } from "@/components/LatexRenderer";

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
  const [expandedQ, setExpandedQ] = useState<Set<number>>(new Set());

  const years = useMemo(() => dseData.available_years.paper2, []);
  const yearData = useMemo(() => {
    return ((dseData.paper2 as Record<string, Paper2Question[]>)[selectedYear] || []);
  }, [selectedYear]);

  const topics = useMemo(() => {
    return (dseData.paper2_topics as Record<string, Array<{ topic: string; questions: string }>>)[selectedYear] || [];
  }, [selectedYear]);

  const solutionUrl = (dseData.mathseasy_links as Record<string, string>)?.[selectedYear];

  // Get solutions for selected year
  const yearSolutions = useMemo(() => {
    return (solutionsData as Record<string, Record<string, { answer: string; pct: number | null; solution_text: string; latex: string[] }>>)[selectedYear] || {};
  }, [selectedYear]);

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

  const toggleExpand = (qNum: number) => {
    setExpandedQ(prev => {
      const next = new Set(prev);
      if (next.has(qNum)) next.delete(qNum);
      else next.add(qNum);
      return next;
    });
  };

  // Reset expanded when year changes
  useMemo(() => {
    setExpandedQ(new Set());
  }, [selectedYear]);

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
          {solutionUrl && (
            <a
              href={solutionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {lang === "zh" ? "完整題解 (mathseasy.hk)" : "Full Solutions (mathseasy.hk)"}
            </a>
          )}
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

        {/* Questions List with Collapsible Solutions */}
        {yearData.length > 0 ? (
          <div className="space-y-2">
            {yearData.map((q, idx) => {
              const topic = getTopicForQuestion(q.q);
              const solution = yearSolutions[String(q.q)];
              const hasSolution = solution && (solution.latex.length > 0 || solution.solution_text);
              const isExpanded = expandedQ.has(q.q);

              return (
                <motion.div
                  key={q.q}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.012, duration: 0.25 }}
                  className="rounded-xl border border-border/60 bg-card overflow-hidden"
                >
                  {/* Question Row */}
                  <div
                    className={`flex items-center gap-3 px-4 py-3 ${hasSolution ? "cursor-pointer hover:bg-muted/20" : ""} transition-colors`}
                    onClick={() => hasSolution && toggleExpand(q.q)}
                  >
                    {/* Question Number */}
                    <span className="font-mono font-bold text-sm text-foreground w-10 shrink-0">Q{q.q}</span>

                    {/* Correct Answer Badge */}
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-mono font-bold text-sm shrink-0">
                      {q.ans}
                    </span>

                    {/* ABCD Rates */}
                    <div className="flex gap-2 flex-1 min-w-0">
                      {(["A", "B", "C", "D"] as const).map((opt) => (
                        <div key={opt} className="flex items-center gap-1">
                          <span className={`text-xs font-mono ${q.ans === opt ? "font-bold text-emerald-700" : "text-muted-foreground"}`}>
                            {opt}:
                          </span>
                          <div className="w-8 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${q.ans === opt ? "bg-emerald-500" : q[opt] > 30 ? "bg-red-400" : "bg-gray-300"}`}
                              style={{ width: `${Math.min(q[opt], 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-mono ${q.ans === opt ? "font-bold text-emerald-700" : "text-muted-foreground"}`}>
                            {q[opt].toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Topic Badge */}
                    <div className="hidden md:block shrink-0">
                      {topic && <TopicBadge topic={topic} />}
                    </div>

                    {/* Expand Indicator */}
                    {hasSolution && (
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>

                  {/* Collapsible Solution */}
                  <AnimatePresence>
                    {isExpanded && hasSolution && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-4 border-t border-border/30 bg-muted/10">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                              {lang === "zh" ? "題解" : "Solution"}
                            </span>
                          </div>
                          <SolutionBlock
                            solutionText={solution.solution_text}
                            latexBlocks={solution.latex}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
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
