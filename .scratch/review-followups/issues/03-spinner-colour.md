# Loading spinners are nearly invisible on the dark background

Status: ready-for-agent

## Problem

`ActivityIndicator color="#0000ff"` in `app/(tabs)/index.tsx` and `app/(tabs)/search.tsx` is dark blue on the dark `bg-primary` background.

## Acceptance

Both spinners use the app's accent colour (the search icon already uses `#ab8bff`; prefer the Tailwind theme value if one exists in `tailwind.config.js`).

Source: code review finding #9.
