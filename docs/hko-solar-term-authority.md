# HKO Solar Term Authority Source

Decision date: 2026-07-03

## Decision

Hong Kong Observatory is the current primary public authority source for solar-term data in this project.

Purple Mountain Observatory remains a preferred cross-check source when public, archivable data are available, but it no longer blocks the current solar-term data-pack work.

## Official Sources

- Official page: https://www.hko.gov.hk/sc/gts/astronomy/Solar_Term.htm
- Machine-readable XML pattern: https://www.hko.gov.hk/tc/gts/astronomy/data/files/24SolarTerms_{year}.xml
- Example years currently registered: 2024, 2025, 2026

## Authority Notes

The HKO page states that the astronomical data are calculated from data provided by HM Nautical Almanac Office and the United States Naval Observatory.

The HKO page also states that all displayed times are Hong Kong Time, which is UTC+08:00. For this project, that time can be normalized to Beijing time without changing the clock time.

## Runtime Boundary

The HKO data-pack for Gregorian years 2024, 2025, and 2026 is approved for runtime preview only. It may be used by the bazi runtime for those years, while all out-of-scope years must continue to use local astronomical-search fallback.

This approval covers solar-term times only. It does not imply full historical lunar conversion coverage.

User-submitted screenshots with second-level times are used only as cross-check evidence. Because HKO XML provides minute-level times, screenshot comparisons must remain within one minute of the official HKO XML values.
