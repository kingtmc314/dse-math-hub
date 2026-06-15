// Design: Clean academic style — teal/cyan palette, asymmetric left-sidebar layout
// Chart: Recharts LineChart with P1/P2 separate lines, custom tooltip showing question list per year
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, Dot
} from "recharts";
import dseData from "@/data/dseData.json";
import { matchPaper1Questions } from "@/lib/topicMatcher";
import { CURRICULUM_TOPICS, CurriculumTopic, topicMatchesCurriculum } from "@/data/curriculumTopics";
import PerformanceBar from "@/components/PerformanceBar";

interface QuestionResult {
  year: string;
  paper: "paper1" | "paper2";
  question: string;
  luCode: string;
  performance: number;
  answer?: string;
  fullMarks?: number;
}

// Custom tooltip for the trend chart
function TrendTooltip({ active, payload, label, lang, groupedResults }: any) {
  if (!active || !payload || !payload.length) return null;
  const yearData = groupedResults[label] || [];
  const p1Qs = yearData.filter((q: QuestionResult) => q.paper === "paper1");
  const p2Qs = yearData.filter((q: QuestionResult) => q.paper === "paper2");

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[180px] text-xs">
      <p className="font-bold text-gray-800 mb-2 text-sm">{label} {lang === "zh" ? "年" : ""}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="mb-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="font-semibold" style={{ color: entry.color }}>
              {entry.dataKey === "p1avg"
                ? (lang === "zh" ? "卷一" : "Paper 1")
                : (lang === "zh" ? "卷二" : "Paper 2")}
              : {entry.value !== null ? `${entry.value}%` : "—"}
            </span>
          </div>
          {entry.dataKey === "p1avg" && p1Qs.length > 0 && (
            <div className="pl-3.5 space-y-0.5">
              {p1Qs.map((q: QuestionResult, i: number) => (
                <div key={i} className="flex items-center gap-2 text-gray-600">
                  <span className="font-mono font-medium">{q.question}</span>
                  <span className={`font-bold ${q.performance < 40 ? "text-red-500" : q.performance < 60 ? "text-amber-500" : "text-green-600"}`}>
                    {q.performance}%
                  </span>
                  {q.fullMarks && <span className="text-gray-400">/{q.fullMarks}分</span>}
                </div>
              ))}
            </div>
          )}
          {entry.dataKey === "p2avg" && p2Qs.length > 0 && (
            <div className="pl-3.5 space-y-0.5">
              {p2Qs.map((q: QuestionResult, i: number) => (
                <div key={i} className="flex items-center gap-2 text-gray-600">
                  <span className="font-mono font-medium">{q.question}</span>
                  <span className={`font-bold ${q.performance < 40 ? "text-red-500" : q.performance < 60 ? "text-amber-500" : "text-green-600"}`}>
                    {q.performance}%
                  </span>
                  {q.answer && <span className="text-gray-400">Ans:{q.answer}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CompulsoryTopicFilterPage() {
  const { lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumTopic | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<"all" | "paper1" | "paper2">("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const filteredCurriculumTopics = useMemo(() => {
    if (!searchQuery) return CURRICULUM_TOPICS;
    const q = searchQuery.toLowerCase();
    return CURRICULUM_TOPICS.filter(ct =>
      ct.zh.toLowerCase().includes(q) ||
      ct.en.toLowerCase().includes(q) ||
      ct.lus.some(lu => lu.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Build question results for the selected curriculum topic
  const questionResults = useMemo(() => {
    if (!selectedCurriculum) return [];
    const results: QuestionResult[] = [];

    // Search Paper 1
    if (selectedPaper === "all" || selectedPaper === "paper1") {
      for (const [year, topics] of Object.entries(dseData.paper1_topics as Record<string, Array<{ topic: string; questions: string }>>)) {
        for (const topicEntry of topics) {
          if (!topicMatchesCurriculum(topicEntry.topic, selectedCurriculum)) continue;
          const yearQuestions = (dseData.paper1 as any)[year] || [];
          const matched = matchPaper1Questions(topicEntry.questions, yearQuestions);
          for (const qData of matched) {
            results.push({
              year,
              paper: "paper1",
              question: `Q${qData.q}`,
              luCode: topicEntry.topic,
              performance: qData.pct,
              fullMarks: qData.full,
            });
          }
        }
      }
    }

    // Search Paper 2 (flat format: {year: {q: topic_name}})
    if (selectedPaper === "all" || selectedPaper === "paper2") {
      const paper2TopicsFlat = dseData.paper2_topics as Record<string, Record<string, string>>;
      for (const [year, topicMap] of Object.entries(paper2TopicsFlat)) {
        const yearQuestions = (dseData.paper2 as Record<string, Array<{ q: number; ans: string; A: number; B: number; C: number; D: number }>>)[year] || [];
        for (const [qNum, topicName] of Object.entries(topicMap)) {
          if (!topicMatchesCurriculum(topicName, selectedCurriculum)) continue;
          const qData = yearQuestions.find(q => q.q === Number(qNum));
          if (qData) {
            const correctRate = qData[qData.ans as keyof Pick<typeof qData, "A" | "B" | "C" | "D">] as number || 0;
            results.push({
              year,
              paper: "paper2",
              question: `Q${qData.q}`,
              luCode: topicName,
              performance: correctRate,
              answer: qData.ans,
            });
          }
        }
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    const deduped: QuestionResult[] = [];
    for (const r of results) {
      const key = `${r.year}-${r.paper}-${r.question}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(r);
      }
    }

    deduped.sort((a, b) => {
      if (b.year !== a.year) return Number(b.year) - Number(a.year);
      return Number(a.question.replace(/Q|\(.*\)/g, "")) - Number(b.question.replace(/Q|\(.*\)/g, ""));
    });

    return deduped;
  }, [selectedCurriculum, selectedPaper]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, QuestionResult[]> = {};
    for (const r of questionResults) {
      if (!groups[r.year]) groups[r.year] = [];
      groups[r.year].push(r);
    }
    return groups;
  }, [questionResults]);

  // Build trend chart data — separate P1 and P2 lines
  const trendChartData = useMemo(() => {
    // Collect all years from both papers (regardless of filter)
    const allYears = new Set<string>();
    Object.keys(dseData.paper1_topics).forEach(y => allYears.add(y));
    Object.keys(dseData.paper2_topics).forEach(y => allYears.add(y));

    return Array.from(allYears).sort().map(year => {
      const yearData = groupedResults[year] || [];
      const p1Qs = yearData.filter(q => q.paper === "paper1");
      const p2Qs = yearData.filter(q => q.paper === "paper2");

      const p1avg = p1Qs.length > 0
        ? Math.round(p1Qs.reduce((s, q) => s + q.performance, 0) / p1Qs.length * 10) / 10
        : null;
      const p2avg = p2Qs.length > 0
        ? Math.round(p2Qs.reduce((s, q) => s + q.performance, 0) / p2Qs.length * 10) / 10
        : null;

      return { year, p1avg, p2avg, total: yearData.length };
    }).filter(d => d.p1avg !== null || d.p2avg !== null);
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
  }, [selectedCurriculum, selectedPaper]);

  const totalQuestions = questionResults.length;
  const avgPerformance = totalQuestions > 0
    ? Math.round(questionResults.reduce((s, q) => s + q.performance, 0) / totalQuestions * 10) / 10
    : 0;

  const handleSelectCurriculum = (ct: CurriculumTopic) => {
    setSelectedCurriculum(ct);
    setExpandedGroups(new Set());
  };

  // Overall trend direction
  const trendDirection = useMemo(() => {
    if (trendChartData.length < 2) return null;
    const recent = trendChartData.slice(-3);
    const older = trendChartData.slice(0, 3);
    const recentAvg = recent.reduce((s, d) => s + ((d.p1avg ?? 0) + (d.p2avg ?? 0)) / (d.p1avg !== null && d.p2avg !== null ? 2 : 1), 0) / recent.length;
    const olderAvg = older.reduce((s, d) => s + ((d.p1avg ?? 0) + (d.p2avg ?? 0)) / (d.p1avg !== null && d.p2avg !== null ? 2 : 1), 0) / older.length;
    return recentAvg > olderAvg ? "easier" : recentAvg < olderAvg ? "harder" : "stable";
  }, [trendChartData]);

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

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
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
                  value={selectedCurriculum?.id || ""}
                  onChange={(e) => {
                    const ct = CURRICULUM_TOPICS.find(t => t.id === Number(e.target.value));
                    if (ct) handleSelectCurriculum(ct);
                    else setSelectedCurriculum(null);
                  }}
                  className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-border/60 bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">{lang === "zh" ? "— 選擇課題 —" : "— Select Topic —"}</option>
                  {CURRICULUM_TOPICS.map(ct => (
                    <option key={ct.id} value={ct.id}>
                      {ct.id}. {lang === "zh" ? ct.zh : ct.en}
                    </option>
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

              <div className="bg-card rounded-xl border border-border/60 overflow-hidden max-h-[65vh] overflow-y-auto">
                {filteredCurriculumTopics.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {lang === "zh" ? "找不到相關課題" : "No topics found"}
                  </div>
                ) : (
                  filteredCurriculumTopics.map(ct => (
                    <button
                      key={ct.id}
                      onClick={() => handleSelectCurriculum(ct)}
                      className={`w-full text-left px-4 py-3 border-b border-border/20 transition-colors ${
                        selectedCurriculum?.id === ct.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/60 text-foreground"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${
                          selectedCurriculum?.id === ct.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {ct.id}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug">
                            {lang === "zh" ? ct.zh : ct.en}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {ct.lus.join(", ")}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {!selectedCurriculum ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {lang === "zh" ? "選擇一個課題" : "Select a Topic"}
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {lang === "zh" ? "從左方選擇一個課題，即可查看所有年份中該課題的相關題目及難度趨勢" : "Select a topic from the left to view all related questions and difficulty trends across years"}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Summary Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-200/60 p-5"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <BookOpen className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-lg text-teal-900">
                        {selectedCurriculum.id}. {lang === "zh" ? selectedCurriculum.zh : selectedCurriculum.en}
                      </h3>
                      <p className="text-xs text-teal-600 mt-0.5">
                        {lang === "zh" ? "涵蓋" : "Covers"}: {selectedCurriculum.lus.join(", ")}
                      </p>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-white/70 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-teal-700">{totalQuestions}</p>
                      <p className="text-[10px] text-teal-600 mt-0.5">{lang === "zh" ? "相關題目" : "Questions"}</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-teal-700">{Object.keys(groupedResults).length}</p>
                      <p className="text-[10px] text-teal-600 mt-0.5">{lang === "zh" ? "出題年份" : "Years"}</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-3 text-center">
                      <p className={`text-2xl font-bold ${avgPerformance < 40 ? "text-red-600" : avgPerformance < 60 ? "text-amber-600" : "text-green-600"}`}>
                        {avgPerformance}%
                      </p>
                      <p className="text-[10px] text-teal-600 mt-0.5">{lang === "zh" ? "平均得分率" : "Avg Score"}</p>
                    </div>
                  </div>

                  {/* Trend Chart — full width, taller, with P1/P2 lines */}
                  {trendChartData.length > 0 && (
                    <div className="bg-white/80 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-teal-600" />
                          <span className="text-xs font-semibold text-teal-800">
                            {lang === "zh" ? "歷年難度趨勢" : "Historical Difficulty Trend"}
                          </span>
                        </div>
                        {trendDirection && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            trendDirection === "easier" ? "bg-green-100 text-green-700" :
                            trendDirection === "harder" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {trendDirection === "easier"
                              ? (lang === "zh" ? "近年趨易" : "Getting Easier")
                              : trendDirection === "harder"
                              ? (lang === "zh" ? "近年趨難" : "Getting Harder")
                              : (lang === "zh" ? "難度穩定" : "Stable")}
                          </span>
                        )}
                      </div>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis
                              dataKey="year"
                              tick={{ fontSize: 10, fill: "#6b7280" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fontSize: 10, fill: "#6b7280" }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => `${v}%`}
                            />
                            <ReferenceLine y={50} stroke="#d1d5db" strokeDasharray="4 4" label={{ value: "50%", position: "right", fontSize: 9, fill: "#9ca3af" }} />
                            <Tooltip
                              content={<TrendTooltip lang={lang} groupedResults={groupedResults} />}
                            />
                            <Legend
                              formatter={(value) => (
                                <span className="text-[10px] text-gray-600">
                                  {value === "p1avg"
                                    ? (lang === "zh" ? "卷一 (長題目)" : "Paper 1 (LQ)")
                                    : (lang === "zh" ? "卷二 (MC)" : "Paper 2 (MC)")}
                                </span>
                              )}
                              wrapperStyle={{ paddingTop: "8px" }}
                            />
                            {(selectedPaper === "all" || selectedPaper === "paper1") && (
                              <Line
                                type="monotone"
                                dataKey="p1avg"
                                stroke="#0d9488"
                                strokeWidth={2.5}
                                dot={(props: any) => {
                                  const { cx, cy, payload } = props;
                                  if (payload.p1avg === null) return <g key={`p1-${payload.year}`} />;
                                  return (
                                    <circle
                                      key={`p1-${payload.year}`}
                                      cx={cx} cy={cy} r={4}
                                      fill="#0d9488"
                                      stroke="white"
                                      strokeWidth={2}
                                    />
                                  );
                                }}
                                activeDot={{ r: 6, fill: "#0d9488", stroke: "white", strokeWidth: 2 }}
                                connectNulls={false}
                                name="p1avg"
                              />
                            )}
                            {(selectedPaper === "all" || selectedPaper === "paper2") && (
                              <Line
                                type="monotone"
                                dataKey="p2avg"
                                stroke="#7c3aed"
                                strokeWidth={2.5}
                                strokeDasharray="5 3"
                                dot={(props: any) => {
                                  const { cx, cy, payload } = props;
                                  if (payload.p2avg === null) return <g key={`p2-${payload.year}`} />;
                                  return (
                                    <circle
                                      key={`p2-${payload.year}`}
                                      cx={cx} cy={cy} r={4}
                                      fill="#7c3aed"
                                      stroke="white"
                                      strokeWidth={2}
                                    />
                                  );
                                }}
                                activeDot={{ r: 6, fill: "#7c3aed", stroke: "white", strokeWidth: 2 }}
                                connectNulls={false}
                                name="p2avg"
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 text-center">
                        {lang === "zh" ? "懸停數據點可查看該年題目詳情" : "Hover over data points to see question details"}
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Year Groups */}
                {totalQuestions === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    {lang === "zh" ? "此課題在所選範圍內沒有相關題目" : "No questions found for this topic in the selected scope"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {lang === "zh" ? "逐年題目明細" : "Questions by Year"}
                      </p>
                      <button
                        onClick={() => {
                          const allYears = Object.keys(groupedResults);
                          const allExpanded = allYears.every(y => expandedGroups.has(y));
                          setExpandedGroups(allExpanded ? new Set() : new Set(allYears));
                        }}
                        className="text-[10px] text-primary hover:underline"
                      >
                        {Object.keys(groupedResults).every(y => expandedGroups.has(y))
                          ? (lang === "zh" ? "全部收起" : "Collapse All")
                          : (lang === "zh" ? "全部展開" : "Expand All")}
                      </button>
                    </div>
                    {Object.entries(groupedResults)
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([year, questions]) => {
                        const yearAvg = Math.round(questions.reduce((s, q) => s + q.performance, 0) / questions.length * 10) / 10;
                        const isExpanded = expandedGroups.has(year);
                        return (
                          <motion.div
                            key={year}
                            initial={{ opacity: 0, y: 8 }}
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
                                          <th className="text-left py-2 font-medium">{lang === "zh" ? "課題" : "Topic"}</th>
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
                                              {q.fullMarks && <span className="ml-1 text-xs text-muted-foreground">/{q.fullMarks}分</span>}
                                            </td>
                                            <td className="py-2">
                                              <span className="text-[10px] text-muted-foreground leading-tight">
                                                {q.luCode.replace(/^\d+\.\s*/, "").split(/\s*\/\s*/)[0].substring(0, 20)}
                                              </span>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
