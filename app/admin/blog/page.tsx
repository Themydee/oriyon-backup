"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getStoredBlogPosts,
  saveStoredBlogPosts,
  fetchBlogPostsFromApi,
  generateSlug,
  BlogPost,
  BLOG_CATEGORIES,
} from "@/data/blogData";
import { popup } from "@/components/layout/PopupProvider";
import { authFetch } from "@/lib/api";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteModalPost, setDeleteModalPost] = useState<BlogPost | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<BlogPost["category"]>("News");
  const [readTime, setReadTime] = useState("5 min read");
  const [author, setAuthor] = useState("Reece James");
  const [authorTitle, setAuthorTitle] = useState("Agribusiness Specialist");
  const [authorImg, setAuthorImg] = useState("/learn/blog/Avatar.png");
  const [image, setImage] = useState("/learn/blog/singleHero.png");
  const [featured, setFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [excerpt, setExcerpt] = useState("");
  const [keyTakeawaysInput, setKeyTakeawaysInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    setLoading(true);
    try {
      const fetched = await fetchBlogPostsFromApi();
      setPosts(fetched);
    } catch (e) {
      console.error("[AdminBlog] Load error:", e);
      setPosts(getStoredBlogPosts());
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPost(null);
    setTitle("");
    setCategory("News");
    setReadTime("5 min read");
    setAuthor("Reece James");
    setAuthorTitle("Agribusiness Specialist");
    setAuthorImg("/learn/blog/Avatar.png");
    setImage("/learn/blog/singleHero.png");
    setFeatured(false);
    setIsPublished(true);
    setExcerpt("");
    setKeyTakeawaysInput("");
    setContentInput("");
    setTagsInput("");
    setShowModal(true);
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setCategory(post.category);
    setReadTime(post.readTime);
    setAuthor(post.author);
    setAuthorTitle(post.authorTitle || "Agribusiness Specialist");
    setAuthorImg(post.authorImg || "/learn/blog/Avatar.png");
    setImage(post.image || post.heroImage || "/learn/blog/singleHero.png");
    setFeatured(Boolean(post.featured));
    setIsPublished(post.isPublished !== false);
    setExcerpt(post.excerpt || "");
    setKeyTakeawaysInput((post.keyTakeaways || []).join("\n"));
    setContentInput((post.content || []).join("\n\n"));
    setTagsInput((post.tags || []).join(", "));
    setShowModal(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      popup.alert("Please provide a title for the blog post.");
      return;
    }
    if (!excerpt.trim()) {
      popup.alert("Please provide a brief excerpt/summary for the blog post.");
      return;
    }

    const takeaways = keyTakeawaysInput
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    const paragraphs = contentInput
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      category,
      readTime: readTime.trim() || "5 min read",
      author: author.trim() || "Admin",
      authorTitle: authorTitle.trim() || undefined,
      authorImg: authorImg.trim() || "/learn/blog/Avatar.png",
      image: image.trim() || "/learn/blog/singleHero.png",
      heroImage: image.trim() || "/learn/blog/singleHero.png",
      featured,
      isPublished,
      excerpt: excerpt.trim(),
      keyTakeaways: takeaways,
      content: paragraphs.length > 0 ? paragraphs : [excerpt.trim()],
      tags,
    };

    setIsSaving(true);

    try {
      if (editingPost && editingPost.id) {
        const res = await authFetch(`/blog/${editingPost.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          popup.alert(data.error || "Failed to update blog post");
          return;
        }

        popup.alert(`✓ Blog post "${title.trim()}" successfully updated!`);
      } else {
        const res = await authFetch("/blog", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          popup.alert(data.error || "Failed to create blog post");
          return;
        }

        popup.alert(`✓ Blog post "${title.trim()}" successfully published!`);
      }

      setShowModal(false);
      await loadBlogPosts();
    } catch (err: any) {
      console.error("[AdminBlog] Save error:", err);
      popup.alert("Error connecting to server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    const newStatus = !(post.isPublished !== false);
    if (!post.id) return;

    try {
      const res = await authFetch(`/blog/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: newStatus }),
      });

      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, isPublished: newStatus } : p))
        );
        popup.alert(`✓ Status updated to ${newStatus ? "Published" : "Draft"}`);
      } else {
        popup.alert("Failed to update status on server.");
      }
    } catch (e) {
      console.error("[AdminBlog] Toggle publish error:", e);
    }
  };

  const handleToggleFeatured = async (post: BlogPost) => {
    const isNowFeatured = !post.featured;
    if (!post.id) return;

    try {
      const res = await authFetch(`/blog/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({ featured: isNowFeatured }),
      });

      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => ({
            ...p,
            featured: p.id === post.id ? isNowFeatured : isNowFeatured ? false : p.featured,
          }))
        );
        popup.alert(isNowFeatured ? `⭐ "${post.title}" set as Featured Story!` : "Unfeatured post.");
      } else {
        popup.alert("Failed to update featured story status.");
      }
    } catch (e) {
      console.error("[AdminBlog] Toggle featured error:", e);
    }
  };

  const handleDeletePost = async () => {
    if (!deleteModalPost || !deleteModalPost.id) return;
    const target = deleteModalPost;

    setIsDeleting(true);
    try {
      const res = await authFetch(`/blog/${target.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== target.id));
        setDeleteModalPost(null);
        popup.alert("✓ Blog post deleted successfully.");
      } else {
        const data = await res.json();
        popup.alert(data.error || "Failed to delete blog post.");
      }
    } catch (e) {
      console.error("[AdminBlog] Delete error:", e);
      popup.alert("Network error while deleting post.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Category filter
      if (categoryFilter !== "All" && post.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      // Status filter
      if (statusFilter === "Published" && post.isPublished === false) return false;
      if (statusFilter === "Draft" && post.isPublished !== false) return false;

      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullStr = `${post.title} ${post.author} ${post.excerpt} ${post.category}`.toLowerCase();
        if (!fullStr.includes(q)) return false;
      }

      return true;
    });
  }, [posts, categoryFilter, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((p) => p.isPublished !== false).length;
    const drafts = total - published;
    const featuredCount = posts.filter((p) => p.featured).length;

    return { total, published, drafts, featuredCount };
  }, [posts]);

  return (
    <div className="font-sora space-y-6 pb-12">
      {/* ─────────────────────────────────────────────
          HEADER
         ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📰</span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Blog & Content Management
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Create, edit, publish, and feature insights and field articles for the public blog
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs md:text-sm px-5 py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>+</span> Create New Blog Post
        </button>
      </div>

      {/* ─────────────────────────────────────────────
          METRICS CARDS
         ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Total Articles
          </p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{metrics.total}</p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest">
            Published Live
          </p>
          <p className="text-2xl md:text-3xl font-black text-emerald-800">{metrics.published}</p>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest">
            Drafts
          </p>
          <p className="text-2xl md:text-3xl font-black text-amber-900">{metrics.drafts}</p>
        </div>

        <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[10px] font-extrabold text-teal-800 uppercase tracking-widest">
            Featured Story
          </p>
          <p className="text-2xl md:text-3xl font-black text-teal-900">{metrics.featuredCount}</p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          TOOLBAR & FILTERS
         ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, category..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium transition"
          />
          <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            {BLOG_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Published">✅ Published Only</option>
            <option value="Draft">⏳ Drafts Only</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          BLOG POSTS LIST
         ───────────────────────────────────────────── */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-3xl text-center p-6">
          <div className="text-4xl mb-3">📰</div>
          <p className="text-sm font-bold text-slate-800">No blog posts found</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting your search query or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const isPub = post.isPublished !== false;
            return (
              <div
                key={post.slug}
                className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-slate-100 border border-slate-100">
                    <Image
                      src={post.image || post.heroImage || "/learn/blog/singleHero.png"}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="bg-[#002d25] text-[#00D1C1] text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-2xs">
                        {post.category}
                      </span>
                      {post.featured && (
                        <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-2xs">
                          ⭐ Featured
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2.5 right-2.5">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-2xs ${
                          isPub
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {isPub ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>

                  {/* Title & Excerpt */}
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-medium">
                    {post.excerpt}
                  </p>

                  <div className="text-[11px] text-slate-400 font-bold mb-4 flex items-center justify-between">
                    <span>✍️ {post.author}</span>
                    <span>{post.date}</span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTogglePublish(post)}
                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
                        isPub
                          ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                          : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                      }`}
                      title="Toggle publish status"
                    >
                      {isPub ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      onClick={() => handleToggleFeatured(post)}
                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
                        post.featured
                          ? "bg-amber-100 border-amber-300 text-amber-900"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                      title="Mark as featured story on homepage"
                    >
                      {post.featured ? "Featured ⭐" : "Feature"}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/learn/blog/${post.slug}`}
                      target="_blank"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition"
                      title="View article on live blog page"
                    >
                      👁️ View
                    </Link>

                    <button
                      onClick={() => openEditModal(post)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold transition cursor-pointer"
                      title="Edit article"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      onClick={() => setDeleteModalPost(post)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold transition cursor-pointer"
                      title="Delete article"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          CREATE / EDIT BLOG POST MODAL
         ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl my-8 overflow-hidden font-sora">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editingPost ? "Edit Blog Article" : "Create New Blog Article"}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {editingPost ? `Editing: ${editingPost.title}` : "Publish fresh agribusiness insights for the Oriyon platform"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePost} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Article Title *
                  </label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Modern Goat Breeding Protocols in Oyo State..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-bold"
                  >
                    <option value="News">News</option>
                    <option value="Business">Business</option>
                    <option value="Livestock Animals">Livestock Animals</option>
                    <option value="Oriyon International">Oriyon International</option>
                  </select>
                </div>
              </div>

              {/* Author & Read Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Author Name
                  </label>
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Reece James"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Author Title / Designation
                  </label>
                  <input
                    value={authorTitle}
                    onChange={(e) => setAuthorTitle(e.target.value)}
                    placeholder="Agribusiness Specialist"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Estimated Read Time
                  </label>
                  <input
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="5 min read"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-medium"
                  />
                </div>
              </div>

              {/* Image URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Hero / Cover Image URL
                  </label>
                  <input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="/learn/blog/singleHero.png"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Author Avatar Image URL
                  </label>
                  <input
                    value={authorImg}
                    onChange={(e) => setAuthorImg(e.target.value)}
                    placeholder="/learn/blog/Avatar.png"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-mono font-medium"
                  />
                </div>
              </div>

              {/* Status & Featured Flags */}
              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span>Publish Immediately (Live on Blog)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 accent-amber-500"
                  />
                  <span>⭐ Mark as Featured Story</span>
                </label>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Short Excerpt / Article Summary *
                </label>
                <textarea
                  required
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Provide a concise 1-2 sentence summary displayed on article cards..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-medium resize-none"
                />
              </div>

              {/* Key Takeaways */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Key Takeaways (One bullet point per line)
                </label>
                <textarea
                  rows={3}
                  value={keyTakeawaysInput}
                  onChange={(e) => setKeyTakeawaysInput(e.target.value)}
                  placeholder="Digital EAR TAGs provide unique identity...&#10;Cooperative bulk feed purchasing reduces cost by 30%..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-medium resize-none"
                />
              </div>

              {/* Body Content */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Article Body Paragraphs (Separate paragraphs with blank lines)
                </label>
                <textarea
                  rows={8}
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  placeholder="Write full article body text here. Separate paragraphs with double newlines...&#10;&#10;Second paragraph content goes here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-medium resize-y"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Tags (Comma-separated)
                </label>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Goat Farming, Traceability, EEWYLA, Ogbomoso"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-medium"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {editingPost ? "Save Changes" : "Publish Article"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          DELETE CONFIRMATION MODAL
         ───────────────────────────────────────────── */}
      {deleteModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl font-sora">
            <h3 className="text-lg font-black text-slate-900 mb-2">
              Delete Article?
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-6">
              Are you sure you want to delete <span className="font-bold text-slate-900">&quot;{deleteModalPost.title}&quot;</span>? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteModalPost(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
