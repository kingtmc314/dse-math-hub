/**
 * Smart question-topic matching utility.
 * 
 * Topic question refs use various formats:
 * - Simple: "3", "15"
 * - With sub-parts: "6(a,b)", "14(a-c)", "3(a-c)"
 * - With nested: "19(c-i,ii)", "10(b-ii)"
 * - Multiple: "8(a,b), 18(a)", "10(b-ii), 15"
 * - Ranges: "1-3" (paper2 MC)
 * 
 * Actual question data uses formats like:
 * - "3", "5(a)", "5(b)", "14(a)", "14(b)(i)", "14(b)(ii)", "19(c)(i)"
 * 
 * The matching algorithm:
 * 1. Split the topic ref by commas NOT inside parentheses
 * 2. For each part, extract the main question number
 * 3. Match all actual question entries that belong to that main number
 *    (with optional sub-part filtering for partial refs)
 */

export interface Paper1Question {
  q: string;
  full: number;
  mean: number;
  pct: number;
}

export interface Paper2Question {
  q: number;
  ans: string;
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface M2Question {
  q: string;
  full: number;
  mean: number;
  pct: number;
}

/**
 * Split a topic question reference string by commas that are NOT inside parentheses.
 * e.g. "6(a,b), 15" -> ["6(a,b)", "15"]
 * e.g. "10(b-ii), 15" -> ["10(b-ii)", "15"]
 */
function splitTopicRef(ref: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  
  for (let i = 0; i < ref.length; i++) {
    const ch = ref[i];
    if (ch === "(") {
      depth++;
      current += ch;
    } else if (ch === ")") {
      depth--;
      current += ch;
    } else if (ch === "," && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  
  return parts;
}

/**
 * Given a topic question ref part (e.g. "6(a,b)", "3", "14(a-c)"),
 * find all matching questions from the year's question list.
 * 
 * For Paper 1 and M2 (string-based q values).
 */
export function matchPaper1Questions(topicRef: string, yearQuestions: Paper1Question[]): Paper1Question[] {
  const parts = splitTopicRef(topicRef);
  const matched: Paper1Question[] = [];
  const seen = new Set<string>();
  
  for (const part of parts) {
    const mainMatch = part.match(/^(\d+)/);
    if (!mainMatch) continue;
    const mainNum = mainMatch[1];
    
    // Find all questions that belong to this main number
    const candidates = yearQuestions.filter(q => {
      const qMain = q.q.match(/^(\d+)/);
      return qMain && qMain[1] === mainNum;
    });
    
    for (const q of candidates) {
      if (!seen.has(q.q)) {
        seen.add(q.q);
        matched.push(q);
      }
    }
  }
  
  return matched;
}

/**
 * For Paper 2 (numeric q values, MC questions).
 * Handles ranges like "1-3" and simple numbers.
 */
export function matchPaper2Questions(topicRef: string, yearQuestions: Paper2Question[]): Paper2Question[] {
  const parts = splitTopicRef(topicRef);
  const matched: Paper2Question[] = [];
  const seen = new Set<number>();
  
  for (const part of parts) {
    // Handle ranges like "1-3"
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      for (let i = start; i <= end; i++) {
        const q = yearQuestions.find(q => q.q === i);
        if (q && !seen.has(q.q)) {
          seen.add(q.q);
          matched.push(q);
        }
      }
    } else {
      // Simple number
      const numMatch = part.match(/^(\d+)/);
      if (numMatch) {
        const num = parseInt(numMatch[1]);
        const q = yearQuestions.find(q => q.q === num);
        if (q && !seen.has(q.q)) {
          seen.add(q.q);
          matched.push(q);
        }
      }
    }
  }
  
  return matched;
}

/**
 * For M2 (string-based q values like "1", "2(a)", "2(b)").
 * Same logic as Paper 1.
 */
export function matchM2Questions(topicRef: string, yearQuestions: M2Question[]): M2Question[] {
  const parts = splitTopicRef(topicRef);
  const matched: M2Question[] = [];
  const seen = new Set<string>();
  
  for (const part of parts) {
    // Remove leading Q if present
    const cleaned = part.replace(/^Q/i, "").trim();
    if (!cleaned || cleaned === "-") continue;
    
    const mainMatch = cleaned.match(/^(\d+)/);
    if (!mainMatch) continue;
    const mainNum = mainMatch[1];
    
    // Find all questions that belong to this main number
    const candidates = yearQuestions.filter(q => {
      const qMain = q.q.match(/^(\d+)/);
      return qMain && qMain[1] === mainNum;
    });
    
    for (const q of candidates) {
      if (!seen.has(q.q)) {
        seen.add(q.q);
        matched.push(q);
      }
    }
  }
  
  return matched;
}

/**
 * Count the number of distinct main question numbers in a topic ref.
 * Used for the topic matrix to show question counts.
 */
export function countMainQuestions(topicRef: string): number {
  const parts = splitTopicRef(topicRef);
  const mainNums = new Set<string>();
  
  for (const part of parts) {
    const mainMatch = part.match(/^Q?(\d+)/i);
    if (mainMatch) {
      mainNums.add(mainMatch[1]);
    }
    // Handle ranges
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      for (let i = start; i <= end; i++) {
        mainNums.add(String(i));
      }
    }
  }
  
  return mainNums.size;
}
