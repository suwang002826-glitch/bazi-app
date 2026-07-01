# Lunar source manifests

This directory is for source-control manifests used before generating complete lunar data-packs.

Current boundary:

- Source manifests are draft inputs, not runtime data.
- The generator is dry-run only.
- Source manifests must declare `manifestKind: "source-scaffold"` and `writesPack: false`.
- Draft source manifests must keep `reviewPolicy.runtimeEnabled` set to `false`.
- Draft source manifests must keep `targetRuntimeEnabled` set to `false`.
- Each source must declare provider, dataset name, role, format, landing URL, direct source URL, byte length, and sha256 checksum.
- Same-provider multi-format sources must declare `sourceReviewBoundary.independentReviewRequired: true` until an independent review source is approved.
- Dry-run parsing may read a downloaded raw source through `--raw-source <sourceId=path>` to report record count, date range, leap-month summary, and a candidate records checksum.
- Raw-source dry-runs still keep `writesPack: false`; they must not write data-pack records or register runtime files.
- Complete lunar data-packs still require approved sources, generated records, mirrored runtime files, checksum validation, and manual review.
