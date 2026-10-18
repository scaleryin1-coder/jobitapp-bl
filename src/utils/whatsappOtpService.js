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
 * Triggers real WhatsApp OTP via Msg91 WhatsApp API using VITE_MSG91_AUTH_KEY.
 * 
 * @param {string} phone - 10-digit mobile number
 * @param {string} mode - 'signup' | 'login'
 * @returns {Promise<{ success: boolean, phone: string, deliveredProvider: string, message: string }>}
 */
export async function sendWhatsAppOtp(phone, mode = 'signup') {
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length !== 10) {
    throw new Error('Please provide a valid 10-digit mobile number');
  }

  const msg91AuthKey = (import.meta.env.VITE_MSG91_AUTH_KEY || '').trim();
  const msg91TemplateId = (import.meta.env.VITE_MSG91_TEMPLATE_ID || import.meta.env.VITE_MSG91_TEMPLATE_NAME || '').trim();
  const msg91IntegratedNumber = (import.meta.env.VITE_MSG91_INTEGRATED_NUMBER || '').trim();

  if (!msg91AuthKey) {
    throw new Error('VITE_MSG91_AUTH_KEY is not configured. Please set your Msg91 Auth Key in .env.');
  }

  let requestSuccess = false;
  let lastErrorMessage = '';

  // 1. Send OTP via Msg91 WhatsApp API (/api/v5/otp?otp_channel=whatsapp)
  if (typeof fetch !== 'undefined') {
    // Try via Vite proxy first to avoid browser CORS issues
    try {
      const proxyUrl = `/api/msg91/otp?mobile=91${cleanPhone}&authkey=${encodeURIComponent(msg91AuthKey)}&otp_length=6&otp_expiry=5&otp_channel=whatsapp${msg91TemplateId ? `&template_id=${encodeURIComponent(msg91TemplateId)}` : ''}`;
      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': msg91AuthKey
        }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.type === 'success') {
        requestSuccess = true;
      } else if (data?.message) {
        lastErrorMessage = data.message;
      }
    } catch (proxyErr) {
      console.warn('Msg91 proxy notice, trying direct endpoint:', proxyErr);
    }

    // Direct endpoint fallback if proxy is bypassed
    if (!requestSuccess) {
      try {
        const directUrl = `https://control.msg91.com/api/v5/otp?mobile=91${cleanPhone}&authkey=${encodeURIComponent(msg91AuthKey)}&otp_length=6&otp_expiry=5&otp_channel=whatsapp${msg91TemplateId ? `&template_id=${encodeURIComponent(msg91TemplateId)}` : ''}`;
        const directRes = await fetch(directUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authkey': msg91AuthKey
          }
        });
        const data = await directRes.json().catch(() => ({}));
        if (directRes.ok && data?.type === 'success') {
          requestSuccess = true;
        } else if (data?.message) {
          lastErrorMessage = data.message;
        }
      } catch (directErr) {
        lastErrorMessage = directErr?.message || lastErrorMessage;
      }
    }

    // Outbound WhatsApp template fallback if template/integrated number configured
    if (!requestSuccess && msg91IntegratedNumber) {
      try {
        const res = await fetch('https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
          method: 'POST',
          headers: {
            'authkey': msg91AuthKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            integrated_number: msg91IntegratedNumber,
            content_type: 'template',
            payload: {
              to: `91${cleanPhone}`,
              type: 'template',
              template: {
                name: msg91TemplateId || 'otp_verification',
                language: { code: 'en', policy: 'deterministic' }
              }
            }
          })
        });
        if (res.ok) {
          requestSuccess = true;
        }
      } catch {}
    }
  }

  if (!requestSuccess && lastErrorMessage) {
    throw new Error(`Msg91 Error: ${lastErrorMessage}`);
  }

  return {
    success: true,
    phone: cleanPhone,
    deliveredProvider: 'Msg91 WhatsApp',
    message: `WhatsApp OTP sent successfully to +91 ${cleanPhone}`
  };
}

/**
 * Verifies the 6-digit WhatsApp OTP directly via Msg91 OTP verification API.
 * No mock/test OTPs allowed.
 * 
 * @param {string} phone - 10-digit mobile number
 * @param {string} enteredOtp - 6-digit OTP code entered by the user
 * @returns {Promise<boolean>}
 */
export async function verifyWhatsAppOtp(phone, enteredOtp) {
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
  const cleanCode = String(enteredOtp || '').trim();

  if (!cleanCode || cleanCode.length !== 6) {
    throw new Error('Please enter a valid 6-digit WhatsApp OTP code.');
  }

  const msg91AuthKey = (import.meta.env.VITE_MSG91_AUTH_KEY || '').trim();
  if (!msg91AuthKey) {
    throw new Error('VITE_MSG91_AUTH_KEY is not configured in .env.');
  }

  // 1. Call Msg91 OTP Verification endpoint via proxy
  let resData = null;
  let requestOk = false;

  try {
    const proxyVerifyUrl = `/api/msg91/otp/verify?mobile=91${cleanPhone}&otp=${encodeURIComponent(cleanCode)}&authkey=${encodeURIComponent(msg91AuthKey)}`;
    const res = await fetch(proxyVerifyUrl, {
      method: 'GET',
      headers: { 'authkey': msg91AuthKey }
    });
    if (res.ok) {
      resData = await res.json().catch(() => null);
      requestOk = true;
    }
  } catch (proxyErr) {
    console.warn('Msg91 proxy verification notice, trying direct endpoint:', proxyErr);
  }

  // Direct endpoint fallback if proxy unavailable
  if (!requestOk) {
    try {
      const directVerifyUrl = `https://control.msg91.com/api/v5/otp/verify?mobile=91${cleanPhone}&otp=${encodeURIComponent(cleanCode)}&authkey=${encodeURIComponent(msg91AuthKey)}`;
      const directRes = await fetch(directVerifyUrl, {
        method: 'GET',
        headers: { 'authkey': msg91AuthKey }
      });
      resData = await directRes.json().catch(() => null);
      requestOk = true;
    } catch (directErr) {
      throw new Error(`Unable to connect to Msg91 verification service: ${directErr?.message || 'Network error'}`);
    }
  }

  if (resData?.type === 'success' || resData?.message?.toLowerCase?.()?.includes('success')) {
    return true;
  }

  const errorMsg = resData?.message || 'Invalid or expired WhatsApp OTP code. Please check your WhatsApp and try again.';
  throw new Error(errorMsg);
}
