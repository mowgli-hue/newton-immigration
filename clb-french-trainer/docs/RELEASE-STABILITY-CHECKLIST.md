# Franco App Stability Checklist

## 1) Compile Gate (must pass every time)
- `npm run check:stability`
- `npm run lint` (when lint rules are enabled and stable)

## 2) Core User Flow Gate
- Register new user -> Login -> Onboarding -> Level path opens correctly
- Returning user -> skips onboarding -> lands in main tabs
- Logout -> returns to auth stack reliably

## 3) Learning Flow Gate
- Foundation lesson opens and progresses
- A1 lesson opens from Path and Home
- Retry round works and can complete lesson
- Lesson completion is persisted after app restart

## 4) Practice Tab Gate
- Practice tab opens without render errors
- A1 Teacher Scripts are visible
- AI Teacher Session opens (or shows planned fallback state)

## 5) Audio/Recording Gate (launch-safe)
- Tap pronunciation works for letters and numbers
- Recording starts/stops without crash
- If analysis fails, flow still continues via transcript

## 6) Navigation/State Gate
- No "routes undefined" or max update depth errors
- PathTab, PracticeTab, ProfileTab all reachable
- Resume route persistence restores last valid screen

## 7) Regression Rule
- No merge unless all Gate 1-6 items are green
- Any blocker creates a hotfix item before adding new features

## 8) Current release posture
- Keep pronunciation analysis non-blocking until post-launch hardening
- Continue content/video generation in parallel without touching gating logic
