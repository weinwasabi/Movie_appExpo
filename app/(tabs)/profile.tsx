import { icons } from "@/constants/icons";
import colors from "@/constants/colors";
import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Member, useSession } from "@/services/session";

const primaryButton = "w-full bg-accent rounded-lg py-3.5 items-center";
const secondaryButton = "w-full bg-dark-100 rounded-lg py-3.5 items-center";

const GuestProfile = () => (
  <View className="flex justify-center items-center flex-1 flex-col gap-5">
    <Image source={icons.person} className="size-10" tintColor="#fff" />
    <Text className="text-white text-base text-center">
      Sign in to save movies and find them here later.
    </Text>
    <Pressable accessibilityRole="button" onPress={() => router.push("/sign-up")} className={primaryButton}>
      <Text className="text-white font-semibold text-base">Create account</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.push("/sign-in")} className={secondaryButton}>
      <Text className="text-white font-semibold text-base">Sign in</Text>
    </Pressable>
  </View>
);

const MemberProfile = ({ member, onSignOut }: { member: Member; onSignOut: () => void }) => (
  <View className="flex justify-center items-center flex-1 flex-col gap-5">
    <View className="size-20 rounded-full bg-dark-100 items-center justify-center">
      <Text className="text-light-100 font-bold text-3xl">{(member.name || member.email).charAt(0).toUpperCase()}</Text>
    </View>
    <View className="items-center gap-1">
      {member.name ? <Text className="text-white font-bold text-xl">{member.name}</Text> : null}
      <Text className="text-light-200 text-sm">{member.email}</Text>
    </View>
    <Pressable accessibilityRole="button" onPress={onSignOut} className={secondaryButton}>
      <Text className="text-white font-semibold text-base">Sign out</Text>
    </Pressable>
  </View>
);

const Profile = () => {
  const { session, signOut } = useSession();

  return (
    <SafeAreaView className="bg-primary flex-1 px-10">
      {session.status === "loading" ? (
        <ActivityIndicator testID="profile-loading" size="large" color={colors.accent} className="flex-1 self-center" />
      ) : session.status === "member" ? (
        <MemberProfile member={session.member} onSignOut={signOut} />
      ) : (
        <GuestProfile />
      )}
    </SafeAreaView>
  );
};

export default Profile;
