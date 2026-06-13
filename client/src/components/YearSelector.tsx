import { useLanguage } from "@/contexts/LanguageContext";

interface YearSelectorProps {
  years: string[];
  selected: string;
  onChange: (year: string) => void;
}

export default function YearSelector({ years, selected, onChange }: YearSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">{t("year.select")}:</span>
      <div className="flex flex-wrap gap-1.5">
        {years.slice().reverse().map((year) => (
          <button
            key={year}
            onClick={() => onChange(year)}
            className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition-all duration-150 active:scale-[0.97] ${
              selected === year
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}
