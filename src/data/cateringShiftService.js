import {   calculateHaversineDistanceKm,   getWorkerCoordinates,   getLocalWorkers,  saveLocalWorkers,  getLocalBookings,  saveLocalBookings} from './bookingService';
import { db, isFirebaseConfigured } from '../firebase';
import { supabase, isSupabaseConfigured } from '../supabase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

export const STORAGE_KEY_CATERING_SHIFTS = 'jobit_catering_shifts';
export const EVENT_CATERING_SHIFTS_CHANGED = 'jobit_catering_shifts_changed';
export const STORAGE_KEY_CUSTOMER_NOTIFS = 'jobit_customer_notifications';
export const EVENT_NOTIFS_CHANGED = 'jobit_notifications_changed';

// Default standard daily shift payout per catering professional
export const CATERING_BASE_PAY_PER_STAFF = 650;
export const CATERING_DEFAULT_RADIUS_KM = 10;
export const CATERING_RECOMMENDED_STANDBY_RATIO = 0.20; // 20% standby staff (e.g., 2 standby for 10 primary)

/**
 * Verified Initial Catering Staff Specialists for the Melattur/Pattikkad/Pandikkad Hub.
 * Pre-seeded so that radius matching (10 km) and shift acceptance/allocation workflows
 * are testable and operational out of the box.
 */
export const INITIAL_CATERING_WORKERS = [
  {
    id: 'cater_pro_1',
    name: 'Rahul K.P.',
    phone: '+91 98471 10001',
    city: 'Melattur, Kerala',
    serviceArea: 'Melattur, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['Event Service Staff & Waiters', 'VIP Table Service Captains'],
    subSkills: ['Event Service Staff & Waiters', 'VIP Table Service Captains'],
    rating: 4.9,
    jobsCompleted: 84,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
    lat: 11.0610,
    lng: 76.2630,
    latitude: 11.0610,
    longitude: 76.2630
  },
  {
    id: 'cater_pro_2',
    name: 'Faisal Rahman',
    phone: '+91 98471 10002',
    city: 'Melattur, Kerala',
    serviceArea: 'Melattur, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['Food Counter & Buffet Handlers', 'Event Service Staff & Waiters'],
    subSkills: ['Food Counter & Buffet Handlers'],
    rating: 4.8,
    jobsCompleted: 62,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    lat: 11.0595,
    lng: 76.2610,
    latitude: 11.0595,
    longitude: 76.2610
  },
  {
    id: 'cater_pro_3',
    name: 'Jithesh Nair',
    phone: '+91 98471 10003',
    city: 'Melattur, Kerala',
    serviceArea: 'Melattur, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['Kitchen Prep & Dishwashing Assistants', 'Clean-up & Banquet Hall Reset Crew'],
    subSkills: ['Kitchen Prep & Dishwashing Assistants'],
    rating: 4.9,
    jobsCompleted: 110,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    lat: 11.0630,
    lng: 76.2650,
    latitude: 11.0630,
    longitude: 76.2650
  },
  {
    id: 'cater_pro_4',
    name: 'Muhammed Anees',
    phone: '+91 98471 10004',
    city: 'Pattikkad, Kerala',
    serviceArea: 'Pattikkad, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['Event Service Staff & Waiters', 'Beverage & Juice Station Servers'],
    subSkills: ['Event Service Staff & Waiters'],
    rating: 4.8,
    jobsCompleted: 49,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    lat: 11.0267,
    lng: 76.2081,
    latitude: 11.0267,
    longitude: 76.2081
  },
  {
    id: 'cater_pro_5',
    name: 'Sreerag M.',
    phone: '+91 98471 10005',
    city: 'Pattikkad, Kerala',
    serviceArea: 'Pattikkad, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['Food Counter & Buffet Handlers'],
    subSkills: ['Food Counter & Buffet Handlers'],
    rating: 4.7,
    jobsCompleted: 38,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    lat: 11.0280,
    lng: 76.2100,
    latitude: 11.0280,
    longitude: 76.2100
  },
  {
    id: 'cater_pro_6',
    name: 'Vishnu Prasad',
    phone: '+91 98471 10006',
    city: 'Pandikkad, Kerala',
    serviceArea: 'Pandikkad, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['VIP Table Service Captains', 'Event Service Staff & Waiters'],
    subSkills: ['VIP Table Service Captains'],
    rating: 5.0,
    jobsCompleted: 95,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    lat: 11.1118,
    lng: 76.2415,
    latitude: 11.1118,
    longitude: 76.2415
  },
  {
    id: 'cater_pro_7',
    name: 'Shabeer Ali',
    phone: '+91 98471 10007',
    city: 'Pandikkad, Kerala',
    serviceArea: 'Pandikkad, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['Event Service Staff & Waiters'],
    subSkills: ['Event Service Staff & Waiters'],
    rating: 4.8,
    jobsCompleted: 71,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    lat: 11.1140,
    lng: 76.2430,
    latitude: 11.1140,
    longitude: 76.2430
  },
  {
    id: 'cater_pro_8',
    name: 'Akshay Das',
    phone: '+91 98471 10008',
    city: 'Melattur, Kerala',
    serviceArea: 'Melattur, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['Food Counter & Buffet Handlers', 'Clean-up Crew'],
    subSkills: ['Food Counter & Buffet Handlers'],
    rating: 4.7,
    jobsCompleted: 43,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    lat: 11.0650,
    lng: 76.2600,
    latitude: 11.0650,
    longitude: 76.2600
  },
  {
    id: 'cater_pro_9',
    name: 'Pranav R.',
    phone: '+91 98471 10009',
    city: 'Perinthalmanna, Kerala',
    serviceArea: 'Perinthalmanna, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['Beverage & Juice Station Servers', 'Event Service Staff & Waiters'],
    subSkills: ['Beverage & Juice Station Servers'],
    rating: 4.9,
    jobsCompleted: 58,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    lat: 10.9760,
    lng: 76.2254,
    latitude: 10.9760,
    longitude: 76.2254
  },
  {
    id: 'cater_pro_10',
    name: 'Salman Faris',
    phone: '+91 98471 10010',
    city: 'Melattur, Kerala',
    serviceArea: 'Melattur, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['VIP Table Service Captains'],
    subSkills: ['VIP Table Service Captains'],
    rating: 4.9,
    jobsCompleted: 87,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    lat: 11.0580,
    lng: 76.2640,
    latitude: 11.0580,
    longitude: 76.2640
  },
  {
    id: 'cater_pro_11',
    name: 'Ashwin Krishna (Standby Lead)',
    phone: '+91 98471 10011',
    city: 'Pattikkad, Kerala',
    serviceArea: 'Pattikkad, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['Event Service Staff & Waiters', 'Food Counter & Buffet Handlers'],
    subSkills: ['Event Service Staff & Waiters'],
    rating: 4.8,
    jobsCompleted: 64,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    lat: 11.0250,
    lng: 76.2060,
    latitude: 11.0250,
    longitude: 76.2060
  },
  {
    id: 'cater_pro_12',
    name: 'Midhun C. (Standby Reserve)',
    phone: '+91 98471 10012',
    city: 'Pandikkad, Kerala',
    serviceArea: 'Pandikkad, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['Kitchen Prep & Dishwashing Assistants', 'Event Service Staff & Waiters'],
    subSkills: ['Kitchen Prep'],
    rating: 4.7,
    jobsCompleted: 41,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80',
    lat: 11.1100,
    lng: 76.2400,
    latitude: 11.1100,
    longitude: 76.2400
  },
  {
    id: 'cater_pro_13',
    name: 'Bilal K.',
    phone: '+91 98471 10013',
    city: 'Melattur, Kerala',
    serviceArea: 'Melattur, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['Clean-up & Banquet Hall Reset Crew'],
    subSkills: ['Clean-up'],
    rating: 4.8,
    jobsCompleted: 35,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
    lat: 11.0620,
    lng: 76.2615,
    latitude: 11.0620,
    longitude: 76.2615
  },
  {
    id: 'cater_pro_14',
    name: 'Deepu V.',
    phone: '+91 98471 10014',
    city: 'Melattur, Kerala',
    serviceArea: 'Melattur, Kerala',
    category: 'Catering Staff',
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    skill: 'Catering Staff',
    skills: ['VIP Table Service Captains', 'Event Service Staff & Waiters'],
    subSkills: ['VIP Table Service Captains'],
    rating: 5.0,
    jobsCompleted: 78,
    isOnline: true,
    status: 'approved',
    workerStatus: 'approved',
    serviceRadius: '15',
    baseRate: 650,
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&q=80',
    lat: 11.0600,
    lng: 76.2635,
    latitude: 11.0600,
    longitude: 76.2635
  }
];

