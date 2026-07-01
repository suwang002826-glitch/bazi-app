# Lunar limited runtime candidates

This directory stores limited runtime candidate packs.

Current boundary:

- Candidate packs are not registered runtime data.
- Candidate packs must keep `status: "candidate"`.
- Candidate packs must keep `runtimeEnabled: false`.
- Candidate packs must keep `manifestRegistered: false`.
- Candidate packs must keep `completeLunarCalendar: false`.
- Candidate packs must reference a reviewed limited runtime scope.
- Manifest registration must happen in a separate approval PR.

The 2023 HKO candidate preserves the reviewed draft records and adds limited runtime metadata only.
