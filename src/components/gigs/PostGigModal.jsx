import React, { useState } from 'react';
import { X, Briefcase, MapPin, IndianRupee, Clock, Phone, MessageSquare, Building2, Sparkles, CheckCircle2 } from 'lucide-react';
import { createDailyGig } from '../../data/bookingService';

const QUICK_ROLES = [
  { title: 'Petrol Pump Staff', category: 'Fuel & Auto', wage: '₹800 / day', timing: '8 AM - 4 PM' },
  { title: 'Supermarket Cashier', category: 'Retail & Billing', wage: '₹850 / day', timing: '10 AM - 7 PM' },
  { title: 'Shop Helper / Restocker', category: 'Shop Helper', wage: '₹750 / day', timing: '9 AM - 6 PM' },
  { title: 'Parcel Delivery Staff', category: 'Delivery & Logistics', wage: '₹900 / day', timing: '1 PM - 7 PM' },
  { title: 'Cafe / Kitchen Assistant', category: 'Food & Cafe', wage: '₹700 / day', timing: '7 AM - 3 PM' },
  { title: 'Warehouse Packing', category: 'Warehouse', wage: '₹800 / day', timing: '9 AM - 5 PM' }
];

const WAGE_PRESETS = ['₹650', '₹750', '₹800', '₹900', '₹1000'];
const DURATION_OPTIONS = ['Today Only', '1-Day Job', '2-3 Days', '1 Week', 'Part-Time Shift'];

export function PostGigModal({ isOpen, onClose, currentCity = 'Melattur, Kerala', onGigCreated }) {
  const [title, setTitle] = useState('');
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState(currentCity);
  const [wage, setWage] = useState('₹800 / day');
  const [duration, setDuration] = useState('Today Only');
  const [timing, setTiming] = useState('9:00 AM - 6:00 PM');
  const [category, setCategory] = useState('General Helper');
  const [urgency, setUrgency] = useState('urgent');
  const [contactNumber, setContactNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [description, setDescription] = useState('');
  const [employerName, setEmployerName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSelectQuickRole = (role) => {
    setTitle(role.title);
    setCategory(role.category);
    setWage(role.wage);
    setTiming(role.timing);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please specify the job role or title.');
      return;
    }
    if (!shopName.trim()) {
      setErrorMsg('Please provide the shop, enterprise, or business name.');
      return;
    }
    if (!contactNumber.trim() || contactNumber.replace(/[^0-9]/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile contact number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalWhatsapp = sameAsPhone ? contactNumber : (whatsappNumber || contactNumber);
      const newGig = await createDailyGig({
        title,
        shop_name: shopName,
        location: location || currentCity,
        wage,
        duration,
        timing,
        category,
        urgency,
        contact_number: contactNumber,
        whatsapp_number: finalWhatsapp,
        description: description || 'Immediate daily requirement. Direct spot joining with end-of-shift payment.',
        employer_name: employerName || shopName
      });

      setIsSuccess(true);
      onGigCreated?.(newGig);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        // Reset form
        setTitle('');
        setShopName('');
        setDescription('');
        setContactNumber('');
        setWhatsappNumber('');
      }, 1500);
    } catch (err) {
      console.error('Post gig error:', err);
      setErrorMsg('Failed to post vacancy. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 border border-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-gig-modal-title"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Briefcase className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="post-gig-modal-title" className="text-base font-black text-slate-900 leading-tight">
                Post Daily Gig & Shift Work
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Instant hiring for shops & local businesses
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="px-6 py-5 overflow-y-auto no-scrollbar space-y-5">
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>
              <h4 className="text-lg font-black text-slate-900">Vacancy Published Live!</h4>
              <p className="text-xs text-slate-600 max-w-xs">
                Your daily gig is now visible to active workers in your area. Applicants can connect directly.
              </p>
            </div>
          ) : (
            <form id="post-gig-form" onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Quick Template Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Popular Quick Roles</span>
                </label>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {QUICK_ROLES.map((role) => (
                    <button
                      key={role.title}
                      type="button"
                      onClick={() => handleSelectQuickRole(role)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                        title === role.title
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-amber-50/60 text-slate-700 border-slate-200/80'
                      }`}
                    >
                      {role.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Title / Role */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Job Role / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Petrol Pump Attendant, Store Helper"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0EA5E0] bg-slate-50/50"
                />
              </div>

              {/* Shop / Business Name & Employer Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>Shop / Business Name <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. City Supermarket, HP Fuels"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0EA5E0] bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>Work Location / Area</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Melattur Town, Bus Stand"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0EA5E0] bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Daily Wage Rate */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Daily Wage Rate</span>
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600">Spot Cash Payout</span>
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={wage}
                    onChange={(e) => setWage(e.target.value)}
                    placeholder="e.g. ₹800 / day"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {WAGE_PRESETS.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setWage(`${rate} / day`)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                        wage.startsWith(rate)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {rate}/day
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration & Shift Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Vacancy Duration</span>
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#0EA5E0]"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Shift Timings
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9 AM - 6 PM"
                    value={timing}
                    onChange={(e) => setTiming(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0EA5E0] bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Urgency Badge Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Urgency Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgency('urgent')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                      urgency === 'urgent'
                        ? 'bg-red-500 text-white border-red-500 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>⚡ Urgent</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency('today')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                      urgency === 'today'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>🔥 Today Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency('normal')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                      urgency === 'normal'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>Standard</span>
                  </button>
                </div>
              </div>

              {/* Direct Contact Phone & WhatsApp */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>Contact Mobile Number <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98471 00000"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0EA5E0] bg-slate-50/50"
                  />
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="same-phone-check"
                    checked={sameAsPhone}
                    onChange={(e) => setSameAsPhone(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0EA5E0] focus:ring-[#0EA5E0] border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="same-phone-check" className="text-xs font-semibold text-slate-600 cursor-pointer">
                    WhatsApp is the same as contact phone number
                  </label>
                </div>

                {!sameAsPhone && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp Number</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9847100000"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                    />
                  </div>
                )}
              </div>

              {/* Optional Description / Work Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Brief Requirements / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Unloading stock cartons, basic counter support. Food provided."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0EA5E0] bg-slate-50/50 resize-none"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer CTAs */}
        {!isSuccess && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="post-gig-form"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/25 transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <span>Post Vacancy Live</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
