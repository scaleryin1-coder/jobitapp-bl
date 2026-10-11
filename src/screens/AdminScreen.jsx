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
  X
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { initialCategories, initialBanners } from '../data/seedData';

export function AdminScreen({ onBack }) {
  const [tab, setTab] = useState('categories'); // 'categories' | 'banners' | 'workers'
  const [categories, setCategories] = useState(initialCategories);
  const [banners, setBanners] = useState(initialBanners);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImg, setNewCatImg] = useState('');
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSub, setNewBannerSub] = useState('');
  const [newBannerPrice, setNewBannerPrice] = useState('300');
  const [newBannerService, setNewBannerService] = useState('Home Repair');
  const [newBannerImg, setNewBannerImg] = useState('');

  // Firestore sync
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const unsubCat = onSnapshot(collection(db, 'categories'), (snap) => {
      if (!snap.empty) {
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });

    const unsubBan = onSnapshot(collection(db, 'banners'), (snap) => {
      if (!snap.empty) {
        setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });

    return () => {
      uncat();
      unsubBan();
    };
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;

    const catObj = {
      name: newCatName.trim(),
      image: newCatImg.trim() || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
      order: categories.length + 1
    };

    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'categories'), catObj);
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
      await addDoc(collection(db, 'banners'), banObj);
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
      } catch {
        // Fallback
      }
    }
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteBanner = async (id) => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'banners', id));
      } catch {
        // Fallback
      }
    }
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="w-full min-h-screen bg-white pb-28 text-slate-900 select-none">
      
      {/* Header */}
      <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 sticky top-0 bg-white z-30">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-800 flex items-center justify-center hover:bg-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Admin Panel</h2>
          <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">
            Management & Content Control
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-5 py-3">
        <div className="flex bg-[#F1F3F5] rounded-full p-1 text-xs font-bold">
          <button
            onClick={() => setTab('categories')}
            className={`flex-1 py-2 rounded-full transition ${tab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setTab('banners')}
            className={`flex-1 py-2 rounded-full transition ${tab === 'banners' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Banners ({banners.length})
          </button>
        </div>
      </div>

      {/* Category Tab */}
      {tab === 'categories' && (
        <div className="px-5 space-y-4">
          <form onSubmit={handleAddCategory} className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Add New Category</h4>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category Name (e.g. Gardening, Appliance)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
            />
            <input
              type="url"
              value={newCatImg}
              onChange={(e) => setNewCatImg(e.target.value)}
              placeholder="Thumbnail Image URL (optional)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
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

      {/* Banner Tab */}
      {tab === 'banners' && (
        <div className="px-5 space-y-4">
          <form onSubmit={handleAddBanner} className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Add Carousel Banner</h4>
            <input
              type="text"
              required
              value={newBannerTitle}
              onChange={(e) => setNewBannerTitle(e.target.value)}
              placeholder="Banner Title (e.g. Seasonal Monsoon Discount)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
            />
            <input
              type="text"
              value={newBannerSub}
              onChange={(e) => setNewBannerSub(e.target.value)}
              placeholder="Subtitle"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newBannerService}
                onChange={(e) => setNewBannerService(e.target.value)}
                placeholder="Featured Service"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
              />
              <input
                type="number"
                value={newBannerPrice}
                onChange={(e) => setNewBannerPrice(e.target.value)}
                placeholder="Price ₹/hr"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
              />
            </div>
            <input
              type="url"
              value={newBannerImg}
              onChange={(e) => setNewBannerImg(e.target.value)}
              placeholder="Worker Image URL (optional)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
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

    </div>
  );
}
