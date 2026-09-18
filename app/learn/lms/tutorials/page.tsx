"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Tutorial,
  TUTORIAL_CATEGORIES,
  fetchTutorials,
} from "@/lib/tutorials";
import UniversalVideoPlayer from "@/components/common/UniversalVideoPlayer";

export default function LmsTutorialsPage() {
  const router = useRouter();
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

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-800 font-sora selection:bg-[#00D1C1]/20">
      {/* BACKGROUND SUBTRACT LAYER */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "url('/learn/training/greenSubtract.png')",
            backgroundSize: "160px",
            backgroundRepeat: "repeat",
            filter: "hue-rotate(15deg) brightness(0.95)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00D1C1]/10 via-transparent to-transparent" />
      </div>

      {/* LMS TOP HEADER BAR */}
      <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/learn/lms/dashboard")}
            className="text-xs font-bold text-slate-500 hover:text-[#002d25] transition flex items-center gap-1.5 cursor-pointer"
          >
            ← Back to LMS Dashboard
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-extrabold text-slate-800">Platform Video Guides</span>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* BANNER */}
        <div className="bg-[#002d25] text-white rounded-3xl p-6 sm:p-10 mb-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block bg-[#00D1C1]/20 text-[#00D1C1] border border-[#00D1C1]/30 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
              🎥 LMS Tutorial Library
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-2">
              How to Use Oriyon LMS & Platform Features
            </h1>
            <p className="text-xs sm:text-sm text-[#00D1C1]/90 font-medium leading-relaxed">
              Watch video walkthroughs on submitting weekly assignments, taking exams, checking physical attendance, and updating your profile.
            </p>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#002d25]">
                Browse Tutorials
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Click any guide to play the video and view step-by-step notes
              </p>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guides..."
              className="w-full md:w-80 bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-2xs font-medium"
            />
          </div>

          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-none">
            {TUTORIAL_CATEGORIES.map((cat) => {
              const active = selectedCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 border cursor-pointer ${
                    active
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                      : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
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
            Loading tutorials...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-slate-200/80 rounded-2xl p-8 text-center shadow-xs">
            <div className="text-4xl mb-3">🎥</div>
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
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden mb-4 border border-slate-100">
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-12 h-12 rounded-full bg-[#00D1C1] text-[#002d25] flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform shadow-md pl-0.5">
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
                    Watch Video →
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Audience: {tut.targetAudience}
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
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-sora">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
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

            <div className="p-2 sm:p-4 bg-slate-950 aspect-video flex items-center justify-center shrink-0">
              <UniversalVideoPlayer url={activeVideo.videoUrl} title={activeVideo.title} />
            </div>

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
