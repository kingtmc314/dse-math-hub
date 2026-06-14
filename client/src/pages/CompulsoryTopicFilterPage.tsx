import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dseData from "@/data/dseData.json";
import { getTopicDisplayName, getTopicSortKey } from "@/data/topicTranslations";
import { matchPaper1Questions, matchPaper2Questions } from "@/lib/topicMatcher";
import PerformanceBar from "@/components/PerformanceBar";

interface QuestionResult {
  year: string;
  paper: "paper1" | "paper2";
  question: string;
  topic: string;
  performance: number;
  answer?: string;
  fullMarks?: number;
}

export default function CompulsoryTopicFilterPage() {
  const { lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<"all" | "paper1" | "paper2">("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Collect all compulsory topics (J and S only)
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    for (const yearTopics of Object.values(dseData.paper1_topics as Record<string, Array<{ topic: string; questions: string }>>)) {
      for (const t of yearTopics) {
        if (t.topic.startsWith("J") || t.topic.startsWith("S")) topics.add(t.topic);
      }
    }
    // paper2_topics new flat format: {year: {q: topic_name}}
    for (const yearTopicMap of Object.values(dseData.paper2_topics as Record<string, Record<string, string>>)) {
      for (const topicName of Object.values(yearTopicMap)) {
        if (topicName.startsWith("J") || topicName.startsWith("S")) topics.add(topicName);
      }
    }
    return Array.from(topics).sort((a, b) => {
      const catA = a.startsWith("J") ? 0 : 1;
      const catB = b.startsWith("J") ? 0 : 1;
      if (catA !== catB) return catA - catB;
      return getTopicSortKey(a) - getTopicSortKey(b);
    });
  }, []);

  const topicGroups = useMemo(() => {
    const junior = allTopics.filter(t => t.startsWith("J"));
    const senior = allTopics.filter(t => t.startsWith("S"));
    return { junior, senior };
  }, [allTopics]);

  const filteredTopics = useMemo(() => {
    if (!searchQuery) return allTopics;
    const q = searchQuery.toLowerCase();
    return allTopics.filter(t =>
      t.toLowerCase().includes(q) ||
      getTopicDisplayName(t, "zh").toLowerCase().includes(q) ||
      getTopicDisplayName(t, "en").toLowerCase().includes(q)
    );
  }, [allTopics, searchQuery]);

  // Build question results using the new matching utility
  const questionResults = useMemo(() => {
    if (!selectedTopic) return [];
    const results: QuestionResult[] = [];

    // Search Paper 1
    if (selectedPaper === "all" || selectedPaper === "paper1") {
      for (const [year, topics] of Object.entries(dseData.paper1_topics as Record<string, Array<{ topic: string; questions: string }>>)) {
        for (const topicEntry of topics) {
          if (topicEntry.topic !== selectedTopic) continue;
          const yearQuestions = (dseData.paper1 as any)[year] || [];
          const matched = matchPaper1Questions(topicEntry.questions, yearQuestions);
          for (const qData of matched) {
            results.push({
              year,
              paper: "paper1",
              question: `Q${qData.q}`,
              topic: topicEntry.topic,
              performance: qData.pct,
              fullMarks: qData.full,
            });
          }
        }
      }
    }

    // Search Paper 2 (new flat format: {year: {q: topic_name}})
    if (selectedPaper === "all" || selectedPaper === "paper2") {
      const paper2TopicsFlat = dseData.paper2_topics as Record<string, Record<string, string>>;
      for (const [year, topicMap] of Object.entries(paper2TopicsFlat)) {
        const yearQuestions = (dseData.paper2 as Record<string, Array<{ q: number; ans: string; A: number; B: number; C: number; D: number }>>)[year] || [];
        for (const [qNum, topicName] of Object.entries(topicMap)) {
          if (topicName !== selectedTopic) continue;
          const qData = yearQuestions.find(q => q.q === Number(qNum));
          if (qData) {
            const correctRate = qData[qData.ans as keyof Pick<typeof qData, "A" | "B" | "C" | "D">] as number || 0;
            results.push({
              year,
              paper: "paper2",
              question: `Q${qData.q}`,
              topic: topicName,
              performance: correctRate,
              answer: qData.ans,
            });
          }
        }
      }
    }

    results.sort((a, b) => {
      if (b.year !== a.year) return Number(b.year) - Number(a.year);
      return Number(a.question.replace(/Q|\(.*\)/g, "")) - Number(b.question.replace(/Q|\(.*\)/g, ""));
    });

    return results;
  }, [selectedTopic, selectedPaper]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, QuestionResult[]> = {};
    for (const r of questionResults) {
      if (!groups[r.year]) groups[r.year] = [];
      groups[r.year].push(r);
    }
    return groups;
  }, [questionResults]);

  const trendChartData = useMemo(() => {
    const yearAvgs: { year: string; avg: number; count: number }[] = [];
    for (const [year, questions] of Object.entries(groupedResults)) {
      const avg = questions.reduce((s, q) => s + q.performance, 0) / questions.length;
      yearAvgs.push({ year, avg: Math.round(avg * 10) / 10, count: questions.length });
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
  }, [selectedTopic, selectedPaper]);

  const totalQuestions = questionResults.length;
  const avgPerformance = totalQuestions > 0
    ? Math.round(questionResults.reduce((s, q) => s + q.performance, 0) / totalQuestions * 10) / 10
    : 0;

  return (
    <div className="py-8 md:py-12">
      <div className="container">
        <div className="mb-8">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            {lang === "zh" ? "按課題篩選" : "Filter by Topic"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {lang === "zh" ? "跨年份搜尋特定課題的所有相關題目（必修卷一及卷二）" : "Search questions by topic across all years (Compulsory Paper 1 & 2)"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left: Topic Selector */}
          <div className="space-y-4">
            {/* Mobile dropdown */}
            <div className="lg:hidden space-y-3">
              <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
                {[
                  { value: "all", label: lang === "zh" ? "全部" : "All" },
                  { value: "paper1", label: lang === "zh" ? "卷一" : "P1" },
                  { value: "paper2", label: lang === "zh" ? "卷二" : "P2" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedPaper(opt.value as any)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-180 ${
                      selectedPaper === opt.value ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <select
                  value={selectedTopic || ""}
                  onChange={(e) => setSelectedTopic(e.target.value || null)}
                  className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-border/60 bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">{lang === "zh" ? "— 選擇課題 —" : "— Select Topic —"}</option>
                  <optgroup label={lang === "zh" ? "初中課題" : "Junior Topics"}>
                    {topicGroups.junior.map(topic => (
                      <option key={topic} value={topic}>{getTopicDisplayName(topic, lang)}</option>
                    ))}
                  </optgroup>
                  <optgroup label={lang === "zh" ? "高中課題" : "Senior Topics"}>
                    {topicGroups.senior.map(topic => (
                      <option key={topic} value={topic}>{getTopicDisplayName(topic, lang)}</option>
                    ))}
                  </optgroup>
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
                  placeholder={lang === "zh" ? "搜尋課題..." : "Search topics..."}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
                {[
                  { value: "all", label: lang === "zh" ? "全部" : "All" },
                  { value: "paper1", label: lang === "zh" ? "卷一" : "P1" },
                  { value: "paper2", label: lang === "zh" ? "卷二" : "P2" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedPaper(opt.value as any)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-180 ${
                      selectedPaper === opt.value ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="bg-card rounded-xl border border-border/60 overflow-hidden max-h-[60vh] overflow-y-auto">
                <div className="px-3 py-2 bg-muted/30 border-b border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {lang === "zh" ? "初中課題 (JUNIOR)" : "JUNIOR TOPICS"}
                  </p>
                </div>
                {filteredTopics.filter(t => t.startsWith("J")).map(topic => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium border-b border-border/20 transition-colors ${
                      selectedTopic === topic ? "bg-primary/10 text-primary" : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    {getTopicDisplayName(topic, lang)}
                  </button>
                ))}
                <div className="px-3 py-2 bg-muted/30 border-b border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {lang === "zh" ? "高中課題 (SENIOR)" : "SENIOR TOPICS"}
                  </p>
                </div>
                {filteredTopics.filter(t => t.startsWith("S")).map(topic => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium border-b border-border/20 transition-colors ${
                      selectedTopic === topic ? "bg-primary/10 text-primary" : "hover:bg-muted/60 text-foreground"
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
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {lang === "zh" ? "選擇一個課題" : "Select a Topic"}
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {lang === "zh" ? "從左方選擇一個課題，即可查看所有年份中該課題的相關題目" : "Select a topic from the left to view all related questions across years"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-200/60 p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <BookOpen className="w-5 h-5 text-teal-600 mt-0.5" />
                    <div>
                      <h3 className="font-display font-bold text-lg text-teal-900">
                        {getTopicDisplayName(selectedTopic, lang)}
                      </h3>
                      <p className="text-sm text-teal-700 mt-0.5">
                        {totalQuestions} {lang === "zh" ? "題" : "questions"} &nbsp;
                        {Object.keys(groupedResults).length} {lang === "zh" ? "年份" : "years"} &nbsp;
                        {lang === "zh" ? "平均得分率" : "Avg"}: <strong>{avgPerformance}%</strong>
                      </p>
                    </div>
                  </div>

                  {/* Trend Chart */}
                  {trendChartData.length > 1 && (
                    <div className="h-32 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value: number) => [`${value}%`, lang === "zh" ? "平均得分率" : "Avg Score"]}
                          />
                          <Line type="monotone" dataKey="avg" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
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
                                      <th className="text-left py-2 font-medium">{lang === "zh" ? "卷" : "Paper"}</th>
                                      <th className="text-left py-2 font-medium">{lang === "zh" ? "得分率" : "Score"}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {questions.map((q, idx) => (
                                      <tr key={idx} className="border-b border-border/20 last:border-0">
                                        <td className="py-2 font-mono font-medium">{q.question}</td>
                                        <td className="py-2">
                                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                            q.paper === "paper1" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                                          }`}>
                                            {q.paper === "paper1" ? (lang === "zh" ? "卷一" : "P1") : (lang === "zh" ? "卷二" : "P2")}
                                          </span>
                                          {q.answer && <span className="ml-2 text-xs text-muted-foreground">Ans: {q.answer}</span>}
                                        </td>
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
