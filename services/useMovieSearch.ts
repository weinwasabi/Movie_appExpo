import { useEffect, useState } from "react";
import { toError } from "@/services/toError";

export interface MovieSearchAdapters {
    searchMovies: (query: string) => Promise<Movie[]>;
    recordSearch: (term: string, topResult: Movie) => Promise<void>;
}

// "loading" covers the debounce wait too, so a typed query never looks like an empty result
type Status = "idle" | "loading" | "success" | "error";

const DEBOUNCE_MS = 500;

// Debounces the query, drops responses superseded by a newer query, and records each
// search that found movies. `resultsFor` is the trimmed query `movies` belong to.
// Pass a stable adapters object (e.g. a module constant): a new object every render
// restarts the search.
const useMovieSearch = (query: string, adapters: MovieSearchAdapters) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [resultsFor, setResultsFor] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<Error | null>(null);

    const term = query.trim();

    useEffect(() => {
        setError(null);

        if (!term) {
            setMovies([]);
            setResultsFor(null);
            setStatus("idle");
            return;
        }

        setStatus("loading");

        // set when a newer query supersedes this one, so a late response can't overwrite it
        let stale = false;

        const timeoutId = setTimeout(async () => {
            let results: Movie[];
            try {
                results = await adapters.searchMovies(term);
            } catch (err) {
                if (stale) return;
                setMovies([]);
                setResultsFor(null);
                setError(toError(err));
                setStatus("error");
                return;
            }

            if (stale) return;
            setMovies(results);
            setResultsFor(term);
            setStatus("success");

            // search counts only feed Trending, so a failure must not break the search itself.
            // Lowercased so "Dune" and "dune" count as one term, not two Trending entries.
            if (results.length > 0) {
                adapters.recordSearch(term.toLowerCase(), results[0]).catch((err) =>
                    console.warn("Failed to record search:", err)
                );
            }
        }, DEBOUNCE_MS);

        return () => {
            stale = true;
            clearTimeout(timeoutId);
        };
    }, [term, adapters]);

    return { movies, resultsFor, status, error };
};

export default useMovieSearch;
