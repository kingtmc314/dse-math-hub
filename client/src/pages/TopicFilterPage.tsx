import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, BookOpen, ChevronDown, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import dseData from "@/data/dseData.json";
import { getTopicDisplayName, getTopicSortKey } from "@/data/topicTranslations";
import PerformanceBar from "@/components/PerformanceBar";
import TopicBadge from "@/components/TopicBadge";

interface QuestionResult {
  year: string;
  paper: "paper1" | "paper2";
  question: string;
  topic: string;
  performance: number; // pct or correct rate
  answer?: string; // for paper2
  fullMarks?: number; // for paper1
}

export default function TopicFilterPage() {
  const { t, lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<"all" | "paper1" | "paper2">("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Collect all unique topics
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    for (const yearTopics of Object.values(dseData.paper1_topics as Record<string, Array<{ topic: string; questions: string }>>)) {
      for (const t of yearTopics) {
        topics.add(t.topic);
      }
    }
    for (const yearTopics of Object.values(dseData.paper2_topics as Record<string, Array<{ topic: string; questions: string }>>)) {
      for (const t of yearTopics) {
        topics.add(t.topic);
      }
    }
    return Array.from(topics).sort((a, b) => {
      // Sort by category first (J before S before Other)
      const catA = a.startsWith("J") ? 0 : a.startsWith("S") ? 1 : 2;
      const catB = b.startsWith("J") ? 0 : b.startsWith("S") ? 1 : 2;
      if (catA !== catB) return catA - catB;
      // Then by numeric prefix
      return getTopicSortKey(a) - getTopicSortKey(b);
    });
  }, []);

  // Group topics by category (J = Junior, S = Senior)
  const topicGroups = useMemo(() => {
    const junior: string[] = [];
    const senior: string[] = [];
    const other: string[] = [];
    for (const t of allTopics) {
      if (t.startsWith("J")) junior.push(t);
      else if (t.startsWith("S")) senior.push(t);
      else other.push(t);
    }
    return { junior, senior, other };
  }, [allTopics]);

  // Filter topics by search
  const filteredTopics = useMemo(() => {
    if (!searchQuery) return allTopics;
    const q = searchQuery.toLowerCase();
    return allTopics.filter(t => 
      t.toLowerCase().includes(q) || 
      getTopicDisplayName(t, "zh").toLowerCase().includes(q)
    );
  }, [allTopics, searchQuery]);

  // Build question results for selected topic
  const questionResults = useMemo(() => {
    if (!selectedTopic) return [];
    const results: QuestionResult[] = [];

    // Search Paper 1
    if (selectedPaper === "all" || selectedPaper === "paper1") {
      for (const [year, topics] of Object.entries(dseData.paper1_topics as Record<string, Array<{ topic: string; questions: string }>>)) {
        for (const topicEntry of topics) {
          if (topicEntry.topic !== selectedTopic) continue;
          // Parse question numbers
          const qNums = String(topicEntry.questions).split(",").map(s => s.trim());
          const yearQuestions = (dseData.paper1 as Record<string, Array<{ q: string; full: number; mean: number; pct: number }>>)[year] || [];
          for (const qNum of qNums) {
            const qData = yearQuestions.find(q => String(q.q) === qNum);
            if (qData) {
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
    }

    // Search Paper 2
    if (selectedPaper === "all" || selectedPaper === "paper2") {
      for (const [year, topics] of Object.entries(dseData.paper2_topics as Record<string, Array<{ topic: string; questions: string }>>)) {
        for (const topicEntry of topics) {
          if (topicEntry.topic !== selectedTopic) continue;
          const qNums = String(topicEntry.questions).split(",").map(s => s.trim());
          const yearQuestions = (dseData.paper2 as Record<string, Array<{ q: number; ans: string; A: number; B: number; C: number; D: number }>>)[year] || [];
          for (const qNum of qNums) {
            // Handle ranges like "1-3"
            if (qNum.includes("-")) {
              const [start, end] = qNum.split("-").map(Number);
              for (let i = start; i <= end; i++) {
                const qData = yearQuestions.find(q => q.q === i);
                if (qData) {
                  const correctRate = qData[qData.ans as keyof Pick<typeof qData, "A" | "B" | "C" | "D">] as number || 0;
                  results.push({
                    year,
                    paper: "paper2",
                    question: `Q${qData.q}`,
                    topic: topicEntry.topic,
                    performance: correctRate,
                    answer: qData.ans,
                  });
                }
              }
            } else {
              const qData = yearQuestions.find(q => q.q === Number(qNum));
              if (qData) {
                const correctRate = qData[qData.ans as keyof Pick<typeof qData, "A" | "B" | "C" | "D">] as number || 0;
                results.push({
                  year,
                  paper: "paper2",
                  question: `Q${qData.q}`,
                  topic: topicEntry.topic,
                  performance: correctRate,
                  answer: qData.ans,
                });
              }
            }
          }
        }
      }
    }

    // Sort by year descending, then question number
    results.sort((a, b) => {
      if (b.year !== a.year) return Number(b.year) - Number(a.year);
      return Number(a.question.replace("Q", "")) - Number(b.question.replace("Q", ""));
    });

    return results;
  }, [selectedTopic, selectedPaper]);

  // Group results by year
  const groupedResults = useMemo(() => {
    const groups: Record<string, QuestionResult[]> = {};
    for (const r of questionResults) {
      if (!groups[r.year]) groups[r.year] = [];
      groups[r.year].push(r);
    }
    return groups;
  }, [questionResults]);

  // Build trend chart data: average performance per year
  const trendChartData = useMemo(() => {
    const yearAvgs: { year: string; avg: number; count: number }[] = [];
    for (const [year, questions] of Object.entries(groupedResults)) {
      const avg = questions.reduce((s, q) => s + q.performance, 0) / questions.length;
      yearAvgs.push({ year, avg: Math.round(avg * 10) / 10, count: questions.length });
    }
    // Sort by year ascending for the chart
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

  // Auto-expand all groups when topic changes
  useMemo(() => {
    setExpandedGroups(new Set(Object.keys(groupedResults)));
  }, [selectedTopic, selectedPaper]);

  return (
    <div className="py-8 md:py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            {lang === "zh" ? "按課題篩選" : "Filter by Topic"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lang === "zh" ? "跨年份搜尋特定課題的所有相關題目，方便針對性溫習" : "Search questions by topic across all years for targeted revision"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left: Topic Selector */}
          <div className="space-y-4">
            {/* Mobile: Dropdown Select */}
            <div className="lg:hidden space-y-3">
              <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
                {[
                  { value: "all", label: lang === "zh" ? "全部" : "All" },
                  { value: "paper1", label: lang === "zh" ? "卷一" : "P1" },
                  { value: "paper2", label: lang === "zh" ? "卷二" : "P2" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedPaper(opt.value as "all" | "paper1" | "paper2")}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-180 ${
                      selectedPaper === opt.value
                        ? "bg-white text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
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
                  className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-border/60 bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                >
                  <option value="">{lang === "zh" ? "— 選擇課題 —" : "— Select Topic —"}</option>
                  <optgroup label={lang === "zh" ? "初中課題" : "Junior Topics"}>
                    {allTopics.filter(t => t.startsWith("J")).map((topic) => (
                      <option key={topic} value={topic}>{getTopicDisplayName(topic, lang)}</option>
                    ))}
                  </optgroup>
                  <optgroup label={lang === "zh" ? "高中課題" : "Senior Topics"}>
                    {allTopics.filter(t => t.startsWith("S")).map((topic) => (
                      <option key={topic} value={topic}>{getTopicDisplayName(topic, lang)}</option>
                    ))}
                  </optgroup>
                  <optgroup label={lang === "zh" ? "其他" : "Other"}>
                    {allTopics.filter(t => !t.startsWith("J") && !t.startsWith("S")).map((topic) => (
                      <option key={topic} value={topic}>{getTopicDisplayName(topic, lang)}</option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Desktop: Search + List */}
            <div className="hidden lg:block space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "zh" ? "搜尋課題..." : "Search topics..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>

            {/* Paper Filter */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
              {[
                { value: "all", label: lang === "zh" ? "全部" : "All" },
                { value: "paper1", label: lang === "zh" ? "卷一" : "P1" },
                { value: "paper2", label: lang === "zh" ? "卷二" : "P2" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedPaper(opt.value as "all" | "paper1" | "paper2")}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-180 ${
                    selectedPaper === opt.value
                      ? "bg-white text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Topic List */}
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden max-h-[60vh] overflow-y-auto">
              {/* Junior Topics */}
              {filteredTopics.filter(t => t.startsWith("J")).length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    {lang === "zh" ? "初中課題 (Junior)" : "Junior Topics"}
                  </div>
                  {filteredTopics.filter(t => t.startsWith("J")).map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`w-full text-left px-4 py-2.5 text-sm border-b border-border/20 transition-colors ${
                        selectedTopic === topic
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/30 text-foreground"
                      }`}
                    >
                      {getTopicDisplayName(topic, lang)}
                    </button>
                  ))}
                </div>
              )}

              {/* Senior Topics */}
              {filteredTopics.filter(t => t.startsWith("S")).length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    {lang === "zh" ? "高中課題" : "Senior Topics"}
                  </div>
                  {filteredTopics.filter(t => t.startsWith("S")).map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`w-full text-left px-4 py-2.5 text-sm border-b border-border/20 transition-colors ${
                        selectedTopic === topic
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/30 text-foreground"
                      }`}
                    >
                      {getTopicDisplayName(topic, lang)}
                    </button>
                  ))}
                </div>
              )}

              {/* Other */}
              {filteredTopics.filter(t => !t.startsWith("J") && !t.startsWith("S")).length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    {lang === "zh" ? "其他" : "Other"}
                  </div>
                  {filteredTopics.filter(t => !t.startsWith("J") && !t.startsWith("S")).map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`w-full text-left px-4 py-2.5 text-sm border-b border-border/20 transition-colors ${
                        selectedTopic === topic
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/30 text-foreground"
                      }`}
                    >
                      {getTopicDisplayName(topic, lang)}
                    </button>
                  ))}
                </div>
              )}

              {filteredTopics.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {lang === "zh" ? "找不到相關課題" : "No matching topics"}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {!selectedTopic ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Filter className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {lang === "zh" ? "選擇一個課題" : "Select a Topic"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {lang === "zh"
                    ? "從左方選擇一個課題，即可查看所有年份中該課題的相關題目"
                    : "Select a topic from the left panel to view all related questions across years"}
                </p>
              </div>
            ) : (
              <div>
                {/* Selected Topic Header */}
                <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h2 className="font-display font-semibold text-lg text-foreground">{getTopicDisplayName(selectedTopic, lang)}</h2>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{questionResults.length} {lang === "zh" ? "題" : "questions"}</span>
                    <span>{Object.keys(groupedResults).length} {lang === "zh" ? "年份" : "years"}</span>
                    {questionResults.length > 0 && (
                      <span>
                        {lang === "zh" ? "平均得分率" : "Avg"}: {(questionResults.reduce((s, r) => s + r.performance, 0) / questionResults.length).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Historical Scoring Trend Line Chart */}
                {trendChartData.length >= 2 && (
                  <div className="mb-6 p-4 rounded-xl border border-border/60 bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">
                        {lang === "zh" ? "歷年平均得分率趨勢" : "Historical Avg. Score Rate Trend"}
                      </h3>
                    </div>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis
                            dataKey="year"
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                            tickLine={false}
                            tickFormatter={(v) => `${v}%`}
                            width={45}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                            formatter={(value: number, name: string) => [
                              `${value}%`,
                              lang === "zh" ? "平均得分率" : "Avg Score Rate",
                            ]}
                            labelFormatter={(label) => `${label} DSE`}
                          />
                          <Line
                            type="monotone"
                            dataKey="avg"
                            stroke="#0ea5e9"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "#0ea5e9", strokeWidth: 2, stroke: "#fff" }}
                            activeDot={{ r: 6, fill: "#0ea5e9", strokeWidth: 2, stroke: "#fff" }}
                            name={lang === "zh" ? "平均得分率" : "Avg Score Rate"}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
                      {lang === "zh"
                        ? "數據來源：HKEAA 考試報告（答對百分率）"
                        : "Source: HKEAA Examination Reports (Correct Rate)"}
                    </p>
                  </div>
                )}

                {/* Results grouped by year */}
                <div className="space-y-3">
                  {Object.entries(groupedResults)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([year, questions]) => (
                      <div key={year} className="rounded-xl border border-border/60 bg-card overflow-hidden">
                        <button
                          onClick={() => toggleGroup(year)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-display font-bold text-foreground">{year}</span>
                            <span className="text-xs text-muted-foreground">
                              {questions.length} {lang === "zh" ? "題" : "Q"}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {lang === "zh" ? "平均" : "Avg"}: {(questions.reduce((s, q) => s + q.performance, 0) / questions.length).toFixed(1)}%
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                              expandedGroups.has(year) ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {expandedGroups.has(year) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border/30">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-muted/20">
                                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{t("table.question")}</th>
                                      <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">
                                        {lang === "zh" ? "卷" : "Paper"}
                                      </th>
                                      {selectedPaper !== "paper1" && (
                                        <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">{t("table.answer")}</th>
                                      )}
                                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground min-w-[140px]">{t("table.performance")}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {questions.map((q, idx) => (
                                      <tr
                                        key={`${q.year}-${q.paper}-${q.question}-${idx}`}
                                        className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors"
                                      >
                                        <td className="px-4 py-2.5 font-mono font-medium text-foreground">{q.question}</td>
                                        <td className="px-4 py-2.5 text-center">
                                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            q.paper === "paper1"
                                              ? "bg-blue-100 text-blue-700"
                                              : "bg-amber-100 text-amber-700"
                                          }`}>
                                            {q.paper === "paper1" ? (lang === "zh" ? "卷一" : "P1") : (lang === "zh" ? "卷二" : "P2")}
                                          </span>
                                        </td>
                                        {selectedPaper !== "paper1" && (
                                          <td className="px-4 py-2.5 text-center">
                                            {q.answer && (
                                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-mono font-bold text-xs">
                                                {q.answer}
                                              </span>
                                            )}
                                          </td>
                                        )}
                                        <td className="px-4 py-2.5">
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
                      </div>
                    ))}
                </div>

                {questionResults.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    {lang === "zh" ? "此課題在所選卷別中沒有相關題目" : "No questions found for this topic in the selected paper"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
