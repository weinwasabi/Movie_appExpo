import { AppwriteException, Client, Databases } from "react-native-appwrite";

// one client for the whole app, so Account sessions and Trending share the same connection
export const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;

export const databases = new Databases(client);

// Appwrite reports what went wrong as an HTTP code (409, 404) and a finer-grained type
// ("user_invalid_credentials"); match whichever the caller can rely on
export const isAppwriteCode = (err: unknown, code: number) => err instanceof AppwriteException && err.code === code;

export const isAppwriteType = (err: unknown, type: string) => err instanceof AppwriteException && err.type === type;
