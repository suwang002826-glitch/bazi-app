import importlib.util
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "scripts" / "extract-pmo-calendar.py"
DEFAULT_PDF = ROOT.parent / "authority-sources" / "pmo-calendar-1900-2025.pdf"


def load_module():
    spec = importlib.util.spec_from_file_location("extract_pmo_calendar", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PmoCalendarExtractionTest(unittest.TestCase):
    def test_locates_2025_pages_and_extracts_page_metadata(self):
        module = load_module()

        result = module.extract_year(DEFAULT_PDF, 2025)

        self.assertEqual(result["sourceId"], "PMO-CALENDAR-1900-2025")
        self.assertEqual(result["year"], 2025)
        self.assertEqual(result["pageCount"], 3)
        self.assertEqual([page["pdfPage"] for page in result["pages"]], [378, 379, 380])
        self.assertEqual([page["months"] for page in result["pages"]], [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]])
        self.assertEqual(result["coverage"]["firstMonth"], 1)
        self.assertEqual(result["coverage"]["lastMonth"], 12)
        self.assertGreater(result["pages"][0]["textChars"], 1000)

    def test_extracts_2025_daily_records_and_solar_terms(self):
        module = load_module()

        result = module.extract_year(DEFAULT_PDF, 2025)

        self.assertEqual(len(result["dailyRecords"]), 365)
        self.assertEqual(len(result["solarTerms"]), 24)

        by_date = {record["date"]: record for record in result["dailyRecords"]}
        self.assertEqual(
            by_date["2025-01-01"],
            {
                "date": "2025-01-01",
                "lunarYear": "甲辰",
                "lunarMonth": "十二月",
                "lunarDay": "初二",
                "isLeapMonth": False,
                "dayGanzhi": "庚午",
                "weekday": "三",
            },
        )
        self.assertEqual(by_date["2025-01-29"]["lunarYear"], "乙巳")
        self.assertEqual(by_date["2025-01-29"]["lunarMonth"], "正月")
        self.assertEqual(by_date["2025-01-29"]["lunarDay"], "初一")
        self.assertEqual(by_date["2025-07-25"]["lunarMonth"], "闰六月")
        self.assertTrue(by_date["2025-07-25"]["isLeapMonth"])
        self.assertEqual(by_date["2025-12-31"]["lunarMonth"], "十一月")
        self.assertEqual(by_date["2025-12-31"]["lunarDay"], "十二")

        self.assertIn(
            {
                "name": "小寒",
                "date": "2025-01-05",
                "time": "10:33",
                "timezone": "Asia/Shanghai",
            },
            result["solarTerms"],
        )
        self.assertIn(
            {
                "name": "冬至",
                "date": "2025-12-21",
                "time": "23:03",
                "timezone": "Asia/Shanghai",
            },
            result["solarTerms"],
        )


if __name__ == "__main__":
    unittest.main()
