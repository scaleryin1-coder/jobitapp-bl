import { db, isFirebaseConfigured } from '../firebase';
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
import { initialWorkers, initialServices, initialCategories, initialDailyGigs, initialPortfolios } from './seedData';
import { ALL_MAIN_CATEGORIES, isPortfolioCategory } from './categoriesData';

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
  return String(loc).split(',')[0].trim().toLowerCase();
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
 * Mask telephone number for privacy in Customer and Worker panels
 */
export function maskPhoneNumber(phone) {
  if (!phone) return 'Protected • In-App Call Only';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 6) return 'Protected • In-App Call Only';
  return `+91 ${clean.slice(0, 2)}••• ••${clean.slice(-2)} (In-App Only)`;
}

/**
 * Find all approved workers registered for a specific category in an area
 */
export function getWorkersForCategoryInLocation(category, location, workersList) {
  const workers = (Array.isArray(workersList) && workersList.length > 0) ? workersList : getLocalWorkers();
  const normLoc = normalizeLocation(location || localStorage.getItem('jobit_user_location') || 'Melattur, Kerala');
  
  const catName = (typeof category === 'string' ? category : (category?.name || category?.title || '')).toLowerCase().trim();
  const catId = (typeof category === 'object' ? (category?.id || category?.categoryId || '') : '').toLowerCase().trim();

  return (workers || []).filter((w) => {
    if (!w) return false;
    const isApproved = w.status === 'approved' || w.workerStatus === 'approved';
    if (!isApproved) return false;

    // Location matching: worker's city / address must match current location
    const workerLoc = normalizeLocation(w.city || w.address || w.serviceArea || '');
    const locMatch = !normLoc || !workerLoc || workerLoc.includes(normLoc) || normLoc.includes(workerLoc);
    if (!locMatch) return false;

    // Category / Skill matching
    const wSkill = (w.skill || '').toLowerCase().trim();
    const wCatName = (w.categoryName || '').toLowerCase().trim();
    const wCatId = (w.categoryId || '').toLowerCase().trim();

    const matchesCat = (
      (catId && wCatId && (catId === wCatId || catId.includes(wCatId) || wCatId.includes(catId))) ||
      (catName && wCatName && (catName === wCatName || catName.includes(wCatName) || wCatName.includes(catName))) ||
      (catName && wSkill && (catName.includes(wSkill) || wSkill.includes(catName))) ||
      (catName.includes('ac') && (wSkill.includes('ac') || wCatName.includes('ac'))) ||
      (catName.includes('plumb') && (wSkill.includes('plumb') || wCatName.includes('plumb'))) ||
      (catName.includes('elect') && (wSkill.includes('elect') || wCatName.includes('elect'))) ||
      (catName.includes('carp') && (wSkill.includes('carp') || wCatName.includes('carp'))) ||
      (catName.includes('paint') && (wSkill.includes('paint') || wCatName.includes('paint'))) ||
      (catName.includes('clean') && (wSkill.includes('clean') || wCatName.includes('clean'))) ||
      (catName.includes('beauty') && (wSkill.includes('beauty') || wCatName.includes('beauty'))) ||
      (catName.includes('mehndi') && (wSkill.includes('mehndi') || wCatName.includes('mehndi') || wSkill.includes('henna'))) ||
      ((catName.includes('tree') || catName.includes('coconut')) && (wSkill.includes('tree') || wSkill.includes('coconut') || wSkill.includes('തെങ്ങ്')))
    );

    return matchesCat;
  });
}

/**
 * Check if category is available in a location.
 * In launch rollout areas (Melattur, Pattikkad, Pandikkad, and Kerala state), categories in the catalog are live and active.
 * Ensures state hydration/refresh never falsely resets catalog categories to Coming Soon.
 */
