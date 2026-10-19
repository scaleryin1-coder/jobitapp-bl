import { db, storage, isFirebaseConfigured } from '../firebase';
import { supabase, isSupabaseConfigured } from '../supabase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initialWorkers, initialServices, initialCategories, initialDailyGigs, initialPortfolios } from './seedData';
import { ALL_MAIN_CATEGORIES, isPortfolioCategory } from './categoriesData';
import { compressImage } from '../utils/imageUtils';
import { calculateHaversineDistanceKm, getWorkerCoordinates, CITY_COORDS } from '../utils/locationUtils';

export { calculateHaversineDistanceKm, getWorkerCoordinates, CITY_COORDS };

const STORAGE_KEY_BOOKINGS = 'jobit_bookings';
const STORAGE_KEY_WORKERS = 'jobit_workers';
const STORAGE_KEY_PENDING_WORKERS = 'jobit_pending_workers';
const STORAGE_KEY_CUSTOMERS = 'jobit_customers';
const STORAGE_KEY_SERVICES = 'jobit_services';
const STORAGE_KEY_CATEGORIES = 'jobit_categories';
const STORAGE_KEY_DAILY_GIGS = 'jobit_daily_gigs';
const STORAGE_KEY_WORKER_PORTFOLIOS = 'jobit_worker_portfolios';

const EVENT_BOOKINGS_CHANGED = 'jobit_bookings_changed';
const EVENT_WORKERS_CHANGED = 'jobit_workers_changed';
const EVENT_PENDING_WORKERS_CHANGED = 'jobit_pending_workers_changed';
const EVENT_CUSTOMERS_CHANGED = 'jobit_customers_changed';
const EVENT_SERVICES_CHANGED = 'jobit_services_changed';
const EVENT_CATEGORIES_CHANGED = 'jobit_categories_changed';
const EVENT_DAILY_GIGS_CHANGED = 'jobit_daily_gigs_changed';
const EVENT_PORTFOLIOS_CHANGED = 'jobit_portfolios_changed';

export const DUMMY_WORKER_IDS = new Set([
  'worker_rajesh',
  'worker_amit',
  'worker_sunita',
  'worker_vikram',
  'worker_musthafa_pattikkad',
  'worker_shameer_pattikkad',
  'worker_deepak_pandikkad',
  'worker_ramesh',
  'worker_zara',
  'worker_fatima',
  'worker_ananya',
  'worker_manoj',
  'worker_karthik',
  'worker_suresh',
  'app_worker_anil',
  'app_worker_fathima',
  'app_worker_zaf',
  'app_worker_kabeer_pattikkad'
]);

export const ROLLOUT_LOCATIONS = [
  'Melattur, Kerala',
  'Pattikkad, Kerala',
  'Pandikkad, Kerala'
];

export function normalizeLocation(loc) {
  if (!loc) return '';
  // Extract primary town/city name without state or pincode
  const primary = String(loc).split(',')[0].trim().toLowerCase();
  return primary.replace(/[^a-z0-9]/g, '');
}

export function isLocationInRollout(loc) {
  if (!loc) return true;
  const raw = String(loc).toLowerCase().trim();
  const norm = normalizeLocation(loc);
  return (
    raw.includes('melattur') ||
    raw.includes('pattikkad') ||
    raw.includes('pandikkad') ||
    raw.includes('malappuram') ||
    raw.includes('kerala') ||
    raw.includes('perinthalmanna') ||
    raw.includes('manjeri') ||
    raw.includes('kozhikode') ||
    raw.includes('calicut') ||
    raw.includes('palakkad') ||
    raw.includes('kochi') ||
    ['melattur', 'pattikkad', 'pandikkad', 'malappuram', 'kerala'].includes(norm)
  );
}

/**
 * Check if a worker's registered service area covers the user's location
 */
export function doesWorkerCoverLocation(worker, location) {
  if (!worker) return false;
  if (!location) return true;
  
  const targetNorm = normalizeLocation(location);
  const targetRaw = String(location).toLowerCase().trim();
  if (!targetNorm) return true;

  const candidateAreas = [
    worker.service_area,
    worker.serviceArea,
    worker.city,
    worker.address,
    ...(Array.isArray(worker.service_areas) ? worker.service_areas : []),
    ...(Array.isArray(worker.serviceAreas) ? worker.serviceAreas : [])
  ].filter(Boolean);

  if (candidateAreas.length === 0) return false;

  return candidateAreas.some(area => {
    const aNorm = normalizeLocation(area);
    const aRaw = String(area).toLowerCase().trim();
    return (
      aNorm === targetNorm ||
      aNorm.includes(targetNorm) ||
      targetNorm.includes(aNorm) ||
      aRaw.includes(targetRaw) ||
      targetRaw.includes(aRaw)
    );
  });
}

/**
 * Check if a worker's skills/categories match the requested category
 */
export function doesWorkerMatchCategory(worker, category) {
  if (!worker || !category) return false;
  
  const catName = (typeof category === 'string' 
    ? category 
    : (category?.name || category?.title || category?.categoryName || '')).toLowerCase().trim();
  
  const catId = (typeof category === 'object' 
    ? (category?.id || category?.categoryId || '') 
    : '').toLowerCase().trim();

  const workerSkills = [
    worker.category,
    worker.categoryName,
    worker.skill,
    worker.categoryId,
    ...(Array.isArray(worker.skills) ? worker.skills : []),
    ...(Array.isArray(worker.categories) ? worker.categories : []),
    ...(Array.isArray(worker.subSkills) ? worker.subSkills : [])
  ].filter(Boolean).map(s => String(s).toLowerCase().trim());

  if (workerSkills.length === 0) return false;

  // Direct match
  if (catId && workerSkills.some(s => s === catId || s.includes(catId) || catId.includes(s))) {
    return true;
  }
  if (catName && workerSkills.some(s => s === catName || s.includes(catName) || catName.includes(s))) {
    return true;
  }

  // Canonical trade domain patterns
  const tradeMatchers = [
    { key: 'ac', test: (s) => s.includes('ac') || s.includes('air condition') || s.includes('hvac') || s.includes('cooling') },
    { key: 'plumb', test: (s) => s.includes('plumb') || s.includes('pipe') || s.includes('leak') || s.includes('drain') },
    { key: 'elect', test: (s) => s.includes('elect') || s.includes('wiring') },
    { key: 'coconut', test: (s) => s.includes('coconut') || s.includes('tree') || s.includes('palm') || s.includes('തെങ്ങ്') },
    { key: 'paint', test: (s) => s.includes('paint') || s.includes('whitewash') || s.includes('wall') },
    { key: 'carp', test: (s) => s.includes('carp') || s.includes('wood') || s.includes('furniture') },
    { key: 'clean', test: (s) => s.includes('clean') || s.includes('sanit') || s.includes('housekeep') },
    { key: 'beauty', test: (s) => s.includes('beauty') || s.includes('salon') || s.includes('makeup') || s.includes('spa') },
    { key: 'mehndi', test: (s) => s.includes('mehndi') || s.includes('henna') },
    { key: 'driver', test: (s) => s.includes('driver') || s.includes('chauffeur') },
    { key: 'car', test: (s) => s.includes('car') || s.includes('auto') || s.includes('mechanic') },
    { key: 'bike', test: (s) => s.includes('bike') || s.includes('motorcycle') || s.includes('scooter') || s.includes('two wheeler') },
    { key: 'garden', test: (s) => s.includes('garden') || s.includes('lawn') || s.includes('landscape') },
    { key: 'pest', test: (s) => s.includes('pest') || s.includes('termite') || s.includes('fumigation') },
    { key: 'construct', test: (s) => s.includes('construct') || s.includes('mason') || s.includes('civil') },
    { key: 'weld', test: (s) => s.includes('weld') || s.includes('fabricat') || s.includes('iron work') },
    { key: 'alumin', test: (s) => s.includes('alumin') || s.includes('glass work') || s.includes('window') },
    { key: 'moving', test: (s) => s.includes('mov') || s.includes('shift') || s.includes('packer') || s.includes('labour') },
    { key: 'secur', test: (s) => s.includes('secur') || s.includes('cctv') || s.includes('camera') || s.includes('smart home') },
    { key: 'electron', test: (s) => s.includes('electron') || s.includes('tv') || s.includes('appliance') },
    { key: 'laund', test: (s) => s.includes('laund') || s.includes('iron') || s.includes('dry clean') },
    { key: 'support', test: (s) => s.includes('support') || s.includes('elder') || s.includes('domestic') || s.includes('home help') },
    { key: 'tank', test: (s) => s.includes('tank') || s.includes('water tank') || s.includes('sump') }
  ];

  for (const m of tradeMatchers) {
    if (m.test(catName) || (catId && m.test(catId))) {
      if (workerSkills.some(s => m.test(s))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Mask telephone number for privacy in Customer and Worker panels
 */
export function maskPhoneNumber(phone) {
  if (!phone) return 'Protected • In-App Call Only';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 6) return 'Protected • In-App Call Only';
  return `+91 ${clean.slice(0, 2)}••• ••${clean.slice(-2)} (In-App Only)`;
}

/**
 * Find all genuine Admin-approved workers registered and available for a specific category in an area
 */
export function getWorkersForCategoryInLocation(category, location, workersList) {
  const workers = (Array.isArray(workersList) && workersList.length > 0) ? workersList : getLocalWorkers();
  const effectiveLoc = location || localStorage.getItem('jobit_user_location') || 'Melattur, Kerala';

  return (workers || []).filter((w) => {
    if (!w || !w.id) return false;

    // Disregard any mock/dummy IDs
    if (DUMMY_WORKER_IDS.has(w.id)) return false;

    // 1. Must be genuine worker approved by Admin:
    // status === 'approved' OR is_approved === true OR workerStatus === 'approved'
    const isApproved = w.is_approved === true || w.status === 'approved' || w.workerStatus === 'approved';
    if (!isApproved) return false;

    // 2. Must be active/available for work
    if (w.isAvailable === false || w.isOnline === false) return false;

    // 3. Must cover this service area / location
    if (!doesWorkerCoverLocation(w, effectiveLoc)) return false;

    // 4. Must match this trade / service category
    if (!doesWorkerMatchCategory(w, category)) return false;

    return true;
  });
}

/**
 * Check if category is available in a location strictly based on real worker registrations.
 * A category in an area is active ONLY IF at least one Admin-approved worker is available.
 * If 0 approved workers exist for that trade in that area, it returns false (triggers "Coming Soon").
 */
export function isCategoryAvailableInLocation(category, location, workersList) {
  if (!category) return false;
  const availableWorkers = getWorkersForCategoryInLocation(category, location, workersList);
  return availableWorkers.length > 0;
}

/**
 * Dynamic Radius Availability Check (Swiggy / Zomato style):
 * When a customer selects or drags the map pin to a location (Lat/Lng),
 * calculate the distance to all online workers providing that selected service category using the Haversine formula.
 * Check if there is at least ONE active worker whose individual service radius covers the customer's selected location (i.e., Calculated Distance <= Worker Radius).
 */
export function checkServiceAvailabilityByRadius({
  category,
  service,
  coordinates,
  workersList
} = {}) {
  const targetCategory = category || service?.categoryName || service?.title || service;
  // If no category specified, return available (e.g. general city picker without category filter)
  if (!targetCategory) {
    return {
      isAvailable: true,
      hasCategory: false,
      matchingWorkers: [],
      minDistanceKm: null
    };
  }

  const rawLat = coordinates?.lat ?? coordinates?.latitude ?? coordinates?.user_latitude;
  const rawLng = coordinates?.lng ?? coordinates?.longitude ?? coordinates?.user_longitude;
  const lat = Number(rawLat);
  const lng = Number(rawLng);

  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    return {
      isAvailable: false,
      hasCategory: true,
      matchingWorkers: [],
      minDistanceKm: null,
      reason: 'invalid_coordinates'
    };
  }

  const allWorkers = (Array.isArray(workersList) && workersList.length > 0)
    ? workersList
    : getLocalWorkers();

  // If a specific worker was pre-selected (portfolio trade), check that worker
  const preselectedWorkerId = service?.workerId;

  const matchingWorkers = [];
  let minDistanceKm = Infinity;

  for (const worker of allWorkers) {
    if (!worker || !worker.id) continue;
    if (DUMMY_WORKER_IDS.has(worker.id)) continue;

    // 1. Must be Admin-approved worker
    const isApproved = worker.is_approved === true || worker.status === 'approved' || worker.workerStatus === 'approved';
    if (!isApproved) continue;

    // 2. Must be online and active (not offline on duty)
    if (worker.isOnline === false || worker.isAvailable === false) continue;

    // 3. Preselected worker check if applicable
    if (preselectedWorkerId && worker.id !== preselectedWorkerId) continue;

    // 4. Must provide the selected service category
    if (!doesWorkerMatchCategory(worker, targetCategory)) continue;

    // 5. Worker GPS coordinates
    const workerCoords = getWorkerCoordinates(worker);
    if (!workerCoords || workerCoords.lat === undefined || workerCoords.lng === undefined) continue;

    // 6. Worker's individual service radius (defaults to 15 KM if not explicitly configured)
    const workerRadiusKm = Math.max(1, Number(worker.serviceRadius || worker.radius || worker.coverageRadius || 15));

    // 7. Calculate direct Haversine distance
    const distanceKm = calculateHaversineDistanceKm(lat, lng, Number(workerCoords.lat), Number(workerCoords.lng));
    if (distanceKm === null) continue;

    // 8. Distance check: Calculated Distance <= Worker Radius
    if (distanceKm <= workerRadiusKm) {
      matchingWorkers.push({
        worker,
        distanceKm,
        radiusKm: workerRadiusKm
      });
      if (distanceKm < minDistanceKm) {
        minDistanceKm = distanceKm;
      }
    }
  }

  const isAvailable = matchingWorkers.length > 0;

  return {
    isAvailable,
    hasCategory: true,
    matchingWorkers,
    matchingCount: matchingWorkers.length,
    minDistanceKm: Number.isFinite(minDistanceKm) ? minDistanceKm : null
  };
}

// Safe Database call wrapper with timeout so Firebase offline/delay never hangs the UI
export const safeDbPromise = (promise, timeoutMs = 2500) => {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs))
  ]).catch((err) => {
    console.warn('Database safe operation notice', err);
    return null;
  });
};

