import { Client } from "react-native-appwrite";

// one client for the whole app, so Account sessions and Trending share the same connection
export const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);
