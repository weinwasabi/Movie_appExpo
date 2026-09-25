// The save a Guest asked for by tapping Save, handed from the sign-in or sign-up form back to
// that movie's Save toggle. The form holds it only while a submit is on its way and drops it if
// the submit fails, so backing out never leaves one behind; the toggle takes it once it knows
// whether the new Member already saved the movie.

let pendingMovieId: string | null = null;

export const holdPendingSave = (movieId: string) => {
    pendingMovieId = movieId;
};

export const dropPendingSave = () => {
    pendingMovieId = null;
};

// true, once, if a save for this movie is waiting; any other movie's pending save is dropped
export const takePendingSave = (movieId: number) => {
    const wanted = pendingMovieId === String(movieId);
    pendingMovieId = null;
    return wanted;
};
