# Merge existing mixed-case search rows in Appwrite

Status: ready-for-human

## Problem

Commit ce74b4e started recording search terms lowercased. Rows saved before that (e.g. "Dune" alongside "dune") stay separate and can show the same movie twice in Trending, with a duplicate `movie_id` key warning.

## Steps

In the Appwrite console, for each term with more than one casing: add the counts into the lowercase row, delete the others. New searches will not create more.
