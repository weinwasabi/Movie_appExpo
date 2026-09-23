# Search counts lose increments under concurrent searches

Status: ready-for-human

## Problem

`updateSearchCount` in `services/appwrite.ts` reads the document, then writes `count + 1`. Two users searching the same term at once both read N and both write N+1: one search is lost. A term's first two concurrent searches can also create two documents.

## Why human

Needs an Appwrite-side choice: a server Function doing the increment, Appwrite's atomic increment API if the project's SDK/server version supports it, or a unique index on `searchTerm` plus retry. Check the Appwrite version in use before choosing.

Source: code review, out-of-diff finding.
