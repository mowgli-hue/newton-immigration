# CLB French Trainer Architecture

## Goal
Deliver a scalable TEF Canada preparation platform for CLB 5 and CLB 7 across listening, speaking, reading, writing, diagnostic onboarding, and mock exams.

## Monorepo Strategy
- Keep mobile, backend, and shared contracts in one repository.
- Enforce module boundaries by layer (domain/application/infrastructure/api).
- Reuse shared type contracts between frontend and backend.

## Backend Clean Architecture
Dependency rule: `api -> application -> domain`, and `infrastructure` implements interfaces defined by `domain` or `application`.

- `domain`: pure business entities, repository contracts, value objects.
- `application`: use-cases and orchestration logic per feature.
- `api`: HTTP routes/controllers, input validation, middleware.
- `infrastructure`: Firebase adapters, AI providers, logging, config.
- `modules`: feature assembly points for each vertical.

## Mobile Architecture
Feature-first folders with shared cross-cutting layers.

- `app`: app bootstrap and providers.
- `navigation`: root and feature navigators.
- `features/*`: screen logic and UI per domain feature.
- `services`: external integrations (API, audio, storage, voice).
- `core`: app-wide config/theme/hooks/constants.
- `shared`: reusable UI primitives and shared local types.

## Firebase Boundaries
- Auth: account/session identity.
- Firestore: users, progress, diagnostics, mock exam attempts.
- Storage: speaking audio uploads and listening assets when needed.
- Emulator config included for local end-to-end development.

## High-Level Data Model (initial)
- `users/{userId}`: profile, targetClb, onboarding status.
- `progress/{userId}/skills/{skill}`: latest score, CLB estimate, trend.
- `diagnostics/{userId}/attempts/{attemptId}`: baseline placement results.
- `mockExams/{userId}/attempts/{attemptId}`: timed test sessions and outcomes.

## Next Implementation Order
1. Auth flow + user profile provisioning.
2. Onboarding diagnostic engine + scoring.
3. Dashboard aggregation endpoint + mobile progress cards.
4. Listening/speaking/reading/writing modules.
5. Mock exam timer + adaptive scoring.
