import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Clock, 
  Sparkles, 
  Image as ImageIcon, 
  ChevronRight, 
  Check, 
  X, 
  User, 
  Phone, 
  Briefcase,
  Layers,
  Award,
  Maximize2
} from 'lucide-react';
import { subscribeWorkers, subscribePortfolios } from '../data/bookingService';

export function SkilledProfessionalSelectionScreen({ 
  category, 
  onBack, 
  onSelectWorkerToBook 
}) {
  const [allWorkers, setAllWorkers] = useState([]);
  const [allPortfolios, setAllPortfolios] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'top_rated' | 'experienced'
  const [selectedAlbumModal, setSelectedAlbumModal] = useState(null); // { album, worker }
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const categoryName = typeof category === 'object' ? (category?.name || category?.title || 'Skilled Services') : String(category || 'Skilled Services');
  const categoryId = typeof category === 'object' ? (category?.id || category?.categoryId || '') : '';
  const categoryIcon = typeof category === 'object' ? (category?.icon || '✨') : '✨';

  // Subscribe to real-time workers and portfolios
  useEffect(() => {
    const unsubWorkers = subscribeWorkers((list) => {
      setAllWorkers(list || []);
    });
    const unsubPortfolios = subscribePortfolios((list) => {
      setAllPortfolios(list || []);
    });

    return () => {
      unsubWorkers();
      unsubPortfolios();
    };
  }, []);

  // Filter workers relevant to this specialized category
  const relevantWorkers = allWorkers.filter((worker) => {
    if (!worker) return false;
    const catLower = categoryName.toLowerCase();
    const wSkill = (worker.skill || '').toLowerCase();
    const wCatId = (worker.categoryId || '').toLowerCase();
    const wCatName = (worker.categoryName || '').toLowerCase();

    // Check direct category ID or skill keywords
    if (categoryId && wCatId && (wCatId === categoryId.toLowerCase() || categoryId.toLowerCase().includes(wCatId))) {
      return true;
    }

    if (catLower.includes('mehndi') || catLower.includes('henna')) {
      return wSkill.includes('mehndi') || wSkill.includes('henna') || wCatName.includes('mehndi');
    }
    if (catLower.includes('beauty') || catLower.includes('makeup') || catLower.includes('salon')) {
      return wSkill.includes('beauty') || wSkill.includes('makeup') || wSkill.includes('salon') || wCatName.includes('beauty');
    }
    if (catLower.includes('paint') || catLower.includes('wall')) {
      return wSkill.includes('paint') || wSkill.includes('wall') || wCatName.includes('paint');
    }
    if (catLower.includes('carpenter') || catLower.includes('wood') || catLower.includes('modular')) {
      return wSkill.includes('carpenter') || wSkill.includes('wood') || wSkill.includes('kitchen') || wCatName.includes('carpenter');
    }

    return wSkill.includes(catLower) || catLower.includes(wSkill);
  });

  // Apply sub-filters
  const filteredWorkers = relevantWorkers.filter((w) => {
    if (activeFilter === 'top_rated') return (Number(w.rating) || 4.5) >= 4.9;
    if (activeFilter === 'experienced') {
      const expNum = parseInt(String(w.experience || '0'), 10) || 0;
      return expNum >= 6;
    }
    return true;
  });

  // Helper to get albums for a worker
  const getWorkerAlbums = (workerId) => {
    return allPortfolios.filter((p) => {
      const wId = p.worker_id || p.workerId;
      return wId === workerId;
    });
  };

  const handleOpenAlbum = (album, worker, photoIdx = 0) => {
    setSelectedAlbumModal({ album, worker });
    setActivePhotoIndex(photoIdx);
  };

  return (
    <div className="w-full min-h-screen bg-[#F4FAFD] pb-24 text-slate-900 select-none">
      
      {/* 1. Header Bar */}
      <header className="px-5 py-3.5 bg-white border-b border-slate-100 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">{categoryIcon}</span>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                {categoryName}
              </h1>
            </div>
            <p className="text-[11px] font-bold text-[#0EA5E0] uppercase tracking-wider">
              Select Skilled Professional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-sky-50 text-[#0EA5E0] px-2.5 py-1 rounded-full text-xs font-black">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Portfolio Flow</span>
        </div>
      </header>

      {/* 2. Hero Trust Banner */}
      <div className="px-5 pt-3 pb-2">
        <div className="p-3.5 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-white rounded-2xl border border-sky-100/80 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0EA5E0] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-slate-900 leading-tight">
                Verified Artisans with Work Albums
              </p>
              <p className="text-slate-600 font-medium text-[11px] mt-0.5 leading-relaxed">
                Browse past project photos, customer reviews, and ratings. Choose your preferred professional for dedicated service.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Chips */}
      <div className="px-5 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer shrink-0 ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
          }`}
        >
          All Pros ({relevantWorkers.length})
        </button>
        <button
          onClick={() => setActiveFilter('top_rated')}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer shrink-0 flex items-center gap-1 ${
            activeFilter === 'top_rated'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
          }`}
        >
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Top Rated (4.9+)</span>
        </button>
        <button
          onClick={() => setActiveFilter('experienced')}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer shrink-0 flex items-center gap-1 ${
            activeFilter === 'experienced'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="w-3 h-3 text-sky-600" />
          <span>6+ Years Exp</span>
        </button>
      </div>

      {/* 4. Workers & Work Albums Grid */}
      <div className="px-5 py-3 space-y-4">
        {filteredWorkers.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 text-sm">
                No specialists matched this filter
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try switching back to "All Pros" to view available verified professionals.
              </p>
            </div>
            <button
              onClick={() => setActiveFilter('all')}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredWorkers.map((worker) => {
            const albums = getWorkerAlbums(worker.id);
            const totalPhotos = albums.reduce((sum, a) => sum + (a.image_urls?.length || a.imageUrls?.length || 0), 0);

            return (
              <div 
                key={worker.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Worker Top Profile Header */}
                <div className="p-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={worker.avatar || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=300&q=80"}
                        alt={worker.name}
                        className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-100 shadow-2xs"
                      />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-sm font-black text-slate-900 leading-tight">
                          {worker.name}
                        </h2>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Verified</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {worker.skill || categoryName} • {worker.experience || '6+ years exp'}
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                        <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{worker.rating || 5.0}</span>
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">
                          {worker.reviewCount || 180} reviews
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-emerald-600 font-extrabold">
                          {worker.jobsCompleted || 240}+ completed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Starting</p>
                    <p className="text-base font-black text-slate-900">
                      ₹{worker.startingPrice || category?.basePrice || 499}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold">Flat ₹99 visit</p>
                  </div>
                </div>

                {/* Worker Bio / Craftsmanship Note */}
                {worker.bio && (
                  <div className="px-4 py-2.5 bg-slate-50/60 text-slate-600 text-[11px] font-medium leading-relaxed border-b border-slate-100">
                    "{worker.bio}"
                  </div>
                )}

                {/* Portfolio Photo Album Grid */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                      <ImageIcon className="w-3.5 h-3.5 text-[#0EA5E0]" />
                      <span>Work Albums ({albums.length})</span>
                      <span className="text-[11px] text-slate-400 font-semibold">• {totalPhotos} photos</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Tap photo to enlarge
                    </span>
                  </div>

                  {albums.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No albums uploaded yet. Direct booking available.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {albums.map((album) => {
                        const images = album.image_urls || album.imageUrls || [];
                        const previewImages = images.slice(0, 4);

                        return (
                          <div 
                            key={album.id}
                            className="p-3 bg-gradient-to-b from-[#F7FBFD] to-white rounded-2xl border border-sky-100/70 hover:border-sky-300 transition space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-black text-slate-800 truncate pr-2">
                                {album.title}
                              </h3>
                              <span className="text-[10px] bg-sky-100/80 text-sky-800 font-black px-2 py-0.5 rounded-full shrink-0">
                                {images.length} Photos
                              </span>
                            </div>

                            {album.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                                {album.description}
                              </p>
                            )}

                            {/* Photo Thumbnail Strip */}
                            <div className="grid grid-cols-4 gap-1.5 pt-1">
                              {previewImages.map((imgUrl, idx) => (
                                <div 
                                  key={idx}
                                  onClick={() => handleOpenAlbum(album, worker, idx)}
                                  className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer group shadow-2xs"
                                >
                                  <img 
                                    src={imgUrl} 
                                    alt={`${album.title} ${idx + 1}`} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                                    <Maximize2 className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition" />
                                  </div>
                                  {idx === 3 && images.length > 4 && (
                                    <div className="absolute inset-0 bg-slate-900/70 text-white font-black text-xs flex items-center justify-center">
                                      +{images.length - 4}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Primary Action Button: "Book This Worker" */}
                <div className="p-4 pt-1 bg-white">
                  <button
                    onClick={() => onSelectWorkerToBook(worker, albums[0])}
                    className="w-full py-3 px-4 bg-gradient-to-r from-slate-900 to-[#0EA5E0] hover:from-slate-800 hover:to-sky-500 text-white rounded-2xl text-xs font-black flex items-center justify-between shadow-sm cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      <span>Book {worker.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-sky-100">
                      <span>Reserve Worker</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Full Album Photo Viewer Lightbox / Modal */}
      {selectedAlbumModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <img 
                  src={selectedAlbumModal.worker.avatar || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=300&q=80"}
                  alt={selectedAlbumModal.worker.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                />
                <div className="min-w-0">
                  <h3 className="text-xs font-extrabold text-slate-900 truncate">
                    {selectedAlbumModal.album.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    By {selectedAlbumModal.worker.name} ({selectedAlbumModal.worker.skill})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAlbumModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Active High-Res Photo */}
            <div className="relative bg-slate-950 aspect-4/3 flex items-center justify-center overflow-hidden">
              {selectedAlbumModal.album.image_urls?.[activePhotoIndex] ? (
                <img 
                  src={selectedAlbumModal.album.image_urls[activePhotoIndex]} 
                  alt={selectedAlbumModal.album.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-400 text-xs">No image available</div>
              )}

              {/* Photo Counter */}
              <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 text-white text-[11px] font-black rounded-full backdrop-blur-xs">
                {activePhotoIndex + 1} / {selectedAlbumModal.album.image_urls?.length || 1}
              </div>
            </div>

            {/* Thumbnails Navigator */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {(selectedAlbumModal.album.image_urls || []).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                    activePhotoIndex === idx ? 'border-[#0EA5E0] ring-2 ring-sky-200 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Album Description */}
            <div className="p-4 space-y-1.5 flex-1 overflow-y-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Work Details
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {selectedAlbumModal.album.description || 'Verified past customer project completed with craftsmanship and care.'}
              </p>
            </div>

            {/* Modal Footer: Book This Worker Button */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verified Pro</p>
                <p className="text-sm font-black text-slate-900">{selectedAlbumModal.worker.name}</p>
              </div>

              <button
                onClick={() => {
                  const worker = selectedAlbumModal.worker;
                  const album = selectedAlbumModal.album;
                  setSelectedAlbumModal(null);
                  onSelectWorkerToBook(worker, album);
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition"
              >
                <span>Book This Worker</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
