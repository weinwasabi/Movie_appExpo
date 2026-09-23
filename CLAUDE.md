# Mobile Movie App

Expo Router app (React Native, NativeWind) that browses TMDB movies and ranks Trending searches in Appwrite.

- `npm test` runs Jest (`jest-expo`); `npx tsc --noEmit` type-checks; `npx expo lint` lints.
- API keys come from `.env` as `EXPO_PUBLIC_*` variables. Never commit `.env`.

## Agent skills

### Issue tracker

Local markdown: issues and specs live as files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line on each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
