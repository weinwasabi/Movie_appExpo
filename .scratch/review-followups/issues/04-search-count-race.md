# Search counts lose increments under concurrent searches

Status: ready-for-human

## Problem

`updateSearchCount` in `services/appwrite.ts` reads the document, then writes `count + 1`. Two users searching the same term at once both read N and both write N+1: one search is lost. A term's first two concurrent searches can also create two documents.

## Why human

Needs an Appwrite-side choice: a server Function doing the increment, Appwrite's atomic increment API if the project's SDK/server version supports it, or a unique index on `searchTerm` plus retry. Check the Appwrite version in use before choosing.

Source: code review, out-of-diff finding.

## Comments

**Decision (2026-09-23):** the server reports Appwrite 2.2.0 (`/health/version`), and SDK 0.19 has `incrementDocumentAttribute`, so the choice is code-only with no console change:

- An existing term's row is incremented server-side (atomic), not read-then-write.
- A term's first row gets a document id derived from the term (`term_` + FNV-1a 64-bit hex). Concurrent first searches then collide with a 409 instead of creating duplicates.
- On a 409, the term is re-queried and whichever row holds it is incremented. This covers a concurrent create, a legacy random-id row, and a unique-index clash.
- `services/appwrite.ts` now uses the SDK's object-parameter calls throughout. Covered by `services/appwrite.test.ts`, which mocks the SDK.

**Remaining (human): check live, since the unit tests mock Appwrite:**
1. Search a new term twice. You should get one row with id `term_…` and `count` 2.
2. The collection grants the app's role **read**, **create** and **update**. Increment needs update, and the 409 fallback needs read.
3. `count` is a numeric attribute with no max that rejects +1.

**Decision update (2026-09-25): the unique `searchTerm` index is now part of the fix.** The code-only fix above still stands, and the app handles the index's 409 the same way it handles a term-derived id clash. The index is the backstop against duplicates the code can't stop: legacy random-id rows, or a client older than this fix. Existing collections got it after issue 05's merge. New setups get it from `scripts/setup-wizard.sh` stage 6. This updates the "no console change" line above: the fix doesn't *need* the index, but every environment should have one.
