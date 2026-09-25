// The save a Guest asked for by tapping Save, carried through sign-in or sign-up and finished by
// that movie's Save toggle once they're a Member.
//
// It exists only while it can still be wanted: a form holds it while a submit is on its way,
// drops it if the submit fails or the form is closed first, and otherwise hands it to the movie,
// whose Save toggle takes it. Signing out drops it too, so it's never made for someone else.

import { useEffect, useRef } from "react";
import { Href, useLocalSearchParams } from "expo-router";

let pendingMovieId: number | null = null;

export const dropPendingSave = () => {
    pendingMovieId = null;
};

// true, once, if a save for this movie is waiting; any other movie's pending save is dropped
export const takePendingSave = (movieId: number) => {
    const wanted = pendingMovieId === movieId;
    pendingMovieId = null;
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
            if (movieId !== null) pendingMovieId = movieId;
        },
        drop: dropPendingSave,
        handOff: () => {
            handedOff.current = true;
        },
        movieHref: movieId === null ? null : ({ pathname: "/movie/[id]", params: { id: String(movieId) } } satisfies Href),
        params: movieId === null ? {} : pendingSaveParams(movieId),
    };
};
