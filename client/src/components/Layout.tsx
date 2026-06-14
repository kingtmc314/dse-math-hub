import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663664977018/Dqf2nGr5sD7rkq2cUcVNo3/logo-TfMbb9kmBDGf6TMYWiJpRf.webp";

interface NavGroup {
  label: string;
  children: { path: string; label: string }[];
}

interface NavItem {
  path: string;
  label: string;
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

function DesktopDropdown({ group, isActive }: { group: NavGroup; isActive: (path: string) => boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const hasActiveChild = group.children.some((c) => isActive(c.path));

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div ref={ref} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-180 ${
          hasActiveChild
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        onClick={() => setOpen(!open)}
      >
        {group.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 mt-1 min-w-[180px] py-1.5 bg-white rounded-xl border border-border/60 shadow-lg shadow-black/5"
          >
            {group.children.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useLanguage();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileGroup, setExpandedMobileGroup] = useState<string | null>(null);

  const navEntries: NavEntry[] = [
    { path: "/", label: t("nav.home") },
    { path: "/compulsory", label: lang === "zh" ? "必修部分" : "Compulsory" },
    { path: "/m2-hub", label: lang === "zh" ? "數學延伸 M2" : "M2 Extended" },
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
            {navEntries.map((entry, idx) =>
              isGroup(entry) ? (
                <DesktopDropdown key={idx} group={entry} isActive={isActive} />
              ) : (
                <Link
                  key={entry.path}
                  href={entry.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-180 ${
                    isActive(entry.path)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {entry.label}
                </Link>
              )
            )}
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
              <div className="container py-3 flex flex-col gap-0.5">
                {navEntries.map((entry, idx) =>
                  isGroup(entry) ? (
                    <div key={idx}>
                      <button
                        onClick={() =>
                          setExpandedMobileGroup(expandedMobileGroup === entry.label ? null : entry.label)
                        }
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                          entry.children.some((c) => isActive(c.path))
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {entry.label}
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            expandedMobileGroup === entry.label ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {expandedMobileGroup === entry.label && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 flex flex-col gap-0.5 pb-1">
                              {entry.children.map((item) => (
                                <Link
                                  key={item.path}
                                  href={item.path}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActive(item.path)
                                      ? "bg-primary/10 text-primary"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                  }`}
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      key={entry.path}
                      href={entry.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive(entry.path)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {entry.label}
                    </Link>
                  )
                )}
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
