import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Clock, 
  CheckCheck,
  Check,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  setDoc 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { VoiceCallModal } from '../components/voice/VoiceCallModal';

export function ChatScreen({ booking, onBack }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const bottomRef = useRef(null);

  const bookingId = booking?.id || 'bk_default';
  const isWorker = currentUser?.role === 'worker';

  // Remote party details
  const remoteName = isWorker 
    ? (booking?.customerName || 'Customer')
    : (booking?.workerName || 'Rajesh Sharma (JOBit Expert)');
  const remoteRole = isWorker ? 'Customer' : 'JOBit Verified Technician';
  const remoteAvatar = isWorker
    ? (booking?.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80')
    : (booking?.workerAvatar || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=200&q=80');

  const senderRole = isWorker ? 'worker' : 'customer';
  const senderName = currentUser?.name || (isWorker ? 'JOBit Expert' : 'Customer');

  // Local storage cache key
  const storageKey = `jobit_chat_${bookingId}`;

  // Default seed messages
  const getDefaultMessages = () => {
    return [
      {
        id: 'msg_welcome_1',
        sender: 'worker',
        senderName: booking?.workerName || 'JOBit Expert',
        text: `Hello! I have received your booking for ${booking?.serviceTitle || 'the service'}. I will arrive equipped with all required tools.`,
        time: '10:00 AM',
        timestamp: Date.now() - 600000
      },
      {
        id: 'msg_welcome_2',
        sender: 'customer',
        senderName: booking?.customerName || 'Customer',
        text: 'Thank you! Please let me know once you are around the premises.',
        time: '10:02 AM',
        timestamp: Date.now() - 480000
      }
    ];
  };

  // Synchronize messages from Firebase Firestore or local cache
  useEffect(() => {
    let unsub = () => {};

    // First load from localStorage cache if available
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages(getDefaultMessages());
      }
    } catch {
      setMessages(getDefaultMessages());
    }

    if (isFirebaseConfigured && db) {
      try {
        const messagesRef = collection(db, 'chats', bookingId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        unsub = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({
              id: d.id,
              ...d.data(),
              time: d.data().time || (d.data().timestamp?.toDate ? d.data().timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now')
            }));
            setMessages(list);
            localStorage.setItem(storageKey, JSON.stringify(list));
          }
        }, (err) => {
          console.warn('Firestore chat listener notice:', err);
        });
      } catch (err) {
        console.warn('Chat subscription error:', err);
      }
    }

    return () => unsub();
  }, [bookingId]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      senderId: currentUser?.uid || (isWorker ? 'worker_current' : 'customer_current'),
      sender: senderRole,
      senderName,
      text,
      time: currentTime,
      timestamp: Date.now()
    };

    setInput('');

    // Update local state immediately for instant feedback
    setMessages(prev => {
      const updated = [...prev, newMsg];
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Save to Firebase Firestore
    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'chats', bookingId, 'messages'), {
          ...newMsg,
          serverTimestamp: serverTimestamp()
        });

        // Update chat meta document for admin oversight & indexing
        await setDoc(doc(db, 'chats', bookingId), {
          bookingId,
          serviceTitle: booking?.serviceTitle || 'Home Service',
          categoryName: booking?.categoryName || 'Home Service',
          customerId: booking?.customerId || 'cust_1',
          customerName: booking?.customerName || 'Customer',
          workerId: booking?.workerId || 'worker_1',
          workerName: booking?.workerName || 'JOBit Expert',
          lastMessage: text,
          lastSender: senderRole,
          lastSenderName: senderName,
          status: booking?.status || 'confirmed',
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore send message notice:', err);
      }
    } else {
      // Offline fallback: if customer sent a message and no Firebase, simulate realistic worker response
      if (senderRole === 'customer') {
        setTimeout(() => {
          const autoReply = {
            id: 'rep_' + Date.now(),
            sender: 'worker',
            senderName: booking?.workerName || 'JOBit Expert',
            text: 'Understood! I will keep you updated on arrival time.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
          };
          setMessages(prev => {
            const updated = [...prev, autoReply];
            try {
              localStorage.setItem(storageKey, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }, 1200);
      }
    }
  };

  const quickChips = isWorker 
    ? [
        "🚗 I am on my way",
        "📍 Arrived at your location",
        "🛠️ Starting work inspection",
        "✅ Work completed"
      ]
    : [
        "👋 When will you arrive?",
        "📍 I am at the gate/premises",
        "🔔 Please ring the bell",
        "🙏 Thank you so much"
      ];

  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-between text-slate-900 select-none pb-16">
      
      {/* 1. Top Header with Privacy & In-App Voice Call Button */}
      <header className="px-5 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-800 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={remoteAvatar}
                alt={remoteName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {remoteName}
                </h2>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>{remoteRole} • In-App Verified</span>
              </p>
            </div>
          </div>
        </div>

        {/* Agora.io In-App Voice Call Button (Replaces direct telephone dialer link) */}
        <button 
          onClick={() => setIsVoiceCallOpen(true)}
          className="px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 text-[#0EA5E0] font-black text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
          title="In-App Voice Call (Agora.io)"
        >
          <Phone className="w-3.5 h-3.5 fill-[#0EA5E0]" />
          <span>Free Call</span>
        </button>
      </header>

      {/* 2. Privacy & Security Notice Bar */}
      <div className="px-5 py-2 bg-gradient-to-r from-sky-50 via-slate-50 to-emerald-50 border-b border-slate-100 flex items-center justify-between">
        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span><strong>JOBit Privacy Shield:</strong> Phone numbers hidden. Chat & Voice Call strictly inside app.</span>
        </p>
      </div>

      {/* 3. Messages Feed */}
      <div className="flex-1 p-5 space-y-3.5 overflow-y-auto max-h-[calc(100vh-230px)]">
        {messages.map((m, i) => {
          const isMe = isWorker ? (m.sender === 'worker') : (m.sender === 'customer');

          return (
            <div
              key={m.id || i}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1 mb-1 px-1 text-[10px] text-slate-400 font-semibold">
                <span>{m.senderName || (isMe ? 'You' : remoteName)}</span>
              </div>

              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                  isMe
                    ? 'bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white rounded-br-none'
                    : 'bg-[#F1F3F5] text-slate-800 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                <span>{m.time || 'Now'}</span>
                {isMe && <CheckCheck className="w-3 h-3 text-[#0EA5E0]" />}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 4. Quick Response Chips */}
      <div className="px-4 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(chip)}
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-50 hover:text-[#0EA5E0] text-[11px] font-bold text-slate-600 whitespace-nowrap transition cursor-pointer shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* 5. Input Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }} 
        className="p-3 border-t border-slate-100 flex items-center gap-2 bg-white sticky bottom-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isWorker ? "Message customer safely..." : "Message technician safely..."}
          className="flex-1 px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-11 h-11 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white flex items-center justify-center shadow-glow shrink-0 active:scale-95 transition disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* 6. Agora.io Voice Call Modal */}
      <VoiceCallModal
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        booking={booking}
        currentUserRole={senderRole}
      />

    </div>
  );
}
