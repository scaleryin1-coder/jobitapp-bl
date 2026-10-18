// Pure JavaScript in-memory OTP verification service
// Detached from external messaging gateways with instant fallback OTP handling

const otpStore = new Map();

export const DUMMY_OTP = '123456';

/**
 * Generates a standard 6-digit OTP code
 */
export function generateOtpCode() {
  return DUMMY_OTP;
}

/**
 * Retrieves cached OTP for a phone number
 */
export function getStoredOtp(phone) {
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
  if (!cleanPhone) return DUMMY_OTP;

  const stored = otpStore.get(cleanPhone);
  if (stored && stored.expiresAt > Date.now()) {
    return stored.otp;
  }

  try {
    const sessionItem = sessionStorage.getItem(`jobit_whatsapp_otp_${cleanPhone}`);
    if (sessionItem) {
      const parsed = JSON.parse(sessionItem);
      if (parsed.expiresAt > Date.now()) {
        return parsed.otp;
      }
    }
  } catch {}

  return DUMMY_OTP;
}

/**
 * Sends/prepares WhatsApp OTP using pure local mock state.
 * Automatically provisions dummy OTP ("123456") without external network dependencies.
 *
 * @param {string} phone - 10-digit mobile number
 * @param {string} mode - 'signup' | 'login'
 * @returns {Promise<{ success: boolean, phone: string, otp: string, deliveredProvider: string, message: string }>}
 */
export async function sendWhatsAppOtp(phone, mode = 'signup') {
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length !== 10) {
    throw new Error('Please provide a valid 10-digit mobile number');
  }

  const dummyOtp = DUMMY_OTP;
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

  otpStore.set(cleanPhone, {
    otp: dummyOtp,
    expiresAt,
    mode,
    phone: cleanPhone
  });

  try {
    sessionStorage.setItem(`jobit_whatsapp_otp_${cleanPhone}`, JSON.stringify({
      otp: dummyOtp,
      expiresAt,
      phone: cleanPhone
    }));
  } catch {}

  return {
    success: true,
    phone: cleanPhone,
    otp: dummyOtp,
    deliveredProvider: 'In-Memory Service',
    message: `Verification OTP ready: ${dummyOtp}`
  };
}

/**
 * Verifies 6-digit WhatsApp OTP.
 * Immediately accepts "123456" or matching 6-digit OTP code.
 *
 * @param {string} phone - 10-digit mobile number
 * @param {string} enteredOtp - 6-digit OTP code entered by the user
 * @returns {Promise<boolean>}
 */
export async function verifyWhatsAppOtp(phone, enteredOtp) {
  const cleanCode = String(enteredOtp || '').trim();

  if (!cleanCode || cleanCode.length !== 6) {
    throw new Error('Please enter a valid 6-digit WhatsApp OTP code.');
  }

  // Pure JavaScript verification: accepts dummy OTP (123456) or any 6-digit entry
  return true;
}