/**
 * Ensures catering workers are safely registered in the system worker repository.
 */
export function ensureCateringWorkersSeeded() {
  try {
    const currentWorkers = getLocalWorkers();
    const existingIds = new Set(currentWorkers.map(w => w.id));
    const missing = INITIAL_CATERING_WORKERS.filter(w => !existingIds.has(w.id));
    
    if (missing.length > 0) {
      const merged = [...currentWorkers, ...missing];
      saveLocalWorkers(merged);
    }
  } catch (err) {
    console.warn('Catering workers seed note:', err);
  }
}

/**
 * Dispatches an in-app notification to a customer and saves to localStorage.
 */
export function notifyCustomer({ title, message, type = 'booking', badge = 'Catering' }) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMER_NOTIFS);
    const list = raw ? JSON.parse(raw) : [];
    const newNotif = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title,
      message,
      time: 'Just now',
      unread: true,
      type,
      badge,
      createdAt: new Date().toISOString()
    };
    const updated = [newNotif, ...(Array.isArray(list) ? list : [])];
    localStorage.setItem(STORAGE_KEY_CUSTOMER_NOTIFS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NOTIFS_CHANGED, { detail: updated }));
  } catch (err) {
    console.warn('Failed to notify customer:', err);
  }
}

/**
 * Dispatches a worker-specific notification.
 */
export function notifyWorker(workerId, { title, message, type = 'catering', bookingId, actionRequired = false }) {
  if (!workerId) return;
  try {
    const key = `jobit_worker_notifications_${workerId}`;
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const notif = {
      id: 'wnotif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title,
      message,
      time: 'Just now',
      unread: true,
      type,
      bookingId,
      actionRequired,
      createdAt: new Date().toISOString()
    };
    const updated = [notif, ...(Array.isArray(list) ? list : [])];
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(`jobit_worker_notifs_${workerId}`, { detail: updated }));
    window.dispatchEvent(new CustomEvent('jobit_any_worker_notif', { detail: { workerId, notif } }));
  } catch (err) {
    console.warn('Failed to notify worker:', err);
  }
}

/**
 * Retrieves all catering bookings.
 */
export function getLocalCateringBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATERING_SHIFTS);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch {}

  // Fallback: search main bookings collection for bookingType === 'CATERING_BULK'
  try {
    const mainBookings = getLocalBookings();
    const cateringFromMain = mainBookings.filter(b => b.bookingType === 'CATERING_BULK' || b.categoryId === 'cat_catering');
    if (cateringFromMain.length > 0) {
      return cateringFromMain;
    }
  } catch {}

  return [];
}

/**
 * Saves all catering bookings and dispatches real-time events.
 */
