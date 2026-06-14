import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dseData from "@/data/dseData.json";
import { getTopicDisplayName, getTopicSortKey } from "@/data/topicTranslations";
import { matchM2Questions } from "@/lib/topicMatcher";
import PerformanceBar from "@/components/PerformanceBar";

interface QuestionResult {
  year: string;
  question: string;
  performance: number;
  fullMarks: number;
}

export default function M2TopicFilterPage() {
  const { lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const m2Topics = (dseData as any).m2_topics as Record<string, Array<{ topic: string; questions: string }>> || {};

  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    for (const yearTopics of Object.values(m2Topics)) {
      for (const t of yearTopics) {
        topics.add(t.topic);
      }
    }
    return Array.from(topics).sort((a, b) => getTopicSortKey(a) - getTopicSortKey(b));
  }, []);

  const filteredTopics = useMemo(() => {
    if (!searchQuery) return allTopics;
    const q = searchQuery.toLowerCase();
    return allTopics.filter(t =>
      t.toLowerCase().includes(q) ||
      getTopicDisplayName(t, "zh").toLowerCase().includes(q) ||
      getTopicDisplayName(t, "en").toLowerCase().includes(q)
    );
  }, [allTopics, searchQuery]);

  const questionResults = useMemo(() => {
    if (!selectedTopic) return [];
    const results: QuestionResult[] = [];

    for (const [year, topics] of Object.entries(m2Topics)) {
      for (const topicEntry of topics) {
        if (topicEntry.topic !== selectedTopic) continue;
        const yearQuestions = (dseData as any).m2?.[year] || [];
        const matched = matchM2Questions(topicEntry.questions, yearQuestions);
        for (const qData of matched) {
          results.push({
            year,
            question: `Q${qData.q}`,
            performance: qData.pct,
            fullMarks: qData.full,
          });
        }
      }
    }

    results.sort((a, b) => {
      if (b.year !== a.year) return Number(b.year) - Number(a.year);
      return Number(a.question.replace(/Q|\(.*\)/g, "")) - Number(b.question.replace(/Q|\(.*\)/g, ""));
    });

    return results;
  }, [selectedTopic]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, QuestionResult[]> = {};
    for (const r of questionResults) {
      if (!groups[r.year]) groups[r.year] = [];
      groups[r.year].push(r);
    }
    return groups;
  }, [questionResults]);

  const trendChartData = useMemo(() => {
    const yearAvgs: { year: string; avg: number }[] = [];
    for (const [year, questions] of Object.entries(groupedResults)) {
      const avg = questions.reduce((s, q) => s + q.performance, 0) / questions.length;
      yearAvgs.push({ year, avg: Math.round(avg * 10) / 10 });
    }
    yearAvgs.sort((a, b) => Number(a.year) - Number(b.year));
    return yearAvgs;
  }, [groupedResults]);

  const toggleGroup = (year: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  useMemo(() => {
    setExpandedGroups(new Set(Object.keys(groupedResults)));
  }, [selectedTopic]);

  const totalQuestions = questionResults.length;
  const avgPerformance = totalQuestions > 0
    ? Math.round(questionResults.reduce((s, q) => s + q.performance, 0) / totalQuestions * 10) / 10
    : 0;

  return (
    <div className="py-8 md:py-12">
      <div className="container">
        <div className="mb-8">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            {lang === "zh" ? "M2 課題篩選" : "M2 Topic Filter"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {lang === "zh" ? "跨年份搜尋 M2 特定課題的所有相關題目" : "Search M2 questions by topic across all years"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left: Topic Selector */}
          <div className="space-y-4">
            {/* Mobile dropdown */}
            <div className="lg:hidden">
              <div className="relative">
                <select
                  value={selectedTopic || ""}
                  onChange={(e) => setSelectedTopic(e.target.value || null)}
                  className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-border/60 bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-300"
                >
                  <option value="">{lang === "zh" ? "— 選擇 M2 課題 —" : "— Select M2 Topic —"}</option>
                  {allTopics.map(topic => (
                    <option key={topic} value={topic}>{getTopicDisplayName(topic, lang)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Desktop: Search + List */}
            <div className="hidden lg:block space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === "zh" ? "搜尋 M2 課題..." : "Search M2 topics..."}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>

              <div className="bg-card rounded-xl border border-border/60 overflow-hidden max-h-[60vh] overflow-y-auto">
                <div className="px-3 py-2 bg-violet-50/50 border-b border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    {lang === "zh" ? "M2 延伸課題" : "M2 EXTENDED TOPICS"}
                  </p>
                </div>
                {filteredTopics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium border-b border-border/20 transition-colors ${
                      selectedTopic === topic ? "bg-violet-100 text-violet-700" : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    {getTopicDisplayName(topic, lang)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {!selectedTopic ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
                  <BookOpen className="w-7 h-7 text-violet-600" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {lang === "zh" ? "選擇一個 M2 課題" : "Select an M2 Topic"}
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {lang === "zh" ? "從左方選擇一個課題，即可查看所有年份中該課題的相關題目" : "Select a topic to view all related questions across years"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200/60 p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <BookOpen className="w-5 h-5 text-violet-600 mt-0.5" />
                    <div>
                      <h3 className="font-display font-bold text-lg text-violet-900">
                        {getTopicDisplayName(selectedTopic, lang)}
                      </h3>
                      <p className="text-sm text-violet-700 mt-0.5">
                        {totalQuestions} {lang === "zh" ? "題" : "questions"} &nbsp;
                        {Object.keys(groupedResults).length} {lang === "zh" ? "年份" : "years"} &nbsp;
                        {lang === "zh" ? "平均得分率" : "Avg"}: <strong>{avgPerformance}%</strong>
                      </p>
                    </div>
                  </div>

                  {trendChartData.length > 1 && (
                    <div className="h-32 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value: number) => [`${value}%`, lang === "zh" ? "平均得分率" : "Avg"]} />
                          <Line type="monotone" dataKey="avg" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>

                {/* Year Groups */}
                {Object.entries(groupedResults)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([year, questions]) => {
                    const yearAvg = Math.round(questions.reduce((s, q) => s + q.performance, 0) / questions.length * 10) / 10;
                    const isExpanded = expandedGroups.has(year);
                    return (
                      <motion.div
                        key={year}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-xl border border-border/60 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleGroup(year)}
                          className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-display font-bold text-lg">{year}</span>
                            <span className="text-xs text-muted-foreground">{questions.length} {lang === "zh" ? "題" : "Q"}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              yearAvg >= 70 ? "bg-green-100 text-green-700" :
                              yearAvg >= 50 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {lang === "zh" ? "平均" : "Avg"}: {yearAvg}%
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-4">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-xs text-muted-foreground border-b border-border/40">
                                      <th className="text-left py-2 font-medium">{lang === "zh" ? "題號" : "Q"}</th>
                                      <th className="text-left py-2 font-medium">{lang === "zh" ? "滿分" : "Full"}</th>
                                      <th className="text-left py-2 font-medium">{lang === "zh" ? "得分率" : "Score"}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {questions.map((q, idx) => (
                                      <tr key={idx} className="border-b border-border/20 last:border-0">
                                        <td className="py-2 font-mono font-medium">{q.question}</td>
                                        <td className="py-2 text-xs text-muted-foreground">{q.fullMarks}</td>
                                        <td className="py-2">
                                          <PerformanceBar value={q.performance} />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
