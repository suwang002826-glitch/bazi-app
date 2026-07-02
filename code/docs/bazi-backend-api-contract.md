# Bazi backend API contract

This is the frontend adapter contract for switching the Mini Program from the
local preview engine to the backend calculation service.

## Runtime switch

Frontend reads `app.globalData.baziApi`.

```js
baziApi: {
  enabled: true,
  baseUrl: 'http://127.0.0.1:8787',
  calculatePath: '/bazi/calculate',
  timeout: 15000,
  provider: 'backend-local'
}
```

In the Mini Program test phase, the Bazi page should call the backend by default.
If `enabled` is `false` or `baseUrl` is empty, the page must show a service
configuration error instead of falling back to local calculation.

For local WeChat DevTools preview, start the backend first:

```bash
node backend/server.js
```

Default test URL:

```text
http://127.0.0.1:8787/bazi/calculate
```

## Request

`POST /bazi/calculate`

```json
{
  "name": "未命名",
  "gender": "男",
  "calendarType": "solar",
  "birthTime": "2000-01-01 08:00:00",
  "birthPlace": {
    "province": "北京市",
    "city": "北京市",
    "district": "东城区",
    "town": "",
    "address": "",
    "lng": 116.4,
    "lat": 39.9,
    "coordType": "GCJ02"
  },
  "timeMode": "trueSolarTime",
  "options": {
    "saveCase": true,
    "group": "练习",
    "requireSolarTermContext": true,
    "requireTimeCalibration": true,
    "requirePlaceCoordinate": true
  },
  "clientMeta": {
    "source": "wechat-miniprogram",
    "schemaVersion": "bazi-request@1.0.0",
    "coordType": "GCJ02"
  }
}
```

For lunar input, include:

```json
{
  "calendarType": "lunar",
  "lunarDate": {
    "year": 2023,
    "month": 8,
    "day": 15,
    "isLeapMonth": false
  }
}
```

## Response

The frontend accepts either:

```json
{
  "reading": {
    "result": {},
    "baziPlate": {}
  }
}
```

or:

```json
{
  "result": {},
  "baziPlate": {}
}
```

The `result` should keep the current frontend shape as much as possible:

```json
{
  "displayName": "未命名",
  "title": "未命名的八字排盘",
  "gender": "男",
  "solarTime": "2000-01-01 08:00",
  "adjustedSolarTime": "2000-01-01 07:45",
  "birthPlace": "北京市 北京市 东城区",
  "longitude": "116.40",
  "timeMode": "trueSolarTime",
  "pillars": [],
  "distribution": [],
  "luck": [],
  "flowYears": [],
  "flowMonths": [],
  "professional": {},
  "detailProfile": {},
  "timeCalibration": {},
  "solarTermContext": {},
  "calendarProviderInfo": {}
}
```

If backend does not return `baziPlate`, frontend will try to build it from
`result.pillars`.

## Required accuracy fields

Backend should eventually return these fields for professional-grade display:

- `timeCalibration.beijingTime`
- `timeCalibration.localMeanSolarTime`
- `timeCalibration.trueSolarTime`
- `timeCalibration.longitude`
- `timeCalibration.latitude`
- `timeCalibration.coordType`
- `timeCalibration.correctionMinutes`
- `solarTermContext.previous`
- `solarTermContext.previousAt`
- `solarTermContext.next`
- `solarTermContext.nextAt`
- `solarTermContext.monthBoundary`
- `calendarProviderInfo.lunar`
- `calendarProviderInfo.solarTerm`

## Error handling

Use non-2xx status for hard failures. Suggested body:

```json
{
  "code": "INVALID_BIRTH_TIME",
  "message": "出生时间格式不正确"
}
```
