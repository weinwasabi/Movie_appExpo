import { View, Image, TextInput } from 'react-native'
import { icons } from '@/constants/icons'
import colors from '@/constants/colors'

interface Props {
    placeholder: string;
    onPress?: () => void;
    value?: string;
    onChangeText?: (text: string) => void;
}

const SearchBar = ({ placeholder, onPress, value, onChangeText }: Props) => {
  return (
    <View className="flex-row items-center bg-dark-200 rounded-full px-5 py-4">
        <Image source={ icons.search } className="size-5" resizeMode="contain" tintColor={colors.accent} />
        <TextInput 
                onPress={ onPress }
                placeholder={ placeholder }
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor="#a8b5db"
                className="flex-1 ml-2 text-white"
        /> 
    </View>
  )
}

export default SearchBar;