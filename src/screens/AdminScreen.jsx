import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Image as ImageIcon, 
  Tag, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Users, 
  User,
  Briefcase, 
  Clock, 
  MapPin, 
  Phone, 
  AlertCircle, 
  Power, 
  ChevronRight, 
  Filter, 
  LogOut,
  Search,
  Sparkles,
  Layers,
  Star,
  ExternalLink,
  Eye,
  UserCheck,
  UserX,
  FileText,
  CreditCard,
  Bell,
  TrendingUp,
  DollarSign,
  Activity,
  Camera,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { 
  subscribeBookings, 
  subscribeWorkers, 
  subscribeServices,
  subscribeCategories,
  subscribePendingWorkers,
  approveWorkerApplication,
  rejectWorkerApplication,
  subscribeCustomers,
  adminDeleteWorker,
  adminAssignJob, 
  updateBookingStatus, 
  toggleWorkerDuty,
  adminAddService,
  adminUpdateService,
  adminDeleteService,
  adminAddCategory,
  adminUpdateCategory,
  adminDeleteCategory
} from '../data/bookingService';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { initialCategories, initialBanners, initialServices } from '../data/seedData';

// Verified, high-resolution Unsplash technician photos for 1-click quick helper
const TECHNICIAN_PRESETS = [
  { label: 'Plumber in Blue', url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80' },
  { label: 'AC / HVAC Tech', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80' },
  { label: 'Electrician Pro', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80' },
  { label: 'Clean Home Pro', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
  { label: 'Woodwork Carpenter', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Wall Painter', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Car Mechanic', url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80' },
  { label: 'Electronics Tech', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80' }
];

export function AdminScreen({ onBack, onLogout }) {
  const [tab, setTab] = useState('dispatch'); // 'dispatch' (default Bookings & Active Operations) | 'approvals' | 'users_workers' | 'services' | 'categories' | 'banners'
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState(initialServices || []);
  const [categories, setCategories] = useState(initialCategories || []);
  const [banners, setBanners] = useState(initialBanners || []);

  // Approvals & KYC Inspection
  const [selectedPendingWorker, setSelectedPendingWorker] = useState(null);
  const [rejectModalApp, setRejectModalApp] = useState(null);
  const [rejectReason, setRejectReason] = useState('Govt ID copy requires clear photo of address and seal');
  const [approvalSuccessMsg, setApprovalSuccessMsg] = useState('');
  const [zoomedDoc, setZoomedDoc] = useState(null); // { url, title, number, type }
  const [zoomScale, setZoomScale] = useState(1);

  // Users & Workers Sub-tab
  const [userWorkerSubTab, setUserWorkerSubTab] = useState('workers'); // 'workers' | 'customers'
  const [workerSearch, setWorkerSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Dispatch Filter
  const [dispatchFilter, setDispatchFilter] = useState('all'); // 'all' | 'pending' | 'ongoing' | 'completed'

  // Services Filter & Search
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('All');

  // Modals for Worker Assignment
  const [assignModalBooking, setAssignModalBooking] = useState(null);

  // Modals for Services Management
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Add Service Form
  const [serviceForm, setServiceForm] = useState({
    title: '',
    categoryName: 'Electrician',
    subCategory: '',
    price: '300',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80'
  });

  // Edit Service Form
  const [editForm, setEditForm] = useState({
    title: '',
    categoryName: '',
    subCategory: '',
    price: '',
    description: '',
    imageUrl: ''
  });

  // Category Management Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('⚡');
  const [newCatBasePrice, setNewCatBasePrice] = useState('300');
  const [newCatSubText, setNewCatSubText] = useState('');
  const [newCatImg, setNewCatImg] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatPrice, setEditCatPrice] = useState('');

  // Banners Form State
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSub, setNewBannerSub] = useState('');
  const [newBannerPrice, setNewBannerPrice] = useState('300');
  const [newBannerService, setNewBannerService] = useState('Home Repair');
  const [newBannerImg, setNewBannerImg] = useState('');

  // Real-time reactive subscriptions
  useEffect(() => {
    const unsubB = subscribeBookings((list) => setBookings(list || []));
    const unsubW = subscribeWorkers((list) => setWorkers(list || []));
    const unsubP = subscribePendingWorkers((list) => setPendingWorkers(list || []));
    const unsubCust = subscribeCustomers((list) => setCustomers(list || []));
    const unsubS = subscribeServices((list) => setServices(list || []));
    const unsubC = subscribeCategories((list) => setCategories(list || []));

    return () => {
      unsubB();
      unsubW();
      unsubP();
      unsubCust();
      unsubS();
      unsubC();
    };
  }, []);

  // Firestore sync for Banners
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    let unsubBan = () => {};

    try {
      unsubBan = onSnapshot(collection(db, 'banners'), (snap) => {
        if (!snap.empty) {
          setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      }, () => {});
    } catch {}

    return () => unsubBan();
  }, []);

  // Metrics & Active Operations Progress Breakdown
  const totalBookingsCount = bookings.length;
  const unassignedJobs = bookings.filter(b => b.status === 'pending' || !b.workerId);
  const assignedJobs = bookings.filter(b => b.status === 'accepted');
  const inProgressJobs = bookings.filter(b => b.status === 'in_progress' || b.status === 'on_the_way');
  const completedJobs = bookings.filter(b => b.status === 'completed');
  const pendingPaymentJobs = bookings.filter(b => 
    b.status === 'pending_payment' || 
    (b.status === 'completed' && Number(b.remainingDue) > 0) ||
    b.paymentStatus === 'pending'
  );
  const ongoingJobs = bookings.filter(b => ['accepted', 'on_the_way', 'in_progress'].includes(b.status));
  const pendingJobs = bookings.filter(b => b.status === 'pending');
  const approvedWorkers = workers.filter(w => w.status === 'approved' || w.workerStatus === 'approved');
  const onlineWorkers = approvedWorkers.filter(w => w.isOnline);
  const pendingRegistrations = pendingWorkers.filter(p => p.status === 'pending' || p.status === 'pending_verification' || !p.status);

  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalServiceCharge || b.price) || 650), 0);
  const platformRevenue = bookings.reduce((sum, b) => sum + (Number(b.platformFee) || 150), 0);
  const workerRevenue = bookings.reduce((sum, b) => sum + (Number(b.workerCharge) || 500), 0);
  const totalPendingPaymentAmount = pendingPaymentJobs.reduce((sum, b) => sum + (Number(b.remainingDue) || 0), 0);

  // ==========================================
  // PENDING ONBOARDING APPROVALS OPERATIONS
  // ==========================================
  const handleApproveWorker = async (workerApp) => {
    await approveWorkerApplication(workerApp.id);
    setApprovalSuccessMsg(`Approved ${workerApp.name}! Pro status updated to "approved" and listed for platform bookings.`);
    setSelectedPendingWorker(null);
    setTimeout(() => setApprovalSuccessMsg(''), 4000);
  };

  const handleConfirmRejectWorker = async () => {
    if (!rejectModalApp) return;
    await rejectWorkerApplication(rejectModalApp.id, rejectReason);
    setRejectModalApp(null);
    setSelectedPendingWorker(null);
  };

  const handleDeletePro = async (workerId, name) => {
    if (window.confirm(`Are you sure you want to remove verified worker "${name}"?`)) {
      await adminDeleteWorker(workerId);
    }
  };

  const handleAdvanceBookingStatus = async (bookingId, currentStatus) => {
    const nextMap = {
      'pending': 'accepted',
      'accepted': 'in_progress',
      'in_progress': 'completed'
    };
    const nextStatus = nextMap[currentStatus];
    if (nextStatus) {
      await updateBookingStatus(bookingId, nextStatus);
    }
  };

  const handleMarkPaymentSettled = async (bookingId) => {
    await updateBookingStatus(bookingId, 'completed', {
      remainingDue: 0,
      paymentStatus: 'paid'
    });
  };

  // ==========================================
  // DISPATCH OPERATIONS
  // ==========================================
  const handleAssignWorker = async (worker) => {
    if (!assignModalBooking) return;
    await adminAssignJob(assignModalBooking.id, worker);
    setAssignModalBooking(null);
  };

  // ==========================================
  // SERVICE MANAGEMENT OPERATIONS
  // ==========================================
  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!serviceForm.title.trim()) return;

    await adminAddService({
      title: serviceForm.title.trim(),
      categoryName: serviceForm.categoryName.trim(),
      subCategory: serviceForm.subCategory.trim(),
      price: Number(serviceForm.price) || 300,
      description: serviceForm.description.trim(),
      heroImage: serviceForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80',
      imageUrl: serviceForm.imageUrl.trim()
    });

    // Reset and close
    setServiceForm({
      title: '',
      categoryName: categories[0]?.name || 'Electrician',
      subCategory: '',
      price: '300',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80'
    });
    setIsAddServiceOpen(false);
  };

  const handleOpenEditService = (service) => {
    setEditingService(service);
    setEditForm({
      title: service.title || '',
      categoryName: service.categoryName || '',
      subCategory: service.subCategory || service.subCategories?.[0] || '',
      price: String(service.price || 300),
      description: service.about || service.description || '',
      imageUrl: service.heroImage || service.imageUrl || service.image || ''
    });
  };

  const handleSaveEditService = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    await adminUpdateService(editingService.id, {
      title: editForm.title.trim(),
      categoryName: editForm.categoryName.trim(),
      subCategory: editForm.subCategory.trim(),
      price: Number(editForm.price) || 300,
      about: editForm.description.trim(),
      heroImage: editForm.imageUrl.trim(),
      imageUrl: editForm.imageUrl.trim()
    });

    setEditingService(null);
  };

  const handleDeleteService = async (serviceId, serviceTitle) => {
    if (window.confirm(`Are you sure you want to delete "${serviceTitle}"? This will immediately remove it from user search and listings.`)) {
      await adminDeleteService(serviceId);
    }
  };

  // ==========================================
  // CATEGORY OPERATIONS
  // ==========================================
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await adminAddCategory({
      name: newCatName.trim(),
      icon: newCatIcon.trim() || '🛠️',
      basePrice: Number(newCatBasePrice) || 300,
      subCategoryText: newCatSubText.trim(),
      image: newCatImg.trim()
    });

    setNewCatName('');
    setNewCatIcon('⚡');
    setNewCatBasePrice('300');
    setNewCatSubText('');
    setNewCatImg('');
  };

  const handleUpdateCategoryPrice = async (catId) => {
    if (!editCatPrice) return;
    await adminUpdateCategory(catId, { basePrice: Number(editCatPrice) });
    setEditingCategory(null);
    setEditCatPrice('');
  };

  const handleDeleteCategory = async (id, name) => {
    if (window.confirm(`Delete category "${name}"?`)) {
      await adminDeleteCategory(id);
    }
  };

  // ==========================================
  // BANNER OPERATIONS
  // ==========================================
  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!newBannerTitle) return;

    const banObj = {
      title: newBannerTitle.trim(),
      subtitle: newBannerSub.trim() || 'Get quick access to home services',
      image: newBannerImg.trim() || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=600&q=80',
      serviceName: newBannerService.trim() || 'Home Repair',
      price: Number(newBannerPrice) || 300,
      order: banners.length + 1,
      active: true
    };

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'banners'), banObj);
      } catch {}
    }
    setBanners(prev => [...prev, { id: 'ban_' + Date.now(), ...banObj }]);
    setNewBannerTitle('');
    setNewBannerSub('');
    setNewBannerImg('');
  };

  const handleDeleteBanner = async (id) => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'banners', id));
      } catch {}
    }
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  // Filtered Services in Admin
  const filteredServices = services.filter((s) => {
    if (!s) return false;
    const q = serviceSearch.toLowerCase().trim();
    const matchSearch = !q || (s.title || '').toLowerCase().includes(q) || (s.categoryName || '').toLowerCase().includes(q) || (s.subCategory || '').toLowerCase().includes(q);
    const matchCat = serviceCategoryFilter === 'All' || (s.categoryName || '').toLowerCase().includes(serviceCategoryFilter.toLowerCase());
    return matchSearch && matchCat;
  });

  // Filtered Bookings in Dispatch / Bookings Tracker
  const filteredBookings = bookings.filter(b => {
    if (dispatchFilter === 'needs_dispatch' || dispatchFilter === 'pending') {
      return b.status === 'pending' || !b.workerId;
    }
    if (dispatchFilter === 'assigned') {
      return b.status === 'accepted';
    }
    if (dispatchFilter === 'in_progress') {
      return ['on_the_way', 'in_progress'].includes(b.status);
    }
    if (dispatchFilter === 'work_done' || dispatchFilter === 'completed') {
      return b.status === 'completed';
    }
    if (dispatchFilter === 'pending_payment') {
      return b.status === 'pending_payment' || 
        (b.status === 'completed' && Number(b.remainingDue) > 0) || 
        b.paymentStatus === 'pending';
    }
    if (dispatchFilter === 'ongoing') {
      return ['accepted', 'on_the_way', 'in_progress'].includes(b.status);
    }
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-28 text-slate-900 select-none">
      
      {/* 1. Master Header */}
      <header className="px-5 py-3 border-b border-slate-200/80 flex items-center justify-between sticky top-0 bg-white z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-800 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
            title="Back to Customer App"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Admin Control Center</h2>
            <p className="text-[10px] text-purple-600 font-extrabold uppercase tracking-wider">
              Services, Pricing & Dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Secondary Top-Corner Worker Approvals Navigation Item with Red Notification Badge */}
          <button
            onClick={() => setTab('approvals')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer border ${
              tab === 'approvals'
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs'
            }`}
            title="Worker Onboarding Approvals"
          >
            <Bell className={`w-3.5 h-3.5 ${pendingRegistrations.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>Approvals</span>
            {pendingRegistrations.length > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
                {pendingRegistrations.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1.5 rounded-full text-[11px] font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Super Admin</span>
          </div>
          <button
            onClick={onLogout || onBack}
            className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition cursor-pointer"
            title="Sign Out of Admin Control"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Feedback Toast */}
      {approvalSuccessMsg && (
        <div className="mx-5 mb-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-black text-emerald-800 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{approvalSuccessMsg}</span>
        </div>
      )}

      {/* 2. Operational Metrics & Active Jobs Progress Top Highlights */}
      <div className="px-5 py-3 space-y-2.5">
        
        {/* Real-Time Activity Status Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-slate-800">Real-Time Operations</span>
            <span className="text-slate-400 font-semibold hidden sm:inline">• Hyperlocal Dispatch Active</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
            <span>
              <strong className="text-emerald-600 font-black">{onlineWorkers.length}</strong>/{approvedWorkers.length} Pros Online
            </span>
            <span>•</span>
            <span>
              <strong className="text-[#0EA5E0] font-black">{ongoingJobs.length}</strong> Live Jobs
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-900 font-black">{totalBookingsCount}</strong> Bookings
            </span>
          </div>
        </div>

        {/* Highlighted Job Progress Statuses & Total Revenue Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          
          {/* Total Revenue */}
          <div 
            onClick={() => { setTab('dispatch'); setDispatchFilter('all'); }}
            className={`p-3 rounded-2xl cursor-pointer transition shadow-xs ${
              tab === 'dispatch' && dispatchFilter === 'all'
                ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white ring-2 ring-slate-900'
                : 'bg-gradient-to-br from-slate-900 to-slate-800 text-white hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold uppercase tracking-wider">
              <span>Total Revenue</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-lg font-black text-white mt-1">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-400 font-bold mt-0.5 truncate">
              ₹{platformRevenue.toLocaleString()} fee • ₹{workerRevenue.toLocaleString()} pros
            </p>
          </div>

          {/* Assigned */}
          <div 
            onClick={() => { setTab('dispatch'); setDispatchFilter('assigned'); }}
            className={`p-3 rounded-2xl bg-white border cursor-pointer transition shadow-2xs hover:border-sky-400 ${
              tab === 'dispatch' && dispatchFilter === 'assigned'
                ? 'border-sky-500 ring-2 ring-sky-100 bg-sky-50/40'
                : 'border-slate-200/80 hover:bg-sky-50/20'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-sky-700 font-black uppercase tracking-wider">
              <span>Assigned</span>
              <UserCheck className="w-3.5 h-3.5 text-[#0EA5E0]" />
            </div>
            <p className="text-lg font-black text-[#0EA5E0] mt-1">{assignedJobs.length}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
              Technicians Allocated
            </p>
          </div>

          {/* In Progress */}
          <div 
            onClick={() => { setTab('dispatch'); setDispatchFilter('in_progress'); }}
            className={`p-3 rounded-2xl bg-white border cursor-pointer transition shadow-2xs hover:border-indigo-400 ${
              tab === 'dispatch' && dispatchFilter === 'in_progress'
                ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/40'
                : 'border-slate-200/80 hover:bg-indigo-50/20'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-indigo-700 font-black uppercase tracking-wider">
              <span>In Progress</span>
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-lg font-black text-indigo-600 mt-1">{inProgressJobs.length}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
              En Route & Executing
            </p>
          </div>

          {/* Work Done */}
          <div 
            onClick={() => { setTab('dispatch'); setDispatchFilter('work_done'); }}
            className={`p-3 rounded-2xl bg-white border cursor-pointer transition shadow-2xs hover:border-emerald-400 ${
              tab === 'dispatch' && (dispatchFilter === 'work_done' || dispatchFilter === 'completed')
                ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/40'
                : 'border-slate-200/80 hover:bg-emerald-50/20'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-emerald-700 font-black uppercase tracking-wider">
              <span>Work Done</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-lg font-black text-emerald-600 mt-1">{completedJobs.length}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
              Tasks Completed
            </p>
          </div>

          {/* Pending Payment */}
          <div 
            onClick={() => { setTab('dispatch'); setDispatchFilter('pending_payment'); }}
            className={`p-3 rounded-2xl bg-white border cursor-pointer transition shadow-2xs hover:border-amber-400 ${
              tab === 'dispatch' && dispatchFilter === 'pending_payment'
                ? 'border-amber-500 ring-2 ring-amber-100 bg-amber-50/40'
                : 'border-slate-200/80 hover:bg-amber-50/20'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-amber-700 font-black uppercase tracking-wider">
              <span>Pending Payment</span>
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-lg font-black text-amber-600 mt-1">{pendingPaymentJobs.length}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
              ₹{totalPendingPaymentAmount.toLocaleString()} Due
            </p>
          </div>

          {/* Needs Dispatch / Unallocated */}
          <div 
            onClick={() => { setTab('dispatch'); setDispatchFilter('needs_dispatch'); }}
            className={`p-3 rounded-2xl bg-white border cursor-pointer transition shadow-2xs hover:border-rose-400 ${
              tab === 'dispatch' && (dispatchFilter === 'needs_dispatch' || dispatchFilter === 'pending')
                ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/40'
                : 'border-slate-200/80 hover:bg-rose-50/20'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-rose-700 font-black uppercase tracking-wider">
              <span>Needs Dispatch</span>
              <Clock className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <p className="text-lg font-black text-rose-600 mt-1">{unassignedJobs.length}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
              Pending Allocation
            </p>
          </div>

        </div>
      </div>

      {/* 3. Navigation Tabs: Bookings Tracker FIRST and Primary; Approvals in Corner Tab */}
      <div className="px-5 mb-3">
        <div className="flex items-center justify-between gap-2">
          
          {/* Main Dashboard Navigation Tabs */}
          <div className="flex bg-[#E9ECEF] rounded-full p-1 text-xs font-bold overflow-x-auto no-scrollbar gap-1 flex-1">
            <button
              onClick={() => setTab('dispatch')}
              className={`py-2 px-3.5 rounded-full whitespace-nowrap transition cursor-pointer shrink-0 font-extrabold flex items-center gap-1.5 ${
                tab === 'dispatch' ? 'bg-[#0EA5E0] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Bookings Tracker ({bookings.length})</span>
            </button>

            <button
              onClick={() => setTab('users_workers')}
              className={`py-2 px-3.5 rounded-full whitespace-nowrap transition cursor-pointer shrink-0 font-extrabold flex items-center gap-1.5 ${
                tab === 'users_workers' ? 'bg-[#0EA5E0] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users & Pros ({approvedWorkers.length + customers.length})</span>
            </button>

            <button
              onClick={() => setTab('services')}
              className={`py-2 px-3 rounded-full whitespace-nowrap transition cursor-pointer shrink-0 font-extrabold flex items-center gap-1.5 ${
                tab === 'services' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Services ({services.length})</span>
            </button>

            <button
              onClick={() => setTab('categories')}
              className={`py-2 px-3 rounded-full whitespace-nowrap transition cursor-pointer shrink-0 font-extrabold flex items-center gap-1.5 ${
                tab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Categories ({categories.length})</span>
            </button>

            <button
              onClick={() => setTab('banners')}
              className={`py-2 px-3 rounded-full whitespace-nowrap transition cursor-pointer shrink-0 font-extrabold flex items-center gap-1.5 ${
                tab === 'banners' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Banners ({banners.length})</span>
            </button>
          </div>

          {/* Clean Side-Tab / Corner Navigation Item for Worker Approvals with Red Notification Badge */}
          <button
            onClick={() => setTab('approvals')}
            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-black transition cursor-pointer shrink-0 border ${
              tab === 'approvals'
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs'
            }`}
            title="Worker Onboarding Approvals"
          >
            <UserCheck className={`w-3.5 h-3.5 ${tab === 'approvals' ? 'text-white' : 'text-amber-500'}`} />
            <span>Approvals</span>
            {pendingRegistrations.length > 0 && (
              <span className="w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {pendingRegistrations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3.1 TAB: PENDING APPROVALS (Urban Company Style KYC Review) */}
      {/* ========================================================= */}
      {tab === 'approvals' && (
        <div className="px-5 space-y-3.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Worker Onboarding Approvals
              </h4>
              <p className="text-[11px] text-slate-400 font-semibold">
                Verify govt ID, trade skills, coverage area & bank details
              </p>
            </div>
            <span className="text-xs font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              {pendingRegistrations.length} Awaiting Review
            </span>
          </div>

          {pendingRegistrations.length === 0 ? (
            <div className="py-12 px-4 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h5 className="text-sm font-black text-slate-800">No Pending Approvals</h5>
              <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                All technician registrations and KYC document requests have been reviewed and processed!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingRegistrations.map((app) => {
                const professionTitle = app.categoryName || app.skill || 'AC Service';
                const formattedLocation = `${app.city || 'Melattur, Kerala'}${app.pincode ? ` - ${app.pincode}` : ' - 679326'}`;
                
                return (
                  <div 
                    key={app.id}
                    className="bg-white rounded-2xl p-3 border border-slate-200/90 hover:border-amber-400 shadow-2xs space-y-2.5 transition"
                  >
                    {/* Compact Single Row: Small Avatar (60x60px) + Neatly Organized Details */}
                    <div className="flex items-center gap-3">
                      
                      {/* Small Profile Photo (60x60px circular avatar) */}
                      <div className="relative shrink-0">
                        <img 
                          src={app.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=200&q=80"}
                          alt={app.name}
                          className="w-[60px] h-[60px] rounded-full object-cover border-2 border-amber-400 shadow-xs shrink-0"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white" title="Pending Verification" />
                      </div>

                      {/* Worker Details - readable at a glance without vertical scrolling */}
                      <div className="flex-1 min-w-0">
                        
                        {/* Worker Name & Profession Badge (e.g., Zaf - AC Service) */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="text-sm font-black text-slate-900 leading-tight">
                            {app.name}
                          </h5>
                          <span className="text-[11px] font-black px-2.5 py-0.5 bg-sky-50 text-[#0EA5E0] border border-sky-200/80 rounded-full inline-flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-[#0EA5E0]" />
                            <span>{app.name} - {professionTitle}</span>
                          </span>
                          <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                            Pending KYC
                          </span>
                        </div>

                        {/* Phone Number & Area Address */}
                        <div className="mt-1 flex items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-semibold flex-wrap">
                          <span className="flex items-center gap-1 text-slate-800">
                            <Phone className="w-3.5 h-3.5 text-[#0EA5E0] shrink-0" />
                            <span className="font-bold">{app.phone || 'No phone'}</span>
                          </span>
                          <span className="flex items-center gap-1 text-slate-500 truncate">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">{formattedLocation}</span>
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Quick Action Buttons: "Inspect KYC", "Approve", "Reject" arranged side-by-side cleanly */}
                    <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedPendingWorker(app)}
                        className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        title="Inspect Govt ID, Aadhaar and Driving License"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect KYC</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveWorker(app)}
                        className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRejectModalApp(app);
                          setRejectReason('Govt ID document requires clearer upload');
                        }}
                        className="py-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3.2 TAB: USERS & WORKERS MANAGEMENT                      */}
      {/* ========================================================= */}
      {tab === 'users_workers' && (
        <div className="px-5 space-y-3.5 animate-fade-in">
          {/* Sub-tab toggle */}
          <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setUserWorkerSubTab('workers')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                userWorkerSubTab === 'workers' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Verified Technicians ({approvedWorkers.length})</span>
            </button>
            <button
              onClick={() => setUserWorkerSubTab('customers')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                userWorkerSubTab === 'customers' 
                  ? 'bg-white text-purple-700 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customers ({customers.length})</span>
            </button>
          </div>

          {/* VERIFIED TECHNICIANS SUB-VIEW */}
          {userWorkerSubTab === 'workers' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  placeholder="Search technicians by name, trade or phone..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
                />
              </div>

              <div className="space-y-2.5">
                {approvedWorkers
                  .filter(w => !workerSearch || 
                    (w.name || '').toLowerCase().includes(workerSearch.toLowerCase()) ||
                    (w.skill || '').toLowerCase().includes(workerSearch.toLowerCase()) ||
                    (w.phone || '').includes(workerSearch)
                  )
                  .map((w) => (
                    <div 
                      key={w.id} 
                      className="p-3.5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={w.avatar || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=200&q=80"}
                            alt={w.name}
                            className="w-11 h-11 rounded-2xl object-cover"
                          />
                          <span 
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              w.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                        </div>
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-900">{w.name}</h5>
                          <p className="text-[11px] font-semibold text-slate-400">{w.skill} • {w.phone}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                            <span className="font-bold text-amber-500">★ {w.rating || '4.9'}</span>
                            <span>• {w.jobsCompleted || 120} jobs</span>
                            <span>• {w.city || 'Kerala'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleWorkerDuty(w.id, !w.isOnline)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            w.isOnline 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{w.isOnline ? 'Online' : 'Offline'}</span>
                        </button>

                        <button
                          onClick={() => handleDeletePro(w.id, w.name)}
                          className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition cursor-pointer"
                          title="Remove Worker"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ACTIVE CUSTOMERS SUB-VIEW */}
          {userWorkerSubTab === 'customers' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name, phone or city..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
                />
              </div>

              <div className="space-y-2.5">
                {customers
                  .filter(c => !customerSearch ||
                    (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
                    (c.phone || '').includes(customerSearch) ||
                    (c.city || '').toLowerCase().includes(customerSearch.toLowerCase())
                  )
                  .map((c) => (
                    <div 
                      key={c.id} 
                      className="p-3.5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={c.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                          alt={c.name}
                          className="w-11 h-11 rounded-2xl object-cover"
                        />
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-900">{c.name}</h5>
                          <p className="text-[11px] font-semibold text-slate-400">{c.phone} • {c.email || 'customer@example.com'}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                            <span className="font-bold text-[#0EA5E0]">{c.totalBookings || 1} Orders Placed</span>
                            <span>• {c.city || 'Melattur, Kerala'}</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        Active User
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TAB: SERVICES MANAGEMENT (Comprehensive CRUD & Prices) */}
      {/* ========================================================= */}
      {tab === 'services' && (
        <div className="px-5 space-y-3.5 animate-fade-in">
          
          {/* Top Action Row: Search + "+ Add New Service" Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search services or categories..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0] shadow-2xs"
              />
              {serviceSearch && (
                <button
                  onClick={() => setServiceSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setIsAddServiceOpen(true)}
              className="py-2 px-3.5 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm shadow-sky-400/20 active:scale-95 transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Service</span>
            </button>
          </div>

          {/* Quick Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() => setServiceCategoryFilter('All')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition shrink-0 cursor-pointer ${
                serviceCategoryFilter === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({services.length})
            </button>
            {categories.slice(0, 10).map((cat) => (
              <button
                key={cat.id || cat.name}
                onClick={() => setServiceCategoryFilter(cat.name)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition shrink-0 cursor-pointer ${
                  serviceCategoryFilter === cat.name
                    ? 'bg-[#0EA5E0] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Services List Counter */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-0.5">
            <span>Showing <strong className="text-slate-900 font-black">{filteredServices.length}</strong> active service cards</span>
            {serviceCategoryFilter !== 'All' && (
              <button
                onClick={() => setServiceCategoryFilter('All')}
                className="text-[#0EA5E0] font-bold hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Service Cards List */}
          <div className="space-y-3">
            {filteredServices.map((service) => {
              const currentImg = service.heroImage || service.imageUrl || service.image || 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=300&q=80';

              return (
                <div
                  key={service.id}
                  className="p-3.5 sm:p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2.5"
                >
                  {/* Card Header: Left Image Thumbnail, Middle Metadata, Right Action Buttons */}
                  <div className="flex items-start gap-3">
                    
                    {/* Thumbnail Image Container (Proper object-fit: cover and rounded corners) */}
                    <div 
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden shrink-0 bg-slate-100 ring-1 ring-slate-200/70 shadow-2xs relative"
                      style={{ width: '4.25rem', height: '4.25rem', minWidth: '4.25rem', minHeight: '4.25rem', borderRadius: '1rem' }}
                    >
                      <img
                        src={currentImg}
                        alt={service.title}
                        className="w-full h-full object-cover block rounded-2xl"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem' }}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold text-[#0EA5E0] bg-sky-50 px-2 py-0.5 rounded-full">
                          {service.categoryName || 'Service'}
                        </span>
                        {service.subCategory && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                            {service.subCategory}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-extrabold text-[#111827] mt-1 leading-snug truncate">
                        {service.title}
                      </h4>

                      {/* Pricing Tag: Hourly rate badge */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          ₹{service.price}/hour
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>{service.rating || 4.9}</span>
                          <span className="text-slate-400">({service.reviewCount || 100})</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Edit & Delete Quick Buttons */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditService(service)}
                        className="py-1.5 px-3 rounded-xl bg-sky-50 hover:bg-[#0EA5E0] text-[#0EA5E0] hover:text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-sky-100"
                        title="Edit service details & pricing"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id, service.title)}
                        className="p-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition cursor-pointer self-end"
                        title="Delete service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description snippet */}
                  {(service.about || service.description) && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                      {service.about || service.description}
                    </p>
                  )}

                  {/* Image URL preview strip */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100/80">
                    <div className="flex items-center gap-1 truncate max-w-[280px]">
                      <ImageIcon className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{currentImg}</span>
                    </div>
                    <span className="text-slate-400 shrink-0">ID: {service.id?.slice(-6)}</span>
                  </div>

                </div>
              );
            })}

            {filteredServices.length === 0 && (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
                <p className="text-sm font-bold text-slate-700">No services match your search</p>
                <button
                  onClick={() => {
                    setServiceSearch('');
                    setServiceCategoryFilter('All');
                  }}
                  className="text-xs font-bold text-[#0EA5E0] hover:underline"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TAB: CATEGORIES MANAGEMENT */}
      {/* ========================================================= */}
      {tab === 'categories' && (
        <div className="px-5 space-y-4 animate-fade-in">
          
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="p-4 rounded-3xl bg-white border border-slate-200/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800">Add New Category</h4>
              <span className="text-[10px] font-bold text-[#0EA5E0] bg-sky-50 px-2 py-0.5 rounded-full">
                Applies dynamically
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3">
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category Name (e.g. Solar Panel Care)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  placeholder="Icon ⚡"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-center focus:outline-none focus:border-[#0EA5E0]"
                  title="Emoji icon for category badge"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Base Price (₹)</label>
                <input
                  type="number"
                  value={newCatBasePrice}
                  onChange={(e) => setNewCatBasePrice(e.target.value)}
                  placeholder="Base Price (₹)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Sub-Categories / Issues</label>
                <input
                  type="text"
                  value={newCatSubText}
                  onChange={(e) => setNewCatSubText(e.target.value)}
                  placeholder="Issue 1, Issue 2, Issue 3"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#0EA5E0] hover:bg-[#0284C7] text-white text-xs font-extrabold shadow-sm active:scale-98 transition cursor-pointer"
            >
              + Create Category
            </button>
          </form>

          {/* Categories List */}
          <div className="space-y-2.5">
            {categories.map((c) => (
              <div 
                key={c.id || c.name} 
                className="p-3.5 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-between shadow-xs hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 border border-slate-100"
                    style={{ backgroundColor: c.color || '#F1F5F9' }}
                  >
                    {c.icon || '🛠️'}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-extrabold text-slate-900 truncate">{c.name}</h5>
                    <p className="text-[11px] font-bold text-emerald-700">
                      Base Rate: ₹{c.basePrice || 300}
                    </p>
                    {c.subCategories && (
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {Array.isArray(c.subCategories) ? c.subCategories.slice(0, 3).join(', ') : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setEditingCategory(c);
                      setEditCatPrice(String(c.basePrice || 300));
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-[#0EA5E0] transition cursor-pointer"
                    title="Edit base price"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. TAB: LIVE DISPATCH */}
      {/* ========================================================= */}
      {tab === 'dispatch' && (
        <div className="px-5 space-y-3.5 animate-fade-in">
          
          {/* Active Jobs Progress Pipeline & Filter Bar */}
          <div className="bg-white p-3.5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#0EA5E0]" />
                  <span>Active Jobs Progress & Dispatch Tracker</span>
                </h4>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Live workflow pipeline from technician allocation to payment settlement
                </p>
              </div>
              <span className="text-[11px] font-black px-2.5 py-1 bg-sky-50 text-[#0EA5E0] rounded-full border border-sky-100">
                {ongoingJobs.length} Active Jobs
              </span>
            </div>

            {/* Filter Pills with Job Progress Counts */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: `All Jobs (${bookings.length})` },
                { id: 'assigned', label: `Assigned (${assignedJobs.length})`, count: assignedJobs.length, color: 'text-sky-700' },
                { id: 'in_progress', label: `In Progress (${inProgressJobs.length})`, count: inProgressJobs.length, color: 'text-indigo-700' },
                { id: 'work_done', label: `Work Done (${completedJobs.length})`, count: completedJobs.length, color: 'text-emerald-700' },
                { id: 'pending_payment', label: `Pending Payment (${pendingPaymentJobs.length})`, count: pendingPaymentJobs.length, color: 'text-amber-700' },
                { id: 'needs_dispatch', label: `Needs Dispatch (${unassignedJobs.length})`, count: unassignedJobs.length, color: 'text-rose-700' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDispatchFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    dispatchFilter === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bookings cards */}
          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="py-12 px-4 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center mx-auto">
                  <Activity className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-black text-slate-800">No Bookings In This Stage</h5>
                <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                  No service jobs matching the filter "{dispatchFilter.replace('_', ' ')}". Select another stage to view bookings.
                </p>
                <button
                  onClick={() => setDispatchFilter('all')}
                  className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-black cursor-pointer"
                >
                  View All Jobs
                </button>
              </div>
            ) : (
              filteredBookings.map((b) => {
                const isPending = b.status === 'pending' || !b.workerId;
                const isAssigned = b.status === 'accepted';
                const isInProgress = ['on_the_way', 'in_progress'].includes(b.status);
                const isWorkDone = b.status === 'completed';
                const isPaymentPending = b.status === 'pending_payment' || (b.status === 'completed' && Number(b.remainingDue) > 0) || b.paymentStatus === 'pending';

                return (
                  <div 
                    key={b.id} 
                    className={`p-4 rounded-3xl bg-white border transition shadow-xs space-y-3 ${
                      isPending ? 'border-amber-300 ring-2 ring-amber-100' :
                      isInProgress ? 'border-indigo-300 ring-2 ring-indigo-50' :
                      isPaymentPending ? 'border-amber-200' : 'border-slate-200/80'
                    }`}
                  >
                    {/* Header: Service Category & Progress Status Badge */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold text-[#0EA5E0] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                            {b.categoryName || 'Service'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            #{b.id.slice(-6)}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1">{b.serviceTitle}</h4>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1 ${
                        isPending ? 'bg-amber-100 text-amber-800' :
                        isAssigned ? 'bg-sky-100 text-[#0EA5E0]' :
                        isInProgress ? 'bg-indigo-100 text-indigo-700 animate-pulse' :
                        isPaymentPending ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        isWorkDone ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {isPending && <Clock className="w-3 h-3" />}
                        {isAssigned && <UserCheck className="w-3 h-3" />}
                        {isInProgress && <Activity className="w-3 h-3" />}
                        {isWorkDone && !isPaymentPending && <CheckCircle2 className="w-3 h-3" />}
                        {isPaymentPending && <CreditCard className="w-3 h-3" />}
                        <span>
                          {isPaymentPending && isWorkDone ? 'Work Done • Due ₹' + (b.remainingDue || 551) : b.status.replace(/_/g, ' ')}
                        </span>
                      </span>
                    </div>

                    {/* Active Jobs Progress Visual Stepper */}
                    <div className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] font-extrabold">
                        {/* Step 1: Assigned */}
                        <div className={`flex items-center gap-1 ${!isPending ? 'text-[#0EA5E0]' : 'text-slate-400'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                            !isPending ? 'bg-[#0EA5E0] text-white' : 'bg-slate-200 text-slate-500'
                          }`}>1</span>
                          <span>Assigned</span>
                        </div>
                        <div className={`h-0.5 flex-1 mx-2 ${isInProgress || isWorkDone ? 'bg-[#0EA5E0]' : 'bg-slate-200'}`} />

                        {/* Step 2: In Progress */}
                        <div className={`flex items-center gap-1 ${isInProgress || isWorkDone ? 'text-indigo-600' : 'text-slate-400'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                            isInProgress || isWorkDone ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>2</span>
                          <span>In Progress</span>
                        </div>
                        <div className={`h-0.5 flex-1 mx-2 ${isWorkDone ? 'bg-emerald-500' : 'bg-slate-200'}`} />

                        {/* Step 3: Work Done */}
                        <div className={`flex items-center gap-1 ${isWorkDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                            isWorkDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>3</span>
                          <span>Work Done</span>
                        </div>
                        <div className={`h-0.5 flex-1 mx-2 ${isWorkDone && !isPaymentPending ? 'bg-emerald-500' : 'bg-slate-200'}`} />

                        {/* Step 4: Settled */}
                        <div className={`flex items-center gap-1 ${isWorkDone && !isPaymentPending ? 'text-emerald-700' : 'text-slate-400'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                            isWorkDone && !isPaymentPending ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>4</span>
                          <span>Settled</span>
                        </div>
                      </div>
                    </div>

                    {/* Complete Admin Financial Split Display */}
                    <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600 font-semibold">
                        <span>Total Customer Volume:</span>
                        <span className="font-extrabold text-slate-900">₹{b.totalServiceCharge || b.price || 650}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Advance Paid (Inspection):</span>
                        <span className="font-semibold text-emerald-700">-₹{b.advancePaid || 99}</span>
                      </div>
                      <div className="flex justify-between text-slate-700 font-bold">
                        <span>Balance Due on Site:</span>
                        <span className={`font-black ${Number(b.remainingDue) > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                          ₹{b.remainingDue !== undefined ? b.remainingDue : 551}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-[11px]">
                        <span className="text-emerald-700">Worker Payout: ₹{b.workerCharge || 500}</span>
                        <span className="text-[#0EA5E0]">Platform Fee (JOBit): ₹{b.platformFee || 150}</span>
                      </div>
                    </div>

                    {/* Customer & Location Details */}
                    <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50/60 p-2.5 rounded-2xl">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">{b.dateTime || 'Immediate Dispatch'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{b.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Customer: <strong className="text-slate-800">{b.customerName}</strong> ({b.customerPhone})</span>
                      </div>
                    </div>

                    {/* Assigned Worker Info & Action Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {b.workerName ? (
                          <>
                            <img 
                              src={b.workerAvatar || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=200&q=80"}
                              alt={b.workerName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <span className="text-xs font-black text-slate-900 block leading-tight">
                                {b.workerName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {b.workerPhone || 'Assigned Pro'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Unallocated (Needs Dispatch)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Quick Status Advancement Button */}
                        {b.status === 'accepted' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceBookingStatus(b.id, 'accepted')}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-black transition cursor-pointer"
                          >
                            Start Work
                          </button>
                        )}

                        {['on_the_way', 'in_progress'].includes(b.status) && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceBookingStatus(b.id, 'in_progress')}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-xs font-black transition cursor-pointer"
                          >
                            Mark Work Done
                          </button>
                        )}

                        {isWorkDone && Number(b.remainingDue) > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMarkPaymentSettled(b.id)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-full text-xs font-black transition cursor-pointer border border-amber-200"
                          >
                            Settle Due ₹{b.remainingDue}
                          </button>
                        )}

                        {/* Dispatch / Reassign Pro Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => setAssignModalBooking(b)}
                          className="px-3 py-1.5 bg-[#0EA5E0] hover:bg-[#0284C7] text-white rounded-full text-xs font-black shadow-xs transition cursor-pointer"
                        >
                          {b.workerName ? 'Reassign Pro' : 'Dispatch Pro'}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. TAB: WORKERS MANAGEMENT */}
      {/* ========================================================= */}
      {tab === 'workers' && (
        <div className="px-5 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-extrabold text-slate-700">Verified Technicians Roster</h4>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {onlineWorkers.length} Active Now
            </span>
          </div>

          <div className="space-y-2.5">
            {workers.map((w) => (
              <div 
                key={w.id} 
                className="p-3.5 rounded-3xl bg-white border border-slate-200/70 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={w.avatar || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=200&q=80"}
                      alt={w.name}
                      className="w-11 h-11 rounded-2xl object-cover"
                    />
                    <span 
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        w.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900">{w.name}</h5>
                    <p className="text-[11px] font-semibold text-slate-400">{w.skill} • {w.phone}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span>★ {w.rating || '4.9'}</span>
                      <span>• {w.completedJobs || 120} jobs</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleWorkerDuty(w.id, !w.isOnline)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    w.isOnline 
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{w.isOnline ? 'Online' : 'Offline'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. TAB: CAROUSEL BANNERS */}
      {/* ========================================================= */}
      {tab === 'banners' && (
        <div className="px-5 space-y-4 animate-fade-in">
          <form onSubmit={handleAddBanner} className="p-4 rounded-3xl bg-white border border-slate-200/80 space-y-3 shadow-xs">
            <h4 className="text-xs font-extrabold text-slate-800">Add Carousel Banner</h4>
            <input
              type="text"
              required
              value={newBannerTitle}
              onChange={(e) => setNewBannerTitle(e.target.value)}
              placeholder="Banner Title"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
            />
            <input
              type="text"
              value={newBannerSub}
              onChange={(e) => setNewBannerSub(e.target.value)}
              placeholder="Subtitle"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newBannerService}
                onChange={(e) => setNewBannerService(e.target.value)}
                placeholder="Featured Service"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
              />
              <input
                type="number"
                value={newBannerPrice}
                onChange={(e) => setNewBannerPrice(e.target.value)}
                placeholder="Price ₹/hr"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
              />
            </div>
            <input
              type="url"
              value={newBannerImg}
              onChange={(e) => setNewBannerImg(e.target.value)}
              placeholder="Worker Image URL (optional)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#0EA5E0] hover:bg-[#0284C7] text-white text-xs font-extrabold shadow-sm active:scale-98 transition cursor-pointer"
            >
              + Add Promotion Banner
            </button>
          </form>

          <div className="space-y-2">
            {banners.map((b) => (
              <div key={b.id} className="p-3.5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between shadow-xs">
                <div>
                  <h5 className="text-xs font-extrabold text-slate-800">{b.title}</h5>
                  <p className="text-[11px] text-slate-400">{b.serviceName} • ₹{b.price}/hr</p>
                </div>
                <button
                  onClick={() => handleDeleteBanner(b.id)}
                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. MODAL: ADD NEW SERVICE */}
      {/* ========================================================= */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl relative border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Add New Service</h4>
                <p className="text-[11px] text-slate-400">Instantly publishes to Search, Home & Booking pages</p>
              </div>
              <button 
                onClick={() => setIsAddServiceOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="mt-4 space-y-3.5">
              
              {/* Service Name */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Service Name / Title *
                </label>
                <input
                  type="text"
                  required
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  placeholder="e.g. Copper Pipe & Water Filter Installation"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition"
                />
              </div>

              {/* Category & Sub-Category */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    Main Category *
                  </label>
                  <select
                    value={serviceForm.categoryName}
                    onChange={(e) => setServiceForm({ ...serviceForm, categoryName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    Sub-Category / Issue
                  </label>
                  <input
                    type="text"
                    value={serviceForm.subCategory}
                    onChange={(e) => setServiceForm({ ...serviceForm, subCategory: e.target.value })}
                    placeholder="e.g. Pipe Leakage Fix"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Hourly Price */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-extrabold text-slate-700">
                    Hourly Price (₹) *
                  </label>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    Renders as ₹{serviceForm.price || 300}/hour
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-extrabold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    required
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    placeholder="300"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Manual Image URL Management */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Image URL (Direct link or Unsplash photo) *
                </label>
                <input
                  type="url"
                  required
                  value={serviceForm.imageUrl}
                  onChange={(e) => setServiceForm({ ...serviceForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition"
                />

                {/* Live Image Preview */}
                <div className="mt-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                  <div 
                    className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-200 border border-slate-300 relative shadow-2xs"
                    style={{ width: '3.5rem', height: '3.5rem' }}
                  >
                    <img
                      src={serviceForm.imageUrl || 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=200&q=80'}
                      alt="Preview"
                      className="w-full h-full object-cover block"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-700">Live Thumbnail Preview</p>
                    <p className="text-[10px] text-slate-400">Card thumbnail with object-fit: cover</p>
                  </div>
                </div>

                {/* Quick Presets for European Technicians in Blue Uniforms */}
                <div className="mt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    Quick Presets (European Techs in Blue):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {TECHNICIAN_PRESETS.slice(0, 4).map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setServiceForm({ ...serviceForm, imageUrl: p.url })}
                        className="px-2 py-0.5 rounded-lg bg-sky-50 text-[#0EA5E0] hover:bg-[#0EA5E0] hover:text-white text-[10px] font-bold border border-sky-100 transition cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description / About */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Description / About Service
                </label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Certified technicians with high-pressure diagnostic equipment and genuine replacement parts."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition resize-none"
                />
              </div>

              {/* Submit / Cancel */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white text-xs font-extrabold shadow-sm active:scale-98 transition cursor-pointer"
                >
                  Save & Publish
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. MODAL: EDIT EXISTING SERVICE & PRICES */}
      {/* ========================================================= */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl relative border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Edit Service & Price</h4>
                <p className="text-[11px] text-slate-400">Updates service cards, search, and booking immediately</p>
              </div>
              <button 
                onClick={() => setEditingService(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditService} className="mt-4 space-y-3.5">
              
              {/* Service Title */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition"
                />
              </div>

              {/* Main Category & Sub-Category */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    Category *
                  </label>
                  <select
                    value={editForm.categoryName}
                    onChange={(e) => setEditForm({ ...editForm, categoryName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    Sub-Category
                  </label>
                  <input
                    type="text"
                    value={editForm.subCategory}
                    onChange={(e) => setEditForm({ ...editForm, subCategory: e.target.value })}
                    placeholder="Sub-issue title"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Price / Hourly Rate */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-extrabold text-slate-700">
                    Hourly Price (₹) *
                  </label>
                  <span className="text-[11px] font-extrabold text-emerald-700">
                    Displays as: ₹{editForm.price}/hour
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-extrabold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    required
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Image URL Manual Management */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Image URL (Manual Link)
                </label>
                <input
                  type="url"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition"
                />

                {/* Live Image Preview */}
                <div className="mt-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                  <div 
                    className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-200 border border-slate-300 relative shadow-2xs"
                    style={{ width: '3.5rem', height: '3.5rem' }}
                  >
                    <img
                      src={editForm.imageUrl || 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=200&q=80'}
                      alt="Preview"
                      className="w-full h-full object-cover block"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-700">Updated Image Preview</p>
                    <p className="text-[10px] text-slate-400">Will render on service listing cards</p>
                  </div>
                </div>

                {/* Quick Presets for Technicians in Blue Uniforms */}
                <div className="mt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    Technician Stock Presets:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {TECHNICIAN_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, imageUrl: p.url })}
                        className="px-2 py-0.5 rounded-lg bg-sky-50 text-[#0EA5E0] hover:bg-[#0EA5E0] hover:text-white text-[10px] font-bold border border-sky-100 transition cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Description / Details
                </label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white text-xs font-extrabold shadow-sm active:scale-98 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 11. MODAL: EDIT CATEGORY BASE PRICE */}
      {/* ========================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl relative border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900">Edit {editingCategory.name} Rate</h4>
              <button 
                onClick={() => setEditingCategory(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Base Price (₹)</label>
                <input
                  type="number"
                  value={editCatPrice}
                  onChange={(e) => setEditCatPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0EA5E0]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateCategoryPrice(editingCategory.id)}
                  className="flex-1 py-2 rounded-xl bg-[#0EA5E0] text-white text-xs font-bold shadow-xs"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 12. MODAL: MANUALLY ASSIGN/DISPATCH TECHNICIAN */}
      {/* ========================================================= */}
      {assignModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl relative border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Assign Technician</h4>
                <p className="text-[11px] text-slate-400">
                  {assignModalBooking.serviceTitle} • ₹{assignModalBooking.price}
                </p>
              </div>
              <button 
                onClick={() => setAssignModalBooking(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-3">
              Select an available technician to dispatch this job immediately:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
              {approvedWorkers.map((worker) => (
                <div
                  key={worker.id}
                  onClick={() => handleAssignWorker(worker)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-200/70 hover:border-[#0EA5E0] cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={worker.avatar || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=200&q=80"}
                      alt={worker.name}
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 group-hover:text-[#0EA5E0]">
                        {worker.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {worker.skill} • {worker.isOnline ? '🟢 Online' : '⚪ Offline'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-black text-[#0EA5E0] bg-white group-hover:bg-[#0EA5E0] group-hover:text-white px-3 py-1 rounded-full shadow-xs transition">
                    Assign
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 13. COMPREHENSIVE ADMIN KYC & DETAILS VIEW MODAL          */}
      {/* ========================================================= */}
      {selectedPendingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[94vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black tracking-wide">
                      Partner KYC Verification Dossier
                    </h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase">
                      Pending Review
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Application ID: <strong className="text-slate-200">{selectedPendingWorker.id}</strong> • Applied: {new Date(selectedPendingWorker.appliedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPendingWorker(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Close dossier"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Application Data Body */}
            <div className="p-4 sm:p-5 overflow-y-auto no-scrollbar space-y-4 text-xs">
              
              {/* 1. Worker Live Captured Selfie & Core Identity Header */}
              <div className="p-4 rounded-3xl bg-slate-50/90 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center sm:items-start gap-4">
                
                {/* Live Captured Selfie Card */}
                <div className="relative shrink-0 flex flex-col items-center">
                  <div className="relative">
                    <img 
                      src={selectedPendingWorker.liveSelfieUrl || selectedPendingWorker.selfieUrl || selectedPendingWorker.photo || selectedPendingWorker.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80"}
                      alt={`${selectedPendingWorker.name} Live Selfie`}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-3 border-amber-400 shadow-md bg-slate-200"
                    />
                    <span className="absolute -bottom-2 inset-x-0 mx-auto w-fit px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-full shadow-xs flex items-center gap-1 border border-amber-400">
                      <Camera className="w-2.5 h-2.5 text-amber-400" />
                      <span>Live Selfie</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold mt-2.5">
                    Profile Verification Photo
                  </span>
                </div>

                {/* Worker Identity Details */}
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {selectedPendingWorker.name}
                    </h3>
                    <span className="px-2.5 py-0.5 bg-sky-50 text-[#0EA5E0] border border-sky-200/80 font-black text-xs rounded-full inline-flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-[#0EA5E0]" />
                      <span>{selectedPendingWorker.categoryName || selectedPendingWorker.skill || 'AC Service'}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-slate-700">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#0EA5E0] shrink-0" />
                      <span className="text-slate-500 font-semibold">Primary:</span>
                      <strong className="text-slate-900 font-bold">{selectedPendingWorker.phone}</strong>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-semibold">Alternate:</span>
                      <strong className="text-slate-800">{selectedPendingWorker.altPhone || 'None'}</strong>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:col-span-2">
                      <span className="text-slate-500 font-semibold">Email:</span>
                      <strong className="text-slate-800 font-semibold truncate">{selectedPendingWorker.email || 'Not provided'}</strong>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-2 sm:col-span-2 text-[11px] text-slate-500 font-semibold pt-0.5">
                      <span>Gender: <strong className="text-slate-800">{selectedPendingWorker.gender || 'Male'}</strong></span>
                      <span>•</span>
                      <span>DOB: <strong className="text-slate-800">{selectedPendingWorker.dob || '1995-01-01'}</strong></span>
                    </div>
                  </div>
                </div>

              </div>

              {/* 2. Complete Address & Service Coverage Area */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-slate-800 font-black text-xs uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Complete Address & Coverage Territory</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {selectedPendingWorker.serviceRadius || '20'} km Service Radius
                  </span>
                </div>

                <div className="space-y-1 text-slate-700">
                  <p className="font-bold text-slate-900 text-xs">
                    {selectedPendingWorker.address || 'Market Road, Near Mosque'}
                  </p>
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 text-slate-600 font-semibold flex-wrap">
                    <span>Panchayat / City: <strong className="text-slate-900">{selectedPendingWorker.city || 'Melattur, Kerala'}</strong></span>
                    <span>•</span>
                    <span>Postal PIN Code: <strong className="text-slate-900">{selectedPendingWorker.pincode || '679326'}</strong></span>
                  </div>
                </div>
              </div>

              {/* 3. Trade Skills & Task Pricing */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-slate-800 font-black text-xs uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#0EA5E0]" />
                    <span>Trade Specialization & Rate Card</span>
                  </div>
                  <span className="font-black text-emerald-700 text-xs">
                    Base: ₹{selectedPendingWorker.baseRate || 350}/job
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-sky-100 text-[#0EA5E0] font-black rounded-lg">
                    {selectedPendingWorker.categoryName || selectedPendingWorker.skill || 'Technician'}
                  </span>
                  <span className="text-slate-600 font-bold">
                    {selectedPendingWorker.experience || '5'} Years Field Experience
                  </span>
                </div>

                {selectedPendingWorker.subSkills && selectedPendingWorker.subSkills.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-200/60 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Specific Sub-Skills & Services Offered:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPendingWorker.subSkills.map((sk, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200/90 text-slate-800 rounded-lg text-[10px] font-black shadow-2xs">
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Official Verification Documents: Clear, Zoomable Previews for Aadhaar & Driving License */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-slate-800 font-black text-xs uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <span>Official KYC Documents (Aadhaar & License)</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    Click any document to zoom & inspect
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Aadhaar Card Preview Box */}
                  <div className="border border-slate-200 rounded-2xl p-2.5 bg-white space-y-2 shadow-2xs hover:border-[#0EA5E0] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-black text-slate-900">Aadhaar Card</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-sky-50 text-[#0EA5E0] font-black border border-sky-100">
                        Govt Identity
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 font-mono font-bold">
                      No: <span className="text-slate-900">{selectedPendingWorker.aadhaarNumber || 'Attached'}</span>
                    </p>

                    <div className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-100 h-36 group">
                      <img 
                        src={selectedPendingWorker.aadhaarDocUrl || selectedPendingWorker.idProofUrl || 'https://images.unsplash.com/photo-1554415707-9e4901f4c7d0?auto=format&fit=crop&w=600&q=80'} 
                        alt="Aadhaar Card Front & Back" 
                        className="w-full h-full object-cover group-hover:scale-102 transition duration-200 cursor-pointer"
                        onClick={() => {
                          setZoomScale(1);
                          setZoomedDoc({
                            url: selectedPendingWorker.aadhaarDocUrl || selectedPendingWorker.idProofUrl || 'https://images.unsplash.com/photo-1554415707-9e4901f4c7d0?auto=format&fit=crop&w=600&q=80',
                            title: 'Aadhaar Card Front & Back Verification',
                            number: selectedPendingWorker.aadhaarNumber || 'Attached',
                            type: 'Govt Identity ID'
                          });
                        }}
                      />
                      
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setZoomScale(1);
                            setZoomedDoc({
                              url: selectedPendingWorker.aadhaarDocUrl || selectedPendingWorker.idProofUrl || 'https://images.unsplash.com/photo-1554415707-9e4901f4c7d0?auto=format&fit=crop&w=600&q=80',
                              title: 'Aadhaar Card Front & Back Verification',
                              number: selectedPendingWorker.aadhaarNumber || 'Attached',
                              type: 'Govt Identity ID'
                            });
                          }}
                          className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-900 text-[10px] font-black rounded-lg shadow-sm flex items-center gap-1 transition cursor-pointer"
                        >
                          <ZoomIn className="w-3 h-3 text-[#0EA5E0]" />
                          <span>Zoom & Inspect</span>
                        </button>

                        <a 
                          href={selectedPendingWorker.aadhaarDocUrl || selectedPendingWorker.idProofUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-2 py-1 bg-black/60 hover:bg-black text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>New Tab</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Driving License Preview Box */}
                  <div className="border border-slate-200 rounded-2xl p-2.5 bg-white space-y-2 shadow-2xs hover:border-purple-400 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-black text-slate-900">Driving License</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-black border border-purple-100">
                        Trade / DL Permit
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 font-mono font-bold truncate">
                      DL: <span className="text-slate-900">{selectedPendingWorker.drivingLicenseNumber || 'KL-10-2019-0098712'}</span>
                    </p>

                    <div className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-100 h-36 group">
                      <img 
                        src={selectedPendingWorker.drivingLicenseDocUrl || 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80'} 
                        alt="Driving License Document" 
                        className="w-full h-full object-cover group-hover:scale-102 transition duration-200 cursor-pointer"
                        onClick={() => {
                          setZoomScale(1);
                          setZoomedDoc({
                            url: selectedPendingWorker.drivingLicenseDocUrl || 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80',
                            title: 'Driving License / Trade Permit Inspection',
                            number: selectedPendingWorker.drivingLicenseNumber || 'KL-10-2019-0098712',
                            type: 'Driving License'
                          });
                        }}
                      />

                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setZoomScale(1);
                            setZoomedDoc({
                              url: selectedPendingWorker.drivingLicenseDocUrl || 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80',
                              title: 'Driving License / Trade Permit Inspection',
                              number: selectedPendingWorker.drivingLicenseNumber || 'KL-10-2019-0098712',
                              type: 'Driving License'
                            });
                          }}
                          className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-900 text-[10px] font-black rounded-lg shadow-sm flex items-center gap-1 transition cursor-pointer"
                        >
                          <ZoomIn className="w-3 h-3 text-purple-600" />
                          <span>Zoom & Inspect</span>
                        </button>

                        <a 
                          href={selectedPendingWorker.drivingLicenseDocUrl || selectedPendingWorker.idProofUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-2 py-1 bg-black/60 hover:bg-black text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>New Tab</span>
                        </a>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* 5. Bank Account & Settlement Credentials */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-800 font-black text-xs uppercase tracking-wider">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Direct Bank Payout Account</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Bank Name:</span>
                    <strong className="text-slate-900 font-black">{selectedPendingWorker.bankName || 'State Bank of India'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">IFSC Code:</span>
                    <strong className="text-slate-900 font-mono font-black">{selectedPendingWorker.ifscCode || 'SBIN0008421'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Account Holder:</span>
                    <strong className="text-slate-900 font-bold">{selectedPendingWorker.accountHolderName || selectedPendingWorker.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Account Number:</span>
                    <strong className="text-slate-900 font-mono font-black">{selectedPendingWorker.accountNumber || '••••••••3829'}</strong>
                  </div>
                  {selectedPendingWorker.upiId && (
                    <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold">UPI ID:</span>
                      <strong className="text-purple-700 font-bold">{selectedPendingWorker.upiId}</strong>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Direct Action Buttons Right Inside Detailed View */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setRejectModalApp(selectedPendingWorker);
                  setRejectReason('Govt ID copy requires clear photo of address and seal');
                }}
                className="py-3 px-5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200/80"
              >
                <UserX className="w-4 h-4" />
                <span>Reject Application</span>
              </button>

              <button
                type="button"
                onClick={() => handleApproveWorker(selectedPendingWorker)}
                className="py-3 px-7 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Approve Pro</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 13.1 INTERACTIVE DOCUMENT ZOOM LIGHTBOX OVERLAY          */}
      {/* ========================================================= */}
      {zoomedDoc && (
        <div 
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-5 animate-fade-in select-none"
          onClick={() => { setZoomedDoc(null); setZoomScale(1); }}
        >
          <div 
            className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Zoom Bar Header */}
            <div className="p-3.5 px-5 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
              <div>
                <h4 className="text-sm font-black flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{zoomedDoc.title}</span>
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID Number: <strong className="text-white">{zoomedDoc.number || 'Verified'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-800 rounded-xl p-1 gap-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.max(0.75, Number((prev - 0.25).toFixed(2))))}
                    className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold px-1.5 text-slate-200">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.min(2.5, Number((prev + 0.25).toFixed(2))))}
                    className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomScale(1)}
                    className="px-2 py-1 text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { setZoomedDoc(null); setZoomScale(1); }}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                  title="Close zoom preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Zoomable Image Viewport */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60 min-h-[320px]">
              <img
                src={zoomedDoc.url}
                alt={zoomedDoc.title}
                style={{ transform: `scale(${zoomScale})`, transition: 'transform 0.15s ease-out' }}
                className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 14. MODAL: REJECT REASON                                   */}
      {/* ========================================================= */}
      {rejectModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl relative border border-slate-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900">Reject Application</h4>
              <button
                onClick={() => setRejectModalApp(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Rejecting onboarding for <strong>{rejectModalApp.name}</strong>. Please provide a clear reason:
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-500"
              placeholder="e.g. Incomplete ID document or invalid phone number"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectModalApp(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectWorker}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-black shadow-xs hover:bg-red-700 transition"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

