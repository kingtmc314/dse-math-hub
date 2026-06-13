/**
 * Topic name translations: English key → Chinese name
 * Used when lang === "zh" to display Chinese topic names
 */
export const topicTranslations: Record<string, string> = {
  // Junior Topics (初中課題)
  "J1. Basic Computation": "J1. 基本運算",
  "J3. Approx / Estimation": "J3. 近似值與估算",
  "J5. Percentages": "J5. 百分比",
  "J6. Ratios / Proportion": "J6. 比與比例",
  "J7. Algebraic Expressions": "J7. 代數式",
  "J10. Indices / Numerals": "J10. 指數與進制",
  "J11/12. Polynomials & Identities": "J11/12. 多項式與恆等式",
  "J13. Formulae": "J13. 公式",
  "J14. Inequalities (1 unknown)": "J14. 一元不等式",
  "J16. Arc Lengths / Sectors": "J16. 弧長與扇形",
  "J18. Mensuration": "J18. 求積法",
  "J19. Angles / Parallel Lines": "J19. 角與平行線",
  "J20. Polygons": "J20. 多邊形",
  "J21/22. Congruent & Similar Triangles": "J21/22. 全等與相似三角形",
  "J23. Quadrilaterals": "J23. 四邊形",
  "J24. Centres of Triangles": "J24. 三角形的心",
  "J26. Coordinates / Trans.": "J26. 坐標與變換",
  "J27. Trigonometry (Basic)": "J27. 三角學（基礎）",
  "J29. Presentation of data": "J29. 數據的表示",
  "J30. Central Tendency": "J30. 集中趨勢",
  "J31. Probability (Basic)": "J31. 概率（基礎）",

  // Senior Topics (高中課題)
  "S1. Quadratic Eq. / Complex": "S1. 二次方程與複數",
  "S2. Functions / Graphs": "S2. 函數與圖像",
  "S3. Exp and Log Functions": "S3. 指數與對數函數",
  "S4. Adv. Polynomials (Rem.)": "S4. 多項式進階（餘式）",
  "S6. Variations": "S6. 變分",
  "S7. Sequences (AS/GS)": "S7. 等差與等比數列",
  "S8. LP / Inequalities": "S8. 線性規劃與不等式",
  "S10. Eq. of Straight Lines": "S10. 直線方程",
  "S11. Properties of Circles": "S11. 圓的性質",
  "S12. Loci": "S12. 軌跡",
  "S13. Eq. of Circles": "S13. 圓的方程",
  "S14. Adv. Trigonometry": "S14. 三角學進階",
  "S15. Perm. & Comb.": "S15. 排列與組合",
  "S16. Adv. Probability": "S16. 概率進階",
  "S17. Measures of Dispersion": "S17. 離差的量度",

  // Special
  "Out of Syllabus (OOS)": "超出課程範圍",
};

/**
 * Get the display name for a topic based on current language
 */
export function getTopicDisplayName(topic: string, lang: "zh" | "en"): string {
  if (lang === "zh") {
    return topicTranslations[topic] || topic;
  }
  return topic;
}

/**
 * Extract numeric value from topic prefix for proper sorting
 * e.g., "J1. Basic Computation" → 1, "J10. Indices" → 10, "J11/12. Poly" → 11
 */
export function getTopicSortKey(topic: string): number {
  const match = topic.match(/^[JS](\d+)/);
  if (match) return parseInt(match[1], 10);
  // For "Out of Syllabus" or other, sort last
  return 999;
}
