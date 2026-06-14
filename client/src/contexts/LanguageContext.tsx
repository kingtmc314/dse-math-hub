import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type Language = "zh" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  zh: {
    // Navigation
    "nav.home": "主頁",
    "nav.paper1": "必修卷一",
    "nav.paper2": "必修卷二",
    "nav.m2": "數學延伸 M2",
    "nav.topics": "課題篩選",
    "nav.ranking": "難度排名",
    "nav.mcLookup": "MC 查詢",
    "nav.about": "關於",
    
    // Hero
    "hero.title": "DSE 數學歷屆試題分析",
    "hero.subtitle": "從數據找規律，從規律找分數",
    "hero.description": "涵蓋 2012–2025 年必修卷一、卷二及 M2 所有題目的答題率、答案及課題分析",
    "hero.start": "開始瀏覽",
    
    // Year selector
    "year.select": "選擇年份",
    "year.all": "所有年份",
    
    // Paper sections
    "paper1.title": "必修部分 卷一",
    "paper1.desc": "長題目 — 顯示每題得分率",
    "paper2.title": "必修部分 卷二",
    "paper2.desc": "多項選擇題 — 顯示 ABCD 各選項比率及正確答案",
    "m2.title": "數學延伸部分 M2",
    "m2.desc": "延伸部分 — 顯示每題得分率",
    
    // Table headers
    "table.question": "題號",
    "table.fullMarks": "滿分",
    "table.mean": "平均分",
    "table.performance": "得分率",
    "table.answer": "正確答案",
    "table.topic": "課題",
    "table.correctRate": "答對率",
    
    // Stats
    "stats.avgRate": "平均得分率",
    "stats.highest": "最高",
    "stats.lowest": "最低",
    "stats.totalQ": "題目總數",
    
    // Paper links
    "link.viewPaper": "查看試卷 PDF",
    "link.viewSolution": "查看詳解",
    
    // Misc
    "misc.noData": "暫無數據",
    "misc.loading": "載入中...",
    "misc.correct": "正確",
    "misc.years": "年份",
    "misc.questions": "題",
    "misc.topicAnalysis": "課題分析",
    "misc.performanceChart": "表現圖表",
    "misc.cutoff": "等級分數線",
    "misc.level": "等級",
    "misc.min": "最低",
    "misc.max": "最高",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.paper1": "Paper 1",
    "nav.paper2": "Paper 2",
    "nav.m2": "M2",
    "nav.topics": "Topics",
    "nav.ranking": "Ranking",
    "nav.mcLookup": "MC Lookup",
    "nav.about": "About",
    
    // Hero
    "hero.title": "DSE Maths Past Paper Analysis",
    "hero.subtitle": "Find patterns in data, find marks in patterns",
    "hero.description": "Comprehensive answer rate analysis for Compulsory Paper 1, Paper 2, and M2 from 2012 to 2025",
    "hero.start": "Get Started",
    
    // Year selector
    "year.select": "Select Year",
    "year.all": "All Years",
    
    // Paper sections
    "paper1.title": "Compulsory Part Paper 1",
    "paper1.desc": "Long Questions — Performance rate for each question",
    "paper2.title": "Compulsory Part Paper 2",
    "paper2.desc": "Multiple Choice — ABCD option rates with correct answer",
    "m2.title": "Module 2 (Algebra & Calculus)",
    "m2.desc": "Extended Part — Performance rate for each question",
    
    // Table headers
    "table.question": "Question",
    "table.fullMarks": "Full Marks",
    "table.mean": "Mean",
    "table.performance": "Performance",
    "table.answer": "Answer",
    "table.topic": "Topic",
    "table.correctRate": "Correct Rate",
    
    // Stats
    "stats.avgRate": "Average Rate",
    "stats.highest": "Highest",
    "stats.lowest": "Lowest",
    "stats.totalQ": "Total Questions",
    
    // Paper links
    "link.viewPaper": "View Paper PDF",
    "link.viewSolution": "View Solutions",
    
    // Misc
    "misc.noData": "No data available",
    "misc.loading": "Loading...",
    "misc.correct": "Correct",
    "misc.years": "Year",
    "misc.questions": "Q",
    "misc.topicAnalysis": "Topic Analysis",
    "misc.performanceChart": "Performance Chart",
    "misc.cutoff": "Grade Boundaries",
    "misc.level": "Level",
    "misc.min": "Min",
    "misc.max": "Max",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("dse-math-lang");
    return (saved === "en" || saved === "zh") ? saved : "zh";
  });

  const handleSetLang = useCallback((newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("dse-math-lang", newLang);
  }, []);

  const t = useCallback((key: string) => {
    return translations[lang][key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
