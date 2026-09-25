// TMDB serves posters from a separate image CDN; w500 is the size every screen uses
export const posterUrl = (posterPath: string) => `https://image.tmdb.org/t/p/w500${posterPath}`;
