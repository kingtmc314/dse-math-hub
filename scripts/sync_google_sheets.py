#!/usr/bin/env python3
"""Synchronise DSE Maths Hub data from the authorised Google Sheets sources.

The script reads source data through the pre-authorised ``gws`` CLI and updates only
runtime data in ``client/src/data/dseData.json``. It detects available year sheets,
so a new year can be added by creating the matching sheet(s) and matrix column.

Sources
-------
* Compulsory: ``YYYY Paper 1``, ``YYYY Paper 2``, Paper 1/2 Topic Matrix
* M2: ``YYYY``, Topic Mapping

It intentionally preserves PDFs, solutions, syllabus content and other metadata
already stored in the JSON file.

Usage
-----
    python3 scripts/sync_google_sheets.py --source all
    python3 scripts/sync_google_sheets.py --source compulsory --dry-run
    python3 scripts/sync_google_sheets.py --source m2
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import OrderedDict
from pathlib import Path
from typing import Any, Literal

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "client" / "src" / "data" / "dseData.json"

COMPULSORY_SHEET_ID = "1TXFQsfO5pjzlJ4DTjV5NpAeE6pYhghj2DnBvCpTRe4A"
M2_SHEET_ID = "1MTa7oOfcrmswlx6KvxniK7avysDvlunUjtvAr6yg0Ac"

YEAR_SHEET_RE = re.compile(r"^(20\d{2}) Paper ([12])$")
M2_YEAR_SHEET_RE = re.compile(r"^(20\d{2})$")
QUESTION_RE = re.compile(r"^\d")


class SyncError(RuntimeError):
    """Raised when a source cannot be read or fails validation."""


def gws(command: list[str], params: dict[str, Any]) -> dict[str, Any]:
    """Run one read-only Google Workspace CLI request and parse JSON output."""
    completed = subprocess.run(
        ["gws", *command, "--params", json.dumps(params), "--format", "json"],
        cwd=PROJECT_ROOT,
        text=True,
        capture_output=True,
    )
    if completed.returncode != 0:
        details = completed.stderr.strip() or completed.stdout.strip()
        raise SyncError(f"gws {' '.join(command)} failed: {details}")
    try:
        payload = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise SyncError(f"gws returned non-JSON output: {completed.stdout[:500]}") from exc
    if not isinstance(payload, dict):
        raise SyncError("gws returned an unexpected payload shape")
    return payload


def list_sheets(spreadsheet_id: str) -> list[str]:
    payload = gws(
        ["sheets", "spreadsheets", "get"],
        {
            "spreadsheetId": spreadsheet_id,
            "includeGridData": False,
            "fields": "sheets.properties",
        },
    )
    titles: list[str] = []
    for sheet in payload.get("sheets", []):
        title = sheet.get("properties", {}).get("title")
        if isinstance(title, str) and title:
            titles.append(title)
    if not titles:
        raise SyncError(f"No sheets found in spreadsheet {spreadsheet_id}")
    return titles


def values_batch(
    spreadsheet_id: str, sheet_names: list[str], cell_range: str = "A1:AZ200"
) -> dict[str, list[list[str]]]:
    """Read all requested sheet ranges through one Sheets API request."""
    if not sheet_names:
        return {}
    ranges = [f"{sheet_name}!{cell_range}" for sheet_name in sheet_names]
    payload = gws(
        ["sheets", "spreadsheets", "values", "batchGet"],
        {"spreadsheetId": spreadsheet_id, "ranges": ranges, "majorDimension": "ROWS"},
    )
    value_ranges = payload.get("valueRanges")
    if not isinstance(value_ranges, list) or len(value_ranges) != len(sheet_names):
        raise SyncError("Batch sheet read returned an unexpected number of ranges")

    result: dict[str, list[list[str]]] = {}
    for sheet_name, value_range in zip(sheet_names, value_ranges):
        raw_values = value_range.get("values", [])
        if not isinstance(raw_values, list):
            raise SyncError(f"Invalid values payload for {sheet_name}")
        rows: list[list[str]] = []
        for row in raw_values:
            if not isinstance(row, list):
                raise SyncError(f"Invalid row shape in {sheet_name}")
            rows.append([str(cell).strip() for cell in row])
        result[sheet_name] = rows
    return result


def as_float(value: str, context: str) -> float:
    try:
        return float(value.replace("%", "").strip())
    except (AttributeError, ValueError) as exc:
        raise SyncError(f"Invalid number for {context}: {value!r}") from exc


def parse_scored_questions(rows: list[list[str]], context: str) -> list[dict[str, Any]]:
    """Parse long-question data such as P1 and M2, excluding section totals."""
    questions: list[dict[str, Any]] = []
    for row in rows[1:]:
        if len(row) < 3 or not QUESTION_RE.match(row[0]):
            continue
        q = row[0]
        full = as_float(row[1], f"{context} Q{q} full marks")
        mean = as_float(row[2], f"{context} Q{q} mean")
        if full <= 0:
            raise SyncError(f"{context} Q{q} has non-positive full marks")
        questions.append(
            {
                "q": q,
                "full": int(full) if full.is_integer() else full,
                "mean": mean,
                "pct": round(mean / full * 100, 1),
            }
        )
    if not questions:
        raise SyncError(f"{context} contains no question rows")
    return questions


def parse_paper2_questions(rows: list[list[str]], context: str) -> list[dict[str, Any]]:
    """Parse Paper 2 MC data, excluding section summaries."""
    questions: list[dict[str, Any]] = []
    for row in rows[1:]:
        if len(row) < 6 or not row[0].isdigit():
            continue
        answer = row[1].upper()
        if answer not in {"A", "B", "C", "D"}:
            raise SyncError(f"{context} Q{row[0]} has invalid answer: {row[1]!r}")
        questions.append(
            {
                "q": int(row[0]),
                "ans": answer,
                "A": as_float(row[2], f"{context} Q{row[0]} option A"),
                "B": as_float(row[3], f"{context} Q{row[0]} option B"),
                "C": as_float(row[4], f"{context} Q{row[0]} option C"),
                "D": as_float(row[5], f"{context} Q{row[0]} option D"),
            }
        )
    if not questions:
        raise SyncError(f"{context} contains no Paper 2 question rows")
    numbers = [question["q"] for question in questions]
    if len(numbers) != len(set(numbers)):
        raise SyncError(f"{context} contains duplicate question numbers")
    return questions


def year_columns(matrix_rows: list[list[str]], context: str) -> dict[str, int]:
    if not matrix_rows:
        raise SyncError(f"{context} is empty")
    columns: dict[str, int] = {}
    for index, value in enumerate(matrix_rows[0]):
        if re.fullmatch(r"20\d{2}", value):
            columns[value] = index
    if not columns:
        raise SyncError(f"{context} has no year columns")
    return columns


def cell(row: list[str], column: int) -> str:
    return row[column].strip() if len(row) > column else ""


def is_mapping_value(value: str) -> bool:
    return bool(value) and value not in {"-", "#N/A"}


def parse_paper1_topics(
    matrix_rows: list[list[str]], canonical_topics: dict[str, str]
) -> dict[str, list[dict[str, str]]]:
    columns = year_columns(matrix_rows, "Paper 1 Topic Matrix")
    result: dict[str, list[dict[str, str]]] = {year: [] for year in columns}
    for row in matrix_rows[1:]:
        if len(row) < 3 or not row[0].isdigit() or not row[2]:
            continue
        # The Sheet uses some long-form English titles whereas the site has
        # curated short-form names with stable bilingual translations. Retain
        # the established display name for an existing numbered topic.
        topic = canonical_topics.get(row[0], f"{row[0]}. {row[2]}")
        for year, column in columns.items():
            mapped_questions = re.sub(r"\s+", " ", cell(row, column)).strip()
            if is_mapping_value(mapped_questions):
                result[year].append({"topic": topic, "questions": mapped_questions})
    return {year: entries for year, entries in result.items() if entries}


def parse_paper2_topics(matrix_rows: list[list[str]]) -> dict[str, dict[str, str]]:
    columns = year_columns(matrix_rows, "Paper 2 Topic Matrix")
    result: dict[str, dict[str, str]] = {year: {} for year in columns}
    for row in matrix_rows[1:]:
        if len(row) < 3 or not row[0].isdigit() or not row[2]:
            continue
        topic = f"{row[0]}. {row[2]}"
        for year, column in columns.items():
            mapped_questions = cell(row, column)
            if not is_mapping_value(mapped_questions):
                continue
            for question in re.findall(r"\b\d+\b", mapped_questions):
                # A small number of historical Matrix cells intentionally overlap.
                # The UI supports one topic badge per MC question, so preserve the
                # established import behaviour: a later matrix row takes priority.
                result[year][question] = topic
    return {year: entries for year, entries in result.items() if entries}


def parse_m2_topics(matrix_rows: list[list[str]]) -> dict[str, list[dict[str, str]]]:
    columns = year_columns(matrix_rows, "M2 Topic Mapping")
    result: dict[str, OrderedDict[str, list[str]]] = {year: OrderedDict() for year in columns}
    for row in matrix_rows[1:]:
        if not row or not row[0]:
            continue
        topic = row[0]
        for year, column in columns.items():
            mapped_questions = cell(row, column)
            if not is_mapping_value(mapped_questions):
                continue
            result[year].setdefault(topic, []).append(mapped_questions)
    return {
        year: [{"topic": topic, "questions": ", ".join(question_groups)} for topic, question_groups in entries.items()]
        for year, entries in result.items()
        if entries
    }


def sync_compulsory(data: dict[str, Any]) -> dict[str, int]:
    titles = list_sheets(COMPULSORY_SHEET_ID)
    paper_year_sheets: dict[str, dict[str, str]] = {}
    for title in titles:
        match = YEAR_SHEET_RE.fullmatch(title)
        if match:
            paper_year_sheets.setdefault(match.group(1), {})[match.group(2)] = title

    source_sheets = sorted(
        {sheet for papers in paper_year_sheets.values() for sheet in papers.values()},
        key=lambda title: (int(title[:4]), title),
    ) + ["Paper 1 Topic Matrix", "Paper 2 Topic Matrix"]
    source_values = values_batch(COMPULSORY_SHEET_ID, source_sheets)

    paper1: dict[str, list[dict[str, Any]]] = {}
    paper2: dict[str, list[dict[str, Any]]] = {}
    for year, papers in sorted(paper_year_sheets.items()):
        if "1" in papers:
            paper1[year] = parse_scored_questions(source_values[papers["1"]], f"{year} Paper 1")
        if "2" in papers:
            paper2[year] = parse_paper2_questions(source_values[papers["2"]], f"{year} Paper 2")

    if not paper1 or not paper2:
        raise SyncError("Compulsory source is missing Paper 1 or Paper 2 year sheets")

    data["paper1"] = paper1
    data["paper2"] = paper2
    data["paper2_summary"] = {
        year: {str(question["q"]): {"ans": question["ans"], "rate": question[question["ans"]]} for question in questions}
        for year, questions in paper2.items()
    }
    canonical_paper1_topics: dict[str, str] = {}
    for entries in data.get("paper1_topics", {}).values():
        for entry in entries:
            match = re.match(r"^(\d+)\.\s+", entry.get("topic", ""))
            if match:
                canonical_paper1_topics.setdefault(match.group(1), entry["topic"])
    data["paper1_topics"] = parse_paper1_topics(
        source_values["Paper 1 Topic Matrix"], canonical_paper1_topics
    )
    data["paper2_topics"] = parse_paper2_topics(source_values["Paper 2 Topic Matrix"])
    return {"paper1_years": len(paper1), "paper2_years": len(paper2)}


def sync_m2(data: dict[str, Any]) -> dict[str, int]:
    titles = list_sheets(M2_SHEET_ID)
    m2_year_sheets = sorted(title for title in titles if M2_YEAR_SHEET_RE.fullmatch(title))
    source_values = values_batch(M2_SHEET_ID, m2_year_sheets + ["Topic Mapping"])
    m2: dict[str, list[dict[str, Any]]] = {}
    for year in m2_year_sheets:
        m2[year] = parse_scored_questions(source_values[year], f"M2 {year}")
    if not m2:
        raise SyncError("M2 source is missing year sheets")

    data["m2"] = m2
    data["m2_topics"] = parse_m2_topics(source_values["Topic Mapping"])
    return {"m2_years": len(m2)}


def refresh_available_years(data: dict[str, Any]) -> None:
    data["available_years"] = {
        paper: sorted(data.get(paper, {}).keys(), key=int)
        for paper in ("paper1", "paper2", "m2")
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Synchronise DSE Hub data from Google Sheets")
    parser.add_argument(
        "--source",
        choices=("all", "compulsory", "m2"),
        default="all",
        help="Which data source to refresh (default: all)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Validate and report changes without writing JSON")
    args = parser.parse_args()

    if not DATA_PATH.exists():
        raise SyncError(f"Data file not found: {DATA_PATH}")
    original_text = DATA_PATH.read_text(encoding="utf-8")
    try:
        data = json.loads(original_text)
    except json.JSONDecodeError as exc:
        raise SyncError(f"Existing JSON is invalid: {exc}") from exc

    summary: dict[str, int] = {}
    if args.source in {"all", "compulsory"}:
        summary.update(sync_compulsory(data))
    if args.source in {"all", "m2"}:
        summary.update(sync_m2(data))
    refresh_available_years(data)

    updated_text = json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"
    changed = updated_text != original_text
    summary["changed"] = int(changed)
    summary["source"] = args.source

    if changed and not args.dry_run:
        DATA_PATH.write_text(updated_text, encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    if args.dry_run:
        print("Dry run: no files were written.")
    elif changed:
        print(f"Updated {DATA_PATH.relative_to(PROJECT_ROOT)}")
    else:
        print("No data changes detected.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SyncError as exc:
        print(f"SYNC ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
