import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingDown, ArrowUpDown } from "lucide-react";
import dseData from "@/data/dseData.json";
import { matchPaper1Questions } from "@/lib/topicMatcher";
import { CURRICULUM_TOPICS, CurriculumTopic, topicMatchesCurriculum } from "@/data/curriculumTopics";
import PerformanceBar from "@/components/PerformanceBar";

interface CurriculumTopicStat {
  curriculum: CurriculumTopic;
  totalQuestions: number;
  totalYears: number;
  avgPerformance: number;
  minPerformance: number;
  maxPerformance: number;
}

export default function CompulsoryTopicRankingPage() {
  const { lang } = useLanguage();
  const [sortBy, setSortBy] = useState<"difficulty" | "frequency" | "name">("difficulty");
  const [paperFilter, setPaperFilter] = useState<"all" | "paper1" | "paper2">("all");

  const topicStats = useMemo(() => {
    // Build stats per curriculum topic
    const statsMap: Record<number, { performances: number[]; years: Set<string> }> = {};
    for (const ct of CURRICULUM_TOPICS) {
      statsMap[ct.id] = { performances: [], years: new Set() };
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
        }
      }
    }

    const stats: CurriculumTopicStat[] = CURRICULUM_TOPICS
      .filter(ct => statsMap[ct.id].performances.length > 0)
      .map(ct => {
        const data = statsMap[ct.id];
        return {
          curriculum: ct,
          totalQuestions: data.performances.length,
          totalYears: data.years.size,
          avgPerformance: Math.round(data.performances.reduce((s, v) => s + v, 0) / data.performances.length * 10) / 10,
          minPerformance: Math.round(Math.min(...data.performances) * 10) / 10,
          maxPerformance: Math.round(Math.max(...data.performances) * 10) / 10,
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

  return (
    <div className="py-8 md:py-12">
      <div className="container">
        <div className="mb-8">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            {lang === "zh" ? "課題難度排名" : "Topic Difficulty Ranking"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {lang === "zh" ? "按平均得分率排列，得分率越低代表越難（必修卷一及卷二）" : "Ranked by average score rate, lower = harder (Compulsory Paper 1 & 2)"}
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
                onClick={() => setPaperFilter(opt.value as any)}
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
          {topicStats.map((stat, idx) => (
            <motion.div
              key={stat.curriculum.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="flex items-center gap-4 px-4 py-3 bg-card rounded-xl border border-border/40 hover:border-border/80 transition-colors"
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
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
