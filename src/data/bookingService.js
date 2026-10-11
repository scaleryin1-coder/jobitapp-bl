import { db, isFirebaseConfigured } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { initialWorkers } from './seedData';

const STORAGE_KEY_BOOKINGS = 'jobit_bookings';
const STORAGE_KEY_WORKERS = 'jobit_workers';
const EVENT_BOOKINGS_CHANGED = 'jobit_bookings_changed';
const EVENT_WORKERS_CHANGED = 'jobit_workers_changed';

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
          address: 'Flat 402, Sunshine Heights, Celina, Delaware',
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
          address: 'Villa 18, Palm Meadows, Celina, Delaware',
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

  // Update local state first for immediate UI response
  const current = getLocalBookings();
  const updated = [newBooking, ...current];
  saveLocalBookings(updated);

  // Sync to Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'bookings', newBooking.id), {
        ...newBooking,
        serverTimestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn('Firestore create booking fallback', e);
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
