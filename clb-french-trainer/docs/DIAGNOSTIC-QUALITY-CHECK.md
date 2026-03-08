# Diagnostic Question Quality Check

## Commands
- `npm run check:diagnostic-quality`
- `npm run check:diagnostic-quality:strict`

## What it checks
- Exactly 4 options per question
- Valid `correctOption` index
- Duplicate/empty options
- Reading questions must include a passage
- Ambiguous option patterns (`all of the above`, `none of the above`)
- Generic prompt wording warnings

## Exit behavior
- Normal mode: fails on errors
- Strict mode: fails on errors + warnings

## Recommended usage
- Run `npm run check:diagnostic-quality:strict` before release or when updating onboarding diagnostics.
