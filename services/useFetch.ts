import { useEffect, useState } from "react"
import { toError } from "@/services/toError"

// starts at "loading" so the first render never looks like an empty result
type Status = "loading" | "success" | "error";

// Runs fetchFunction once on mount; later changes to fetchFunction are ignored.
const useFetch = <T>(fetchFunction: () => Promise<T>) => {
    const [data, setData] = useState<T | null>(null);
    const [status, setStatus] = useState<Status>("loading");
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        fetchFunction()
            .then((result) => {
                setData(result);
                setStatus("success");
            })
            .catch((err) => {
                setError(toError(err));
                setStatus("error");
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass inline functions; fetch once
    }, []);

    return { data, status, error };
}

export default useFetch;
