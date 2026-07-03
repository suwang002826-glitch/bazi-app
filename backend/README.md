# Bazi Backend

This directory contains the first backend service boundary for the bazi product.

## Endpoint

`POST /bazi/calculate`

`GET /bazi/calendar/coverage`

The request follows the frontend contract in `bazi-backend-api-contract.md`:

- `calendarType: "solar"` uses `birthTime` as the Gregorian birth time.
- `calendarType: "lunar"` also requires `lunarDate.year`, `lunarDate.month`, `lunarDate.day`, and `lunarDate.isLeapMonth`.
- `timeMode: "trueSolarTime"` enables true solar time calibration.

The response returns:

- `result`
- `baziPlate`

## Lunar Range

The backend calculate endpoint can use the Hong Kong Observatory lunar
conversion pack for verified lunar inputs from 1901 to 2100.

The Mini Program must call the backend for this range. The full HKO range pack
is not bundled into the Mini Program package.

1900 is intentionally not opened in the UI yet because the current authority
source ledger starts at HKO 1901. Add 1900 only after a traceable authority
source is recorded and validated.

## Local Run

```bash
node backend/server.js
```

Default URL:

```text
http://127.0.0.1:8787/bazi/calculate
```

## Current Boundary

This is a service wrapper around the current local rule engine. It is not yet a
deployed production backend and does not yet include account, storage, orders,
or database services.

Accuracy work continues to be gated by the PMO/lunar data-pack review flow.