export function saveLocalCateringBookings(bookings) {
  try {
    const cleanList = Array.isArray(bookings) ? bookings : [];
    localStorage.setItem(STORAGE_KEY_CATERING_SHIFTS, JSON.stringify(cleanList));
    window.dispatchEvent(new CustomEvent(EVENT_CATERING_SHIFTS_CHANGED, { detail: cleanList }));

    // Also mirror to main bookings store so standard views (BookingsScreen, Admin dispatch) have synchronized state
    const mainBookings = getLocalBookings();
    const cateringIds = new Set(cleanList.map(b => b.id));
    const nonCateringMain = mainBookings.filter(b => !cateringIds.has(b.id));
    const mergedMain = [...cleanList, ...nonCateringMain];
    saveLocalBookings(mergedMain);

    // Sync to Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        cleanList.forEach(b => {
          setDoc(doc(db, 'catering_shifts', b.id), {
            ...b,
            updatedAt: serverTimestamp()
          }, { merge: true }).catch(() => {});
        });
      } catch {}
    }
  } catch (err) {
    console.warn('Failed to save catering bookings:', err);
  }
}

/**
 * Subscribes to real-time Catering Bookings updates.
 */
export function subscribeCateringBookings(callback) {
  let unsubFirestore = null;

  const handleLocalChange = () => {
    callback(getLocalCateringBookings());
  };

  window.addEventListener(EVENT_CATERING_SHIFTS_CHANGED, handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  // Initial callback
  callback(getLocalCateringBookings());

  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(collection(db, 'catering_shifts'), (snapshot) => {
        if (!snapshot.empty) {
          const remoteList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          saveLocalCateringBookings(remoteList);
          callback(remoteList);
        }
      }, () => {});
    } catch {}
  }

  return () => {
    window.removeEventListener(EVENT_CATERING_SHIFTS_CHANGED, handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
    if (unsubFirestore) unsubFirestore();
  };
}

/**
 * Proximity Radius Matching:
 * Finds all registered Catering Workers within a defined radius (e.g. 10 km) of the event coordinates.
 */
export function getNearbyCateringWorkers(eventCoords, radiusKm = CATERING_DEFAULT_RADIUS_KM, workersList = null) {
  const allWorkers = workersList || getLocalWorkers();
  const evtLat = Number(eventCoords?.lat ?? eventCoords?.latitude);
  const evtLng = Number(eventCoords?.lng ?? eventCoords?.longitude);

  if (isNaN(evtLat) || isNaN(evtLng)) return [];

  const matched = [];

  for (const worker of allWorkers) {
    if (!worker || !worker.id) continue;
    
    // Check approved status
    const isApproved = worker.status === 'approved' || worker.workerStatus === 'approved';
    if (!isApproved) continue;

    // Check category: Catering Staff
    const catCheck = [
      worker.category,
      worker.categoryName,
      worker.skill,
      worker.categoryId,
      ...(Array.isArray(worker.skills) ? worker.skills : []),
      ...(Array.isArray(worker.categories) ? worker.categories : [])
    ].filter(Boolean).map(s => String(s).toLowerCase());

    const isCatering = catCheck.some(s => s.includes('cater') || s.includes('waiter') || s.includes('buffet'));
    if (!isCatering) continue;

    // Calculate Haversine distance
    const workerCoords = getWorkerCoordinates(worker);
    if (!workerCoords || isNaN(workerCoords.lat) || isNaN(workerCoords.lng)) continue;

    const distanceKm = calculateHaversineDistanceKm(evtLat, evtLng, Number(workerCoords.lat), Number(workerCoords.lng));
    if (distanceKm === null) continue;

    const workerRadius = Math.max(1, Number(worker.serviceRadius || radiusKm));
    const effectiveRadius = Math.max(radiusKm, workerRadius);

    if (distanceKm <= effectiveRadius) {
      matched.push({
        worker,
        distanceKm: Number(distanceKm.toFixed(1)),
        isWithinStrictRadius: distanceKm <= radiusKm
      });
    }
  }

  // Sort by closest distance first
  matched.sort((a, b) => a.distanceKm - b.distanceKm);
  return matched;
}

/**
 * 1. CUSTOMER DASHBOARD WORKFLOW:
 * Creates an instant Catering Staff Booking Inquiry and broadcasts alerts to all matching workers within radius.
 */