/**
 * Standard Billing & Pricing Calculation Utility
 * 
 * 1. Customer View:
 *    - Total Service Charge (or Total Work Fee): Merged transparent charge
 *    - Advance Paid (Inspection Fee): -₹99
 *    - Remaining Amount Due: ₹551
 *    - ZERO mention of Platform Fee or commissions.
 * 
 * 2. Backend / Worker / Admin View:
 *    - Worker Charge (Worker's Share): ₹500
 *    - Platform Fee (JOBit Share): ₹150
 *    - Total Collected from Customer: ₹650
 *    - Advance Deduction: -₹99
 *    - Balance Payable by Customer: ₹551
 */
export function calculateJobBilling({ serviceCharge = 300, sparePrice = 0 } = {}) {
  const labor = Math.max(0, Number(serviceCharge) || 0);
  const spares = Math.max(0, Number(sparePrice) || 0);

  // 1. Customer Platform Fee = 5% of Service Charge (Labor)
  const customerPlatformFee = Math.round(labor * 0.05 * 100) / 100;

  // 2. Total Customer Payable Amount = Service Charge + Spare Price (if any) + (Service Charge * 0.05)
  const totalCustomerPayable = Math.round((labor + spares + customerPlatformFee) * 100) / 100;

  // 3. Worker Earnings: Deduct 10% from the Service Charge as platform commission
  const workerCommission = Math.round(labor * 0.10 * 100) / 100;
  const workerLaborShare = Math.round(labor * 0.90 * 100) / 100;

  // 4. Worker Final Earning for the job = (Service Charge * 0.90) + Spare Price
  const workerFinalEarning = Math.round((workerLaborShare + spares) * 100) / 100;

  return {
    serviceCharge: labor,
    sparePrice: spares,
    customerPlatformFee,
    totalCustomerPayable,
    totalPayable: totalCustomerPayable,
    workerCommission,
    workerLaborShare,
    workerFinalEarning,
    workerNetEarning: workerFinalEarning,
    workerCharge: workerFinalEarning
  };
}

export function calculateBillingDetails(rawPrice) {
  const num = typeof rawPrice === 'number' ? rawPrice : Number(String(rawPrice || '').replace(/[^0-9.]/g, ''));
  const total = Number.isFinite(num) && num > 0 ? num : 650;
  // Uniform Flat ₹99 advance inspection & service booking fee
  const advancePaid = 99;
  const remainingDue = Math.max(0, total - advancePaid);

  // Internal split calculation:
  // For total === 650: Worker share is exactly 500, Platform fee is exactly 150
  let platformFee = Math.round(total * 0.2308);
  if (total === 650) {
    platformFee = 150;
  }
  const workerCharge = Math.max(0, total - platformFee);

  return {
    totalServiceCharge: total,
    totalWorkFee: total,
    workerCharge, // Worker's share (Net earning)
    platformFee,  // JOBit platform commission share
    advancePaid,  // Inspection Fee advance paid
    remainingDue  // Balance payable by customer on completion
  };
}

// Get local stored items safely
export function getLocalBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    // Filter out dummy sample bookings and invalid items
    return list
      .filter(b => b && typeof b === 'object' && b.id !== 'bk_sample_1' && b.id !== 'bk_sample_2')
      .map(b => {
        const status = b.status || 'pending';
        const rawLat = b.user_latitude ?? b.latitude ?? b.lat ?? b.coordinates?.lat;
        const rawLng = b.user_longitude ?? b.longitude ?? b.lng ?? b.coordinates?.lng;
        const userLat = (rawLat !== undefined && rawLat !== null && !isNaN(Number(rawLat))) ? Number(Number(rawLat).toFixed(6)) : null;
        const userLng = (rawLng !== undefined && rawLng !== null && !isNaN(Number(rawLng))) ? Number(Number(rawLng).toFixed(6)) : null;
        const isGpsVerified = Boolean(userLat !== null && userLng !== null && userLat !== 0 && userLng !== 0);

        return {
          ...b,
          user_latitude: userLat,
          user_longitude: userLng,
          latitude: userLat,
          longitude: userLng,
          lat: userLat,
          lng: userLng,
          coordinates: { lat: userLat, lng: userLng },
          isGpsVerified,
          is_gps_verified: isGpsVerified,
          price: b.price || 99,
          visitingFee: b.visitingFee || 99,
          totalServiceCharge: b.totalServiceCharge || 99,
          totalWorkFee: b.totalWorkFee || 99,
          advancePaid: b.advancePaid || 99,
          remainingDue: b.remainingDue || 0,
          status,
          paymentStatus: b.paymentStatus || 'paid_visiting_fee_99'
        };
      });
  } catch (err) {
    console.warn('Fallback reading local bookings:', err);
    return [];
  }
}

export function saveLocalBookings(bookings) {
  try {
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    window.dispatchEvent(new CustomEvent(EVENT_BOOKINGS_CHANGED, { detail: bookings }));
  } catch (err) {
    console.warn('Failed to save local bookings', err);
  }
}

export function clearAllBookingAndUserData() {
  try {
    // 1. Clear bookings from localStorage & memory
    localStorage.removeItem(STORAGE_KEY_BOOKINGS);
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify([]));
    localStorage.removeItem('jobit_all_declined_jobs');

    // 2. Clear customer notifications
    localStorage.removeItem('jobit_customer_notifications');
    localStorage.setItem('jobit_customer_notifications', JSON.stringify([]));

    // 3. Clear transient selection & active modal states
    localStorage.removeItem('jobit_selected_service');
    localStorage.removeItem('jobit_selected_portfolio_cat');
    localStorage.removeItem('jobit_booking_modal_open');

    // 4. Clear chat caches and worker decline states
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('jobit_chat_') || key.startsWith('jobit_declined_jobs_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}

    // 5. Notify all active subscribers to reset state
    window.dispatchEvent(new CustomEvent(EVENT_BOOKINGS_CHANGED, { detail: [] }));
    window.dispatchEvent(new CustomEvent('jobit_notifications_changed', { detail: [] }));
  } catch (err) {
    console.warn('Failed to clear booking and user data', err);
  }
}

export const clearLocalBookings = clearAllBookingAndUserData;

export function getLocalWorkers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKERS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    // Strictly filter out any hardcoded dummy worker profiles
    const cleanList = list.filter(w => w && w.id && !DUMMY_WORKER_IDS.has(w.id));
    if (cleanList.length !== list.length) {
      localStorage.setItem(STORAGE_KEY_WORKERS, JSON.stringify(cleanList));
    }
    return cleanList;
  } catch {
    return [];
  }
}

export function saveLocalWorkers(workers) {
  try {
    // Ensure no dummy workers are saved
    const cleanList = (workers || []).filter(w => w && w.id && !DUMMY_WORKER_IDS.has(w.id));
    localStorage.setItem(STORAGE_KEY_WORKERS, JSON.stringify(cleanList));
    window.dispatchEvent(new CustomEvent(EVENT_WORKERS_CHANGED, { detail: cleanList }));
  } catch (err) {
    console.warn('Failed to save local workers', err);
  }
}

