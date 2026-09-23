import { useEffect, useState } from "react"
import { toError } from "@/services/toError"

const useFetch = <T>(fetchFunction: () => Promise<T>) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState< Error | null>(null);

    const fetchData = async () =>{
        try {
            setLoading(true);
            setError(null);

            const result = await fetchFunction();

            setData(result);
        } catch (err) {
            setError(toError(err));
        }  finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    return { data, loading, error };
}

export default useFetch;