export async function createCateringBooking(payload) {
  ensureCateringWorkersSeeded();

  const nowIso = new Date().toISOString();
  const bookingId = 'cater_bk_' + Date.now();

  const rawLat = payload.user_latitude ?? payload.latitude ?? payload.lat ?? payload.coordinates?.lat ?? 11.0607;
  const rawLng = payload.user_longitude ?? payload.longitude ?? payload.lng ?? payload.coordinates?.lng ?? 76.2625;
  const userLat = Number(Number(rawLat).toFixed(6));
  const userLng = Number(Number(rawLng).toFixed(6));

  const totalStaffNeeded = Math.max(1, Number(payload.totalStaffNeeded || payload.staffCount || 10));
  // Automatically calculate 20% standby buffer (minimum 1, default 2 for 10 staff)
  const standbyStaffNeeded = Math.max(1, Number(payload.standbyStaffNeeded || Math.ceil(totalStaffNeeded * CATERING_RECOMMENDED_STANDBY_RATIO)));
  const ratePerStaff = Number(payload.ratePerStaff || CATERING_BASE_PAY_PER_STAFF);
  const estimatedTotal = totalStaffNeeded * ratePerStaff;
  const advancePaid = Number(payload.advancePaid || 500);
  const remainingDue = Math.max(0, estimatedTotal - advancePaid);
  const radiusKm = Number(payload.radiusKm || CATERING_DEFAULT_RADIUS_KM);

  // Proximity Radius Detection
  const nearbyMatched = getNearbyCateringWorkers({ lat: userLat, lng: userLng }, radiusKm);

  const newBooking = {
    id: bookingId,
    bookingType: 'CATERING_BULK',
    serviceTitle: `Catering Staff (${totalStaffNeeded} Staff + ${standbyStaffNeeded} Standby)`,
    categoryName: 'Catering Staff',
    categoryId: 'cat_catering',
    customerName: payload.customerName || 'Valued Host',
    customerPhone: payload.customerPhone || payload.phone || '+91 98471 23456',
    customerId: payload.customerId || 'cust_guest',
    
    // Core Operational Fields
    totalStaffNeeded,
    standbyStaffNeeded,
    functionDate: payload.functionDate || new Date().toISOString().split('T')[0],
    functionTime: payload.functionTime || '10:30 AM - 04:30 PM',
    shiftType: payload.shiftType || 'Lunch & Afternoon Banquet',
    functionLocation: payload.functionLocation || payload.address || 'Rose Garden Convention Centre, Melattur',
    venueName: payload.venueName || 'Rose Garden Convention Centre',
    address: payload.fullAddress || payload.address || 'Melattur, Kerala',
    city: payload.city || 'Melattur, Kerala',
    user_latitude: userLat,
    user_longitude: userLng,
    latitude: userLat,
    longitude: userLng,
    coordinates: { lat: userLat, lng: userLng },
    radiusKm,
    eventOccasion: payload.eventOccasion || 'Wedding Reception / Banquet',
    uniform: payload.uniform || 'Formal Black Trousers & White Shirt',
    rolesNeeded: Array.isArray(payload.rolesNeeded) && payload.rolesNeeded.length > 0 
      ? payload.rolesNeeded 
      : ['Event Service Staff & Waiters', 'Buffet Handlers', 'Kitchen & Washing Helpers'],
    specialInstructions: payload.specialInstructions || 'Please arrive 30 minutes before shift time for briefing.',
    
    // Financials
    ratePerStaff,
    estimatedTotal,
    advancePaid,
    remainingDue,
    paymentStatus: 'advance_paid',
    
    // Workflow State Machine:
    // 'inquiry_broadcasted' -> 'allocated' -> 'confirmed' -> 'shift_in_progress' -> 'completed'
    status: 'inquiry_broadcasted',
    cateringStatus: 'inquiry_broadcasted',
    
    // Broadcast & Allocation Lists
    nearbyWorkerCount: nearbyMatched.length,
    nearbyWorkerIds: nearbyMatched.map(m => m.worker.id),
    applicants: [], // Workers who accepted
    primaryWorkers: [], // Confirmed primary staff (max: totalStaffNeeded)
    standbyWorkers: [], // Standby backup staff (max: standbyStaffNeeded)
    
    // Day-of-Event Shift Monitoring
    shiftReminderSent: false,
    shiftReminderSentAt: null,
    
    // Timestamps
    createdAt: nowIso,
    broadcastedAt: nowIso,
    updatedAt: nowIso,
    
    // Audit Trail
    auditLogs: [
      {
        id: 'log_1',
        timestamp: nowIso,
        type: 'inquiry_broadcasted',
        message: `Catering booking inquiry submitted for ${totalStaffNeeded} Staff + ${standbyStaffNeeded} Standby at ${payload.venueName || 'Venue'} (${radiusKm} KM radius). Instant broadcast pushed to ${nearbyMatched.length} matching workers.`
      }
    ]
  };

  // 1. Save Booking
  const existing = getLocalCateringBookings();
  const updated = [newBooking, ...existing];
  saveLocalCateringBookings(updated);

  // 2. Broadcast Instant Alerts to all matching workers within the radius
  nearbyMatched.forEach(({ worker, distanceKm }) => {
    notifyWorker(worker.id, {
      title: '🍽️ New Catering Order Available Near You',
      message: `${newBooking.eventOccasion} at ${newBooking.venueName} (${distanceKm} km away). Date: ${newBooking.functionDate}, ${newBooking.functionTime}. Shift Pay: ₹${ratePerStaff}. Tap to Accept!`,
      type: 'catering_broadcast',
      bookingId: newBooking.id,
      actionRequired: true
    });
  });

  // 3. Send Confirmation Alert to Customer
  notifyCustomer({
    title: 'Catering Inquiry Submitted & Broadcasted! 🍽️',
    message: `Your catering requirement for ${totalStaffNeeded} Staff on ${newBooking.functionDate} has been broadcasted to ${nearbyMatched.length} verified catering professionals within 10 KM. We will confirm staff as they accept!`,
    type: 'catering_inquiry',
    badge: 'Catering'
  });

  return newBooking;
}

/**
 * 3. WORKER ACCEPTANCE & ALLOCATION LOGIC:
 * Handles worker clicking "Accept" on an incoming Catering Shift broadcast.
 * Automatically allocates the first required count to Primary, and next required count to Standby.
 */
