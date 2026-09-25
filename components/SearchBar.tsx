import { View, Image, Text, TextInput, Pressable } from 'react-native'
import { icons } from '@/constants/icons'
import colors from '@/constants/colors'

// A shortcut bar (onPress, e.g. Home → Search) or a real input (value + onChangeText), never both
type Props = { placeholder: string } & (
    | { onPress: () => void }
    | { value: string; onChangeText: (text: string) => void }
);

// Shared by both variants so the shortcut and the real input stay the same shape
const barClassName = "flex-row items-center bg-dark-200 rounded-full px-5 py-4";

const SearchBar = (props: Props) => {
  const icon = <Image source={ icons.search } className="size-5" resizeMode="contain" tintColor={colors.accent} />

  // A shortcut renders the placeholder as Text, not a disabled TextInput, so nothing can take
  // focus or open the keyboard: TextInput's press and focus handling differ across iOS, Android and web.
  if ('onPress' in props) {
    return (
      <Pressable
          onPress={ props.onPress }
          accessibilityRole="button"
          accessibilityLabel={ props.placeholder }
          className={ barClassName }
      >
          { icon }
          <Text className="flex-1 ml-2 text-light-200">{ props.placeholder }</Text>
      </Pressable>
    )
  }

  return (
    <View className={ barClassName }>
        { icon }
        <TextInput
                placeholder={ props.placeholder }
                value={ props.value }
                onChangeText={ props.onChangeText }
                placeholderTextColor={ colors.light[200] }
                className="flex-1 ml-2 text-white"
        />
    </View>
  )
}

export default SearchBar;
