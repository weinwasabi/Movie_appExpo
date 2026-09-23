// track users searches made

import { AppwriteException, Client, Databases, Query } from "react-native-appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!;

const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)

const database = new Databases(client);

// Document id for a term's first row, derived from the term (FNV-1a 64-bit), so two
// concurrent first searches collide on one id instead of creating duplicate rows.
// Rows created before this keep their random ids; findTermDocument still finds them.
const searchTermDocumentId = (term: string) => {
    let hash = 0xcbf29ce484222325n;
    for (const byte of new TextEncoder().encode(term)) {
        hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n);
    }
    return `term_${hash.toString(16).padStart(16, "0")}`;
};

const findTermDocument = async (term: string) => {
    const result = await database.listDocuments({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        queries: [Query.equal("searchTerm", term)],
    });
    return result.documents[0];
};

// server-side, so concurrent searches can't overwrite each other's increments
const incrementCount = (documentId: string) =>
    database.incrementDocumentAttribute({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        documentId,
        attribute: "count",
        value: 1,
    });

export const updateSearchCount = async (query: string, movie: Movie) => {
    // errors propagate: the caller decides whether a failed count matters
    const existing = await findTermDocument(query);
    if (existing) {
      await incrementCount(existing.$id);
      return;
    }

    try {
      await database.createDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        documentId: searchTermDocumentId(query),
        data: {
          searchTerm: query,
          movie_id: movie.id,
          title: movie.title,
          count: 1,
          poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        },
      });
    } catch (err) {
      if (!(err instanceof AppwriteException && err.code === 409)) throw err;
      // a row for the term appeared since we looked (a concurrent first search, or a unique
      // index clash with an older row): count this search on whichever row holds the term
      const holder = await findTermDocument(query);
      if (!holder) throw err;
      await incrementCount(holder.$id);
    }
  }
  
export const getTrendingMovies =async (): Promise<TrendingMovie[] | undefined> => {
    try {
        const result = await database.listDocuments({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            queries: [Query.limit(5), Query.orderDesc('count')],
        })

        return result.documents as unknown as TrendingMovie[];
    } catch (error) {
        console.log(error);
        return undefined;
    }
} 
        //check if a record of that search has already been stored