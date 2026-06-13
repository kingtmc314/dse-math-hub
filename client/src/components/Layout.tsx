import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663664977018/Dqf2nGr5sD7rkq2cUcVNo3/logo-TfMbb9kmBDGf6TMYWiJpRf.webp";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useLanguage();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: t("nav.home") },
    { path: "/paper1", label: t("nav.paper1") },
    { path: "/paper2", label: t("nav.paper2") },
    { path: "/m2", label: t("nav.m2") },
    { path: "/topics", label: t("nav.topics") },
    { path: "/ranking", label: t("nav.ranking") },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src={LOGO_URL} alt="DSE Maths Hub" className="w-9 h-9 transition-transform group-hover:scale-105" />
            <span className="font-display font-bold text-lg tracking-tight text-foreground">
              DSE Maths<span className="text-primary"> Hub</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-180 ${
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Language Switch + Mobile Menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "zh" ? "en" : "zh")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border/60 hover:bg-muted transition-all duration-180 active:scale-[0.97]"
            >
              <Globe className="w-4 h-4" />
              <span className="font-mono text-xs">{lang === "zh" ? "EN" : "中"}</span>
            </button>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="md:hidden border-t border-border/50 bg-white/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="container py-3 flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p className="font-display font-medium text-foreground/70 mb-1">DSE Maths Hub</p>
          <p>{lang === "zh" ? "數據來源：HKEAA 考評局歷屆試題報告" : "Data Source: HKEAA Examination Reports"}</p>
          <p className="mt-1 text-xs opacity-70">2012 – 2025 | {lang === "zh" ? "必修卷一、卷二及 M2" : "Compulsory Paper 1, Paper 2 & M2"}</p>
        </div>
      </footer>
    </div>
  );
}
