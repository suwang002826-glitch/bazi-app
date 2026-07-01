# Lunar source manifests

This directory is for source-control manifests used before generating complete lunar data-packs.

Current boundary:

- Source manifests are draft inputs, not runtime data.
- The generator is dry-run only.
- Source manifests must declare `manifestKind: "source-scaffold"` and `writesPack: false`.
- Draft source manifests must keep `reviewPolicy.runtimeEnabled` set to `false`.
- Draft source manifests must keep `targetRuntimeEnabled` set to `false`.
- Complete lunar data-packs still require approved sources, generated records, mirrored runtime files, checksum validation, and manual review.