// Real-time listener for bookings (Supabase & Firestore with local fallback & sync)
export function subscribeBookings(callback) {
  let unsubFirestore = null;
  let supabaseChannel = null;

  const handleLocalChange = () => {
    const activeUser = localStorage.getItem('jobit_user');
    if (!activeUser) {
      callback([]);
      return;
    }
    callback(getLocalBookings());
  };

  window.addEventListener(EVENT_BOOKINGS_CHANGED, handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  // Initial trigger: check if user is logged in
  const activeUser = localStorage.getItem('jobit_user');
  if (!activeUser) {
    callback([]);
    return () => {
      window.removeEventListener(EVENT_BOOKINGS_CHANGED, handleLocalChange);
      window.removeEventListener('storage', handleLocalChange);
    };
  }

  callback(getLocalBookings());

  // Supabase fetch & realtime sync if configured
  if (isSupabaseConfigured && supabase) {
    try {
      supabase
        .from('bookings')
        .select('*')
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const current = getLocalBookings();
            const currentMap = new Map(current.map(b => [b.id, b]));

            let storedDeclined = [];
            try {
              const allStored = JSON.parse(localStorage.getItem('jobit_all_declined_jobs') || '[]');
              if (Array.isArray(allStored)) storedDeclined = allStored;
            } catch {}

            data.forEach(item => {
              const local = currentMap.get(item.id) || {};
              const isLocallyRejected = 
                local.status === 'rejected' || 
                local.rejected === true || 
                item.status === 'rejected' ||
                item.status === 'declined' ||
                storedDeclined.includes(item.id) ||
                storedDeclined.includes(String(item.id)) ||
                (local.id && storedDeclined.includes(local.id)) ||
                (local.supabaseId && storedDeclined.includes(local.supabaseId));

              const effectiveStatus = isLocallyRejected ? 'rejected' : (item.status || local.status || 'pending');

              const rawLat = item.user_latitude ?? item.latitude ?? local.user_latitude ?? local.latitude;
              const rawLng = item.user_longitude ?? item.longitude ?? local.user_longitude ?? local.longitude;
              const userLat = (rawLat !== undefined && rawLat !== null && !isNaN(Number(rawLat))) ? Number(Number(rawLat).toFixed(6)) : null;
              const userLng = (rawLng !== undefined && rawLng !== null && !isNaN(Number(rawLng))) ? Number(Number(rawLng).toFixed(6)) : null;
              const isGpsVerified = Boolean(userLat !== null && userLng !== null && userLat !== 0 && userLng !== 0);

              currentMap.set(item.id, {
                ...local,
                ...item,
                user_latitude: userLat,
                user_longitude: userLng,
                latitude: userLat,
                longitude: userLng,
                lat: userLat,
                lng: userLng,
                coordinates: { lat: userLat, lng: userLng },
                isGpsVerified,
                is_gps_verified: isGpsVerified,
                serviceTitle: item.service_type || item.serviceTitle || local.serviceTitle || 'Home Service',
                categoryName: item.service_type || item.categoryName || local.categoryName || 'Home Service',
                dateTime: item.slot || item.dateTime || local.dateTime || 'Today',
                customerName: item.customer_name || item.customerName || local.customerName || 'Customer',
                workerId: item.assigned_worker_id || item.workerId || local.workerId || null,
                status: effectiveStatus,
                declinedWorkerIds: item.declined_worker_ids || item.declinedWorkerIds || local.declinedWorkerIds || [],
                rejectedWorkerIds: item.rejected_worker_ids || item.rejectedWorkerIds || local.rejectedWorkerIds || [],
                rejectedBy: item.rejected_by || item.rejectedBy || local.rejectedBy
              });
            });

            const merged = Array.from(currentMap.values());
            merged.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
            saveLocalBookings(merged);
            callback(merged);
          }
        })
        .catch(() => {});

      try {
        supabaseChannel = supabase
          .channel('public:bookings_realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
            if (payload.new) {
              const current = getLocalBookings();
              const idx = current.findIndex(b => b.id === payload.new.id);
              
              let storedDeclined = [];
              try {
                const allStored = JSON.parse(localStorage.getItem('jobit_all_declined_jobs') || '[]');
                if (Array.isArray(allStored)) storedDeclined = allStored;
              } catch {}
              
              const isLocallyRejected = 
                payload.new.status === 'rejected' ||
                payload.new.status === 'declined' ||
                (idx >= 0 && (current[idx].status === 'rejected' || current[idx].rejected === true)) || 
                storedDeclined.includes(payload.new.id) ||
                storedDeclined.includes(String(payload.new.id)) ||
                (idx >= 0 && current[idx].id && storedDeclined.includes(current[idx].id)) ||
                (idx >= 0 && current[idx].supabaseId && storedDeclined.includes(current[idx].supabaseId));
              const effectiveStatus = isLocallyRejected ? 'rejected' : (payload.new.status || (idx >= 0 ? current[idx].status : 'pending'));

              const existingItem = idx >= 0 ? current[idx] : {};
              const rawNewLat = payload.new.user_latitude ?? payload.new.latitude ?? existingItem.user_latitude ?? existingItem.latitude;
              const rawNewLng = payload.new.user_longitude ?? payload.new.longitude ?? existingItem.user_longitude ?? existingItem.longitude;
              const newLat = (rawNewLat !== undefined && rawNewLat !== null && !isNaN(Number(rawNewLat))) ? Number(Number(rawNewLat).toFixed(6)) : null;
              const newLng = (rawNewLng !== undefined && rawNewLng !== null && !isNaN(Number(rawNewLng))) ? Number(Number(rawNewLng).toFixed(6)) : null;
              const isNewGpsVerified = Boolean(newLat !== null && newLng !== null && newLat !== 0 && newLng !== 0);

              const updatedItem = {
                ...existingItem,
                ...payload.new,
                user_latitude: newLat,
                user_longitude: newLng,
                latitude: newLat,
                longitude: newLng,
                lat: newLat,
                lng: newLng,
                coordinates: { lat: newLat, lng: newLng },
                isGpsVerified: isNewGpsVerified,
                is_gps_verified: isNewGpsVerified,
                serviceTitle: payload.new.service_type || payload.new.serviceTitle || existingItem.serviceTitle || 'Home Service',
                categoryName: payload.new.service_type || payload.new.categoryName || existingItem.categoryName || 'Home Service',
                dateTime: payload.new.slot || payload.new.dateTime || existingItem.dateTime || 'Today',
                customerName: payload.new.customer_name || payload.new.customerName || existingItem.customerName || 'Customer',
                workerId: payload.new.assigned_worker_id || payload.new.workerId || existingItem.workerId || null,
                status: effectiveStatus,
                declinedWorkerIds: payload.new.declined_worker_ids || payload.new.declinedWorkerIds || existingItem.declinedWorkerIds || [],
                rejectedWorkerIds: payload.new.rejected_worker_ids || payload.new.rejectedWorkerIds || existingItem.rejectedWorkerIds || [],
                rejectedBy: payload.new.rejected_by || payload.new.rejectedBy || existingItem.rejectedBy || null
              };

              let nextList;
              if (idx >= 0) {
                nextList = current.map((b, i) => i === idx ? updatedItem : b);
              } else {
                nextList = [updatedItem, ...current];
              }
              saveLocalBookings(nextList);
              callback(nextList);
            }
          })
          .subscribe();
      } catch {}
    } catch (e) {
      console.warn('Supabase bookings listener fallback', e);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(collection(db, 'bookings'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(b => b.id !== 'bk_sample_1' && b.id !== 'bk_sample_2');
          // Sort by creation time descending
          list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          saveLocalBookings(list);
          callback(list);
        }
      }, () => {
        // Fallback silently to local state when backend is offline
      });
    } catch {}
  }

  return () => {
    window.removeEventListener(EVENT_BOOKINGS_CHANGED, handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
    if (unsubFirestore) unsubFirestore();
    if (supabaseChannel && typeof supabaseChannel.unsubscribe === 'function') {
      supabaseChannel.unsubscribe();
    }
  };
}

// Real-time listener for registered workers
export function subscribeWorkers(callback) {
  let unsubFirestore = null;

  const handleLocalChange = () => {
    callback(getLocalWorkers());
  };

  window.addEventListener(EVENT_WORKERS_CHANGED, handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  // Initial local emit
  callback(getLocalWorkers());

  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(collection(db, 'workers'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(w => w && w.id && !DUMMY_WORKER_IDS.has(w.id));
          saveLocalWorkers(list);
          callback(list);
        } else {
          callback([]);
        }
      }, () => {});
    } catch {}
  }

  return () => {
    window.removeEventListener(EVENT_WORKERS_CHANGED, handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
    if (unsubFirestore) unsubFirestore();
  };
}

/**
 * Proximity Matching Algorithm (Haversine Formula):
 * When a customer creates a booking at Customer_Lat and Customer_Lng,
 * calculate the direct distance to all online workers in that specific service category.
 * Matches and broadcasts the job ONLY to workers where:
 * Calculated_Distance <= Worker_Preferred_Radius (respecting individual worker limits, e.g. 5km for one worker and 10km for another).
 */
export function getMatchingOnlineWorkersForBooking(booking, workersList) {
  if (!booking) return [];
  const workers = (Array.isArray(workersList) && workersList.length > 0) ? workersList : getLocalWorkers();
  const bookingCategory = booking.categoryId || booking.categoryName || booking.serviceTitle || booking.service_type;

  const rawLat = booking.user_latitude ?? booking.latitude ?? booking.lat ?? booking.coordinates?.lat;
  const rawLng = booking.user_longitude ?? booking.longitude ?? booking.lng ?? booking.coordinates?.lng;
  const hasCustCoords = rawLat !== undefined && rawLat !== null && rawLng !== undefined && rawLng !== null &&
    !isNaN(Number(rawLat)) && !isNaN(Number(rawLng)) && Number(rawLat) !== 0;

  const custLat = hasCustCoords ? Number(rawLat) : null;
  const custLng = hasCustCoords ? Number(rawLng) : null;

  return (workers || []).filter((w) => {
    if (!w || !w.id) return false;
    if (DUMMY_WORKER_IDS.has(w.id)) return false;

    // 1. Must be genuine worker approved by Admin
    const isApproved = w.is_approved === true || w.status === 'approved' || w.workerStatus === 'approved';
    if (!isApproved) return false;

    // 2. Must be online and active for work
    if (w.isAvailable === false || w.isOnline === false) return false;

    // 3. Must match this trade / service category
    if (!doesWorkerMatchCategory(w, bookingCategory)) return false;

    // 4. Proximity matching using Haversine formula against Worker's specific preferred radius
    const workerRadiusKm = Math.max(1, Number(w.serviceRadius || w.radius || 15));

    if (custLat !== null && custLng !== null) {
      const workerCoords = getWorkerCoordinates(w);
      if (workerCoords && workerCoords.lat && workerCoords.lng) {
        const distanceKm = calculateHaversineDistanceKm(custLat, custLng, workerCoords.lat, workerCoords.lng);
        if (distanceKm !== null) {
          // Rule: Calculated_Distance <= Worker_Preferred_Radius
          return distanceKm <= workerRadiusKm;
        }
      }
    }

    // Fallback if coordinates missing: textual location coverage check
    return doesWorkerCoverLocation(w, booking.address || booking.city || booking.location);
  });
}

