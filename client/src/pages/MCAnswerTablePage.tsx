/*
 * MC Answer Master Table Page
 * Design: Mathematical, professional, vibrant with light background
 * Shows a large table of all correct answers by year × question number
 */
import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import dseData from "@/data/dseData.json";

interface Paper2Question {
  q: number;
  ans: string;
  A: number;
  B: number;
  C: number;
  D: number;
}

export default function MCAnswerTablePage() {
  const { lang } = useLanguage();
  const [highlightAnswer, setHighlightAnswer] = useState<string | null>(null);
  const [showSection, setShowSection] = useState<"all" | "secA" | "secB">("all");

  const years = useMemo(() => {
    return Object.keys(dseData.paper2).sort();
  }, []);

  // Build answer grid: questions[qNum][year] = answer
  const answerGrid = useMemo(() => {
    const grid: Record<number, Record<string, string>> = {};
    for (const year of years) {
      const questions = (dseData.paper2 as Record<string, Paper2Question[]>)[year] || [];
      for (const q of questions) {
        if (!grid[q.q]) grid[q.q] = {};
        grid[q.q][year] = q.ans;
      }
    }
    return grid;
  }, [years]);

  const questionNumbers = useMemo(() => {
    const nums = Object.keys(answerGrid).map(Number).sort((a, b) => a - b);
    if (showSection === "secA") return nums.filter(n => n <= 30);
    if (showSection === "secB") return nums.filter(n => n > 30);
    return nums;
  }, [answerGrid, showSection]);

  const getAnswerColor = (ans: string) => {
    const colors: Record<string, string> = {
      A: "bg-red-100 text-red-700 border-red-200",
      B: "bg-blue-100 text-blue-700 border-blue-200",
      C: "bg-green-100 text-green-700 border-green-200",
      D: "bg-amber-100 text-amber-700 border-amber-200",
    };
    return colors[ans] || "bg-muted text-muted-foreground";
  };

  const getHighlightClass = (ans: string) => {
    if (!highlightAnswer) return "";
    return ans === highlightAnswer ? "ring-2 ring-primary ring-offset-1 scale-110 font-bold" : "opacity-30";
  };

  return (
    <div className="py-8 md:py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            {lang === "zh" ? "MC 答案總大表" : "MC Answer Master Table"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lang === "zh"
              ? "2012-2025 年 Paper II 所有題目正確答案一覽"
              : "All correct answers for Paper II questions from 2012-2025"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Section filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">
              {lang === "zh" ? "範圍：" : "Section:"}
            </span>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {[
                { key: "all", zh: "全卷", en: "All" },
                { key: "secA", zh: "Sec A (1-30)", en: "Sec A (1-30)" },
                { key: "secB", zh: "Sec B (31-45)", en: "Sec B (31-45)" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setShowSection(item.key as "all" | "secA" | "secB")}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    showSection === item.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-muted text-foreground"
                  }`}
                >
                  {lang === "zh" ? item.zh : item.en}
                </button>
              ))}
            </div>
          </div>

          {/* Highlight filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">
              {lang === "zh" ? "篩選：" : "Highlight:"}
            </span>
            <div className="flex gap-1.5">
              {["A", "B", "C", "D"].map((ans) => (
                <button
                  key={ans}
                  onClick={() => setHighlightAnswer(highlightAnswer === ans ? null : ans)}
                  className={`w-8 h-8 rounded-md text-sm font-bold border transition-all ${getAnswerColor(ans)} ${
                    highlightAnswer === ans ? "ring-2 ring-primary ring-offset-1 scale-110" : ""
                  }`}
                >
                  {ans}
                </button>
              ))}
              {highlightAnswer && (
                <button
                  onClick={() => setHighlightAnswer(null)}
                  className="px-2 h-8 rounded-md text-xs font-medium border border-border bg-card hover:bg-muted text-muted-foreground transition-colors"
                >
                  {lang === "zh" ? "清除" : "Clear"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border/60">
                  <th className="sticky left-0 z-10 bg-muted/90 backdrop-blur-sm px-3 py-2.5 text-left font-semibold text-foreground border-r border-border/40 min-w-[60px]">
                    {lang === "zh" ? "題號" : "Q#"}
                  </th>
                  {years.map((year) => (
                    <th key={year} className="px-2 py-2.5 text-center font-semibold text-foreground min-w-[48px]">
                      {year.slice(2)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {questionNumbers.map((qNum, idx) => (
                  <tr
                    key={qNum}
                    className={`border-b border-border/20 ${idx % 2 === 0 ? "" : "bg-muted/20"} ${
                      qNum === 30 ? "border-b-2 border-b-primary/30" : ""
                    }`}
                  >
                    <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-3 py-1.5 font-medium text-foreground border-r border-border/40">
                      <span className="text-xs text-muted-foreground">Q</span>{qNum}
                    </td>
                    {years.map((year) => {
                      const ans = answerGrid[qNum]?.[year] || "-";
                      return (
                        <td key={year} className="px-1 py-1 text-center">
                          {ans !== "-" ? (
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold border transition-all duration-150 ${getAnswerColor(ans)} ${getHighlightClass(ans)}`}
                            >
                              {ans}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {["A", "B", "C", "D"].map((ans) => {
            const count = questionNumbers.reduce((sum, qNum) => {
              return sum + years.filter((y) => answerGrid[qNum]?.[y] === ans).length;
            }, 0);
            const total = questionNumbers.length * years.length;
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
            return (
              <div key={ans} className={`rounded-xl border p-4 ${getAnswerColor(ans)}`}>
                <div className="text-lg font-bold">{ans}</div>
                <div className="text-sm opacity-80">
                  {count} {lang === "zh" ? "次" : "times"} ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
