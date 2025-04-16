import { useState, useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@heroicons/react/24/outline';
import { motion } from "framer-motion";
import { FadeIn } from "./animated-elements";

type MovieData = {
  id: number;
  title: string;
  rating: number;
  imageUrl: string;
  year: number;
  genre: string;
};

const trendingMovies: MovieData[] = [
  {
    id: 1,
    title: "Inception",
    rating: 4.8,
    imageUrl: "/images/inception2.jpg",
    year: 2023,
    genre: "Sci-Fi"
  },
  {
    id: 2,
    title: "The Matrix",
    rating: 4.7,
    imageUrl: "/images/the_matrix.jpg",
    year: 2023,
    genre: "Action"
  },
  {
    id: 3,
    title: "Interstellar",
    rating: 4.9,
    imageUrl: "images/interstellar.jpg",
    year: 2022,
    genre: "Adventure"
  },
  {
    id: 4,
    title: "Dune",
    rating: 4.6,
    imageUrl: "images/dune.jpg",
    year: 2021,
    genre: "Sci-Fi"
  },
  {
    id: 5,
    title: "Blade Runner",
    rating: 4.5,
    imageUrl: "images/blade_runner.jpeg",
    year: 2023,
    genre: "Thriller"
  },
  {
    id: 6,
    title: "Tenet",
    rating: 4.4,
    imageUrl: "images/tenet.jpg",
    year: 2022,
    genre: "Action"
  },
  {
    id: 7,
    title: "The Godfather",
    rating: 4.9,
    imageUrl: "images/the_godfather.jpg",
    year: 2021,
    genre: "Drama"
  },
  {
    id: 8,
    title: "The Dark Knight",
    rating: 4.7,
    imageUrl: "images/the_dark_knight.jpg",
    year: 2022,
    genre: "Action"
  }
];

export function TrendingSection() {
  const [startIndex, setStartIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const itemsToShow = 4; // Number of movies to show at once

  const scrollPrev = () => {
    if (startIndex > 0) {
      setStartIndex(prev => prev - 1);
    }
  };

  const scrollNext = () => {
    if (startIndex < trendingMovies.length - itemsToShow) {
      setStartIndex(prev => prev + 1);
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container px-4 sm:px-6">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Trending Now</h2>
          <p className="text-gray-400 mb-8">Most watched movies and shows this week</p>
        </FadeIn>
        
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <button
            title="previous" 
              onClick={scrollPrev}
              className="p-3 rounded-full bg-stream-black/50 backdrop-blur-sm border border-white/10 text-white hover:bg-stream-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={startIndex === 0}
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <button 
            title="next"
              onClick={scrollNext}
              className="p-3 rounded-full bg-stream-black/50 backdrop-blur-sm border border-white/10 text-white hover:bg-stream-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={startIndex >= trendingMovies.length - itemsToShow}
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div 
            ref={carouselRef}
            className="carousel-container overflow-hidden mx-10"
          >
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${startIndex * (100 / itemsToShow)}%)` }}
            >
              {trendingMovies.map((movie, index) => (
                <motion.div 
                  key={movie.id} 
                  className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 flex-shrink-0 px-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <motion.div 
                    className="relative group overflow-hidden rounded-lg"
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <div className="aspect-[2/3] overflow-hidden rounded-lg">
                      <motion.img 
                        src={movie.imageUrl} 
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                      <h3 className="text-lg font-semibold text-white">{movie.title}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center">
                          <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="ml-1 text-sm text-gray-300">{movie.rating}</span>
                        </div>
                        <div className="text-sm text-gray-400">{movie.year} • {movie.genre}</div>
                      </div>
                    </div>
                    
                    <motion.div 
                      className="absolute inset-0 bg-stream-accent/0"
                      whileHover={{ backgroundColor: "rgba(51, 133, 255, 0.1)" }}
                      transition={{ duration: 0.3 }}
                    ></motion.div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}