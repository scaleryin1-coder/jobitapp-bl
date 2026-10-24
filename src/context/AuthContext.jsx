import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { supabase, isSupabaseConfigured } from '../supabase';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { clearAllBookingAndUserData } from '../data/bookingService';

const defaultAuthContext = {
  currentUser: null,
  loading: false,
  loginWithPhone: async () => null,
  loginWithPassword: async () => null,
  registerWithPhoneAndPassword: async () => null,
  checkPhoneRegistered: async () => ({ isRegistered: false }),
  loginAsWorker: async () => null,
  loginAsAdmin: async () => null,
  updateUserProfile: async () => {},
  logout: async () => {},
  isFirebaseConfigured: false
};

const AuthContext = createContext(defaultAuthContext);

// Safe database operation wrapper to prevent network hangs when backend is offline
const safeDbPromise = (promise, timeoutMs = 1500) => {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs))
  ]).catch(() => null);
};

export function normalizePhoneE164(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  const tenDigits = digits.slice(-10);
  if (!tenDigits || tenDigits.length !== 10) return '';
  return `+91${tenDigits}`;
}

export function getPhoneQueryVariants(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  const tenDigits = digits.slice(-10);
  if (!tenDigits || tenDigits.length !== 10) return [];
  return [
    `+91${tenDigits}`,
    `+91 ${tenDigits}`,
    tenDigits,
    `91${tenDigits}`
  ];
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('jobit_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const getLocalUserByPhone = (cleanTenDigits) => {
    try {
      const raw = localStorage.getItem('jobit_registered_users');
      const users = raw ? JSON.parse(raw) : {};
      return users[cleanTenDigits] || null;
    } catch {
      return null;
    }
  };

  const getLocalUserByIdentifier = (identifier) => {
    if (!identifier) return null;
    try {
      const raw = localStorage.getItem('jobit_registered_users');
      const users = raw ? JSON.parse(raw) : {};
      const cleanDigits = String(identifier).replace(/\D/g, '').slice(-10);
      if (cleanDigits.length === 10 && users[cleanDigits]) {
        return users[cleanDigits];
      }
      const lower = String(identifier).trim().toLowerCase();
      const allUsers = Object.values(users);
      return allUsers.find(u => 
        (u.username && u.username.toLowerCase() === lower) ||
        (u.name && u.name.toLowerCase() === lower) ||
        (u.email && u.email.toLowerCase() === lower) ||
        (u.phone && u.phone.replace(/\D/g, '').slice(-10) === cleanDigits && cleanDigits.length === 10)
      ) || null;
    } catch {
      return null;
    }
  };

  const saveLocalUserByPhone = (cleanTenDigits, userProfile) => {
    try {
      const raw = localStorage.getItem('jobit_registered_users');
      const users = raw ? JSON.parse(raw) : {};
      users[cleanTenDigits] = userProfile;
      localStorage.setItem('jobit_registered_users', JSON.stringify(users));
    } catch {}
  };

  /**
   * Comprehensive cross-device database query to fetch an existing user/worker profile.
   * Checks Firestore (users, workers, pending_workers) and Supabase (users, profiles, workers).
   */
  const fetchRemoteUserProfile = async (phoneOrIdentifier, optionalUid = '') => {
    if (!phoneOrIdentifier && !optionalUid) return null;

    const rawDigits = String(phoneOrIdentifier || '').replace(/\D/g, '');
    const cleanTenDigits = rawDigits.slice(-10);

    // Direct Admin Rule: 8289968045 is ALWAYS Master Admin
    if (cleanTenDigits === '8289968045') {
      return {
        uid: 'admin_master',
        name: 'Master Admin',
        email: 'admin@jobit.com',
        phone: '+918289968045',
        role: 'admin',
        city: 'Headquarters'
      };
    }

    const queryVariants = cleanTenDigits && cleanTenDigits.length === 10
      ? getPhoneQueryVariants(cleanTenDigits)
      : [];

    let remoteUser = null;
    let remoteWorker = null;

    // 1. Check Firestore (users, workers, pending_workers)
    if (isFirebaseConfigured && db) {
      try {
        // Query users collection by phone variants
        if (queryVariants.length > 0) {
          const userQuerySnap = await safeDbPromise(
            getDocs(query(collection(db, 'users'), where('phone', 'in', queryVariants))),
            2000
          );
          if (userQuerySnap && !userQuerySnap.empty) {
            const first = userQuerySnap.docs[0];
            remoteUser = { uid: first.id, ...first.data() };
          }
        }

        // Query users by direct doc ID usr_XXXXXXXXXX
        if (!remoteUser && cleanTenDigits && cleanTenDigits.length === 10) {
          const snap = await safeDbPromise(getDoc(doc(db, 'users', 'usr_' + cleanTenDigits)), 1500);
          if (snap && snap.exists && snap.exists()) {
            remoteUser = { uid: 'usr_' + cleanTenDigits, ...snap.data() };
          }
        }

        // Query users by optionalUid
        if (!remoteUser && optionalUid) {
          const uidSnap = await safeDbPromise(getDoc(doc(db, 'users', optionalUid)), 1500);
          if (uidSnap && uidSnap.exists && uidSnap.exists()) {
            remoteUser = { uid: optionalUid, ...uidSnap.data() };
          }
        }

        // Query workers collection by phone variants
        if (queryVariants.length > 0) {
          const workersSnap = await safeDbPromise(
            getDocs(query(collection(db, 'workers'), where('phone', 'in', queryVariants))),
            2000
          );
          if (workersSnap && !workersSnap.empty) {
            const wDoc = workersSnap.docs[0].data();
            remoteWorker = { id: workersSnap.docs[0].id, ...wDoc };
          }

          // Check pending_workers collection if not found in workers
          if (!remoteWorker) {
            const pendingSnap = await safeDbPromise(
              getDocs(query(collection(db, 'pending_workers'), where('phone', 'in', queryVariants))),
              2000
            );
            if (pendingSnap && !pendingSnap.empty) {
              const pDoc = pendingSnap.docs[0].data();
              remoteWorker = { id: pendingSnap.docs[0].id, ...pDoc, status: 'pending', workerStatus: 'pending' };
            }
          }
        }
      } catch (err) {
        console.warn('Firestore fetchRemoteUserProfile error:', err);
      }
    }

    // 2. Check Supabase (users, profiles, workers)
    if (isSupabaseConfigured && supabase) {
      try {
        if (queryVariants.length > 0) {
          const phoneOrFilter = queryVariants.map(v => `phone.eq.${v}`).join(',');

          // Query Supabase 'users' table
          if (!remoteUser) {
            const { data: supaUsers } = await supabase
              .from('users')
              .select('*')
              .or(phoneOrFilter)
              .limit(1);
            if (supaUsers && supaUsers.length > 0) {
              remoteUser = supaUsers[0];
            }
          }

          // Query Supabase 'profiles' table (if present)
          if (!remoteUser) {
            try {
              const { data: supaProfiles } = await supabase
                .from('profiles')
                .select('*')
                .or(phoneOrFilter)
                .limit(1);
              if (supaProfiles && supaProfiles.length > 0) {
                remoteUser = supaProfiles[0];
              }
            } catch {}
          }

          // Query Supabase 'workers' table
          if (!remoteWorker) {
            const { data: supaWorkers } = await supabase
              .from('workers')
              .select('*')
              .or(phoneOrFilter)
              .limit(1);
            if (supaWorkers && supaWorkers.length > 0) {
              remoteWorker = supaWorkers[0];
            }
          }
        }

        // Query by username if non-phone identifier provided
        const trimmed = String(phoneOrIdentifier || '').trim();
        if (!remoteUser && trimmed && (!cleanTenDigits || cleanTenDigits.length < 10)) {
          const { data: userByUsername } = await supabase
            .from('users')
            .select('*')
            .ilike('username', trimmed)
            .limit(1);
          if (userByUsername && userByUsername.length > 0) {
            remoteUser = userByUsername[0];
          }
        }
      } catch (supaErr) {
        console.warn('Supabase fetchRemoteUserProfile error:', supaErr);
      }
    }

    // 3. Fallback to Local Cache if remote is offline or pending
    if (!remoteUser && !remoteWorker && cleanTenDigits) {
      const localCached = getLocalUserByPhone(cleanTenDigits) || getLocalUserByIdentifier(phoneOrIdentifier);
      if (localCached) {
        remoteUser = localCached;
      }
    }

    // Return null if no matching record found anywhere
    if (!remoteUser && !remoteWorker) {
      return null;
    }

    // Determine role and account status
    const isWorker = Boolean(
      remoteWorker ||
      (remoteUser && (remoteUser.role === 'worker' || remoteUser.role === 'WORKER' || remoteUser.workerId))
    );

    const isWorkerApproved = Boolean(
      (remoteWorker && (remoteWorker.status === 'approved' || remoteWorker.workerStatus === 'approved' || remoteWorker.is_approved)) ||
      (remoteUser && (remoteUser.status === 'approved' || remoteUser.workerStatus === 'approved'))
    );

    const finalRole = isWorker ? 'worker' : (remoteUser?.role || 'customer');
    const finalStatus = isWorker
      ? (isWorkerApproved ? 'approved' : (remoteWorker?.status || remoteWorker?.workerStatus || remoteUser?.status || 'pending'))
      : (remoteUser?.status || 'active');

    const canonicalPhone = cleanTenDigits ? `+91${cleanTenDigits}` : normalizePhoneE164(remoteUser?.phone || remoteWorker?.phone);

    const finalProfile = {
      ...(remoteUser || {}),
      ...(remoteWorker || {}),
      uid: remoteUser?.uid || (remoteWorker ? String(remoteWorker.id) : (cleanTenDigits ? 'usr_' + cleanTenDigits : 'usr_anon')),
      phone: canonicalPhone,
      role: finalRole,
      status: finalStatus,
      workerStatus: isWorker ? finalStatus : undefined,
      name: (remoteUser?.name || remoteWorker?.name || (isWorker ? 'Verified Partner' : 'Valued Customer')).trim(),
      ...(remoteWorker ? {
        workerId: String(remoteWorker.id || remoteWorker.workerId || remoteUser?.workerId),
        skill: remoteWorker.skill || remoteWorker.category || remoteWorker.category_name || remoteUser?.skill,
        categoryName: remoteWorker.category_name || remoteWorker.category || remoteWorker.skill,
        serviceArea: remoteWorker.service_area || remoteWorker.city,
        city: remoteWorker.city || remoteWorker.service_area || remoteUser?.city
      } : {})
    };

    if (cleanTenDigits) {
      saveLocalUserByPhone(cleanTenDigits, finalProfile);
    }

    return finalProfile;
  };

  // Sync with Firebase Auth listener
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        try {
          if (fbUser) {
            const userPhone = fbUser.phoneNumber || '';
            const existingProfile = await fetchRemoteUserProfile(userPhone, fbUser.uid);

            if (existingProfile) {
              setCurrentUser(existingProfile);
              localStorage.setItem('jobit_user', JSON.stringify(existingProfile));
            } else {
              const defaultData = {
                uid: fbUser.uid,
                name: fbUser.displayName || 'Customer',
                phone: normalizePhoneE164(userPhone) || userPhone || '',
                role: 'customer',
                photo: fbUser.photoURL || '',
                city: localStorage.getItem('jobit_user_location') || 'Melattur, Kerala'
              };
              if (db) {
                await setDoc(doc(db, 'users', fbUser.uid), defaultData, { merge: true });
              }
              setCurrentUser(defaultData);
              localStorage.setItem('jobit_user', JSON.stringify(defaultData));
            }
          }
        } catch {
          // Offline fallback
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  // Sync with Supabase Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const userPhone = session.user.phone || session.user.user_metadata?.phone;
          const profile = await fetchRemoteUserProfile(userPhone, session.user.id);
          if (profile) {
            setCurrentUser(profile);
            localStorage.setItem('jobit_user', JSON.stringify(profile));
          }
        }
      });

      return () => subscription?.unsubscribe?.();
    } catch (e) {
      console.warn('Supabase auth state listener error:', e);
    }
  }, []);

  // Cross-device status refresh: Refresh user/technician approval status from database on app startup
  useEffect(() => {
    const refreshStatusOnStartup = async () => {
      try {
        const raw = localStorage.getItem('jobit_user');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const cleanTenDigits = (parsed.phone || '').replace(/\D/g, '').slice(-10);
        if (!cleanTenDigits || cleanTenDigits.length !== 10) return;

        const remoteData = await fetchRemoteUserProfile(cleanTenDigits, parsed.uid);
        if (remoteData) {
          setCurrentUser(prev => {
            const updated = {
              ...(prev || parsed),
              ...remoteData,
              status: remoteData.status || (prev ? prev.status : 'active'),
              workerStatus: remoteData.workerStatus || (prev ? prev.workerStatus : undefined)
            };
            localStorage.setItem('jobit_user', JSON.stringify(updated));
            saveLocalUserByPhone(cleanTenDigits, updated);
            return updated;
          });
        }
      } catch (err) {
        console.warn('Startup status refresh notice:', err);
      }
    };

    refreshStatusOnStartup();
  }, []);

  const checkPhoneRegistered = async (phoneOrIdentifier) => {
    if (!phoneOrIdentifier) return { isRegistered: false };
    const rawDigits = String(phoneOrIdentifier).replace(/\D/g, '');
    const cleanTenDigits = rawDigits.slice(-10);

    if (cleanTenDigits === '8289968045') {
      return { 
        isRegistered: true, 
        isAdmin: true, 
        user: { 
          uid: 'admin_master', 
          name: 'Master Admin', 
          phone: '+918289968045', 
          role: 'admin' 
        } 
      };
    }

    const profile = await fetchRemoteUserProfile(phoneOrIdentifier);
    if (profile) {
      return { isRegistered: true, user: profile };
    }

    return { isRegistered: false };
  };

  const loginWithPhone = async (phone, otp, name = '', role = 'customer', extraData = {}) => {
    const rawDigits = String(phone || '').replace(/\D/g, '');
    const cleanTenDigits = rawDigits.slice(-10);
    const canonicalPhone = `+91${cleanTenDigits}`;

    // Direct Admin Rule (Critical): Phone number 8289968045 is ALWAYS Admin!
    if (cleanTenDigits === '8289968045') {
      const adminProfile = {
        uid: 'admin_master',
        name: 'Master Admin',
        email: 'admin@jobit.com',
        phone: '+918289968045',
        role: 'admin',
        city: 'Headquarters'
      };

      if (isFirebaseConfigured && db) {
        try {
          await safeDbPromise(setDoc(doc(db, 'users', 'admin_master'), adminProfile, { merge: true }), 1500);
        } catch {}
      }

      setCurrentUser(adminProfile);
      localStorage.setItem('jobit_user', JSON.stringify(adminProfile));
      return adminProfile;
    }

    const uid = 'usr_' + cleanTenDigits;

    // Fetch existing user & worker profile from database
    const existingProfile = await fetchRemoteUserProfile(cleanTenDigits);

    if (existingProfile) {
      // Existing profile found -> Log directly into this existing account without creating duplicate
      const isWorker = existingProfile.role === 'worker' || role === 'worker' || extraData?.role === 'worker' || extraData?.userRole === 'worker';
      const effectiveRole = isWorker ? 'worker' : (existingProfile.role || role || 'customer');

      const mergedProfile = {
        ...existingProfile,
        ...extraData,
        uid: existingProfile.uid || uid,
        phone: canonicalPhone,
        role: effectiveRole,
        status: existingProfile.status || extraData?.status || 'active',
        workerStatus: isWorker ? (existingProfile.workerStatus || extraData?.workerStatus || existingProfile.status || 'approved') : undefined
      };

      saveLocalUserByPhone(cleanTenDigits, mergedProfile);
      setCurrentUser(mergedProfile);
      localStorage.setItem('jobit_user', JSON.stringify(mergedProfile));

      // Sync phone normalization to database
      if (isFirebaseConfigured && db) {
        try {
          await safeDbPromise(setDoc(doc(db, 'users', mergedProfile.uid), { phone: canonicalPhone }, { merge: true }), 1500);
        } catch {}
      }
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('users').update({ phone: canonicalPhone }).eq('id', mergedProfile.uid);
        } catch {}
      }

      return mergedProfile;
    }

    // Brand new user registration for this mobile number (normalized E.164)
    const finalName = (name && name.trim()) ? name.trim() : (role === 'worker' ? 'Partner Pro' : 'Customer');
    const selectedRole = role === 'worker' ? 'worker' : 'customer';
    const profile = {
      uid,
      phone: canonicalPhone,
      name: finalName,
      email: `${finalName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}@example.com`,
      role: selectedRole,
      status: selectedRole === 'worker' ? (extraData.status || 'pending') : 'active',
      workerStatus: selectedRole === 'worker' ? (extraData.workerStatus || extraData.status || 'pending') : undefined,
      city: localStorage.getItem('jobit_user_location') || 'Melattur, Kerala',
      photo: selectedRole === 'worker' 
        ? 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=300&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString(),
      ...extraData
    };

    saveLocalUserByPhone(cleanTenDigits, profile);

    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', uid);
        await safeDbPromise(setDoc(userRef, profile, { merge: true }), 1500);
      } catch {}
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').upsert({
          id: uid,
          phone: canonicalPhone,
          name: finalName,
          role: selectedRole,
          city: profile.city,
          created_at: profile.createdAt
        }, { onConflict: 'phone' });
      } catch {}
    }

    setCurrentUser(profile);
    localStorage.setItem('jobit_user', JSON.stringify(profile));
    return profile;
  };

  const loginWithPassword = async (identifier, password) => {
    if (!identifier || !String(identifier).trim()) {
      throw new Error('Please enter your mobile number or username');
    }

    if (!password || !String(password).trim()) {
      throw new Error('Please enter your account password');
    }

    const cleanInput = String(identifier).trim();
    const rawDigits = cleanInput.replace(/\D/g, '');
    const cleanTenDigits = rawDigits.slice(-10);

    // Direct Admin Rule (Critical): Phone number 8289968045 is ALWAYS Admin!
    if (cleanTenDigits === '8289968045') {
      const adminProfile = {
        uid: 'admin_master',
        name: 'Master Admin',
        email: 'admin@jobit.com',
        phone: '+91 82899 68045',
        role: 'admin',
        city: 'Headquarters'
      };

      if (isFirebaseConfigured && db) {
        try {
          await safeDbPromise(setDoc(doc(db, 'users', 'admin_master'), adminProfile, { merge: true }), 1500);
        } catch {}
      }

      setCurrentUser(adminProfile);
      localStorage.setItem('jobit_user', JSON.stringify(adminProfile));
      return adminProfile;
    }

    const regStatus = await checkPhoneRegistered(cleanInput);
    if (!regStatus.isRegistered || !regStatus.user) {
      throw new Error(`No account found for "${cleanInput}". Please check your mobile or username, or sign up first.`);
    }

    const user = regStatus.user;
    if (user.password && String(user.password).trim() !== String(password).trim()) {
      throw new Error('Incorrect password. Please try again or use "Login via OTP".');
    }

    // Update active session
    setCurrentUser(user);
    localStorage.setItem('jobit_user', JSON.stringify(user));
    return user;
  };

  const registerWithPhoneAndPassword = async (phone, username, password, role = 'customer', extraData = {}) => {
    const rawDigits = String(phone || '').replace(/\D/g, '');
    const cleanTenDigits = rawDigits.slice(-10);

    if (!cleanTenDigits || cleanTenDigits.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }

    const cleanUsername = String(username || '').trim();
    if (!cleanUsername || cleanUsername.length < 2) {
      throw new Error('Please enter your full name or username (min 2 characters)');
    }

    const cleanPassword = String(password || '').trim();
    if (!cleanPassword || cleanPassword.length < 4) {
      throw new Error('Password must be at least 4 characters long');
    }

    // Strict Database Constraint: Strictly ONE account per mobile number!
    const phoneCheck = await checkPhoneRegistered(cleanTenDigits);
    if (phoneCheck.isRegistered) {
      throw new Error(`An account already exists for +91 ${cleanTenDigits}. Strictly ONE account per mobile number. Please log in directly.`);
    }

    // Check if username is already taken by another user
    const usernameCheck = await checkPhoneRegistered(cleanUsername);
    if (usernameCheck.isRegistered && usernameCheck.user && usernameCheck.user.phone?.replace(/\D/g, '').slice(-10) !== cleanTenDigits) {
      throw new Error(`The username "${cleanUsername}" is already taken. Please choose another username.`);
    }

    let uid = 'usr_' + cleanTenDigits;
    const selectedRole = role === 'worker' ? 'worker' : 'customer';

    // 1. Supabase Auth & Database Sync (with UNIQUE phone constraint)
    if (isSupabaseConfigured && supabase) {
      try {
        // Enforce UNIQUE constraint in Supabase database
        const { data: existingSupaPhone } = await supabase
          .from('users')
          .select('id, phone')
          .or(`phone.eq.+91${cleanTenDigits},phone.eq.+91 ${cleanTenDigits},phone.eq.${cleanTenDigits}`)
          .limit(1);

        if (existingSupaPhone && existingSupaPhone.length > 0) {
          throw new Error(`An account already exists for +91 ${cleanTenDigits}. Strictly ONE account per mobile number. Please sign in instead.`);
        }

        // Register in Supabase Auth
        const supaEmail = `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '') || cleanTenDigits}@jobit.app`;
        try {
          const { data: supaAuthData, error: supaAuthErr } = await supabase.auth.signUp({
            email: supaEmail,
            password: cleanPassword,
            options: {
              data: {
                phone: `+91${cleanTenDigits}`,
                username: cleanUsername,
                name: cleanUsername,
                role: selectedRole
              }
            }
          });
          if (supaAuthData?.user?.id) {
            uid = supaAuthData.user.id;
          }
        } catch (authErr) {
          console.warn('Supabase auth signUp note:', authErr);
        }

        // Insert into Supabase 'users' table
        const { error: supaInsertErr } = await supabase
          .from('users')
          .upsert({
            id: uid,
            phone: `+91${cleanTenDigits}`,
            username: cleanUsername,
            name: cleanUsername,
            password: cleanPassword,
            role: selectedRole,
            city: localStorage.getItem('jobit_user_location') || 'Melattur, Kerala',
            created_at: new Date().toISOString()
          }, { onConflict: 'phone' });

        if (supaInsertErr) {
          if (supaInsertErr.code === '23505' || supaInsertErr.message?.toLowerCase()?.includes('unique')) {
            throw new Error(`An account already exists for +91${cleanTenDigits}. Strictly ONE account per mobile number. Please sign in instead.`);
          }
          console.warn('Supabase users table insert note:', supaInsertErr);
        }
      } catch (supaErr) {
        if (supaErr.message?.includes('Strictly ONE account')) {
          throw supaErr;
        }
        console.warn('Supabase database registration notice:', supaErr);
      }
    }

    const profile = {
      uid,
      phone: `+91${cleanTenDigits}`,
      name: cleanUsername,
      username: cleanUsername,
      password: cleanPassword,
      email: `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}@example.com`,
      role: selectedRole,
      status: selectedRole === 'worker' ? (extraData.status || 'pending') : undefined,
      workerStatus: selectedRole === 'worker' ? (extraData.workerStatus || extraData.status || 'pending') : undefined,
      city: localStorage.getItem('jobit_user_location') || 'Melattur, Kerala',
      photo: selectedRole === 'worker' 
        ? 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=300&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString(),
      ...extraData
    };

    saveLocalUserByPhone(cleanTenDigits, profile);

    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', uid);
        await safeDbPromise(setDoc(userRef, profile, { merge: true }), 1500);
      } catch {}
    }

    setCurrentUser(profile);
    localStorage.setItem('jobit_user', JSON.stringify(profile));
    return profile;
  };

  const loginAsWorker = async (worker = {}) => {
    const wId = worker.id || worker.workerId || ('worker_' + Date.now());
    const profile = {
      uid: wId,
      workerId: wId,
      email: worker.email || '',
      name: worker.name || 'Verified Technician',
      phone: worker.phone || '',
      role: 'worker',
      skill: worker.skill || worker.categoryName || 'Home Services Pro',
      avatar: worker.avatar || worker.photo || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
      vehicle: worker.vehicle || 'Bike',
      rating: worker.rating || 5.0,
      status: worker.status || 'approved',
      workerStatus: worker.workerStatus || worker.status || 'approved',
      city: worker.city || localStorage.getItem('jobit_user_location') || 'Melattur, Kerala'
    };

    if (isFirebaseConfigured && db) {
      try {
        await safeDbPromise(setDoc(doc(db, 'users', wId), profile, { merge: true }), 1500);
      } catch {}
    }

    setCurrentUser(profile);
    localStorage.setItem('jobit_user', JSON.stringify(profile));
    return profile;
  };

  const loginAsAdmin = async (adminPayload = {}) => {
    const profile = {
      uid: 'admin_master',
      name: adminPayload.name || 'Master Admin',
      email: adminPayload.email || 'admin@jobit.com',
      phone: '+91 82899 68045',
      role: 'admin',
      city: 'Headquarters'
    };

    if (isFirebaseConfigured && db) {
      try {
        await safeDbPromise(setDoc(doc(db, 'users', 'admin_master'), profile, { merge: true }), 1500);
      } catch {}
    }

    setCurrentUser(profile);
    localStorage.setItem('jobit_user', JSON.stringify(profile));
    return profile;
  };

  const updateUserProfile = async (updates) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem('jobit_user', JSON.stringify(updated));

    // Also update registered users cache if phone is present
    if (updated.phone) {
      const cleanDigits = updated.phone.replace(/\D/g, '').slice(-10);
      if (cleanDigits) {
        saveLocalUserByPhone(cleanDigits, updated);
      }
    }

    if (isFirebaseConfigured && db && currentUser.uid) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
      } catch {}
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch {}
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setCurrentUser(null);
    localStorage.removeItem('jobit_user');

    // Clear all stored user data, booking history, notifications, and transient cache
    clearAllBookingAndUserData();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        checkPhoneRegistered,
        loginWithPhone,
        loginWithPassword,
        registerWithPhoneAndPassword,
        loginAsWorker,
        loginAsAdmin,
        updateUserProfile,
        logout,
        isFirebaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
}
