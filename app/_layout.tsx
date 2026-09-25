import { Stack } from "expo-router";
import "./globals.css";
import { StatusBar } from "react-native";
import { SessionProvider } from "@/services/session";

// the tabs always sit at the bottom of the stack, so a screen opened by a deep link (a movie, or
// the movie a sign-in returns to) still has somewhere to go back to
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

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
