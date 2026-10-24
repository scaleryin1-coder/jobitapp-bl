/**
 * Standalone Worker Utilities and Constants
 * Isolated from React components to avoid Circular Dependencies and Temporal Dead Zone (TDZ) issues.
 */

export const POPULAR_LOCATIONS = [
  'Melattur, Kerala',
  'Perinthalmanna, Kerala',
  'Manjeri, Kerala',
  'Malappuram, Kerala',
  'Kozhikode, Kerala',
  'Kochi, Kerala',
  'Mumbai, Maharashtra'
];

/**
 * Determines whether Driving License is mandatory for the given category.
 * Universally OPTIONAL across Catering Staff and ALL other worker categories
 * so registrations and applications can submit smoothly without being blocked.
 */
export function isDrivingLicenseMandatory(categoryName = '') {
  // Non-mandatory for all roles: KYC documents & driving licenses can be provided during or after registration
  return false;
}

/**
 * Generates direct Google Maps Navigation URL using exact GPS coordinates:
 * https://www.google.com/maps/dir/?api=1&destination=${booking.user_latitude},${booking.user_longitude}&travelmode=driving
 * Strictly avoids address text searching to prevent navigation inaccuracy.
 */
export function getGoogleMapsNavigationUrl(booking) {
  const userLat = booking?.user_latitude ?? booking?.latitude ?? booking?.lat ?? booking?.coordinates?.lat ?? 11.0607;
  const userLng = booking?.user_longitude ?? booking?.longitude ?? booking?.lng ?? booking?.coordinates?.lng ?? 76.2625;
  const latNum = Number(userLat);
  const lngNum = Number(userLng);
  return `https://www.google.com/maps/dir/?api=1&destination=${latNum},${lngNum}&travelmode=driving`;
}
