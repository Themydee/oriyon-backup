'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getStoredBlogPosts, fetchBlogPostsFromApi, BLOG_CATEGORIES, BlogPost } from '@/data/blogData';

const TheLatest = () => {
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const apiPosts = await fetchBlogPostsFromApi();
      const published = apiPosts.filter((p) => p.isPublished !== false);
      setAllPosts(published);
      setLoading(false);
    };
    load();

    if (typeof window !== "undefined") {
      window.addEventListener("oriyon_blog_posts_updated", () => {
        const stored = getStoredBlogPosts().filter((p) => p.isPublished !== false);
        setAllPosts(stored);
      });
    }
  }, []);

  // Filter posts by Category + Search Query
  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const matchCat =
        selectedCat === "All"
          ? true
          : post.category.toLowerCase() === selectedCat.toLowerCase();

      if (!matchCat) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const titleMatch = post.title.toLowerCase().includes(q);
      const excerptMatch = post.excerpt.toLowerCase().includes(q);
      const authorMatch = post.author.toLowerCase().includes(q);
      const categoryMatch = post.category.toLowerCase().includes(q);
      const tagMatch = post.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;

      return titleMatch || excerptMatch || authorMatch || categoryMatch || tagMatch;
    });
  }, [allPosts, selectedCat, searchQuery]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allPosts.length };
    BLOG_CATEGORIES.slice(1).forEach((cat) => {
      counts[cat] = allPosts.filter(
        (p) => p.category.toLowerCase() === cat.toLowerCase()
      ).length;
    });
    return counts;
  }, [allPosts]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  return (
    <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-white font-sora">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Live Search Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00D1C1] animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-[#0b4d44]">
                Oriyon Field Knowledge Hub
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#002d25] tracking-tight">
              The Latest Insights
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 max-w-xl">
              Explore news, agribusiness strategies, livestock management guides, and community impact stories from West Africa.
            </p>
          </div>

          {/* Search Bar Input */}
          <div className="relative w-full md:w-80 shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(6);
              }}
              placeholder="Search articles, guides, topics..."
              className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-[#002d25] placeholder-slate-400 focus:outline-none focus:border-[#00D1C1] focus:ring-2 focus:ring-[#00D1C1]/20 font-medium transition shadow-2xs"
            />
            <span className="absolute left-3.5 top-3.5 text-slate-400 text-sm">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-xs font-bold text-slate-400 hover:text-slate-700 bg-slate-200/60 rounded-full w-5 h-5 flex items-center justify-center transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categories Pills */}
        <div className="relative mb-8 sm:mb-10 md:mb-12">
          <div className="flex overflow-x-auto pb-3 sm:pb-0 md:flex-wrap gap-2.5 sm:gap-3 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {BLOG_CATEGORIES.map((cat) => {
              const active = selectedCat === cat;
              const count = categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCat(cat);
                    setVisibleCount(6);
                  }}
                  className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm transition-all font-extrabold whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 ${
                    active
                      ? "bg-[#00D1C1] border border-[#00D1C1] text-[#002d25] shadow-xs"
                      : "bg-slate-50 border border-slate-200 text-[#002d25] hover:border-[#00D1C1] hover:bg-slate-100"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      active
                        ? "bg-[#002d25] text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Articles Grid */}
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#002d25] flex items-center justify-center text-2xl font-bold mb-3">
              📖
            </div>
            <h3 className="text-lg font-black text-[#002d25] mb-1">
              No articles found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md font-medium mb-4">
              We couldn&apos;t find any articles matching &quot;{searchQuery || selectedCat}&quot;. Try adjusting your search query or category filter.
            </p>
            <button
              onClick={() => {
                setSelectedCat("All");
                setSearchQuery("");
              }}
              className="px-6 py-2.5 rounded-full bg-[#002d25] text-white text-xs font-bold hover:bg-[#0b4d44] transition shadow-2xs"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-8 mb-12 sm:mb-16">
            {visiblePosts.map((post: BlogPost) => (
              <Link
                href={`/learn/blog/${post.slug}`}
                key={post.slug}
                className="group block h-full"
              >
                <article className="flex flex-col h-full bg-white rounded-3xl border border-slate-100/90 hover:border-[#00D1C1]/60 transition-all duration-300 p-4 sm:p-5 hover:shadow-xl hover:-translate-y-1">
                  
                  {/* Article Image Container */}
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 sm:mb-5 bg-slate-100">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {post.featured && (
                      <span className="absolute top-3 left-3 bg-[#00D1C1] text-[#002d25] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                        ⭐ Featured Story
                      </span>
                    )}
                  </div>

                  {/* Metadata Tag Pill */}
                  <div className="flex items-center w-fit bg-[#002d25] rounded-full overflow-hidden mb-3 shadow-2xs">
                    <span className="bg-[#0b4d44] text-[#00D1C1] text-[10px] font-extrabold px-3.5 py-1 uppercase tracking-wider">
                      {post.category}
                    </span>
                    <span className="text-white text-[10px] font-medium px-3 py-1 opacity-90">
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-black text-[#002d25] leading-snug mb-2.5 group-hover:text-[#00D1C1] transition-colors">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4 font-medium">
                    {post.excerpt}
                  </p>

                  {/* Author Branding */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-auto">
                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                      <Image
                        src={post.authorImg}
                        alt={post.author}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#0b4d44]">
                        {post.author}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {post.date}
                      </p>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center pt-4 sm:pt-6">
            <button
              onClick={() => setVisibleCount((prev) => prev + 3)}
              className="w-full sm:w-auto bg-[#00D1C1] px-10 py-3.5 sm:py-4 rounded-full text-[#002d25] text-sm sm:text-base font-black hover:bg-[#00b8aa] transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Load more articles ({filteredPosts.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default TheLatest;