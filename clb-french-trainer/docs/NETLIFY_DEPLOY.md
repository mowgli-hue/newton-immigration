# Netlify Deploy (Franco Web)

## Build settings (if using Netlify UI)
- Base directory: `apps/mobile`
- Build command: `npm run build:web:netlify`
- Publish directory: `apps/mobile/dist`
- Node version: `20`

## Environment variables (Netlify site settings)
Add the same public vars used in local `.env`:
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

## Notes
- SPA routing fallback is configured via:
  - `apps/mobile/public/_redirects`
  - `netlify.toml`
- Run locally before deploy:
  - `cd apps/mobile`
  - `npm run build:web:netlify`
