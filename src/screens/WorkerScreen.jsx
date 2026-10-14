import React, { useState, useEffect } from 'react';
import { 
  Power, 
  Bell, 
  MapPin, 
  Phone, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Briefcase, 
  DollarSign, 
  Star, 
  AlertTriangle, 
  ArrowRight, 
  ChevronRight,
  ShieldCheck,
  User,
  MessageCircle,
  Sparkles,
  LogOut,
  Compass,
  FileText,
  Camera,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  X,
  Eye,
  Maximize2
} from 'lucide-react';
import { 
  subscribeBookings, 
  subscribeWorkers, 
  acceptJobAsWorker, 
  updateBookingStatus, 
  toggleWorkerDuty,
  subscribePortfolios,
  addWorkerPortfolio,
  deleteWorkerPortfolio
} from '../data/bookingService';
import { useAuth } from '../context/AuthContext';

export function WorkerScreen({ onOpenChat, onLogout, onBack }) {
  const { currentUser } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState(() => currentUser?.workerId || currentUser?.uid || 'worker_rajesh');
  const [bookings, setBookings] = useState([]);
  const [declinedJobIds, setDeclinedJobIds] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'available' | 'history' | 'portfolio'
  
  // Portfolio / Work Albums State
  const [portfolios, setPortfolios] = useState([]);
  const [isUploadAlbumOpen, setIsUploadAlbumOpen] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumCategory, setAlbumCategory] = useState('cat_mehndi');
  const [albumDescription, setAlbumDescription] = useState('');
  const [albumImages, setAlbumImages] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [isSubmittingAlbum, setIsSubmittingAlbum] = useState(false);
  const [selectedAlbumViewer, setSelectedAlbumViewer] = useState(null);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);

  useEffect(() => {
    if (currentUser?.workerId || (currentUser?.role === 'worker' && currentUser?.uid)) {
      setSelectedWorkerId(currentUser.workerId || currentUser.uid);
    }
  }, [currentUser]);

  // Subscribe to real-time workers
  useEffect(() => {
    const unsub = subscribeWorkers((list) => {
      setWorkers(list);
    });
    return () => unsub();
  }, []);

  // Subscribe to real-time bookings
  useEffect(() => {
    const unsub = subscribeBookings((list) => {
      setBookings(list);
    });
    return () => unsub();
  }, []);

  // Subscribe to real-time portfolios
  useEffect(() => {
    const unsub = subscribePortfolios((list) => {
      setPortfolios(list || []);
    });
    return () => unsub();
  }, []);

  // Identify active worker
  const activeWorker = workers.find(w => w.id === selectedWorkerId) || workers[0] || {
    id: 'worker_rajesh',
    name: 'Rajesh Sharma',
    skill: 'Plumbing',
    phone: '98765 43210',
    rating: 4.9,
    jobsCompleted: 745,
    isOnline: true,
    avatar: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=300&q=80'
  };

  const isOnline = Boolean(activeWorker?.isOnline);

  const handleToggleOnline = async () => {
    if (!activeWorker) return;
    await toggleWorkerDuty(activeWorker.id, !isOnline);
  };

  // Incoming unallocated jobs matching skill or broadcast (status: 'pending')
  const incomingBroadcastJobs = bookings.filter(b => 
    b.status === 'pending' && 
    !declinedJobIds.includes(b.id) &&
    (b.workerId === null || b.workerId === activeWorker.id || !b.workerId)
  );

  // My accepted or ongoing jobs
  const myAssignedJobs = bookings.filter(b => 
    b.workerId === activeWorker.id && 
    ['confirmed', 'accepted', 'on_the_way', 'in_progress'].includes(b.status)
  );

  // My completed jobs
  const myCompletedJobs = bookings.filter(b => 
    b.workerId === activeWorker.id && b.status === 'completed'
  );

  // Total earnings calculation (Worker's Net Share)
  const totalEarnings = myCompletedJobs.reduce((sum, b) => {
    const workerShare = Number(b.workerCharge) || (Number(b.price) ? Math.max(0, Number(b.price) - (Number(b.platformFee) || 150)) : 500);
    return sum + workerShare;
  }, 0);

  const handleAcceptJob = async (booking) => {
    await acceptJobAsWorker(booking.id, activeWorker);
    setActiveTab('active');
  };

  const handleDeclineJob = (bookingId) => {
    setDeclinedJobIds(prev => [...prev, bookingId]);
  };

  // Step-by-step sequential progress updater
  const handleAdvanceStep = async (booking) => {
    if (booking.status === 'confirmed' || booking.status === 'accepted') {
      await updateBookingStatus(booking.id, 'on_the_way', {
        onTheWayAt: new Date().toISOString()
      });
    } else if (booking.status === 'on_the_way') {
      await updateBookingStatus(booking.id, 'in_progress', {
        workStartedAt: new Date().toISOString()
      });
    } else if (booking.status === 'in_progress') {
      await updateBookingStatus(booking.id, 'completed', {
        completedAt: new Date().toISOString(),
        paymentStatus: 'paid_cash'
      });
    }
  };

  // Filter albums belonging to the active worker
  const myAlbums = portfolios.filter(p => (p.worker_id || p.workerId) === activeWorker.id);

  // Preset curated sample photos for quick 1-click photo album filling
  const PRESET_PHOTO_SETS = {
    cat_mehndi: [
      'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80'
    ],
    cat_beauty: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80'
    ],
    cat_painting: [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
    ],
    cat_carpenter: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'
    ]
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setAlbumImages((prev) => [...prev, loadEvt.target.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    setAlbumImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
  };

  const handleApplyPresetPack = (catId) => {
    const set = PRESET_PHOTO_SETS[catId] || PRESET_PHOTO_SETS.cat_mehndi;
    setAlbumImages((prev) => [...prev, ...set]);
  };

  const handleRemoveImage = (indexToRemove) => {
    setAlbumImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePublishAlbum = async (e) => {
    e.preventDefault();
    if (!albumTitle.trim()) {
      alert('Please enter an album title (e.g. Bridal Mehndi, Modular Kitchen Setup)');
      return;
    }
    if (albumImages.length === 0) {
      alert('Please upload or select at least one photo for this album.');
      return;
    }

    setIsSubmittingAlbum(true);
    try {
      await addWorkerPortfolio({
        worker_id: activeWorker.id,
        category_id: albumCategory,
        title: albumTitle.trim(),
        description: albumDescription.trim() || 'Work album showcasing quality craftsmanship.',
        image_urls: albumImages
      });

      // Reset form
      setAlbumTitle('');
      setAlbumDescription('');
      setAlbumImages([]);
      setUrlInput('');
      setIsUploadAlbumOpen(false);
      setActiveTab('portfolio');
    } finally {
      setIsSubmittingAlbum(false);
    }
  };

  const handleDeleteAlbum = async (albumId, title) => {
    if (window.confirm(`Delete work album "${title}"?`)) {
      await deleteWorkerPortfolio(albumId);
    }
  };


  const isPendingVerification = 
    (currentUser?.status === 'pending' || currentUser?.workerStatus === 'pending' || currentUser?.workerStatus === 'pending_verification') || 
    (activeWorker?.status === 'pending' || activeWorker?.workerStatus === 'pending' || activeWorker?.status === 'pending_verification' || activeWorker?.workerStatus === 'pending_verification');

  // IF WORKER IS AWAITING ADMIN APPROVAL -> RENDER DEDICATED REVIEW SCREEN
  if (isPendingVerification) {
    return (
      <div className="w-full min-h-screen bg-slate-50 p-5 flex flex-col justify-between text-slate-900 select-none animate-fade-in">
        <div>
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Clock className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Partner Portal</h3>
                <p className="text-[11px] text-amber-600 font-bold">Status: Verification In Progress</p>
              </div>
            </div>

            <button
              onClick={onLogout || onBack}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Under Review Card */}
          <div className="mt-5 bg-white rounded-3xl p-5 border border-amber-200/90 shadow-md text-center space-y-3">
            <div className="w-16 h-16 bg-amber-50 rounded-3xl border-2 border-amber-200 flex items-center justify-center mx-auto text-amber-500 shadow-xs">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full uppercase tracking-wider mb-1.5">
                Admin Review Pending
              </span>
              <h4 className="text-lg font-black text-slate-900">Application Under Verification</h4>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1 leading-relaxed">
                Welcome, <strong>{currentUser?.name || activeWorker?.name}</strong>. Your KYC credentials and trade certificates are being verified by the JOBit Master Admin.
              </p>
            </div>

            {/* Profile Overview */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2 mt-2">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold">Registered Trade:</span>
                <span className="font-black text-slate-900">{currentUser?.categoryName || activeWorker?.skill || 'Home Services'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold">Service Location:</span>
                <span className="font-black text-slate-900">{currentUser?.city || activeWorker?.city || 'Kerala'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold">Registered Contact:</span>
                <span className="font-black text-slate-900">{currentUser?.phone || activeWorker?.phone}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold">Aadhaar Card:</span>
                <span className="font-bold text-amber-600">
                  {currentUser?.aadhaarNumber ? `Verified (${currentUser.aadhaarNumber.slice(-4).padStart(12, '•')})` : 'Attached & Under KYC Check'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold">Driving License:</span>
                <span className="font-bold text-amber-600">
                  {currentUser?.drivingLicenseNumber || currentUser?.drivingLicenseDocUrl ? 'Attached & Under KYC Check' : 'Optional / Attached'}
                </span>
              </div>

              {/* Uploaded Documents Thumbnails */}
              {(currentUser?.aadhaarDocUrl || currentUser?.drivingLicenseDocUrl || currentUser?.idProofUrl) && (
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                    Uploaded Documents
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(currentUser?.aadhaarDocUrl || currentUser?.idProofUrl) && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-1 text-center">
                        <img 
                          src={currentUser?.aadhaarDocUrl || currentUser?.idProofUrl} 
                          alt="Aadhaar" 
                          className="w-full h-16 object-cover rounded-lg mb-1" 
                        />
                        <span className="text-[10px] font-bold text-slate-700 block truncate">Aadhaar Card</span>
                      </div>
                    )}
                    {currentUser?.drivingLicenseDocUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-1 text-center">
                        <img 
                          src={currentUser.drivingLicenseDocUrl} 
                          alt="Driving License" 
                          className="w-full h-16 object-cover rounded-lg mb-1" 
                        />
                        <span className="text-[10px] font-bold text-slate-700 block truncate">Driving License</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Explanatory Timeline Note */}
            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 text-[11px] text-sky-900 font-semibold text-left flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#0EA5E0] shrink-0 mt-0.5" />
              <span>
                Once approved, your profile will immediately unlock the live dispatch radar, job notifications, and daily earnings dashboard.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 space-y-2">
          <button
            onClick={onLogout || onBack}
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition cursor-pointer shadow-sm"
          >
            Switch to Customer Browsing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-28 text-slate-900 select-none">
      
      {/* 1. Top Header with Worker Profile & Duty Switch */}
      <div className="bg-white px-5 pt-3 pb-4 border-b border-slate-100 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={activeWorker.avatar || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=300&q=80"} 
              alt={activeWorker.name}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {activeWorker.name}
                </h3>
                <span className="text-[10px] bg-sky-50 text-[#0EA5E0] font-extrabold px-2 py-0.5 rounded-full">
                  {activeWorker.skill}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                <span>★ {activeWorker.rating || 4.9}</span>
                <span>• {activeWorker.vehicle || 'Bike'}</span>
              </p>
            </div>
          </div>

          {/* Quick Worker Persona Switcher & Exit Button */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="text-[11px] font-bold bg-[#F1F3F5] text-slate-700 rounded-full px-2.5 py-1.5 border border-slate-200 outline-none cursor-pointer"
            >
              {workers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.skill})
                </option>
              ))}
            </select>

            <button
              onClick={onLogout || onBack}
              className="p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition cursor-pointer"
              title="Sign Out of Worker Mode"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Online / Offline Duty Toggle Card */}
        <div className={`mt-3.5 p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
          isOnline 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-xs' 
            : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-200' : 'bg-slate-400'}`} />
            <div>
              <p className="text-xs font-extrabold">
                {isOnline ? "You're Online & Receiving Jobs" : "You're Offline (Duty Off)"}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {isOnline ? "Broadcast radar active in your local service area" : "Toggle on to receive new job dispatches"}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleOnline}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shadow-xs cursor-pointer ${
              isOnline 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'bg-slate-800 text-white hover:bg-slate-900'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isOnline ? 'Go Offline' : 'Go Online'}</span>
          </button>
        </div>
      </div>

      {/* 2. Operations Metrics Bar */}
      <div className="px-5 py-3">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Earnings</p>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
              ₹{totalEarnings || 750}
            </p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active</p>
            <p className="text-sm sm:text-base font-extrabold text-[#0EA5E0] mt-0.5">
              {myAssignedJobs.length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</p>
            <p className="text-sm sm:text-base font-extrabold text-emerald-600 mt-0.5">
              {myCompletedJobs.length + 12}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Incoming Broadcast Alert Card (Flashing when online and job pending) */}
      {isOnline && incomingBroadcastJobs.length > 0 && (
        <div className="px-5 mb-4 animate-scale-up">
          <div className="bg-gradient-to-r from-sky-600 to-[#0EA5E0] text-white p-4 rounded-3xl shadow-glow relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-white/20">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                  New Instant Broadcast Request!
                </span>
              </div>
              <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                {incomingBroadcastJobs.length} Available
              </span>
            </div>

            {/* Top pending broadcast item */}
            {incomingBroadcastJobs.slice(0, 1).map((job) => (
              <div key={job.id} className="pt-3 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-extrabold leading-tight text-white">
                      {job.serviceTitle}
                    </h4>
                    <p className="text-xs text-sky-100 font-medium mt-0.5">
                      Customer: {job.customerName || 'Valued Client'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-amber-300 leading-none">
                      ₹{job.workerCharge || 500}
                    </p>
                    <p className="text-[10px] text-white/90 font-bold mt-0.5">Your Net Earning</p>
                  </div>
                </div>

                {/* Worker Financial Split Details */}
                <div className="bg-white/15 rounded-xl p-2.5 text-[11px] text-white space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-sky-100">Customer Total Bill:</span>
                    <span className="font-bold text-white">₹{job.totalServiceCharge || job.price || 650}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-sky-100">Platform Fee (JOBit Share):</span>
                    <span className="text-amber-200 font-semibold">-₹{job.platformFee || 150}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-sky-100">Advance Inspection Deduction:</span>
                    <span className="text-amber-200 font-semibold">-₹{job.advancePaid || 99}</span>
                  </div>
                  <div className="pt-1 border-t border-white/20 flex justify-between font-bold text-amber-300">
                    <span>Balance to Collect from Customer:</span>
                    <span>₹{job.remainingDue || 551}</span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-2.5 text-xs text-white/95 space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span className="truncate font-semibold">{job.address}</span>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address || 'Melattur, Kerala')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold shrink-0 transition"
                      title="Route in Google Maps"
                    >
                      Maps ➔
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-200 shrink-0" />
                    <span>{job.dateTime}</span>
                  </div>
                  {job.note && (
                    <p className="text-[11px] text-sky-100 italic">"{job.note}"</p>
                  )}
                </div>

                {/* Accept & Decline Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleDeclineJob(job.id)}
                    className="py-2.5 px-3 rounded-full bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs transition active:scale-95 cursor-pointer text-center"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAcceptJob(job)}
                    className="py-2.5 px-3 rounded-full bg-white text-[#0EA5E0] font-black text-xs shadow-md hover:bg-slate-50 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Accept Job</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tab Navigation */}
      <div className="px-5 mb-3">
        <div className="flex rounded-full bg-[#E9ECEF] p-1 text-xs font-bold gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 min-w-[70px] py-2 px-2 rounded-full transition text-center whitespace-nowrap cursor-pointer ${
              activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tasks ({myAssignedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 min-w-[70px] py-2 px-2 rounded-full transition text-center whitespace-nowrap cursor-pointer ${
              activeTab === 'available' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Radar ({incomingBroadcastJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 min-w-[70px] py-2 px-2 rounded-full transition text-center whitespace-nowrap cursor-pointer ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Done ({myCompletedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 min-w-[85px] py-2 px-2 rounded-full transition text-center whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'portfolio' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3 h-3 text-[#0EA5E0]" />
            <span>Albums ({myAlbums.length})</span>
          </button>
        </div>
      </div>

      {/* 5. Ongoing Tasks List with Step-by-Step Action Progression */}
      <div className="px-5 space-y-3.5">
        {activeTab === 'active' && (
          <>
            {myAssignedJobs.map((job) => {
              const stepInfo = {
                accepted: {
                  label: 'Step 1: Worker Accepted',
                  badge: 'bg-sky-50 text-[#0EA5E0]',
                  nextAction: '🚗 I am On The Way',
                  nextHint: 'Tap when you leave your base to head to customer'
                },
                on_the_way: {
                  label: 'Step 2: On The Way',
                  badge: 'bg-purple-50 text-purple-600',
                  nextAction: '📍 Arrived & Start Work',
                  nextHint: 'Tap upon reaching customer doorstep to commence work'
                },
                in_progress: {
                  label: 'Step 3: Work in Progress',
                  badge: 'bg-amber-50 text-amber-600',
                  nextAction: '✅ Complete & Collect Payment',
                  nextHint: 'Tap once service is successfully delivered'
                }
              }[job.status] || {
                label: job.status,
                badge: 'bg-slate-100 text-slate-700',
                nextAction: 'Update',
                nextHint: ''
              };

              return (
                <div 
                  key={job.id} 
                  className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm space-y-3"
                >
                  {/* Status Banner */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {job.categoryName || 'Home Service'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${stepInfo.badge}`}>
                      {job.status === 'confirmed' ? 'ASSIGNED' : job.status === 'accepted' ? 'ACCEPTED' : job.status === 'on_the_way' ? 'EN ROUTE' : 'IN PROGRESS'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      {job.serviceTitle}
                    </h3>
                  </div>

                  {/* Internal Financial Split Calculation for Worker */}
                  <div className="p-3.5 bg-sky-50/70 rounded-2xl border border-sky-100/90 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-600 font-semibold">
                      <span>Total Collected from Customer:</span>
                      <span className="font-extrabold text-slate-900">₹{job.totalServiceCharge || job.price || 650}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>Advance Deduction (Inspection Fee):</span>
                      <span className="font-semibold text-amber-700">-₹{job.advancePaid || 99}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-800 font-bold">
                      <span>Balance Payable by Customer:</span>
                      <span className="font-black text-[#0EA5E0]">₹{job.remainingDue || 551}</span>
                    </div>
                    <div className="pt-1.5 border-t border-sky-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-emerald-800">Worker Charge (Your Share):</span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          (Platform Fee: ₹{job.platformFee || 150})
                        </span>
                      </div>
                      <span className="text-sm font-black text-emerald-600">
                        ₹{job.workerCharge || 500}
                      </span>
                    </div>
                  </div>

                  {/* Customer Card */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sky-100 text-[#0EA5E0] flex items-center justify-center font-bold">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800">{job.customerName || 'Customer'}</p>
                          <p className="text-[11px] text-slate-400">{job.customerPhone || '98765 00001'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${job.customerPhone || '9876543210'}`}
                          className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => onOpenChat?.(job)}
                          className="w-8 h-8 rounded-full bg-sky-50 text-[#0EA5E0] flex items-center justify-center hover:bg-sky-100 transition"
                          title="Chat with Customer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-200/60 text-slate-600 flex items-start justify-between gap-1.5">
                      <div className="flex items-start gap-1.5 flex-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="leading-tight font-medium text-slate-800">{job.address}</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address || 'Melattur, Kerala')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0EA5E0] text-[10px] font-extrabold flex items-center gap-1 shrink-0 transition"
                        title="Open in Google Maps Navigation"
                      >
                        <Compass className="w-3 h-3 text-[#0EA5E0]" />
                        <span>Route</span>
                      </a>
                    </div>

                    {job.note && (
                      <p className="text-[11px] text-slate-500 bg-white p-2 rounded-xl border border-slate-100">
                        <strong>Note:</strong> {job.note}
                      </p>
                    )}
                  </div>

                  {/* Step Stepper Visual */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span className={job.status === 'accepted' ? 'text-[#0EA5E0] font-black' : ''}>1. Accepted</span>
                      <span className={job.status === 'on_the_way' ? 'text-purple-600 font-black' : ''}>2. En Route</span>
                      <span className={job.status === 'in_progress' ? 'text-amber-600 font-black' : ''}>3. Started</span>
                      <span>4. Done</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className={`h-full ${job.status === 'accepted' ? 'w-1/4 bg-[#0EA5E0]' : job.status === 'on_the_way' ? 'w-2/4 bg-purple-500' : 'w-3/4 bg-amber-500'} rounded-full transition-all duration-300`} />
                    </div>
                  </div>

                  {/* Next Step Action Button */}
                  <div className="pt-1">
                    <button
                      onClick={() => handleAdvanceStep(job)}
                      className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white font-black text-xs shadow-glow hover:opacity-95 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{stepInfo.nextAction}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-1 font-semibold">
                      {stepInfo.nextHint}
                    </p>
                  </div>
                </div>
              );
            })}

            {myAssignedJobs.length === 0 && (
              <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 p-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800">No Ongoing Works</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {isOnline 
                    ? "Stay tuned! Broadcast requests appear in real-time when customers book in your city."
                    : "You are currently offline. Turn on your duty switch at the top to receive incoming jobs."}
                </p>
              </div>
            )}
          </>
        )}

        {/* Available / Radar Tab */}
        {activeTab === 'available' && (
          <div className="space-y-3">
            {incomingBroadcastJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#0EA5E0] bg-sky-50 px-2.5 py-0.5 rounded-full">
                    {job.categoryName}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 block">Net: ₹{job.workerCharge || 500}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">Bill: ₹{job.totalServiceCharge || job.price || 650}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">{job.serviceTitle}</h4>
                  <p className="text-xs text-slate-500 font-medium">{job.address}</p>
                </div>

                {/* Worker Financial Split Info */}
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Platform Commission (JOBit):</span>
                    <span className="font-semibold text-slate-700">₹{job.platformFee || 150}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance Inspection Paid:</span>
                    <span className="font-semibold text-amber-700">-₹{job.advancePaid || 99}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-0.5 border-t border-slate-200">
                    <span>Balance to Collect at Doorstep:</span>
                    <span className="text-[#0EA5E0]">₹{job.remainingDue || 551}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleDeclineJob(job.id)}
                    className="flex-1 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAcceptJob(job)}
                    className="flex-1 py-2 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white text-xs font-black shadow-xs"
                  >
                    Accept Job
                  </button>
                </div>
              </div>
            ))}

            {incomingBroadcastJobs.length === 0 && (
              <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 p-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-extrabold text-slate-800">All Jobs Dispatched</h4>
                <p className="text-xs text-slate-400 mt-1">
                  No unallocated requests right now. As soon as a customer creates a booking, it will appear here immediately.
                </p>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {myCompletedJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    COMPLETED & PAID
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-900 mt-1">{job.serviceTitle}</h4>
                  <p className="text-[11px] text-slate-400">{job.customerName} • {job.address?.slice(0, 25)}...</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Customer Bill: ₹{job.totalServiceCharge || job.price || 650} • Platform Fee: ₹{job.platformFee || 150}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">+₹{job.workerCharge || 500}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Net Credited</p>
                </div>
              </div>
            ))}

            {myCompletedJobs.length === 0 && (
              <div className="py-10 text-center bg-white rounded-3xl border border-slate-100 p-6">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-600">No completed jobs yet</h4>
                <p className="text-[11px] text-slate-400">Complete an ongoing job to build your daily earnings log.</p>
              </div>
            )}
          </div>
        )}

        {/* Portfolio / Work Albums Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-4">
            
            {/* Top Showcase Promo Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-4 rounded-3xl shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#38BDF8]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Specialized Portfolio Showcase</span>
                  </div>
                  <h3 className="text-sm font-black text-white mt-1">
                    My Work Albums ({myAlbums.length})
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Upload photo albums of past projects. Customers browsing Mehndi, Beauty, Painting, or Carpentry view your albums before selecting you!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAlbumCategory(activeWorker.categoryId || 'cat_mehndi');
                    setIsUploadAlbumOpen(true);
                  }}
                  className="px-3 py-2 bg-[#0EA5E0] hover:bg-sky-400 text-white text-xs font-black rounded-xl shadow-xs transition shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>New Album</span>
                </button>
              </div>
            </div>

            {/* Work Albums List */}
            {myAlbums.map((album) => {
              const images = album.image_urls || album.imageUrls || [];
              const previewImages = images.slice(0, 4);

              return (
                <div 
                  key={album.id}
                  className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
                          {album.category_id?.replace('cat_', '').replace('_', ' ') || 'Specialized Work'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {images.length} Photos
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-1">
                        {album.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleDeleteAlbum(album.id, album.title)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete Album"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {album.description && (
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {album.description}
                    </p>
                  )}

                  {/* Thumbnail Preview Grid */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {previewImages.map((imgUrl, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setSelectedAlbumViewer(album);
                          setViewerPhotoIndex(idx);
                        }}
                        className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer group shadow-2xs"
                      >
                        <img 
                          src={imgUrl} 
                          alt="Work sample" 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        {idx === 3 && images.length > 4 && (
                          <div className="absolute inset-0 bg-slate-900/70 text-white font-black text-xs flex items-center justify-center">
                            +{images.length - 4}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Published {new Date(album.created_at || Date.now()).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedAlbumViewer(album);
                        setViewerPhotoIndex(0);
                      }}
                      className="text-xs font-bold text-[#0EA5E0] hover:text-sky-600 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Full Album ({images.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {myAlbums.length === 0 && (
              <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center mx-auto">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">No Work Albums Yet</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Publish your past customer projects with high-resolution photos to attract direct customer bookings!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAlbumCategory(activeWorker.categoryId || 'cat_mehndi');
                    setIsUploadAlbumOpen(true);
                  }}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
                >
                  + Upload First Work Album
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Upload New Album Modal */}
      {isUploadAlbumOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#0EA5E0] flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">Upload Work Album</h3>
                  <p className="text-[10px] text-slate-400">Showcase past projects for client bookings</p>
                </div>
              </div>

              <button
                onClick={() => setIsUploadAlbumOpen(false)}
                className="w-8 h-8 rounded-full bg-white text-slate-500 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePublishAlbum} className="p-4 space-y-3.5 overflow-y-auto flex-1">
              
              {/* Album Title */}
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  Album Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder='e.g., "Bridal Mehndi", "Modular Kitchen Setup"'
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0EA5E0]"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  Category *
                </label>
                <select
                  value={albumCategory}
                  onChange={(e) => setAlbumCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0EA5E0]"
                >
                  <option value="cat_mehndi">🖐️ Mehndi Artist (Bridal & Designer)</option>
                  <option value="cat_beauty">💄 Makeup & Beauty (Bridal & Salon)</option>
                  <option value="cat_painting">🎨 Wall Painting / Wallpaper (Texture & Enamel)</option>
                  <option value="cat_carpenter">🪚 Custom Carpentry / Modular Kitchen</option>
                  <option value="cat_electrician">⚡ Electrician</option>
                  <option value="cat_plumbing">🔧 Plumber</option>
                  <option value="cat_ac">❄️ AC Service & Repair</option>
                  <option value="cat_construction">🏗️ Construction & Masonry</option>
                </select>
              </div>

              {/* Description / Details */}
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  Description / Work Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Details of materials used, custom techniques, client requirements, or special finishing..."
                  value={albumDescription}
                  onChange={(e) => setAlbumDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0EA5E0]"
                />
              </div>

              {/* Photo Upload & Gallery Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-700">
                    Album Photos ({albumImages.length}) *
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Upload or paste URLs
                  </span>
                </div>

                {/* Upload Buttons Row */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-[#0EA5E0] border border-sky-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition">
                    <Camera className="w-4 h-4" />
                    <span>Upload Device Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleApplyPresetPack(albumCategory)}
                    className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>+ Quick Preset Photos</span>
                  </button>
                </div>

                {/* Paste URL row */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste an image web URL..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0EA5E0]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Photo Previews Strip */}
                {albumImages.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Selected Photos ({albumImages.length})
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {albumImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img src={img} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-600/90 text-white rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <X className="w-3 h-3 stroke-[3]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadAlbumOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAlbum || albumImages.length === 0 || !albumTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#0EA5E0] hover:from-slate-800 hover:to-sky-500 disabled:opacity-50 text-white text-xs font-black shadow-xs transition cursor-pointer"
                >
                  {isSubmittingAlbum ? 'Publishing...' : 'Publish Album'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Lightbox / Full Album Photo Viewer Modal */}
      {selectedAlbumViewer && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 truncate">
                  {selectedAlbumViewer.title}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedAlbumViewer.image_urls?.length || 0} Photos in Album
                </p>
              </div>
              <button
                onClick={() => setSelectedAlbumViewer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-slate-950 aspect-4/3 flex items-center justify-center overflow-hidden">
              {selectedAlbumViewer.image_urls?.[viewerPhotoIndex] ? (
                <img 
                  src={selectedAlbumViewer.image_urls[viewerPhotoIndex]} 
                  alt="Work detail" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-400 text-xs">No image</div>
              )}
              <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 text-white text-[11px] font-black rounded-full">
                {viewerPhotoIndex + 1} / {selectedAlbumViewer.image_urls?.length || 1}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {(selectedAlbumViewer.image_urls || []).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setViewerPhotoIndex(idx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                    viewerPhotoIndex === idx ? 'border-[#0EA5E0] scale-105' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {selectedAlbumViewer.description && (
              <div className="p-4">
                <p className="text-xs text-slate-600 font-medium">
                  {selectedAlbumViewer.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

