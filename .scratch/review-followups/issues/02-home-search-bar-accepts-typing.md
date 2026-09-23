# Home search bar should navigate, not accept typing

Status: ready-for-agent

## Problem

On Home, `SearchBar` gets only `onPress` (navigate to `/search`), no `value`/`onChangeText`. Tapping can also focus the `TextInput` and open the keyboard; typed text goes nowhere.

## Acceptance

- With no `onChangeText`, `components/SearchBar.tsx` renders a non-editable bar whose whole area triggers `onPress` (e.g. `Pressable` wrapping the input with `pointerEvents="none"`).
- The Search tab's bar still edits normally.
- Verify on a device/simulator: `TextInput` `onPress` behaviour differs between iOS and Android.

Source: code review finding #8.
