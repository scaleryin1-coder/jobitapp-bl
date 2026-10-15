import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  QrCode, 
  CreditCard, 
  Sparkles, 
  Copy, 
  Check, 
  ShieldCheck, 
  Smartphone,
  Receipt,
  ArrowRight,
  Info
} from 'lucide-react';
import { calculateJobBilling } from '../../data/bookingService';

/**
 * PaymentQRModal - Customer Billing & Payment QR Screen
 * 
 * Rules strictly implemented:
 * 1. Customer Platform Fee = 5% of Service Charge (Labor).
 * 2. Total Customer Payable Amount = Service Charge + Spare Price (if any) + (Service Charge * 0.05).
 * 3. Shows the 5% platform fee explicitly in the customer breakdown (Service Charge, Spares, Platform Fee 5%, Total).
 * 4. Worker Final Earning = (Service Charge * 0.90) + Spare Price.
 *    (Worker 10% deduction is NEVER shown on the customer bill/QR).
 * 5. Supports "Paid by Cash" and "QR Payment Received" confirmation.
 */
export function PaymentQRModal({ 
  isOpen, 
  onClose, 
  booking, 
  userRole = 'worker', // 'worker' | 'customer'
  onConfirmPayment 
}) {
  const [serviceChargeInput, setServiceChargeInput] = useState('300');
  const [sparePriceInput, setSparePriceInput] = useState('200');
  const [isCopiedUpi, setIsCopiedUpi] = useState(false);
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'details'
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (booking) {
      const initService = booking.serviceCharge !== undefined 
        ? String(booking.serviceCharge) 
        : (booking.price && booking.price > 99 ? String(booking.price) : '300');
      const initSpare = booking.sparePrice !== undefined ? String(booking.sparePrice) : '200';
      setServiceChargeInput(initService);
      setSparePriceInput(initSpare);
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  const serviceCharge = Math.max(0, parseFloat(serviceChargeInput) || 0);
  const sparePrice = Math.max(0, parseFloat(sparePriceInput) || 0);

  const billing = calculateJobBilling({ serviceCharge, sparePrice });

  // UPI QR String with dynamic payable amount
  const upiId = 'jobitpay@upi';
  const merchantName = 'JOBit Services';
  const note = `JOBit-${booking.id?.slice(-6) || 'Service'}`;
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${billing.totalCustomerPayable}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiUrl)}`;

  const handleCopyUpi = () => {
    try {
      navigator.clipboard.writeText(upiId);
      setIsCopiedUpi(true);
      setTimeout(() => setIsCopiedUpi(false), 2000);
    } catch {}
  };

  const handleConfirm = async (method) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirmPayment?.({
        paymentMethod: method === 'cash' ? 'Paid by Cash' : 'UPI QR Payment',
        serviceCharge: billing.serviceCharge,
        sparePrice: billing.sparePrice,
        customerPlatformFee: billing.customerPlatformFee,
        totalCustomerPayable: billing.totalCustomerPayable,
        totalPayable: billing.totalCustomerPayable,
        workerFinalEarning: billing.workerFinalEarning,
        workerNetEarning: billing.workerFinalEarning,
        workerCommission: billing.workerCommission,
        workerLaborShare: billing.workerLaborShare
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Modal Header */}
        <div className="px-5 pt-4 pb-3 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#0EA5E0]/20 border border-[#0EA5E0]/40 flex items-center justify-center text-[#38BDF8]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                Customer Bill & Payment QR
              </h3>
              <p className="text-[10px] text-sky-200 font-semibold">
                Official JOBit Transparent Billing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">

          {/* Service Title & Booking Id Pill */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
            <div className="truncate flex-1 pr-2">
              <span className="text-[10px] font-extrabold uppercase text-[#0EA5E0] bg-sky-50 px-2 py-0.5 rounded-full inline-block mb-0.5">
                {booking.categoryName || 'Home Service'}
              </span>
              <p className="font-extrabold text-slate-800 truncate">{booking.serviceTitle}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono font-bold text-slate-400">
                #{booking.id?.slice(-6).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Worker Input Adjuster - ONLY shown to Worker to enter/modify charges on-site */}
          {userRole === 'worker' && (
            <div className="bg-sky-50/60 rounded-2xl p-3 border border-sky-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-sky-900 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-[#0EA5E0]" />
                  <span>On-Site Service Billing Input</span>
                </span>
                <span className="text-[10px] font-bold text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-100">
                  Worker Console
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-600 block mb-1">
                    Service Charge (Labor) ₹
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={serviceChargeInput}
                      onChange={(e) => setServiceChargeInput(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      placeholder="300"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-600 block mb-1">
                    Spare Price (if any) ₹
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={sparePriceInput}
                      onChange={(e) => setSparePriceInput(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment QR Code Box */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs text-center space-y-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Instant QR Payment Enabled</span>
              </span>
              <p className="text-xs text-slate-500 font-semibold">
                Scan with Google Pay, PhonePe, Paytm, or any UPI App
              </p>
            </div>

            {/* QR Code Container */}
            <div className="inline-block p-2.5 bg-white rounded-2xl border-2 border-slate-900 shadow-sm relative group">
              <img 
                src={qrCodeUrl} 
                alt="JOBit Payment QR" 
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded-xl"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-9 h-9 rounded-xl bg-white shadow-md p-1 border border-slate-100 flex items-center justify-center">
                  <div className="w-full h-full rounded-lg bg-[#0EA5E0] text-white flex items-center justify-center text-[11px] font-black">
                    JOBit
                  </div>
                </div>
              </div>
            </div>

            {/* UPI ID with 1-click copy */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {upiId}
              </span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                title="Copy UPI ID"
              >
                {isCopiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Customer Bill Breakdown - STRICT REQUIREMENT 1:
              Show Service Charge, Spares, Platform Fee 5%, Total explicitly!
              STRICT REQUIREMENT 2:
              Do NOT show the 10% deduction on the customer bill. */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#0EA5E0]" />
                <span>Customer Bill Breakdown</span>
              </h4>
              <span className="text-[10px] font-extrabold text-slate-400">
                INR (₹)
              </span>
            </div>

            {/* 1. Service Charge (Labor) */}
            <div className="flex justify-between items-center text-xs text-slate-700 font-semibold">
              <span className="flex items-center gap-1">
                <span>Service Charge (Labor)</span>
              </span>
              <span className="font-extrabold text-slate-900">₹{billing.serviceCharge}</span>
            </div>

            {/* 2. Spares */}
            <div className="flex justify-between items-center text-xs text-slate-700 font-semibold">
              <span>Spare Price {billing.sparePrice === 0 && <span className="text-[10px] text-slate-400 font-medium">(none)</span>}</span>
              <span className="font-extrabold text-slate-900">₹{billing.sparePrice}</span>
            </div>

            {/* 3. Platform Fee 5% */}
            <div className="flex justify-between items-center text-xs text-slate-700 font-semibold">
              <span className="flex items-center gap-1">
                <span>Customer Platform Fee (5%)</span>
                <span className="text-[10px] text-sky-600 font-bold bg-sky-50 px-1.5 py-0.2 rounded">5%</span>
              </span>
              <span className="font-extrabold text-[#0EA5E0]">₹{billing.customerPlatformFee}</span>
            </div>

            {/* 4. Total Customer Payable Amount */}
            <div className="pt-2 border-t-2 border-slate-300/80 flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-slate-900">
                  Total Customer Payable Amount
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Inclusive of labor, spares & 5% fee
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-600">
                  ₹{billing.totalCustomerPayable}
                </span>
              </div>
            </div>
          </div>

          {/* Worker Net Earning Callout - ONLY shown to Worker in worker console (NEVER on customer bill) */}
          {userRole === 'worker' && (
            <div className="bg-emerald-50/90 rounded-2xl p-3 border border-emerald-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Your Net Earning from this Job</span>
                </span>
                <span className="text-sm font-black text-emerald-700">
                  ₹{billing.workerFinalEarning}
                </span>
              </div>
              <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">
                • Service Labor Net (90%): <strong>₹{billing.workerLaborShare}</strong> (₹{billing.serviceCharge} - 10% platform commission) + Spares (100%): <strong>₹{billing.sparePrice}</strong> = <strong>₹{billing.workerFinalEarning} Total</strong>
              </p>
            </div>
          )}

          {/* Payment Confirmation Buttons */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Paid by Cash Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleConfirm('cash')}
                className="py-3 px-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-black text-xs shadow-xs transition active:scale-[0.98] cursor-pointer flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-sm">💵</span>
                <span>Paid by Cash</span>
                <span className="text-[9px] text-slate-400 font-bold">Collect ₹{billing.totalCustomerPayable}</span>
              </button>

              {/* QR Payment Received Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleConfirm('qr')}
                className="py-3 px-3 rounded-2xl bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] hover:opacity-95 text-white font-black text-xs shadow-glow transition active:scale-[0.98] cursor-pointer flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-sm">📱</span>
                <span>QR Payment Done</span>
                <span className="text-[9px] text-sky-100 font-bold">Verified UPI</span>
              </button>

            </div>

            <p className="text-[10px] text-slate-400 text-center font-medium">
              Upon confirming payment, job is marked Completed and earnings are credited.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