// Customer initiates booking -> Flat ₹99 visiting fee with broadcast dispatch
export async function createBooking(payload) {
  // If payload already specifies a chosen worker (from a portfolio trade), keep it
  const isPreAssigned = Boolean(payload.workerId && payload.workerName);

  // High-accuracy GPS extraction and validation
  const rawLat = payload.user_latitude ?? payload.latitude ?? payload.lat ?? payload.coordinates?.lat;
  const rawLng = payload.user_longitude ?? payload.longitude ?? payload.lng ?? payload.coordinates?.lng;
  const userLat = (rawLat !== undefined && rawLat !== null && !isNaN(Number(rawLat))) ? Number(Number(rawLat).toFixed(6)) : null;
  const userLng = (rawLng !== undefined && rawLng !== null && !isNaN(Number(rawLng))) ? Number(Number(rawLng).toFixed(6)) : null;
  const isGpsVerified = Boolean(userLat !== null && userLng !== null && userLat !== 0 && userLng !== 0);

  const newBooking = {
    id: 'bk_' + Date.now(),
    ...payload,
    // Database schema: exact high accuracy coordinates
    user_latitude: userLat,
    user_longitude: userLng,
    latitude: userLat,
    longitude: userLng,
    lat: userLat,
    lng: userLng,
    coordinates: {
      lat: userLat,
      lng: userLng
    },
    isGpsVerified: isGpsVerified,
    is_gps_verified: isGpsVerified,
    // Status is 'pending' broadcast unless a portfolio-specific specialist was already selected
    status: payload.status || (isPreAssigned ? 'confirmed' : 'pending'),
    createdAt: new Date().toISOString(),
    broadcastedAt: new Date().toISOString(),
    assignedAt: isPreAssigned ? new Date().toISOString() : null,
    workerId: isPreAssigned ? payload.workerId : null,
    workerName: isPreAssigned ? payload.workerName : null,
    workerPhone: isPreAssigned ? payload.workerPhone : '',
    workerAvatar: isPreAssigned ? payload.workerAvatar : '',
    workerTitle: isPreAssigned ? (payload.workerTitle || 'JOBit Verified Specialist') : null,
    price: 99,
    visitingFee: 99,
    totalServiceCharge: 99,
    advancePaid: 99,
    remainingDue: 0,
    paymentStatus: 'paid_visiting_fee_99',
    paymentId: payload.paymentId || ('pay_' + Date.now())
  };

  // Proximity Matching Algorithm (Haversine Formula):
  // Calculate direct distance to all online workers in that specific service category.
  // Match and broadcast the job ONLY to workers where Calculated_Distance <= Worker_Preferred_Radius
  const matchedWorkers = getMatchingOnlineWorkersForBooking(newBooking, getLocalWorkers());
  newBooking.matchedWorkerIds = matchedWorkers.map(w => w.id);
  newBooking.matchedCount = matchedWorkers.length;

  // 1. Immediately update local state & dispatch custom event for instant cross-component sync
  const current = getLocalBookings();
  const updated = [newBooking, ...current];
  saveLocalBookings(updated);

  // 2. Sync to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const isUuid = typeof newBooking.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newBooking.id);
      
      const supabaseRow = {
        customer_name: newBooking.customerName || 'Valued Client',
        phone: newBooking.phone || newBooking.contactPhone || '+91 9876543210',
        address: newBooking.fullAddress || newBooking.address || 'Melattur, Kerala',
        service_type: newBooking.serviceTitle || newBooking.categoryName || 'Home Service',
        slot: newBooking.dateTime || newBooking.timeSlot || 'Today',
        status: newBooking.status || 'pending',
        assigned_worker_id: newBooking.workerId || null,
        user_latitude: userLat,
        user_longitude: userLng
      };

      if (isUuid) {
        supabaseRow.id = newBooking.id;
      }

      const { data: inserted, error: sbErr } = await supabase
        .from('bookings')
        .insert(supabaseRow)
        .select()
        .single();

      if (!sbErr && inserted && inserted.id) {
        newBooking.supabaseId = inserted.id;
        newBooking.id = inserted.id;
        const currentRefreshed = getLocalBookings();
        saveLocalBookings([newBooking, ...currentRefreshed.filter(b => b.id !== newBooking.id)]);
      }
    } catch (e) {
      console.warn('Supabase booking create background fallback', e);
    }
  }

  // 3. Sync to Firestore with a fast timeout safety guarantee so network lag never freezes UI
  if (isFirebaseConfigured && db) {
    try {
      const firestorePromise = setDoc(doc(db, 'bookings', newBooking.id), {
        ...newBooking,
        serverTimestamp: serverTimestamp()
      });
      // Allow up to 1200ms for network, but proceed regardless without blocking
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1200));
      await Promise.race([firestorePromise, timeoutPromise]);
    } catch (e) {
      console.warn('Firestore create booking background fallback', e);
    }
  }

  return newBooking;
}

// Update booking status:
// 'pending' -> 'accepted' -> 'on_the_way' -> 'in_progress' -> 'completed' (or 'cancelled', 'rejected')
export async function updateBookingStatus(bookingId, newStatus, extraUpdates = {}) {
  const current = getLocalBookings();
  const updated = current.map(b => {
    if (b.id === bookingId) {
      return { 
        ...b, 
        status: newStatus,
        lastUpdated: new Date().toISOString(),
        ...extraUpdates 
      };
    }
    return b;
  });
  saveLocalBookings(updated);

  // Sync to Supabase 'bookings' table with exact schema matching
  if (isSupabaseConfigured && supabase) {
    try {
      const isUuid = typeof bookingId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId);
      const target = updated.find(b => b.id === bookingId);
      const targetId = isUuid ? bookingId : (target?.supabaseId || bookingId);

      const supabasePayload = { status: newStatus };
      if (extraUpdates.workerId || extraUpdates.assigned_worker_id) {
        supabasePayload.assigned_worker_id = extraUpdates.workerId || extraUpdates.assigned_worker_id;
      }

      await supabase
        .from('bookings')
        .update(supabasePayload)
        .eq('id', targetId);
    } catch (e) {
      console.warn('Supabase update status fallback', e);
    }
  }

  // Sync to Firestore
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus,
        lastUpdated: new Date().toISOString(),
        ...extraUpdates
      });
    } catch (e) {
      console.warn('Firestore update status fallback', e);
    }
  }
}

// Worker rejects/declines a job - persists in Supabase, Firestore, and local state
export async function rejectJobAsWorker(bookingId, workerId) {
  const current = getLocalBookings();
  
  const updated = current.map(b => {
    if (b.id === bookingId) {
      const existingDeclined = Array.isArray(b.declinedWorkerIds) ? b.declinedWorkerIds : [];
      const updatedDeclined = Array.from(new Set([...existingDeclined, workerId]));

      return {
        ...b,
        status: 'rejected',
        rejected: true,
        rejectedBy: workerId,
        rejectedAt: new Date().toISOString(),
        declinedWorkerIds: updatedDeclined,
        rejectedWorkerIds: updatedDeclined,
        lastUpdated: new Date().toISOString()
      };
    }
    return b;
  });

  saveLocalBookings(updated);

  const targetBooking = updated.find(b => b.id === bookingId || b.supabaseId === bookingId);
  const idsToRecord = [bookingId];
  if (targetBooking?.supabaseId) idsToRecord.push(targetBooking.supabaseId);
  if (targetBooking?.id) idsToRecord.push(targetBooking.id);

  // Also persist to worker's dedicated local storage rejected list and universal list
  try {
    const storageKey = `jobit_declined_jobs_${workerId}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const nextList = Array.from(new Set([...stored, ...idsToRecord]));
    localStorage.setItem(storageKey, JSON.stringify(nextList));

    const universalKey = 'jobit_all_declined_jobs';
    const allStored = JSON.parse(localStorage.getItem(universalKey) || '[]');
    localStorage.setItem(universalKey, JSON.stringify(Array.from(new Set([...allStored, ...idsToRecord]))));
  } catch {}

  // 1. Sync to Supabase 'bookings' table
  if (isSupabaseConfigured && supabase) {
    try {
      const isUuid = typeof bookingId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId);
      const targetId = isUuid ? bookingId : (targetBooking?.supabaseId || bookingId);

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', targetId);

      if (error) {
        console.warn('Supabase reject status error by ID, trying fallback match:', error.message);
        if (targetBooking?.phone) {
          await supabase
            .from('bookings')
            .update({ status: 'rejected' })
            .eq('phone', targetBooking.phone);
        } else if (targetBooking?.customerName && targetBooking?.serviceTitle) {
          await supabase
            .from('bookings')
            .update({ status: 'rejected' })
            .match({
              customer_name: targetBooking.customerName,
              service_type: targetBooking.serviceTitle
            });
        }
      }
    } catch (err) {
      console.warn('Supabase reject update exception:', err);
    }
  }

  // 2. Sync to Firestore
  if (isFirebaseConfigured && db) {
    try {
      const targetBooking = updated.find(b => b.id === bookingId);
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'rejected',
        rejectedBy: workerId,
        rejectedAt: new Date().toISOString(),
        declinedWorkerIds: targetBooking?.declinedWorkerIds || [workerId],
        rejectedWorkerIds: targetBooking?.rejectedWorkerIds || [workerId],
        lastUpdated: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore reject status fallback', e);
    }
  }

  return updated;
}

// Worker accepts an unallocated or broadcasted job
export async function acceptJobAsWorker(bookingId, worker) {
  return updateBookingStatus(bookingId, 'accepted', {
    workerId: worker.id,
    workerName: worker.name,
    workerPhone: worker.phone,
    workerAvatar: worker.avatar,
    acceptedAt: new Date().toISOString()
  });
}

// Admin manually assigns or reassigns a job to a specific worker
export async function adminAssignJob(bookingId, worker) {
  return updateBookingStatus(bookingId, 'accepted', {
    workerId: worker.id,
    workerName: worker.name,
    workerPhone: worker.phone,
    workerAvatar: worker.avatar,
    assignedByAdmin: true,
    acceptedAt: new Date().toISOString()
  });
}

// Toggle Online/Offline duty status for a worker
export async function toggleWorkerDuty(workerId, isOnline) {
  const workers = getLocalWorkers();
  const updated = workers.map(w => w.id === workerId ? { ...w, isOnline } : w);
  saveLocalWorkers(updated);

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'workers', workerId), { isOnline });
    } catch (e) {
      console.warn('Firestore toggle duty fallback', e);
    }
  }
}

/**
 * Update a worker's personal maximum travel / service coverage radius
 * Persists to local storage, Firestore (if configured), and active session.
 */
export async function updateWorkerServiceRadius(workerId, newRadius) {
  if (!workerId) return;
  const radiusStr = String(newRadius || '15');
  const workers = getLocalWorkers();
  const updated = workers.map(w => w.id === workerId ? { ...w, serviceRadius: radiusStr } : w);
  saveLocalWorkers(updated);

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'workers', workerId), { serviceRadius: radiusStr });
    } catch (e) {
      console.warn('Firestore update worker radius fallback', e);
    }
  }

  // Also sync current user session if worker is currently logged in
  try {
    const rawUser = localStorage.getItem('jobit_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed && (parsed.uid === workerId || parsed.workerId === workerId)) {
        parsed.serviceRadius = radiusStr;
        localStorage.setItem('jobit_user', JSON.stringify(parsed));
      }
    }
  } catch {}

  return radiusStr;
}

// ==========================================
// DYNAMIC SERVICES DATA & OPERATIONS
// ==========================================
// DYNAMIC SERVICES DATA & OPERATIONS
// ==========================================

export function getLocalServices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SERVICES);
    let parsed = [];
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {}
    }
    if (!Array.isArray(parsed)) parsed = [];

    // Master map initialized with ALL baseline services (all 24+ services)
    const map = new Map();
    (initialServices || []).forEach(base => {
      map.set(base.id, { ...base });
    });

    // Overlay user / admin modifications from localStorage onto baseline services
    parsed.forEach(serv => {
      if (!serv || !serv.id) return;
      const base = map.get(serv.id) || {};
      const hero = (serv.heroImage || serv.imageUrl || serv.image || base.heroImage || base.imageUrl || '').trim();

      map.set(serv.id, {
        ...base,
        ...serv,
        heroImage: hero,
        imageUrl: hero,
        image: hero,
        price: serv.price !== undefined && serv.price !== null && !isNaN(Number(serv.price)) 
          ? Number(serv.price) 
          : (base.price || 300),
        categoryName: serv.categoryName || base.categoryName || 'General',
        title: serv.title || base.title || 'Home Service'
      });
    });

    const allServices = Array.from(map.values());
    return allServices;
  } catch (err) {
    console.warn('getLocalServices fallback:', err);
    return initialServices || [];
  }
}

export function saveLocalServices(servicesList) {
  try {
    // Master map initialized with ALL baseline services (all 24+ services)
    const map = new Map();
    (initialServices || []).forEach(base => {
      map.set(base.id, { ...base });
    });

    if (Array.isArray(servicesList)) {
      servicesList.forEach(s => {
        if (!s || !s.id) return;
        const base = map.get(s.id) || {};
        const hero = (s.heroImage || s.imageUrl || s.image || base.heroImage || base.imageUrl || '').trim();
        map.set(s.id, {
          ...base,
          ...s,
          heroImage: hero,
          imageUrl: hero,
          image: hero,
          price: s.price !== undefined && s.price !== null && !isNaN(Number(s.price))
            ? Number(s.price)
            : (base.price || 300),
          categoryName: s.categoryName || base.categoryName || 'General',
          title: s.title || base.title || 'Home Service'
        });
      });
    }

    const fullList = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(fullList));
    window.dispatchEvent(new CustomEvent(EVENT_SERVICES_CHANGED, { detail: fullList }));
  } catch (err) {
    console.warn('Failed to save local services', err);
  }
}

export function subscribeServices(callback) {
  let unsubFirestore = () => {};

  const handleLocalChange = () => {
    callback(getLocalServices());
  };

  window.addEventListener(EVENT_SERVICES_CHANGED, handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  // Initial local state push with all 24+ services guaranteed
  callback(getLocalServices());

  // Supabase sync if configured
  if (isSupabaseConfigured && supabase) {
    try {
      supabase
        .from('services')
        .select('*')
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const currentServices = getLocalServices();
            const currentMap = new Map(currentServices.map(s => [s.id, s]));
            data.forEach(item => {
              const id = item.id;
              if (!id) return;
              const existing = currentMap.get(id) || {};
              const img = item.hero_image || item.heroImage || item.image_url || item.imageUrl || existing.heroImage || existing.imageUrl || '';
              currentMap.set(id, {
                ...existing,
                ...item,
                categoryName: item.category_name || item.categoryName || existing.categoryName,
                subCategory: item.sub_category || item.subCategory || existing.subCategory,
                heroImage: img,
                imageUrl: img,
                image: img,
                price: item.price !== undefined && !isNaN(Number(item.price)) ? Number(item.price) : existing.price,
                title: item.title || existing.title
              });
            });
            const merged = Array.from(currentMap.values());
            saveLocalServices(merged);
            callback(merged);
          }
        });
    } catch {}
  }

  // Firestore sync if configured
  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(collection(db, 'services'), (snap) => {
        if (!snap.empty) {
          const remoteDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // CRITICAL FIX: Merge remoteDocs into all 24+ baseline services
          // NEVER wipe out the services list with only Firestore docs!
          const currentServices = getLocalServices();
          const currentMap = new Map(currentServices.map(s => [s.id, s]));
          remoteDocs.forEach(item => {
            const id = item.id;
            if (!id) return;
            const existing = currentMap.get(id) || {};
            const img = item.heroImage || item.imageUrl || item.image || item.hero_image || item.image_url || existing.heroImage || existing.imageUrl || '';
            currentMap.set(id, {
              ...existing,
              ...item,
              heroImage: img,
              imageUrl: img,
              image: img,
              price: item.price !== undefined && !isNaN(Number(item.price)) ? Number(item.price) : existing.price,
              categoryName: item.categoryName || item.category_name || existing.categoryName,
              subCategory: item.subCategory || item.sub_category || existing.subCategory,
              title: item.title || existing.title
            });
          });
          const merged = Array.from(currentMap.values());
          saveLocalServices(merged);
          callback(merged);
        }
      }, (err) => console.warn('Firestore services subscription notice:', err));
    } catch {}
  }

  return () => {
    window.removeEventListener(EVENT_SERVICES_CHANGED, handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
    unsubFirestore();
  };
}

export async function adminAddService(serviceData) {
  const current = getLocalServices();
  const newId = serviceData.id || `serv_${Date.now()}`;
  
  const formatted = {
    id: newId,
    title: serviceData.title || 'Home Service',
    categoryName: serviceData.categoryName || 'General',
    categoryId: serviceData.categoryId || `cat_${(serviceData.categoryName || 'general').toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    subCategory: serviceData.subCategory || serviceData.subCategories?.[0] || '',
    subCategories: serviceData.subCategories && serviceData.subCategories.length > 0 
      ? serviceData.subCategories 
      : (serviceData.subCategory ? [serviceData.subCategory] : []),
    about: serviceData.about || serviceData.description || 'Verified on-demand professional home service with upfront fixed pricing and expert tools.',
    price: Number(serviceData.price) || 300,
    rating: Number(serviceData.rating) || 4.9,
    reviewCount: Number(serviceData.reviewCount) || 120,
    ordersCompleted: Number(serviceData.ordersCompleted) || 150,
    city: serviceData.city || localStorage.getItem('jobit_user_location') || 'Melattur, Kerala',
    available: serviceData.available !== false,
    approved: true,
    heroImage: serviceData.heroImage || serviceData.imageUrl || 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80',
    imageUrl: serviceData.heroImage || serviceData.imageUrl || 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80',
    gallery: [
      serviceData.heroImage || serviceData.imageUrl || 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80'
    ],
    details: serviceData.details || [
      'Verified specialist with safety background clearance',
      'Doorstep diagnostic and transparent repair quotation',
      '30-day service warranty on all completed tasks'
    ],
    createdAt: new Date().toISOString()
  };

  const updated = [formatted, ...current];
  saveLocalServices(updated);

  // Sync to Supabase services table if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const cleanImg = formatted.heroImage || formatted.imageUrl || '';
      // 1. Try standard PostgreSQL snake_case columns
      const snakePayload = {
        id: formatted.id,
        title: formatted.title,
        price: formatted.price,
        category_name: formatted.categoryName,
        sub_category: formatted.subCategory || '',
        description: formatted.about || '',
        image_url: cleanImg,
        hero_image: cleanImg,
        updated_at: new Date().toISOString()
      };
      const sbRes1 = await safeDbPromise(
        supabase.from('services').upsert(snakePayload, { onConflict: 'id' }),
        1800
      );

      // 2. If column not found error, try camelCase schema
      if (sbRes1?.error) {
        const camelPayload = {
          id: formatted.id,
          title: formatted.title,
          price: formatted.price,
          categoryName: formatted.categoryName,
          subCategory: formatted.subCategory || '',
          about: formatted.about || '',
          description: formatted.about || '',
          imageUrl: cleanImg,
          heroImage: cleanImg,
          updatedAt: new Date().toISOString()
        };
        const sbRes2 = await safeDbPromise(
          supabase.from('services').upsert(camelPayload, { onConflict: 'id' }),
          1500
        );
        if (sbRes2?.error) {
          // 3. Fallback: minimal columns
          await safeDbPromise(
            supabase.from('services').upsert({
              id: formatted.id,
              title: formatted.title,
              price: formatted.price,
              image_url: cleanImg
            }, { onConflict: 'id' }),
            1200
          );
        }
      }
    } catch (sbErr) {
      console.warn('Supabase adminAddService notice:', sbErr);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      await safeDbPromise(setDoc(doc(db, 'services', formatted.id), {
        ...formatted,
        serverTimestamp: serverTimestamp()
      }), 2000);
    } catch (e) {
      console.warn('Firestore adminAddService fallback', e);
    }
  }

  return formatted;
}