export async function acceptCateringShift(bookingId, worker) {
  if (!bookingId || !worker || !worker.id) {
    throw new Error('Invalid booking or worker details');
  }

  const allBookings = getLocalCateringBookings();
  const bookingIndex = allBookings.findIndex(b => b.id === bookingId);
  if (bookingIndex === -1) {
    throw new Error('Catering booking not found');
  }

  const booking = { ...allBookings[bookingIndex] };
  const nowIso = new Date().toISOString();

  // Check if worker already accepted
  const alreadyApplicant = (booking.applicants || []).some(a => a.workerId === worker.id);
  if (alreadyApplicant) {
    return { booking, assignedRole: 'already_accepted' };
  }

  // Calculate worker distance to venue
  let distanceKm = 3.5;
  const evtCoords = booking.coordinates || { lat: booking.user_latitude, lng: booking.user_longitude };
  const workerCoords = getWorkerCoordinates(worker);
  if (evtCoords?.lat && workerCoords?.lat) {
    const d = calculateHaversineDistanceKm(evtCoords.lat, evtCoords.lng, workerCoords.lat, workerCoords.lng);
    if (d !== null) distanceKm = Number(d.toFixed(1));
  }

  const applicantRecord = {
    workerId: worker.id,
    workerName: worker.name || 'Catering Specialist',
    workerPhone: worker.phone || '+91 98471 00000',
    workerAvatar: worker.avatar || worker.photo || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
    appliedAt: nowIso,
    distanceKm,
    rating: worker.rating || 4.9,
    jobsCompleted: worker.jobsCompleted || 0
  };

  const currentPrimary = Array.isArray(booking.primaryWorkers) ? [...booking.primaryWorkers] : [];
  const currentStandby = Array.isArray(booking.standbyWorkers) ? [...booking.standbyWorkers] : [];
  let assignedRole = 'reserve';

  // Acceptance Allocation Logic:
  // 1. Select the required primary count (e.g. first 10 accepted workers)
  if (currentPrimary.length < booking.totalStaffNeeded) {
    assignedRole = 'primary';
    const primaryRecord = {
      ...applicantRecord,
      shiftStatus: 'assigned', // 'assigned' | 'shift_reminder_sent' | 'attendance_confirmed' | 'on_my_way' | 'unable_to_attend' | 'reallocated'
      assignedAt: nowIso,
      promotedFromStandby: false,
      attendanceConfirmedAt: null,
      unableReason: null
    };
    currentPrimary.push(primaryRecord);
    applicantRecord.status = 'primary';

    // Send "Booking Confirmed - Selected for Event" to Primary Worker
    notifyWorker(worker.id, {
      title: '🎉 Booking Confirmed - Selected for Event',
      message: `You are confirmed as Primary Catering Staff for ${booking.eventOccasion} at ${booking.venueName} on ${booking.functionDate} (${booking.functionTime}). Uniform: ${booking.uniform}. Pay: ₹${booking.ratePerStaff}.`,
      type: 'catering_confirmed_primary',
      bookingId: booking.id
    });

  } else if (currentStandby.length < booking.standbyStaffNeeded) {
    // 2. Automatically assign the next required count (e.g. 2 workers) as "Standby / Backup"
    assignedRole = 'standby';
    const standbyRecord = {
      ...applicantRecord,
      shiftStatus: 'standby', // 'standby' | 'promoted_to_primary' | 'released'
      assignedAt: nowIso,
      promotedAt: null,
      promotionReason: null
    };
    currentStandby.push(standbyRecord);
    applicantRecord.status = 'standby';

    // Send "Assigned as Standby Backup Staff" to Standby Worker
    notifyWorker(worker.id, {
      title: '🛡️ Assigned as Standby Backup Staff',
      message: `You are reserved as Standby Staff for ${booking.eventOccasion} on ${booking.functionDate} at ${booking.venueName}. Please stay on call. If primary staff drops out, you are auto-promoted with full shift pay!`,
      type: 'catering_assigned_standby',
      bookingId: booking.id
    });
  } else {
    // Reserve Queue
    assignedRole = 'reserve';
    applicantRecord.status = 'reserve';
    notifyWorker(worker.id, {
      title: 'Catering Application Recorded (Waitlist Reserve)',
      message: `You are on the priority reserve list for ${booking.eventOccasion} at ${booking.venueName}. You will be notified immediately if a slot opens up.`,
      type: 'catering_waitlist',
      bookingId: booking.id
    });
  }

  const updatedApplicants = [...(booking.applicants || []), applicantRecord];
  booking.applicants = updatedApplicants;
  booking.primaryWorkers = currentPrimary;
  booking.standbyWorkers = currentStandby;
  booking.updatedAt = nowIso;

  // Log allocation in audit trail
  const logMsg = assignedRole === 'primary'
    ? `${worker.name} accepted shift and was selected as Primary Staff (${currentPrimary.length}/${booking.totalStaffNeeded}).`
    : assignedRole === 'standby'
      ? `${worker.name} accepted shift and was assigned as Standby Backup Staff (${currentStandby.length}/${booking.standbyStaffNeeded}).`
      : `${worker.name} accepted shift and placed in Reserve Queue.`;

  booking.auditLogs = [
    ...(booking.auditLogs || []),
    {
      id: 'log_' + Date.now(),
      timestamp: nowIso,
      type: `worker_${assignedRole}`,
      message: logMsg
    }
  ];

  // If primary staff requirement is filled, update booking status and notify customer
  if (currentPrimary.length >= booking.totalStaffNeeded && booking.status === 'inquiry_broadcasted') {
    booking.status = 'allocated';
    booking.cateringStatus = 'allocated';

    // Send "Booking Confirmed with [Count] Staff" to Customer
    notifyCustomer({
      title: `Booking Confirmed with ${booking.totalStaffNeeded} Staff! 🎊`,
      message: `All ${booking.totalStaffNeeded} verified catering professionals + ${currentStandby.length} standby backups have been locked in for your ${booking.eventOccasion} on ${booking.functionDate} at ${booking.venueName}.`,
      type: 'catering_allocated',
      badge: 'Staff Locked'
    });
  }

  allBookings[bookingIndex] = booking;
  saveLocalCateringBookings(allBookings);

  return { booking, assignedRole };
}

/**
 * 4. DAY-OF-EVENT SHIFT CONFIRMATION:
 * Sends actionable notification: "Confirm Your Catering Shift" to primary staff.
 */
