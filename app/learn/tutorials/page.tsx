"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Tutorial,
  TUTORIAL_CATEGORIES,
  fetchTutorials,
} from "@/lib/tutorials";
import UniversalVideoPlayer from "@/components/common/UniversalVideoPlayer";

export default function PublicTutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("All");
  const [search, setSearch] = useState("");
  const [activeVideo, setActiveVideo] = useState<Tutorial | null>(null);

  useEffect(() => {
    fetchTutorials().then((data) => {
      setTutorials(data);
      setLoading(false);
    });
  }, []);

  const filtered = tutorials.filter((t) => {
    const matchesCat = selectedCat === "All" || t.category === selectedCat;
    const matchesSearch =
      search === "" ||
      `${t.title} ${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const featuredList = tutorials.filter((t) => t.isFeatured);

  return (
    <div className="min-h-screen bg-slate-50 font-sora text-slate-800">
      {/* HERO BANNER */}
      <section className="relative bg-[#002d25] text-white py-16 sm:py-20 md:py-24 px-4 sm:px-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: "url('/learn/training/greenSubtract.png')",
            backgroundSize: "180px",
            backgroundRepeat: "repeat",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <span className="inline-block bg-[#00D1C1]/20 text-[#00D1C1] border border-[#00D1C1]/30 text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
            🎥 Video Walkthroughs & Platform Guides
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-4">
            Master the Oriyon Platform
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Watch step-by-step video tutorials on navigating your LMS portal, uploading your ID, taking quizzes, and managing cooperative groups.
          </p>

          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Link
              href="/learn/lms"
              className="bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] font-black text-xs sm:text-sm px-6 py-3 rounded-full transition shadow-lg"
            >
              Go to LMS Portal →
            </Link>
            <a
              href="#guides"
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition border border-white/20"
            >
              Browse All Guides ↓
            </a>
          </div>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <main id="guides" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* FEATURED VIDEOS BANNER */}
        {featuredList.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl sm:text-2xl font-black text-[#002d25] mb-6 flex items-center gap-2">
              <span className="text-amber-500">★</span> Featured Walkthroughs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredList.slice(0, 2).map((tut) => (
                <div
                  key={tut.id}
                  onClick={() => setActiveVideo(tut)}
                  className="bg-white border border-emerald-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden mb-4 border border-slate-200">
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-14 h-14 rounded-full bg-[#00D1C1] text-[#002d25] flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform shadow-xl pl-0.5">
                          ▶
                        </div>
                      </div>
                      <div className="absolute top-3 left-3 bg-[#002d25] text-[#00D1C1] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider z-10">
                        {tut.category}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-xs font-mono px-2.5 py-1 rounded-md z-10 font-bold">
                        {tut.duration || "Video"}
                      </div>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-[#002d25] mb-2 leading-snug group-hover:text-emerald-700 transition">
                      {tut.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {tut.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-700 group-hover:underline">
                      Watch Video Walkthrough →
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Audience: {tut.targetAudience}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH & CATEGORY FILTERS */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#002d25]">
                All Video Guides
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Filter tutorials by category or search key topics
              </p>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tutorials..."
              className="w-full md:w-80 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-2xs font-medium"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex overflow-x-auto pb-3 gap-2.5 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {TUTORIAL_CATEGORIES.map((cat) => {
              const active = selectedCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-5 py-2.5 rounded-full text-xs sm:text-sm transition-all font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? "bg-[#002d25] text-[#00D1C1] shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* VIDEO GRID */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm font-medium">
            Loading video tutorials...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-slate-200/80 rounded-2xl p-8 text-center shadow-xs">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-bold text-slate-700">No video guides found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Tutorial videos uploaded by admins will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tut) => (
              <div
                key={tut.id}
                onClick={() => setActiveVideo(tut)}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail / Video Box */}
                  <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden mb-4 border border-slate-100">
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-11 h-11 rounded-full bg-[#00D1C1] text-[#002d25] flex items-center justify-center font-black text-base group-hover:scale-110 transition-transform shadow-md pl-0.5">
                        ▶
                      </div>
                    </div>
                    <div className="absolute top-2.5 left-2.5 bg-[#002d25] text-[#00D1C1] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider z-10">
                      {tut.category}
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded-md z-10 font-bold">
                      {tut.duration || "Video"}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base text-[#002d25] leading-snug mb-2 group-hover:text-emerald-700 transition">
                    {tut.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {tut.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 group-hover:underline">
                    Watch Walkthrough →
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {tut.targetAudience}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* VIDEO PLAYER MODAL */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50 font-sora">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#00D1C1] bg-[#002d25] px-3 py-1 rounded-full tracking-wider">
                  {activeVideo.category}
                </span>
                <h3 className="text-[#002d25] font-black text-base sm:text-xl mt-2">{activeVideo.title}</h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="text-slate-400 hover:text-slate-700 text-2xl transition leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Video Player */}
            <div className="p-2 sm:p-4 bg-slate-950 aspect-video flex items-center justify-center shrink-0">
              <UniversalVideoPlayer url={activeVideo.videoUrl} title={activeVideo.title} />
            </div>

            {/* Video Description & Notes */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 font-sora">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                  About This Guide
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {activeVideo.description}
                </p>
              </div>

              {activeVideo.notes && activeVideo.notes.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#002d25] mb-2">
                    Step-by-Step Instructions:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                    {activeVideo.notes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
