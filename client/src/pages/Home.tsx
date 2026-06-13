import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { FileText, CheckSquare, Calculator, ArrowRight } from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663664977018/Dqf2nGr5sD7rkq2cUcVNo3/hero-bg-QPj2dG3xVvkYNEUeo5Sa2A.webp";
const STATS_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663664977018/Dqf2nGr5sD7rkq2cUcVNo3/stats-illustration-STuAWmwJAoVEvqSqnhRCp3.webp";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Home() {
  const { t, lang } = useLanguage();

  const papers = [
    {
      path: "/paper1",
      title: t("paper1.title"),
      desc: t("paper1.desc"),
      icon: FileText,
      color: "from-sky-500 to-cyan-500",
      bgColor: "bg-sky-50",
      iconColor: "text-sky-600",
      stats: "14 年 · 553 題",
      statsEn: "14 Years · 553 Questions",
    },
    {
      path: "/paper2",
      title: t("paper2.title"),
      desc: t("paper2.desc"),
      icon: CheckSquare,
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      stats: "14 年 · 630 題",
      statsEn: "14 Years · 630 Questions",
    },
    {
      path: "/m2",
      title: t("m2.title"),
      desc: t("m2.desc"),
      icon: Calculator,
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-violet-50",
      iconColor: "text-violet-600",
      stats: "14 年 · 472 題",
      statsEn: "14 Years · 472 Questions",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden py-20 md:py-28"
        style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="container relative z-10">
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="max-w-2xl"
          >
            <motion.h1
              variants={fadeUp}
              className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight"
            >
              {t("hero.title")}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-lg md:text-xl text-primary font-display font-medium"
            >
              {t("hero.subtitle")}
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-3 text-base text-muted-foreground leading-relaxed max-w-xl"
            >
              {t("hero.description")}
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8">
              <Link
                href="/paper1"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.97]"
              >
                {t("hero.start")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
        {/* Decorative illustration */}
        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-[380px] opacity-90">
          <img src={STATS_IMG} alt="" className="w-full h-auto" />
        </div>
      </section>

      {/* Paper Cards */}
      <section className="py-16 md:py-20">
        <div className="container">
          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-3 gap-6"
          >
            {papers.map((paper) => (
              <motion.div key={paper.path} variants={fadeUp}>
                <Link href={paper.path}>
                  <div className="group relative rounded-2xl border border-border/60 bg-card p-6 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-200">
                    <div className={`w-12 h-12 rounded-xl ${paper.bgColor} flex items-center justify-center mb-4`}>
                      <paper.icon className={`w-6 h-6 ${paper.iconColor}`} />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-1.5">
                      {paper.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {paper.desc}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground/80">
                        {paper.stats}
                      </span>
                      <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                    {/* Gradient accent line */}
                    <div className={`absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r ${paper.color} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 bg-muted/30 border-y border-border/40">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "15", label: { zh: "年份涵蓋", en: "Years Covered" } },
              { value: "1,655", label: { zh: "題目總數", en: "Total Questions" } },
              { value: "3", label: { zh: "考卷類型", en: "Paper Types" } },
              { value: "100%", label: { zh: "數據覆蓋率", en: "Data Coverage" } },
            ].map((stat) => (
              <div key={stat.value} className="py-3">
                <div className="font-display font-bold text-2xl md:text-3xl text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label[lang]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
