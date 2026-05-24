# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AMRIT HWC-UI (Health and Wellness Centre UI) — an Angular 16 healthcare application for the PSMRI AMRIT platform. Supports nurse, doctor, lab technician, pharmacist, radiologist, and oncologist workflows including patient registration, vitals capture, clinical examination, diagnosis (ANC, PNC, NCD screening, immunization, family planning, CDSS), prescriptions, lab tests, drug dispensing, telemedicine specialist consultations, and offline data sync.

## Build & Development Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server on **port 4204** (`ng serve`) |
| `npm run build-dev` | AOT dev build (increased heap) |
| `npm run build-prod` | AOT production build (increased heap) |
| `npm run build-ci` | CI build (generates `environment.ci.ts` from template + env vars) |
| `npm test` | Run tests (Karma + Jasmine) |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run commit` | Commitizen conventional commit prompt |

## Git Submodule: Common-UI

`Common-UI/` is a git submodule from `https://github.com/PSMRI/Common-UI`. It provides:
- `registrar` module (patient registration + `SessionStorageService`)
- `feedback` module
- `tracking` module (Matomo analytics)

Initialize with:
```bash
git submodule update --init --recursive
```

Import paths use `Common-UI/src/...` (e.g., `Common-UI/src/registrar/registration.module`).

## Architecture

### Module Structure

- **AppModule** — root module with hash-based routing (`useHash: true`)
- **CoreModule** — singleton services, guards, shared components, directives, `MaterialModule`
- **NurseDoctorModule** (lazy-loaded at `/nurse-doctor`) — primary clinical module:
  - `visit-details` — visit type selection and details
  - `vitals` — vitals capture
  - `history` — medical/family/personal history
  - `examination` — clinical examination
  - `case-record` — diagnosis, prescriptions, investigations, referrals
  - `case-sheet` — printable case sheet
  - `screening` — NCD/IDRS screening
  - `cdss` — Clinical Decision Support System
  - `anc` / `pnc` — antenatal/postnatal care
  - `immunization-service` — immunization workflows
  - `family-planning` — family planning services
  - `idrs` — IDRS screening tool
  - `refer` — referral management
  - `quick-consult` — quick consultation flow
  - `scheduler` — embedded scheduling
  - Role-specific worklists: `nurse-worklist-wrapper`, `doctor-worklist`, `doctor-tm-worklist-wrapper`, `doctor-tm-future-worklist`, `tc-specialist-worklist`, `tc-specialist-future-worklist`, `radiologist-worklist`, `oncologist-worklist`
- **LabModule** (lazy-loaded at `/lab`) — lab test workflows
- **PharmacistModule** (lazy-loaded at `/pharmacist`) — drug dispensing
- **DataSYNCModule** (lazy-loaded at `/datasync`) — offline data synchronization
- **RegistrationModule** (lazy-loaded at `/registrar`, from Common-UI) — patient registration
- **FeedbackModule** (lazy-loaded at `/feedback`, from Common-UI) — feedback collection

### Routing

Root routes: `login`, `logout-tm`, `service`, `servicePoint`, `set-password`, `reset-password`, `set-security-questions`, plus lazy-loaded feature modules above.

Nurse-doctor sub-routes include role-specific worklists and patient workarea.

### State Management

Angular services with `BehaviorSubject`/`Subject`. No NgRx. Encrypted sessionStorage via `ng-cryptostore`.

### HTTP / Auth

- HTTP interceptor attaches `Authorization`/`ServerAuthorization` headers, manages spinner, handles 27-minute session timeout with warning dialog, auto-logout on 401/5002
- `AuthGuard` protects clinical routes
- `CanDeactivateGuardService` prevents navigation with unsaved changes

### Key Services

- `ConfirmationService` — alert/confirm/remarks dialogs via `MatDialog`
- `NurseService` / `DoctorService` — cross-component clinical state
- `MasterdataService` — master data caching
- `IotService` — Bluetooth device integration (localhost:8085)

## Key Dependencies

- Angular 16 + Angular Material 16
- Bootstrap 5 (layout) + Font Awesome 4.7 (icons)
- `crypto-js` — password encryption (AES + PBKDF2)
- `ng-cryptostore` — encrypted sessionStorage
- `moment` — date handling
- `ng2-charts` + `chart.js` — charts
- `ngx-webcam` — webcam capture
- `recordrtc` — audio recording
- `html2canvas` — screenshot/print
- `ngx-bootstrap` — additional UI components
- `ngx-pagination` — pagination
- `file-saver` — file downloads
- `jquery` — DOM manipulation (legacy)

## Code Conventions

- **License header**: All source files begin with the AMRIT GPL-3.0 license block
- **Component prefix**: `app`
- **Commit convention**: Conventional Commits enforced via commitlint + Husky
- **Pre-commit hook**: `lint-staged` runs ESLint `--fix` on staged `.ts` files

## Environment Configuration

Environment files in `src/environments/`. CI build uses EJS template (`environment.ci.ts.template`) with env vars for API endpoints, encryption keys, captcha config, and tracking config.
