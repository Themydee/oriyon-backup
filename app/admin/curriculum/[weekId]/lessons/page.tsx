"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useNavigationHistory } from "@/components/NavigationHistoryProvider";

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: "video" | "document";
  videoUrl?: string;
  audioUrl?: string;
  body?: string;
  durationMinutes: number;
  order: number;
  isPublished: boolean;
}

interface Week {
  id: string;
  weekNumber: number;
  title: string;
  description?: string;
  cohortId: string;
  lessons?: Lesson[];
  objectives?: string[];
}

interface LessonDraft {
  title: string;
  description: string;
  type: "video" | "document";
  videoUrl: string;
  audioUrl: string;
  body: string;
  durationMinutes: number;
  order: number;
  isPublished: boolean;
}

const blankDraft = (count = 0): LessonDraft => ({
  title: "",
  description: "",
  type: "document",
  videoUrl: "",
  audioUrl: "",
  body: "",
  durationMinutes: 10,
  order: count + 1,
  isPublished: false,
});

export default function AdminLessonPage() {
  const token = useAuthStore((s) => s.accessToken);
  const userRole = token ? (() => {
    try {
      return JSON.parse(atob(token.split(".")[1])).role;
    } catch {
      return null;
    }
  })() : null;
  const isTrainer = userRole === "trainer";

  const { weekId } = useParams();
  const { goBack } = useNavigationHistory();
  const [week, setWeek] = useState<Week | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<LessonDraft>(blankDraft());
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isEditingWeek, setIsEditingWeek] = useState(false);
  const [weekForm, setWeekForm] = useState({
    title: "",
    description: "",
    objectivesText: "",
  });
  const [savingWeek, setSavingWeek] = useState(false);

  useEffect(() => {
    if (!weekId) return;
    loadWeek();
  }, [weekId]);

  const loadWeek = async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const res = await authFetch(`/lms/weeks/${weekId}?showAll=true`);
      if (!res.ok) {
        setError("Failed to load week.");
        return;
      }
      const data = await res.json();
      setWeek(data);
      const loadedLessons: Lesson[] = Array.isArray(data.lessons) ? data.lessons : [];
      setLessons(loadedLessons.sort((a, b) => a.order - b.order));
    } catch {
      setError("Failed to load week.");
    } finally {
      setLoading(false);
    }
  };

  const openEditWeek = () => {
    if (!week) return;
    setWeekForm({
      title: week.title,
      description: week.description || "",
      objectivesText: (week.objectives || []).join("\n"),
    });
    setIsEditingWeek(true);
    setError("");
    setNotice("");
  };

  const saveWeekInfo = async () => {
    if (!week) return;
    if (!weekForm.title.trim()) {
      setError("Week title is required.");
      return;
    }
    setSavingWeek(true);
    setError("");
    setNotice("");
    try {
      const objectives = weekForm.objectivesText
        .split("\n")
        .map((o) => o.trim())
        .filter(Boolean);

      const res = await authFetch(`/lms/weeks/${week.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: weekForm.title.trim(),
          description: weekForm.description.trim() || null,
          objectives,
        }),
      });

      if (!res.ok) {
        setError("Failed to update week information.");
        return;
      }

      setNotice("Week updated successfully.");
      setIsEditingWeek(false);
      await loadWeek();
    } catch {
      setError("Failed to update week information.");
    } finally {
      setSavingWeek(false);
    }
  };

  const openNewLesson = () => {
    setActiveLessonId(null);
    setEditing(true);
    setError("");
    setNotice("");
    setDraft(blankDraft(lessons.length));
  };

  const openEditLesson = (lesson: Lesson) => {
    setActiveLessonId(lesson.id);
    setEditing(true);
    setError("");
    setNotice("");
    setDraft({
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      videoUrl: lesson.videoUrl || "",
      audioUrl: lesson.audioUrl || "",
      body: lesson.body || "",
      durationMinutes: lesson.durationMinutes || 10,
      order: lesson.order,
      isPublished: lesson.isPublished,
    });
  };

  const uploadAudioToCloudinary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
      setError("Please select a valid audio file (MP3, WAV, M4A, etc.).");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");
    setNotice("");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpbba8033";
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setDraft((prev) => ({ ...prev, audioUrl: response.secure_url }));
          setNotice("Audio uploaded successfully!");
          setUploading(false);
        } else {
          try {
            const errResponse = JSON.parse(xhr.responseText);
            setError(`Audio upload failed: ${errResponse.error?.message || xhr.statusText}`);
          } catch {
            setError(`Audio upload failed: ${xhr.statusText}`);
          }
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        setError("Network error occurred during audio upload.");
        setUploading(false);
      };

      xhr.send(formData);
    } catch (err: any) {
      setError(err.message || "Failed to upload audio.");
      setUploading(false);
    }
  };

  const uploadToCloudinary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");
    setNotice("");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpbba8033";
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setDraft((prev) => ({ ...prev, videoUrl: response.secure_url }));
          setNotice("Video uploaded successfully to Cloudinary!");
          setUploading(false);
        } else {
          try {
            const errResponse = JSON.parse(xhr.responseText);
            setError(`Upload failed: ${errResponse.error?.message || xhr.statusText}`);
          } catch {
            setError(`Upload failed: ${xhr.statusText}`);
          }
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        setError("Network error occurred during video upload.");
        setUploading(false);
      };

      xhr.send(formData);
    } catch (err: any) {
      setError(err.message || "Failed to upload video.");
      setUploading(false);
    }
  };

  const resetForm = () => {
    setEditing(false);
    setActiveLessonId(null);
    setDraft(blankDraft(lessons.length));
    setError("");
    setNotice("");
  };

  const saveLesson = async () => {
    setError("");
    setNotice("");

    if (!draft.title.trim()) {
      setError("Lesson title is required.");
      return;
    }

    if (!week) {
      setError("Cannot save lesson without week context.");
      return;
    }

    setSaving(true);
    try {
      let cleanAudioUrl = draft.audioUrl.trim();
      if (cleanAudioUrl.startsWith("s3://")) {
        const parts = cleanAudioUrl.substring(5).split("/");
        const bucket = parts[0];
        const key = parts.slice(1).join("/");
        cleanAudioUrl = `https://${bucket}.s3.amazonaws.com/${key}`;
      }
      if (cleanAudioUrl) {
        cleanAudioUrl = cleanAudioUrl.replace(/ /g, "%20");
      }

      let cleanVideoUrl = draft.videoUrl.trim();
      if (cleanVideoUrl) {
        cleanVideoUrl = cleanVideoUrl.replace(/ /g, "%20");
      }

      const payload = {
        weekId: week.id,
        title: draft.title.trim(),
        description: draft.description.trim(),
        type: draft.type,
        videoUrl: cleanVideoUrl || undefined,
        audioUrl: cleanAudioUrl || undefined,
        body: draft.body.trim() || undefined,
        durationMinutes: draft.durationMinutes,
        order: draft.order,
        isPublished: draft.isPublished,
      };

      const res = activeLessonId
        ? await authFetch(`/lms/lessons/${activeLessonId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await authFetch("/lms/lessons", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        let errMsg = "Failed to save lesson.";
        try {
          const errData = await res.json();
          if (errData.error) {
            errMsg = typeof errData.error === "string" ? errData.error : JSON.stringify(errData.error);
          }
        } catch (e) {}
        setError(errMsg);
        return;
      }

      setNotice(activeLessonId ? "Lesson updated successfully!" : "Lesson created successfully!");
      resetForm();
      await loadWeek();
    } catch {
      setError("Network or server error while saving lesson.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (lesson: Lesson) => {
    setError("");
    setNotice("");

    try {
      const res = await authFetch(`/lms/lessons/${lesson.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: !lesson.isPublished }),
      });
      if (!res.ok) {
        setError("Failed to update lesson status.");
        return;
      }
      await loadWeek();
    } catch {
      setError("Failed to update lesson status.");
    }
  };

  const inp =
    "w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition";

  return (
    <div>
      <div className="mb-8">
        <button onClick={() => goBack("/admin/curriculum")} className="text-xs text-slate-500 hover:text-slate-300 transition mb-2 inline-block cursor-pointer">
          ← Back to Curriculum
        </button>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">Week {week?.weekNumber ?? "?"} — Lessons</h1>
        <p className="text-slate-500 text-sm">Manage lessons for this training week</p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-700/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {notice && (
        <div className="bg-emerald-950/40 border border-emerald-700/30 text-emerald-300 text-sm px-4 py-3 rounded-xl mb-6">
          {notice}
        </div>
      )}

      <div className="bg-[#020617] border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-700/30">
              Week {week?.weekNumber ?? "?"} Info
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white mt-3 truncate">{week ? `${week.title}` : "Loading week..."}</h2>
            {week?.description && <p className="text-slate-400 text-sm mt-2 leading-relaxed">{week.description}</p>}
            
            {week?.objectives && week.objectives.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800/60">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">🎯 Weekly Objectives</p>
                <ul className="space-y-1.5">
                  {week.objectives.map((obj, index) => (
                    <li key={index} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
            {!isTrainer && (
              <button
                onClick={openEditWeek}
                className="px-4 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition"
              >
                ⚙ Edit Week Info
              </button>
            )}
            <button
              onClick={openNewLesson}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl transition"
            >
              + New Lesson
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading...</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-4">
            {lessons.length === 0 ? (
              <div className="bg-[#020617] border border-slate-800 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">📘</div>
                <p className="text-sm font-semibold">No lessons yet</p>
                <p className="text-xs mt-1 text-slate-500">Add the first lesson for this week.</p>
              </div>
            ) : (
              lessons.map((lesson) => (
                <div key={lesson.id} className="bg-[#020617] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Lesson {lesson.order}</span>
                        <span className={`text-[10px] font-bold rounded-full px-2 py-1 uppercase tracking-[0.2em] ${
                          lesson.isPublished
                            ? "bg-green-500/10 text-green-300 border border-green-600/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          {lesson.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white truncate">{lesson.title}</h3>
                      <p className="text-slate-500 text-sm mt-2 line-clamp-2">{lesson.description || "No description added."}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {!isTrainer && (
                        <>
                          <button
                            onClick={() => openEditLesson(lesson)}
                            className="text-xs border border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => togglePublish(lesson)}
                            className={`text-xs px-3 py-2 rounded-xl transition ${
                              lesson.isPublished
                                ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
                                : "border border-green-700 text-green-300 hover:bg-green-500/10"
                            }`}
                          >
                            {lesson.isPublished ? "Unpublish" : "Publish"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                    <span>{lesson.type === "video" ? "Video lesson" : "Document lesson"}</span>
                    <span>•</span>
                    <span>{lesson.durationMinutes} min</span>
                  </div>
                </div>
              ))
            )}
          </section>

          <aside className={`
            ${editing 
              ? "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm md:relative md:inset-auto md:z-auto md:bg-transparent md:backdrop-blur-none md:p-0 md:block" 
              : "hidden md:block"
            }
          `}>
            <div className="w-full max-w-2xl bg-[#020617] border border-slate-800 rounded-2xl p-5 shadow-2xl relative md:shadow-none md:border-slate-800 overflow-y-auto max-h-[90vh] md:max-h-none">
              {editing && (
                <button 
                  onClick={resetForm} 
                  className="absolute top-4 right-4 text-slate-400 hover:text-white md:hidden text-lg focus:outline-none"
                >
                  ✕
                </button>
              )}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">{editing ? activeLessonId ? "Edit lesson" : "New lesson" : "Lesson editor"}</p>
                  <h2 className="text-xl font-black text-white">{editing ? "Use the form below" : "Select a lesson"}</h2>
                </div>
                {editing && (
                  <button onClick={resetForm} className="text-xs text-slate-400 hover:text-white transition hidden md:inline-block">Cancel</button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">Title</label>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className={inp}
                    placeholder="Lesson title"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">Type</label>
                  <select
                    value={draft.type}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value as LessonDraft["type"] })}
                    className={inp}
                  >
                    <option value="document">Document</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">Duration (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={draft.durationMinutes}
                      onChange={(e) => setDraft({ ...draft, durationMinutes: Number(e.target.value) })}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">Order</label>
                    <input
                      type="number"
                      min={1}
                      value={draft.order}
                      onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })}
                      className={inp}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">Description</label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    rows={2}
                    className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition resize-none"
                    placeholder="Brief summary for the lesson"
                  />
                </div>

                {draft.type === "video" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">Video URL</label>
                      <input
                        value={draft.videoUrl}
                        onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
                        className={inp}
                        placeholder="https://youtube.com/... or https://.../video.mp4"
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-800"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-[#020617] px-2 text-xs text-slate-500 uppercase tracking-widest">Or upload directly</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl hover:border-green-500/50 hover:bg-green-500/5 transition cursor-pointer ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                        <input type="file" accept="video/*" className="hidden" onChange={uploadToCloudinary} disabled={uploading} />
                        <span className="text-2xl mb-2">🎥</span>
                        <span className="text-sm font-semibold text-white">
                          {uploading ? `Uploading... ${uploadProgress}%` : "Click to select video"}
                        </span>
                        {!uploading && <span className="text-xs text-slate-500 mt-1">MP4, WebM (Handled via Cloudinary)</span>}
                      </label>
                      {uploading && (
                        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                          <div className="bg-green-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audio Narration / Lecture Audio (Can accompany text or video) */}
                <div className="bg-[#0a0f1a] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎧</span>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
                      Audio Narration / Lecture Audio (Optional)
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Provide an audio stream or voiceover that trainees can listen to while reading the lesson text.
                  </p>
                  <input
                    value={draft.audioUrl}
                    onChange={(e) => setDraft({ ...draft, audioUrl: e.target.value })}
                    className={inp}
                    placeholder="https://your-bucket.s3.amazonaws.com/audio.mp3"
                  />
                  {draft.audioUrl && (draft.audioUrl.includes("Failed to load resource") || draft.audioUrl.includes("Internal Server Error")) && (
                    <p className="text-xs text-amber-400 font-medium">
                      ⚠️ Warning: This Audio URL looks like error log text rather than a link. Please replace it with a valid <code>https://...</code> audio link or click clear.
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className={`inline-flex items-center gap-2 px-3 py-1.5 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white hover:border-slate-500 transition cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input type="file" accept="audio/*" className="hidden" onChange={uploadAudioToCloudinary} disabled={uploading} />
                      <span>🎙️ Upload Audio File</span>
                    </label>
                    {draft.audioUrl && (
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, audioUrl: "" })}
                        className="text-xs text-red-400 hover:text-red-300 transition"
                      >
                        Remove Audio
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">Body (Text Notes)</label>
                  <textarea
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    rows={5}
                    className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition resize-none"
                    placeholder="Lesson content, learning outcomes, markdown notes, or transcripts"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.isPublished}
                    onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-600 bg-[#020617] text-green-400 focus:ring-green-500"
                  />
                  <span className="text-sm text-slate-400">Publish lesson now</span>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={saveLesson}
                  disabled={saving}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : activeLessonId ? "Save Lesson" : "Create Lesson"}
                </button>
                <button
                  onClick={resetForm}
                  type="button"
                  className="px-5 py-2.5 border border-slate-700 text-slate-400 text-sm rounded-xl hover:border-slate-500 transition"
                >
                  Reset
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {isEditingWeek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#020617] border border-green-700/30 rounded-2xl p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setIsEditingWeek(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg focus:outline-none"
            >
              ✕
            </button>
            <h3 className="text-sm font-black text-white mb-4">Edit Week {week?.weekNumber} Info</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
                  Title *
                </label>
                <input
                  value={weekForm.title}
                  onChange={(e) => setWeekForm({ ...weekForm, title: e.target.value })}
                  placeholder="e.g. Introduction to Goat Husbandry"
                  className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition"
                />
              </div>
              
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
                  Description
                </label>
                <textarea
                  value={weekForm.description}
                  onChange={(e) => setWeekForm({ ...weekForm, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of the week..."
                  className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
                  Weekly Objectives (One per line)
                </label>
                <textarea
                  value={weekForm.objectivesText}
                  onChange={(e) => setWeekForm({ ...weekForm, objectivesText: e.target.value })}
                  rows={5}
                  placeholder="Understand basic nutrition&#10;Set up feeding stations&#10;Implement daily health checks"
                  className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition resize-y"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveWeekInfo}
                disabled={savingWeek || !weekForm.title.trim()}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
              >
                {savingWeek ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setIsEditingWeek(false)}
                className="px-5 py-2.5 border border-slate-700 text-slate-400 text-sm rounded-xl hover:border-slate-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