/**
 * Upload service hero image with fast compressed Base64/Data URL fallback
 * Guarantees zero hang/spin if Supabase storage policy rejects upload.
 */
export async function uploadServiceImage(fileOrDataUrl, serviceId = 'service') {
  if (!fileOrDataUrl) return '';

  // If already a remote web URL (Unsplash, external CDN, etc.), return as is
  if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))) {
    return fileOrDataUrl;
  }

  // 1. Fast optimize & compress the image (max 800x800, 80% quality for rapid Base64/Data URL)
  let compressedDataUrl = '';
  try {
    compressedDataUrl = await compressImage(fileOrDataUrl, 800, 800, 0.80);
  } catch (err) {
    console.warn('Service image compression notice:', err);
    compressedDataUrl = typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
  }

  // If Supabase is not configured, return clean compressed Base64 Data URL immediately
  if (!isSupabaseConfigured || !supabase) {
    return compressedDataUrl || (typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
  }

  const sanitizedId = String(serviceId).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const filename = `services/${sanitizedId}_${Date.now()}.jpg`;

  let blobToUpload = null;
  if (compressedDataUrl && compressedDataUrl.startsWith('data:')) {
    try {
      const res = await fetch(compressedDataUrl);
      blobToUpload = await res.blob();
    } catch {}
  } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
    blobToUpload = fileOrDataUrl;
  }

  if (!blobToUpload) {
    return compressedDataUrl || (typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
  }

  // 2. Fast attempt to upload to Supabase Storage with strict timeout and bucket fallbacks
  const candidateBuckets = ['services', 'categories', 'images', 'public'];
  for (const bucket of candidateBuckets) {
    try {
      const uploadPromise = supabase.storage
        .from(bucket)
        .upload(filename, blobToUpload, {
          contentType: 'image/jpeg',
          upsert: true
        });

      const result = await safeDbPromise(uploadPromise, 1500);
      if (result && !result.error && result.data) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
        if (urlData?.publicUrl) {
          return urlData.publicUrl;
        }
      }
    } catch (sbErr) {
      console.warn(`Supabase storage upload notice for bucket ${bucket}:`, sbErr);
    }
  }

  // 3. Instant clean compressed Base64/Data URL fallback (never hangs or spins)
  return compressedDataUrl || (typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
}

export async function adminUpdateService(serviceId, updates) {
  const current = getLocalServices();
  let updatedService = null;
  const updated = current.map(s => {
    if (s.id === serviceId) {
      const merged = { ...s, ...updates };
      if (updates.price !== undefined) {
        merged.price = Number(updates.price);
      }
      if (updates.heroImage !== undefined || updates.imageUrl !== undefined || updates.image !== undefined) {
        const img = updates.heroImage || updates.imageUrl || updates.image || '';
        merged.heroImage = img;
        merged.imageUrl = img;
        merged.image = img;
        if (!merged.gallery || merged.gallery.length === 0) {
          merged.gallery = [img];
        } else {
          merged.gallery = [img, ...merged.gallery.slice(1)];
        }
      }
      if (updates.subCategory && (!merged.subCategories || merged.subCategories.length === 0)) {
        merged.subCategories = [updates.subCategory];
      }
      merged.updatedAt = new Date().toISOString();
      updatedService = merged;
      return merged;
    }
    return s;
  });

  saveLocalServices(updated);

  // 1. Sync update to Supabase services table if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const finalImg = updates.heroImage || updates.imageUrl || updates.image || updatedService?.heroImage || '';
      const finalPrice = updates.price !== undefined ? Number(updates.price) : Number(updatedService?.price || 300);
      const finalCat = updates.categoryName || updatedService?.categoryName || 'General';
      const finalTitle = updates.title || updatedService?.title || 'Home Service';
      const finalDesc = updates.about || updates.description || updatedService?.about || '';
      const finalSub = updates.subCategory || updatedService?.subCategory || '';

      // 1. Try standard PostgreSQL snake_case columns
      const snakePayload = {
        id: serviceId,
        title: finalTitle,
        price: finalPrice,
        category_name: finalCat,
        sub_category: finalSub,
        description: finalDesc,
        image_url: finalImg,
        hero_image: finalImg,
        updated_at: new Date().toISOString()
      };
      const sbRes1 = await safeDbPromise(
        supabase.from('services').upsert(snakePayload, { onConflict: 'id' }),
        1800
      );

      // 2. If error, try camelCase schema
      if (sbRes1?.error) {
        const camelPayload = {
          id: serviceId,
          title: finalTitle,
          price: finalPrice,
          categoryName: finalCat,
          subCategory: finalSub,
          about: finalDesc,
          description: finalDesc,
          imageUrl: finalImg,
          heroImage: finalImg,
          updatedAt: new Date().toISOString()
        };
        const sbRes2 = await safeDbPromise(
          supabase.from('services').upsert(camelPayload, { onConflict: 'id' }),
          1500
        );
        if (sbRes2?.error) {
          // 3. Fallback: minimal columns
          await safeDbPromise(
            supabase.from('services').upsert({
              id: serviceId,
              title: finalTitle,
              price: finalPrice,
              image_url: finalImg
            }, { onConflict: 'id' }),
            1200
          );
        }
      }
    } catch (sbErr) {
      console.warn('Supabase adminUpdateService notice:', sbErr);
    }
  }

  // 2. Sync to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      await safeDbPromise(setDoc(doc(db, 'services', serviceId), {
        ...updates,
        updatedAt: new Date().toISOString()
      }, { merge: true }), 2000);
    } catch (e) {
      console.warn('Firestore adminUpdateService fallback', e);
    }
  }

  return updatedService;
}

