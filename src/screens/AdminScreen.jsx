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
  Filter
} from 'lucide-react';
import { 
  subscribeBookings, 
  subscribeWorkers, 
  adminAssignJob, 
  updateBookingStatus, 
  toggleWorkerDuty 
} from '../data/bookingService';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { initialCategories, initialBanners } from '../data/seedData';

export function AdminScreen({ onBack }) {
  const [tab, setTab] = useState('dispatch'); // 'dispatch' | 'workers' | 'categories' | 'banners'
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState(initialCategories);
  const [banners, setBanners] = useState(initialBanners);

  // Dispatch Filter
  const [dispatchFilter, setDispatchFilter] = useState('all'); // 'all' | 'pending' | 'ongoing' | 'completed'

  // Modal for assigning / reassigning worker
  const [assignModalBooking, setAssignModalBooking] = useState(null);

  // Forms for Categories & Banners
  const [newCatName, setNewCatName] = useState('');
  const [newCatImg, setNewCatImg] = useState('');
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSub, setNewBannerSub] = useState('');
  const [newBannerPrice, setNewBannerPrice] = useState('300');
  const [newBannerService, setNewBannerService] = useState('Home Repair');
  const [newBannerImg, setNewBannerImg] = useState('');

  // Subscribe to real-time bookings & workers
  useEffect(() => {
    const unsubB = subscribeBookings((list) => setBookings(list));
    const unsubW = subscribeWorkers((list) => setWorkers(list));
    return () => {
      unsubB();
      unsubW();
    };
  }, []);

  // Firestore sync for Categories & Banners
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    let unsubCat = () => {};
    let unsubBan = () => {};

    try {
      unsubCat = onSnapshot(collection(db, 'categories'), (snap) => {
        if (!snap.empty) {
          setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      });

      unsubBan = onSnapshot(collection(db, 'banners'), (snap) => {
        if (!snap.empty) {
          setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      });
    } catch {}

    return () => {
      unsubCat();
      unsubBan();
    };
  }, []);

  // Metrics
  const totalBookingsCount = bookings.length;
  const pendingJobs = bookings.filter(b => b.status === 'pending');
  const ongoingJobs = bookings.filter(b => ['accepted', 'on_the_way', 'in_progress'].includes(b.status));
  const completedJobs = bookings.filter(b => b.status === 'completed');
  const onlineWorkers = workers.filter(w => w.isOnline);

  const handleAssignWorker = async (worker) => {
    if (!assignModalBooking) return;
    await adminAssignJob(assignModalBooking.id, worker);
    setAssignModalBooking(null);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;

    const catObj = {
      name: newCatName.trim(),
      image: newCatImg.trim() || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
      order: categories.length + 1
    };

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'categories'), catObj);
      } catch {}
    }
    setCategories(prev => [...prev, { id: 'cat_' + Date.now(), ...catObj }]);
    setNewCatName('');
    setNewCatImg('');
  };

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

  const handleDeleteCategory = async (id) => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch {}
    }
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteBanner = async (id) => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'banners', id));
      } catch {}
    }
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  // Filtered dispatch list
  const filteredBookings = bookings.filter(b => {
    if (dispatchFilter === 'pending') return b.status === 'pending';
    if (dispatchFilter === 'ongoing') return ['accepted', 'on_the_way', 'in_progress'].includes(b.status);
    if (dispatchFilter === 'completed') return b.status === 'completed';
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-28 text-slate-900 select-none">
      
      {/* 1. Header */}
      <header className="px-5 py-3 border-b border-slate-200/80 flex items-center justify-between sticky top-0 bg-white z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-800 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Admin Control Center</h2>
            <p className="text-[10px] text-purple-600 font-extrabold uppercase tracking-wider">
              Hyperlocal Dispatch & Operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-[11px] font-extrabold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Super Admin</span>
        </div>
      </header>

      {/* 2. Master Operational Metrics Bar */}
      <div className="px-5 py-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200/70 shadow-xs text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase">Total</p>
            <p className="text-base font-black text-slate-900 mt-0.5">{totalBookingsCount}</p>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-amber-200 shadow-xs text-center bg-amber-50/30">
            <p className="text-[9px] text-amber-600 font-bold uppercase">Unallocated</p>
            <p className="text-base font-black text-amber-600 mt-0.5">{pendingJobs.length}</p>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-sky-200 shadow-xs text-center bg-sky-50/30">
            <p className="text-[9px] text-[#0EA5E0] font-bold uppercase">Ongoing</p>
            <p className="text-base font-black text-[#0EA5E0] mt-0.5">{ongoingJobs.length}</p>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-emerald-200 shadow-xs text-center bg-emerald-50/30">
            <p className="text-[9px] text-emerald-600 font-bold uppercase">Pros Online</p>
            <p className="text-base font-black text-emerald-600 mt-0.5">
              {onlineWorkers.length}/{workers.length}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="px-5 mb-3">
        <div className="flex bg-[#E9ECEF] rounded-full p-1 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setTab('dispatch')}
            className={`flex-1 py-2 px-3 rounded-full whitespace-nowrap transition cursor-pointer ${
              tab === 'dispatch' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Live Dispatch ({pendingJobs.length + ongoingJobs.length})
          </button>
          <button
            onClick={() => setTab('workers')}
            className={`flex-1 py-2 px-3 rounded-full whitespace-nowrap transition cursor-pointer ${
              tab === 'workers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Pros ({workers.length})
          </button>
          <button
            onClick={() => setTab('categories')}
            className={`flex-1 py-2 px-3 rounded-full whitespace-nowrap transition cursor-pointer ${
              tab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setTab('banners')}
            className={`flex-1 py-2 px-3 rounded-full whitespace-nowrap transition cursor-pointer ${
              tab === 'banners' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Banners
          </button>
        </div>
      </div>

      {/* 4. TAB: Live Dispatch & Bookings */}
      {tab === 'dispatch' && (
        <div className="px-5 space-y-3">
          
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
                        {isPending && (
                          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                            UNALLOCATED
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-1 leading-tight">
                        {b.serviceTitle}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">₹{b.price}</span>
                      <p className={`text-[10px] font-bold mt-0.5 ${
                        isPending ? 'text-amber-600' : isOngoing ? 'text-sky-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {b.status.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Customer & Location */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">
                      Customer: {b.customerName || 'Customer'} • <span className="font-normal text-slate-500">{b.customerPhone || '98765 00001'}</span>
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{b.address}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{b.dateTime}</span>
                    </div>
                  </div>

                  {/* Technician Allocation & Master Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Technician</p>
                      <p className="text-xs font-black text-slate-800">
                        {b.workerName ? `${b.workerName}` : '⚠️ Not Assigned Yet'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <button
                          onClick={() => setAssignModalBooking(b)}
                          className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white text-xs font-black shadow-xs hover:opacity-95 active:scale-95 transition cursor-pointer"
                        >
                          + Assign Pro
                        </button>
                      ) : (
                        <button
                          onClick={() => setAssignModalBooking(b)}
                          className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                        >
                          Reassign
                        </button>
                      )}

                      {isOngoing && (
                        <button
                          onClick={() => updateBookingStatus(b.id, 'completed', { completedByAdmin: true })}
                          className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[11px] font-bold"
                          title="Force Complete"
                        >
                          Force Done
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredBookings.length === 0 && (
              <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 p-6">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No jobs in this filter</h4>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB: Registered Workers Directory */}
      {tab === 'workers' && (
        <div className="px-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Technician Fleet ({workers.length})
            </h3>
            <span className="text-xs font-extrabold text-emerald-600">
              {onlineWorkers.length} Active On-Duty
            </span>
          </div>

          {workers.map((w) => {
            const workerActiveJobs = bookings.filter(b => b.workerId === w.id && ['accepted', 'on_the_way', 'in_progress'].includes(b.status));

            return (
              <div 
                key={w.id} 
                className="p-4 rounded-3xl bg-white border border-slate-200/70 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={w.avatar || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=200&q=80"} 
                      alt={w.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100"
                    />
                    <span className={`w-3 h-3 rounded-full absolute -top-1 -right-1 ring-2 ring-white ${w.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-extrabold text-slate-900">{w.name}</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                        {w.skill}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      +91 {w.phone} • ★ {w.rating || 4.9} ({w.jobsCompleted || 0} jobs)
                    </p>
                    <p className="text-[10px] text-sky-600 font-extrabold mt-0.5">
                      {workerActiveJobs.length > 0 ? `In Task (${workerActiveJobs.length} active)` : 'Available for Dispatches'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleWorkerDuty(w.id, !w.isOnline)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                    w.isOnline 
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{w.isOnline ? 'Online' : 'Offline'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. TAB: Categories (Kept intact) */}
      {tab === 'categories' && (
        <div className="px-5 space-y-4">
          <form onSubmit={handleAddCategory} className="p-4 rounded-3xl bg-white border border-slate-200/80 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800">Add New Category</h4>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category Name (e.g. Gardening, Appliance)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
            />
            <input
              type="url"
              value={newCatImg}
              onChange={(e) => setNewCatImg(e.target.value)}
              placeholder="Thumbnail Image URL (optional)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white text-xs font-bold shadow-sm"
            >
              + Create Category
            </button>
          </form>

          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="p-3 rounded-2xl bg-white border border-slate-100 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <img src={c.image} alt={c.name} className="w-10 h-10 rounded-xl object-cover" />
                  <span className="text-xs font-bold text-slate-800">{c.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TAB: Carousel Banners (Kept intact) */}
      {tab === 'banners' && (
        <div className="px-5 space-y-4">
          <form onSubmit={handleAddBanner} className="p-4 rounded-3xl bg-white border border-slate-200/80 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800">Add Carousel Banner</h4>
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
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white text-xs font-bold shadow-sm"
            >
              + Add Promotion Banner
            </button>
          </form>

          <div className="space-y-2">
            {banners.map((b) => (
              <div key={b.id} className="p-3 rounded-2xl bg-white border border-slate-100 flex items-center justify-between shadow-xs">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">{b.title}</h5>
                  <p className="text-[11px] text-slate-400">{b.serviceName} • ₹{b.price}/hr</p>
                </div>
                <button
                  onClick={() => handleDeleteBanner(b.id)}
                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Modal to Manually Assign/Reassign Technician */}
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