export function isCategoryAvailableInLocation(category, location, workersList) {
  if (!category) return true;
  const normLoc = normalizeLocation(location || localStorage.getItem('jobit_user_location') || 'Melattur, Kerala');
  
  // 1. All categories in primary rollout and launch areas are live and bookable
  if (isLocationInRollout(normLoc) || isLocationInRollout(location)) {
    return true;
  }

  // 2. Otherwise check for dynamically registered approved workers in that specific location
  const workers = (Array.isArray(workersList) && workersList.length > 0) ? workersList : getLocalWorkers();
  const matched = getWorkersForCategoryInLocation(category, location, workers);
  if (matched.length > 0) {
    return true;
  }

  // 3. Fallback: On page refresh / initial hydration when workers list is still loading (0 items),
  // ensure core catalog categories remain live without resetting to Coming Soon
  if (!workersList || workersList.length === 0) {
    return true;
  }

  return false;
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
        return {
          ...b,
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

// Real-time listener for bookings (Firestore with local fallback & sync)
export function subscribeBookings(callback) {
  let unsubFirestore = null;

  const handleLocalChange = () => {
    callback(getLocalBookings());
  };

  window.addEventListener(EVENT_BOOKINGS_CHANGED, handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  // Initial trigger from local storage
  callback(getLocalBookings());

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

// Customer initiates booking -> Flat ₹99 visiting fee with broadcast dispatch
export async function createBooking(payload) {
  // If payload already specifies a chosen worker (from a portfolio trade), keep it
  const isPreAssigned = Boolean(payload.workerId && payload.workerName);

  const newBooking = {
    id: 'bk_' + Date.now(),
    ...payload,
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

  // 1. Immediately update local state & dispatch custom event for instant cross-component sync
  const current = getLocalBookings();
  const updated = [newBooking, ...current];
  saveLocalBookings(updated);

  // 2. Sync to Firestore with a fast timeout safety guarantee so network lag never freezes UI
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
// 'pending' -> 'accepted' -> 'on_the_way' -> 'in_progress' -> 'completed' (or 'cancelled')
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

// ==========================================
// DYNAMIC SERVICES DATA & OPERATIONS
// ==========================================

export function getLocalServices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SERVICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(initialServices || []));
      return initialServices || [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Gracefully sync local services if updated asset imagery/details are provided in seedData
      const existingIds = new Set(parsed.map(s => s.id));
      const synced = parsed.map(serv => {
        const init = (initialServices || []).find(i => i.id === serv.id);
        if (init) {
          return {
            ...serv,
            title: init.title || serv.title,
            categoryName: init.categoryName || serv.categoryName,
            subCategories: init.subCategories || serv.subCategories,
            tags: init.tags || serv.tags,
            heroImage: (init.heroImage && init.heroImage.startsWith('/assets/images/')) ? init.heroImage : (serv.heroImage || init.heroImage)
          };
        }
        return serv;
      });
      // Add any new initialServices not yet present in localStorage
      const missing = (initialServices || []).filter(s => !existingIds.has(s.id));
      const merged = [...synced, ...missing];
      return merged;
    }
    return initialServices || [];
  } catch {
    return initialServices || [];
  }
}

export function saveLocalServices(servicesList) {
  try {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(servicesList));
    window.dispatchEvent(new CustomEvent(EVENT_SERVICES_CHANGED, { detail: servicesList }));
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

  // Initial local state push
  callback(getLocalServices());

  // Firestore sync if configured
  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(collection(db, 'services'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          saveLocalServices(list);
          callback(list);
        }
      }, () => {});
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

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'services', formatted.id), {
        ...formatted,
        serverTimestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn('Firestore adminAddService fallback', e);
    }
  }

  return formatted;
}

export async function adminUpdateService(serviceId, updates) {
  const current = getLocalServices();
  const updated = current.map(s => {
    if (s.id === serviceId) {
      const merged = { ...s, ...updates };
      if (updates.price !== undefined) {
        merged.price = Number(updates.price);
      }
      if (updates.heroImage) {
        merged.heroImage = updates.heroImage;
        merged.imageUrl = updates.heroImage;
        if (!merged.gallery || merged.gallery.length === 0) {
          merged.gallery = [updates.heroImage];
        } else {
          merged.gallery = [updates.heroImage, ...merged.gallery.slice(1)];
        }
      }
      if (updates.subCategory && (!merged.subCategories || merged.subCategories.length === 0)) {
        merged.subCategories = [updates.subCategory];
      }
      merged.updatedAt = new Date().toISOString();
      return merged;
    }
    return s;
  });

  saveLocalServices(updated);

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'services', serviceId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore adminUpdateService fallback', e);
    }
  }
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
        const key = (c.name || '').toLowerCase();
        if (key) {
          const existing = map.get(key);
          map.set(key, { ...existing, ...c });
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
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
      });
    } catch (e) {
      console.warn('Firestore adminAddCategory fallback', e);
    }
  }

  return formatted;
}

export async function adminUpdateCategory(catId, updates) {
  const current = getLocalCategories();
  const updated = current.map(c => c.id === catId ? { ...c, ...updates } : c);
  saveLocalCategories(updated);

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'categories', catId), updates);
    } catch (e) {
      console.warn('Firestore adminUpdateCategory fallback', e);
    }
  }
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
    status: 'approved',
    workerStatus: 'approved',
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



