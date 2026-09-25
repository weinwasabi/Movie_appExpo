import React from 'react'
import { PosterCard } from '@/components/MovieCard'
import type { SavedMovie } from '@/services/savedMovies'

// A Saved Movie in the Saved tab's grid, drawn from its snapshot rather than from TMDB
const SavedCard = ({ movie, onLongPress }: { movie: SavedMovie; onLongPress: () => void }) => (
  <PosterCard
    id={movie.movieId}
    title={movie.title}
    poster={movie.posterUrl}
    rating={movie.rating}
    year={movie.releaseYear}
    onLongPress={onLongPress}
  />
)

export default SavedCard
