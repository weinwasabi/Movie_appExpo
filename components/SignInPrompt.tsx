import { Image, ImageSourcePropType, Text, View } from "react-native";
import { router } from "expo-router";
import Button from "@/components/Button";

// What a Guest sees on a tab that needs a Member: why, and the way to become one
const SignInPrompt = ({ icon, message }: { icon: ImageSourcePropType; message: string }) => (
  <View className="flex justify-center items-center flex-1 flex-col gap-5">
    <Image source={icon} className="size-10" tintColor="#fff" />
    <Text className="text-white text-base text-center">{message}</Text>
    <Button label="Create account" onPress={() => router.push("/sign-up")} />
    <Button label="Sign in" look="secondary" onPress={() => router.push("/sign-in")} />
  </View>
);

export default SignInPrompt;
