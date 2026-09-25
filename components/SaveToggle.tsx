import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import colors from "@/constants/colors";
import { useSession } from "@/services/session";
import { isMovieSaved, saveMovie, unsaveMovie } from "@/services/savedMovies";

type BookmarkProps = { memberId: string | null; movie: MovieDetails };

const Bookmark = ({ memberId, movie }: BookmarkProps) => {
  // null until Appwrite has said whether this Member saved the movie; a Guest's stays null
  const [saved, setSaved] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) return;
    let current = true;
    isMovieSaved(memberId, movie.id)
      .then((isSaved) => current && setSaved(isSaved))
      // leave it unknown, and untappable, rather than show a state that may be wrong
      .catch(() => current && setProblem("Couldn't check whether this movie is saved."));
    return () => {
      current = false;
    };
  }, [memberId, movie.id]);

  const toggle = async () => {
    // one change at a time, so a save and an unsave can't reach Appwrite out of order
    if (!memberId || saved === null || pending) return;
    const saving = !saved;
    setSaved(saving);
    setPending(true);
    setProblem(null);
    try {
      await (saving ? saveMovie(memberId, movie) : unsaveMovie(memberId, movie.id));
    } catch {
      setSaved(!saving);
      setProblem(saving ? "Couldn't save this movie. Try again." : "Couldn't remove this movie. Try again.");
    } finally {
      setPending(false);
    }
  };

  const filled = saved === true;

  return (
    <View className="items-end gap-1 shrink-0">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save"
        accessibilityState={{ selected: filled, disabled: saved === null, busy: pending }}
        disabled={saved === null}
        onPress={() => void toggle()}
        hitSlop={8}
        className="p-1"
      >
        <Ionicons name={filled ? "bookmark" : "bookmark-outline"} size={24} color={colors.light[100]} />
      </Pressable>
      {problem && (
        <Text accessibilityRole="alert" className="text-red-400 text-xs text-right max-w-40">
          {problem}
        </Text>
      )}
    </View>
  );
};

// The bookmark in a movie's details header. For a Member it flips the moment it's tapped and
// flips back if Appwrite refuses; for a Guest it shows outlined and does nothing yet.
const SaveToggle = ({ movie }: { movie: MovieDetails }) => {
  const { session } = useSession();
  const memberId = session.status === "member" ? session.member.id : null;
  // keyed, so signing in, out, or as someone else starts from a fresh, unknown saved state
  return <Bookmark key={`${memberId}:${movie.id}`} memberId={memberId} movie={movie} />;
};

export default SaveToggle;
