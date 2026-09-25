import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

// placeholder until sign-in is built (.scratch/profile-saved-login/issues/02-sign-in.md)
const SignIn = () => (
  <SafeAreaView className="bg-primary flex-1 px-5">
    <Pressable accessibilityRole="button" onPress={() => router.back()} className="self-start py-3">
      <Text className="text-light-200 text-base">Back</Text>
    </Pressable>
    <View className="flex-1 justify-center items-center">
      <Text className="text-white text-base text-center">Signing in is coming soon.</Text>
    </View>
  </SafeAreaView>
);

export default SignIn;
