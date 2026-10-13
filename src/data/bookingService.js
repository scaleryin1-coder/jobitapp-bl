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
import { initialWorkers, initialServices, initialCategories } from './seedData';

const STORAGE_KEY_BOOKINGS = 'jobit_bookings';
const STORAGE_KEY_WORKERS = 'jobit_workers';
const STORAGE_KEY_PENDING_WORKERS = 'jobit_pending_workers';
const STORAGE_KEY_CUSTOMERS = 'jobit_customers';
const STORAGE_KEY_SERVICES = 'jobit_services';
const STORAGE_KEY_CATEGORIES = 'jobit_categories';

const EVENT_BOOKINGS_CHANGED = 'jobit_bookings_changed';
const EVENT_WORKERS_CHANGED = 'jobit_workers_changed';
const EVENT_PENDING_WORKERS_CHANGED = 'jobit_pending_workers_changed';
const EVENT_CUSTOMERS_CHANGED = 'jobit_customers_changed';
const EVENT_SERVICES_CHANGED = 'jobit_services_changed';
const EVENT_CATEGORIES_CHANGED = 'jobit_categories_changed';

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
  const total = Number(rawPrice) > 0 ? Number(rawPrice) : 650;
  // Standard advance inspection fee
  const advancePaid = total >= 250 ? 99 : 49;
  const remainingDue = total - advancePaid;

  // Internal split calculation:
  // For total === 650: Worker share is exactly 500, Platform fee is exactly 150
  let platformFee = Math.round(total * 0.2308);
  if (total === 650) {
    platformFee = 150;
  }
  const workerCharge = total - platformFee;

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
    let list = [];
    if (!raw) {
      list = [
        {
          id: 'bk_sample_1',
          serviceTitle: 'Plumbing Inspection & Repair',
          categoryName: 'Plumbing',
          workerId: 'worker_rajesh',
          workerName: 'Rajesh Sharma',
          workerTitle: 'JOBit Verified Technician',
          workerPhone: '98765 43210',
          workerAvatar: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=300&q=80',
          customerId: 'guest_user',
          customerName: 'Aman Gupta',
          customerPhone: '98765 00001',
          dateTime: 'Today, 02:00 PM - 04:00 PM',
          address: 'Flat 402, Sunshine Heights, Andheri West, Mumbai',
          price: 650,
          totalServiceCharge: 650,
          totalWorkFee: 650,
          workerCharge: 500,
          platformFee: 150,
          advancePaid: 99,
          remainingDue: 551,
          status: 'accepted',
          note: 'Kitchen tap dripping continuously and pipe fitting',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'bk_sample_2',
          serviceTitle: 'AC Repair & Jet Service',
          categoryName: 'AC Repair',
          workerId: null,
          workerName: null,
          workerTitle: 'JOBit Verified Technician',
          workerPhone: null,
          workerAvatar: null,
          customerId: 'cust_priya',
          customerName: 'Priya Nair',
          customerPhone: '98765 00002',
          dateTime: 'Today, 04:30 PM - 06:30 PM',
          address: 'Villa 18, Palm Meadows, Bandra West, Mumbai',
          price: 650,
          totalServiceCharge: 650,
          totalWorkFee: 650,
          workerCharge: 500,
          platformFee: 150,
          advancePaid: 99,
          remainingDue: 551,
          status: 'pending',
          note: 'Cooling coil jet wash needed',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(list));
      return list;
    }
    const parsed = JSON.parse(raw);
    list = Array.isArray(parsed) ? parsed : [];
    // Ensure all stored bookings have computed billing attributes
    return list.map(b => {
      const billing = calculateBillingDetails(b.totalServiceCharge || b.price || 650);
      return {
        ...b,
        price: b.price || billing.totalServiceCharge,
        totalServiceCharge: b.totalServiceCharge || billing.totalServiceCharge,
        totalWorkFee: b.totalWorkFee || billing.totalServiceCharge,
        workerCharge: b.workerCharge || billing.workerCharge,
        platformFee: b.platformFee || billing.platformFee,
        advancePaid: b.advancePaid !== undefined ? b.advancePaid : billing.advancePaid,
        remainingDue: b.remainingDue !== undefined ? b.remainingDue : billing.remainingDue,
        workerTitle: b.workerTitle || 'JOBit Verified Technician'
      };
    });
  } catch {
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
      localStorage.setItem(STORAGE_KEY_WORKERS, JSON.stringify(initialWorkers));
      return initialWorkers;
    }
    return JSON.parse(raw);
  } catch {
    return initialWorkers;
  }
}