export async function adminDeleteService(serviceId) {
  const current = getLocalServices();
  const updated = current.filter(s => s.id !== serviceId);
  saveLocalServices(updated);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'services', serviceId));
    } catch (e) {
      console.warn('Firestore adminDeleteService fallback', e);
    }
  }
}

// ==========================================
// DYNAMIC CATEGORIES DATA & OPERATIONS
// ==========================================

export function getLocalCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    let parsed = raw ? JSON.parse(raw) : [];
    
    // Ensure all 20 active service categories from Customer Menu are present
    const map = new Map();
    (ALL_MAIN_CATEGORIES || []).forEach((c, idx) => {
      map.set(c.name.toLowerCase(), { ...c, order: c.order || idx + 1 });
    });
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      parsed.forEach(c => {
        const nameKey = (c.name || '').toLowerCase();
        const idKey = (c.id || '').toLowerCase();
        let existing = map.get(nameKey);
        if (!existing && idKey) {
          for (const item of map.values()) {
            if ((item.id || '').toLowerCase() === idKey) {
              existing = item;
              break;
            }
          }
        }
        if (existing) {
          map.set(existing.name.toLowerCase(), { ...existing, ...c });
        } else if (nameKey) {
          map.set(nameKey, c);
        }
      });
    }

    const merged = Array.from(map.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
    return merged;
  } catch {
    return ALL_MAIN_CATEGORIES || initialCategories || [];
  }
}

export function saveLocalCategories(catList) {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(catList));
    window.dispatchEvent(new CustomEvent(EVENT_CATEGORIES_CHANGED, { detail: catList }));
  } catch (err) {
    console.warn('Failed to save local categories', err);
  }
}

export function subscribeCategories(callback) {
  let unsubFirestore = () => {};

  const handleLocalChange = () => {
    callback(getLocalCategories());
  };

  window.addEventListener(EVENT_CATEGORIES_CHANGED, handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  callback(getLocalCategories());

  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(collection(db, 'categories'), (snap) => {
        if (!snap.empty) {
          const remoteCats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const currentCats = getLocalCategories();
          const catMap = new Map(currentCats.map(c => [(c.name || '').toLowerCase(), c]));
          remoteCats.forEach(item => {
            const key = (item.name || '').toLowerCase();
            if (!key) return;
            const existing = catMap.get(key) || {};
            catMap.set(key, { ...existing, ...item });
          });
          const list = Array.from(catMap.values());
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          saveLocalCategories(list);
          callback(list);
        }
      }, () => {});
    } catch {}
  }

  return () => {
    window.removeEventListener(EVENT_CATEGORIES_CHANGED, handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
    unsubFirestore();
  };
}

/**
 * Upload category icon or image to Firebase Storage / Supabase Storage with local compression fallback
 * Returns a permanent HTTPS download URL or high-resolution optimized Data URL
 */
