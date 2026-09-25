import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'
import { icons } from '@/constants/icons';
import { posterUrl } from '@/services/posterUrl';

type PosterCardProps = {
    id: number;
    title: string;
    // a full image URL, or null for the placeholder
    poster: string | null;
    // TMDB's rating out of 10
    rating: number;
    year: number | null;
    onLongPress?: () => void;
};

// One poster in the 3-column movie grid, opening the movie's details page when tapped
export const PosterCard = ({ id, title, poster, rating, year, onLongPress }: PosterCardProps) => {
  return (
    <Link href={`/movie/${id}`} asChild>
        <TouchableOpacity className= "w-[30%]" accessibilityRole="link" onLongPress={onLongPress}>
            <Image
                source = {{
                    uri: poster ?? 'https://placehold.co/600x400/1a1a1a/ffffff.png'
                }}
                className = "w-full h-52 rounded-lg"
                resizeMode = "cover"
            />

            <Text className="text-sm font-bold text-white mt-2" numberOfLines={1}>{title}</Text>
            <View className="flex-row items-center justify-start gap-x-1">
                <Image source={icons.star} className="size-4" />
                <Text className='text-xs text-white font-bold uppercase'>
                    {Math.round(rating / 2)}
                </Text>
            </View>

            <View className="flex-row items-center justify-between">
                <Text className="text-xs text-light-300 font-medium mt-1">
                    {year}
                </Text>
                <Text className="text-xs font-medium text-light-300 uppercase ml-2">Movie</Text>

            </View>
        </TouchableOpacity>
    </Link>
  )
}

const MovieCard = ({ id, poster_path, title, vote_average, release_date}: Movie) => (
    <PosterCard
        id={id}
        title={title}
        poster={poster_path ? posterUrl(poster_path) : null}
        rating={vote_average}
        year={parseInt(release_date, 10) || null}
    />
)

export default MovieCard
