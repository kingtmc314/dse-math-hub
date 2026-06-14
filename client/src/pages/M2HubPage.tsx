import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Filter, TrendingDown, Grid3X3 } from "lucide-react";
import M2Page from "./M2Page";
import M2TopicFilterPage from "./M2TopicFilterPage";
import M2TopicRankingPage from "./M2TopicRankingPage";
import M2TopicMatrixPage from "./M2TopicMatrixPage";

type TabId = "scores" | "topic-filter" | "topic-ranking" | "topic-matrix";

interface Tab {
  id: TabId;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: "scores", label: "M2 得分率", labelEn: "M2 Scores", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: "topic-filter", label: "課題篩選", labelEn: "Topic Filter", icon: <Filter className="w-3.5 h-3.5" /> },
  { id: "topic-ranking", label: "難度排名", labelEn: "Difficulty", icon: <TrendingDown className="w-3.5 h-3.5" /> },
  { id: "topic-matrix", label: "課題分佈", labelEn: "Matrix", icon: <Grid3X3 className="w-3.5 h-3.5" /> },
];

export default function M2HubPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>("scores");

  const renderContent = () => {
    switch (activeTab) {
      case "scores": return <M2Page />;
      case "topic-filter": return <M2TopicFilterPage />;
      case "topic-ranking": return <M2TopicRankingPage />;
      case "topic-matrix": return <M2TopicMatrixPage />;
      default: return <M2Page />;
    }
  };

  const tabBtn = (tab: Tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`relative flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-150 ${
        activeTab === tab.id
          ? "bg-violet-100 text-violet-700"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      {tab.icon}
      <span>{lang === "zh" ? tab.label : tab.labelEn}</span>
      {activeTab === tab.id && (
        <motion.div
          layoutId="m2-tab-indicator"
          className="absolute inset-0 bg-violet-100 rounded-lg"
          style={{ zIndex: -1 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        />
      )}
    </button>
  );

  return (
    <div className="min-h-screen">
      {/* Tab Navigation */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-border/50">
        <div className="px-3 sm:px-4 md:container">

          {/* ── Mobile (< sm): 2×2 grid ── */}
          <div className="sm:hidden py-1.5 grid grid-cols-2 gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[12px] font-medium transition-all duration-150 ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
                {tab.icon}
                {lang === "zh" ? tab.label : tab.labelEn}
              </button>
            ))}
          </div>

          {/* ── Tablet (sm–md): scrollable single row ── */}
          <div className="hidden sm:flex md:hidden items-center gap-2 py-2 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  activeTab === tab.id
                    ? "bg-violet-100 text-violet-700 border border-violet-200"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {tab.icon}
                {lang === "zh" ? tab.label : tab.labelEn}
              </button>
            ))}
          </div>

          {/* ── Desktop (≥ md): full row with icons ── */}
          <div className="hidden md:flex items-center gap-1 py-2">
            {TABS.map(tab => tabBtn(tab))}
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