export async function uploadCategoryImage(fileOrDataUrl, categoryId = 'category') {
  if (!fileOrDataUrl) return '';

  // If already a remote web URL (Unsplash, external CDN, etc.), return as is
  if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))) {
    return fileOrDataUrl;
  }

  // 1. Optimize & compress the image (max 800x800, JPEG 85% quality)
  let compressedDataUrl = '';
  try {
    compressedDataUrl = await compressImage(fileOrDataUrl, 800, 800, 0.85);
  } catch (err) {
    console.warn('Compression failed, using source:', err);
    compressedDataUrl = typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
  }

  // 2. Try Firebase Storage upload if storage is initialized
  if (storage && isFirebaseConfigured) {
    try {
      const sanitizedCatId = String(categoryId).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const filename = `categories/${sanitizedCatId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      let blobToUpload = null;
      if (compressedDataUrl && compressedDataUrl.startsWith('data:')) {
        const res = await fetch(compressedDataUrl);
        blobToUpload = await res.blob();
      } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
        blobToUpload = fileOrDataUrl;
      }

      if (blobToUpload) {
        const uploadSnapshot = await uploadBytes(storageRef, blobToUpload, {
          contentType: 'image/jpeg',
          customMetadata: {
            categoryId: String(categoryId),
            uploadedAt: new Date().toISOString()
          }
        });
        const downloadUrl = await getDownloadURL(uploadSnapshot.ref);
        if (downloadUrl) {
          return downloadUrl;
        }
      }
    } catch (storageErr) {
      console.warn('Firebase Storage upload notice (using optimized fallback):', storageErr);
    }
  }

  // 3. Try Supabase Storage if configured
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof window !== 'undefined' && window.__SUPABASE_URL);
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY);
    if (supabaseUrl && supabaseKey) {
      const sanitizedCatId = String(categoryId).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const filename = `categories/${sanitizedCatId}_${Date.now()}.jpg`;
      let blobToUpload = null;
      if (compressedDataUrl && compressedDataUrl.startsWith('data:')) {
        const res = await fetch(compressedDataUrl);
        blobToUpload = await res.blob();
      } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
        blobToUpload = fileOrDataUrl;
      }

      if (blobToUpload) {
        const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/categories/${filename}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'image/jpeg'
          },
          body: blobToUpload
        });
        if (uploadRes.ok) {
          return `${supabaseUrl}/storage/v1/object/public/categories/${filename}`;
        }
      }
    }
  } catch (sbErr) {
    console.warn('Supabase storage notice:', sbErr);
  }

  // 4. Resilient Fallback: return optimized compressed data URL
  return compressedDataUrl || (typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
}

export async function adminAddCategory(catData) {
  const current = getLocalCategories();
  const newId = catData.id || `cat_${Date.now()}`;
  const formatted = {
    id: newId,
    name: catData.name,
    icon: catData.icon || '🛠️',
    color: catData.color || '#E0F2FE',
    basePrice: Number(catData.basePrice) || 300,
    image: catData.image || catData.imageUrl || '',
    imageUrl: catData.image || catData.imageUrl || '',
    subCategories: Array.isArray(catData.subCategories) 
      ? catData.subCategories 
      : (catData.subCategoryText ? catData.subCategoryText.split(',').map(s => s.trim()).filter(Boolean) : []),
    order: (current.length || 0) + 1
  };

  const updated = [...current, formatted];
  saveLocalCategories(updated);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'categories', formatted.id), {
        ...formatted,
        serverTimestamp: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore adminAddCategory fallback', e);
    }
  }

  return formatted;
}

export async function adminUpdateCategory(catId, updates) {
  const current = getLocalCategories();
  const normalizedUpdates = { ...updates };
  if (normalizedUpdates.image && !normalizedUpdates.imageUrl) {
    normalizedUpdates.imageUrl = normalizedUpdates.image;
  } else if (normalizedUpdates.imageUrl && !normalizedUpdates.image) {
    normalizedUpdates.image = normalizedUpdates.imageUrl;
  }

  let found = false;
  let targetCat = null;
  const updated = current.map(c => {
    if (c.id === catId || (c.name && updates.name && c.name.toLowerCase() === updates.name.toLowerCase())) {
      found = true;
      targetCat = { ...c, ...normalizedUpdates, updatedAt: new Date().toISOString() };
      return targetCat;
    }
    return c;
  });

  if (!found) {
    targetCat = { id: catId, ...normalizedUpdates, updatedAt: new Date().toISOString() };
    updated.push(targetCat);
  }

  saveLocalCategories(updated);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'categories', catId), {
        ...(targetCat || normalizedUpdates),
        serverTimestamp: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore adminUpdateCategory setDoc fallback', e);
    }
  }

  return targetCat;
}

export async function adminDeleteCategory(catId) {
  const current = getLocalCategories();
  const updated = current.filter(c => c.id !== catId);
  saveLocalCategories(updated);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'categories', catId));
    } catch (e) {
      console.warn('Firestore adminDeleteCategory fallback', e);
    }
  }
}

// ==========================================
// PENDING WORKER ONBOARDING & APPROVALS
// ==========================================

export const initialPendingWorkers = [];

export function getPendingWorkers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING_WORKERS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    // Strictly filter out any dummy applicants
    const cleanList = list.filter(p => p && p.id && !DUMMY_WORKER_IDS.has(p.id));
    if (cleanList.length !== list.length) {
      localStorage.setItem(STORAGE_KEY_PENDING_WORKERS, JSON.stringify(cleanList));
    }
    return cleanList.map(item => ({
      ...item,
      selfieUrl: item.selfieUrl || item.avatar || item.photo || ''
    }));
  } catch {
    return [];
  }
}

export function savePendingWorkers(list) {
  try {
    localStorage.setItem(STORAGE_KEY_PENDING_WORKERS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT_PENDING_WORKERS_CHANGED, { detail: list }));
  } catch (err) {
    console.warn('Failed to save pending workers', err);
  }
}

export function subscribePendingWorkers(callback) {
  let unsubFirestore = () => {};

  const handleLocalChange = () => {
    callback(getPendingWorkers());
  };

  window.addEventListener(EVENT_PENDING_WORKERS_CHANGED, handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  callback(getPendingWorkers());

  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(collection(db, 'pending_workers'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => p && p.id && !DUMMY_WORKER_IDS.has(p.id));
          savePendingWorkers(list);
          callback(list);
        } else {
          callback([]);
        }
      }, () => {});
    } catch {}
  }

  return () => {
    window.removeEventListener(EVENT_PENDING_WORKERS_CHANGED, handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
    unsubFirestore();
  };
}

// Multi-step Worker Onboarding Submission - Fast, persistent and schema-compliant
export async function registerWorkerOnboarding(onboardingData) {
  const current = getPendingWorkers();
  const appId = 'app_worker_' + Date.now();
  const nowIso = new Date().toISOString();

  const primaryCategory = onboardingData.categoryName || onboardingData.category || onboardingData.skill || 'Home Services';
  const subSkillsList = Array.isArray(onboardingData.subSkills) && onboardingData.subSkills.length > 0
    ? onboardingData.subSkills
    : [primaryCategory];
  const experienceNumber = Number(onboardingData.experienceYears || parseInt(onboardingData.experience, 10)) || 3;
  const areaName = onboardingData.city || onboardingData.address || 'Melattur, Kerala';
  const selfiePhoto = onboardingData.liveSelfieUrl || onboardingData.avatar || onboardingData.photo || onboardingData.avatarUrl || '';

  const newApplication = {
    // Unique IDs
    id: appId,
    userId: appId,
    // Personal Info
    name: (onboardingData.name || '').trim(),
    phone: (onboardingData.phone || '').trim(),
    altPhone: (onboardingData.altPhone || '').trim(),
    email: (onboardingData.email || `${(onboardingData.name || 'pro').toLowerCase().replace(/[^a-z0-9]/g, '')}@jobit.com`).trim(),
    gender: onboardingData.gender || 'Not specified',
    dob: onboardingData.dob || '',
    // Location
    address: (onboardingData.address || '').trim(),
    city: areaName,
    serviceArea: areaName,
    pincode: (onboardingData.pincode || '').trim(),
    serviceRadius: String(onboardingData.serviceRadius || '25'),
    // Skills & Category matching both arrays and single strings
    category: primaryCategory,
    categoryName: primaryCategory,
    categoryId: onboardingData.categoryId || `cat_${primaryCategory.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    skill: primaryCategory,
    skills: subSkillsList,
    categories: [primaryCategory],
    subSkills: subSkillsList,
    experience: `${experienceNumber} years`,
    experienceYears: experienceNumber,
    baseRate: Number(onboardingData.baseRate) || 350,
    // Status & Availability
    status: 'pending',
    workerStatus: 'pending',
    isVerified: false,
    isAvailable: false,
    isOnline: false,
    // Photo & Documents
    liveSelfieUrl: selfiePhoto,
    avatarUrl: selfiePhoto,
    avatar: selfiePhoto,
    photo: selfiePhoto,
    aadhaarNumber: (onboardingData.aadhaarNumber || '').trim(),
    aadhaarDocUrl: onboardingData.aadhaarDocUrl || onboardingData.idProofUrl || '',
    drivingLicenseNumber: (onboardingData.drivingLicenseNumber || '').trim(),
    drivingLicenseDocUrl: onboardingData.drivingLicenseDocUrl || '',
    documents: onboardingData.documents || {
      liveSelfieUrl: selfiePhoto,
      aadhaarDocUrl: onboardingData.aadhaarDocUrl || '',
      drivingLicenseDocUrl: onboardingData.drivingLicenseDocUrl || ''
    },
    // Bank & Payout
    accountHolderName: (onboardingData.accountHolderName || onboardingData.name || '').trim(),
    bankName: (onboardingData.bankName || '').trim(),
    accountNumber: (onboardingData.accountNumber || '').trim(),
    ifscCode: (onboardingData.ifscCode || '').trim().toUpperCase(),
    upiId: (onboardingData.upiId || '').trim(),
    // Performance & Metrics
    rating: 5.0,
    jobsCompleted: 0,
    totalJobsCompleted: 0,
    // Audit Timestamps
    appliedAt: nowIso,
    submittedAt: nowIso,
    createdAt: nowIso
  };

  // 1. Instant local persistence
  const updated = [newApplication, ...current.filter(p => p.id !== appId)];
  savePendingWorkers(updated);

  // 2. Also register in local users map as pending worker so they can check status
  try {
    const cleanTen = (newApplication.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanTen) {
      const rawUsers = localStorage.getItem('jobit_registered_users');
      const users = rawUsers ? JSON.parse(rawUsers) : {};
      users[cleanTen] = {
        uid: appId,
        workerId: appId,
        role: 'WORKER',
        userRole: 'worker',
        status: 'pending',
        workerStatus: 'pending',
        ...newApplication
      };
      localStorage.setItem('jobit_registered_users', JSON.stringify(users));
    }
  } catch {}

  // 3. Sync to Firestore when configured with explicit error propagation
  if (isFirebaseConfigured && db) {
    try {
      await Promise.all([
        setDoc(doc(db, 'pending_workers', appId), {
          ...newApplication,
          submittedAt: nowIso
        }),
        setDoc(doc(db, 'users', appId), {
          ...newApplication,
          role: 'WORKER',
          userRole: 'worker',
          status: 'pending',
          workerStatus: 'pending',
          createdAt: nowIso
        }, { merge: true })
      ]);
    } catch (e) {
      console.error('Firestore worker onboarding error:', e);
      const customErr = new Error(`Cloud Database Error (${e.code || 'write-error'}): ${e.message || 'Worker registration failed to write to database.'}`);
      customErr.original = e;
      throw customErr;
    }
  }

  return newApplication;
}

// Admin approves a worker registration -> updates status to 'approved'
export async function approveWorkerApplication(workerAppId) {
  const pending = getPendingWorkers();
  const target = pending.find(p => p.id === workerAppId);
  if (!target) return false;

  // 1. Remove from pending list
  const updatedPending = pending.filter(p => p.id !== workerAppId);
  savePendingWorkers(updatedPending);

  // 2. Add to active verified workers roster with strictly status: 'approved'
  const activeWorkers = getLocalWorkers();
  const workerUniqueId = target.id.replace('app_', '');
  const nowIso = new Date().toISOString();
  const primaryCat = target.categoryName || target.skill || 'Home Services Pro';
  const subSkills = target.subSkills && target.subSkills.length > 0 ? target.subSkills : [primaryCat];
  const expNumber = Number(target.experienceYears || parseInt(target.experience, 10)) || 3;
  const avatarImage = target.avatar || target.liveSelfieUrl || target.photo || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80';

  const verifiedWorker = {
    id: workerUniqueId,
    userId: workerUniqueId,
    originalAppId: target.id,
    name: target.name,
    phone: target.phone,
    altPhone: target.altPhone || '',
    email: target.email || `${(target.name || 'pro').toLowerCase().replace(/\s+/g, '')}@jobit.com`,
    gender: target.gender || 'Not specified',
    dob: target.dob || '',
    skill: primaryCat,
    categoryName: primaryCat,
    categoryId: target.categoryId || 'cat_general',
    skills: subSkills,
    categories: [primaryCat],
    subSkills: subSkills,
    experience: `${expNumber} years`,
    experienceYears: expNumber,
    baseRate: target.baseRate || 350,
    address: target.address || '',
    city: target.city || 'Melattur, Kerala',
    serviceArea: target.city || 'Melattur, Kerala',
    pincode: target.pincode || '',
    serviceRadius: target.serviceRadius || '15',
    aadhaarNumber: target.aadhaarNumber || 'Verified',
    aadhaarDocUrl: target.aadhaarDocUrl || target.idProofUrl || '',
    drivingLicenseNumber: target.drivingLicenseNumber || '',
    drivingLicenseDocUrl: target.drivingLicenseDocUrl || '',
    idProofUrl: target.aadhaarDocUrl || target.idProofUrl || '',
    bankName: target.bankName || '',
    accountNumber: target.accountNumber || '',
    ifscCode: target.ifscCode || '',
    upiId: target.upiId || '',
    rating: target.rating || 5.0,
    jobsCompleted: 0,
    totalJobsCompleted: 0,
    isOnline: true, // Auto set online upon approval
    isAvailable: true,
    isVerified: true,
    is_approved: true, // Standard field for approved worker
    status: 'approved',
    workerStatus: 'approved',
    category: primaryCat,
    categoryName: primaryCat,
    service_area: target.city || target.serviceArea || target.address || 'Melattur, Kerala',
    service_areas: [target.city || target.serviceArea || target.address || 'Melattur, Kerala'],
    serviceAreas: [target.city || target.serviceArea || target.address || 'Melattur, Kerala'],
    role: 'WORKER',
    userRole: 'worker',
    approvedAt: nowIso,
    createdAt: target.createdAt || nowIso,
    avatar: avatarImage,
    avatarUrl: avatarImage,
    photo: avatarImage,
    vehicle: 'Bike'
  };

  const updatedActive = [verifiedWorker, ...activeWorkers.filter(w => w.id !== verifiedWorker.id)];
  saveLocalWorkers(updatedActive);

  // 3. Update registered user cache
  try {
    const cleanTen = (target.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanTen) {
      const rawUsers = localStorage.getItem('jobit_registered_users');
      const users = rawUsers ? JSON.parse(rawUsers) : {};
      users[cleanTen] = {
        ...verifiedWorker,
        uid: verifiedWorker.id,
        role: 'WORKER',
        userRole: 'worker',
        status: 'approved',
        workerStatus: 'approved'
      };
      localStorage.setItem('jobit_registered_users', JSON.stringify(users));
    }
  } catch {}

  // 4. Update current user in local storage if they happen to be logged in
  try {
    const activeCurrent = localStorage.getItem('jobit_user');
    if (activeCurrent) {
      const parsed = JSON.parse(activeCurrent);
      if (parsed.uid === target.id || parsed.id === target.id || parsed.phone === target.phone) {
        const merged = { ...parsed, ...verifiedWorker, status: 'approved', workerStatus: 'approved' };
        localStorage.setItem('jobit_user', JSON.stringify(merged));
      }
    }
  } catch {}

  // 5. Sync to database
  if (isFirebaseConfigured && db) {
    try {
      await Promise.all([
        deleteDoc(doc(db, 'pending_workers', workerAppId)),
        setDoc(doc(db, 'workers', verifiedWorker.id), verifiedWorker, { merge: true }),
        setDoc(doc(db, 'users', verifiedWorker.id), {
          ...verifiedWorker,
          role: 'WORKER',
          userRole: 'worker',
          status: 'approved',
          workerStatus: 'approved'
        }, { merge: true })
      ]);
    } catch (e) {
      console.warn('Firestore approveWorker notice', e);
    }
  }

  return verifiedWorker;
}

// Admin rejects a worker application
export async function rejectWorkerApplication(workerAppId, reason = 'Document verification could not be completed') {
  const pending = getPendingWorkers();
  const updatedPending = pending.map(p => {
    if (p.id === workerAppId) {
      return {
        ...p,
        status: 'rejected',
        workerStatus: 'rejected',
        rejectedReason: reason,
        rejectedAt: new Date().toISOString()
      };
    }
    return p;
  });
  savePendingWorkers(updatedPending);

  if (isFirebaseConfigured && db) {
    try {
      await safeDbPromise(
        updateDoc(doc(db, 'pending_workers', workerAppId), {
          status: 'rejected',
          workerStatus: 'rejected',
          rejectedReason: reason,
          rejectedAt: new Date().toISOString()
        }),
        2000
      );
    } catch {}
  }
}

// Only workers with status 'approved' should be listed for booking/jobs on the main platform
export function getApprovedWorkers() {
  return getLocalWorkers().filter(w => w.status === 'approved' || w.workerStatus === 'approved');
}

// Admin manually registers & approves a technician for a category and service area
export async function adminAddWorker(workerData) {
  const activeWorkers = getLocalWorkers();
  const workerUniqueId = workerData.id || `worker_${Date.now()}`;
  const nowIso = new Date().toISOString();
  const primaryCat = (workerData.category || workerData.categoryName || workerData.skill || 'Home Services Pro').trim();
  const subSkills = Array.isArray(workerData.subSkills) && workerData.subSkills.length > 0
    ? workerData.subSkills
    : [primaryCat];
  const serviceArea = (workerData.service_area || workerData.serviceArea || workerData.city || 'Melattur, Kerala').trim();
  const avatarImage = workerData.avatar || workerData.photo || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80';

  const newWorker = {
    id: workerUniqueId,
    userId: workerUniqueId,
    name: (workerData.name || 'Verified Technician').trim(),
    phone: (workerData.phone || '+91 98471 00000').trim(),
    email: workerData.email || `${(workerData.name || 'pro').toLowerCase().replace(/\s+/g, '')}@jobit.com`,
    is_approved: true,
    status: 'approved',
    workerStatus: 'approved',
    category: primaryCat,
    categoryName: primaryCat,
    categoryId: workerData.categoryId || `cat_${primaryCat.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    skill: primaryCat,
    skills: subSkills,
    categories: [primaryCat],
    subSkills: subSkills,
    service_area: serviceArea,
    serviceArea: serviceArea,
    service_areas: [serviceArea],
    serviceAreas: [serviceArea],
    city: serviceArea,
    address: workerData.address || serviceArea,
    experience: workerData.experience || '4 years',
    experienceYears: Number(workerData.experienceYears) || 4,
    baseRate: Number(workerData.baseRate) || 350,
    isOnline: true,
    isAvailable: true,
    isVerified: true,
    rating: Number(workerData.rating) || 5.0,
    jobsCompleted: Number(workerData.jobsCompleted) || 0,
    totalJobsCompleted: Number(workerData.totalJobsCompleted) || 0,
    role: 'WORKER',
    userRole: 'worker',
    approvedAt: nowIso,
    createdAt: nowIso,
    avatar: avatarImage,
    avatarUrl: avatarImage,
    photo: avatarImage,
    vehicle: workerData.vehicle || 'Bike'
  };

  const updatedActive = [newWorker, ...activeWorkers.filter(w => w.id !== newWorker.id)];
  saveLocalWorkers(updatedActive);

  if (isFirebaseConfigured && db) {
    try {
      await Promise.all([
        setDoc(doc(db, 'workers', newWorker.id), newWorker, { merge: true }),
        setDoc(doc(db, 'users', newWorker.id), newWorker, { merge: true })
      ]);
    } catch (e) {
      console.warn('Firestore adminAddWorker fallback', e);
    }
  }

  return newWorker;
}

// Admin delete an active worker
export async function adminDeleteWorker(workerId) {
  const workers = getLocalWorkers();
  const updated = workers.filter(w => w.id !== workerId);
  saveLocalWorkers(updated);

  if (isFirebaseConfigured && db) {
    try {
      await safeDbPromise(deleteDoc(doc(db, 'workers', workerId)), 2000);
    } catch {}
  }
}

// ==========================================
// REGISTERED CUSTOMERS MANAGEMENT
// ==========================================

export const initialCustomers = [
  {
    id: 'cust_aman',
    name: 'Aman Gupta',
    phone: '98765 00001',
    email: 'aman.gupta@example.com',
    city: 'Melattur, Kerala',
    pincode: '679326',
    totalBookings: 6,
    joinedAt: '2026-08-10',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'cust_priya',
    name: 'Priya Nair',
    phone: '98765 00002',
    email: 'priya.nair@example.com',
    city: 'Perinthalmanna, Kerala',
    pincode: '679322',
    totalBookings: 4,
    joinedAt: '2026-09-02',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'cust_rahul',
    name: 'Rahul Varma',
    phone: '98765 00003',
    email: 'rahul.v@example.com',
    city: 'Manjeri, Kerala',
    pincode: '676121',
    totalBookings: 2,
    joinedAt: '2026-09-18',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  }
];

export function getLocalCustomers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(initialCustomers));
      return initialCustomers;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialCustomers;
  } catch {
    return initialCustomers;
  }
}

export function saveLocalCustomers(list) {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT_CUSTOMERS_CHANGED, { detail: list }));
  } catch (err) {
    console.warn('Failed to save customers', err);
  }
}

export function subscribeCustomers(callback) {
  const handleLocalChange = () => {
    callback(getLocalCustomers());
  };

  window.addEventListener(EVENT_CUSTOMERS_CHANGED, handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  callback(getLocalCustomers());

  return () => {
    window.removeEventListener(EVENT_CUSTOMERS_CHANGED, handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
  };
}

// ============================================================================
// DAILY GIGS & SHIFT WORK MARKETPLACE SERVICE
// ============================================================================

export function getLocalDailyGigs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_GIGS);
    if (!raw) {
      saveLocalDailyGigs(initialDailyGigs);
      return initialDailyGigs;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialDailyGigs;
  } catch {
    return initialDailyGigs;
  }
}

export function saveLocalDailyGigs(list) {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY_GIGS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT_DAILY_GIGS_CHANGED, { detail: list }));
  } catch (err) {
    console.warn('Failed to save daily gigs locally', err);
  }
}

/**
 * Real-time reactive subscription for Daily Gigs
 * Supports instant localStorage fallback + live Firestore snapshot listener
 */
export function subscribeDailyGigs(callback) {
  let unsubFirestore = () => {};

  const handleLocalChange = () => {
    callback(getLocalDailyGigs());
  };

  window.addEventListener(EVENT_DAILY_GIGS_CHANGED, handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  // Push immediate state
  callback(getLocalDailyGigs());

  // Firestore sync if configured
  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(collection(db, 'daily_gigs'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Merge with initial/local if list is non-empty
          saveLocalDailyGigs(list);
          callback(list);
        }
      }, (err) => {
        console.warn('Firestore daily_gigs listener fallback to local', err);
      });
    } catch (err) {
      console.warn('Firestore daily_gigs setup error', err);
    }
  }

  return () => {
    window.removeEventListener(EVENT_DAILY_GIGS_CHANGED, handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
    unsubFirestore();
  };
}

/**
 * Post a new daily gig / shift vacancy (both Firestore & localStorage)
 */
export async function createDailyGig(gigData) {
  const newGigId = `gig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanGig = {
    id: newGigId,
    title: gigData.title?.trim() || 'Daily Shift Worker',
    shop_name: gigData.shop_name?.trim() || 'Local Business',
    location: gigData.location?.trim() || 'Melattur, Kerala',
    wage: gigData.wage?.trim() || '₹800 / day',
    duration: gigData.duration?.trim() || 'Today Only',
    timing: gigData.timing?.trim() || 'Full Day',
    category: gigData.category?.trim() || 'General Helper',
    urgency: gigData.urgency || 'urgent',
    contact_number: gigData.contact_number?.trim() || '+91 98471 00000',
    whatsapp_number: (gigData.whatsapp_number || gigData.contact_number || '').replace(/[^0-9]/g, '') || '919847100000',
    description: gigData.description?.trim() || 'Immediate requirement. Contact directly to confirm shift.',
    employer_name: gigData.employer_name?.trim() || 'Shop Owner',
    status: 'active',
    created_at: new Date().toISOString()
  };

  // 1. Instant local update
  const currentList = getLocalDailyGigs();
  const updated = [cleanGig, ...currentList.filter(g => g.id !== newGigId)];
  saveLocalDailyGigs(updated);

  // 2. Persist to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      await safeDbPromise(setDoc(doc(db, 'daily_gigs', newGigId), cleanGig));
    } catch (err) {
      console.warn('Failed to persist daily gig to Firestore', err);
    }
  }

  return cleanGig;
}

