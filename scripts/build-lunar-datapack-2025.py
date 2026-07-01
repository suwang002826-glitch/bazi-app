import argparse
import hashlib
import json
import pathlib


MONTHS = {
    "正月": 1,
    "二月": 2,
    "三月": 3,
    "四月": 4,
    "五月": 5,
    "六月": 6,
    "七月": 7,
    "八月": 8,
    "九月": 9,
    "十月": 10,
    "十一月": 11,
    "冬月": 11,
    "十二月": 12,
    "腊月": 12,
}

DAYS = {
    "初一": 1,
    "初二": 2,
    "初三": 3,
    "初四": 4,
    "初五": 5,
    "初六": 6,
    "初七": 7,
    "初八": 8,
    "初九": 9,
    "初十": 10,
    "十一": 11,
    "十二": 12,
    "十三": 13,
    "十四": 14,
    "十五": 15,
    "十六": 16,
    "十七": 17,
    "十八": 18,
    "十九": 19,
    "二十": 20,
    "廿一": 21,
    "廿二": 22,
    "廿三": 23,
    "廿四": 24,
    "廿五": 25,
    "廿六": 26,
    "廿七": 27,
    "廿八": 28,
    "廿九": 29,
    "三十": 30,
}

VALIDATION_REPORT_FILES = [
    "pmo-vs-hko-2025-lunar-report.json",
    "pmo-2025-day-ganzhi-cycle-report.json",
    "pmo-vs-hko-2025-major-solar-terms-report.json",
]


def load_json(path):
    return json.loads(pathlib.Path(path).read_text(encoding="utf-8"))


def write_json(path, data):
    target = pathlib.Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def file_sha256(path):
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest().upper()


def normalize_month(label):
    clean_label = label[1:] if label.startswith("闰") else label
    if clean_label not in MONTHS:
        raise ValueError(f"Unsupported lunar month label: {label}")
    return MONTHS[clean_label]


def normalize_day(label):
    if label not in DAYS:
        raise ValueError(f"Unsupported lunar day label: {label}")
    return DAYS[label]


def find_lunar_new_year_index(records):
    for index, record in enumerate(records):
        if record["lunarMonth"] == "正月" and record["lunarDay"] == "初一":
            return index
    raise ValueError("Cannot locate lunar new year in PMO draft records.")


def load_validation_reports(validation_dir):
    reports = []
    for filename in VALIDATION_REPORT_FILES:
        path = pathlib.Path(validation_dir) / filename
        report = load_json(path)
        reports.append(
            {
                "reportId": report["reportId"],
                "status": report["status"],
                "path": str(path),
                "sha256": file_sha256(path),
            }
        )
    return reports


def build_records(draft):
    solar_year = draft["year"]
    daily_records = draft["dailyRecords"]
    lunar_new_year_index = find_lunar_new_year_index(daily_records)
    records = []

    for index, record in enumerate(daily_records):
        lunar_year = solar_year if index >= lunar_new_year_index else solar_year - 1
        records.append(
            {
                "solarDate": record["date"],
                "lunarYear": lunar_year,
                "lunarMonth": normalize_month(record["lunarMonth"]),
                "lunarDay": normalize_day(record["lunarDay"]),
                "isLeapMonth": record["isLeapMonth"],
                "lunarYearGanzhi": record["lunarYear"],
                "lunarMonthLabel": record["lunarMonth"],
                "lunarDayLabel": record["lunarDay"],
                "dayGanzhi": record["dayGanzhi"],
                "weekday": record["weekday"],
                "sourceRecord": "PMO-CALENDAR-2025-DRAFT",
            }
        )

    lunar_keys = [
        (item["lunarYear"], item["lunarMonth"], item["lunarDay"], item["isLeapMonth"])
        for item in records
    ]
    if len(lunar_keys) != len(set(lunar_keys)):
        raise ValueError("Duplicate lunar conversion keys detected.")

    return records


def build_data_pack(pmo_draft_path, validation_dir):
    draft = load_json(pmo_draft_path)
    records = build_records(draft)
    validation_reports = load_validation_reports(validation_dir)
    failed_reports = [report for report in validation_reports if report["status"] != "pass"]
    if failed_reports:
        raise ValueError(f"Cannot build candidate data-pack with failing reports: {failed_reports}")

    lunar_years = sorted({record["lunarYear"] for record in records})
    return {
        "dataPackId": "lunar-data-pack-2025-candidate",
        "calendarDataVersion": "lunar-data-pack@2026.07.02-pmo-2025-candidate",
        "source": "PMO-CALENDAR-1900-2025:2025",
        "status": "candidate-not-runtime-approved",
        "runtimeApproval": {
            "status": "blocked",
            "reason": "Candidate pack is validated but not yet approved for runtime loading.",
        },
        "coverage": {
            "solarYears": [draft["year"]],
            "lunarYears": lunar_years,
            "completeSolarYear": len(records) == 365,
            "completeLunarCalendar": False,
            "records": len(records),
        },
        "sourceMeta": {
            "primarySourceId": draft["sourceId"],
            "primarySourceSha256": draft["sourceSha256"],
            "extractedFile": str(pathlib.Path(pmo_draft_path)),
            "extractedFileSha256": file_sha256(pmo_draft_path),
            "runtimeStatus": draft["runtimeStatus"],
        },
        "validationReports": validation_reports,
        "records": records,
        "solarTerms": draft["solarTerms"],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pmo-draft", required=True)
    parser.add_argument("--validation-dir", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    pack = build_data_pack(args.pmo_draft, args.validation_dir)
    write_json(args.out, pack)
    print(json.dumps({"dataPackId": pack["dataPackId"], "records": len(pack["records"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
