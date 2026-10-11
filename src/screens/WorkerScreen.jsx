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
  Sparkles
} from 'lucide-react';
import { 
  subscribeBookings, 
  subscribeWorkers, 
  acceptJobAsWorker, 
  updateBookingStatus, 
  toggleWorkerDuty 
} from '../data/bookingService';
import { useAuth } from '../context/AuthContext';

export function WorkerScreen({ onOpenChat, onBack }) {
  const { currentUser } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('worker_rajesh');
  const [bookings, setBookings] = useState([]);
  const [declinedJobIds, setDeclinedJobIds] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'available' | 'history'

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
    ['accepted', 'on_the_way', 'in_progress'].includes(b.status)
  );

  // My completed jobs
  const myCompletedJobs = bookings.filter(b => 
    b.workerId === activeWorker.id && b.status === 'completed'
  );

  // Total earnings calculation
  const totalEarnings = myCompletedJobs.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const handleAcceptJob = async (booking) => {
    await acceptJobAsWorker(booking.id, activeWorker);
    setActiveTab('active');
  };

  const handleDeclineJob = (bookingId) => {
    setDeclinedJobIds(prev => [...prev, bookingId]);
  };

  // Step-by-step sequential progress updater
  const handleAdvanceStep = async (booking) => {
    if (booking.status === 'accepted') {
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

          {/* Quick Worker Persona Switcher (For easy prototype testing) */}
          <div className="relative">
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
                {isOnline ? "Broadcast radar active in Celina area" : "Toggle on to receive new job dispatches"}
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
                      ₹{job.price}
                    </p>
                    <p className="text-[10px] text-white/80 font-semibold mt-0.5">Fixed Task</p>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-2.5 text-xs text-white/95 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="truncate font-semibold">{job.address}</span>
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
        <div className="flex rounded-full bg-[#E9ECEF] p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-full transition ${
              activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Ongoing Tasks ({myAssignedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2 rounded-full transition ${
              activeTab === 'available' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Radar Radar ({incomingBroadcastJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-full transition ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Completed ({myCompletedJobs.length})
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
                      {job.status === 'accepted' ? 'ACCEPTED' : job.status === 'on_the_way' ? 'EN ROUTE' : 'IN PROGRESS'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      {job.serviceTitle}
                    </h3>
                    <p className="text-xs text-[#0EA5E0] font-black mt-0.5">
                      Fixed Payout: ₹{job.price}
                    </p>
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

                    <div className="pt-1 border-t border-slate-200/60 text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-tight font-medium">{job.address}</span>
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
                  <span className="text-sm font-black text-slate-900">₹{job.price}</span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">{job.serviceTitle}</h4>
                  <p className="text-xs text-slate-500 font-medium">{job.address}</p>
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
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">+₹{job.price}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Credited</p>
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
      </div>

    </div>
  );
}
