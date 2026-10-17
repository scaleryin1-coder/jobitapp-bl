import React, { useState, useEffect } from 'react';
import { LeafletLocationPickerModal } from '../components/common/LeafletLocationPickerModal';

// Baseline coordinates lookup for key service hubs
const CITY_COORDS = {
  'melattur': { lat: 11.0607, lng: 76.2625 },
  'pattikkad': { lat: 11.0267, lng: 76.2081 },
  'pandikkad': { lat: 11.1118, lng: 76.2415 },
  'perinthalmanna': { lat: 10.9760, lng: 76.2254 },
  'manjeri': { lat: 11.1213, lng: 76.1213 },
  'malappuram': { lat: 11.0732, lng: 76.0740 },
  'kozhikode': { lat: 11.2588, lng: 75.7804 },
  'kochi': { lat: 9.9312, lng: 76.2673 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 }
};

export function LocationPickerModal({ isOpen, onClose, currentCity, onSelectLocation }) {
  const getCityCoords = (cityName) => {
    const key = (cityName || '').toLowerCase();
    for (const [cityKey, coords] of Object.entries(CITY_COORDS)) {
      if (key.includes(cityKey)) return coords;
    }
    return { lat: 11.0607, lng: 76.2625 };
  };

  const initialCoords = getCityCoords(currentCity);

  const handleSelectLocation = (data) => {
    const chosenAddress = data.shortAddress || data.areaTitle || data.address || currentCity;
    localStorage.setItem('jobit_user_location', chosenAddress);
    localStorage.setItem('jobit_user_coords', JSON.stringify({ lat: data.lat, lng: data.lng }));
    if (data.plusCode) {
      localStorage.setItem('jobit_user_pluscode', data.plusCode);
    }
    onSelectLocation?.(chosenAddress);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <LeafletLocationPickerModal
      isOpen={isOpen}
      onClose={onClose}
      initialCoordinates={initialCoords}
      initialAddress={currentCity}
      onSelectLocation={handleSelectLocation}
    />
  );
}
