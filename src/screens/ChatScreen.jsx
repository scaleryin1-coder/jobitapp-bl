import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Phone, ShieldCheck } from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, onSnapshot, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export function ChatScreen({ booking, onBack }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  const bookingId = booking?.id || 'bk_default';
  const workerName = booking?.workerName || 'Rajesh (Technician)';

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'chats', bookingId, 'messages'), orderBy('timestamp', 'asc'));
        const unsub = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
          } else {
            initDefaultMessages();
          }
        }, () => {
          initDefaultMessages();
        });
        return () => unsub();
      } catch {
        initDefaultMessages();
      }
    } else {
      initDefaultMessages();
    }
  }, [bookingId]);

  const initDefaultMessages = () => {
    setMessages([
      {
        id: 'msg_1',
        sender: 'worker',
        text: `Hello! I have received your booking for ${booking?.serviceTitle || 'the service'}. I will arrive equipped with all required tools.`,
        time: '10:00 AM'
      },
      {
        id: 'msg_2',
        sender: 'customer',
        text: 'Thank you! Please let me know once you are around the gate.',
        time: '10:02 AM'
      }
    ]);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = {
      senderId: currentUser?.uid || 'cust_1',
      sender: 'customer',
      senderName: currentUser?.name || 'Customer',
      text: input.trim(),
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setInput('');

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'chats', bookingId, 'messages'), {
          ...newMsg,
          serverTimestamp: serverTimestamp()
        });
      } catch {
        // Fallback
      }
    }

    setMessages(prev => [...prev, newMsg]);

    // Simulated worker reply after 1.5s if offline
    if (!isFirebaseConfigured) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: 'rep_' + Date.now(),
            sender: 'worker',
            text: 'Understood! Looking forward to assisting you.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 1200);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-between text-slate-900 select-none pb-20">
      
      {/* Top Header */}
      <header className="px-5 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-800 flex items-center justify-center hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">{workerName}</h2>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online • Verified Pro
            </p>
          </div>
        </div>

        <button 
          onClick={() => alert(`Calling pro through secure masked relay...`)}
          className="w-9 h-9 rounded-full bg-sky-50 text-[#0EA5E0] flex items-center justify-center hover:bg-sky-100 transition"
        >
          <Phone className="w-4 h-4" />
        </button>
      </header>

      {/* Security notice */}
      <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 text-center">
        <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Chat directly through JOBit. Never share personal OTPs.</span>
        </p>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[calc(100vh-210px)]">
        {messages.map((m, i) => {
          const isMe = m.sender === 'customer';
          return (
            <div
              key={m.id || i}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                  isMe
                    ? 'bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white rounded-br-none'
                    : 'bg-[#F1F3F5] text-slate-800 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time || 'Now'}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 flex items-center gap-2 bg-white sticky bottom-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message to worker..."
          className="flex-1 px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
        />
        <button
          type="submit"
          className="w-11 h-11 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white flex items-center justify-center shadow-glow shrink-0 active:scale-95 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
