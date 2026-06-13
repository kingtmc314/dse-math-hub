import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import dseData from "@/data/dseData.json";
import { Link } from "wouter";

interface TopicStats {
  topic: string;
  avgScore: number;
  totalQuestions: number;
  yearsAppeared: number;
  yearScores: { year: string; avg: number }[];
  trend: "up" | "down" | "stable"; // recent trend
  category: "J" | "S" | "O";
}

export default function TopicRankingPage() {
  const { t, lang } = useLanguage();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // asc = hardest first
  const [filterCategory, setFilterCategory] = useState<"all" | "J" | "S">("all");
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  // Compute topic stats from dseData
  const topicStats = useMemo(() => {
    const statsMap: Record<string, { scores: number[]; years: Set<string>; yearScores: Record<string, number[]> }> = {};

    // Paper 2 data (uses ans + A/B/C/D percentages)
    for (const [year, questions] of Object.entries(dseData.paper2 as Record<string, Array<{ q: number; ans: string; A: number; B: number; C: number; D: number }>>)) {
      const yearTopics = (dseData.paper2_topics as Record<string, Array<{ topic: string; questions: string }>>)[year] || [];
      for (const topicEntry of yearTopics) {
        const topic = topicEntry.topic;
        if (!statsMap[topic]) statsMap[topic] = { scores: [], years: new Set(), yearScores: {} };
        const qNums = String(topicEntry.questions).split(",").map(s => s.trim());
        for (const qNum of qNums) {
          const qData = questions.find(q => q.q === Number(qNum));
          if (qData) {
            const pct = (qData as any)[qData.ans] as number;
            if (pct && pct > 0) {
              statsMap[topic].scores.push(pct);
              statsMap[topic].years.add(year);
              if (!statsMap[topic].yearScores[year]) statsMap[topic].yearScores[year] = [];
              statsMap[topic].yearScores[year].push(pct);
            }
          }
        }
      }
    }

    // Paper 1 data (has pct)
    for (const [year, questions] of Object.entries(dseData.paper1 as Record<string, Array<{ q: string; full: number; mean: number; pct: number }>>)) {
      const yearTopics = (dseData.paper1_topics as Record<string, Array<{ topic: string; questions: string }>>)[year] || [];
      for (const topicEntry of yearTopics) {
        const topic = topicEntry.topic;
        if (!statsMap[topic]) statsMap[topic] = { scores: [], years: new Set(), yearScores: {} };
        const qNums = String(topicEntry.questions).split(",").map(s => s.trim());
        for (const qNum of qNums) {
          const qData = questions.find(q => String(q.q) === qNum);
          if (qData && qData.pct > 0) {
            statsMap[topic].scores.push(qData.pct);
            statsMap[topic].years.add(year);
            if (!statsMap[topic].yearScores[year]) statsMap[topic].yearScores[year] = [];
            statsMap[topic].yearScores[year].push(qData.pct);
          }
        }
      }
    }

    // Convert to array
    const results: TopicStats[] = [];
    for (const [topic, data] of Object.entries(statsMap)) {
      if (data.scores.length === 0) continue;
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      
      // Calculate year averages for trend
      const yearScores = Object.entries(data.yearScores)
        .map(([year, scores]) => ({
          year,
          avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        }))
        .sort((a, b) => a.year.localeCompare(b.year));

      // Determine trend from last 3 years
      let trend: "up" | "down" | "stable" = "stable";
      if (yearScores.length >= 3) {
        const recent = yearScores.slice(-3);
        const diff = recent[recent.length - 1].avg - recent[0].avg;
        if (diff > 5) trend = "up";
        else if (diff < -5) trend = "down";
      }

      const category = topic.startsWith("J") ? "J" : topic.startsWith("S") ? "S" : "O";

      results.push({
        topic,
        avgScore: Math.round(avgScore * 10) / 10,
        totalQuestions: data.scores.length,
        yearsAppeared: data.years.size,
        yearScores,
        trend,
        category,
      });
    }

    return results;
  }, []);

  // Filter and sort
  const sortedTopics = useMemo(() => {
    let filtered = topicStats;
    if (filterCategory !== "all") {
      filtered = filtered.filter(t => t.category === filterCategory);
    }
    return [...filtered].sort((a, b) => {
      return sortOrder === "asc" ? a.avgScore - b.avgScore : b.avgScore - a.avgScore;
    });
  }, [topicStats, sortOrder, filterCategory]);

  // Stats summary
  const summary = useMemo(() => {
    if (sortedTopics.length === 0) return { hardest: null, easiest: null, avgAll: 0 };
    const sorted = [...sortedTopics].sort((a, b) => a.avgScore - b.avgScore);
    return {
      hardest: sorted[0],
      easiest: sorted[sorted.length - 1],
      avgAll: Math.round(sorted.reduce((a, b) => a + b.avgScore, 0) / sorted.length * 10) / 10,
    };
  }, [sortedTopics]);

  const getDifficultyColor = (score: number) => {
    if (score < 40) return "text-red-600 bg-red-50 border-red-200";
    if (score < 55) return "text-orange-600 bg-orange-50 border-orange-200";
    if (score < 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getDifficultyLabel = (score: number) => {
    if (score < 40) return lang === "zh" ? "極難" : "Very Hard";
    if (score < 55) return lang === "zh" ? "困難" : "Hard";
    if (score < 70) return lang === "zh" ? "中等" : "Medium";
    return lang === "zh" ? "容易" : "Easy";
  };

  const getDifficultyBarWidth = (score: number) => `${Math.min(score, 100)}%`;

  const getDifficultyBarColor = (score: number) => {
    if (score < 40) return "bg-red-500";
    if (score < 55) return "bg-orange-500";
    if (score < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="py-8 md:py-12">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            {lang === "zh" ? "課題難度排名" : "Topic Difficulty Ranking"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lang === "zh"
              ? "根據歷年平均得分率自動排序，幫助你快速找出需要優先溫習的弱點課題"
              : "Ranked by historical average scoring rate to help you identify weak areas for priority revision"}
          </p>
        </div>

        {/* Summary Cards */}
        {summary.hardest && summary.easiest && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/50">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-red-600">
                  {lang === "zh" ? "最難課題" : "Hardest Topic"}
                </span>
              </div>
              <p className="text-sm font-semibold text-red-800 truncate">{summary.hardest.topic}</p>
              <p className="text-lg font-bold text-red-600">{summary.hardest.avgScore}%</p>
            </div>
            <div className="p-4 rounded-xl border border-green-200 bg-green-50/50">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-green-600">
                  {lang === "zh" ? "最易課題" : "Easiest Topic"}
                </span>
              </div>
              <p className="text-sm font-semibold text-green-800 truncate">{summary.easiest.topic}</p>
              <p className="text-lg font-bold text-green-600">{summary.easiest.avgScore}%</p>
            </div>
            <div className="p-4 rounded-xl border border-border/60 bg-card">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  {lang === "zh" ? "整體平均" : "Overall Average"}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">{sortedTopics.length} {lang === "zh" ? "個課題" : "topics"}</p>
              <p className="text-lg font-bold text-primary">{summary.avgAll}%</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Category Filter */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
            {[
              { value: "all", label: lang === "zh" ? "全部" : "All" },
              { value: "J", label: lang === "zh" ? "初中" : "Junior" },
              { value: "S", label: lang === "zh" ? "高中" : "Senior" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterCategory(opt.value as "all" | "J" | "S")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-180 ${
                  filterCategory === opt.value
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-card text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
          >
            {sortOrder === "asc" ? (
              <>
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                {lang === "zh" ? "最難優先" : "Hardest First"}
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                {lang === "zh" ? "最易優先" : "Easiest First"}
              </>
            )}
          </button>

          <span className="text-xs text-muted-foreground ml-auto">
            {sortedTopics.length} {lang === "zh" ? "個課題" : "topics"}
          </span>
        </div>

        {/* Topic Ranking List */}
        <div className="space-y-2">
          {sortedTopics.map((topic, index) => (
            <motion.div
              key={topic.topic}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.5), duration: 0.25 }}
            >
              <div
                className={`rounded-xl border bg-card overflow-hidden transition-all duration-200 ${
                  expandedTopic === topic.topic ? "border-primary/40 shadow-sm" : "border-border/60 hover:border-border"
                }`}
              >
                {/* Main Row */}
                <button
                  onClick={() => setExpandedTopic(expandedTopic === topic.topic ? null : topic.topic)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  {/* Rank Number */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    index < 3 ? "bg-red-100 text-red-700" :
                    index < 10 ? "bg-orange-100 text-orange-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>

                  {/* Topic Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{topic.topic}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {topic.totalQuestions} {lang === "zh" ? "題" : "Q"} · {topic.yearsAppeared} {lang === "zh" ? "年" : "yrs"}
                      {topic.trend === "down" && (
                        <span className="ml-1.5 text-red-500">↓ {lang === "zh" ? "下降趨勢" : "declining"}</span>
                      )}
                      {topic.trend === "up" && (
                        <span className="ml-1.5 text-green-500">↑ {lang === "zh" ? "上升趨勢" : "improving"}</span>
                      )}
                    </p>
                  </div>

                  {/* Score Bar */}
                  <div className="hidden sm:flex items-center gap-2 w-32">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getDifficultyBarColor(topic.avgScore)}`}
                        style={{ width: getDifficultyBarWidth(topic.avgScore) }}
                      />
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div className={`px-2 py-0.5 rounded-md border text-xs font-bold shrink-0 ${getDifficultyColor(topic.avgScore)}`}>
                    {topic.avgScore}%
                  </div>

                  {/* Difficulty Label */}
                  <span className={`hidden md:inline text-[10px] font-medium px-1.5 py-0.5 rounded ${getDifficultyColor(topic.avgScore)}`}>
                    {getDifficultyLabel(topic.avgScore)}
                  </span>

                  {/* Expand Icon */}
                  {expandedTopic === topic.topic ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Expanded Details */}
                {expandedTopic === topic.topic && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-border/40 px-4 py-3 bg-muted/20"
                  >
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(topic.avgScore)}`}>
                        {getDifficultyLabel(topic.avgScore)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {lang === "zh" ? "歷年平均得分率" : "Historical avg. score rate"}: <strong>{topic.avgScore}%</strong>
                      </span>
                    </div>

                    {/* Year-by-year scores */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {topic.yearScores.map((ys) => (
                        <div key={ys.year} className="text-center p-2 rounded-lg bg-card border border-border/40">
                          <p className="text-[10px] text-muted-foreground">{ys.year}</p>
                          <p className={`text-sm font-bold ${
                            ys.avg < 40 ? "text-red-600" :
                            ys.avg < 55 ? "text-orange-600" :
                            ys.avg < 70 ? "text-yellow-600" :
                            "text-green-600"
                          }`}>
                            {Math.round(ys.avg)}%
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Link to topic filter */}
                    <div className="mt-3">
                      <Link
                        href="/topics"
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        {lang === "zh" ? "→ 查看此課題所有題目" : "→ View all questions for this topic"}
                      </Link>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {sortedTopics.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            {lang === "zh" ? "沒有找到相關課題" : "No topics found"}
          </div>
        )}
      </div>
    </div>
  );
}
