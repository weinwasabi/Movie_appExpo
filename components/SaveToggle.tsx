import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import colors from "@/constants/colors";
import { Session, useSession } from "@/services/session";
import { isMovieSaved, saveMovie, unsaveMovie } from "@/services/savedMovies";
import { pendingSaveParams, takePendingSave } from "@/services/pendingSave";

type SaveToggleButtonProps = { session: Session; movie: MovieDetails };

const SaveToggleButton = ({ session, movie }: SaveToggleButtonProps) => {
  const memberId = session.status === "member" ? session.member.id : null;
  // null until Appwrite has said whether this Member saved the movie; a Guest's stays null
  const [saved, setSaved] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // flips the toggle at once, then saves or unsaves in Appwrite, flipping back if it refuses
  const setSavedInAppwrite = async (member: string, saving: boolean) => {
    setSaved(saving);
    setPending(true);
    setProblem(null);
    try {
      await (saving ? saveMovie(member, movie) : unsaveMovie(member, movie.id));
    } catch {
      setSaved(!saving);
      setProblem(saving ? "Couldn't save this movie. Try again." : "Couldn't remove this movie. Try again.");
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    if (!memberId) return;
    let current = true;
    isMovieSaved(memberId, movie.id)
      .then(
        (isSaved) => ({ isSaved }),
        () => null
      )
      .then((check) => {
        if (!current) return;
        // a Guest who tapped Save and has just signed in here; a save that can't be checked
        // isn't made, and isn't kept for later either
        const saveWanted = takePendingSave(movie.id);
        if (!check) {
          // leave it unknown, and untappable, rather than show a state that may be wrong
          setProblem("Couldn't check whether this movie is saved.");
        } else if (saveWanted && !check.isSaved) {
          void setSavedInAppwrite(memberId, true);
        } else {
          setSaved(check.isSaved);
        }
      });
    return () => {
      current = false;
    };
    // setSavedInAppwrite only sets this toggle's state, so a stale copy is as good as a fresh one
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, movie.id]);

  const toggle = () => {
    // a Guest signs in first; the save finishes when sign-in or sign-up returns here
    if (session.status === "guest") {
      router.push({ pathname: "/sign-in", params: pendingSaveParams(movie.id) });
      return;
    }
    // one change at a time, so a save and an unsave can't reach Appwrite out of order
    if (!memberId || saved === null || pending) return;
    void setSavedInAppwrite(memberId, !saved);
  };

  const filled = saved === true;
  // untappable until the app knows who is signed in and, for a Member, whether the movie is saved
  const waiting = session.status === "loading" || (session.status === "member" && saved === null);

  return (
    <View className="items-end gap-1 shrink-0">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save"
        accessibilityState={{ selected: filled, disabled: waiting, busy: pending }}
        disabled={waiting}
        onPress={toggle}
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

// The Save toggle in a movie's details header, drawn as a bookmark icon. For a Member it flips
// the moment it's tapped and flips back if Appwrite refuses; for a Guest it shows outlined and
// opens sign-in, and the movie is saved once they come back signed in.
const SaveToggle = ({ movie }: { movie: MovieDetails }) => {
  const { session } = useSession();
  const who = session.status === "member" ? session.member.id : session.status;
  // keyed, so signing in, out, or as someone else starts from a fresh, unknown saved state
  return <SaveToggleButton key={`${who}:${movie.id}`} session={session} movie={movie} />;
};

export default SaveToggle;
