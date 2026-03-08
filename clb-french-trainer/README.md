# CLB French Trainer

Monorepo scaffold for a TEF Canada preparation app targeting CLB 5 and CLB 7.

## Stack
- Mobile: React Native (Expo + TypeScript)
- Backend: Node.js (Express + TypeScript)
- Database/Auth/Storage: Firebase

## Apps
- `apps/mobile`: learner mobile app (auth, onboarding diagnostic, practice modules, mock exam)
- `apps/backend`: API + domain logic + AI writing correction orchestration

## Packages
- `packages/shared-types`: cross-platform TypeScript contracts
- `packages/shared-utils`: shared pure helpers
- `packages/eslint-config`: shared lint rules placeholder
- `packages/tsconfig`: shared tsconfig presets placeholder

## Firebase
- `firebase/`: local emulator config, security rules, indexes, seed files

## Docs
- `docs/ARCHITECTURE.md`: clean architecture boundaries and module responsibilities

## Run
1. `cp .env.example .env`
2. `npm install`
3. `npm run dev:backend`
4. `npm run dev:mobile`
