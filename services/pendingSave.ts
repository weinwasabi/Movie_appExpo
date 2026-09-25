// The save a Guest asked for by tapping Save, carried through sign-in or sign-up and finished by
// that movie's Save toggle once they're a Member.
//
// It exists only while it can still be wanted: a form holds it while a submit is on its way,
// drops it if the submit fails or the form is closed first, and otherwise hands it to the movie,
// whose Save toggle takes it. Only a handed-off save can be taken, so a sign-in that lands for
// someone else meanwhile (one abandoned earlier) can't take it. Signing out drops it too.

import { useEffect, useRef } from "react";
import { Href, useLocalSearchParams } from "expo-router";

let pending: { movieId: number; handedOff: boolean } | null = null;

export const dropPendingSave = () => {
    pending = null;
};

// true, once, if a save for this movie has been handed off; a handed-off save for any other
// movie is dropped, and one still held by its form is left for that form's own sign-in
export const takePendingSave = (movieId: number) => {
    if (!pending?.handedOff) return false;
    const wanted = pending.movieId === movieId;
    pending = null;
    return wanted;
};

// The route params that carry a Guest's save to the sign-in and sign-up forms
type PendingSaveParams = { saveMovieId?: string };

export const pendingSaveParams = (movieId: number): PendingSaveParams => ({ saveMovieId: String(movieId) });

const movieIdFrom = ({ saveMovieId }: PendingSaveParams) => {
    const movieId = Number(saveMovieId);
    return saveMovieId && Number.isInteger(movieId) ? movieId : null;
};

// A sign-in or sign-up form's part in a Guest's save, from its route params:
// - hold() before submitting, so the save is waiting by the time the movie's toggle looks;
// - drop() if the submit fails; closing the form without handOff() drops it too;
// - handOff() on success, just before leaving for the movie (movieHref, if nothing to go back to);
// - params, to pass the save on when opening the other form.
export const usePendingSave = () => {
    const movieId = movieIdFrom(useLocalSearchParams<PendingSaveParams>());
    const handedOff = useRef(false);

    useEffect(() => {
        handedOff.current = false;
        return () => {
            if (!handedOff.current) dropPendingSave();
        };
    }, []);

    return {
        hold: () => {
            if (movieId !== null) pending = { movieId, handedOff: false };
        },
        drop: dropPendingSave,
        handOff: () => {
            handedOff.current = true;
            if (pending) pending.handedOff = true;
        },
        movieHref: movieId === null ? null : ({ pathname: "/movie/[id]", params: { id: String(movieId) } } satisfies Href),
        params: movieId === null ? {} : pendingSaveParams(movieId),
    };
};
