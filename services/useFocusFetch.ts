import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { toError } from "@/services/toError";

// Loads data every time the screen gains focus, and again on refresh(). Only the newest
// answer is kept: one that arrives after a later load, or after setData, is dropped.
// A failed reload keeps the data already shown and reports the error alongside it.
// Unlike useFetch, it reloads whenever fetchFunction changes: pass a memoised one (useCallback).
const useFocusFetch = <T>(fetchFunction: () => Promise<T>) => {
    const [data, setLoadedData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const latest = useRef(0);

    useEffect(() => () => {
        // unmounted: no answer still on its way may land
        latest.current += 1;
    }, []);

    const load = useCallback(async () => {
        const request = ++latest.current;
        try {
            const result = await fetchFunction();
            if (request !== latest.current) return;
            setLoadedData(result);
            setError(null);
        } catch (err) {
            if (request === latest.current) setError(toError(err));
        }
    }, [fetchFunction]);

    useFocusEffect(
        useCallback(() => {
            void load();
        }, [load])
    );

    const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await load();
        } finally {
            setRefreshing(false);
        }
    }, [load]);

    // a local change the screen already knows about: it wins over any load still on its way
    const setData = useCallback((update: (current: T | null) => T | null) => {
        latest.current += 1;
        setLoadedData(update);
    }, []);

    return { data, error, refreshing, refresh, setData };
};

export default useFocusFetch;
