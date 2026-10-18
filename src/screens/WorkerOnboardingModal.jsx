import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  Image as ImageIcon,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  Search,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { registerWorkerOnboarding, getLocalCategories, subscribeCategories } from '../data/bookingService';
import { ALL_MAIN_CATEGORIES } from '../data/categoriesData';
import { compressImage } from '../utils/imageUtils';
import { LocationPickerField } from '../components/common/LocationPickerField';

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
  const { currentUser, loginWithPhone } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Auto-detected Customer Account details
  const [isAccountAutoDetected, setIsAccountAutoDetected] = useState(false);
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Mandatory Live Camera Selfie (No avatars allowed!)
  const [photoUrl, setPhotoUrl] = useState('');
  const [selfieCapturedAt, setSelfieCapturedAt] = useState('');

  // Additional Step 1 details
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('1994-08-15');

  // Step 2: Service Location & Coverage
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Melattur, Kerala');
  const [pincode, setPincode] = useState('679326');
  const [serviceRadius, setServiceRadius] = useState('25'); // km

  // Step 3: Skills & Professional Details (Dynamically synced)
  const [primaryCategory, setPrimaryCategory] = useState('');
  const [selectedSubSkills, setSelectedSubSkills] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');
  const [baseRate, setBaseRate] = useState('350');

  // Step 4: Verification & Bank Details (Both Aadhaar & Driving License mandatory)
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarDoc, setAadhaarDoc] = useState(null);
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [drivingLicenseDoc, setDrivingLicenseDoc] = useState(null);

  // Bank Account details
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('SBIN0008421');
  const [upiId, setUpiId] = useState('');

  // Live Camera Viewfinder modal state
  // target can be 'selfie' | 'aadhaar' | 'license' | null
  const [liveCameraTarget, setLiveCameraTarget] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Enlarge Document / Selfie Lightbox Preview
  const [previewModalDoc, setPreviewModalDoc] = useState(null);

  // File input refs for camera capture & gallery picking
  const selfieCameraInputRef = useRef(null);
  const aadhaarCameraInputRef = useRef(null);
  const aadhaarGalleryInputRef = useRef(null);
  const licenseCameraInputRef = useRef(null);
  const licenseGalleryInputRef = useRef(null);

  // Video and stream refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // Auto-detect logged-in Customer Account on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setIsCompleted(false);

      const customerPhone = (currentUser?.phone || '').replace(/\D/g, '').slice(-10);
      if (customerPhone && customerPhone.length === 10) {
        setPrimaryPhone(customerPhone);
        setIsAccountAutoDetected(true);
      } else {
        setIsAccountAutoDetected(false);
      }

      if (currentUser?.name && !fullName) {
        setFullName(currentUser.name);
      }
      if (currentUser?.city) {
        setCity(currentUser.city);
      }
      if (currentUser?.email && !email) {
        setEmail(currentUser.email);
      }
    }
  }, [isOpen, currentUser]);

  // Real-time Dynamic Category Synchronization from Customer Menu & Admin
  useEffect(() => {
    const unsub = subscribeCategories((cats) => {
      let activeCats = Array.isArray(cats) && cats.length > 0 ? cats : getLocalCategories();
      
      // Merge with ALL_MAIN_CATEGORIES so all 20 certified categories are always accessible
      const map = new Map();
      ALL_MAIN_CATEGORIES.forEach(c => map.set(c.name.toLowerCase(), c));
      activeCats.forEach(c => {
        const key = (c.name || '').toLowerCase();
        if (key) map.set(key, { ...map.get(key), ...c });
      });

      const fullList = Array.from(map.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
      setCategories(fullList);

      if (!primaryCategory && fullList.length > 0) {
        setPrimaryCategory(fullList[0].name);
        if (fullList[0].subCategories && fullList[0].subCategories.length > 0) {
          setSelectedSubSkills(fullList[0].subCategories.slice(0, 3));
        }
      }
    });

    return () => unsub();
  }, [primaryCategory]);

  // When primary category changes, sync sub-skills and base rate
  const handleCategoryChange = (catName) => {
    setPrimaryCategory(catName);
    const cat = categories.find(c => c.name === catName);
    if (cat) {
      if (cat.basePrice) {
        setBaseRate(String(cat.basePrice));
      }
      if (cat.subCategories && cat.subCategories.length > 0) {
        setSelectedSubSkills(cat.subCategories.slice(0, 3));
      } else {
        setSelectedSubSkills(['Standard Service & Repair']);
      }
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

  // Live Camera Stream handler
  const startLiveCamera = async (target) => {
    setLiveCameraTarget(target);
    setCameraLoading(true);
    setCameraError('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('In-app camera streaming is not supported on this browser. Please use the device camera button.');
      }

      const isSelfie = target === 'selfie';
      const constraints = {
        video: {
          facingMode: isSelfie ? { ideal: 'user' } : { ideal: 'environment' },
          width: { ideal: isSelfie ? 720 : 1280 },
          height: { ideal: isSelfie ? 720 : 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraLoading(false);
    } catch (err) {
      console.warn('Live camera stream notice:', err);
      setCameraLoading(false);
      setCameraError('Camera access not granted or unavailable. You can also use the direct device camera option below.');
    }
  };

  const stopLiveCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setLiveCameraTarget(null);
    setCameraError('');
    setCameraLoading(false);
  };

  // Capture frame from in-app live stream
  const captureLivePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Scale canvas to max 800px to keep payload size lightweight and within Firestore 1MB limit
    const maxDimension = 800;
    let w = video.videoWidth || 720;
    let h = video.videoHeight || 720;
    if (w > maxDimension || h > maxDimension) {
      if (w > h) {
        h = Math.round((h * maxDimension) / w);
        w = maxDimension;
      } else {
        w = Math.round((w * maxDimension) / h);
        h = maxDimension;
      }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // If selfie, flip horizontally for mirror selfie preview
    if (liveCameraTarget === 'selfie') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.78);

    if (liveCameraTarget === 'selfie') {
      setPhotoUrl(dataUrl);
      setSelfieCapturedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setErrorMsg('');
    } else {
      const isAadhaar = liveCameraTarget === 'aadhaar';
      const docMeta = {
        url: dataUrl,
        name: `${isAadhaar ? 'Aadhaar_Card_Camera' : 'Driving_License_Camera'}_${Date.now()}.jpg`,
        size: `${Math.round((dataUrl.length * 0.75) / 1024)} KB`,
        type: 'image/jpeg',
        isCameraCaptured: true
      };

      if (isAadhaar) {
        setAadhaarDoc(docMeta);
      } else {
        setDrivingLicenseDoc(docMeta);
      }
      setErrorMsg('');
    }

    stopLiveCamera();
  };

  // Handle native file inputs (Device Camera capture or Gallery picker)
  const handleFileInput = async (e, target, isCamera = false) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('Selected file exceeds 20MB limit. Please choose a smaller photo.');
      e.target.value = '';
      return;
    }

    try {
      // Compress the image before saving to state or Firestore
      const compressedDataUrl = await compressImage(file, 800, 800, 0.75);
      const isAadhaar = target === 'aadhaar';

      if (target === 'selfie') {
        setPhotoUrl(compressedDataUrl);
        setSelfieCapturedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setErrorMsg('');
      } else {
        const docMeta = {
          url: compressedDataUrl,
          name: file.name || `${isAadhaar ? 'Aadhaar_Card' : 'Driving_License'}_${Date.now()}.jpg`,
          size: `${Math.round((compressedDataUrl.length * 0.75) / 1024)} KB`,
          type: 'image/jpeg',
          isCameraCaptured: isCamera
        };
        if (isAadhaar) {
          setAadhaarDoc(docMeta);
        } else {
          setDrivingLicenseDoc(docMeta);
        }
        setErrorMsg('');
      }
    } catch (compressErr) {
      console.error('File compression error:', compressErr);
      setErrorMsg('Failed to process image file: ' + (compressErr.message || 'Unsupported format'));
    } finally {
      e.target.value = '';
    }
  };

  const removeDoc = (target) => {
    if (target === 'selfie') {
      setPhotoUrl('');
      setSelfieCapturedAt('');
    } else if (target === 'aadhaar') {
      setAadhaarDoc(null);
    } else {
      setDrivingLicenseDoc(null);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  // Step Validations
  const validateStep1 = () => {
    if (!fullName.trim() || fullName.trim().length < 3) {
      return 'Please enter your full legal name (min 3 characters)';
    }
    // Live Camera Selfie is MANDATORY!
    if (!photoUrl) {
      return 'Mandatory Live Camera Selfie required! Please take a live photo of your face.';
    }
    const cleanPrimary = primaryPhone.replace(/\D/g, '').slice(-10);
    if (cleanPrimary.length !== 10) {
      return 'Please provide a valid 10-digit primary phone number';
    }
    if (altPhone) {
      const cleanAlt = altPhone.replace(/\D/g, '').slice(-10);
      if (cleanAlt.length !== 10) {
        return 'Please enter a valid 10-digit alternate contact number';
      }
      if (cleanPrimary === cleanAlt) {
        return 'Alternate contact number must be different from primary phone';
      }
    }
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return 'Please enter a valid email address';
      }
    }
    if (!dob) {
      return 'Please enter your date of birth';
    }
    const birthDate = new Date(dob);
    const ageDiffMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 18) {
      return 'Professionals must be at least 18 years of age to register';
    }
    return '';
  };

  const validateStep2 = () => {
    if (!address.trim() || address.trim().length < 5) {
      return 'Please enter your complete street address & workshop location';
    }
    if (!city.trim()) {
      return 'Please specify your coverage city or panchayat';
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
    // 1. Mandatory Aadhaar Card
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      return 'Please enter your complete 12-digit Aadhaar Number';
    }
    if (!aadhaarDoc?.url) {
      return 'Mandatory Aadhaar Card document photo required! Please take a photo or upload from gallery.';
    }

    // 2. Mandatory Driving License
    if (!drivingLicenseNumber.trim() || drivingLicenseNumber.trim().length < 5) {
      return 'Please enter your Driving License / Trade Badge number';
    }
    if (!drivingLicenseDoc?.url) {
      return 'Mandatory Driving License document photo required! Please take a photo or upload from gallery.';
    }

    // 3. Bank Account
    if (!accountHolderName.trim() || accountHolderName.trim().length < 3) {
      return 'Please enter Account Holder Name as printed on bank passbook';
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
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');

    // Pre-flight validation for mandatory photos & documents
    if (!photoUrl) {
      setErrorMsg('Mandatory Live Selfie photo is missing! Please return to Step 1 to capture your live photo.');
      setCurrentStep(1);
      return;
    }

    const err = validateStep4();
    if (err) {
      setErrorMsg(err);
      return;
    }

    setSubmitting(true);

    const nowIso = new Date().toISOString();
    const primaryCat = primaryCategory || 'Home Services';
    const subSkillsList = (selectedSubSkills && selectedSubSkills.length > 0) ? selectedSubSkills : [primaryCat];
    const expNum = Number(experienceYears) || 3;
    const legalName = fullName.trim();
    const contactPhone = primaryPhone.trim();
    const userEmail = (email || `${legalName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'worker'}@jobit.com`).trim();

    const onboardingPayload = {
      name: legalName,
      phone: contactPhone,
      altPhone: altPhone.trim(),
      email: userEmail,
      gender,
      dob,
      address: address.trim(),
      city: city.trim(),
      serviceArea: city.trim(),
      pincode: pincode.trim(),
      serviceRadius: String(serviceRadius || '25'),
      category: primaryCat,
      categoryName: primaryCat,
      categoryId: `cat_${primaryCat.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      skill: primaryCat,
      skills: subSkillsList,
      categories: [primaryCat],
      subSkills: subSkillsList,
      experience: `${expNum} years`,
      experienceYears: expNum,
      baseRate: Number(baseRate) || 350,
      avatar: photoUrl,
      avatarUrl: photoUrl,
      photo: photoUrl,
      liveSelfieUrl: photoUrl,
      documents: {
        liveSelfieUrl: photoUrl,
        aadhaarNumber: aadhaarNumber.trim(),
        aadhaarDocUrl: aadhaarDoc.url,
        aadhaarDocName: aadhaarDoc.name,
        drivingLicenseNumber: drivingLicenseNumber.trim(),
        drivingLicenseDocUrl: drivingLicenseDoc.url,
        drivingLicenseDocName: drivingLicenseDoc.name,
        idProofUrl: aadhaarDoc.url,
        idProofType: 'Aadhaar Card & Driving License',
        photoUrl
      },
      aadhaarNumber: aadhaarNumber.trim(),
      aadhaarDocUrl: aadhaarDoc.url,
      aadhaarDocName: aadhaarDoc.name,
      drivingLicenseNumber: drivingLicenseNumber.trim(),
      drivingLicenseDocUrl: drivingLicenseDoc.url,
      drivingLicenseDocName: drivingLicenseDoc.name,
      idProofUrl: aadhaarDoc.url,
      idProofType: 'Aadhaar Card & Driving License',
      accountHolderName: accountHolderName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      upiId: upiId.trim(),
      rating: 5.0,
      jobsCompleted: 0,
      totalJobsCompleted: 0,
      status: 'pending',
      workerStatus: 'pending',
      isVerified: false,
      isAvailable: false,
      isOnline: false,
      role: 'WORKER',
      userRole: 'worker',
      appliedAt: nowIso,
      submittedAt: nowIso,
      createdAt: nowIso
    };

    try {
      const savedApp = await registerWorkerOnboarding(onboardingPayload);

      // Auto login as worker in pending approval status
      try {
        await loginWithPhone(
          primaryPhone, 
          'onboarded', 
          legalName, 
          'worker', 
          { 
            workerId: savedApp.id, 
            status: 'pending',
            workerStatus: 'pending',
            ...onboardingPayload 
          }
        );
      } catch (loginErr) {
        console.warn('Auto login after onboarding note:', loginErr);
      }

      setSubmitting(false);
      setIsCompleted(true);
      onSuccess?.(savedApp);
    } catch (err) {
      console.error('Worker registration failed with backend error:', err);
      const errMsg = err?.message || 'Application submission failed. Please check your network and try again.';
      setErrorMsg(errMsg);
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase().trim()) ||
    (c.subCategories && c.subCategories.some(sub => sub.toLowerCase().includes(categorySearch.toLowerCase().trim())))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#0EA5E0] via-[#0284C7] to-[#0369A1] p-5 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-black tracking-tight">Become a Verified Professional</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black uppercase tracking-wider">PRO</span>
                </div>
                <p className="text-[11px] text-sky-100 font-semibold mt-0.5">
                  Join JOBit certified service network • Earn daily payouts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
              title="Close"
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
                    currentStep === 1 ? 'Personal Details & Live Selfie' :
                    currentStep === 2 ? 'Coverage Location' :
                    currentStep === 3 ? 'Category & Trade Skills' :
                    'Govt KYC & Bank Details'
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
                <h3 className="text-xl font-black text-slate-900">Application Submitted! Pending Admin Approval.</h3>
                <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto mt-1 leading-relaxed">
                  Thank you, <strong className="text-slate-800">{fullName}</strong>. Your verified live selfie, Aadhaar, and Driving License documents have been received for review.
                </p>
              </div>

              {/* Application Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200/80 text-xs space-y-2.5 max-w-sm mx-auto">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-200/60">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Selfie" className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500 shadow-xs" />
                  ) : null}
                  <div>
                    <p className="font-black text-slate-900 text-sm">{fullName}</p>
                    <p className="text-[11px] text-slate-500 font-bold">+91 {primaryPhone} (Auto-Linked)</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">Trade Category:</span>
                  <span className="font-black text-slate-900">{primaryCategory}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">Coverage City:</span>
                  <span className="font-black text-slate-900">{city} ({pincode})</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">Documents Attached:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Aadhaar + Driving License
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">Expected Approval:</span>
                  <span className="font-bold text-sky-600">Within 2 to 4 Hours</span>
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
                  Go to Partner Portal
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
              {/* STEP 1: PERSONAL DETAILS & MANDATORY LIVE SELFIE */}
              {/* ========================================================= */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* UNIFIED ACCOUNT DETECTED CARD */}
                  {isAccountAutoDetected ? (
                    <div className="p-3.5 bg-gradient-to-r from-sky-50 via-sky-50/60 to-blue-50 border border-sky-200/90 rounded-2xl shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#0EA5E0] text-white flex items-center justify-center font-black text-sm shadow-xs">
                            {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-black text-slate-900">{fullName || 'Customer Account'}</p>
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Auto-Linked
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-sky-700 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-sky-600" />
                              <span>+91 {primaryPhone}</span>
                              <span className="text-slate-400 font-normal ml-1">• Main Customer Phone</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase text-sky-700 bg-white/90 px-2 py-1 rounded-xl border border-sky-100">
                          Single ID
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-2 pt-2 border-t border-sky-100/80 leading-relaxed">
                        ✓ Registered phone number automatically detected. No re-entry required. Please complete your professional credentials below.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Primary Account Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={primaryPhone}
                          onChange={(e) => setPrimaryPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 98568 51023"
                          className="w-full pl-12 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                        />
                      </div>
                    </div>
                  )}

                  {/* MANDATORY LIVE CAMERA SELFIE SECTION (No Avatars Allowed!) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-dashed border-[#0EA5E0]/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-sky-100 text-[#0EA5E0] flex items-center justify-center">
                          <Camera className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <label className="text-xs font-black text-slate-800">
                            Live Camera Selfie <span className="text-red-500">* (Mandatory)</span>
                          </label>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Mandatory facial photo for partner badge. Stock avatars strictly disallowed.
                          </p>
                        </div>
                      </div>

                      {photoUrl && (
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Live Selfie Verified
                        </span>
                      )}
                    </div>

                    {/* Hidden Native Camera input */}
                    <input
                      ref={selfieCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={(e) => handleFileInput(e, 'selfie', true)}
                    />

                    {photoUrl ? (
                      /* Live Selfie Captured Card */
                      <div className="p-3 bg-white rounded-2xl border border-emerald-200 shadow-xs flex items-center gap-3">
                        <div 
                          onClick={() => setPreviewModalDoc({ title: 'Live Verified Selfie', url: photoUrl, name: 'Live_Selfie.jpg', size: 'Captured Photo' })}
                          className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border-2 border-emerald-500 cursor-pointer group shadow-2xs"
                          title="Click to inspect selfie"
                        >
                          <img
                            src={photoUrl}
                            alt="Live Selfie"
                            className="w-full h-full object-cover transition group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-black text-slate-900 truncate">
                              Live Face Capture
                            </span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
                              PASS
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {selfieCapturedAt ? `Captured today at ${selfieCapturedAt}` : 'Live device verification photo'}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => startLiveCamera('selfie')}
                              className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0EA5E0] text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Retake Live Selfie</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (selfieCameraInputRef.current) {
                                  selfieCameraInputRef.current.click();
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Device Camera</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => removeDoc('selfie')}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg ml-auto transition cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Dual Live Selfie Capture Options */
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => startLiveCamera('selfie')}
                          className="p-3.5 rounded-2xl bg-sky-500 hover:bg-[#0284C7] text-white transition flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer shadow-md group active:scale-98"
                        >
                          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition">
                            <Camera className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-black">Open Live Camera</span>
                          <span className="text-[9px] text-sky-100 font-semibold">Take Selfie Now</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (selfieCameraInputRef.current) {
                              selfieCameraInputRef.current.click();
                            }
                          }}
                          className="p-3.5 rounded-2xl bg-white border-2 border-dashed border-sky-300 hover:border-sky-400 hover:bg-sky-50/50 transition flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer group"
                        >
                          <div className="w-9 h-9 rounded-full bg-sky-100 text-[#0EA5E0] flex items-center justify-center group-hover:scale-110 transition">
                            <Camera className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-black text-slate-800">Phone Camera App</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Native Front Camera</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Full Legal Name */}
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

                  {/* Alternate Phone & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Alternate Mobile <span className="text-slate-400 text-[10px]">(Optional second line)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={altPhone}
                          onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="98765 11223"
                          className="w-full pl-12 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Email Address <span className="text-slate-400 text-[10px]">(For monthly invoices)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. partner.tech@gmail.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      />
                    </div>
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
                      />
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
                      Step 2: Service Coverage & Residential Address
                    </h4>
                  </div>

                  {/* Location Picker Field: Tapping opens full-screen Leaflet map */}
                  <LocationPickerField
                    label="Select Workshop / Base Location"
                    value={city ? `${city}${address ? ` (${address})` : ''}` : ''}
                    placeholder="Tap to drop pin on map for your service hub..."
                    onChange={({ address: resolvedAddr, city: resolvedCity, pincode: resolvedPin }) => {
                      if (resolvedAddr) setAddress(resolvedAddr);
                      if (resolvedCity) setCity(resolvedCity);
                      if (resolvedPin) setPincode(resolvedPin);
                    }}
                  />

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
                      placeholder="Building name, Street, Landmark, Village / Town"
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

                  {/* Quick Locations */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-1.5">Quick Coverage Suggestions:</p>
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
                        Maximum Service Radius <span className="text-red-500">*</span>
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
              {/* STEP 3: DYNAMIC CATEGORY & PROFESSIONAL SKILLS */}
              {/* ========================================================= */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#0EA5E0]" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Step 3: Profession & Trade Categories
                      </h4>
                    </div>
                    <span className="text-[10px] font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                      {categories.length} Categories Synced
                    </span>
                  </div>

                  {/* Search / Filter for all active categories */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Select Service Category <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Search all 20+ service categories (e.g. Electrician, AC, Painting)..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
                      />
                    </div>

                    {/* Scrollable Category Picker Grid with live indicators */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200/80">
                      {filteredCategories.map((c) => {
                        const isSelected = primaryCategory === c.name;
                        return (
                          <button
                            key={c.id || c.name}
                            type="button"
                            onClick={() => handleCategoryChange(c.name)}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="text-lg">{c.icon || '🛠️'}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div>
                              <p className={`text-[11px] font-black leading-tight line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {c.name}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-skills & Services Offered */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Specific Sub-Skills Offered for <strong className="text-[#0EA5E0]">{primaryCategory}</strong> <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200/80">
                      {selectedSubSkills.map((skill) => (
                        <span
                          key={skill}
                          onClick={() => toggleSubSkill(skill)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#0EA5E0] text-white shadow-xs cursor-pointer hover:bg-rose-500 transition"
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
                        placeholder="Add another custom specialization..."
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
                        Base Rate (₹/Job) <span className="text-red-500">*</span>
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
              {/* STEP 4: MANDATORY GOVT KYC & BANK DETAILS */}
              {/* ========================================================= */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <CreditCard className="w-4 h-4 text-[#0EA5E0]" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Step 4: Mandatory KYC & Bank Verification
                    </h4>
                  </div>

                  {/* Hidden inputs for native camera & file gallery picking */}
                  <input
                    ref={aadhaarCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileInput(e, 'aadhaar', true)}
                  />
                  <input
                    ref={aadhaarGalleryInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileInput(e, 'aadhaar', false)}
                  />
                  <input
                    ref={licenseCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileInput(e, 'license', true)}
                  />
                  <input
                    ref={licenseGalleryInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileInput(e, 'license', false)}
                  />

                  {/* 1. MANDATORY AADHAAR CARD VERIFICATION */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-sky-100 text-[#0EA5E0] text-[11px] font-black flex items-center justify-center">1</span>
                        <label className="text-xs font-black text-slate-800">
                          Aadhaar Card <span className="text-red-500">* (Mandatory)</span>
                        </label>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Government UID</span>
                    </div>

                    {/* Aadhaar Number */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        12-Digit Aadhaar Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={14}
                        value={aadhaarNumber}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                          const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
                          setAadhaarNumber(formatted);
                        }}
                        placeholder="e.g. 7845 2319 8812"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0] tracking-wider"
                      />
                    </div>

                    {/* Aadhaar Upload / Preview Box */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                        <span>Aadhaar Document Photo (Front & Back) <span className="text-red-500">*</span></span>
                        {aadhaarDoc?.url && (
                          <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Attached
                          </span>
                        )}
                      </label>

                      {aadhaarDoc?.url ? (
                        <div className="p-2.5 bg-white rounded-2xl border-2 border-emerald-200/80 shadow-xs flex items-center gap-3">
                          <div 
                            onClick={() => setPreviewModalDoc({ title: 'Aadhaar Card Preview', ...aadhaarDoc })}
                            className="relative w-20 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 cursor-pointer group"
                            title="Click to enlarge"
                          >
                            <img
                              src={aadhaarDoc.url}
                              alt="Aadhaar Card"
                              className="w-full h-full object-cover transition group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[11px] font-black text-slate-900 truncate">
                                {aadhaarDoc.name || 'Aadhaar Card Front & Back'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                              <span>{aadhaarDoc.size || 'Captured Photo'}</span>
                              <span>•</span>
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Attached
                              </span>
                            </div>

                            {/* Dual action buttons for re-uploading */}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() => startLiveCamera('aadhaar')}
                                className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0EA5E0] text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer"
                                title="Retake with Camera"
                              >
                                <Camera className="w-3 h-3" />
                                <span>Retake Photo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (aadhaarGalleryInputRef.current) {
                                    aadhaarGalleryInputRef.current.click();
                                  }
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                title="Upload new from Gallery"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>Gallery</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => removeDoc('aadhaar')}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer ml-auto"
                                title="Remove document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Dual Choice Buttons when no document attached */
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => startLiveCamera('aadhaar')}
                            className="p-3 rounded-2xl bg-sky-50 border-2 border-dashed border-[#0EA5E0]/60 hover:border-[#0EA5E0] hover:bg-sky-100/60 transition flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer group"
                          >
                            <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center text-[#0EA5E0] group-hover:scale-110 transition">
                              <Camera className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black text-[#0EA5E0]">Take Photo</span>
                            <span className="text-[9px] text-sky-700/70 font-semibold">Live Camera Capture</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (aadhaarGalleryInputRef.current) {
                                aadhaarGalleryInputRef.current.click();
                              }
                            }}
                            className="p-3 rounded-2xl bg-white border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer group"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-110 transition">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">Upload from Gallery</span>
                            <span className="text-[9px] text-slate-400 font-semibold">Select File / Storage</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. MANDATORY DRIVING LICENSE VERIFICATION */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-[11px] font-black flex items-center justify-center">2</span>
                        <label className="text-xs font-black text-slate-800">
                          Driving License / Trade Badge <span className="text-red-500">* (Mandatory)</span>
                        </label>
                      </div>
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                        Mandatory KYC
                      </span>
                    </div>

                    {/* Driving License Number */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        License / Badge Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={drivingLicenseNumber}
                        onChange={(e) => setDrivingLicenseNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. KL-10-2020-0045129"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0] uppercase tracking-wider"
                      />
                    </div>

                    {/* Driving License Upload / Preview Box */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                        <span>Driving License Photo Document <span className="text-red-500">*</span></span>
                        {drivingLicenseDoc?.url && (
                          <span className="text-[10px] text-purple-600 font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Attached
                          </span>
                        )}
                      </label>

                      {drivingLicenseDoc?.url ? (
                        <div className="p-2.5 bg-white rounded-2xl border-2 border-purple-200/80 shadow-xs flex items-center gap-3">
                          <div 
                            onClick={() => setPreviewModalDoc({ title: 'Driving License Preview', ...drivingLicenseDoc })}
                            className="relative w-20 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 cursor-pointer group"
                            title="Click to enlarge"
                          >
                            <img
                              src={drivingLicenseDoc.url}
                              alt="Driving License"
                              className="w-full h-full object-cover transition group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[11px] font-black text-slate-900 truncate">
                                {drivingLicenseDoc.name || 'Driving License Photo'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                              <span>{drivingLicenseDoc.size || 'Captured Photo'}</span>
                              <span>•</span>
                              <span className="text-purple-600 font-bold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Attached
                              </span>
                            </div>

                            {/* Dual action buttons for re-uploading */}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() => startLiveCamera('license')}
                                className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer"
                                title="Retake with Camera"
                              >
                                <Camera className="w-3 h-3" />
                                <span>Retake Photo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (licenseGalleryInputRef.current) {
                                    licenseGalleryInputRef.current.click();
                                  }
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                title="Upload new from Gallery"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>Gallery</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => removeDoc('license')}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer ml-auto"
                                title="Remove document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Dual Choice Buttons when no DL attached */
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => startLiveCamera('license')}
                            className="p-3 rounded-2xl bg-purple-50/70 border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 transition flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer group"
                          >
                            <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center text-purple-600 group-hover:scale-110 transition">
                              <Camera className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black text-purple-600">Take Photo</span>
                            <span className="text-[9px] text-purple-600/70 font-semibold">Live Camera Capture</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (licenseGalleryInputRef.current) {
                                licenseGalleryInputRef.current.click();
                              }
                            }}
                            className="p-3 rounded-2xl bg-white border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer group"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-110 transition">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">Upload from Gallery</span>
                            <span className="text-[9px] text-slate-400 font-semibold">Select File / Storage</span>
                          </button>
                        </div>
                      )}
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
                        placeholder="As printed on bank passbook"
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
                          placeholder="State Bank of India"
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
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0] uppercase"
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
                          placeholder="••••••••••••"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Confirm Account Number <span className="text-red-500">*</span>
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
                        UPI ID (Optional for Instant Payouts)
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. 9856851023@okaxis"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      />
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </div>

        {/* Persistent Footer Error Alert (Visible on Step 4 and across steps) */}
        {errorMsg && !isCompleted && (
          <div className="px-4 py-2.5 bg-red-50 border-t border-red-200 flex items-center justify-between gap-2 text-xs font-bold text-red-600 animate-shake">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="line-clamp-2">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="text-red-400 hover:text-red-600 text-[10px] underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Navigation Footer */}
        {!isCompleted && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 bg-[#0EA5E0] hover:bg-[#0284C7] text-white rounded-2xl text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer ml-auto"
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

        {/* ========================================================= */}
        {/* LIVE IN-APP CAMERA VIEWFINDER MODAL */}
        {/* ========================================================= */}
        {liveCameraTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
              {/* Header */}
              <div className="p-4 bg-slate-800/90 flex items-center justify-between text-white border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#0EA5E0] flex items-center justify-center text-white">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black">
                      {liveCameraTarget === 'selfie' 
                        ? 'Take Live Facial Selfie' 
                        : liveCameraTarget === 'aadhaar' 
                          ? 'Capture Aadhaar Card' 
                          : 'Capture Driving License'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {liveCameraTarget === 'selfie' 
                        ? 'Look straight at camera with clear face lighting' 
                        : 'Position document edges inside the guidelines'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Viewfinder stream area */}
              <div className="relative aspect-square sm:aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
                {cameraLoading && (
                  <div className="text-center text-white space-y-2 p-4">
                    <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-300">Opening camera stream...</p>
                  </div>
                )}

                {cameraError ? (
                  <div className="text-center text-slate-200 p-5 space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs font-semibold leading-relaxed text-slate-300">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        stopLiveCamera();
                        if (liveCameraTarget === 'selfie') {
                          selfieCameraInputRef.current?.click();
                        } else if (liveCameraTarget === 'aadhaar') {
                          aadhaarCameraInputRef.current?.click();
                        } else {
                          licenseCameraInputRef.current?.click();
                        }
                      }}
                      className="px-4 py-2 bg-[#0EA5E0] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                    >
                      Use Phone Camera App
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${liveCameraTarget === 'selfie' ? '-scale-x-100' : ''}`}
                    />

                    {/* Framing Guidelines */}
                    {liveCameraTarget === 'selfie' ? (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                        <div className="w-52 h-52 rounded-full border-2 border-dashed border-sky-400/90 shadow-[0_0_30px_rgba(14,165,224,0.3)] flex items-center justify-center" />
                        <div className="mt-3 text-center text-[10px] text-white/95 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs font-bold">
                          Fit your face inside the circle
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-4 border-2 border-dashed border-sky-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                        <div className="flex justify-between text-[9px] text-sky-300 font-bold tracking-wider uppercase bg-black/50 px-2 py-0.5 rounded-md self-start">
                          {liveCameraTarget === 'aadhaar' ? 'Aadhaar Card' : 'Driving License'} Frame
                        </div>
                        <div className="text-center text-[10px] text-white/90 bg-black/50 px-2 py-1 rounded-lg backdrop-blur-xs font-medium">
                          Hold steady & ensure text is readable
                        </div>
                      </div>
                    )}
                  </>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Footer Capture Controls */}
              <div className="p-4 bg-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    stopLiveCamera();
                    if (liveCameraTarget === 'selfie') {
                      selfieCameraInputRef.current?.click();
                    } else if (liveCameraTarget === 'aadhaar') {
                      aadhaarCameraInputRef.current?.click();
                    } else {
                      licenseCameraInputRef.current?.click();
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Device App</span>
                </button>

                <button
                  type="button"
                  disabled={cameraLoading || !!cameraError}
                  onClick={captureLivePhoto}
                  className="w-14 h-14 rounded-full bg-white hover:bg-slate-100 border-4 border-sky-400 shadow-xl flex items-center justify-center cursor-pointer active:scale-95 transition disabled:opacity-40"
                  title="Snap Photo"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0EA5E0] flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white text-[10px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DOCUMENT / SELFIE ENLARGE LIGHTBOX PREVIEW MODAL */}
        {/* ========================================================= */}
        {previewModalDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900">{previewModalDoc.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {previewModalDoc.name || 'Captured Document'} • {previewModalDoc.size || 'Inspection Ready'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModalDoc(null)}
                  className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-900 flex items-center justify-center max-h-[380px] overflow-hidden">
                <img
                  src={previewModalDoc.url}
                  alt={previewModalDoc.title}
                  className="max-h-[360px] w-auto max-w-full object-contain rounded-xl shadow-md"
                />
              </div>

              <div className="p-3 bg-white flex items-center justify-between gap-2 border-t border-slate-100">
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High-Resolution Verification Ready
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewModalDoc(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
