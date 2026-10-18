import { supabase, isSupabaseConfigured } from '../supabase';

// In-memory cache for recent OTPs with expiry
const otpStore = new Map();

/**
 * Generates a secure random 6-digit OTP code
 */
export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends/prepares WhatsApp OTP.
 * Temporarily bypasses the MSG91 API key check in the frontend.
 * Prepares dummy OTP (123456) without throwing errors or requiring VITE_MSG91_AUTH_KEY.
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

  // Pre-store dummy OTP (123456)
  const dummyOtp = '123456';
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
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

  // If key happens to exist, attempt background dispatch without blocking or throwing errors
  try {
    const msg91AuthKey = (import.meta.env.VITE_MSG91_AUTH_KEY || '').trim();
    if (msg91AuthKey && typeof fetch !== 'undefined') {
      const msg91TemplateId = (import.meta.env.VITE_MSG91_TEMPLATE_ID || import.meta.env.VITE_MSG91_TEMPLATE_NAME || '').trim();
      const proxyUrl = `/api/msg91/otp?mobile=91${cleanPhone}&authkey=${encodeURIComponent(msg91AuthKey)}&otp_length=6&otp_expiry=5&otp_channel=whatsapp${msg91TemplateId ? `&template_id=${encodeURIComponent(msg91TemplateId)}` : ''}`;
      fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': msg91AuthKey
        }
      }).catch(() => {});
    }
  } catch {}

  return {
    success: true,
    phone: cleanPhone,
    otp: dummyOtp,
    deliveredProvider: 'Dummy Fallback Mode',
    message: `Test OTP ready: ${dummyOtp}`
  };
}

/**
 * Verifies 6-digit WhatsApp OTP.
 * Temporarily bypasses the MSG91 API key check in the frontend.
 * Allows logging in using Dummy OTP (e.g. "123456" or any 6-digit code) without checking for VITE_MSG91_AUTH_KEY.
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

  // Requirement 1 & 2: Temporarily bypass MSG91 API key check and allow logging in with Dummy OTP (123456 or any 6 digits)
  return true;
}
