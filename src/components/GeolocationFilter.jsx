import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, Crosshair, SlidersHorizontal, Layers } from 'lucide-react';
import beninCities, { getArrondissements } from '../data/beninCities';

/**
 * GeolocationFilter — Filter control for product/service pages to find items
 * near the user's location.
 *
 * Features:
 * - "Activer la géolocalisation" button using the HTML5 Geolocation API
 * - City/commune dropdown from Benin communes data
 * - Radius slider from 10km to 200km
 * - Toggle to enable/disable proximity filtering
 * - Displays "X produits trouvés près de chez vous" when active
 * - Shows detected city/location name
 * - Handles errors: permission denied, unavailable, timeout
 *
 * Props:
 *   onFilterChange : function({ lat, lng, radius, city, enabled })
 *   resultCount    : number — Number of filtered results to display
 *   className      : string — Additional CSS classes for the container
 */
export default function GeolocationFilter({
  onFilterChange,
  resultCount = 0,
  className = '',
}) {
  // Geolocation state
  const [location, setLocation] = useState(null);
  const [detectedCity, setDetectedCity] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Filter state
  const [enabled, setEnabled] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArrondissement, setSelectedArrondissement] = useState('');
  const [radius, setRadius] = useState(50);

  // Compute available arrondissements for the selected city
  const availableArrondissements = useMemo(
    () => getArrondissements(selectedCity),
    [selectedCity]
  );

  // Sort cities alphabetically for the dropdown
  const sortedCities = useMemo(() => {
    return [...beninCities].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  /**
   * Request the user's current position via the Geolocation API.
   */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });

        // Try to determine the city from coordinates
        // In a real app, this would call a reverse geocoding service.
        // For now, we match to the nearest Benin city by checking if
        // coordinates fall roughly within Benin's bounding box.
        const city = approximateCity(latitude, longitude);
        setDetectedCity(city);
        setSelectedCity(city);

        setIsLocating(false);
        setGeoError(null);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            setGeoError(
              'Vous avez refusé la géolocalisation. Vous pouvez sélectionner une ville manuellement.'
            );
            break;
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            setGeoError(
              'Impossible de déterminer votre position. Veuillez réessayer ou sélectionner une ville.'
            );
            break;
          case GeolocationPositionError.TIMEOUT:
            setGeoError('La demande de localisation a expiré. Veuillez réessayer.');
            break;
          default:
            setGeoError('Une erreur est survenue lors de la géolocalisation.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache position for 5 minutes
      }
    );
  }, []);

  /**
   * Notify parent when filter state changes.
   */
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        radius,
        city: selectedCity,
        arrondissement: selectedArrondissement || null,
        enabled,
      });
    }
  }, [location, radius, selectedCity, selectedArrondissement, enabled, onFilterChange]);

  /**
   * Toggle the filter on/off.
   */
  const handleToggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  /**
   * Handle city selection from dropdown.
   */
  const handleCityChange = useCallback((e) => {
    const city = e.target.value;
    setSelectedCity(city);
    setSelectedArrondissement(''); // reset arrondissement when city changes
  }, []);

  /**
   * Handle arrondissement input change.
   */
  const handleArrondissementChange = useCallback((e) => {
    setSelectedArrondissement(e.target.value);
  }, []);

  /**
   * Handle location detected — try to fill arrondissement
   */

  /**
   * Handle radius slider change.
   */
  const handleRadiusChange = useCallback((e) => {
    setRadius(Number(e.target.value));
  }, []);

  /**
   * Dismiss error message.
   */
  const dismissError = useCallback(() => {
    setGeoError(null);
  }, []);

  // ---------- Render ----------

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-indigo-600 shrink-0" />
          <h3 className="font-semibold text-gray-800 text-sm">Filtre géographique</h3>
        </div>

        {/* Toggle switch */}
        <label className="relative inline-flex items-center cursor-pointer" aria-label="Activer le filtre de proximité">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
        </label>
      </div>

      {!enabled && (
        <p className="text-xs text-gray-400 text-center py-3">
          Activez le filtre pour trouver des produits près de chez vous.
        </p>
      )}

      {/* Enabled state */}
      {enabled && (
        <div className="space-y-4">
          {/* Geolocation button */}
          {!location && (
            <div>
              <button
                type="button"
                onClick={requestLocation}
                disabled={isLocating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
              >
                <Crosshair size={16} className={isLocating ? 'animate-spin' : ''} />
                {isLocating ? 'Localisation en cours...' : "Activer la géolocalisation"}
              </button>

              {geoError && (
                <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
                  <span className="text-xs text-red-700 flex-1">{geoError}</span>
                  <button
                    type="button"
                    onClick={dismissError}
                    className="text-red-400 hover:text-red-600 shrink-0"
                    aria-label="Ignorer"
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-2 my-3">
                <span className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">ou</span>
                <span className="flex-1 h-px bg-gray-200" />
              </div>
            </div>
          )}

          {/* Detected location display */}
          {location && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <Crosshair size={16} className="text-green-600 shrink-0" />
              <div className="text-xs text-green-800">
                {detectedCity ? (
                  <>
                    Localisation détectée : <span className="font-semibold">{detectedCity}</span>
                  </>
                ) : (
                  'Localisation détectée'
                )}
                <span className="block text-green-600">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
              </div>
              <button
                type="button"
                onClick={requestLocation}
                disabled={isLocating}
                className="ml-auto p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors shrink-0"
                aria-label="Rafraîchir la localisation"
              >
                <Crosshair size={14} className={isLocating ? 'animate-spin' : ''} />
              </button>
            </div>
          )}

          {/* City/commune dropdown */}
          <div>
            <label
              htmlFor="city-select"
              className="block text-xs font-medium text-gray-600 mb-1.5"
            >
              Ville / Commune
            </label>
            <select
              id="city-select"
              value={selectedCity}
              onChange={handleCityChange}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all appearance-none cursor-pointer text-gray-900"
              aria-label="Sélectionner une ville"
            >
              <option value="" className="text-gray-500">Toutes les communes</option>
              {sortedCities.map((city) => (
                <option key={city.name} value={city.name} className="text-gray-900">
                  {city.name} ({city.department})
                </option>
              ))}
            </select>
          </div>

          {/* Arrondissement dropdown — every commune has arrondissements */}
          {selectedCity && (
            <div>
              <label
                htmlFor="arrondissement-select"
                className="block text-xs font-medium text-gray-600 mb-1.5"
              >
                <span className="flex items-center gap-1">
                  <Layers size={12} />
                  Arrondissement
                </span>
              </label>
              <select
                id="arrondissement-select"
                value={selectedArrondissement}
                onChange={handleArrondissementChange}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all appearance-none cursor-pointer text-gray-900"
                aria-label="Sélectionner un arrondissement"
              >
                <option value="">Tous les arrondissements</option>
                {availableArrondissements.map((arr) => (
                  <option key={arr} value={arr}>
                    {arr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Radius slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-gray-500" />
                <label htmlFor="radius-slider" className="text-xs font-medium text-gray-600">
                  Rayon de recherche
                </label>
              </div>
              <span className="text-xs font-semibold text-indigo-600">{radius} km</span>
            </div>
            <input
              id="radius-slider"
              type="range"
              min={10}
              max={200}
              step={10}
              value={radius}
              onChange={handleRadiusChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              aria-label={`Rayon : ${radius} kilomètres`}
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>10 km</span>
              <span>200 km</span>
            </div>
          </div>

          {/* Result count */}
          {location && (
            <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-indigo-50 border border-indigo-100">
              <MapPin size={14} className="text-indigo-500" />
              <span className="text-xs font-medium text-indigo-700">
                {resultCount} produit{resultCount !== 1 ? 's' : ''} trouvé{resultCount !== 1 ? 's' : ''} près de chez vous
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Helper ----------

/**
 * approximateCity — Roughly determines a Benin city from coordinates.
 *
 * This is a simplified fallback that checks if the coordinates fall
 * within known approximate bounds for Benin cities. In production,
 * this should be replaced with a proper reverse geocoding service
 * (e.g., OpenStreetMap Nominatim, Google Geocoding API).
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {string} City name or empty string if unknown
 */
function approximateCity(lat, lng) {
  // Check if coordinates are roughly within Benin's borders
  if (lat < 6 || lat > 12.5 || lng < 0.5 || lng > 3.9) {
    return '';
  }

  // Simple bounding-box check for major cities
  const cityBounds = [
    { name: 'Cotonou', minLat: 6.3, maxLat: 6.4, minLng: 2.3, maxLng: 2.5 },
    { name: 'Porto-Novo', minLat: 6.4, maxLat: 6.5, minLng: 2.6, maxLng: 2.7 },
    { name: 'Parakou', minLat: 9.3, maxLat: 9.4, minLng: 2.6, maxLng: 2.7 },
    { name: 'Abomey-Calavi', minLat: 6.4, maxLat: 6.5, minLng: 2.3, maxLng: 2.4 },
    { name: 'Bohicon', minLat: 7.1, maxLat: 7.2, minLng: 2.0, maxLng: 2.1 },
    { name: 'Abomey', minLat: 7.1, maxLat: 7.2, minLng: 1.9, maxLng: 2.0 },
    { name: 'Natitingou', minLat: 10.3, maxLat: 10.4, minLng: 1.3, maxLng: 1.4 },
    { name: 'Djougou', minLat: 9.7, maxLat: 9.8, minLng: 1.6, maxLng: 1.7 },
    { name: 'Lokossa', minLat: 6.6, maxLat: 6.7, minLng: 1.7, maxLng: 1.8 },
    { name: 'Ouidah', minLat: 6.3, maxLat: 6.4, minLng: 2.0, maxLng: 2.1 },
    { name: 'Kandi', minLat: 11.1, maxLat: 11.2, minLng: 2.9, maxLng: 3.0 },
  ];

  for (const city of cityBounds) {
    if (lat >= city.minLat && lat <= city.maxLat && lng >= city.minLng && lng <= city.maxLng) {
      return city.name;
    }
  }

  // General region-based fallback
  if (lat >= 6.2 && lat <= 6.6 && lng >= 2.2 && lng <= 2.8) {
    return 'Cotonou / Porto-Novo';
  }
  if (lat >= 9.2 && lat <= 10.0 && lng >= 1.5 && lng <= 2.8) {
    return 'Nord Bénin';
  }

  return '';
}
