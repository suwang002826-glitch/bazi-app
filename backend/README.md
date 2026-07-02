# Bazi Backend

This directory contains the first backend service boundary for the bazi product.

## Endpoint

`POST /bazi/calculate`

The request follows the frontend contract in `bazi-backend-api-contract.md`:

- `calendarType: "solar"` uses `birthTime` as the Gregorian birth time.
- `calendarType: "lunar"` also requires `lunarDate.year`, `lunarDate.month`, `lunarDate.day`, and `lunarDate.isLeapMonth`.
- `timeMode: "trueSolarTime"` enables true solar time calibration.

The response returns:

- `result`
- `baziPlate`

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
