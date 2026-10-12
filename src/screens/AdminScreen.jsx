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
  ExternalLink
} from 'lucide-react';
import { 
  subscribeBookings, 
  subscribeWorkers, 
  subscribeServices,
  subscribeCategories,
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
  const [tab, setTab] = useState('services'); // 'dispatch' | 'services' | 'categories' | 'workers' | 'banners'
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [services, setServices] = useState(initialServices || []);
  const [categories, setCategories] = useState(initialCategories || []);
  const [banners, setBanners] = useState(initialBanners || []);

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
    const unsubS = subscribeServices((list) => setServices(list || []));
    const unsubC = subscribeCategories((list) => setCategories(list || []));

    return () => {
      unsubB();
      unsubW();
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
      });
    } catch {}

    return () => unsubBan();
  }, []);

  // Metrics
  const totalBookingsCount = bookings.length;
  const pendingJobs = bookings.filter(b => b.status === 'pending');
  const ongoingJobs = bookings.filter(b => ['accepted', 'on_the_way', 'in_progress'].includes(b.status));
  const completedJobs = bookings.filter(b => b.status === 'completed');
  const onlineWorkers = workers.filter(w => w.isOnline);

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

  // Filtered Bookings in Dispatch
  const filteredBookings = bookings.filter(b => {
    if (dispatchFilter === 'pending') return b.status === 'pending';
    if (dispatchFilter === 'ongoing') return ['accepted', 'on_the_way', 'in_progress'].includes(b.status);
    if (dispatchFilter === 'completed') return b.status === 'completed';
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
          <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-[11px] font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin</span>
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

      {/* 2. Operational Metrics Bar */}
      <div className="px-5 py-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200/70 shadow-xs text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase">Services</p>
            <p className="text-base font-black text-slate-900 mt-0.5">{services.length}</p>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-amber-200 shadow-xs text-center bg-amber-50/30">
            <p className="text-[9px] text-amber-600 font-bold uppercase">Pending</p>
            <p className="text-base font-black text-amber-600 mt-0.5">{pendingJobs.length}</p>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-sky-200 shadow-xs text-center bg-sky-50/30">
            <p className="text-[9px] text-[#0EA5E0] font-bold uppercase">Ongoing</p>
            <p className="text-base font-black text-[#0EA5E0] mt-0.5">{ongoingJobs.length}</p>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-emerald-200 shadow-xs text-center bg-emerald-50/30">
            <p className="text-[9px] text-emerald-600 font-bold uppercase">Pros Active</p>
            <p className="text-base font-black text-emerald-600 mt-0.5">
              {onlineWorkers.length}/{workers.length}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="px-5 mb-3">
        <div className="flex bg-[#E9ECEF] rounded-full p-1 text-xs font-bold overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setTab('services')}
            className={`py-2 px-3.5 rounded-full whitespace-nowrap transition cursor-pointer shrink-0 font-extrabold ${
              tab === 'services' ? 'bg-[#0EA5E0] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Services ({services.length})
          </button>
          <button
            onClick={() => setTab('categories')}
            className={`py-2 px-3 rounded-full whitespace-nowrap transition cursor-pointer shrink-0 font-extrabold ${
              tab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setTab('dispatch')}
            className={`py-2 px-3 rounded-full whitespace-nowrap transition cursor-pointer shrink-0 font-extrabold ${
              tab === 'dispatch' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dispatch ({pendingJobs.length + ongoingJobs.length})
          </button>
          <button
            onClick={() => setTab('workers')}
            className={`py-2 px-3 rounded-full whitespace-nowrap transition cursor-pointer shrink-0 font-extrabold ${
              tab === 'workers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pros ({workers.length})
          </button>
          <button
            onClick={() => setTab('banners')}
            className={`py-2 px-3 rounded-full whitespace-nowrap transition cursor-pointer shrink-0 font-extrabold ${
              tab === 'banners' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Banners ({banners.length})
          </button>
        </div>
      </div>

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
        <div className="px-5 space-y-3 animate-fade-in">
          
          {/* Sub-filter pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All Jobs' },
              { id: 'pending', label: `Pending (${pendingJobs.length})` },
              { id: 'ongoing', label: `Ongoing (${ongoingJobs.length})` },
              { id: 'completed', label: `Completed (${completedJobs.length})` }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDispatchFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                  dispatchFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Bookings cards */}
          <div className="space-y-3">
            {filteredBookings.map((b) => {
              const isPending = b.status === 'pending';
              const isOngoing = ['accepted', 'on_the_way', 'in_progress'].includes(b.status);
              const isCompleted = b.status === 'completed';

              return (
                <div 
                  key={b.id} 
                  className={`p-4 rounded-3xl bg-white border transition shadow-xs space-y-2.5 ${
                    isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200/70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold text-[#0EA5E0] bg-sky-50 px-2 py-0.5 rounded-full">
                          {b.categoryName || 'Service'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          ID: {b.id.slice(-6)}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-1">{b.serviceTitle}</h4>
                      <p className="text-xs font-bold text-slate-700">₹{b.price}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                      isPending ? 'bg-amber-100 text-amber-800' :
                      isOngoing ? 'bg-sky-100 text-[#0EA5E0]' :
                      isCompleted ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-2xl">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{b.dateTime || 'Immediate Dispatch'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{b.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Customer: {b.customerName} ({b.customerPhone})</span>
                    </div>
                  </div>

                  {/* Assigned Worker / Action */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {b.workerName ? (
                        <>
                          <img 
                            src={b.workerAvatar || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=200&q=80"}
                            alt={b.workerName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-slate-800">
                            Pro: {b.workerName}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Unallocated (Needs Dispatch)
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setAssignModalBooking(b)}
                      className="px-3 py-1.5 bg-[#0EA5E0] hover:bg-[#0284C7] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      {b.workerName ? 'Reassign' : 'Dispatch Pro'}
                    </button>
                  </div>
                </div>
              );
            })}
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
              {workers.map((worker) => (
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

    </div>
  );
}
