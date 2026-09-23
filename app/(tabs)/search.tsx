import { View, Text, Image, FlatList, ActivityIndicator } from 'react-native'
import { images } from '@/constants/images'
import MovieCard from '@/components/MovieCard'
import useMovieSearch from '@/services/useMovieSearch'
import { movieSearchAdapters } from '@/services/movieSearchAdapters'
import { icons } from '@/constants/icons'
import SearchBar from '@/components/SearchBar'
import { useState } from 'react'

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { movies, resultsFor, status, error } = useMovieSearch(searchQuery, movieSearchAdapters)

  return (
    <View className="flex-1 bg-primary">
        <Image source ={images.bg} className="flex-1 absolute w-full z-0" resizeMode="cover"/>

        <FlatList 
        data={movies} 
        renderItem= {({ item }) => <MovieCard {...item} />} 
        keyExtractor={(item) => item.id.toString()}
        className="px-5"
        numColumns={3}
        columnWrapperStyle={{
          justifyContent: 'center',
          gap: 16,
          marginVertical: 16
        }}
        
          contentContainerStyle = {{ paddingBottom: 100 }}
          //put everything you put intop
          ListHeaderComponent={
            <>
                <View className="w-full flex-row justify-center mt-20 items-center">
                    <Image source={icons.logo} className=" w-12 h-10" />
                </View>
                <View className="my-5">
                      <SearchBar
                          placeholder=" Search for a movie" 
                          value = {searchQuery}
                          onChangeText={setSearchQuery}
                      
                      />
                </View>

                {status === 'loading' && ( 
                  <ActivityIndicator size="large" color="#0000ff" className="my-3"/>
                )}

                {status === 'error' && (
                  <Text className="text-red-500 px-5 my-3">
                        Error: {error?.message}
                  </Text>
                )}

                {
                  status === 'success' && movies.length > 0 && (
                  <Text className="text-xl text-white font-bold">
                      Search Result for {' '}
                      <Text className="text-accent">{resultsFor}</Text>
                  </Text>
                )}

                

    
            </>
          }
          ListEmptyComponent= {
            status === 'idle' || status === 'success' ? (
                <View className="mt-10 px-5">
                    <Text className="text-center text-gray-500">
                        {status === 'success' ? 'No Movies Found' : 'Search for a Movie'}
                    </Text>
                </View>
            ) : null
          }
        />
    </View>
  )
}

export default Search