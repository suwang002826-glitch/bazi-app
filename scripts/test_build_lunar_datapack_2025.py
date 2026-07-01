import importlib.util
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "scripts" / "build-lunar-datapack-2025.py"
PMO_DRAFT = ROOT.parent / "authority-sources" / "extracted" / "pmo-calendar-2025-draft.json"
VALIDATION_DIR = ROOT.parent / "authority-sources" / "validation"


def load_module():
    spec = importlib.util.spec_from_file_location("build_lunar_datapack_2025", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class LunarDataPack2025Test(unittest.TestCase):
    def test_builds_candidate_pack_with_full_2025_solar_year(self):
        module = load_module()

        pack = module.build_data_pack(PMO_DRAFT, VALIDATION_DIR)

        self.assertEqual(pack["dataPackId"], "lunar-data-pack-2025-candidate")
        self.assertEqual(pack["status"], "candidate-not-runtime-approved")
        self.assertEqual(pack["runtimeApproval"]["status"], "blocked")
        self.assertEqual(pack["coverage"]["solarYears"], [2025])
        self.assertEqual(pack["coverage"]["lunarYears"], [2024, 2025])
        self.assertTrue(pack["coverage"]["completeSolarYear"])
        self.assertFalse(pack["coverage"]["completeLunarCalendar"])
        self.assertEqual(len(pack["records"]), 365)
        self.assertEqual({report["status"] for report in pack["validationReports"]}, {"pass"})

    def test_converts_pmo_lunar_labels_to_numeric_lunar_keys(self):
        module = load_module()

        pack = module.build_data_pack(PMO_DRAFT, VALIDATION_DIR)
        by_solar = {record["solarDate"]: record for record in pack["records"]}

        self.assertEqual(
            {
                "lunarYear": by_solar["2025-01-01"]["lunarYear"],
                "lunarMonth": by_solar["2025-01-01"]["lunarMonth"],
                "lunarDay": by_solar["2025-01-01"]["lunarDay"],
                "isLeapMonth": by_solar["2025-01-01"]["isLeapMonth"],
                "lunarYearGanzhi": by_solar["2025-01-01"]["lunarYearGanzhi"],
                "dayGanzhi": by_solar["2025-01-01"]["dayGanzhi"],
            },
            {
                "lunarYear": 2024,
                "lunarMonth": 12,
                "lunarDay": 2,
                "isLeapMonth": False,
                "lunarYearGanzhi": "甲辰",
                "dayGanzhi": "庚午",
            },
        )
        self.assertEqual(by_solar["2025-01-29"]["lunarYear"], 2025)
        self.assertEqual(by_solar["2025-01-29"]["lunarMonth"], 1)
        self.assertEqual(by_solar["2025-01-29"]["lunarDay"], 1)
        self.assertEqual(by_solar["2025-07-25"]["lunarMonth"], 6)
        self.assertEqual(by_solar["2025-07-25"]["lunarDay"], 1)
        self.assertTrue(by_solar["2025-07-25"]["isLeapMonth"])

        lunar_keys = [
            (
                record["lunarYear"],
                record["lunarMonth"],
                record["lunarDay"],
                record["isLeapMonth"],
            )
            for record in pack["records"]
        ]
        self.assertEqual(len(lunar_keys), len(set(lunar_keys)))


if __name__ == "__main__":
    unittest.main()
