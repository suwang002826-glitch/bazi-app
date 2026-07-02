# Mobile App Transition Design

## Decision

The product will stop targeting WeChat Mini Program as the primary client and will move to a standalone mobile app.

The first standalone app client should use React Native with Expo. The current WeChat Mini Program code remains as a visual and flow prototype only. It should not define future packaging, storage, or runtime constraints.

## Product Goal

Build a precise, stable, and professional Bazi charting app. Accuracy and traceability take priority over fast UI expansion.

The app must make it clear when a result is produced by verified data, preview data, candidate data, or a rule that is still under review.

## Architecture

The project will use a three-part architecture:

1. Mobile app client under `apps/mobile`
2. Existing backend under `backend`
3. Shared algorithm and calendar data under `code/utils` and `code/data-packs`

The mobile app calls backend HTTP APIs for chart calculation. The backend owns calendar conversion, Bazi rules, authority-source tracking, validation, and large data packs.

## Technology Direction

Use React Native with Expo for the app client.

Reasons:

- The existing project already uses JavaScript.
- The current backend and Bazi logic can stay close to the app codebase.
- Expo supports iOS and Android from one codebase.
- It avoids continuing to design around Mini Program package limits.

Flutter is not selected for the first migration because it would add a new language and ecosystem before the algorithm is stable.

## Data-Pack Policy

The HKO 1901-2100 lunar range pack remains backend-side data.

It must not be bundled directly into the mobile app in the first version. Even though a native app has fewer package constraints than a Mini Program, the product should still avoid shipping large authority data into the client before update, licensing, and provenance rules are settled.

The app may cache small responses later, but calculation authority stays on the backend.

## Backend Responsibilities

Backend owns:

- `POST /bazi/calculate`
- `GET /bazi/calendar/coverage`
- Lunar-to-solar conversion
- Leap-month handling
- Solar-term and true-solar-time policy
- Bazi chart engine
- Authority-source metadata
- Validation scripts and acceptance cases
- Future persistence APIs for user chart history

The backend must continue returning data provenance fields so the app can show professional source status.

## Mobile App Responsibilities

The app owns:

- Input flow for solar and lunar birth dates
- Location selection and coordinate capture
- Chart result display
- Professional reading layout
- Saved chart list
- Error and unsupported-range messages

The app must not reimplement Bazi calculation logic in the first version.

## Migration Scope

The first App migration should deliver:

- A new Expo app scaffold under `apps/mobile`
- A home/input screen
- A result screen placeholder connected to backend response shape
- A backend client wrapper for `POST /bazi/calculate`
- A backend coverage client wrapper for `GET /bazi/calendar/coverage`
- A README explaining how to run the app and backend together

The first migration should not deliver:

- App Store release
- Payment
- Login
- Offline full calendar conversion
- Native plugin customization
- Rewriting the backend

## Acceptance Criteria

- Existing backend validation still passes.
- Mini Program files remain untouched except documentation references.
- `apps/mobile` can be installed and started independently.
- The app code uses API response contracts instead of copying backend algorithms.
- The project documents that the primary client is now standalone App, not Mini Program.

## Risks

- The current UI assets and pages were built for Mini Program and cannot be copied directly without adaptation.
- The backend is still local-first; real mobile devices will eventually need a reachable backend endpoint.
- Calendar data licensing and authority-source policy must remain explicit before broad public release.

## Next Step

Create the Expo mobile app scaffold and connect it to the existing backend contract in the smallest possible slice.
