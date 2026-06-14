// Curriculum-level topic groupings for DSE Mathematics Compulsory Part
// Each group maps to one or more Learning Unit (LU) codes (J/S codes)
// Used in Topic Filter and Topic Ranking pages

export interface CurriculumTopic {
  id: number;
  zh: string;
  en: string;
  lus: string[]; // Learning Unit codes that belong to this group
}

export const CURRICULUM_TOPICS: CurriculumTopic[] = [
  {
    id: 1,
    zh: "估算及百分法",
    en: "Approximate Values, Numerical Estimation and Percentages",
    lus: ["J3", "J5"],
  },
  {
    id: 2,
    zh: "代數",
    en: "Algebraic Expressions",
    lus: ["J7"],
  },
  {
    id: 3,
    zh: "幾何 – 直線圖形",
    en: "Rectilinear Figures",
    lus: ["J19", "J20", "J21", "J22", "J23"],
  },
  {
    id: 4,
    zh: "對稱及變換",
    en: "Symmetry and Transformations",
    lus: ["J26"],
  },
  {
    id: 5,
    zh: "簡易概率和統計",
    en: "Elementary Probability and Statistics",
    lus: ["J28", "J29", "J30", "J31"],
  },
  {
    id: 6,
    zh: "一元二次方程與複數",
    en: "Quadratic Equations and Complex Numbers",
    lus: ["S1"],
  },
  {
    id: 7,
    zh: "函數及其圖像",
    en: "Functions and Graphs",
    lus: ["S2"],
  },
  {
    id: 8,
    zh: "指數、指數函數及對數函數",
    en: "Exponential and Logarithmic Functions",
    lus: ["J10", "S3"],
  },
  {
    id: 9,
    zh: "續多項式",
    en: "More about Polynomials",
    lus: ["S4"],
  },
  {
    id: 10,
    zh: "率、比及變分",
    en: "Rates, Ratios and Variations",
    lus: ["J6", "S6"],
  },
  {
    id: 11,
    zh: "三角函數及其圖像",
    en: "Trigonometric Functions",
    lus: ["S14"],
  },
  {
    id: 12,
    zh: "三角學的應用",
    en: "Applications of Trigonometry",
    lus: ["J27", "S14"],
  },
  {
    id: 13,
    zh: "求積法",
    en: "Mensuration",
    lus: ["J18"],
  },
  {
    id: 14,
    zh: "圓的基本性質",
    en: "Basic Properties of Circles",
    lus: ["S11"],
  },
  {
    id: 15,
    zh: "圓的切線",
    en: "Tangents to Circles",
    lus: ["S11"],
  },
  {
    id: 16,
    zh: "不等式及線性規畫",
    en: "Inequalities and Linear Programming",
    lus: ["J14", "S8"],
  },
  {
    id: 17,
    zh: "坐標幾何 (一)：直角坐標幾何",
    en: "Coordinate Geometry (I) / Rectangular Coordinate System",
    lus: ["J26"],
  },
  {
    id: 18,
    zh: "坐標幾何 (二)：直線方程及圓方程",
    en: "Coordinate Geometry (II) / Equations of Straight Lines and Circles",
    lus: ["S10", "S13"],
  },
  {
    id: 19,
    zh: "等差及等比數列",
    en: "Arithmetic and Geometric Sequences",
    lus: ["S7"],
  },
  {
    id: 20,
    zh: "續函數圖像",
    en: "More about Graphs of Functions",
    lus: ["S9"],
  },
  {
    id: 21,
    zh: "排列、組合及概率",
    en: "Permutations, Combinations and More about Probability",
    lus: ["S15", "S16"],
  },
  {
    id: 22,
    zh: "續統計",
    en: "Measures of Dispersion",
    lus: ["S17"],
  },
];

/**
 * Given a LU code string like "J3. Approximate Values & Numerical Estimation",
 * extract the prefix code (e.g. "J3") for matching against curriculum topic LU lists.
 */
export function extractLUCode(luString: string): string {
  const match = luString.match(/^([JS]\d+(?:\/\d+)?)/);
  return match ? match[1] : luString;
}

/**
 * Find which curriculum topic(s) a given LU code belongs to.
 * Returns array of CurriculumTopic ids.
 */
export function findCurriculumTopicsForLU(luCode: string): number[] {
  // Normalize: strip decimal part if any (e.g. "J21/22" → check both J21 and J22)
  const parts = luCode.replace(/^[JS]/, "").split("/");
  const prefix = luCode.match(/^([JS])/)?.[1] || "";
  const codes = parts.map(p => prefix + p.split(".")[0]);

  return CURRICULUM_TOPICS
    .filter(ct => ct.lus.some(lu => codes.includes(lu)))
    .map(ct => ct.id);
}

/**
 * Check if a given topic string belongs to a curriculum topic.
 * Handles both:
 *   - J/S LU code format: "J3. Approximate Values..." or "S2. Functions..."
 *   - Numbered curriculum format: "7. Functions and Graphs" (paper2_topics format)
 */
export function topicMatchesCurriculum(topicStr: string, curriculumTopic: CurriculumTopic): boolean {
  // Check numbered curriculum format first: "7. Functions and Graphs"
  const numberedMatch = topicStr.match(/^(\d+)\./);
  if (numberedMatch) {
    const topicId = parseInt(numberedMatch[1], 10);
    return curriculumTopic.id === topicId;
  }
  // Check Out of Syllabus numbered: "23. Out of Syllabus (OOS)"
  // These don't belong to any curriculum topic
  const luCode = extractLUCode(topicStr);
  // Handle combined codes like "J21/22"
  const parts = luCode.replace(/^([JS])/, "").split("/");
  const prefix = luCode.match(/^([JS])/)?.[1] || "";
  const codes = parts.map(p => prefix + p);
  return curriculumTopic.lus.some(lu => codes.includes(lu));
}
