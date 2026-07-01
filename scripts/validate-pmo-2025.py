import argparse
import datetime as dt
import json
import pathlib
import re

from pypdf import PdfReader


STEMS = "甲乙丙丁戊己庚辛壬癸"
BRANCHES = "子丑寅卯辰巳午未申酉戌亥"
SEXAGENARY_CYCLE = [STEMS[index % 10] + BRANCHES[index % 12] for index in range(60)]
TRADITIONAL_TERM_NAMES = {
    "穀雨": "谷雨",
    "小滿": "小满",
    "處暑": "处暑",
}


def load_json(path):
    return json.loads(pathlib.Path(path).read_text(encoding="utf-8"))


def write_json(path, data):
    target = pathlib.Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def generated_at():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def validate_day_ganzhi(pmo_draft_path):
    draft = load_json(pmo_draft_path)
    records = draft["dailyRecords"]
    date_breaks = []
    ganzhi_breaks = []

    for previous, current in zip(records, records[1:]):
        previous_date = dt.date.fromisoformat(previous["date"])
        current_date = dt.date.fromisoformat(current["date"])
        expected_date = previous_date + dt.timedelta(days=1)
        if current_date != expected_date:
            date_breaks.append(
                {
                    "previousDate": previous["date"],
                    "currentDate": current["date"],
                    "expectedDate": expected_date.isoformat(),
                }
            )

        previous_ganzhi = previous["dayGanzhi"]
        current_ganzhi = current["dayGanzhi"]
        if previous_ganzhi not in SEXAGENARY_CYCLE:
            ganzhi_breaks.append(
                {
                    "date": previous["date"],
                    "actual": previous_ganzhi,
                    "expected": "valid-sexagenary-day",
                }
            )
            continue

        expected_ganzhi = SEXAGENARY_CYCLE[(SEXAGENARY_CYCLE.index(previous_ganzhi) + 1) % 60]
        if current_ganzhi != expected_ganzhi:
            ganzhi_breaks.append(
                {
                    "date": current["date"],
                    "actual": current_ganzhi,
                    "expected": expected_ganzhi,
                    "previousDate": previous["date"],
                    "previousGanzhi": previous_ganzhi,
                }
            )

    status = "pass" if len(records) == 365 and not date_breaks and not ganzhi_breaks else "fail"
    return {
        "reportId": "PMO-2025-DAY-GANZHI-CYCLE",
        "status": status,
        "generatedAt": generated_at(),
        "sourceId": draft["sourceId"],
        "sourceSha256": draft["sourceSha256"],
        "checks": {
            "records": len(records),
            "dateContinuityBreaks": len(date_breaks),
            "ganzhiCycleBreaks": len(ganzhi_breaks),
        },
        "anchors": {
            "first": {"date": records[0]["date"], "dayGanzhi": records[0]["dayGanzhi"]},
            "last": {"date": records[-1]["date"], "dayGanzhi": records[-1]["dayGanzhi"]},
        },
        "breaks": {
            "dateContinuity": date_breaks,
            "ganzhiCycle": ganzhi_breaks,
        },
    }


def normalize_hko_term_name(name):
    return TRADITIONAL_TERM_NAMES.get(name, name)


def parse_hko_date(date_text, year):
    compact = re.sub(r"\s+", "", date_text)
    day_text, month_text = compact.split("/")
    return dt.date(year, int(month_text), int(day_text)).isoformat()


def parse_hko_major_solar_terms(hko_pdf_path, year=2025):
    reader = PdfReader(str(hko_pdf_path))
    text = "\n".join(page.extract_text() for page in reader.pages)
    pattern = re.compile(
        r"(?m)^(?P<longitude>\d+)\s+(?P<date>[0-9 /]+?)\s*\n"
        r"\s*(?P<time>\d{2}:\d{2})\s*\n"
        r"\s*(?P<name>[\u4e00-\u9fff]+)\s*\n"
    )
    terms = []
    for match in pattern.finditer(text):
        terms.append(
            {
                "name": normalize_hko_term_name(match.group("name")),
                "date": parse_hko_date(match.group("date"), year),
                "time": match.group("time"),
                "timezone": "Asia/Shanghai",
                "sourceLongitude": int(match.group("longitude")),
            }
        )
    return terms


def compare_hko_major_solar_terms(pmo_draft_path, hko_pdf_path):
    draft = load_json(pmo_draft_path)
    pmo_terms = {term["name"]: term for term in draft["solarTerms"]}
    hko_terms = parse_hko_major_solar_terms(hko_pdf_path, draft["year"])
    diffs = []
    matched_terms = []

    for hko_term in hko_terms:
        pmo_term = pmo_terms.get(hko_term["name"])
        if not pmo_term:
            diffs.append({"name": hko_term["name"], "issue": "missing-in-pmo", "hko": hko_term})
            continue

        observed_diff = {}
        for field in ("date", "time", "timezone"):
            if pmo_term[field] != hko_term[field]:
                observed_diff[field] = {"pmo": pmo_term[field], "hko": hko_term[field]}

        if observed_diff:
            diffs.append({"name": hko_term["name"], "issue": "value-diff", "diff": observed_diff})
        else:
            matched_terms.append(hko_term["name"])

    pmo_major_names = {term["name"] for term in hko_terms}
    uncompared_minor_terms = [
        term["name"] for term in draft["solarTerms"] if term["name"] not in pmo_major_names
    ]
    status = "pass" if len(hko_terms) == 12 and not diffs else "fail"
    return {
        "reportId": "PMO-VS-HKO-2025-MAJOR-SOLAR-TERMS",
        "status": status,
        "generatedAt": generated_at(),
        "sources": {
            "primary": draft["sourceId"],
            "primarySha256": draft["sourceSha256"],
            "secondaryFile": str(pathlib.Path(hko_pdf_path)),
        },
        "checks": {
            "pmoSolarTerms": len(draft["solarTerms"]),
            "hkoMajorTerms": len(hko_terms),
            "matchedTerms": len(matched_terms),
            "diffs": len(diffs),
        },
        "matchedTerms": matched_terms,
        "diffs": diffs,
        "uncomparedPmoMinorTerms": len(uncompared_minor_terms),
        "uncomparedPmoMinorTermNames": uncompared_minor_terms,
        "boundary": "HKO 2025 PDF lists 12 major solar terms only; PMO minor terms remain primary-source only in this report.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pmo-draft", required=True)
    parser.add_argument("--hko-solar-terms", required=True)
    parser.add_argument("--out-dir", required=True)
    args = parser.parse_args()

    out_dir = pathlib.Path(args.out_dir)
    day_report = validate_day_ganzhi(args.pmo_draft)
    solar_report = compare_hko_major_solar_terms(args.pmo_draft, pathlib.Path(args.hko_solar_terms))

    write_json(out_dir / "pmo-2025-day-ganzhi-cycle-report.json", day_report)
    write_json(out_dir / "pmo-vs-hko-2025-major-solar-terms-report.json", solar_report)
    print(json.dumps({"reports": [day_report["reportId"], solar_report["reportId"]]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
