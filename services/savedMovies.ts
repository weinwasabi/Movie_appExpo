// a Member's Saved list: one document per (Member, movie), readable only by that Member

import { AppwriteException, Databases, Permission, Query, Role } from "react-native-appwrite";
import { client } from "./appwriteClient";
import { documentIdFor } from "./documentId";
import { posterUrl } from "./posterUrl";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SAVED_COLLECTION_ID!;

const database = new Databases(client);

// A snapshot taken at save time, so the Saved list shows without asking TMDB about each movie
export type SavedMovie = {
    movieId: number;
    title: string;
    posterUrl: string | null;
    releaseYear: number | null;
    rating: number;
    savedAt: string;
};

type SavedMovieDocument = {
    movie_id: number;
    title: string;
    poster_url: string | null;
    release_year: number | null;
    rating: number;
    $createdAt: string;
};

// The same id for the same Member and movie, so a double tap or two devices saving at once
// collide on one document instead of creating two
const savedMovieId = (memberId: string, movieId: number) => documentIdFor("saved", `${memberId}:${movieId}`);

const isAppwriteCode = (err: unknown, code: number) => err instanceof AppwriteException && err.code === code;

const toSavedMovie = (document: SavedMovieDocument): SavedMovie => ({
    movieId: document.movie_id,
    title: document.title,
    posterUrl: document.poster_url,
    releaseYear: document.release_year,
    rating: document.rating,
    savedAt: document.$createdAt,
});

const byMember = (memberId: string) => Query.equal("member_id", memberId);

export const isMovieSaved = async (memberId: string, movieId: number) => {
    try {
        await database.getDocument({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            documentId: savedMovieId(memberId, movieId),
        });
        return true;
    } catch (err) {
        if (isAppwriteCode(err, 404)) return false;
        throw err;
    }
};

export const saveMovie = async (memberId: string, movie: MovieDetails) => {
    const owner = Role.user(memberId);
    try {
        await database.createDocument({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            documentId: savedMovieId(memberId, movie.id),
            data: {
                member_id: memberId,
                movie_id: movie.id,
                title: movie.title,
                poster_url: movie.poster_path ? posterUrl(movie.poster_path) : null,
                release_year: parseInt(movie.release_date, 10) || null,
                rating: movie.vote_average,
            },
            permissions: [Permission.read(owner), Permission.update(owner), Permission.delete(owner)],
        });
    } catch (err) {
        // already saved: by an earlier tap, or another device
        if (!isAppwriteCode(err, 409)) throw err;
    }
};

export const unsaveMovie = async (memberId: string, movieId: number) => {
    try {
        await database.deleteDocument({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            documentId: savedMovieId(memberId, movieId),
        });
    } catch (err) {
        // already not saved
        if (!isAppwriteCode(err, 404)) throw err;
    }
};

export const listSavedMovies = async (memberId: string): Promise<SavedMovie[]> => {
    const result = await database.listDocuments({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        queries: [byMember(memberId), Query.orderDesc("$createdAt")],
    });
    return (result.documents as unknown as SavedMovieDocument[]).map(toSavedMovie);
};

export const countSavedMovies = async (memberId: string) => {
    // total counts every match, however few documents come back
    const result = await database.listDocuments({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        queries: [byMember(memberId), Query.limit(1)],
    });
    return result.total;
};