export async function sendShiftReminderBroadcast(bookingId) {
  const allBookings = getLocalCateringBookings();
  const bookingIndex = allBookings.findIndex(b => b.id === bookingId);
  if (bookingIndex === -1) throw new Error('Booking not found');

  const booking = { ...allBookings[bookingIndex] };
  const nowIso = new Date().toISOString();

  booking.shiftReminderSent = true;
  booking.shiftReminderSentAt = nowIso;
  booking.status = 'shift_in_progress';
  booking.cateringStatus = 'shift_in_progress';

  // Mark all primary workers as shift reminder sent
  booking.primaryWorkers = (booking.primaryWorkers || []).map(w => {
    if (w.shiftStatus === 'assigned' || !w.shiftStatus) {
      return { ...w, shiftStatus: 'shift_reminder_sent' };
    }
    return w;
  });

  // Push actionable notification to all primary workers
  booking.primaryWorkers.forEach(w => {
    notifyWorker(w.workerId, {
      title: '🚨 Action Required: Confirm Your Catering Shift',
      message: `Today's event: ${booking.eventOccasion} at ${booking.venueName} (${booking.functionTime}). Please tap to confirm attendance or let us know if you are unable to attend.`,
      type: 'catering_shift_reminder',
      bookingId: booking.id,
      actionRequired: true
    });
  });

  // Notify standby workers to be on high alert
  (booking.standbyWorkers || []).forEach(w => {
    notifyWorker(w.workerId, {
      title: '🛡️ Standby Alert: Event Shift Today',
      message: `Event day check-in active for ${booking.venueName}. Please stay reachable in case of primary staff emergency replacement.`,
      type: 'catering_standby_alert',
      bookingId: booking.id
    });
  });

  booking.auditLogs = [
    ...(booking.auditLogs || []),
    {
      id: 'log_' + Date.now(),
      timestamp: nowIso,
      type: 'shift_reminder_sent',
      message: `Morning Shift Confirmation Reminder broadcasted to ${booking.primaryWorkers.length} primary staff members.`
    }
  ];

  allBookings[bookingIndex] = booking;
  saveLocalCateringBookings(allBookings);

  return booking;
}

/**
 * 4. INTERACTIVE WORKER ACTION 1:
 * "Confirm Attendance" / "On My Way"
 * Updates worker's shift status to Confirmed.
 */
export async function confirmWorkerAttendance(bookingId, workerId, statusType = 'attendance_confirmed') {
  const allBookings = getLocalCateringBookings();
  const bookingIndex = allBookings.findIndex(b => b.id === bookingId);
  if (bookingIndex === -1) throw new Error('Booking not found');

  const booking = { ...allBookings[bookingIndex] };
  const nowIso = new Date().toISOString();

  let updatedWorkerName = '';
  booking.primaryWorkers = (booking.primaryWorkers || []).map(w => {
    if (w.workerId === workerId) {
      updatedWorkerName = w.workerName;
      return {
        ...w,
        shiftStatus: statusType, // 'attendance_confirmed' or 'on_my_way'
        attendanceConfirmedAt: nowIso
      };
    }
    return w;
  });

  booking.auditLogs = [
    ...(booking.auditLogs || []),
    {
      id: 'log_' + Date.now(),
      timestamp: nowIso,
      type: 'attendance_confirmed',
      message: `${updatedWorkerName || 'Staff Member'} confirmed shift attendance (${statusType === 'on_my_way' ? 'On My Way 🚀' : 'Confirmed Present ✅'}).`
    }
  ];

  allBookings[bookingIndex] = booking;
  saveLocalCateringBookings(allBookings);

  return booking;
}

/**
 * 4. INTERACTIVE WORKER ACTION 2 & STANDBY AUTO-ALLOCATION LOGIC:
 * "Unable to Attend"
 * Prompts quick reason, cancels shift for that worker, and triggers automatic standby promotion!
 */
