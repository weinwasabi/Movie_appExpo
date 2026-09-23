import { act, renderHook } from "@testing-library/react-native";
import useMovieSearch, { MovieSearchAdapters } from "@/services/useMovieSearch";

const movie = (id: number, title: string) => ({ id, title }) as Movie;

const fakeCatalog = (results: Record<string, Movie[]>) =>
    jest.fn(async (query: string) => results[query] ?? []);

const fakeAdapters = (overrides: Partial<MovieSearchAdapters> = {}): MovieSearchAdapters => ({
    searchMovies: fakeCatalog({}),
    recordSearch: jest.fn(async () => {}),
    ...overrides,
});

// "du" answers only when resolveSlow/rejectSlow is called; every other query answers at once
const slowThenFast = (fast: Movie[]) => {
    let resolveSlow!: (movies: Movie[]) => void;
    let rejectSlow!: (error: Error) => void;
    const searchMovies = jest.fn((query: string) =>
        query === "du"
            ? new Promise<Movie[]>((resolve, reject) => {
                  resolveSlow = resolve;
                  rejectSlow = reject;
              })
            : Promise.resolve(fast)
    );
    return {
        searchMovies,
        resolveSlow: (movies: Movie[]) => act(async () => resolveSlow(movies)),
        rejectSlow: (error: Error) => act(async () => rejectSlow(error)),
    };
};

const renderSearch = (query: string, adapters: MovieSearchAdapters) =>
    renderHook(({ query }: { query: string }) => useMovieSearch(query, adapters), {
        initialProps: { query },
    });

// advance fake time and let pending promises settle
const settle = async (ms = 500) => {
    await act(async () => {
        jest.advanceTimersByTime(ms);
    });
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

test("returns matching movies once the user stops typing", async () => {
    const adapters = fakeAdapters({ searchMovies: fakeCatalog({ dune: [movie(1, "Dune")] }) });

    const { result } = await renderSearch("dune", adapters);
    await settle();

    expect(result.current.status).toBe("success");
    expect(result.current.movies).toEqual([movie(1, "Dune")]);
    expect(result.current.resultsFor).toBe("dune");
});

test("waits for the user to stop typing before searching", async () => {
    const adapters = fakeAdapters();

    const { result } = await renderSearch("dune", adapters);
    await settle(499);

    expect(adapters.searchMovies).not.toHaveBeenCalled();
    expect(result.current.status).toBe("loading");
});

test("stays idle and never searches for a blank query", async () => {
    const adapters = fakeAdapters();

    const { result } = await renderSearch("   ", adapters);
    await settle();

    expect(result.current.status).toBe("idle");
    expect(result.current.movies).toEqual([]);
    expect(adapters.searchMovies).not.toHaveBeenCalled();
});

test("ignores surrounding whitespace in the query", async () => {
    const adapters = fakeAdapters({ searchMovies: fakeCatalog({ dune: [movie(1, "Dune")] }) });

    const { result, rerender } = await renderSearch(" dune", adapters);
    await settle();
    await rerender({ query: "dune " });
    await settle();

    expect(adapters.searchMovies).toHaveBeenCalledTimes(1);
    expect(adapters.searchMovies).toHaveBeenCalledWith("dune");
    expect(adapters.recordSearch).toHaveBeenCalledWith("dune", movie(1, "Dune"));
    expect(result.current.resultsFor).toBe("dune");
});

test("ignores a slow response for a query the user has already moved past", async () => {
    const catalog = slowThenFast([movie(1, "Dune")]);
    const adapters = fakeAdapters({ searchMovies: catalog.searchMovies });

    const { result, rerender } = await renderSearch("du", adapters);
    await settle();
    await rerender({ query: "dune" });
    await settle();
    await catalog.resolveSlow([movie(2, "Duck Soup")]);

    expect(result.current.movies).toEqual([movie(1, "Dune")]);
    expect(result.current.status).toBe("success");
    expect(result.current.resultsFor).toBe("dune");
});

test("ignores a slow failure for a query the user has already moved past", async () => {
    const catalog = slowThenFast([movie(1, "Dune")]);
    const adapters = fakeAdapters({ searchMovies: catalog.searchMovies });

    const { result, rerender } = await renderSearch("du", adapters);
    await settle();
    await rerender({ query: "dune" });
    await settle();
    await catalog.rejectSlow(new Error("timeout"));

    expect(result.current.status).toBe("success");
    expect(result.current.error).toBeNull();
    expect(result.current.movies).toEqual([movie(1, "Dune")]);
});

test("stays cleared when a search finishes after the user empties the box", async () => {
    const catalog = slowThenFast([]);
    const adapters = fakeAdapters({ searchMovies: catalog.searchMovies });

    const { result, rerender } = await renderSearch("du", adapters);
    await settle();
    await rerender({ query: "" });
    await catalog.resolveSlow([movie(2, "Duck Soup")]);

    expect(result.current.status).toBe("idle");
    expect(result.current.movies).toEqual([]);
    expect(adapters.recordSearch).not.toHaveBeenCalled();
});

test("records the search against the query that produced the results", async () => {
    const catalog = slowThenFast([movie(1, "Dune"), movie(3, "Dune: Part Two")]);
    const adapters = fakeAdapters({ searchMovies: catalog.searchMovies });

    const { rerender } = await renderSearch("du", adapters);
    await settle();
    await rerender({ query: "dune" });
    await settle();
    await catalog.resolveSlow([movie(2, "Duck Soup")]);

    expect(adapters.recordSearch).toHaveBeenCalledTimes(1);
    expect(adapters.recordSearch).toHaveBeenCalledWith("dune", movie(1, "Dune"));
});

test("records searches that differ only in case as the same term", async () => {
    const adapters = fakeAdapters({ searchMovies: fakeCatalog({ Dune: [movie(1, "Dune")] }) });

    const { result } = await renderSearch("Dune", adapters);
    await settle();

    expect(adapters.recordSearch).toHaveBeenCalledWith("dune", movie(1, "Dune"));
    expect(result.current.resultsFor).toBe("Dune");
});

test("does not record a search that found nothing", async () => {
    const adapters = fakeAdapters();

    await renderSearch("zzzz", adapters);
    await settle();

    expect(adapters.recordSearch).not.toHaveBeenCalled();
});

test("reports the error when the catalog fails", async () => {
    const adapters = fakeAdapters({
        searchMovies: jest.fn(async () => {
            throw new Error("Failed to fetch movies");
        }),
    });

    const { result } = await renderSearch("dune", adapters);
    await settle();

    expect(result.current.status).toBe("error");
    expect(result.current.error?.message).toBe("Failed to fetch movies");
    expect(result.current.movies).toEqual([]);
});

test("still shows results when recording the search fails", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const unhandled = jest.fn();
    process.on("unhandledRejection", unhandled);

    try {
        const adapters = fakeAdapters({
            searchMovies: fakeCatalog({ dune: [movie(1, "Dune")] }),
            recordSearch: jest.fn(async () => {
                throw new Error("Appwrite unavailable");
            }),
        });

        const { result } = await renderSearch("dune", adapters);
        await settle();
        // the rejection surfaces on a later macrotask; fake timers don't cover the real setImmediate
        await act(async () => {
            await new Promise(jest.requireActual("timers").setImmediate);
        });

        expect(result.current.status).toBe("success");
        expect(result.current.movies).toEqual([movie(1, "Dune")]);
        expect(unhandled).not.toHaveBeenCalled();
    } finally {
        process.off("unhandledRejection", unhandled);
    }
});
