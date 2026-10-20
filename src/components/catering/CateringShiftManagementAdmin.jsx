import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Radio, 
  Send, 
  UserCheck, 
  UserX, 
  Sparkles, 
  RefreshCw, 
  Activity, 
  ChevronRight, 
  ChevronDown,
  Info,
  ExternalLink,
  Award,
  Zap,
  Check,
  X
} from 'lucide-react';
import { 
  subscribeCateringBookings, 
  sendShiftReminderBroadcast, 
  acceptCateringShift, 
  reportUnableToAttend, 
  adminAllocateCateringStaff,
  getNearbyCateringWorkers,
  seedSampleCateringShiftIfEmpty,
  INITIAL_CATERING_WORKERS
} from '../../data/cateringShiftService';
import { getLocalWorkers } from '../../data/bookingService';

export function CateringShiftManagementAdmin({ onOpenChat }) {
  const [cateringBookings, setCateringBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'inquiry_broadcasted' | 'allocated' | 'shift_in_progress'
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Modal for testing manual drop/dropout & standby replacement in real-time
  const [testDropWorkerModal, setTestDropWorkerModal] = useState(null);
  const [dropReason, setDropReason] = useState('Sudden Health Issue / High Fever');

  useEffect(() => {
    seedSampleCateringShiftIfEmpty();
    const unsub = subscribeCateringBookings((list) => {
      setCateringBookings(list || []);
      if (!selectedBookingId && list && list.length > 0) {
        setSelectedBookingId(list[0].id);
      }
    });
    return () => unsub();
  }, []);

  const showToast = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  const selectedBooking = cateringBookings.find(b => b.id === selectedBookingId) || cateringBookings[0] || null;

  // Filtered Bookings
  const filteredBookings = cateringBookings.filter(b => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus || b.cateringStatus === filterStatus;
  });

  // Action: Trigger Morning Shift Reminder Broadcast
  const handleTriggerMorningReminder = async (bookingId) => {
    if (!bookingId) return;
    setLoadingAction(true);
    try {
      await sendShiftReminderBroadcast(bookingId);
      showToast('Morning Shift Reminder & Attendance Check broadcasted to all Primary Staff!');
    } catch (err) {
      console.error(err);
      showToast('Failed to broadcast shift reminder.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Action: 1-Click Auto-Allocation (Top N Primary + 2 Standby)
  const handleAutoAllocate = async (booking) => {
    if (!booking) return;
    setLoadingAction(true);
    try {
      const applicants = booking.applicants && booking.applicants.length > 0
        ? booking.applicants
        : INITIAL_CATERING_WORKERS.map((w, idx) => ({
            workerId: w.id,
            workerName: w.name,
            workerPhone: w.phone,
            workerAvatar: w.avatar,
            distanceKm: Number((1.5 + idx * 0.5).toFixed(1))
          }));

      const primaryNeeded = booking.totalStaffNeeded || 10;
      const standbyNeeded = booking.standbyStaffNeeded || 2;

      const primaryWorkerIds = applicants.slice(0, primaryNeeded).map(a => a.workerId);
      const standbyWorkerIds = applicants.slice(primaryNeeded, primaryNeeded + standbyNeeded).map(a => a.workerId);

      await adminAllocateCateringStaff(booking.id, {
        primaryWorkerIds,
        standbyWorkerIds
      });

      showToast(`Auto-allocated ${primaryWorkerIds.length} Primary Staff + ${standbyWorkerIds.length} Standby Backups!`);
    } catch (err) {
      console.error(err);
      showToast('Failed to auto-allocate staff.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Action: Simulate worker unable to attend to demonstrate automatic standby promotion
  const handleConfirmDropAndAutoPromote = async () => {
    if (!testDropWorkerModal || !selectedBooking) return;
    setLoadingAction(true);
    try {
      const res = await reportUnableToAttend(
        selectedBooking.id, 
        testDropWorkerModal.workerId, 
        dropReason
      );

      if (res.promotedStandbyWorker) {
        showToast(`⚡ Standby Auto-Allocation: ${res.promotedStandbyWorker.workerName} was automatically promoted to Primary Staff!`);
      } else {
        showToast(`Worker marked unable. Standby reserve exhausted.`);
      }
      setTestDropWorkerModal(null);
    } catch (err) {
      console.error(err);
      showToast('Error handling shift drop.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Feedback Toast */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs font-black text-emerald-900 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Top Header & Operational Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <h3 className="text-base font-black text-slate-900">
              Catering Staff & Shift Management
            </h3>
            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200">
              Bulk Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time multi-worker booking, 10 KM radius dispatch, standby reserve & day-of-event auto-allocation
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto text-xs font-bold">
          {[
            { id: 'all', label: `All (${cateringBookings.length})` },
            { id: 'inquiry_broadcasted', label: 'Broadcasted' },
            { id: 'allocated', label: 'Allocated' },
            { id: 'shift_in_progress', label: 'Shift In Progress' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap text-xs font-extrabold ${
                filterStatus === f.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {cateringBookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-2xl">
            🍽️
          </div>
          <h4 className="text-sm font-extrabold text-slate-800">No Catering Bookings Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When customers submit a bulk catering inquiry for weddings or banquets, live shift allocation cards appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: List of Catering Bookings */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
              Active Catering Events ({filteredBookings.length})
            </h4>

            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {filteredBookings.map(b => {
                const isSelected = selectedBooking?.id === b.id;
                const primaryCount = (b.primaryWorkers || []).length;
                const standbyCount = (b.standbyWorkers || []).length;
                const confirmedCount = (b.primaryWorkers || []).filter(w => ['attendance_confirmed', 'on_my_way'].includes(w.shiftStatus)).length;
                const isFull = primaryCount >= b.totalStaffNeeded;

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBookingId(b.id)}
                    className={`p-4 rounded-3xl border transition cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-200 shadow-xs'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                            {b.eventOccasion || 'Catering Event'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            #{b.id.slice(-6)}
                          </span>
                        </div>
                        <h5 className="text-sm font-black text-slate-900 mt-1 truncate max-w-[220px]">
                          {b.venueName}
                        </h5>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        b.status === 'shift_in_progress'
                          ? 'bg-indigo-100 text-indigo-700 animate-pulse'
                          : isFull
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.status === 'shift_in_progress' ? 'Shift Live' : isFull ? 'Staff Locked' : 'Awaiting Staff'}
                      </span>
                    </div>

                    {/* Meta info: Date, Time, 10 KM Radius */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-bold bg-white/80 p-2.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{b.functionDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{b.functionTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{b.functionLocation || b.address}</span>
                      </div>
                    </div>

                    {/* Progress meters: Primary, Standby, Confirmed Attendance */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-black">
                        <span className="text-slate-600">
                          Primary Staff: <strong className="text-rose-600">{primaryCount}/{b.totalStaffNeeded}</strong>
                        </span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          🛡️ Standby: {standbyCount}/{b.standbyStaffNeeded}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, (primaryCount / b.totalStaffNeeded) * 100)}%` }}
                        />
                      </div>
                      {b.status === 'shift_in_progress' && (
                        <div className="flex justify-between items-center text-[10px] font-black text-indigo-700 pt-0.5">
                          <span>Morning Attendance Confirmed:</span>
                          <span>{confirmedCount}/{b.totalStaffNeeded} Present</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Catering Event Detailed Control Center */}
          {selectedBooking ? (
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                {/* Event Overview Banner */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider bg-rose-500 text-white px-2.5 py-0.5 rounded-full">
                        {selectedBooking.eventOccasion}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{selectedBooking.id}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mt-1.5">
                      {selectedBooking.venueName}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Host: <strong className="text-slate-800">{selectedBooking.customerName}</strong> ({selectedBooking.customerPhone})
                    </p>
                  </div>

                  {/* Pricing Pill */}
                  <div className="bg-slate-900 text-white p-3 rounded-2xl text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Estimated Total</span>
                    <span className="text-base font-black text-rose-400">₹{selectedBooking.estimatedTotal}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {selectedBooking.totalStaffNeeded} Staff × ₹{selectedBooking.ratePerStaff}
                    </span>
                  </div>
                </div>

                {/* Event Key Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Required</span>
                    <span className="text-lg font-black text-slate-900">{selectedBooking.totalStaffNeeded}</span>
                    <span className="text-[10px] text-slate-500 font-bold block">Primary Staff</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] font-black uppercase text-emerald-600 block">Standby</span>
                    <span className="text-lg font-black text-emerald-700">{selectedBooking.standbyStaffNeeded}</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">Zero-Drop Reserve</span>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                    <span className="text-[10px] font-black uppercase text-rose-600 block">Radius</span>
                    <span className="text-lg font-black text-rose-700">10 KM</span>
                    <span className="text-[10px] text-rose-600 font-bold block">Broadcast Zone</span>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <span className="text-[10px] font-black uppercase text-indigo-600 block">Shift Pay</span>
                    <span className="text-lg font-black text-indigo-700">₹{selectedBooking.ratePerStaff}</span>
                    <span className="text-[10px] text-indigo-600 font-bold block">Per Professional</span>
                  </div>
                </div>

                {/* Admin Interactive Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Auto-Allocate Button */}
                  <button
                    onClick={() => handleAutoAllocate(selectedBooking)}
                    disabled={loadingAction}
                    className="flex-1 min-w-[170px] py-2.5 px-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Auto-Allocate (Top 10 + 2 Standby)</span>
                  </button>

                  {/* Day-of-Event Morning Shift Reminder Broadcast Button */}
                  <button
                    onClick={() => handleTriggerMorningReminder(selectedBooking.id)}
                    disabled={loadingAction}
                    className="flex-1 min-w-[170px] py-2.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Morning Shift Reminder</span>
                  </button>
                </div>

                {/* Primary Staff Roster */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-rose-600" />
                      <span>Primary Staff Roster ({(selectedBooking.primaryWorkers || []).length}/{selectedBooking.totalStaffNeeded})</span>
                    </h5>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {(selectedBooking.primaryWorkers || []).filter(w => ['attendance_confirmed', 'on_my_way'].includes(w.shiftStatus)).length} Confirmed Attendance
                    </span>
                  </div>

                  {(selectedBooking.primaryWorkers || []).length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
                      No primary staff assigned yet. Click "Auto-Allocate" above or wait for worker acceptances.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedBooking.primaryWorkers.map(w => {
                        const isConfirmed = ['attendance_confirmed', 'on_my_way'].includes(w.shiftStatus);
                        const isReminderSent = w.shiftStatus === 'shift_reminder_sent';
                        const isPromoted = Boolean(w.promotedFromStandby);

                        return (
                          <div
                            key={w.workerId}
                            className={`p-3 rounded-2xl border transition space-y-2 ${
                              isConfirmed
                                ? 'bg-emerald-50/70 border-emerald-200'
                                : isReminderSent
                                  ? 'bg-amber-50/70 border-amber-200'
                                  : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img
                                  src={w.workerAvatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80'}
                                  alt={w.workerName}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <h6 className="text-xs font-black text-slate-900 leading-tight">
                                    {w.workerName}
                                  </h6>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {w.workerPhone} • {w.distanceKm || '2.4'} km away
                                  </span>
                                </div>
                              </div>

                              {isPromoted && (
                                <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full border border-purple-200">
                                  Standby Promoted
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-bold">
                              <span className={`flex items-center gap-1 ${
                                isConfirmed
                                  ? 'text-emerald-700 font-black'
                                  : isReminderSent
                                    ? 'text-amber-700 font-extrabold'
                                    : 'text-slate-500'
                              }`}>
                                {isConfirmed ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>{w.shiftStatus === 'on_my_way' ? 'On My Way 🚀' : 'Confirmed Present ✅'}</span>
                                  </>
                                ) : isReminderSent ? (
                                  <>
                                    <Clock className="w-3 h-3 text-amber-500" />
                                    <span>Reminder Sent • Awaiting Check-In</span>
                                  </>
                                ) : (
                                  <span>Assigned Primary</span>
                                )}
                              </span>

                              {/* Simulation button to test Standby Auto-Allocation workflow */}
                              <button
                                type="button"
                                onClick={() => setTestDropWorkerModal(w)}
                                className="text-[9px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                                title="Simulate worker dropout to test automatic standby promotion"
                              >
                                Test Dropout & Auto-Replace
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Standby / Backup Staff Roster */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Standby Backup Staff ({(selectedBooking.standbyWorkers || []).length}/{selectedBooking.standbyStaffNeeded})</span>
                    </h5>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Zero-Drop Reserve Ready
                    </span>
                  </div>

                  {(selectedBooking.standbyWorkers || []).length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
                      No standby workers assigned yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedBooking.standbyWorkers.map(sb => {
                        const isPromoted = sb.shiftStatus === 'promoted_to_primary';

                        return (
                          <div
                            key={sb.workerId}
                            className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                              isPromoted
                                ? 'bg-purple-50 border-purple-200 text-purple-900'
                                : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={sb.workerAvatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80'}
                                alt={sb.workerName}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <h6 className="text-xs font-black leading-tight">
                                  {sb.workerName}
                                </h6>
                                <span className="text-[10px] opacity-75 font-medium block">
                                  {sb.workerPhone} • {sb.distanceKm || '3.1'} km away
                                </span>
                              </div>
                            </div>

                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              isPromoted
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-emerald-600 text-white border-emerald-600'
                            }`}>
                              {isPromoted ? 'Promoted to Primary' : 'Active Standby'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Audit Logs & Standby Auto-Allocation Trail */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-slate-500" />
                      <span>Shift Allocation & Attendance Audit Trail</span>
                    </h5>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {(selectedBooking.auditLogs || []).length} Events Logged
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(selectedBooking.auditLogs || []).slice().reverse().map((log, idx) => (
                      <div
                        key={log.id || idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                          log.type === 'standby_promoted'
                            ? 'bg-purple-50 border-purple-200 text-purple-900 font-extrabold'
                            : log.type === 'worker_unable'
                              ? 'bg-red-50 border-red-200 text-red-900 font-medium'
                              : log.type === 'shift_reminder_sent'
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                                : 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                        }`}
                      >
                        <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </span>
                        <p className="flex-1 leading-relaxed">
                          {log.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Test Dropout / Unable to Attend Simulation Modal */}
      {testDropWorkerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Simulate Worker Dropout & Standby Promotion</span>
              </div>
              <button
                onClick={() => setTestDropWorkerModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Simulate <strong>{testDropWorkerModal.workerName}</strong> clicking "Unable to Attend" on shift morning. JOBit will automatically promote the first available Standby worker to Primary Staff with zero drop guarantee!
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Dropout Reason:
              </label>
              <select
                value={dropReason}
                onChange={e => setDropReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
              >
                <option value="Sudden Health Issue / High Fever">Sudden Health Issue / High Fever</option>
                <option value="Personal / Family Emergency">Personal / Family Emergency</option>
                <option value="Vehicle Breakdown / Transport Issue">Vehicle Breakdown / Transport Issue</option>
                <option value="Shift Conflict with Another Engagement">Shift Conflict with Another Engagement</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTestDropWorkerModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDropAndAutoPromote}
                disabled={loadingAction}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 transition cursor-pointer shadow-sm"
              >
                Confirm Drop & Auto-Promote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
