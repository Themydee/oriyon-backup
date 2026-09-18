"use client";

import { useState, useEffect } from "react";
import { getStoredReadings, saveStoredReadings, ReadingMaterial } from "@/lib/readingsData";

const CATEGORIES = [
  "Livestock Management",
  "Cooperative Finance",
  "Digital Traceability",
  "Feed & Fodder",
  "Agribusiness Marketing",
  "Policy & Compliance",
] as const;

export default function AdminReadingsPage() {
  const [readings, setReadings] = useState<ReadingMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReading, setEditingReading] = useState<ReadingMaterial | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState<any>("Livestock Management");
  const [recommendedWeek, setRecommendedWeek] = useState<number>(1);
  const [author, setAuthor] = useState("");
  const [readTime, setReadTime] = useState("10 min read");
  const [type, setType] = useState<any>("PDF Guide");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    setReadings(getStoredReadings());
  }, []);

  const handleOpenAdd = () => {
    setEditingReading(null);
    setTitle("");
    setSubtitle("");
    setCategory("Livestock Management");
    setRecommendedWeek(1);
    setAuthor("Oriyon Agribusiness Team");
    setReadTime("10 min read");
    setType("PDF Guide");
    setSummary("");
    setContent("");
    setDownloadUrl("");
    setFeatured(false);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: ReadingMaterial) => {
    setEditingReading(item);
    setTitle(item.title);
    setSubtitle(item.subtitle);
    setCategory(item.category);
    setRecommendedWeek(item.recommendedWeek || 1);
    setAuthor(item.author);
    setReadTime(item.readTime);
    setType(item.type);
    setSummary(item.summary);
    setContent(item.content);
    setDownloadUrl(item.downloadUrl || "");
    setFeatured(!!item.featured);
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    if (editingReading) {
      const updated = readings.map((r) =>
        r.id === editingReading.id
          ? {
              ...r,
              title: title.trim(),
              subtitle: subtitle.trim(),
              category,
              recommendedWeek: Number(recommendedWeek),
              author: author.trim(),
              readTime: readTime.trim(),
              type,
              summary: summary.trim(),
              content: content.trim() || summary.trim(),
              downloadUrl: downloadUrl.trim() || undefined,
              featured,
            }
          : featured ? { ...r, featured: false } : r
      );
      setReadings(updated);
      saveStoredReadings(updated);
    } else {
      const newMaterial: ReadingMaterial = {
        id: `reading-${Date.now()}`,
        title: title.trim(),
        subtitle: subtitle.trim(),
        category,
        recommendedWeek: Number(recommendedWeek),
        author: author.trim() || "EEWYLA Technical Team",
        readTime: readTime.trim() || "10 min read",
        type,
        summary: summary.trim(),
        content: content.trim() || summary.trim(),
        downloadUrl: downloadUrl.trim() || undefined,
        featured,
        publishedAt: new Date().toISOString().slice(0, 10),
      };

      const updated = featured
        ? [newMaterial, ...readings.map((r) => ({ ...r, featured: false }))]
        : [newMaterial, ...readings];

      setReadings(updated);
      saveStoredReadings(updated);
    }

    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this reading material?")) {
      const updated = readings.filter((r) => r.id !== id);
      setReadings(updated);
      saveStoredReadings(updated);
    }
  };

  const toggleFeatured = (id: string) => {
    const updated = readings.map((r) => ({
      ...r,
      featured: r.id === id ? !r.featured : false,
    }));
    setReadings(updated);
    saveStoredReadings(updated);
  };

  const filteredReadings = readings.filter(
    (r) =>
      searchQuery.trim() === "" ||
      `${r.title} ${r.subtitle} ${r.author} ${r.category}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto font-sora space-y-6">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            📚 Recommended Readings & Knowledge Hub Management
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">
            Publish and manage recommended reading guides, PDFs, research papers, and technical handbooks for EEWYLA trainees.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <span>➕ Add Reading Material</span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by reading title, author, or category..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
        />
        <span className="text-xs font-bold text-slate-500 shrink-0">
          Total: {filteredReadings.length}
        </span>
      </div>

      {/* READINGS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Title & Details</th>
                <th className="p-4">Assigned Week</th>
                <th className="p-4">Category</th>
                <th className="p-4">Type & Read Time</th>
                <th className="p-4">Author</th>
                <th className="p-4">Spotlight</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                    No reading materials found. Click &quot;Add Reading Material&quot; to publish one.
                  </td>
                </tr>
              ) : (
                filteredReadings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 max-w-sm">
                      <p className="font-bold text-slate-900 text-sm leading-snug">{item.title}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs px-3 py-1 rounded-lg">
                        Week {item.recommendedWeek || 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{item.type}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{item.readTime}</p>
                    </td>
                    <td className="p-4 text-slate-600 font-semibold">{item.author}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleFeatured(item.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                          item.featured
                            ? "bg-amber-50 border-amber-300 text-amber-900"
                            : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {item.featured ? "⭐ Featured" : "Make Featured"}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold transition text-xs cursor-pointer"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold transition text-xs cursor-pointer"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 font-sora max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                {editingReading ? "Edit Reading Material" : "Add Recommended Reading Material"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Title *
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Small Ruminant Management Guide for West Africa"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Subtitle / Tagline
                </label>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Brief 1-line description of the reading guide"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Assigned Curriculum Week *
                  </label>
                  <select
                    value={recommendedWeek}
                    onChange={(e) => setRecommendedWeek(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>Week {w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Resource Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="PDF Guide">PDF Guide</option>
                    <option value="Article">Article</option>
                    <option value="Research Paper">Research Paper</option>
                    <option value="Handbook">Handbook</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Author / Organization
                  </label>
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Dr. O. A. Adeleke & EEWYLA Team"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Estimated Read Time
                  </label>
                  <input
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="e.g. 10 min read"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  PDF / Download URL
                </label>
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://example.com/handbook.pdf"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Short Summary *
                </label>
                <textarea
                  required
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary of what the student will learn from this reading..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition resize-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Full Article Content (Markdown / Text)
                </label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Full text content for online reading..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition font-medium font-sans"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="featured" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Make this the Weekly Spotlight Featured Reading
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                >
                  {editingReading ? "Save Changes" : "Publish Reading Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
