import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  Send, 
  Check, 
  X, 
  Navigation,
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  acceptCateringShift, 
  confirmWorkerAttendance, 
  reportUnableToAttend 
} from '../../data/cateringShiftService';

export function WorkerCateringShiftsCard({ 
  booking, 
  activeWorker, 
  mode = 'available', // 'available' | 'active'
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [showUnableModal, setShowUnableModal] = useState(false);
  const [unableReason, setUnableReason] = useState('Sudden Health Issue / High Fever');
  const [actionNotice, setActionNotice] = useState('');

  if (!booking || !activeWorker) return null;

  const showToast = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4500);
  };

  // Check worker's status in this booking
  const myPrimary = (booking.primaryWorkers || []).find(w => w.workerId === activeWorker.id);
  const myStandby = (booking.standbyWorkers || []).find(w => w.workerId === activeWorker.id);
  const isAlreadyApplicant = (booking.applicants || []).some(a => a.workerId === activeWorker.id);

  const isPrimary = Boolean(myPrimary);
  const isStandby = Boolean(myStandby);
  const isPromoted = Boolean(myPrimary?.promotedFromStandby || myStandby?.shiftStatus === 'promoted_to_primary');
  const shiftStatus = myPrimary?.shiftStatus || myStandby?.shiftStatus || 'assigned';

  const isConfirmed = ['attendance_confirmed', 'on_my_way'].includes(shiftStatus);
  const isReminderActive = booking.shiftReminderSent || shiftStatus === 'shift_reminder_sent';

  // 1. Action: Accept Catering Shift
  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await acceptCateringShift(booking.id, activeWorker);
      if (res.assignedRole === 'primary') {
        showToast('🎉 Booking Confirmed! Selected as Primary Staff for Event.');
      } else if (res.assignedRole === 'standby') {
        showToast('🛡️ Assigned as Standby Backup Staff. Full shift pay on emergency promotion!');
      } else {
        showToast('Application recorded on Priority Reserve List.');
      }
      onSuccess?.(res.booking);
    } catch (err) {
      console.error(err);
      showToast('Error accepting catering shift.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Action: Confirm Attendance / On My Way
  const handleConfirmAttendance = async (statusType = 'attendance_confirmed') => {
    setLoading(true);
    try {
      const updated = await confirmWorkerAttendance(booking.id, activeWorker.id, statusType);
      showToast(statusType === 'on_my_way' ? '🚀 Marked: On My Way to Venue!' : '✅ Shift Attendance Confirmed!');
      onSuccess?.(updated);
    } catch (err) {
      console.error(err);
      showToast('Failed to confirm attendance.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Action: Unable to Attend -> Triggers Standby Auto-Allocation
  const handleReportUnable = async () => {
    setLoading(true);
    try {
      const res = await reportUnableToAttend(booking.id, activeWorker.id, unableReason);
      setShowUnableModal(false);
      showToast('Shift cancelled. Standby replacement was automatically promoted.');
      onSuccess?.(res.booking);
    } catch (err) {
      console.error(err);
      showToast('Error reporting shift cancellation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 rounded-3xl border transition shadow-xs space-y-3.5 ${
      isPromoted
        ? 'bg-gradient-to-br from-purple-50 via-white to-rose-50 border-purple-300 ring-2 ring-purple-200'
        : isPrimary
          ? 'bg-gradient-to-br from-rose-50/40 via-white to-amber-50/30 border-rose-200'
          : isStandby
            ? 'bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 border-emerald-200'
            : 'bg-white border-slate-200/90 hover:border-slate-300'
    }`}>
      {/* Notice Message */}
      {actionNotice && (
        <div className="p-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header & Role Tag */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-full">
              {booking.eventOccasion || 'Catering Event'}
            </span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              #{booking.id.slice(-6)}
            </span>
          </div>
          <h4 className="text-sm font-black text-slate-900 mt-1">
            {booking.venueName}
          </h4>
        </div>

        {/* Dynamic Badge */}
        {mode === 'active' ? (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isPromoted
              ? 'bg-purple-600 text-white animate-pulse shadow-xs'
              : isConfirmed
                ? 'bg-emerald-100 text-emerald-800'
                : isPrimary
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
          }`}>
            {isPromoted 
              ? '🚨 Promoted to Primary' 
              : isConfirmed 
                ? 'Attendance Verified' 
                : isPrimary 
                  ? 'Primary Staff' 
                  : 'Standby Backup Staff'}
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            Available Shift
          </span>
        )}
      </div>

      {/* Emergency Promotion High-Visibility Banner */}
      {isPromoted && (
        <div className="p-3 bg-purple-100/90 border border-purple-300 rounded-2xl flex items-start gap-2.5 text-xs text-purple-900 shadow-xs">
          <Zap className="w-4 h-4 text-purple-700 shrink-0 mt-0.5 fill-purple-600" />
          <div>
            <strong className="font-black text-purple-950 block">
              Emergency Shift Allocation Active!
            </strong>
            <p className="text-[11px] text-purple-800 mt-0.5">
              You were promoted from Standby to <strong>Primary Staff</strong> for today's event at {booking.venueName}. Full shift pay (₹{booking.ratePerStaff}) confirmed. Please report by {booking.functionTime.split('-')[0].trim()}!
            </p>
          </div>
        </div>
      )}

      {/* Standby Explanation Banner (when assigned as standby) */}
      {isStandby && !isPromoted && mode === 'active' && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2 text-xs text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-extrabold">Assigned as Standby Backup Staff:</strong>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Please stay reachable on your phone. If any primary staff member reports unable to attend, our system will automatically promote you with full shift pay!
            </p>
          </div>
        </div>
      )}

      {/* Event Details: Date, Time, Venue Location, Pay */}
      <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-700 font-bold">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{booking.functionDate}</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{booking.functionTime}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="truncate">{booking.functionLocation || booking.address}</span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">Shift Compensation:</span>
          <span className="font-black text-rose-600 text-sm">
            ₹{booking.ratePerStaff || 650} / professional
          </span>
        </div>
      </div>

      {/* Uniform Specification */}
      {booking.uniform && (
        <div className="text-[11px] text-slate-500 font-medium bg-white/70 p-2 rounded-xl border border-slate-100">
          <strong className="text-slate-700 font-bold">Uniform: </strong>
          <span>{booking.uniform}</span>
        </div>
      )}

      {/* DAY-OF-EVENT ACTIONABLE REMINDER (Requirement 4) */}
      {mode === 'active' && isPrimary && !isConfirmed && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-indigo-900 font-black">
              <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>Confirm Your Catering Shift for Today</span>
            </div>
            <span className="text-[10px] font-extrabold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
              Action Required
            </span>
          </div>

          <p className="text-[11px] text-indigo-800 font-medium">
            Please verify whether you are attending today's shift at {booking.venueName} so the host and supervisor have exact headcounts.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Button 1: Confirm Attendance / On My Way */}
            <button
              onClick={() => handleConfirmAttendance('attendance_confirmed')}
              disabled={loading}
              className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Confirm Attendance</span>
            </button>

            {/* Button 2: Unable to Attend -> Triggers Standby Auto-Allocation */}
            <button
              onClick={() => setShowUnableModal(true)}
              disabled={loading}
              className="py-2.5 px-2 bg-white hover:bg-red-50 text-red-600 border border-red-300 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Unable to Attend</span>
            </button>
          </div>
        </div>
      )}

      {/* Already Confirmed State Display */}
      {mode === 'active' && isConfirmed && (
        <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs font-black text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Shift Attendance Confirmed • Ready on Site</span>
          </div>
          <button
            onClick={() => handleConfirmAttendance('on_my_way')}
            className="text-[10px] font-black bg-emerald-600 text-white px-2.5 py-1 rounded-xl hover:bg-emerald-700 transition cursor-pointer"
          >
            Mark: On My Way 🚀
          </button>
        </div>
      )}

      {/* Available Broadcast Mode: Accept Shift Button */}
      {mode === 'available' && (
        <button
          onClick={handleAccept}
          disabled={loading || isAlreadyApplicant}
          className={`w-full py-3 rounded-2xl text-xs font-black transition cursor-pointer shadow-sm flex items-center justify-center gap-2 ${
            isAlreadyApplicant
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200'
          }`}
        >
          {loading ? (
            <span>Processing Acceptance...</span>
          ) : isAlreadyApplicant ? (
            <span>Already Accepted • Awaiting Allocation</span>
          ) : (
            <>
              <span>Accept Catering Shift (₹{booking.ratePerStaff})</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </>
          )}
        </button>
      )}

      {/* "Unable to Attend" Reason Selection Modal */}
      {showUnableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600 font-black text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Unable to Attend Shift</span>
              </div>
              <button
                onClick={() => setShowUnableModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Reporting unable to attend will release your slot. Our system will immediately promote a Standby staff member to maintain zero event disruption.
            </p>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                Please select your reason:
              </label>
              <select
                value={unableReason}
                onChange={e => setUnableReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
              >
                <option value="Sudden Health Issue / High Fever">Sudden Health Issue / High Fever</option>
                <option value="Personal / Family Emergency">Personal / Family Emergency</option>
                <option value="Vehicle Breakdown / Transport Issue">Vehicle Breakdown / Transport Issue</option>
                <option value="Shift Conflict with Another Engagement">Shift Conflict with Another Engagement</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowUnableModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportUnable}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 transition cursor-pointer shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
