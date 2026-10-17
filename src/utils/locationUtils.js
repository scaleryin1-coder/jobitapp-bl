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
