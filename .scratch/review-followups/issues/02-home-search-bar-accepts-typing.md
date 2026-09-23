# Home search bar should navigate, not accept typing

Status: ready-for-human

## Problem

On Home, `SearchBar` gets only `onPress` (navigate to `/search`), no `value`/`onChangeText`. Tapping can also focus the `TextInput` and open the keyboard; typed text goes nowhere.

## Acceptance

- With no `onChangeText`, `components/SearchBar.tsx` renders a non-editable bar whose whole area triggers `onPress` (e.g. `Pressable` wrapping the input with `pointerEvents="none"`).
- The Search tab's bar still edits normally.
- Verify on a device/simulator: `TextInput` `onPress` behaviour differs between iOS and Android.

Source: code review finding #8.

## Comments

Implemented, with one deviation from the suggested approach. In shortcut mode (`onPress`), `SearchBar` renders a `Pressable` with the placeholder as `Text`, not a `TextInput` with `pointerEvents="none"`. A read-only input on react-native-web stays keyboard-focusable inside the button, and the TextInput press/focus quirks go away when there is no input. Props are now a union, so `onPress` and `onChangeText` cannot be mixed. Covered by `__tests__/search-bar.test.tsx`.

**Remaining (human):** tap the Home bar on iOS and Android. Check that it opens Search, the keyboard stays closed, and the shortcut bar looks the same height as the Search tab bar (Text vs TextInput line height).
