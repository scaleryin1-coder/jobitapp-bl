// Open Location Code (Plus Code) pure JS encoder and Nominatim Reverse Geocoding Helper

const CODE_ALPHABET = '23456789CFGHJMPQRVWX';
const ENCODING_BASE = CODE_ALPHABET.length; // 20
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;

/**
 * Encodes latitude and longitude into a Google Open Location Code (Plus Code)
 * e.g., "7J2X35G6+7V"
 */
export function encodePlusCode(latitude, longitude, codeLength = 10) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
    return '';
  }

  // Clip latitude between -90 and 90, normalize longitude between -180 and 180
  let lat = Math.min(Math.max(latitude, -LATITUDE_MAX), LATITUDE_MAX);
  let lng = longitude;
  while (lng < -LONGITUDE_MAX) lng += 360;
  while (lng >= LONGITUDE_MAX) lng -= 360;

  // Latitude 90 is adjusted slightly down so it fits in the range
  if (lat === 90) {
    lat = lat - 0.0000001;
  }

  lat += LATITUDE_MAX;
  lng += LONGITUDE_MAX;

  let code = '';
  let latVal = lat;
  let lngVal = lng;

  // Grid step sizes for up to 10 characters (pairs of 2)
  const steps = [20, 1, 0.05, 0.0025, 0.000125];

  for (let i = 0; i < 5; i++) {
    const step = steps[i];
    const latDigit = Math.min(19, Math.max(0, Math.floor(latVal / step)));
    const lngDigit = Math.min(19, Math.max(0, Math.floor(lngVal / step)));

    code += CODE_ALPHABET[latDigit] + CODE_ALPHABET[lngDigit];

    latVal -= latDigit * step;
    lngVal -= lngDigit * step;

    if (code.length === 8) {
      code += '+';
    }
  }

  return code.slice(0, codeLength > 8 ? codeLength + 1 : codeLength);
}

/**
 * Reverse geocode latitude/longitude using OpenStreetMap Nominatim API
 * Returns structured address, area name, formatted string, and plus code
 */
export async function reverseGeocodeNominatim(lat, lng) {
  const plusCode = encodePlusCode(lat, lng);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'JobitAppLocationPicker/2.1'
        }
      }
    );

    if (!res.ok) {
      return {
        success: false,
        lat,
        lng,
        plusCode,
        areaTitle: `Location at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
        fullAddress: `GPS: ${lat.toFixed(5)}°, ${lng.toFixed(5)}°`,
        shortAddress: `GPS Pin (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
        pincode: '',
        city: '',
        state: ''
      };
    }

    const data = await res.json();
    const addr = data.address || {};

    // Specific area / road / building name
    const buildingOrAmenity = addr.amenity || addr.building || addr.shop || addr.office || addr.leisure || '';
    const houseOrFlat = addr.house_name || addr.house_number || '';
    const road = addr.road || addr.street || addr.residential || addr.neighbourhood || addr.suburb || '';
    const locality = addr.suburb || addr.village || addr.hamlet || addr.town || addr.city_district || addr.city || '';
    const city = addr.city || addr.town || addr.county || addr.state_district || '';
    const state = addr.state || '';
    const pincode = addr.postcode || '';

    // Primary place title for high clarity
    let areaTitle = buildingOrAmenity || road || locality || city || 'Pinned Location';
    if (houseOrFlat && road) {
      areaTitle = `${houseOrFlat}, ${road}`;
    }

    // Build clean readable address
    const components = [
      buildingOrAmenity,
      houseOrFlat,
      road,
      locality,
      city,
      pincode ? `PIN: ${pincode}` : '',
      state
    ].filter(Boolean);

    // Deduplicate consecutive or identical segments
    const uniqueParts = [];
    components.forEach(part => {
      if (!uniqueParts.some(p => p.toLowerCase() === part.toLowerCase())) {
        uniqueParts.push(part);
      }
    });

    const fullAddress = uniqueParts.join(', ') || data.display_name || `GPS: ${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;
    const shortAddress = [areaTitle, locality && locality !== areaTitle ? locality : city].filter(Boolean).join(', ') || areaTitle;

    return {
      success: true,
      lat,
      lng,
      plusCode,
      areaTitle,
      shortAddress,
      fullAddress,
      road,
      locality,
      city,
      state,
      pincode,
      rawAddress: addr
    };
  } catch (err) {
    return {
      success: false,
      lat,
      lng,
      plusCode,
      areaTitle: `Pin (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
      fullAddress: `Coordinates: ${lat.toFixed(5)}°, ${lng.toFixed(5)}°`,
      shortAddress: `Pin at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
      pincode: '',
      city: '',
      state: ''
    };
  }
}

/**
 * Baseline coordinates lookup for key service hubs
 */
export const CITY_COORDS = {
  'melattur': { lat: 11.0607, lng: 76.2625 },
  'pattikkad': { lat: 11.0267, lng: 76.2081 },
  'pandikkad': { lat: 11.1118, lng: 76.2415 },
  'perinthalmanna': { lat: 10.9760, lng: 76.2254 },
  'manjeri': { lat: 11.1213, lng: 76.1213 },
  'malappuram': { lat: 11.0732, lng: 76.0740 },
  'kozhikode': { lat: 11.2588, lng: 75.7804 },
  'kochi': { lat: 9.9312, lng: 76.2673 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'palakkad': { lat: 10.7867, lng: 76.6548 },
  'thrissur': { lat: 10.5276, lng: 76.2144 }
};

/**
 * Calculate great-circle distance between two GPS coordinates using the Haversine Formula.
 * Returns direct distance in kilometers (rounded to 2 decimal places) or null if inputs are invalid.
 * 
 * Formula:
 * a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
 * c = 2 * atan2(√a, √(1−a))
 * d = R * c
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (
    lat1 === undefined || lat1 === null || lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null || lon2 === undefined || lon2 === null ||
    isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)
  ) {
    return null;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's mean radius in kilometers

  const dLat = toRad(nLat2 - nLat1);
  const dLon = toRad(nLon2 - nLon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(nLat1)) * Math.cos(toRad(nLat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Number(distance.toFixed(2));
}

/**
 * Resolves coordinates for a worker from their GPS fields, address, or city.
 */
export function getWorkerCoordinates(worker) {
  if (!worker) return null;
  const lat = worker.latitude ?? worker.lat ?? worker.user_latitude ?? worker.coordinates?.lat;
  const lng = worker.longitude ?? worker.lng ?? worker.user_longitude ?? worker.coordinates?.lng;

  if (
    lat !== undefined && lat !== null && !isNaN(Number(lat)) && Number(lat) !== 0 &&
    lng !== undefined && lng !== null && !isNaN(Number(lng)) && Number(lng) !== 0
  ) {
    return { lat: Number(Number(lat).toFixed(6)), lng: Number(Number(lng).toFixed(6)) };
  }

  // Lookup in city coordinates table
  const locName = String(worker.city || worker.address || worker.serviceArea || worker.service_area || '').toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (locName.includes(key)) {
      return coords;
    }
  }

  // Default baseline coordinates (Melattur, Kerala)
  return { lat: 11.0607, lng: 76.2625 };
}
