# Franco Launch Checklist

This checklist is the release gate for `web + iOS + Android`.

## 1. Environment And Secrets
- [ ] Confirm `/apps/mobile/.env` exists and all `EXPO_PUBLIC_*` values are set.
- [ ] Confirm `/apps/mobile/.env.example` is up to date for team onboarding.
- [ ] Confirm no secret keys are hardcoded in UI code.
- [ ] Confirm backend secrets are only in backend env files (not mobile).

## 2. Firebase Readiness
- [ ] Firebase web app config values are correct for production project.
- [ ] Authentication providers enabled (Email/Password).
- [ ] Authorized domains include Netlify domain and custom web domain.
- [ ] Test login/register/logout on:
  - [ ] Web
  - [ ] iOS
  - [ ] Android

## 3. Web Launch (Netlify)
- [ ] Build command works locally:
  - `npm run build:web:netlify --workspace @clb/mobile`
- [ ] Verify `apps/mobile/dist/_redirects` exists with SPA fallback.
- [ ] Netlify settings:
  - Base directory: `apps/mobile`
  - Build command: `npm run build:web:netlify`
  - Publish directory: `dist`
  - Node version: `20`
- [ ] Add Netlify environment variables:
  - `EXPO_PUBLIC_API_BASE_URL`
  - `EXPO_PUBLIC_FIREBASE_API_KEY`
  - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `EXPO_PUBLIC_FIREBASE_APP_ID`
- [ ] Smoke test deployed web app:
  - [ ] Onboarding routing
  - [ ] Lesson flow
  - [ ] Speaking recording (MediaRecorder fallback)

## 4. App Config And Branding
- [ ] Confirm app display name is `Franco`.
- [ ] Replace placeholder assets with final production assets:
  - `apps/mobile/assets/images/icon.png`
  - `apps/mobile/assets/images/adaptive-icon.png`
  - `apps/mobile/assets/images/splash-icon.png`
  - `apps/mobile/assets/images/favicon.png`
- [ ] Validate versioning in `apps/mobile/app.json`:
  - [ ] `expo.version`
  - [ ] iOS `buildNumber`
  - [ ] Android `versionCode`

## 5. iOS Build Readiness (Individual Developer Account)
- [ ] Confirm `ios.bundleIdentifier` is final and unique.
- [ ] Confirm microphone usage text is correct in `infoPlist`.
- [ ] Run iOS production build:
  - `npm run build:ios --workspace @clb/mobile`
- [ ] Internal device test on TestFlight:
  - [ ] Auth flow
  - [ ] Onboarding level routing
  - [ ] Lesson engine
  - [ ] Recording + speaking AI check

## 6. Android Build Readiness
- [ ] Confirm Android package name is final.
- [ ] Confirm permissions in `app.json` are intentional and minimal.
- [ ] Run Android production build:
  - `npm run build:android --workspace @clb/mobile`
- [ ] Internal test track checks:
  - [ ] Auth flow
  - [ ] Onboarding routing
  - [ ] Lesson flow + retries
  - [ ] Recording + speaking AI check

## 7. Product Behavior Gates (Must Pass)
- [ ] Onboarding:
  - [ ] Runs once for new users
  - [ ] Skips for returning users
  - [ ] `determineStartingRoute` routes correctly by selected level
- [ ] Navigation:
  - [ ] Tabs visible and stable
  - [ ] Practice tab opens Practice hub first
- [ ] Lessons:
  - [ ] No blocking step where user cannot continue on correct answer
  - [ ] Retry drill generates targeted variation instead of repeating exact item
- [ ] Focus timer:
  - [ ] Does not block lesson content
  - [ ] Break flow appears at completion

## 8. Quality And Stability Gates
- [ ] Type checks pass:
  - `npm run check:mobile`
  - `npm run check:backend`
- [ ] Lint and tests pass:
  - `npm run lint --workspace @clb/mobile`
  - `npm run test --workspace @clb/mobile -- --watchAll=false --passWithNoTests`
- [ ] Full stability gate passes:
  - `npm run check:stability`

## 9. Legal And Store Content
- [ ] Privacy Policy is final and accessible in Profile.
- [ ] Contact and support details are correct.
- [ ] Subscription messaging aligns with actual billing implementation.
- [ ] App Store / Play Store listing copy prepared:
  - [ ] Short description
  - [ ] Full description
  - [ ] Screenshots
  - [ ] App icon
  - [ ] Privacy URL

## 10. Release Execution Order
1. Freeze features.
2. Run stability gates.
3. Build and validate web deployment.
4. Build iOS and Android production binaries.
5. Perform final smoke tests on all platforms.
6. Submit to TestFlight and Play internal testing.
7. Fix blocking issues only.
8. Submit for public release.

