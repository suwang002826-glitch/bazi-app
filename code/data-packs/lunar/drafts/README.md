# Lunar draft data-packs

This directory stores generated draft lunar data-packs for validation and review.

Current boundary:

- Draft packs are not runtime data.
- Draft packs must not be registered in `code/data-packs/lunar/manifest.json`.
- Draft packs must keep `status: "draft"`, `runtimeEnabled: false`, and `targetRuntimeEnabled: false`.
- A Gregorian-year draft can be complete for one Gregorian calendar year while still not being a complete lunar-year runtime pack.
- Independent review remains required before any draft pack can become a runtime data-pack.

