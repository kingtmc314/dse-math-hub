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
}

export function SolutionBlock({ solutionText, latexBlocks }: SolutionBlockProps) {
  if (!latexBlocks.length && !solutionText) {
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
    </div>
  );
}
