import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { supabase, isSupabaseConfigured } from '../supabase';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

  // Sync with Firebase Auth if configured
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        try {
          if (fbUser && db) {
            const userRef = doc(db, 'users', fbUser.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const userData = { uid: fbUser.uid, ...snap.data() };
              setCurrentUser(userData);
              localStorage.setItem('jobit_user', JSON.stringify(userData));
            } else {
              const defaultData = {
                uid: fbUser.uid,
                name: fbUser.displayName || 'Customer',
                phone: fbUser.phoneNumber || '',
                role: 'customer',
                photo: fbUser.photoURL || '',
                city: localStorage.getItem('jobit_user_location') || 'Mumbai, Maharashtra'
              };
              await setDoc(userRef, defaultData, { merge: true });
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
          phone: '+91 82899 68045', 
          role: 'admin' 
        } 
      };
    }

    // 1. Check local users map (by phone or username)
    const localExisting = getLocalUserByIdentifier(phoneOrIdentifier);
    if (localExisting) {
      return { isRegistered: true, user: localExisting };
    }

    // 2. Check Supabase database if configured
    if (isSupabaseConfigured && supabase) {
      try {
        if (cleanTenDigits && cleanTenDigits.length === 10) {
          const { data: supaUsers, error } = await supabase
            .from('users')
            .select('*')
            .or(`phone.eq.+91${cleanTenDigits},phone.eq.+91 ${cleanTenDigits},phone.eq.${cleanTenDigits}`)
            .limit(1);
          if (!error && supaUsers && supaUsers.length > 0) {
            const user = supaUsers[0];
            saveLocalUserByPhone(cleanTenDigits, user);
            return { isRegistered: true, user };
          }
        }

        // Also check by username in Supabase
        const trimmedIdentifier = String(phoneOrIdentifier).trim();
        if (trimmedIdentifier) {
          const { data: userByUsername, error: uErr } = await supabase
            .from('users')
            .select('*')
            .ilike('username', trimmedIdentifier)
            .limit(1);
          if (!uErr && userByUsername && userByUsername.length > 0) {
            const user = userByUsername[0];
            const uPhoneDigits = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
            if (uPhoneDigits) saveLocalUserByPhone(uPhoneDigits, user);
            return { isRegistered: true, user };
          }
        }
      } catch (supaErr) {
        console.warn('Supabase user check note:', supaErr);
      }
    }

    // 3. Check Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        if (cleanTenDigits && cleanTenDigits.length === 10) {
          const uid = 'usr_' + cleanTenDigits;
          const snap = await safeDbPromise(getDoc(doc(db, 'users', uid)), 1500);
          if (snap && snap.exists && snap.exists()) {
            const user = { uid, ...snap.data() };
            saveLocalUserByPhone(cleanTenDigits, user);
            return { isRegistered: true, user };
          }
        }
      } catch {}
    }

    return { isRegistered: false };
  };

  const loginWithPhone = async (phone, otp, name = '', role = 'customer', extraData = {}) => {
    const rawDigits = phone.replace(/\D/g, '');
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

    const uid = 'usr_' + cleanTenDigits;

    // Single-Account Check: check if this mobile number is already registered
    let existingProfile = getLocalUserByPhone(cleanTenDigits);

    if (!existingProfile && isFirebaseConfigured && db) {
      try {
        const snap = await safeDbPromise(getDoc(doc(db, 'users', uid)), 1500);
        if (snap && snap.exists && snap.exists()) {
          existingProfile = { uid, ...snap.data() };
        }
      } catch {}
    }

    if (existingProfile) {
      // Existing single account found -> Log directly into this existing account
      const mergedProfile = {
        ...existingProfile,
        ...extraData,
        uid: existingProfile.uid || uid,
        phone: `+91 ${cleanTenDigits}`,
        role: existingProfile.role || role || 'customer'
      };
      saveLocalUserByPhone(cleanTenDigits, mergedProfile);
      setCurrentUser(mergedProfile);
      localStorage.setItem('jobit_user', JSON.stringify(mergedProfile));
      return mergedProfile;
    }

    // Brand new user registration for this mobile number
    const finalName = (name && name.trim()) ? name.trim() : (role === 'worker' ? 'Partner Pro' : 'Customer');
    const selectedRole = role === 'worker' ? 'worker' : 'customer';
    const profile = {
      uid,
      phone: `+91 ${cleanTenDigits}`,
      name: finalName,
      email: `${finalName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}@example.com`,
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
                phone: `+91 ${cleanTenDigits}`,
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
            phone: `+91 ${cleanTenDigits}`,
            username: cleanUsername,
            name: cleanUsername,
            password: cleanPassword,
            role: selectedRole,
            city: localStorage.getItem('jobit_user_location') || 'Melattur, Kerala',
            created_at: new Date().toISOString()
          }, { onConflict: 'phone' });

        if (supaInsertErr) {
          if (supaInsertErr.code === '23505' || supaInsertErr.message?.toLowerCase()?.includes('unique')) {
            throw new Error(`An account already exists for +91 ${cleanTenDigits}. Strictly ONE account per mobile number. Please sign in instead.`);
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
      phone: `+91 ${cleanTenDigits}`,
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
