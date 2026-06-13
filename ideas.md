# DSE Maths Interactive Hub — 設計構思

## 三個設計方向

### 1. 「Graph Paper Modernism」（方格紙現代主義）
以數學方格紙為基礎視覺語言，結合現代 UI 設計，營造出既專業又親切的學習環境。背景以淺色方格紙紋理為主，搭配鮮明的標記色彩。
- **Probability**: 0.04

### 2. 「Chalkboard Revival」（黑板復興）
以教室黑板為靈感，深色背景配粉筆質感的手寫字體和圖形，營造沉浸式學習氛圍。
- **Probability**: 0.02

### 3. 「Geometric Vitality」（幾何活力）
以明亮的幾何圖形和漸變色彩為主調，強調青春活力，用數學幾何元素（圓、三角、多邊形）作為裝飾和導航元素，背景明亮清爽。
- **Probability**: 0.06

---

## 選定方向：Geometric Vitality（幾何活力）

### Design Movement
**Neo-Geometric / Swiss-Inspired with Youthful Energy** — 結合瑞士設計的精確排版與幾何構成，注入年輕活力的色彩和動態感。

### Core Principles
1. **Mathematical Precision** — 所有佈局基於數學比例（黃金比例、等差數列間距），體現數學之美
2. **Chromatic Energy** — 以明亮、清爽的色調為主，避免沉悶深色，傳達青春活力
3. **Geometric Storytelling** — 幾何圖形不僅是裝飾，更是功能性的導航和資訊架構元素
4. **Progressive Disclosure** — 資訊層次分明，從年份到卷別到題目，逐步展開

### Color Philosophy
- **主色**：Teal/Cyan（#0EA5E9 → #06B6D4）— 代表清晰思維和學術專業
- **輔色**：Warm Coral（#F97316）— 代表活力和重點標記
- **背景**：Off-white with subtle warmth（#FAFBFC → #F8FAFC）— 明亮但不刺眼
- **強調**：Violet（#8B5CF6）— 用於圖表和數據視覺化
- **成功**：Emerald（#10B981）— 用於正確答案標記
- 情感意圖：專業但不嚴肅，活潑但不幼稚

### Layout Paradigm
**Asymmetric Card Grid with Floating Geometry** — 非對稱卡片網格佈局，搭配浮動幾何裝飾元素。側邊導航用於年份/卷別選擇，主區域用卡片展示題目和統計。避免傳統居中佈局，採用左重右輕的視覺平衡。

### Signature Elements
1. **Animated Geometric Particles** — 背景中緩慢移動的半透明幾何圖形（圓、三角、六邊形），隨滑鼠互動微微偏移
2. **Progress Arc Indicators** — 用圓弧進度條顯示答題率，取代傳統長條圖
3. **Mathematical Grid Lines** — 微妙的網格線貫穿頁面，如座標紙般連接各區塊

### Interaction Philosophy
互動設計模擬「解題過程」— 點擊展開如翻開答案紙，數據載入如計算過程逐步呈現。每個互動都有即時回饋，讓學生感受到「探索」而非「查閱」。

### Animation
- **進場動畫**：卡片從底部以 stagger 方式滑入（30ms 間隔），opacity 0.95→1
- **Hover 效果**：卡片微微上浮（translateY -4px）+ 陰影加深，180ms ease-out
- **數據展示**：圓弧進度條從 0 動畫到目標值，500ms cubic-bezier(0.34, 1.56, 0.64, 1)
- **頁面切換**：crossfade 200ms，新內容從右側滑入
- **按鈕按壓**：scale(0.97) 160ms ease-out

### Typography System
- **Display/Headlines**: Space Grotesk — 幾何感強的無襯線字體，數學氣質
- **Body/Content**: Inter — 高可讀性，適合長時間閱讀
- **Monospace/Numbers**: JetBrains Mono — 用於題號、百分比等數據展示
- 層級：Display 36px/Bold → H1 28px/Semibold → H2 22px/Medium → Body 16px/Regular → Caption 13px/Regular

### Brand Essence
**DSE Maths Hub — 為香港 DSE 考生打造的智能數學溫習平台，以數據驅動的方式呈現歷屆試題分析。** 
三個性格形容詞：**精確 (Precise)、活力 (Vibrant)、直覺 (Intuitive)**

### Brand Voice
Headlines 和 CTA 語調：簡潔有力，帶數學邏輯感，偶爾幽默。
- 範例 1：「每一題都有故事 — 看看考生們怎麼選的」
- 範例 2：「從數據找規律，從規律找分數」
禁止：「歡迎來到我們的網站」、「立即開始」等空泛用語。

### Wordmark & Logo
**概念**：將「∑」（Sigma 求和符號）與向上的箭頭結合，象徵累積知識和進步。標誌以幾何化的線條構成，不使用預設字體。配色使用品牌主色 Teal。

### Signature Brand Color
**Teal Cyan — #0EA5E9** — 這個介於藍與綠之間的色調，既有學術的沉穩，又有海洋般的清新活力，是品牌獨有的識別色。
