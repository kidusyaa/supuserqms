// hooks/useFavorites.ts
import { useState, useEffect, useCallback } from 'react';

// The key we'll use to store the data in localStorage
const FAVORITES_KEY = 'favoriteServices';

export function useFavorites() {
  // State to hold the array of favorite service IDs
  const [favorites, setFavorites] = useState<string[]>([]);

  // On initial load, read favorites from localStorage
  useEffect(() => {
    try {
      const storedFavorites = window.localStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Failed to read favorites from localStorage', error);
    }
  }, []);

  // Whenever the favorites state changes, write it back to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error)      {
      console.error('Failed to save favorites to localStorage', error);
    }
  }, [favorites]);

  // A function to toggle a service's favorite status
  const toggleFavorite = useCallback((serviceId: string) => {
    setFavorites((prevFavorites) => {
      // Check if the service is already favorited
      if (prevFavorites.includes(serviceId)) {
        // If yes, remove it
        return prevFavorites.filter((id) => id !== serviceId);
      } else {
        // If no, add it
        return [...prevFavorites, serviceId];
      }
    });
  }, []);

  // Return the list of favorites and the function to modify them
  return { favorites, toggleFavorite };
}