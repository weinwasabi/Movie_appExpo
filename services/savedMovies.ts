// a Member's Saved list: one document per (Member, movie), readable only by that Member

import { Permission, Query, Role } from "react-native-appwrite";
import { DATABASE_ID, databases as database, isAppwriteCode } from "./appwriteClient";
import { documentIdFor } from "./documentId";
import { posterUrl } from "./posterUrl";

const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SAVED_COLLECTION_ID!;

// documents per request when listing; without a limit Appwrite returns only its default of 25
const PAGE_SIZE = 100;

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
    $id: string;
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

const toSavedMovie = (document: SavedMovieDocument): SavedMovie => ({
    movieId: document.movie_id,
    title: document.title,
    posterUrl: document.poster_url,
    releaseYear: document.release_year,
    rating: document.rating,
    savedAt: document.$createdAt,
});

const byMember = (memberId: string) => Query.equal("member_id", memberId);

// where a Member's Saved Movie of this movie lives, whether or not it exists
const savedMovieAddress = (memberId: string, movieId: number) => ({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID,
    documentId: savedMovieId(memberId, movieId),
});

export const isMovieSaved = async (memberId: string, movieId: number) => {
    try {
        await database.getDocument(savedMovieAddress(memberId, movieId));
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
            ...savedMovieAddress(memberId, movie.id),
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
        await database.deleteDocument(savedMovieAddress(memberId, movieId));
    } catch (err) {
        // already not saved
        if (!isAppwriteCode(err, 404)) throw err;
    }
};

export const listSavedMovies = async (memberId: string): Promise<SavedMovie[]> => {
    const documents: SavedMovieDocument[] = [];
    // page by cursor, so a long Saved list isn't cut off at Appwrite's page size
    for (let cursor: string | undefined; ; ) {
        const page = await database.listDocuments({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            queries: [
                byMember(memberId),
                Query.orderDesc("$createdAt"),
                Query.limit(PAGE_SIZE),
                ...(cursor ? [Query.cursorAfter(cursor)] : []),
            ],
        });
        const pageDocuments = page.documents as unknown as SavedMovieDocument[];
        documents.push(...pageDocuments);
        if (pageDocuments.length < PAGE_SIZE) break;
        cursor = pageDocuments[pageDocuments.length - 1].$id;
    }
    return documents.map(toSavedMovie);
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
