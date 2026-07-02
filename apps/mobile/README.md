# Bazi Mobile App

This is the standalone App client for the Bazi charting product.

The backend remains responsible for calculation, lunar conversion, data-pack provenance, and validation.

## Run

Start backend:

```powershell
node backend\server.js
```

Start mobile app:

```powershell
cd apps\mobile
npm install
npm run start
```

## Browser Preview

Use this when Expo Go is not convenient.

### One-click Preview on Windows

Double-click this file at the repository root:

```text
start-app-preview.cmd
```

It starts the backend, starts the browser preview, and opens:

```text
http://localhost:8082
```

### Manual Preview

Start backend first:

```powershell
node backend\server.js
```

Start the web preview:

```powershell
cd apps\mobile
$env:EXPO_PUBLIC_BAZI_API_BASE_URL='http://127.0.0.1:8787'
npm run web -- --host localhost --port 8082
```

Open:

```text
http://localhost:8082
```
