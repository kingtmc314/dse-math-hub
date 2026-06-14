import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, BarChart3, Search, Table2, Filter, TrendingDown, Grid3X3 } from "lucide-react";
import Paper1Page from "./Paper1Page";
import Paper2Page from "./Paper2Page";
import MCLookupPage from "./MCLookupPage";
import MCAnswerTablePage from "./MCAnswerTablePage";
import AnswerDistributionPage from "./AnswerDistributionPage";
import CompulsoryTopicFilterPage from "./CompulsoryTopicFilterPage";
import CompulsoryTopicRankingPage from "./CompulsoryTopicRankingPage";
import CompulsoryTopicMatrixPage from "./CompulsoryTopicMatrixPage";

type TabId = "paper1" | "paper2" | "mc-lookup" | "mc-table" | "answer-dist" | "topic-filter" | "topic-ranking" | "topic-matrix";

interface Tab {
  id: TabId;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  category: "scores" | "paper2-mc" | "topics";
}

const TABS: Tab[] = [
  { id: "paper1", label: "卷一得分率", labelEn: "Paper 1 Scores", icon: <FileText className="w-4 h-4" />, category: "scores" },
  { id: "paper2", label: "卷二得分率", labelEn: "Paper 2 Scores", icon: <BarChart3 className="w-4 h-4" />, category: "scores" },
  { id: "mc-lookup", label: "MC 題解", labelEn: "MC Solutions", icon: <Search className="w-4 h-4" />, category: "paper2-mc" },
  { id: "mc-table", label: "答案總表", labelEn: "Answer Table", icon: <Table2 className="w-4 h-4" />, category: "paper2-mc" },
  { id: "answer-dist", label: "選項分佈", labelEn: "Answer Dist.", icon: <BarChart3 className="w-4 h-4" />, category: "paper2-mc" },
  { id: "topic-filter", label: "課題篩選", labelEn: "Topic Filter", icon: <Filter className="w-4 h-4" />, category: "topics" },
  { id: "topic-ranking", label: "難度排名", labelEn: "Difficulty Rank", icon: <TrendingDown className="w-4 h-4" />, category: "topics" },
  { id: "topic-matrix", label: "課題分佈", labelEn: "Topic Matrix", icon: <Grid3X3 className="w-4 h-4" />, category: "topics" },
];

const CATEGORIES = [
  { id: "scores", labelZh: "得分率", labelEn: "Scores" },
  { id: "paper2-mc", labelZh: "卷二 MC", labelEn: "Paper 2 MC" },
  { id: "topics", labelZh: "課題分析", labelEn: "Topics" },
];

export default function CompulsoryHubPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>("paper1");

  const renderContent = () => {
    switch (activeTab) {
      case "paper1": return <Paper1Page />;
      case "paper2": return <Paper2Page />;
      case "mc-lookup": return <MCLookupPage />;
      case "mc-table": return <MCAnswerTablePage />;
      case "answer-dist": return <AnswerDistributionPage />;
      case "topic-filter": return <CompulsoryTopicFilterPage />;
      case "topic-ranking": return <CompulsoryTopicRankingPage />;
      case "topic-matrix": return <CompulsoryTopicMatrixPage />;
      default: return <Paper1Page />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Tab Navigation */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-border/50">
        <div className="container">
          {/* Desktop: horizontal tabs grouped by category */}
          <div className="hidden md:flex items-center gap-1 py-2 overflow-x-auto">
            {CATEGORIES.map((cat, catIdx) => (
              <div key={cat.id} className="flex items-center">
                {catIdx > 0 && <div className="w-px h-6 bg-border/40 mx-2" />}
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mr-2 whitespace-nowrap">
                  {lang === "zh" ? cat.labelZh : cat.labelEn}
                </span>
                {TABS.filter(t => t.category === cat.id).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-180 ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    {tab.icon}
                    {lang === "zh" ? tab.label : tab.labelEn}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="compulsory-tab-indicator"
                        className="absolute inset-0 bg-primary/10 rounded-lg"
                        style={{ zIndex: -1 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Mobile: scrollable tabs */}
          <div className="md:hidden flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-180 ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {tab.icon}
                {lang === "zh" ? tab.label : tab.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
}
