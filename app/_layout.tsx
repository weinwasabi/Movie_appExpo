import { Stack } from "expo-router";
import "./globals.css";
import { StatusBar } from "react-native";
import { SessionProvider } from "@/services/session";

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar hidden={true} />

      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="movie/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sign-up"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sign-in"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </SessionProvider>
  );
}
