#!/usr/bin/env python3
"""Import verified 2026 MC solutions generated from the uploaded Paper 2 scan.

The importer rejects incomplete coverage, duplicate question numbers, answer-key
mismatches, or empty solution bodies before changing solutions.json.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path("/home/ubuntu/dse-math-hub")
GENERATED_DIR = Path("/home/ubuntu/dse-math-assets/2026-generated-solutions")
MAIN_DATA_PATH = ROOT / "client/src/data/dseData.json"
SOLUTIONS_PATH = ROOT / "client/src/data/solutions.json"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Validate without writing solutions.json")
    args = parser.parse_args()

    main_data = load_json(MAIN_DATA_PATH)
    expected = {
        int(item["q"]): {"answer": item["ans"], "pct": item[item["ans"]]}
        for item in main_data["paper2"]["2026"]
    }
    if set(expected) != set(range(1, 46)):
        raise ValueError("2026 Paper 2 answer key must contain exactly Q1–Q45")

    imported: dict[int, dict] = {}
    for source_path in sorted(GENERATED_DIR.glob("page-*.json")):
        source = load_json(source_path)
        for item in source.get("solutions", []):
            question = item.get("q")
            if question in imported:
                raise ValueError(f"Duplicate generated solution for Q{question}")
            if question not in expected:
                raise ValueError(f"Unexpected generated question Q{question}")
            if item.get("answer") != expected[question]["answer"]:
                raise ValueError(
                    f"Answer mismatch for Q{question}: "
                    f"generated {item.get('answer')}, expected {expected[question]['answer']}"
                )
            solution_text = str(item.get("solution_text", "")).strip()
            latex = item.get("latex", [])
            if not solution_text and not latex:
                raise ValueError(f"Empty generated solution for Q{question}")
            if not isinstance(latex, list) or not all(isinstance(block, str) and block.strip() for block in latex):
                raise ValueError(f"Invalid LaTex blocks for Q{question}")
            imported[question] = {
                "answer": expected[question]["answer"],
                "pct": expected[question]["pct"],
                "generated": True,
                "solution_text": solution_text,
                "latex": latex,
            }

    missing = sorted(set(expected) - set(imported))
    if missing:
        raise ValueError(f"Missing generated solutions: {missing}")

    if args.dry_run:
        print(json.dumps({"status": "validated", "questions": len(imported), "written": False}))
        return

    solutions = load_json(SOLUTIONS_PATH)
    solutions["2026"] = {str(question): imported[question] for question in sorted(imported)}
    SOLUTIONS_PATH.write_text(json.dumps(solutions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "imported", "questions": len(imported), "written": True}))


if __name__ == "__main__":
    main()
