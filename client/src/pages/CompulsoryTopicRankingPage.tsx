// Design: Clean academic style — teal/cyan palette, ranking list with expandable detail rows
// Expandable: Click a topic row to reveal all questions grouped by year with performance bars
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, ArrowUpDown, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import dseData from "@/data/dseData.json";
import { matchPaper1Questions } from "@/lib/topicMatcher";
import { CURRICULUM_TOPICS, CurriculumTopic, topicMatchesCurriculum } from "@/data/curriculumTopics";
import PerformanceBar from "@/components/PerformanceBar";

interface QuestionDetail {
  year: string;
  paper: "paper1" | "paper2";
  question: string;
  performance: number;
  answer?: string;
  fullMarks?: number;
}

interface CurriculumTopicStat {
  curriculum: CurriculumTopic;
  totalQuestions: number;
  totalYears: number;
  avgPerformance: number;
  minPerformance: number;
  maxPerformance: number;
  questions: QuestionDetail[];
}

export default function CompulsoryTopicRankingPage() {
  const { lang } = useLanguage();
  const [sortBy, setSortBy] = useState<"difficulty" | "frequency" | "name">("difficulty");
  const [paperFilter, setPaperFilter] = useState<"all" | "paper1" | "paper2">("all");
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());

  const topicStats = useMemo(() => {
    // Build stats per curriculum topic
    const statsMap: Record<number, { performances: number[]; years: Set<string>; questions: QuestionDetail[] }> = {};
    for (const ct of CURRICULUM_TOPICS) {
      statsMap[ct.id] = { performances: [], years: new Set(), questions: [] };
    }

    // Paper 1
    if (paperFilter === "all" || paperFilter === "paper1") {
      for (const [year, topics] of Object.entries(dseData.paper1_topics as Record<string, Array<{ topic: string; questions: string }>>)) {
        for (const topicEntry of topics) {
          const ct = CURRICULUM_TOPICS.find(c => topicMatchesCurriculum(topicEntry.topic, c));
          if (!ct) continue;
          const yearQuestions = (dseData.paper1 as any)[year] || [];
          const matched = matchPaper1Questions(topicEntry.questions, yearQuestions);
          if (matched.length === 0) continue;
          statsMap[ct.id].years.add(year);
          for (const q of matched) {
            statsMap[ct.id].performances.push(q.pct);
            statsMap[ct.id].questions.push({
              year,
              paper: "paper1",
              question: `Q${q.q}`,
              performance: q.pct,
              fullMarks: q.full,
            });
          }
        }
      }
    }

    // Paper 2 (flat format: {year: {q: topic_name}})
    if (paperFilter === "all" || paperFilter === "paper2") {
      const paper2TopicsFlat = dseData.paper2_topics as Record<string, Record<string, string>>;
      for (const [year, topicMap] of Object.entries(paper2TopicsFlat)) {
        const yearQuestions = (dseData.paper2 as Record<string, Array<{ q: number; ans: string; A: number; B: number; C: number; D: number }>>)[year] || [];
        for (const [qNum, topicName] of Object.entries(topicMap)) {
          const ct = CURRICULUM_TOPICS.find(c => topicMatchesCurriculum(topicName, c));
          if (!ct) continue;
          const qData = yearQuestions.find(q => q.q === Number(qNum));
          if (!qData) continue;
          const correctRate = qData[qData.ans as keyof Pick<typeof qData, "A" | "B" | "C" | "D">] as number || 0;
          statsMap[ct.id].years.add(year);
          statsMap[ct.id].performances.push(correctRate);
          statsMap[ct.id].questions.push({
            year,
            paper: "paper2",
            question: `Q${qData.q}`,
            performance: correctRate,
            answer: qData.ans,
          });
        }
      }
    }

    const stats: CurriculumTopicStat[] = CURRICULUM_TOPICS
      .filter(ct => statsMap[ct.id].performances.length > 0)
      .map(ct => {
        const data = statsMap[ct.id];
        // Sort questions by year desc, then question number
        const sortedQs = [...data.questions].sort((a, b) => {
          if (b.year !== a.year) return Number(b.year) - Number(a.year);
          const aNum = Number(a.question.replace(/Q|\(.*\)/g, "")) || 0;
          const bNum = Number(b.question.replace(/Q|\(.*\)/g, "")) || 0;
          return aNum - bNum;
        });
        return {
          curriculum: ct,
          totalQuestions: data.performances.length,
          totalYears: data.years.size,
          avgPerformance: Math.round(data.performances.reduce((s, v) => s + v, 0) / data.performances.length * 10) / 10,
          minPerformance: Math.round(Math.min(...data.performances) * 10) / 10,
          maxPerformance: Math.round(Math.max(...data.performances) * 10) / 10,
          questions: sortedQs,
        };
      });

    switch (sortBy) {
      case "difficulty":
        stats.sort((a, b) => a.avgPerformance - b.avgPerformance);
        break;
      case "frequency":
        stats.sort((a, b) => b.totalQuestions - a.totalQuestions);
        break;
      case "name":
        stats.sort((a, b) => a.curriculum.id - b.curriculum.id);
        break;
    }

    return stats;
  }, [paperFilter, sortBy]);

  const toggleTopic = (id: number) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group questions by year for a topic
  const groupByYear = (questions: QuestionDetail[]) => {
    const groups: Record<string, QuestionDetail[]> = {};
    for (const q of questions) {
      if (!groups[q.year]) groups[q.year] = [];
      groups[q.year].push(q);
    }
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  };

  return (
    <div className="py-8 md:py-12">
      <div className="container">
        <div className="mb-8">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            {lang === "zh" ? "課題難度排名" : "Topic Difficulty Ranking"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {lang === "zh" ? "按平均得分率排列，得分率越低代表越難（必修卷一及卷二）。點擊課題可展開詳細題目。" : "Ranked by average score rate, lower = harder (Compulsory Paper 1 & 2). Click a topic to expand question details."}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
            {[
              { value: "all", label: lang === "zh" ? "全部" : "All" },
              { value: "paper1", label: lang === "zh" ? "卷一" : "P1" },
              { value: "paper2", label: lang === "zh" ? "卷二" : "P2" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => { setPaperFilter(opt.value as any); setExpandedTopics(new Set()); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-180 ${
                  paperFilter === opt.value ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
            {[
              { value: "difficulty", label: lang === "zh" ? "按難度" : "By Difficulty", icon: <TrendingDown className="w-3.5 h-3.5" /> },
              { value: "frequency", label: lang === "zh" ? "按頻率" : "By Frequency", icon: <ArrowUpDown className="w-3.5 h-3.5" /> },
              { value: "name", label: lang === "zh" ? "按編號" : "By No.", icon: null },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value as any)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-180 ${
                  sortBy === opt.value ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ranking List */}
        <div className="space-y-2">
          {topicStats.map((stat, idx) => {
            const isExpanded = expandedTopics.has(stat.curriculum.id);
            const yearGroups = groupByYear(stat.questions);

            return (
              <motion.div
                key={stat.curriculum.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.015 }}
                className="bg-card rounded-xl border border-border/40 overflow-hidden"
              >
                {/* Main Row — clickable */}
                <button
                  onClick={() => toggleTopic(stat.curriculum.id)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
                    idx < 5 ? "bg-red-100 text-red-700" :
                    idx < 10 ? "bg-amber-100 text-amber-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      <span className="text-xs text-muted-foreground mr-1.5">#{stat.curriculum.id}</span>
                      {lang === "zh" ? stat.curriculum.zh : stat.curriculum.en}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {stat.curriculum.lus.join(", ")} · {stat.totalQuestions} {lang === "zh" ? "題" : "Q"} · {stat.totalYears} {lang === "zh" ? "年" : "yrs"}
                      {" · "}
                      <span className="text-gray-400">
                        {lang === "zh" ? "最低" : "Min"}: {stat.minPerformance}% / {lang === "zh" ? "最高" : "Max"}: {stat.maxPerformance}%
                      </span>
                    </p>
                  </div>
                  <div className="w-32 hidden sm:block">
                    <PerformanceBar value={stat.avgPerformance} />
                  </div>
                  <span className={`text-sm font-bold tabular-nums shrink-0 ${
                    stat.avgPerformance < 40 ? "text-red-600" :
                    stat.avgPerformance < 60 ? "text-amber-600" :
                    "text-green-600"
                  }`}>
                    {stat.avgPerformance}%
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {/* Expandable Detail Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/40 bg-muted/20 px-4 py-4">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {lang === "zh" ? "歷年出題記錄" : "Historical Question Records"}
                        </p>
                        <div className="space-y-3">
                          {yearGroups.map(([year, qs]) => {
                            const yearAvg = Math.round(qs.reduce((s, q) => s + q.performance, 0) / qs.length * 10) / 10;
                            return (
                              <div key={year} className="bg-white rounded-lg border border-border/30 overflow-hidden">
                                {/* Year header */}
                                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-border/20">
                                  <span className="text-xs font-bold text-gray-700">{year}</span>
                                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                    yearAvg >= 70 ? "bg-green-100 text-green-700" :
                                    yearAvg >= 50 ? "bg-amber-100 text-amber-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {lang === "zh" ? "平均" : "Avg"} {yearAvg}%
                                  </span>
                                </div>
                                {/* Questions */}
                                <div className="divide-y divide-border/20">
                                  {qs.map((q, qi) => (
                                    <div key={qi} className="flex items-center gap-3 px-3 py-2">
                                      <span className="font-mono text-xs font-semibold text-gray-700 w-14 shrink-0">{q.question}</span>
                                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                                        q.paper === "paper1" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                                      }`}>
                                        {q.paper === "paper1" ? (lang === "zh" ? "卷一" : "P1") : (lang === "zh" ? "卷二" : "P2")}
                                      </span>
                                      {q.answer && (
                                        <span className="text-[10px] text-gray-500 shrink-0">Ans: <strong>{q.answer}</strong></span>
                                      )}
                                      {q.fullMarks && (
                                        <span className="text-[10px] text-gray-400 shrink-0">/{q.fullMarks}分</span>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <PerformanceBar value={q.performance} />
                                      </div>
                                      <span className={`text-xs font-bold tabular-nums shrink-0 w-12 text-right ${
                                        q.performance < 40 ? "text-red-600" :
                                        q.performance < 60 ? "text-amber-600" :
                                        "text-green-600"
                                      }`}>
                                        {q.performance}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