export function saveLocalWorkers(workers) {
  try {
    localStorage.setItem(STORAGE_KEY_WORKERS, JSON.stringify(workers));
    window.dispatchEvent(new CustomEvent(EVENT_WORKERS_CHANGED, { detail: workers }));
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
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Sort by creation time descending
          list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          saveLocalBookings(list);
          callback(list);
        } else {
          // If Firestore collection is empty, push initial local data to Firestore
          const initial = getLocalBookings();
          initial.forEach(async (b) => {
            try {
              await setDoc(doc(db, 'bookings', b.id), b);
            } catch {}
          });
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
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          saveLocalWorkers(list);
          callback(list);
        } else {
          // Seed initial workers to Firestore
          const initial = getLocalWorkers();
          initial.forEach(async (w) => {
            try {
              await setDoc(doc(db, 'workers', w.id), w);
            } catch {}
          });
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

// Customer initiates booking -> broadcasts as 'pending'
export async function createBooking(payload) {
  const billing = calculateBillingDetails(payload.price || payload.totalServiceCharge || 650);

  const newBooking = {
    id: 'bk_' + Date.now(),
    status: 'pending', // Pending Assignment
    createdAt: new Date().toISOString(),
    broadcastedAt: new Date().toISOString(),
    workerId: null,
    workerName: null,
    workerPhone: null,
    workerAvatar: null,
    workerTitle: 'JOBit Verified Technician',
    ...payload,
    price: billing.totalServiceCharge,
    totalServiceCharge: billing.totalServiceCharge,
    totalWorkFee: billing.totalServiceCharge,
    workerCharge: billing.workerCharge,
    platformFee: billing.platformFee,
    advancePaid: billing.advancePaid,
    remainingDue: billing.remainingDue
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
      // Gracefully sync local services if updated asset imagery is provided in seedData
      const synced = parsed.map(serv => {
        const init = (initialServices || []).find(i => i.id === serv.id);
        if (init && init.heroImage && init.heroImage.startsWith('/assets/images/')) {
          return { ...serv, heroImage: init.heroImage, title: init.title || serv.title };
        }
        return serv;
      });
      return synced;
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
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(initialCategories || []));
      return initialCategories || [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : (initialCategories || []);
  } catch {
    return initialCategories || [];
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

export const initialPendingWorkers = [
  {
    id: 'app_worker_anil',
    name: 'Anil Kumar',
    phone: '98471 23456',
    altPhone: '98471 99880',
    email: 'anil.electric@gmail.com',
    gender: 'Male',
    dob: '1992-06-15',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
    address: 'Near Old Bus Stand, Market Road, Melattur',
    city: 'Melattur, Kerala',
    pincode: '679326',
    serviceRadius: '25',
    categoryName: 'Electrician',
    categoryId: 'cat_electrician',
    subSkills: ['House Wiring', 'Distribution Board Repair', 'Inverter Installation', 'Switchboard Repair', 'Appliance Earthing'],
    experience: '7',
    baseRate: 350,
    aadhaarNumber: '7845 2319 8812',
    aadhaarDocUrl: 'https://images.unsplash.com/photo-1554415707-9e4901f4c7d0?auto=format&fit=crop&w=600&q=80',
    drivingLicenseNumber: 'KL-10-2018-0045129',
    drivingLicenseDocUrl: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80',
    idProofUrl: 'https://images.unsplash.com/photo-1554415707-9e4901f4c7d0?auto=format&fit=crop&w=600&q=80',
    idProofType: 'Aadhaar Card Front & Back',
    bankName: 'State Bank of India',
    accountHolderName: 'Anil Kumar K',
    accountNumber: '38291048291',
    ifscCode: 'SBIN0008421',
    upiId: 'anilkumar@oksbi',
    status: 'pending',
    workerStatus: 'pending',
    appliedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'app_worker_fathima',
    name: 'Fathima Beevi',
    phone: '98472 88771',
    altPhone: '98472 55443',
    email: 'fathima.cleanpro@gmail.com',
    gender: 'Female',
    dob: '1995-11-20',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    address: 'Opposite Community Health Center, Perinthalmanna',
    city: 'Perinthalmanna, Kerala',
    pincode: '679322',
    serviceRadius: '15',
    categoryName: 'Cleaning',
    categoryId: 'cat_cleaning',
    subSkills: ['Deep Home Cleaning', 'Kitchen Degreasing', 'Bathroom Sanitization', 'Sofa Shampooing'],
    experience: '5',
    baseRate: 400,
    aadhaarNumber: '8912 4432 1029',
    aadhaarDocUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    drivingLicenseNumber: 'KL-53-2020-0081290',
    drivingLicenseDocUrl: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80',
    idProofUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    idProofType: 'Government Voter ID',
    bankName: 'Federal Bank',
    accountHolderName: 'Fathima Beevi T',
    accountNumber: '1420010049281',
    ifscCode: 'FDRL0001420',
    upiId: 'fathimabeevi@federal',
    status: 'pending',
    workerStatus: 'pending',
    appliedAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'app_worker_zaf',
    name: 'Zaf',
    phone: '98473 11223',
    altPhone: '98473 44556',
    email: 'zaf.acservice@gmail.com',
    gender: 'Male',
    dob: '1994-03-12',
    avatar: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
    address: 'Near Town Mosque, Main Road, Melattur',
    city: 'Melattur, Kerala',
    pincode: '679326',
    serviceRadius: '20',
    categoryName: 'AC Service',
    categoryId: 'cat_ac_repair',
    subSkills: ['AC Jet Wash', 'Gas Charging', 'Compressor Diagnosis', 'Split AC Installation'],
    experience: '6',
    baseRate: 450,
    aadhaarNumber: '6543 9812 3456',
    aadhaarDocUrl: 'https://images.unsplash.com/photo-1554415707-9e4901f4c7d0?auto=format&fit=crop&w=600&q=80',
    drivingLicenseNumber: 'KL-10-2019-0098712',
    drivingLicenseDocUrl: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80',
    idProofUrl: 'https://images.unsplash.com/photo-1554415707-9e4901f4c7d0?auto=format&fit=crop&w=600&q=80',
    idProofType: 'Aadhaar Card Front & Back',
    bankName: 'Canara Bank',
    accountHolderName: 'Zafiq Rahman',
    accountNumber: '0834101038291',
    ifscCode: 'CNRB0000834',
    upiId: 'zaf@okcanara',
    status: 'pending',
    workerStatus: 'pending',
    appliedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export function getPendingWorkers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING_WORKERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PENDING_WORKERS, JSON.stringify(initialPendingWorkers));
      return initialPendingWorkers;
    }
    const parsed = JSON.parse(raw);
    let list = Array.isArray(parsed) ? parsed : initialPendingWorkers;
    // If Zaf isn't in the list and hasn't been approved/rejected, ensure our 3 default candidates are available
    if (!list.some(p => p.id === 'app_worker_zaf' || p.name === 'Zaf')) {
      const zaf = initialPendingWorkers.find(p => p.id === 'app_worker_zaf');
      if (zaf) {
        list = [...list, zaf];
        localStorage.setItem(STORAGE_KEY_PENDING_WORKERS, JSON.stringify(list));
      }
    }
    return list;
  } catch {
    return initialPendingWorkers;
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
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          savePendingWorkers(list);
          callback(list);
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

// Multi-step Worker Onboarding Submission - Fast, persistent and non-hanging
export async function registerWorkerOnboarding(onboardingData) {
  const current = getPendingWorkers();
  const appId = 'app_worker_' + Date.now();
  
  const newApplication = {
    id: appId,
    status: 'pending',
    workerStatus: 'pending',
    appliedAt: new Date().toISOString(),
    rating: 5.0,
    jobsCompleted: 0,
    isOnline: false,
    ...onboardingData,
    // Guarantee status is strictly 'pending'
    status: 'pending',
    workerStatus: 'pending'
  };

  const updated = [newApplication, ...current.filter(p => p.id !== appId)];
  savePendingWorkers(updated);

  // Also save in user profiles table as pending worker so they can log in
  try {
    const cleanTen = (onboardingData.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanTen) {
      const rawUsers = localStorage.getItem('jobit_registered_users');
      const users = rawUsers ? JSON.parse(rawUsers) : {};
      users[cleanTen] = {
        uid: appId,
        workerId: appId,
        role: 'worker',
        status: 'pending',
        workerStatus: 'pending',
        ...newApplication
      };
      localStorage.setItem('jobit_registered_users', JSON.stringify(users));
    }
  } catch {}

  // Sync to database with safe timeout so it never blocks UI indefinitely
  if (isFirebaseConfigured && db) {
    try {
      await safeDbPromise(
        Promise.all([
          setDoc(doc(db, 'pending_workers', appId), {
            ...newApplication,
            submittedAt: new Date().toISOString()
          }),
          setDoc(doc(db, 'users', appId), {
            ...newApplication,
            role: 'worker',
            status: 'pending',
            workerStatus: 'pending'
          }, { merge: true })
        ]),
        2500
      );
    } catch (e) {
      console.warn('Firestore registerWorkerOnboarding fallback', e);
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
  const verifiedWorker = {
    id: target.id.replace('app_', ''),
    originalAppId: target.id,
    name: target.name,
    phone: target.phone,
    altPhone: target.altPhone || '',
    email: target.email || `${(target.name || 'pro').toLowerCase().replace(/\s+/g, '')}@jobit.com`,
    gender: target.gender || 'Not specified',
    dob: target.dob || '',
    skill: target.categoryName || target.skill || 'Home Services Pro',
    categoryName: target.categoryName || target.skill,
    categoryId: target.categoryId || 'cat_general',
    subSkills: target.subSkills || [],
    experience: target.experience ? `${target.experience} years` : '3 years',
    baseRate: target.baseRate || 350,
    address: target.address || '',
    city: target.city || 'Melattur, Kerala',
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
    isOnline: true, // Auto set online upon approval
    status: 'approved',
    workerStatus: 'approved',
    approvedAt: new Date().toISOString(),
    avatar: target.avatar || target.photo || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
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
        role: 'worker',
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

  // 5. Sync to database with safe timeout
  if (isFirebaseConfigured && db) {
    try {
      await safeDbPromise(
        Promise.all([
          deleteDoc(doc(db, 'pending_workers', workerAppId)),
          setDoc(doc(db, 'workers', verifiedWorker.id), verifiedWorker, { merge: true }),
          setDoc(doc(db, 'users', verifiedWorker.id), {
            ...verifiedWorker,
            role: 'worker',
            status: 'approved',
            workerStatus: 'approved'
          }, { merge: true })
        ]),
        2500
      );
    } catch (e) {
      console.warn('Firestore approveWorker fallback', e);
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

