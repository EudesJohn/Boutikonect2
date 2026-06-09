// ============================================================
// Haversine Distance Calculation Utilities
// ============================================================

/**
 * Calculate the great-circle distance between two points on Earth
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1 (decimal degrees)
 * @param {number} lng1 - Longitude of point 1 (decimal degrees)
 * @param {number} lat2 - Latitude of point 2 (decimal degrees)
 * @param {number} lng2 - Longitude of point 2 (decimal degrees)
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  // Validate inputs
  if (
    lat1 == null ||
    lng1 == null ||
    lat2 == null ||
    lng2 == null ||
    isNaN(lat1) ||
    isNaN(lng1) ||
    isNaN(lat2) ||
    isNaN(lng2)
  ) {
    console.warn('haversineDistance: invalid coordinates provided', {
      lat1,
      lng1,
      lat2,
      lng2,
    });
    return Infinity;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;

  const R = 6371; // Earth's mean radius in kilometers

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  // Round to 2 decimal places
  return Math.round(distance * 100) / 100;
}

/**
 * Calculate the distance between two points in meters (more precise than
 * the kilometer-based haversine for short distances).
 *
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  return haversineDistance(lat1, lng1, lat2, lng2) * 1000;
}

/**
 * Estimate the delivery fee based on distance.
 * Uses a base fee plus per-km rate.
 *
 * @param {number} distanceKm - Distance in kilometers
 * @param {object} options - Fee calculation options
 * @param {number} options.baseFee - Base delivery fee (default: 500 XOF)
 * @param {number} options.perKmRate - Rate per kilometer (default: 100 XOF/km)
 * @param {number} options.maxFee - Maximum fee cap (default: 10000 XOF)
 * @param {number} options.freeDeliveryKm - Distance within which delivery is free (default: 0)
 * @returns {number} Delivery fee in XOF
 */
export function estimateDeliveryFee(distanceKm, options = {}) {
  const {
    baseFee = 500,
    perKmRate = 100,
    maxFee = 10000,
    freeDeliveryKm = 0,
  } = options;

  if (distanceKm <= freeDeliveryKm) {
    return 0;
  }

  const fee = Math.round(baseFee + distanceKm * perKmRate);
  return Math.min(fee, maxFee);
}

/**
 * Format a distance value for display.
 *
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Human-readable distance string
 */
export function formatDistance(distanceKm) {
  if (distanceKm === Infinity || distanceKm == null) {
    return 'Distance inconnue';
  }

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }

  return `${Math.round(distanceKm)} km`;
}

// =====================================================================
// filterByDistance - Filter an array of items with lat/lng coordinates
//                    by distance from a reference point.
// =====================================================================

/**
 * Filter an array of items within a given radius from a reference point,
 * sorted by distance (closest first).
 *
 * Each item in the array should have `latitude` and `longitude` properties
 * (or you can provide a custom coordinate accessor).
 *
 * @param {Array} items - Array of items to filter
 * @param {number} userLat - Reference latitude
 * @param {number} userLng - Reference longitude
 * @param {number} maxDistanceKm - Maximum distance in kilometers (default: 50)
 * @param {object} options
 * @param {string} options.latKey - Key for latitude on each item (default: 'latitude')
 * @param {string} options.lngKey - Key for longitude on each item (default: 'longitude')
 * @param {boolean} options.includeDistance - Whether to add a `_distanceKm` property (default: true)
 * @param {boolean} options.sortByDistance - Whether to sort results by distance (default: true)
 * @returns {Array} Filtered and sorted array, each item optionally decorated with `_distanceKm`
 */
export function filterByDistance(
  items,
  userLat,
  userLng,
  maxDistanceKm = 50,
  options = {}
) {
  const {
    latKey = 'latitude',
    lngKey = 'longitude',
    includeDistance = true,
    sortByDistance = true,
  } = options;

  // Validate inputs
  if (!Array.isArray(items)) {
    console.warn('filterByDistance: items must be an array');
    return [];
  }

  if (userLat == null || userLng == null || isNaN(userLat) || isNaN(userLng)) {
    console.warn('filterByDistance: invalid reference coordinates');
    return [];
  }

  if (maxDistanceKm <= 0) {
    console.warn('filterByDistance: maxDistanceKm must be positive');
    return [];
  }

  // Calculate distance for each item
  const itemsWithDistance = items
    .filter((item) => {
      if (!item) return false;
      const lat = item[latKey];
      const lng = item[lngKey];
      return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
    })
    .map((item) => {
      const distance = haversineDistance(
        userLat,
        userLng,
        item[latKey],
        item[lngKey]
      );
      return {
        ...item,
        ...(includeDistance ? { _distanceKm: distance } : {}),
      };
    })
    .filter((item) => {
      const dist = includeDistance ? item._distanceKm : haversineDistance(userLat, userLng, item[latKey], item[lngKey]);
      return dist <= maxDistanceKm;
    });

  // Sort by distance (closest first)
  if (sortByDistance && includeDistance) {
    itemsWithDistance.sort((a, b) => a._distanceKm - b._distanceKm);
  }

  return itemsWithDistance;
}

/**
 * Simple wrapper to check if a single location is within range.
 *
 * @param {number} itemLat - Item latitude
 * @param {number} itemLng - Item longitude
 * @param {number} userLat - Reference latitude
 * @param {number} userLng - Reference longitude
 * @param {number} maxDistanceKm - Maximum distance in km
 * @returns {boolean} True if within range
 */
export function isWithinRange(itemLat, itemLng, userLat, userLng, maxDistanceKm) {
  const distance = haversineDistance(itemLat, itemLng, userLat, userLng);
  return distance <= maxDistanceKm;
}
