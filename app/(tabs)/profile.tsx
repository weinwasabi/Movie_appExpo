import { useCallback } from "react";
import { icons } from "@/constants/icons";
import colors from "@/constants/colors";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import SignInPrompt from "@/components/SignInPrompt";
import { Member, useSession } from "@/services/session";
import { countSavedMovies } from "@/services/savedMovies";
import useFocusFetch from "@/services/useFocusFetch";

const savedCountLabel = (count: number) => `${count} saved ${count === 1 ? "movie" : "movies"}`;

const MemberProfile = ({ member, onSignOut }: { member: Member; onSignOut: () => void }) => {
  // on every visit, so saves and removals made elsewhere in the app are counted
  const { data: savedCount } = useFocusFetch(useCallback(() => countSavedMovies(member.id), [member.id]));

  return (
    <View className="flex justify-center items-center flex-1 flex-col gap-5">
      <View className="size-20 rounded-full bg-dark-100 items-center justify-center">
        <Text className="text-light-100 font-bold text-3xl">{(member.name || member.email).charAt(0).toUpperCase()}</Text>
      </View>
      <View className="items-center gap-1">
        {member.name ? <Text className="text-white font-bold text-xl">{member.name}</Text> : null}
        <Text className="text-light-200 text-sm">{member.email}</Text>
      </View>
      {savedCount !== null && <Text className="text-light-100 text-base">{savedCountLabel(savedCount)}</Text>}
      <Button label="Sign out" look="secondary" onPress={onSignOut} />
    </View>
  );
};

const Profile = () => {
  const { session, signOut } = useSession();

  return (
    <SafeAreaView className="bg-primary flex-1 px-10">
      {session.status === "loading" ? (
        <ActivityIndicator testID="profile-loading" size="large" color={colors.accent} className="flex-1 self-center" />
      ) : session.status === "member" ? (
        <MemberProfile key={session.member.id} member={session.member} onSignOut={signOut} />
      ) : (
        <SignInPrompt icon={icons.person} message="Sign in to save movies and find them here later." />
      )}
    </SafeAreaView>
  );
};

export default Profile;
