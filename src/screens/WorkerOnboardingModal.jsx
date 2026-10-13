import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Upload, 
  ShieldCheck, 
  User, 
  MapPin, 
  Briefcase, 
  CreditCard, 
  AlertCircle, 
  Check, 
  Sparkles, 
  Building2, 
  FileCheck2,
  Calendar,
  Phone,
  Mail,
  Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { registerWorkerOnboarding, getLocalCategories } from '../data/bookingService';

// Professional avatar presets for instant photo selection
const PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80'
];

// Sample government ID proof documents for demo preview
const ID_PROOF_SAMPLES = [
  { label: 'Aadhaar Card (Front & Back)', url: 'https://images.unsplash.com/photo-1554415707-9e4901f4c7d0?auto=format&fit=crop&w=600&q=80' },
  { label: 'Voter Identity Card', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Driving License / Trade Certificate', url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80' }
];

const POPULAR_LOCATIONS = [
  'Melattur, Kerala',
  'Perinthalmanna, Kerala',
  'Manjeri, Kerala',
  'Malappuram, Kerala',
  'Kozhikode, Kerala',
  'Kochi, Kerala',
  'Mumbai, Maharashtra'
];

export function WorkerOnboardingModal({ isOpen, onClose, onSuccess }) {
  const { loginWithPhone } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  // Step 1: Personal Details
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState(PHOTO_PRESETS[0]);
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('1994-08-15');

  // Step 2: Service Location & Coverage
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Melattur, Kerala');
  const [pincode, setPincode] = useState('679326');
  const [serviceRadius, setServiceRadius] = useState('25'); // km

  // Step 3: Skills & Professional Details
  const [primaryCategory, setPrimaryCategory] = useState('');
  const [selectedSubSkills, setSelectedSubSkills] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');
  const [baseRate, setBaseRate] = useState('350');

  // Step 4: Verification & Bank Details
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [idProofUrl, setIdProofUrl] = useState(ID_PROOF_SAMPLES[0].url);
  const [idProofType, setIdProofType] = useState('Aadhaar Card (Front & Back)');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('SBIN0008421');
  const [upiId, setUpiId] = useState('');

  // Load available categories
  useEffect(() => {
    if (isOpen) {
      const cats = getLocalCategories();
      setCategories(cats);
      if (cats.length > 0 && !primaryCategory) {
        setPrimaryCategory(cats[0].name);
        setSelectedSubSkills(cats[0].subCategories?.slice(0, 3) || ['General Diagnostics & Service']);
      }
      setErrorMsg('');
      setIsCompleted(false);
    }
  }, [isOpen]);

  // When primary category changes, update suggested sub-skills
  const handleCategoryChange = (catName) => {
    setPrimaryCategory(catName);
    const cat = categories.find(c => c.name === catName);
    if (cat && cat.subCategories && cat.subCategories.length > 0) {
      setSelectedSubSkills(cat.subCategories.slice(0, 3));
    } else {
      setSelectedSubSkills(['Standard Service & Repair']);
    }
  };

  const toggleSubSkill = (skill) => {
    if (selectedSubSkills.includes(skill)) {
      if (selectedSubSkills.length > 1) {
        setSelectedSubSkills(selectedSubSkills.filter(s => s !== skill));
      }
    } else {
      setSelectedSubSkills([...selectedSubSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (customSkillInput.trim() && !selectedSubSkills.includes(customSkillInput.trim())) {
      setSelectedSubSkills([...selectedSubSkills, customSkillInput.trim()]);
      setCustomSkillInput('');
    }
  };

  if (!isOpen) return null;

  // Validation functions per step
  const validateStep1 = () => {
    if (!fullName.trim() || fullName.trim().length < 3) {
      return 'Please enter your full legal name (min 3 characters)';
    }
    if (!photoUrl) {
      return 'Please choose or upload a profile photo';
    }
    const cleanPrimary = primaryPhone.replace(/\D/g, '').slice(-10);
    if (cleanPrimary.length !== 10) {
      return 'Please enter a valid 10-digit primary mobile number';
    }
    const cleanAlt = altPhone.replace(/\D/g, '').slice(-10);
    if (cleanAlt.length !== 10) {
      return 'Please enter a valid 10-digit alternate contact number';
    }
    if (cleanPrimary === cleanAlt) {
      return 'Alternate contact number must be different from primary phone';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return 'Please enter a valid email address';
    }
    if (!gender) {
      return 'Please select your gender';
    }
    if (!dob) {
      return 'Please enter your date of birth';
    }
    const birthDate = new Date(dob);
    const ageDiffMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 18) {
      return 'Service partners must be at least 18 years of age to register';
    }
    return '';
  };

  const validateStep2 = () => {
    if (!address.trim() || address.trim().length < 5) {
      return 'Please enter your detailed street address & building name';
    }
    if (!city.trim()) {
      return 'Please enter or select your City or Panchayat';
    }
    const cleanPin = pincode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      return 'Please enter a valid 6-digit postal PIN code';
    }
    if (!serviceRadius || Number(serviceRadius) <= 0) {
      return 'Please specify your service coverage radius in km';
    }
    return '';
  };

  const validateStep3 = () => {
    if (!primaryCategory) {
      return 'Please select your primary service trade / category';
    }
    if (!selectedSubSkills || selectedSubSkills.length === 0) {
      return 'Please select at least 1 specific sub-service or skill offered';
    }
    if (!experienceYears || Number(experienceYears) < 1) {
      return 'Please enter valid years of experience (minimum 1 year)';
    }
    if (!baseRate || Number(baseRate) < 150) {
      return 'Please enter base service rate (minimum ₹150)';
    }
    return '';
  };

  const validateStep4 = () => {
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12 && cleanAadhaar.length < 8) {
      return 'Please enter valid 12-digit Aadhaar / Govt ID number';
    }
    if (!idProofUrl) {
      return 'Please provide or upload a Govt ID Proof document';
    }
    if (!accountHolderName.trim() || accountHolderName.trim().length < 3) {
      return 'Please enter Account Holder Name as printed in bank passbook';
    }
    if (!bankName.trim()) {
      return 'Please enter your Bank Name';
    }
    if (!accountNumber.trim() || accountNumber.trim().length < 8) {
      return 'Please enter a valid Bank Account Number (minimum 8 digits)';
    }
    if (accountNumber.trim() !== confirmAccountNumber.trim()) {
      return 'Bank account numbers do not match! Please verify';
    }
    if (!ifscCode.trim() || ifscCode.trim().length < 6) {
      return 'Please enter a valid 11-character IFSC Code (e.g. SBIN0008421)';
    }
    return '';
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) { setErrorMsg(err); return; }
      if (!accountHolderName) setAccountHolderName(fullName);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const err = validateStep2();
      if (err) { setErrorMsg(err); return; }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const err = validateStep3();
      if (err) { setErrorMsg(err); return; }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const err = validateStep4();
    if (err) {
      setErrorMsg(err);
      return;
    }

    setSubmitting(true);

    const onboardingPayload = {
      name: fullName.trim(),
      avatar: photoUrl,
      phone: primaryPhone.trim(),
      altPhone: altPhone.trim(),
      email: email.trim().toLowerCase(),
      gender,
      dob,
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      serviceRadius,
      categoryName: primaryCategory,
      categoryId: `cat_${primaryCategory.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      skill: primaryCategory,
      subSkills: selectedSubSkills,
      experience: experienceYears,
      baseRate: Number(baseRate) || 350,
      aadhaarNumber: aadhaarNumber.trim(),
      idProofUrl,
      idProofType,
      accountHolderName: accountHolderName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      upiId: upiId.trim(),
      status: 'pending_verification',
      workerStatus: 'pending_verification'
    };

    try {
      const savedApp = await registerWorkerOnboarding(onboardingPayload);
      
      // Also automatically log in as this worker with 'pending_verification' status
      await loginWithPhone(
        primaryPhone, 
        '1234', 
        fullName.trim(), 
        'worker', 
        { 
          workerId: savedApp.id, 
          workerStatus: 'pending_verification',
          ...onboardingPayload 
        }
      );

      setSubmitting(false);
      setIsCompleted(true);
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#0EA5E0] to-[#0284C7] p-5 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">Partner Pro Onboarding</h3>
                <p className="text-[11px] text-sky-100 font-semibold">Join Urban Company / Joboy verified service team</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Progress Indicators */}
          {!isCompleted && (
            <div className="mt-4 pt-3 border-t border-white/20">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-white">
                  Step {currentStep} of 4: {
                    currentStep === 1 ? 'Personal Details' :
                    currentStep === 2 ? 'Location & Coverage' :
                    currentStep === 3 ? 'Skills & Pricing' :
                    'Verification & Bank'
                  }
                </span>
                <span className="text-sky-200">{currentStep * 25}%</span>
              </div>
              
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s <= currentStep ? 'bg-white shadow-xs' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 no-scrollbar space-y-4">

          {/* SUCCESS SCREEN */}
          {isCompleted ? (
            <div className="py-6 text-center space-y-4 animate-scale-up">
              <div className="w-20 h-20 bg-emerald-50 border-4 border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div>
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-[11px] font-black rounded-full uppercase tracking-wider mb-2">
                  Status: Pending Admin Approval
                </span>
                <h3 className="text-xl font-black text-slate-900">Application Submitted!</h3>
                <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto mt-1 leading-relaxed">
                  Thank you, <strong className="text-slate-800">{fullName}</strong>. Your KYC profile has been dispatched to the Master Admin control team for verification.
                </p>
              </div>

              {/* Application Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200/80 text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">Trade Skill:</span>
                  <span className="font-black text-slate-900">{primaryCategory}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">Coverage City:</span>
                  <span className="font-black text-slate-900">{city} ({pincode})</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">Registered Phone:</span>
                  <span className="font-black text-slate-900">{primaryPhone}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">Expected Approval:</span>
                  <span className="font-bold text-emerald-600">Within 2 to 4 Hours</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    onSuccess?.('pending_worker');
                    onClose();
                  }}
                  className="w-full py-3 bg-[#0EA5E0] hover:bg-[#0284C7] text-white rounded-2xl text-xs font-black shadow-md transition cursor-pointer"
                >
                  View My Partner Portal
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-red-600 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 1: PERSONAL DETAILS */}
              {/* ========================================================= */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-[#0EA5E0]" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Step 1: Personal Information
                    </h4>
                  </div>

                  {/* Profile Photo Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Profile Photo <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <img 
                        src={photoUrl} 
                        alt="Preview" 
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-[#0EA5E0] shadow-xs" 
                      />
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Select a verified professional avatar or enter URL:</p>
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                          {PHOTO_PRESETS.map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPhotoUrl(p)}
                              className={`w-8 h-8 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                                photoUrl === p ? 'border-[#0EA5E0] scale-105' : 'border-slate-200 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={p} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar / Anil K"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                    />
                  </div>

                  {/* Phones Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Primary Mobile <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={primaryPhone}
                          onChange={(e) => setPrimaryPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="98765 43210"
                          className="w-full pl-12 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Alternate Contact <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={altPhone}
                          onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="98765 11223"
                          className="w-full pl-12 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. partner.technician@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                    />
                  </div>

                  {/* Gender & DOB */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Date of Birth (18+) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      >
                      </input>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 2: SERVICE LOCATION & COVERAGE */}
              {/* ========================================================= */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <MapPin className="w-4 h-4 text-[#0EA5E0]" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Step 2: Service Location & Coverage Radius
                    </h4>
                  </div>

                  {/* Street Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Residential / Workshop Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House/Shop No., Street, Landmark"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                    />
                  </div>

                  {/* City & PIN Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        City / Panchayat <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Melattur, Kerala"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Postal PIN Code (6 digits) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="679326"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      />
                    </div>
                  </div>

                  {/* Popular Location Chips */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-1.5">Quick Location Suggestions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_LOCATIONS.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setCity(loc)}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition cursor-pointer ${
                            city === loc 
                              ? 'bg-[#0EA5E0] text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Service Radius */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        Service Coverage Radius <span className="text-red-500">*</span>
                      </label>
                      <span className="text-xs font-black text-[#0EA5E0] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                        {serviceRadius} km radius
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {['5', '10', '15', '25', '50'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setServiceRadius(r)}
                          className={`py-2 text-xs font-black rounded-xl border transition cursor-pointer text-center ${
                            serviceRadius === r 
                              ? 'border-[#0EA5E0] bg-[#0EA5E0] text-white shadow-xs' 
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {r} km
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 3: SKILLS & PROFESSIONAL DETAILS */}
              {/* ========================================================= */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Briefcase className="w-4 h-4 text-[#0EA5E0]" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Step 3: Skills & Professional Rates
                    </h4>
                  </div>

                  {/* Primary Category */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Primary Service Category / Trade <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={primaryCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                    >
                      {categories.map((c) => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.icon || '🛠️'} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-skills & Services Offered */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Specific Sub-Skills Offered <span className="text-red-500">*</span> (Select all that apply)
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200/80">
                      {selectedSubSkills.map((skill) => (
                        <span
                          key={skill}
                          onClick={() => toggleSubSkill(skill)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#0EA5E0] text-white shadow-xs cursor-pointer hover:bg-red-500 transition"
                          title="Click to remove"
                        >
                          {skill}
                          <span className="text-xs">✕</span>
                        </span>
                      ))}
                    </div>

                    {/* Add Custom Skill Form */}
                    <div className="flex gap-2 mt-1.5">
                      <input
                        type="text"
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value)}
                        placeholder="Add another specialized skill..."
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSkill}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Experience & Hourly Rates */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Experience (Years) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        required
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Base Rate (₹/Service) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="150"
                          step="50"
                          required
                          value={baseRate}
                          onChange={(e) => setBaseRate(e.target.value)}
                          placeholder="350"
                          className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 4: VERIFICATION & BANK DETAILS */}
              {/* ========================================================= */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <CreditCard className="w-4 h-4 text-[#0EA5E0]" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Step 4: Govt Verification & Bank Details
                    </h4>
                  </div>

                  {/* Aadhaar Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Aadhaar / Govt ID Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      placeholder="e.g. 7845 2319 8812"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                    />
                  </div>

                  {/* ID Proof Document Selection / Upload Simulation */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      ID Proof Document <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {ID_PROOF_SAMPLES.map((doc, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setIdProofUrl(doc.url);
                            setIdProofType(doc.label);
                          }}
                          className={`p-2 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center text-center ${
                            idProofUrl === doc.url 
                              ? 'border-[#0EA5E0] bg-sky-50/50' 
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <img 
                            src={doc.url} 
                            alt={doc.label} 
                            className="w-full h-14 rounded-xl object-cover mb-1.5"
                          />
                          <span className="text-[10px] font-bold text-slate-800 line-clamp-1">{doc.label}</span>
                          <span className="text-[9px] text-emerald-600 font-extrabold">Attached</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bank Account Details */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Payout Bank Account Details
                    </p>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Account Holder Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="As written on bank passbook"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Bank Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. State Bank of India"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          IFSC Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                          placeholder="SBIN0008421"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 uppercase focus:outline-none focus:border-[#0EA5E0]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Enter Account No."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Confirm Account <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={confirmAccountNumber}
                          onChange={(e) => setConfirmAccountNumber(e.target.value)}
                          placeholder="Re-enter Account No."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        UPI ID (Optional for 1-hour fast payout)
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. mobile@upi / name@okhdfcbank"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isCompleted && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 bg-[#0EA5E0] hover:bg-[#0284C7] text-white rounded-2xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer ml-auto"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ml-auto"
              >
                {submitting ? (
                  <span>Submitting Application...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit for Admin Approval</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
