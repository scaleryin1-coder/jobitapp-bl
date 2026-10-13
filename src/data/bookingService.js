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

// Get local stored items safely
export function getLocalBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    if (!raw) {
      const defaultList = [
        {
          id: 'bk_sample_1',
          serviceTitle: 'Plumbing Inspection & Repair',
          categoryName: 'Plumbing',
          workerId: 'worker_rajesh',
          workerName: 'Rajesh Sharma',
          workerPhone: '98765 43210',
          workerAvatar: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=300&q=80',
          customerId: 'guest_user',
          customerName: 'Aman Gupta',
          customerPhone: '98765 00001',
          dateTime: 'Today, 02:00 PM - 04:00 PM',
          address: 'Flat 402, Sunshine Heights, Andheri West, Mumbai',
          price: 300,
          status: 'accepted',
          note: 'Kitchen tap dripping continuously',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'bk_sample_2',
          serviceTitle: 'AC Repair & Jet Service',
          categoryName: 'AC Repair',
          workerId: null,
          workerName: null,
          workerPhone: null,
          workerAvatar: null,
          customerId: 'cust_priya',
          customerName: 'Priya Nair',
          customerPhone: '98765 00002',
          dateTime: 'Today, 04:30 PM - 06:30 PM',
          address: 'Villa 18, Palm Meadows, Bandra West, Mumbai',
          price: 450,
          status: 'pending',
          note: 'Cooling coil jet wash needed',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(defaultList));
      return defaultList;
    }
    return JSON.parse(raw);
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
      }, (err) => {
        console.warn('Firestore bookings snapshot error, fallback to local', err);
      });
    } catch (e) {
      console.warn('Firestore subscription failed', e);
    }
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
  const newBooking = {
    id: 'bk_' + Date.now(),
    status: 'pending', // Pending Assignment
    createdAt: new Date().toISOString(),
    broadcastedAt: new Date().toISOString(),
    workerId: null,
    workerName: null,
    workerPhone: null,
    workerAvatar: null,
    ...payload
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
      }, (err) => console.warn('Firestore subscribeServices err', err));
    } catch (err) {
      console.warn('Firestore subscribeServices setup err', err);
    }
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
      }, (err) => console.warn('Firestore subscribeCategories err', err));
    } catch (err) {
      console.warn('Firestore subscribeCategories setup err', err);
    }
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
    idProofUrl: 'https://images.unsplash.com/photo-1554415707-9e4901f4c7d0?auto=format&fit=crop&w=600&q=80',
    idProofType: 'Aadhaar Card Front & Back',
    bankName: 'State Bank of India',
    accountHolderName: 'Anil Kumar K',
    accountNumber: '38291048291',
    ifscCode: 'SBIN0008421',
    upiId: 'anilkumar@oksbi',
    status: 'pending_verification', // 'pending_verification' | 'verified' | 'rejected'
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
    idProofUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    idProofType: 'Government Voter ID',
    bankName: 'Federal Bank',
    accountHolderName: 'Fathima Beevi T',
    accountNumber: '1420010049281',
    ifscCode: 'FDRL0001420',
    upiId: 'fathimabeevi@federal',
    status: 'pending_verification',
    appliedAt: new Date(Date.now() - 14400000).toISOString()
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
    return Array.isArray(parsed) ? parsed : initialPendingWorkers;
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
      }, (err) => console.warn('Firestore subscribePendingWorkers err', err));
    } catch (err) {}
  }

  return () => {
    window.removeEventListener(EVENT_PENDING_WORKERS_CHANGED, handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
    unsubFirestore();
  };
}

// Multi-step Worker Onboarding Submission
export async function registerWorkerOnboarding(onboardingData) {
  const current = getPendingWorkers();
  const appId = 'app_worker_' + Date.now();
  
  const newApplication = {
    id: appId,
    status: 'pending_verification',
    appliedAt: new Date().toISOString(),
    rating: 5.0,
    jobsCompleted: 0,
    isOnline: false,
    ...onboardingData
  };

  const updated = [newApplication, ...current];
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
        workerStatus: 'pending_verification',
        ...newApplication
      };
      localStorage.setItem('jobit_registered_users', JSON.stringify(users));
    }
  } catch {}

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'pending_workers', appId), {
        ...newApplication,
        serverTimestamp: serverTimestamp()
      });
      await setDoc(doc(db, 'users', appId), {
        ...newApplication,
        role: 'worker',
        workerStatus: 'pending_verification'
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore registerWorkerOnboarding fallback', e);
    }
  }

  return newApplication;
}

// Admin approves a worker registration
export async function approveWorkerApplication(workerAppId) {
  const pending = getPendingWorkers();
  const target = pending.find(p => p.id === workerAppId);
  if (!target) return false;

  // 1. Remove from pending list or mark verified
  const updatedPending = pending.filter(p => p.id !== workerAppId);
  savePendingWorkers(updatedPending);

  // 2. Add to active verified workers roster
  const activeWorkers = getLocalWorkers();
  const verifiedWorker = {
    id: target.id.replace('app_', ''),
    originalAppId: target.id,
    name: target.name,
    phone: target.phone,
    altPhone: target.altPhone || '',
    email: target.email,
    gender: target.gender || 'Not specified',
    dob: target.dob || '',
    skill: target.categoryName || 'Home Services Pro',
    categoryName: target.categoryName,
    categoryId: target.categoryId,
    subSkills: target.subSkills || [],
    experience: target.experience ? `${target.experience} years` : '3 years',
    baseRate: target.baseRate || 300,
    address: target.address,
    city: target.city || 'Melattur, Kerala',
    pincode: target.pincode || '',
    serviceRadius: target.serviceRadius || '15',
    aadhaarNumber: target.aadhaarNumber || 'Verified',
    idProofUrl: target.idProofUrl || '',
    bankName: target.bankName || '',
    accountNumber: target.accountNumber || '',
    ifscCode: target.ifscCode || '',
    upiId: target.upiId || '',
    rating: target.rating || 5.0,
    jobsCompleted: 0,
    isOnline: true, // Auto set online upon approval
    status: 'available',
    workerStatus: 'verified',
    approvedAt: new Date().toISOString(),
    avatar: target.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
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
        workerStatus: 'verified'
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
        const merged = { ...parsed, ...verifiedWorker, workerStatus: 'verified' };
        localStorage.setItem('jobit_user', JSON.stringify(merged));
      }
    }
  } catch {}

  // 5. Sync to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'pending_workers', workerAppId));
      await setDoc(doc(db, 'workers', verifiedWorker.id), verifiedWorker, { merge: true });
      await setDoc(doc(db, 'users', verifiedWorker.id), {
        ...verifiedWorker,
        role: 'worker',
        workerStatus: 'verified'
      }, { merge: true });
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
      await updateDoc(doc(db, 'pending_workers', workerAppId), {
        status: 'rejected',
        workerStatus: 'rejected',
        rejectedReason: reason,
        rejectedAt: new Date().toISOString()
      });
    } catch {}
  }
}

// Admin delete an active worker
export async function adminDeleteWorker(workerId) {
  const workers = getLocalWorkers();
  const updated = workers.filter(w => w.id !== workerId);
  saveLocalWorkers(updated);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'workers', workerId));
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

