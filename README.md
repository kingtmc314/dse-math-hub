# DSE Maths Hub

Interactive web application for browsing HKDSE Mathematics past paper statistics (2012–2025).

## Features

- **Paper 1 (Compulsory)**: Long questions with full marks, mean scores, and performance rates per question
- **Paper 2 (Compulsory)**: Multiple choice with ABCD option distribution rates and correct answers highlighted
- **M2 (Extended Module)**: Performance rates for each question
- **Topic Analysis**: Each question mapped to its syllabus topic
- **Bilingual**: Full Chinese/English language switching
- **PDF Links**: Direct links to past papers on Google Drive
- **Solution Links**: Links to mathseasy.hk detailed solutions for Paper 2

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS 4
- Framer Motion
- Vite

## Data Update

When new year data becomes available:

1. Update the Excel statistics files with new year data
2. Run the data extraction script:

```bash
python3 scripts/update-data.py \
  --cp-stat /path/to/DSEMath(CP)Stat.xlsx \
  --m2-stat /path/to/DSE_M2_Stat.xlsx
```

3. Add new PDF file IDs to the JSON manually (paper1_pdfs, paper2_pdfs)
4. Add new mathseasy.hk solution links
5. Commit and push to trigger auto-deployment

## Development

```bash
pnpm install
pnpm run dev
```

## Deployment

The site auto-deploys to GitHub Pages via GitHub Actions on push to `main`.

## Data Sources

- HKEAA Examination Reports (2012–2025)
- mathseasy.hk (Paper 2 detailed solutions)
