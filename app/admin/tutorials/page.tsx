"use client";

import { useEffect, useState } from "react";
import {
  Tutorial,
  TUTORIAL_CATEGORIES,
  fetchTutorials,
  saveTutorialToBackend,
  deleteTutorialFromBackend,
  saveStoredTutorials,
} from "@/lib/tutorials";
import UniversalVideoPlayer from "@/components/common/UniversalVideoPlayer";

export default function AdminTutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTut, setEditingTut] = useState<Tutorial | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Tutorial["category"]>("Getting Started");
  const [targetAudience, setTargetAudience] = useState<Tutorial["targetAudience"]>("All");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadNotice, setUploadNotice] = useState("");
  const [formError, setFormError] = useState("");

  // Video Preview Modal state
  const [previewTut, setPreviewTut] = useState<Tutorial | null>(null);

  const loadData = async () => {
    setLoading(true);
    const list = await fetchTutorials();
    setTutorials(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingTut(null);
    setTitle("");
    setDescription("");
    setCategory("Getting Started");
    setTargetAudience("All");
    setVideoUrl("");
    setDuration("3 min");
    setNotes("");
    setIsFeatured(false);
    setFormError("");
    setUploadNotice("");
    setShowModal(true);
  };

  const handleOpenEdit = (tut: Tutorial) => {
    setEditingTut(tut);
    setTitle(tut.title);
    setDescription(tut.description);
    setCategory(tut.category);
    setTargetAudience(tut.targetAudience);
    setVideoUrl(tut.videoUrl);
    setDuration(tut.duration || "");
    setNotes(tut.notes ? tut.notes.join("\n") : "");
    setIsFeatured(tut.isFeatured || false);
    setFormError("");
    setUploadNotice("");
    setShowModal(true);
  };

  const uploadVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);
    setFormError("");
    setUploadNotice("");

    try {
      // 1. Try server upload endpoint /api/upload-video
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload-video", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const res = JSON.parse(xhr.responseText);
          setVideoUrl(res.url);
          setUploadNotice("Video uploaded and saved to website server!");
          setUploading(false);
        } else {
          // 2. Try Cloudinary fallback
          uploadToCloudinary(file);
        }
      };

      xhr.onerror = () => {
        uploadToCloudinary(file);
      };

      xhr.send(formData);
    } catch {
      uploadToCloudinary(file);
    }
  };

  const uploadToCloudinary = (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpbba8033";
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        setVideoUrl(res.secure_url);
        setUploadNotice("Video uploaded successfully to Cloudinary!");
      } else {
        // 3. Object URL fallback for local preview/session
        const objectUrl = URL.createObjectURL(file);
        setVideoUrl(objectUrl);
        setUploadNotice("Video file attached for current session. (You can also paste a YouTube or Vimeo link below).");
      }
      setUploading(false);
    };

    xhr.onerror = () => {
      const objectUrl = URL.createObjectURL(file);
      setVideoUrl(objectUrl);
      setUploadNotice("Video file attached for current session.");
      setUploading(false);
    };

    xhr.send(formData);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (uploading) {
      setFormError("Please wait for the video file upload to complete before saving.");
      return;
    }

    if (!title.trim()) {
      setFormError("Tutorial Title is required.");
      return;
    }

    if (!videoUrl.trim()) {
      setFormError("Video Source (File Upload or Video URL) is required.");
      return;
    }

    const noteLines = notes
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const payload: Tutorial = {
      id: editingTut ? editingTut.id : `tut_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      targetAudience,
      videoUrl: videoUrl.trim(),
      duration: duration.trim() || "3 min",
      notes: noteLines,
      isFeatured,
      createdAt: editingTut ? editingTut.createdAt : new Date().toISOString(),
    };

    // Optimistically update list
    let updatedList: Tutorial[];
    if (editingTut) {
      updatedList = tutorials.map((t) => (t.id === editingTut.id ? payload : t));
    } else {
      updatedList = [payload, ...tutorials];
    }
    setTutorials(updatedList);
    saveStoredTutorials(updatedList);

    await saveTutorialToBackend(payload, Boolean(editingTut));
    await loadData();
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this platform tutorial video?")) {
      const updated = tutorials.filter((t) => t.id !== id);
      setTutorials(updated);
      saveStoredTutorials(updated);
      await deleteTutorialFromBackend(id);
    }
  };

  const toggleFeatured = async (id: string) => {
    const tut = tutorials.find((t) => t.id === id);
    if (!tut) return;
    const newFeatured = !tut.isFeatured;

    const updated = tutorials.map((t) => (t.id === id ? { ...t, isFeatured: newFeatured } : t));
    setTutorials(updated);
    saveStoredTutorials(updated);

    await saveTutorialToBackend({ ...tut, isFeatured: newFeatured }, true);
  };

  const filtered = tutorials.filter((t) => {
    const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
    const matchesSearch =
      search === "" ||
      `${t.title} ${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="font-sora">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-1">
            Platform Video Tutorials
          </h1>
          <p className="text-slate-500 text-sm">
            Upload and save video walkthroughs directly to database
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 self-start md:self-auto cursor-pointer"
        >
          🎥 Upload & Save New Video
        </button>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-stretch md:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search saved videos by title or category..."
          className="flex-1 max-w-md bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-2xs font-medium"
        />

        <div className="flex gap-2 flex-wrap">
          {TUTORIAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                categoryFilter === cat
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                  : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* TUTORIALS GRID */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 text-sm font-medium">
          Loading videos from database...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs text-center">
          <div className="text-4xl mb-3">📹</div>
          <p className="text-sm font-bold text-slate-700">No videos uploaded yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Click "Upload & Save New Video" above to upload your platform walkthrough videos to the database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tut) => (
            <div
              key={tut.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Pills */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {tut.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {tut.isFeatured && (
                      <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        ★ Featured
                      </span>
                    )}
                    <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                      Audience: {tut.targetAudience}
                    </span>
                  </div>
                </div>

                {/* Video Banner / Preview trigger */}
                <div
                  onClick={() => setPreviewTut(tut)}
                  className="relative aspect-video rounded-xl bg-slate-900 border border-slate-200 overflow-hidden mb-4 cursor-pointer group flex items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-600/90 text-white flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform shadow-lg z-10 pl-0.5">
                    ▶
                  </div>
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded-md z-10 font-bold">
                    {tut.duration || "Video"}
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 leading-snug mb-2">
                  {tut.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {tut.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewTut(tut)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer"
                >
                  ▶ Watch Video
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleFeatured(tut.id)}
                    title={tut.isFeatured ? "Unfeature tutorial" : "Feature tutorial"}
                    className={`text-xs p-1.5 rounded-lg border transition cursor-pointer ${
                      tut.isFeatured
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ★
                  </button>
                  <button
                    onClick={() => handleOpenEdit(tut)}
                    className="text-xs font-semibold text-slate-700 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tut.id)}
                    className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT TUTORIAL MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sora">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-slate-900 font-bold text-lg">
                {editingTut ? "Edit Video Tutorial" : "Upload Video Tutorial"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl font-medium">
                  ⚠️ {formError}
                </div>
              )}
              {uploadNotice && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl font-medium">
                  ✓ {uploadNotice}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Tutorial Title *
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How to Upload Your Government ID"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition font-medium"
                  >
                    {TUTORIAL_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Target Audience *
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition font-medium"
                  >
                    <option value="All">All Users</option>
                    <option value="Trainees">Trainees</option>
                    <option value="Coordinators">Coordinators</option>
                    <option value="Trainers">Trainers</option>
                  </select>
                </div>
              </div>

              {/* Video Source */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Video Source (Upload File or Paste Link)
                </label>

                {/* Direct Upload Button */}
                <div className="flex items-center gap-3">
                  <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition shadow-2xs inline-flex items-center gap-1.5">
                    📁 Select & Upload Video File (.mp4 / .webm)
                    <input
                      type="file"
                      accept="video/*"
                      onChange={uploadVideoFile}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  {uploading && (
                    <span className="text-xs text-emerald-700 font-bold animate-pulse">
                      Saving video... {uploadProgress}%
                    </span>
                  )}
                </div>

                {uploading && (
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                <div className="relative">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">
                    Or Enter Direct Video / YouTube / Vimeo / Loom / Google Drive URL
                  </span>
                  <input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or /uploads/tutorials/video.mp4"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Video Duration
                </label>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 4 min"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Provide a short overview of what users will learn in this video guide..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition resize-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Step-by-step Notes (One per line)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Step 1: Go to Dashboard&#10;Step 2: Click Upload ID&#10;Step 3: Submit document"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition resize-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="featCheck" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                  Mark as Featured Video Guide on learner dashboard
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {editingTut ? "Save Changes" : "Save Video Tutorial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIDEO PREVIEW MODAL */}
      {previewTut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md px-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col font-sora">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {previewTut.category}
                </span>
                <h3 className="text-slate-900 font-bold text-base mt-1">{previewTut.title}</h3>
              </div>
              <button
                onClick={() => setPreviewTut(null)}
                className="text-slate-400 hover:text-slate-700 text-xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-950 aspect-video flex items-center justify-center">
              <UniversalVideoPlayer url={previewTut.videoUrl} title={previewTut.title} />
            </div>

            {previewTut.notes && previewTut.notes.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[10px]">
                  Walkthrough Step-by-Step Notes:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 font-medium">
                  {previewTut.notes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
