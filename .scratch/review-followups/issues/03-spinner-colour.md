# Loading spinners are nearly invisible on the dark background

Status: done

## Problem

`ActivityIndicator color="#0000ff"` in `app/(tabs)/index.tsx` and `app/(tabs)/search.tsx` is dark blue on the dark `bg-primary` background.

## Acceptance

Both spinners use the app's accent colour (the search icon already uses `#ab8bff`; prefer the Tailwind theme value if one exists in `tailwind.config.js`).

Source: code review finding #9.

## Comments

Theme colours moved to `constants/colors.js`, which `tailwind.config.js` now requires, so class names and props share one source. Spinners take `color={colors.accent}` as a prop: NativeWind's `text-*` mapping works on native but react-native-web ignores it, falling back to `#1976D2`. The movie-details spinner and the SearchBar icon tint moved to the same constant.
