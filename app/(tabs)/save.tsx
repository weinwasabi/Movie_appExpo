import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { icons } from "@/constants/icons";
import colors from "@/constants/colors";
import SavedCard from "@/components/SavedCard";
import Button from "@/components/Button";
import SignInPrompt from "@/components/SignInPrompt";
import { useSession } from "@/services/session";
import { listSavedMovies, SavedMovie, unsaveMovie } from "@/services/savedMovies";
import useFocusFetch from "@/services/useFocusFetch";

const Loading = () => (
  <ActivityIndicator testID="saved-loading" size="large" color={colors.accent} className="flex-1 self-center" />
);

const NothingSaved = () => (
  <View className="items-center gap-5 mt-40">
    <Image source={icons.save} className="size-10" tintColor="#fff" />
    <Text className="text-white text-base">No saved movies yet</Text>
    <Button label="Browse movies" onPress={() => router.navigate("/")} />
  </View>
);

type SavedMovieMenuProps = { movie: SavedMovie | null; onRemove: (movie: SavedMovie) => void; onClose: () => void };

// What a long-press on a Saved Movie offers
const SavedMovieMenu = ({ movie, onRemove, onClose }: SavedMovieMenuProps) => (
  <Modal visible={movie !== null} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable accessibilityLabel="Close" onPress={onClose} className="flex-1 justify-end bg-black/60">
      {movie && (
        // claims its own touches, so a tap between the buttons doesn't reach the backdrop and close the menu
        <View onStartShouldSetResponder={() => true} className="bg-dark-200 rounded-t-2xl px-5 pt-5 pb-12 gap-3">
          <Text className="text-white font-bold text-base text-center mb-2" numberOfLines={1}>
            {movie.title}
          </Text>
          <Button label="Remove from Saved" onPress={() => onRemove(movie)} />
          <Button label="Cancel" look="secondary" onPress={onClose} />
        </View>
      )}
    </Pressable>
  </Modal>
);

const SavedList = ({ memberId }: { memberId: string }) => {
  // on every visit, so a movie just saved on its details page is here when the Member comes back
  const { data: movies, error: loadError, refreshing, refresh, setData: setMovies } = useFocusFetch(
    useCallback(() => listSavedMovies(memberId), [memberId])
  );
  const [menuFor, setMenuFor] = useState<SavedMovie | null>(null);
  // movies whose removal is on its way: hidden whatever a reload says, until Appwrite answers
  const [removing, setRemoving] = useState<number[]>([]);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // coming back to the tab, or pulling to refresh, starts afresh
  useFocusEffect(useCallback(() => setRemoveError(null), []));
  const refreshList = () => {
    setRemoveError(null);
    return refresh();
  };

  // gone from the list at once, and back in its place if Appwrite refuses
  const remove = async (movie: SavedMovie) => {
    setMenuFor(null);
    setRemoveError(null);
    setRemoving((ids) => [...ids, movie.movieId]);
    try {
      await unsaveMovie(memberId, movie.movieId);
      setMovies((current) => current && current.filter((saved) => saved.movieId !== movie.movieId));
    } catch {
      setRemoveError(`Couldn't remove ${movie.title}. Try again.`);
    } finally {
      setRemoving((ids) => ids.filter((id) => id !== movie.movieId));
    }
  };

  if (!movies && !loadError) return <Loading />;

  const shown = (movies ?? []).filter((movie) => !removing.includes(movie.movieId));
  const message = removeError ?? (loadError ? "Couldn't load your saved movies. Pull to try again." : null);

  return (
    <>
      <FlatList
        testID="saved-list"
        data={shown}
        refreshing={refreshing}
        onRefresh={refreshList}
        renderItem={({ item }) => <SavedCard movie={item} onLongPress={() => setMenuFor(item)} />}
        keyExtractor={(item) => item.movieId.toString()}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: "flex-start", gap: 20, paddingRight: 5, marginBottom: 10 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <Text className="text-lg text-white font-bold mt-5 mb-3">Saved Movies</Text>
            {message && (
              <Text accessibilityRole="alert" className="text-red-400 text-center mb-3">
                {message}
              </Text>
            )}
          </>
        }
        // a list that failed to load isn't known to be empty
        ListEmptyComponent={loadError ? null : NothingSaved}
      />
      <SavedMovieMenu movie={menuFor} onRemove={(movie) => void remove(movie)} onClose={() => setMenuFor(null)} />
    </>
  );
};

const Saved = () => {
  const { session } = useSession();

  return (
    <SafeAreaView className="bg-primary flex-1 px-5">
      {session.status === "loading" ? (
        <Loading />
      ) : session.status === "member" ? (
        // keyed, so a different Member never sees the last one's list, even for a moment
        <SavedList key={session.member.id} memberId={session.member.id} />
      ) : (
        <SignInPrompt icon={icons.save} message="Sign in to save movies" />
      )}
    </SafeAreaView>
  );
};

export default Saved;
