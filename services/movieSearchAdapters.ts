import { fetchMovies } from "@/services/api";
import { updateSearchCount } from "@/services/appwrite";
import { MovieSearchAdapters } from "@/services/useMovieSearch";

// production adapters: TMDB for results, Appwrite for search counts
export const movieSearchAdapters: MovieSearchAdapters = {
    searchMovies: (query) => fetchMovies({ query }),
    recordSearch: updateSearchCount,
};
