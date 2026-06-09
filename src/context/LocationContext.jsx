import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';

const LocationContext = createContext(null);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORAGE_KEY_CITY = 'boutikonect_selected_city';
const STORAGE_KEY_RADIUS = 'boutikonect_selected_radius';
const DEFAULT_RADIUS = 50; // km

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadString(key, fallback = '') {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function loadNumber(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? Number(val) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch (err) {
    console.error(`Failed to persist location key "${key}":`, err);
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function LocationProvider({ children }) {
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [selectedCity, setSelectedCityState] = useState(() =>
    loadString(STORAGE_KEY_CITY, '')
  );
  const [selectedRadius, setSelectedRadiusState] = useState(() =>
    loadNumber(STORAGE_KEY_RADIUS, DEFAULT_RADIUS)
  );

  const initiatedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Persist city / radius to localStorage
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!initiatedRef.current) {
      initiatedRef.current = true;
      return;
    }
    persist(STORAGE_KEY_CITY, selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    if (!initiatedRef.current) return;
    persist(STORAGE_KEY_RADIUS, selectedRadius);
  }, [selectedRadius]);

  // ---------------------------------------------------------------------------
  // Setters that also write through to localStorage
  // ---------------------------------------------------------------------------
  const setSelectedCity = useCallback((city) => {
    setSelectedCityState(city);
  }, []);

  const setSelectedRadius = useCallback((radiusKm) => {
    const clamped = Math.max(1, Math.min(500, Number(radiusKm) || DEFAULT_RADIUS));
    setSelectedRadiusState(clamped);
  }, []);

  // ---------------------------------------------------------------------------
  // Exposed helper to update browser coords
  // ---------------------------------------------------------------------------
  const updateUserLocation = useCallback(({ latitude, longitude }) => {
    if (latitude != null && longitude != null) {
      setUserLocation({ lat: latitude, lng: longitude });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Value bag
  // ---------------------------------------------------------------------------
  const value = useMemo(
    () => ({
      userLocation,
      selectedCity,
      selectedRadius,
      setSelectedCity,
      setSelectedRadius,
      updateUserLocation,
      hasLocation: !!userLocation,
    }),
    [
      userLocation,
      selectedCity,
      selectedRadius,
      setSelectedCity,
      setSelectedRadius,
      updateUserLocation,
    ]
  );

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider.');
  }
  return context;
}

export default LocationContext;
