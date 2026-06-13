import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LatexRendererProps {
  latex: string;
  displayMode?: boolean;
}

export default function LatexRenderer({ latex, displayMode = true }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !latex) return;

    try {
      katex.render(latex, containerRef.current, {
        displayMode,
        throwOnError: false,
        trust: true,
        strict: false,
        macros: {
          "\\deg": "°",
          "\\therefore": "∴",
          "\\because": "∵",
        },
      });
    } catch (e) {
      // Fallback: show raw LaTeX in a code block
      if (containerRef.current) {
        containerRef.current.innerHTML = `<pre class="text-xs bg-muted/50 p-2 rounded overflow-x-auto"><code>${latex.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
      }
    }
  }, [latex, displayMode]);

  return <div ref={containerRef} className="overflow-x-auto" />;
}

interface SolutionBlockProps {
  solutionText: string;
  latexBlocks: string[];
  solutionImages?: string[];
}

export function SolutionBlock({ solutionText, latexBlocks, solutionImages }: SolutionBlockProps) {
  if (!latexBlocks.length && !solutionText && (!solutionImages || !solutionImages.length)) {
    return <p className="text-sm text-muted-foreground italic">No solution available</p>;
  }

  return (
    <div className="space-y-3">
      {/* Render LaTeX blocks */}
      {latexBlocks.map((block, idx) => (
        <div key={idx} className="py-1">
          <LatexRenderer latex={block} />
        </div>
      ))}

      {/* If no LaTeX but has text, show the text */}
      {latexBlocks.length === 0 && solutionText && (
        <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
          {solutionText}
        </div>
      )}

      {/* Render solution diagram images */}
      {solutionImages && solutionImages.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/20">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            圖解
          </p>
          <div className="flex flex-wrap gap-3">
            {solutionImages.map((imgUrl, idx) => (
              <a
                key={idx}
                href={imgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-border/40 overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-white"
              >
                <img
                  src={imgUrl}
                  alt={`Solution diagram ${idx + 1}`}
                  className="max-h-56 w-auto object-contain p-2"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