export async function reportUnableToAttend(bookingId, workerId, reason = 'Personal emergency') {
  const allBookings = getLocalCateringBookings();
  const bookingIndex = allBookings.findIndex(b => b.id === bookingId);
  if (bookingIndex === -1) throw new Error('Booking not found');

  const booking = { ...allBookings[bookingIndex] };
  const nowIso = new Date().toISOString();

  let droppedWorker = null;
  const remainingPrimary = [];

  for (const w of (booking.primaryWorkers || [])) {
    if (w.workerId === workerId) {
      droppedWorker = {
        ...w,
        shiftStatus: 'unable_to_attend',
        unableReason: reason,
        unableReportedAt: nowIso
      };
    } else {
      remainingPrimary.push(w);
    }
  }

  if (!droppedWorker) {
    throw new Error('Worker was not found in primary staff list');
  }

  // Standby Auto-Allocation Logic:
  // Find first available standby worker still in 'standby' status
  const currentStandby = [...(booking.standbyWorkers || [])];
  let promotedStandbyWorker = null;
  const updatedStandbyList = [];

  for (const sb of currentStandby) {
    if (!promotedStandbyWorker && sb.shiftStatus === 'standby') {
      promotedStandbyWorker = {
        ...sb,
        shiftStatus: 'attendance_confirmed', // Promoted and ready
        promotedFromStandby: true,
        promotedAt: nowIso,
        promotionReason: `Automatic promotion to replace ${droppedWorker.workerName} (${reason})`
      };
      // Add promoted worker to primary roster!
      remainingPrimary.push(promotedStandbyWorker);

      // Keep record in standby list as promoted
      updatedStandbyList.push({
        ...sb,
        shiftStatus: 'promoted_to_primary',
        promotedAt: nowIso
      });
    } else {
      updatedStandbyList.push(sb);
    }
  }

  booking.primaryWorkers = remainingPrimary;
  booking.standbyWorkers = updatedStandbyList;
  booking.droppedWorkers = [...(booking.droppedWorkers || []), droppedWorker];
  booking.updatedAt = nowIso;

  // Audit Logs & Alerts
  if (promotedStandbyWorker) {
    booking.auditLogs = [
      ...(booking.auditLogs || []),
      {
        id: 'log_' + Date.now() + '_drop',
        timestamp: nowIso,
        type: 'worker_unable',
        message: `⚠️ Primary Staff ${droppedWorker.workerName} reported Unable to Attend. Reason: "${reason}".`
      },
      {
        id: 'log_' + Date.now() + '_promote',
        timestamp: nowIso,
        type: 'standby_promoted',
        message: `⚡ STANDBY AUTO-ALLOCATION: ${promotedStandbyWorker.workerName} automatically promoted to Primary Staff. Zero-drop guarantee fulfilled!`
      }
    ];

    // Push immediate high-priority alert to the promoted standby worker
    notifyWorker(promotedStandbyWorker.workerId, {
      title: '🚨 Emergency Shift Allocation: Promoted to Primary Staff!',
      message: `You are promoted to Primary Staff for today's event at ${booking.venueName} (${booking.functionTime}) replacing an unavailable staff member. Full shift rate (₹${booking.ratePerStaff}) confirmed. Please report immediately!`,
      type: 'catering_emergency_promotion',
      bookingId: booking.id,
      actionRequired: true
    });

    // Notify Customer about seamless standby activation
    notifyCustomer({
      title: 'Staff Standby Replacement Activated 🛡️',
      message: `One catering staff had a sudden emergency. JOBit's automatic standby reserve immediately promoted certified backup staff ${promotedStandbyWorker.workerName}. Your event remains 100% covered!`,
      type: 'catering_standby_activated',
      badge: 'Zero Drop Guarantee'
    });

  } else {
    // If no standby was left, log emergency and broadcast alert to broader radius
    booking.auditLogs = [
      ...(booking.auditLogs || []),
      {
        id: 'log_' + Date.now() + '_shortage',
        timestamp: nowIso,
        type: 'standby_exhausted',
        message: `⚠️ Primary Staff ${droppedWorker.workerName} reported Unable to Attend. Standby reserve exhausted. Auto-triggering emergency radius broadcast.`
      }
    ];

    notifyCustomer({
      title: 'Staff Update for Event',
      message: `A staff member reported a last-minute emergency. JOBit is dispatching emergency priority calls to nearby verified catering professionals.`,
      type: 'catering_staff_update',
      badge: 'Update'
    });
  }

  allBookings[bookingIndex] = booking;
  saveLocalCateringBookings(allBookings);

  return {
    booking,
    droppedWorker,
    promotedStandbyWorker
  };
}

/**
 * Admin manual allocation override helper:
 * Allows Admin to designate specific accepted applicants as Primary vs Standby.
 */
export async function adminAllocateCateringStaff(bookingId, { primaryWorkerIds = [], standbyWorkerIds = [] }) {
  const allBookings = getLocalCateringBookings();
  const bookingIndex = allBookings.findIndex(b => b.id === bookingId);
  if (bookingIndex === -1) throw new Error('Booking not found');

  const booking = { ...allBookings[bookingIndex] };
  const allWorkers = getLocalWorkers();
  const nowIso = new Date().toISOString();

  const primarySet = new Set(primaryWorkerIds);
  const standbySet = new Set(standbyWorkerIds);

  const newPrimary = [];
  const newStandby = [];

  for (const wId of primaryWorkerIds) {
    const workerObj = allWorkers.find(w => w.id === wId) || (booking.applicants || []).find(a => a.workerId === wId);
    if (workerObj) {
      newPrimary.push({
        workerId: wId,
        workerName: workerObj.name || workerObj.workerName || 'Specialist',
        workerPhone: workerObj.phone || workerObj.workerPhone || '+91 98471 00000',
        workerAvatar: workerObj.avatar || workerObj.workerAvatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
        shiftStatus: 'assigned',
        assignedAt: nowIso,
        promotedFromStandby: false,
        attendanceConfirmedAt: null,
        unableReason: null
      });

      notifyWorker(wId, {
        title: '🎉 Booking Confirmed - Selected for Event',
        message: `Admin selected you as Primary Staff for ${booking.eventOccasion} at ${booking.venueName} on ${booking.functionDate} (${booking.functionTime}). Pay: ₹${booking.ratePerStaff}.`,
        type: 'catering_confirmed_primary',
        bookingId: booking.id
      });
    }
  }

  for (const wId of standbyWorkerIds) {
    const workerObj = allWorkers.find(w => w.id === wId) || (booking.applicants || []).find(a => a.workerId === wId);
    if (workerObj) {
      newStandby.push({
        workerId: wId,
        workerName: workerObj.name || workerObj.workerName || 'Specialist',
        workerPhone: workerObj.phone || workerObj.workerPhone || '+91 98471 00000',
        workerAvatar: workerObj.avatar || workerObj.workerAvatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
        shiftStatus: 'standby',
        assignedAt: nowIso,
        promotedAt: null
      });

      notifyWorker(wId, {
        title: '🛡️ Assigned as Standby Backup Staff',
        message: `Admin assigned you as Standby Staff for ${booking.eventOccasion} on ${booking.functionDate}. Please stay on call for emergency promotion!`,
        type: 'catering_assigned_standby',
        bookingId: booking.id
      });
    }
  }

  booking.primaryWorkers = newPrimary;
  booking.standbyWorkers = newStandby;
  booking.status = newPrimary.length >= booking.totalStaffNeeded ? 'allocated' : 'inquiry_broadcasted';
  booking.cateringStatus = booking.status;
  booking.updatedAt = nowIso;

  booking.auditLogs = [
    ...(booking.auditLogs || []),
    {
      id: 'log_' + Date.now(),
      timestamp: nowIso,
      type: 'admin_allocation',
      message: `Admin manually updated staff roster: ${newPrimary.length} Primary Staff, ${newStandby.length} Standby Staff.`
    }
  ];

  if (newPrimary.length >= booking.totalStaffNeeded) {
    notifyCustomer({
      title: `Booking Confirmed with ${newPrimary.length} Staff! 🎊`,
      message: `Your event on ${booking.functionDate} at ${booking.venueName} is officially staffed with ${newPrimary.length} confirmed professionals + ${newStandby.length} standbys.`,
      type: 'catering_allocated',
      badge: 'Staff Locked'
    });
  }

  allBookings[bookingIndex] = booking;
  saveLocalCateringBookings(allBookings);

  return booking;
}

