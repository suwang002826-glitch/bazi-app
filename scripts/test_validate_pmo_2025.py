import importlib.util
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "scripts" / "validate-pmo-2025.py"
PMO_DRAFT = ROOT.parent / "authority-sources" / "extracted" / "pmo-calendar-2025-draft.json"
HKO_SOLAR_TERMS = ROOT.parent / "authority-sources" / "secondary" / "hko-2025-solar-terms.pdf"


def load_module():
    spec = importlib.util.spec_from_file_location("validate_pmo_2025", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class Pmo2025ValidationTest(unittest.TestCase):
    def test_validates_day_ganzhi_continuity(self):
        module = load_module()

        report = module.validate_day_ganzhi(PMO_DRAFT)

        self.assertEqual(report["reportId"], "PMO-2025-DAY-GANZHI-CYCLE")
        self.assertEqual(report["status"], "pass")
        self.assertEqual(report["checks"]["records"], 365)
        self.assertEqual(report["checks"]["dateContinuityBreaks"], 0)
        self.assertEqual(report["checks"]["ganzhiCycleBreaks"], 0)
        self.assertEqual(report["anchors"]["first"], {"date": "2025-01-01", "dayGanzhi": "庚午"})
        self.assertEqual(report["anchors"]["last"], {"date": "2025-12-31", "dayGanzhi": "甲戌"})

    def test_compares_hko_major_solar_terms(self):
        module = load_module()

        report = module.compare_hko_major_solar_terms(PMO_DRAFT, HKO_SOLAR_TERMS)

        self.assertEqual(report["reportId"], "PMO-VS-HKO-2025-MAJOR-SOLAR-TERMS")
        self.assertEqual(report["status"], "pass")
        self.assertEqual(report["checks"]["hkoMajorTerms"], 12)
        self.assertEqual(report["checks"]["matchedTerms"], 12)
        self.assertEqual(report["checks"]["diffs"], 0)
        self.assertEqual(report["uncomparedPmoMinorTerms"], 12)


if __name__ == "__main__":
    unittest.main()
