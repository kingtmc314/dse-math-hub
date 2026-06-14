import { useEffect, useRef, useState, useCallback } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LatexRendererProps {
  latex: string;
  displayMode?: boolean;
}

// Clean HTML artifacts from LaTeX strings scraped from web
function cleanLatex(raw: string): string {
  let s = raw;
  // Remove <br> / <br/> tags
  s = s.replace(/<br\s*\/?>/gi, "\n");
  // Decode HTML entities
  s = s.replace(/&#038;/g, "&");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&nbsp;/g, " ");
  s = s.replace(/&quot;/g, '"');
  // Remove any remaining HTML tags
  s = s.replace(/<[^>]+>/g, "");
  return s.trim();
}

export default function LatexRenderer({ latex, displayMode = true }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !latex) return;

    const cleaned = cleanLatex(latex);

    try {
      katex.render(cleaned, containerRef.current, {
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
        containerRef.current.innerHTML = `<pre class="text-xs bg-muted/50 p-2 rounded overflow-x-auto"><code>${cleaned.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
      }
    }
  }, [latex, displayMode]);

  return <div ref={containerRef} className="overflow-x-auto" />;
}

/* ─── Lightbox Component ─── */
interface LightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {
  const [scale, setScale] = useState(1);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
    if (e.key === "ArrowRight" && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    if (e.key === "+" || e.key === "=") setScale(s => Math.min(s + 0.25, 3));
    if (e.key === "-") setScale(s => Math.max(s - 0.25, 0.5));
  }, [onClose, onNavigate, currentIndex, images.length]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  useEffect(() => {
    setScale(1);
  }, [currentIndex]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Zoom controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(s - 0.25, 0.5)); }}
          className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
          aria-label="Zoom out"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>
        </button>
        <span className="text-white text-xs font-medium min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
        <button
          onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.25, 3)); }}
          className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
          aria-label="Zoom in"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Previous image"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      )}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Next image"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/70 text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Main image */}
      <div
        className="flex items-center justify-center w-full h-full p-12 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`Solution diagram ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg bg-white shadow-2xl transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
          draggable={false}
        />
      </div>
    </div>
  );
}

/* ─── Parse mixed text/LaTeX content ─── */
function parseMixedContent(text: string): Array<{ type: "text" | "latex"; content: string }> {
  const parts: Array<{ type: "text" | "latex"; content: string }> = [];
  if (!text) return parts;

  // First, handle $$ delimited blocks by splitting on them
  // Pattern: split text by $$ ... $$ blocks
  const dollarSplit = text.split(/\$\$/);
  
  for (let i = 0; i < dollarSplit.length; i++) {
    const segment = dollarSplit[i];
    if (!segment.trim()) continue;
    
    if (i % 2 === 1) {
      // Odd index = inside $$ delimiters = LaTeX block
      parts.push({ type: "latex", content: segment.trim() });
    } else {
      // Even index = outside $$ = may contain text mixed with \begin environments
      parseTextSegment(segment, parts);
    }
  }

  return parts;
}

/** Parse a text segment that may contain \begin{} environments and LaTeX commands */
function parseTextSegment(text: string, parts: Array<{ type: "text" | "latex"; content: string }>) {
  const lines = text.split("\n");
  let currentLatex = "";
  let currentText = "";
  let inEnvironment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if this line starts or continues a LaTeX environment
    if (trimmed.match(/^\\begin\{/)) {
      if (currentText.trim()) {
        parts.push({ type: "text", content: currentText.trim() });
        currentText = "";
      }
      inEnvironment = true;
      currentLatex += (currentLatex ? "\n" : "") + trimmed;
    } else if (inEnvironment) {
      currentLatex += "\n" + trimmed;
      if (trimmed.match(/^\\end\{/)) {
        inEnvironment = false;
        parts.push({ type: "latex", content: currentLatex });
        currentLatex = "";
      }
    } else if (trimmed.match(/^\\[a-zA-Z]/) && !trimmed.match(/^\\text\{/)) {
      // Line starts with a LaTeX command (but not \text)
      if (currentText.trim()) {
        parts.push({ type: "text", content: currentText.trim() });
        currentText = "";
      }
      parts.push({ type: "latex", content: trimmed });
    } else {
      currentText += (currentText ? "\n" : "") + line;
    }
  }

  // Flush remaining
  if (currentLatex.trim()) {
    parts.push({ type: "latex", content: currentLatex.trim() });
  }
  if (currentText.trim()) {
    parts.push({ type: "text", content: currentText.trim() });
  }
}

/* ─── SolutionBlock Component ─── */
interface SolutionBlockProps {
  solutionText: string;
  latexBlocks?: string[];
  solutionImages?: string[];
}

export function SolutionBlock({ solutionText, latexBlocks = [], solutionImages }: SolutionBlockProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const blocks = latexBlocks || [];
  if (!blocks.length && !solutionText && (!solutionImages || !solutionImages.length)) {
    return <p className="text-sm text-muted-foreground italic">No solution available</p>;
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Determine rendering strategy:
  // - If latex blocks exist, they are the authoritative solution - render ONLY them
  // - If no latex blocks, fall back to parsing solution_text (which may contain $$ LaTeX)
  const hasLatexBlocks = blocks.length > 0;

  // Parse mixed content from solutionText (only used when no latex blocks)
  const mixedParts = !hasLatexBlocks ? parseMixedContent(solutionText) : [];

  return (
    <div className="space-y-3">
      {/* When no latex blocks, render solution_text via mixed content parser */}
      {!hasLatexBlocks && mixedParts.map((part, idx) => (
        <div key={`mixed-${idx}`} className="py-0.5">
          {part.type === "latex" ? (
            <LatexRenderer latex={part.content} />
          ) : (
            <p className="text-sm text-foreground/80 leading-relaxed">{part.content}</p>
          )}
        </div>
      ))}

      {/* Render latex blocks as the primary solution content */}
      {hasLatexBlocks && blocks.map((block, idx) => (
        <div key={`block-${idx}`} className="py-1">
          <LatexRenderer latex={block} />
        </div>
      ))}

      {/* Render solution diagram images */}
      {solutionImages && solutionImages.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/20">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            圖解
            <span className="text-[10px] text-muted-foreground/60 ml-1">(點擊放大)</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {solutionImages.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => openLightbox(idx)}
                className="block rounded-lg border border-border/40 overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-white cursor-zoom-in group"
              >
                <img
                  src={imgUrl}
                  alt={`Solution diagram ${idx + 1}`}
                  className="max-h-56 w-auto object-contain p-2 group-hover:scale-[1.02] transition-transform duration-200"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox overlay */}
      {lightboxOpen && solutionImages && solutionImages.length > 0 && (
        <Lightbox
          images={solutionImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
