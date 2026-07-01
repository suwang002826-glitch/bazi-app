#!/usr/bin/env python3
import argparse
import calendar
import hashlib
import json
import pathlib
from datetime import date

from pypdf import PdfReader


SOURCE_ID = "PMO-CALENDAR-1900-2025"
FIRST_YEAR = 1900
LAST_YEAR = 2025
FIRST_YEAR_FIRST_PAGE = 3


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def pages_for_year(year):
    if year < FIRST_YEAR or year > LAST_YEAR:
        raise ValueError(f"year must be between {FIRST_YEAR} and {LAST_YEAR}")
    first_page = FIRST_YEAR_FIRST_PAGE + (year - FIRST_YEAR) * 3
    return [first_page, first_page + 1, first_page + 2]


def months_for_page_index(index):
    start = index * 4 + 1
    return [start, start + 1, start + 2, start + 3]


def clean_lunar_year(value):
    return value.replace("年", "")


def year_ganzhi_from_title(text):
    first_line = text.splitlines()[0]
    return clean_lunar_year(first_line.split("———", 1)[1])


def initial_lunar_year_from_header(text, current_year_ganzhi):
    for line in text.splitlines():
        if line.startswith("日 "):
            first_label = line.split()[1]
            if "~" in first_label:
                return clean_lunar_year(first_label.split("~", 1)[0])
            return clean_lunar_year(first_label)
    return current_year_ganzhi


def data_lines_from_page_text(text):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    start_index = None
    for index, line in enumerate(lines):
        if line == "31":
            start_index = index + 1
            break
    if start_index is None:
        raise ValueError("Could not locate day-number header ending at 31")

    end_index = None
    for index in range(start_index, len(lines)):
        if lines[index].replace(" ", "") == "节气":
            end_index = index
            break
    if end_index is None:
        raise ValueError("Could not locate solar-term section")
    return lines[start_index:end_index]


def parse_daily_line(line, current_lunar_month):
    parts = line.split()
    if len(parts) == 4:
        lunar_month, lunar_day, day_ganzhi, weekday = parts
    elif len(parts) == 3:
        if not current_lunar_month:
            raise ValueError(f"Missing lunar month before line: {line}")
        lunar_month = current_lunar_month
        lunar_day, day_ganzhi, weekday = parts
    else:
        raise ValueError(f"Unexpected daily record line: {line}")
    return lunar_month, lunar_day, day_ganzhi, weekday


def parse_daily_records(year, months, text, current_lunar_year):
    rows = data_lines_from_page_text(text)
    records = []
    offset = 0
    current_lunar_month = None

    for month in months:
        days = calendar.monthrange(year, month)[1]
        month_rows = rows[offset : offset + days]
        if len(month_rows) != days:
            raise ValueError(f"Expected {days} rows for {year}-{month:02d}, got {len(month_rows)}")

        for day, line in enumerate(month_rows, start=1):
            lunar_month, lunar_day, day_ganzhi, weekday = parse_daily_line(line, current_lunar_month)
            current_lunar_month = lunar_month
            if lunar_month == "正月" and lunar_day == "初一":
                current_lunar_year = year_ganzhi_from_title(text)

            records.append(
                {
                    "date": f"{year}-{month:02d}-{day:02d}",
                    "lunarYear": current_lunar_year,
                    "lunarMonth": lunar_month,
                    "lunarDay": lunar_day,
                    "isLeapMonth": lunar_month.startswith("闰"),
                    "dayGanzhi": day_ganzhi,
                    "weekday": weekday,
                }
            )
        offset += days

    return records, current_lunar_year


def parse_solar_terms(year, text):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    terms = []
    in_terms = False
    for line in lines:
        if line.replace(" ", "") == "节气":
            in_terms = True
            continue
        if not in_terms or line == "月 日 时 分":
            continue
        parts = line.split()
        if len(parts) == 5:
            name, month, day, hour, minute = parts
            terms.append(
                {
                    "name": name,
                    "date": f"{year}-{int(month):02d}-{int(day):02d}",
                    "time": f"{int(hour):02d}:{int(minute):02d}",
                    "timezone": "Asia/Shanghai",
                }
            )
    return terms


def extract_year(pdf_path, year):
    pdf_path = pathlib.Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)

    reader = PdfReader(str(pdf_path))
    pdf_pages = pages_for_year(year)
    extracted_pages = []
    daily_records = []
    solar_terms = []
    current_lunar_year = None

    for page_index, pdf_page in enumerate(pdf_pages):
        zero_based = pdf_page - 1
        if zero_based >= len(reader.pages):
            raise ValueError(f"PDF does not contain page {pdf_page}")
        text = reader.pages[zero_based].extract_text() or ""
        months = months_for_page_index(page_index)
        if current_lunar_year is None:
            current_lunar_year = initial_lunar_year_from_header(text, year_ganzhi_from_title(text))
        page_records, current_lunar_year = parse_daily_records(year, months, text, current_lunar_year)
        daily_records.extend(page_records)
        solar_terms.extend(parse_solar_terms(year, text))
        extracted_pages.append(
            {
                "pdfPage": pdf_page,
                "months": months,
                "textChars": len(text),
                "text": text,
            }
        )

    return {
        "sourceId": SOURCE_ID,
        "sourceFile": str(pdf_path),
        "sourceSha256": sha256_file(pdf_path),
        "extractedAt": date.today().isoformat(),
        "year": year,
        "pageCount": len(extracted_pages),
        "coverage": {
            "firstMonth": 1,
            "lastMonth": 12,
        },
        "dailyRecords": daily_records,
        "solarTerms": solar_terms,
        "pages": extracted_pages,
        "runtimeStatus": "extraction-draft",
    }


def main():
    parser = argparse.ArgumentParser(description="Extract year pages from PMO 1900-2025 calendar PDF.")
    parser.add_argument("--pdf", required=True, help="Path to PMO calendar PDF")
    parser.add_argument("--year", type=int, required=True, help="Gregorian year to extract")
    parser.add_argument("--out", help="Output JSON path")
    args = parser.parse_args()

    result = extract_year(args.pdf, args.year)
    payload = json.dumps(result, ensure_ascii=False, indent=2)

    if args.out:
        out_path = pathlib.Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(payload + "\n", encoding="utf-8")
    else:
        print(payload)


if __name__ == "__main__":
    main()
