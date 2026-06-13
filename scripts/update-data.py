#!/usr/bin/env python3
"""
DSE Maths Hub - Data Update Script

This script extracts data from the Excel statistics files and generates
the JSON data file used by the website. Run this script whenever new
year data is added to the Excel files.

Usage:
  python3 scripts/update-data.py --cp-stat <path_to_cp_stat.xlsx> --m2-stat <path_to_m2_stat.xlsx>

The script will:
1. Read Paper 1 performance data (full marks, mean, percentage) for each year
2. Read Paper 2 MC answer rates (A/B/C/D percentages + correct answer) for each year
3. Read M2 performance data for each year
4. Read topic analysis for Paper 1 and Paper 2
5. Read grade cutoff data
6. Output to client/src/data/dseData.json
"""

import argparse
import json
import os
import sys
import pandas as pd
import numpy as np

def safe_float(val, default=0.0):
    """Convert value to float safely."""
    try:
        if pd.isna(val):
            return default
        return round(float(val), 1)
    except (ValueError, TypeError):
        return default

def safe_str(val, default=""):
    """Convert value to string safely."""
    try:
        if pd.isna(val):
            return default
        return str(val).strip()
    except (ValueError, TypeError):
        return default

def extract_paper1(xl, years_range):
    """Extract Paper 1 data from the Excel file."""
    paper1 = {}
    for year in years_range:
        sheet_name = f"P1 {year}"
        if sheet_name not in xl.sheet_names:
            continue
        df = xl.parse(sheet_name)
        questions = []
        for _, row in df.iterrows():
            q_val = safe_str(row.iloc[0])
            if not q_val or q_val.lower() in ['total', 'question', '題號', 'q']:
                continue
            full = safe_float(row.iloc[1])
            mean = safe_float(row.iloc[2])
            if full > 0:
                pct = round((mean / full) * 100, 1)
            else:
                pct = safe_float(row.iloc[3]) if len(row) > 3 else 0.0
            if full > 0:
                questions.append({
                    "q": q_val,
                    "full": int(full) if full == int(full) else full,
                    "mean": mean,
                    "pct": pct
                })
        if questions:
            paper1[str(year)] = questions
    return paper1

def extract_paper2(xl, years_range):
    """Extract Paper 2 MC data from the Excel file."""
    paper2 = {}
    for year in years_range:
        sheet_name = f"P2 {year}"
        if sheet_name not in xl.sheet_names:
            continue
        df = xl.parse(sheet_name)
        questions = []
        for _, row in df.iterrows():
            q_val = row.iloc[0]
            try:
                q_num = int(q_val)
            except (ValueError, TypeError):
                continue
            ans = safe_str(row.iloc[1])
            if not ans or ans not in "ABCD":
                continue
            a_pct = safe_float(row.iloc[2])
            b_pct = safe_float(row.iloc[3])
            c_pct = safe_float(row.iloc[4])
            d_pct = safe_float(row.iloc[5])
            questions.append({
                "q": q_num,
                "ans": ans,
                "A": a_pct,
                "B": b_pct,
                "C": c_pct,
                "D": d_pct
            })
        if questions:
            paper2[str(year)] = questions
    return paper2

def extract_m2(xl, years_range):
    """Extract M2 data from the Excel file."""
    m2 = {}
    for year in years_range:
        sheet_name = f"M2 {year}"
        if sheet_name not in xl.sheet_names:
            sheet_name = str(year)
            if sheet_name not in xl.sheet_names:
                continue
        df = xl.parse(sheet_name)
        questions = []
        for _, row in df.iterrows():
            q_val = safe_str(row.iloc[0])
            if not q_val or q_val.lower() in ['total', 'question', '題號', 'q']:
                continue
            full = safe_float(row.iloc[1])
            mean = safe_float(row.iloc[2])
            if full > 0:
                pct = round((mean / full) * 100, 1)
            else:
                pct = safe_float(row.iloc[3]) if len(row) > 3 else 0.0
            if full > 0:
                questions.append({
                    "q": q_val,
                    "full": int(full) if full == int(full) else full,
                    "mean": mean,
                    "pct": pct
                })
        if questions:
            m2[str(year)] = questions
    return m2

def extract_topics(xl, sheet_prefix, years_range):
    """Extract topic analysis data."""
    topics = {}
    for year in years_range:
        sheet_name = f"{sheet_prefix} {year}"
        if sheet_name not in xl.sheet_names:
            continue
        df = xl.parse(sheet_name)
        year_topics = []
        for _, row in df.iterrows():
            topic = safe_str(row.iloc[0])
            questions = safe_str(row.iloc[1])
            if topic and questions:
                year_topics.append({"topic": topic, "questions": questions})
        if year_topics:
            topics[str(year)] = year_topics
    return topics

def main():
    parser = argparse.ArgumentParser(description="Update DSE Maths Hub data")
    parser.add_argument("--cp-stat", required=True, help="Path to CP Statistics Excel file")
    parser.add_argument("--m2-stat", help="Path to M2 Statistics Excel file")
    parser.add_argument("--output", default="client/src/data/dseData.json", help="Output JSON path")
    args = parser.parse_args()

    years_range = range(2012, 2027)

    print("Reading CP Statistics...")
    xl_cp = pd.ExcelFile(args.cp_stat)
    
    paper1 = extract_paper1(xl_cp, years_range)
    paper2 = extract_paper2(xl_cp, years_range)
    paper1_topics = extract_topics(xl_cp, "P1 Topic", years_range)
    paper2_topics = extract_topics(xl_cp, "P2 Topic", years_range)

    m2 = {}
    if args.m2_stat and os.path.exists(args.m2_stat):
        print("Reading M2 Statistics...")
        xl_m2 = pd.ExcelFile(args.m2_stat)
        m2 = extract_m2(xl_m2, years_range)

    # Load existing data to preserve PDF links and other metadata
    existing_data = {}
    if os.path.exists(args.output):
        with open(args.output, "r") as f:
            existing_data = json.load(f)

    # Build output
    data = {
        "paper1": paper1,
        "paper2": paper2,
        "paper2_summary": existing_data.get("paper2_summary", {}),
        "paper1_topics": paper1_topics,
        "paper2_topics": paper2_topics,
        "m2": m2 if m2 else existing_data.get("m2", {}),
        "cutoff": existing_data.get("cutoff", {}),
        "m2_cutoff": existing_data.get("m2_cutoff", {}),
        "syllabus": existing_data.get("syllabus", {}),
        "paper1_pdfs": existing_data.get("paper1_pdfs", {}),
        "paper2_pdfs": existing_data.get("paper2_pdfs", {}),
        "m2_pdfs": existing_data.get("m2_pdfs", {}),
        "mathseasy_links": existing_data.get("mathseasy_links", {}),
        "available_years": {
            "paper1": sorted(paper1.keys()),
            "paper2": sorted(paper2.keys()),
            "m2": sorted((m2 if m2 else existing_data.get("m2", {})).keys())
        }
    }

    # Write output
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nData updated successfully!")
    print(f"  Paper 1: {len(paper1)} years")
    print(f"  Paper 2: {len(paper2)} years")
    print(f"  M2: {len(m2)} years")
    print(f"  Output: {args.output}")

if __name__ == "__main__":
    main()
