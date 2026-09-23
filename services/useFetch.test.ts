import { act, renderHook } from "@testing-library/react-native";
import useFetch from "@/services/useFetch";

// resolves or rejects only when told to, so the loading state can be observed
const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {
        fetch: jest.fn(() => promise),
        resolve: (value: T) => act(async () => resolve(value)),
        reject: (error: unknown) => act(async () => reject(error)),
    };
};

test("is loading from the first render, before the fetch answers", async () => {
    const request = deferred<string>();

    const { result } = await renderHook(() => useFetch(request.fetch));

    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBeNull();
    expect(request.fetch).toHaveBeenCalledTimes(1);
});

test("returns the data once the fetch answers", async () => {
    const request = deferred<string>();

    const { result } = await renderHook(() => useFetch(request.fetch));
    await request.resolve("Dune");

    expect(result.current.status).toBe("success");
    expect(result.current.data).toBe("Dune");
    expect(result.current.error).toBeNull();
});

test("reports the error when the fetch fails", async () => {
    const request = deferred<string>();

    const { result } = await renderHook(() => useFetch(request.fetch));
    await request.reject(new Error("Failed to fetch movies"));

    expect(result.current.status).toBe("error");
    expect(result.current.error?.message).toBe("Failed to fetch movies");
    expect(result.current.data).toBeNull();
});

test("fetches once, not on every re-render", async () => {
    const request = deferred<string>();

    const { rerender } = await renderHook(() => useFetch(request.fetch));
    await rerender({});

    expect(request.fetch).toHaveBeenCalledTimes(1);
});
