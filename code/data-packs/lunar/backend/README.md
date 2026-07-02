# HKO lunar backend range pack

This folder contains backend/local calendar data generated from Hong Kong Observatory
Gregorian-Lunar calendar conversion text tables.

## Scope

- Gregorian years: 1901-2100
- Records: 73,049 daily conversion records
- Source pattern: `https://www.hko.gov.hk/en/gts/time/calendar/text/files/TYYYYe.txt`
- Main pack: `hko-lunar-1901-2100.compact.json`
- Manifest: `hko-lunar-1901-2100.manifest.json`
- Validation report: `hko-lunar-1901-2100.validation.json`
- Raw source cache: `sources/TYYYYe.txt`

## Important packaging rule

Do not put this backend pack into the WeChat Mini Program main package.
The compact JSON is about 5 MB, so it must be served by backend/cloud storage/CDN,
or split by year/month before being used on-device.

## Validation notes

- Every Gregorian year from 1901 to 2100 is checked for complete day count.
- Leap lunar months are inferred from duplicated HKO lunar month starts.
- Solar term names are retained when HKO lists them in the yearly source text.
- `2069-12-30` is missing from the HKO text source, but adjacent source rows prove
  the expected lunar sequence. The generated pack includes an inferred record and
  marks it in the validation report as `inferred-from-hko-adjacent-gap`.
- `pmo-cross-check-2025.json` compares the generated HKO 2025 data against the
  project-bundled Zijinshan/Purple Mountain Observatory 2025 candidate extraction.
  Wider PMO validation still requires additional licensed or formally confirmed
  structured PMO data.

## Regeneration

```powershell
node .\scripts\build-hko-lunar-range-pack.js --start=1901 --end=2100
node .\scripts\validate-hko-range-with-pmo.js
```