/**
 * Update a gig status (e.g. 'active', 'filled', 'expired')
 */
export async function updateDailyGigStatus(gigId, newStatus = 'filled') {
  const currentList = getLocalDailyGigs();
  const updated = currentList.map(g => g.id === gigId ? { ...g, status: newStatus } : g);
  saveLocalDailyGigs(updated);

  if (isFirebaseConfigured && db) {
    try {
      await safeDbPromise(updateDoc(doc(db, 'daily_gigs', gigId), { status: newStatus }));
    } catch (err) {}
  }
}

// ==========================================
// WORKER PORTFOLIOS & WORK ALBUMS SERVICE
// Table / Collection: worker_portfolios
// Schema: (id, worker_id, category_id, title, description, image_urls, created_at)
// ==========================================

export function getLocalPortfolios() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKER_PORTFOLIOS);
    if (!raw) {
      saveLocalPortfolios(initialPortfolios || []);
      return initialPortfolios || [];
    }
    const parsed = JSON.parse(raw);
    const existingList = Array.isArray(parsed) ? parsed : [];
    // Auto-merge any fresh seeds if missing
    const missing = (initialPortfolios || []).filter(ip => !existingList.some(p => p.id === ip.id));
    if (missing.length > 0) {
      const merged = [...existingList, ...missing];
      saveLocalPortfolios(merged);
      return merged;
    }
    return existingList;
  } catch {
    return initialPortfolios || [];
  }
}

export function saveLocalPortfolios(list) {
  try {
    localStorage.setItem(STORAGE_KEY_WORKER_PORTFOLIOS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT_PORTFOLIOS_CHANGED, { detail: list }));
  } catch (err) {
    console.warn('Failed to save worker portfolios locally', err);
  }
}

/**
 * Real-time subscription to worker portfolios / photo albums
 */
export function subscribePortfolios(callback) {
  let unsubFirestore = () => {};

  const handleLocalChange = () => {
    callback(getLocalPortfolios());
  };

  window.addEventListener(EVENT_PORTFOLIOS_CHANGED, handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  // Push immediate state
  callback(getLocalPortfolios());

  // Firestore sync if configured
  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(collection(db, 'worker_portfolios'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Normalize field names if needed (worker_id vs workerId, image_urls vs imageUrls)
          const normalized = list.map(item => ({
            ...item,
            worker_id: item.worker_id || item.workerId,
            category_id: item.category_id || item.categoryId,
            image_urls: item.image_urls || item.imageUrls || []
          }));
          saveLocalPortfolios(normalized);
          callback(normalized);
        } else {
          // Push initial portfolios to Firestore if collection is brand new
          const seeds = getLocalPortfolios();
          seeds.forEach(async (port) => {
            try {
              await setDoc(doc(db, 'worker_portfolios', port.id), port);
            } catch {}
          });
        }
      }, (err) => {
        console.warn('Firestore worker_portfolios listener fallback to local', err);
      });
    } catch (err) {
      console.warn('Firestore worker_portfolios setup error', err);
    }
  }

  return () => {
    window.removeEventListener(EVENT_PORTFOLIOS_CHANGED, handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
    unsubFirestore();
  };
}

/**
 * Upload / Add a new portfolio album for a worker
 * Schema: (id, worker_id, category_id, title, description, image_urls, created_at)
 */
export async function addWorkerPortfolio(albumData) {
  const newId = `port_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanAlbum = {
    id: newId,
    worker_id: albumData.worker_id || albumData.workerId || 'worker_zara',
    category_id: albumData.category_id || albumData.categoryId || 'cat_mehndi',
    title: albumData.title?.trim() || 'Work Album',
    description: albumData.description?.trim() || 'Showcase of recently delivered client works and craftsmanship.',
    image_urls: Array.isArray(albumData.image_urls) 
      ? albumData.image_urls 
      : Array.isArray(albumData.imageUrls)
        ? albumData.imageUrls
        : [],
    created_at: new Date().toISOString()
  };

  // 1. Instant local persistence
  const currentList = getLocalPortfolios();
  const updated = [cleanAlbum, ...currentList.filter(p => p.id !== newId)];
  saveLocalPortfolios(updated);

  // 2. Persist to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'worker_portfolios', newId), cleanAlbum);
    } catch (err) {
      console.error('Failed to persist portfolio album to Firestore', err);
      const customErr = new Error(`Database error (${err.code || 'failed'}): ${err.message || 'Could not save work album to cloud database.'}`);
      customErr.original = err;
      throw customErr;
    }
  }

  return cleanAlbum;
}

/**
 * Delete a portfolio album
 */
export async function deleteWorkerPortfolio(portfolioId) {
  const currentList = getLocalPortfolios();
  const updated = currentList.filter(p => p.id !== portfolioId);
  saveLocalPortfolios(updated);

  if (isFirebaseConfigured && db) {
    try {
      await safeDbPromise(deleteDoc(doc(db, 'worker_portfolios', portfolioId)));
    } catch (err) {
      console.warn('Failed to delete portfolio album from Firestore', err);
    }
  }
}

/**
 * Get all albums uploaded by a specific worker
 */
export function getPortfoliosByWorker(workerId) {
  const all = getLocalPortfolios();
  return all.filter(p => p.worker_id === workerId || p.workerId === workerId);
}

/**
 * Get all albums matching a category
 */
export function getPortfoliosByCategory(categoryIdOrName) {
  if (!categoryIdOrName) return [];
  const norm = String(categoryIdOrName).toLowerCase().trim();
  const all = getLocalPortfolios();
  return all.filter(p => {
    const cId = (p.category_id || p.categoryId || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    return cId === norm || cId.includes(norm) || norm.includes(cId) || title.includes(norm) || desc.includes(norm);
  });
}



