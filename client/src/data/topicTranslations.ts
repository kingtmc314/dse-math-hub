// Mapping of official English topic names to Chinese translations
// Based on HKEAA DSE Mathematics Compulsory Part & M2 syllabus

export const topicTranslations: Record<string, string> = {
  // Junior topics (初中課題)
  "J1. Basic Computation": "J1. 基本運算",
  "J3. Approximate Values & Numerical Estimation": "J3. 近似值與估算",
  "J5. Using Percentages": "J5. 百分比應用",
  "J6. Rates, Ratios & Proportions": "J6. 率、比與比例",
  "J7. Algebraic Expressions": "J7. 代數式",
  "J10. Laws of Integral Indices": "J10. 整數指數律",
  "J11/12. Polynomials & Identities": "J11/12. 多項式與恆等式",
  "J13. Formulae": "J13. 公式",
  "J14. Linear Inequalities in One Unknown": "J14. 一元一次不等式",
  "J16. Arc Lengths & Areas of Sectors": "J16. 弧長與扇形面積",
  "J18. Mensuration": "J18. 求積法",
  "J19. Angles & Parallel Lines": "J19. 角與平行線",
  "J20. Polygons": "J20. 多邊形",
  "J21/22. Congruent & Similar Triangles": "J21/22. 全等與相似三角形",
  "J23. Quadrilaterals": "J23. 四邊形",
  "J24. Centres of Triangles": "J24. 三角形的心",
  "J26. Rectangular Coordinate System": "J26. 直角坐標系",
  "J27. Trigonometry": "J27. 三角學",
  "J29. Presentation of Data": "J29. 數據的表示",
  "J30. Measures of Central Tendency": "J30. 集中趨勢的量度",
  "J31. Probability": "J31. 概率",
  // Senior topics (高中課題)
  "S1. Quadratic Equations in One Unknown": "S1. 一元二次方程",
  "S2. Functions & Graphs": "S2. 函數與圖像",
  "S3. Exponential & Logarithmic Functions": "S3. 指數與對數函數",
  "S4. More about Polynomials": "S4. 續多項式",
  "S6. Variations": "S6. 變分",
  "S7. Arithmetic & Geometric Sequences": "S7. 等差與等比數列",
  "S8. Inequalities & Linear Programming": "S8. 不等式與線性規劃",
  "S10. Equations of Straight Lines": "S10. 直線方程",
  "S11. Basic Properties of Circles": "S11. 圓的基本性質",
  "S12. Loci": "S12. 軌跡",
  "S13. Equations of Circles": "S13. 圓的方程",
  "S14. More about Trigonometry": "S14. 續三角學",
  "S15. Permutations & Combinations": "S15. 排列與組合",
  "S16. More about Probability": "S16. 續概率",
  "S17. Measures of Dispersion": "S17. 離差的量度",
  // M2 topics (延伸部分二課題)
  "2. Mathematical induction": "2. 數學歸納法",
  "3. Binomial Theorem": "3. 二項式定理",
  "4. More about trigonometric functions": "4. 續三角函數",
  "6. Limits": "6. 極限",
  "7. Differentiation": "7. 微分",
  "8. Applications of differentiation": "8. 微分的應用",
  "9. Indefinite integration": "9. 不定積分",
  "10. Definite integration": "10. 定積分",
  "11. Applications of definite integration": "11. 定積分的應用",
  "12. Determinants": "12. 行列式",
  "13. Matrices": "13. 矩陣",
  "14. Systems of linear equations": "14. 線性方程組",
  "15. Introduction to vectors": "15. 向量入門",
  "16. Scalar product and vector product": "16. 純量積與向量積",
  "17. Applications of vectors": "17. 向量的應用",
  // Special
  "Out of Syllabus": "超出課程範圍",
  "Deleted / Out of Syllabus": "已刪除 / 超出課程範圍",
  // Numbered curriculum topics (paper2_topics format)
  "1. Approx. Values & Percentages": "估算及百分法",
  "2. Algebraic Expressions": "代數",
  "3. Rectilinear Figures": "幾何 – 直線圖形",
  "4. Symmetry and Transformations": "對稱及變換",
  "5. Elementary Prob. and Stats": "簡易概率和統計",
  "6. Quad. Eq. & Complex Numbers": "一元二次方程與複數",
  "7. Functions and Graphs": "函數及其圖像",
  "8. Exp. and Logarithmic Functions": "指數及對數函數",
  "9. More about Polynomials": "續多項式",
  "10. Rates, Ratios and Variations": "率、比及變分",
  "11. Trigonometric Functions": "三角函數及其圖像",
  "12. Applications of Trigonometry": "三角學的應用",
  "13. Mensuration": "求積法",
  "14. Basic Properties of Circles": "圓的基本性質",
  "15. Tangents to Circles": "圓的切線",
  "16. Inequalities & Linear Programming": "不等式及線性規畫",
  "17. Coord. Geo. (I) / Rect. Coord. Sys.": "坐標幾何 (一)",
  "18. Coord. Geo. (II) / SL & Circles": "坐標幾何 (二)",
  "19. Sequence, Arithmetic & Geometric Sequences": "數列及等差等比",
  "20. More about Graphs of Functions": "續函數圖像",
  "21. Perm., Comb. & More about Prob.": "排列、組合及概率",
  "22. Measures of Dispersion": "續統計",
  "23. Out of Syllabus (OOS)": "不在課程範圍",
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
 * Also handles M2 topics: "2. Mathematical induction" → 2, "10. Definite integration" → 10
 */
export function getTopicSortKey(topic: string): number {
  // Compulsory part: J or S prefix
  const matchJS = topic.match(/^[JS](\d+)/);
  if (matchJS) return parseInt(matchJS[1], 10);
  // M2 topics: start with number directly
  const matchM2 = topic.match(/^(\d+)\./);
  if (matchM2) return parseInt(matchM2[1], 10);
  // For "Out of Syllabus" or "Deleted / Out of Syllabus", sort last
  return 999;
}