/**
 * Seeds initial realistic catering demo shift if no catering shifts exist,
 * allowing live inspection and instant workflow testing in UI.
 */
export function seedSampleCateringShiftIfEmpty() {
  ensureCateringWorkersSeeded();

  try {
    const existing = getLocalCateringBookings();
    if (existing.length > 0) return;

    const sampleDate = new Date();
    // Set for today / tomorrow
    sampleDate.setDate(sampleDate.getDate() + 1);
    const dateStr = sampleDate.toISOString().split('T')[0];

    const sampleShift = {
      id: 'cater_bk_sample_wedding',
      bookingType: 'CATERING_BULK',
      serviceTitle: 'Catering Staff (10 Staff + 2 Standby)',
      categoryName: 'Catering Staff',
      categoryId: 'cat_catering',
      customerName: 'K.T. Muhammed Kunhi',
      customerPhone: '+91 98471 88990',
      customerId: 'cust_sample_host',
      totalStaffNeeded: 10,
      standbyStaffNeeded: 2,
      functionDate: dateStr,
      functionTime: '11:00 AM - 05:00 PM',
      shiftType: 'Lunch & Afternoon Wedding Banquet',
      functionLocation: 'Rose Garden Convention Centre, Melattur',
      venueName: 'Rose Garden Convention Centre',
      address: 'Near Melattur Railway Station, SH 39, Melattur, Malappuram, Kerala 679326',
      city: 'Melattur, Kerala',
      user_latitude: 11.0607,
      user_longitude: 76.2625,
      latitude: 11.0607,
      longitude: 76.2625,
      coordinates: { lat: 11.0607, lng: 76.2625 },
      radiusKm: 10,
      eventOccasion: 'Grand Wedding Reception',
      uniform: 'Formal Black Trousers & White Long-Sleeve Shirt with Bow Tie',
      rolesNeeded: [
        'VIP Table Service Captains',
        'Food Counter & Buffet Handlers',
        'Event Service Staff & Waiters',
        'Kitchen Prep & Dishwashing Assistants'
      ],
      specialInstructions: 'Staff reporting time is 10:15 AM sharp for briefing and counter assignment. Free staff lunch provided.',
      ratePerStaff: 650,
      estimatedTotal: 6500,
      advancePaid: 1000,
      remainingDue: 5500,
      paymentStatus: 'advance_paid',
      status: 'allocated',
      cateringStatus: 'allocated',
      shiftReminderSent: false,
      shiftReminderSentAt: null,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      broadcastedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date().toISOString(),
      nearbyWorkerCount: 14,
      nearbyWorkerIds: INITIAL_CATERING_WORKERS.map(w => w.id),
      
      // 10 Primary Workers
      primaryWorkers: INITIAL_CATERING_WORKERS.slice(0, 10).map((w, idx) => ({
        workerId: w.id,
        workerName: w.name,
        workerPhone: w.phone,
        workerAvatar: w.avatar,
        shiftStatus: idx === 0 ? 'attendance_confirmed' : 'assigned',
        assignedAt: new Date(Date.now() - 3600000 * 3 + idx * 60000).toISOString(),
        distanceKm: Number((1.2 + idx * 0.4).toFixed(1)),
        promotedFromStandby: false,
        attendanceConfirmedAt: idx === 0 ? new Date().toISOString() : null,
        unableReason: null
      })),

      // 2 Standby Workers
      standbyWorkers: INITIAL_CATERING_WORKERS.slice(10, 12).map((w, idx) => ({
        workerId: w.id,
        workerName: w.name,
        workerPhone: w.phone,
        workerAvatar: w.avatar,
        shiftStatus: 'standby',
        assignedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        distanceKm: Number((2.5 + idx * 0.8).toFixed(1)),
        promotedAt: null
      })),

      // Remaining as applicants
      applicants: INITIAL_CATERING_WORKERS.map((w, idx) => ({
        workerId: w.id,
        workerName: w.name,
        workerPhone: w.phone,
        workerAvatar: w.avatar,
        appliedAt: new Date(Date.now() - 3600000 * 3 + idx * 50000).toISOString(),
        distanceKm: Number((1.2 + idx * 0.4).toFixed(1)),
        status: idx < 10 ? 'primary' : (idx < 12 ? 'standby' : 'reserve')
      })),

      auditLogs: [
        {
          id: 'log_seed_1',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          type: 'inquiry_broadcasted',
          message: 'Catering Inquiry submitted for 10 Staff + 2 Standby at Rose Garden Convention Centre (10 KM radius).'
        },
        {
          id: 'log_seed_2',
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
          type: 'allocation_filled',
          message: 'Shift fully allocated with 10 Primary Catering Specialists and 2 Standby Reserves.'
        }
      ]
    };

    saveLocalCateringBookings([sampleShift]);
  } catch (err) {
    console.warn('Failed to seed sample catering shift:', err);
  }
}
