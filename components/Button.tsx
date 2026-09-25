import { Pressable, Text } from "react-native";

const looks = {
  primary: "bg-accent",
  secondary: "bg-dark-100",
};

// A full-width button, in the accent colour or the quieter secondary one
const Button = ({ label, onPress, look = "primary" }: { label: string; onPress: () => void; look?: keyof typeof looks }) => (
  <Pressable accessibilityRole="button" onPress={onPress} className={`w-full rounded-lg py-3.5 items-center ${looks[look]}`}>
    <Text className="text-white font-semibold text-base">{label}</Text>
  </Pressable>
);

export default Button;
