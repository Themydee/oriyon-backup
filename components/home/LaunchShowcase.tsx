"use client";

import { useState, useEffect } from "react";
import { getApiBase } from "@/lib/api";

interface GalleryItem {
  id: string;
  title: string;
  category: "launch" | "training" | "cooperative";
  categoryLabel: string;
  image: string;
  date: string;
  location: string;
  description: string;
  isRealBroadcast?: boolean;
}

export default function LaunchShowcase() {
  const [activeFilter, setActiveFilter] = useState<"all" | "launch" | "training" | "cooperative">("all");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPostedBroadcasts = async () => {
      let broadcasts: any[] = [];

      // 0. Pre-fill immediately from localStorage to avoid blank state
      try {
        const raw = localStorage.getItem("oriyon_broadcast_announcements_v1");
        if (raw) {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached) && cached.length > 0) {
            broadcasts = cached;
            setLoading(false);
          }
        }
      } catch {}

      // 1. Try fetching live broadcasts from API
      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/cooperative/announcements/broadcast`);
        if (res.ok) {
          const data = await res.json();
          const liveList = Array.isArray(data) ? data : data.announcements || data.data || [];
          if (liveList.length > 0) {
            broadcasts = liveList;
            try {
              localStorage.setItem("oriyon_broadcast_announcements_v1", JSON.stringify(liveList));
            } catch {}
          }
        }
      } catch {}

      // 2. Fallback or merge with localStorage cached broadcasts
      try {
        const raw = localStorage.getItem("oriyon_broadcast_announcements_v1");
        if (raw) {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached)) {
            const existingIds = new Set(broadcasts.map((b) => b.id));
            cached.forEach((c) => {
              if (!existingIds.has(c.id)) broadcasts.push(c);
            });
          }
        }
      } catch {}

      const publicBroadcasts = broadcasts.filter(
        (b: any) => b.level !== "trainers" && b.targetAudience !== "trainers"
      );

      const dynamicItems: GalleryItem[] = publicBroadcasts.map((b: any, i: number) => ({
        id: `posted-${b.id || i}`,
        title: b.title,
        category: (b.level === "state" || b.level === "zone") ? "training" : "launch",
        categoryLabel: b.isPinned ? "📌 PINNED LAUNCH EVENT" : "🚀 OFFICIAL BROADCAST",
        image: b.imageUrl && b.imageUrl.trim() ? b.imageUrl : "/eewyla/eewyla.png",
        date: b.createdAt
          ? new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "Latest Announcement",
        location: b.postedBy ? `Posted by ${b.postedBy}` : "Oyo State EEWYLA Programme",
        description: b.content,
        isRealBroadcast: true,
      }));

      setGalleryItems(dynamicItems);
      setLoading(false);
    };

    loadPostedBroadcasts();
  }, []);

  const filteredItems = galleryItems.filter((item) => {
    if (activeFilter === "all") return true;
    return item.category === activeFilter;
  });

  return (
    <section className="py-20 bg-[#fbf9f5] border-t border-b border-green-900/10 font-sora">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
            Programme Showcase & Media
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#002d25] mb-4 tracking-tight">
            EEWYLA Launch & Field Highlights
          </h2>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            Official announcements, launch ceremony updates, and field highlights across Oyo State.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                activeFilter === "all"
                  ? "bg-green-800 text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Highlights ({galleryItems.length})
            </button>
            <button
              onClick={() => setActiveFilter("launch")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                activeFilter === "launch"
                  ? "bg-green-800 text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              🚀 Launch Ceremony & Notices
            </button>
            <button
              onClick={() => setActiveFilter("training")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                activeFilter === "training"
                  ? "bg-green-800 text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              🐐 Field Updates
            </button>
            <button
              onClick={() => setActiveFilter("cooperative")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                activeFilter === "cooperative"
                  ? "bg-green-800 text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              🤝 Cooperative Network
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400 font-semibold animate-pulse">
            Loading broadcast updates...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-xl mx-auto shadow-xs">
            <span className="text-4xl mb-3 block">📢</span>
            <h3 className="text-base font-bold text-slate-800 mb-1">No Broadcasts Published Yet</h3>
            <p className="text-xs text-slate-500 font-medium">
              Check back soon for official announcements, launch images, and programme updates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group bg-white rounded-2xl overflow-hidden border border-emerald-300 ring-2 ring-emerald-500/10 shadow-sm hover:shadow-xl transition duration-300 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                    <span className="text-white text-xs font-bold flex items-center gap-1">
                      🔍 Click to preview full details
                    </span>
                  </div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider backdrop-blur-md bg-emerald-900/90 text-emerald-300 shadow-md">
                    {item.categoryLabel}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-green-800 transition line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="truncate max-w-[130px]">📍 {item.location}</span>
                    <span>🗓️ {item.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Screen Lightbox Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl relative border border-slate-700">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center text-lg font-bold hover:bg-black transition cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="relative aspect-[16/10] w-full bg-slate-950">
              <img
                src={selectedItem.image}
                alt={selectedItem.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-6 bg-white space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  {selectedItem.categoryLabel}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  📍 {selectedItem.location} • 🗓️ {selectedItem.date}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                {selectedItem.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {selectedItem.description}
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2 bg-green-800 hover:bg-green-900 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
