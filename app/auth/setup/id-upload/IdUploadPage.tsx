"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authFetch, refreshAccessToken } from "@/lib/api";

const ID_TYPES = [
  "National ID (NIN)",
  "Voters Card",
  "Drivers Licence",
  "International Passport",
] as const;

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".heic", ".heif"];
const MAX_SIZE_MB = 10;

export default function IdUploadPage() {
  const router = useRouter();
  const tokenFromStore = useAuthStore((state) => state.accessToken);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  const [idType, setIdType]         = useState<string>("");
  const [file, setFile]             = useState<File | null>(null);
  const [preview, setPreview]       = useState<string | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [skipping, setSkipping]     = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const resolveUser = async () => {
      let token = tokenFromStore || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
      if (!token && typeof window !== "undefined" && localStorage.getItem("refreshToken")) {
        try {
          token = await refreshAccessToken();
        } catch {}
      }
      let uid = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
      if (!uid && token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          uid = payload.userId || payload.sub || payload.id || null;
          if (uid && typeof window !== "undefined") {
            localStorage.setItem("userId", uid);
          }
        } catch {}
      }
      setResolvedUserId(uid);
    };
    resolveUser();
  }, [tokenFromStore]);

  // ── Helper: validate file extension / mime type ──
  const isAllowedFile = (f: File): boolean => {
    if (f.type && (f.type.startsWith("image/") || f.type === "application/pdf")) {
      return true;
    }
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  };

  // ── Client-side canvas compression for images ──
  const compressImageIfNeeded = (f: File): Promise<string> =>
    new Promise((resolve) => {
      const isImage = f.type.startsWith("image/") || !f.type || !f.name.toLowerCase().endsWith(".pdf");
      if (!isImage && f.type === "application/pdf") {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = () => resolve(reader.result as string);
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(f);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } else {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          reader.onload = () => resolve(reader.result as string);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = () => resolve(reader.result as string);
      };
      img.src = url;
    });

  // ── File validation & preview ──────────────────
  const handleFile = (f: File) => {
    setError("");
    if (!isAllowedFile(f)) {
      setError("Only JPEG, PNG, WebP, HEIC images or PDF files are accepted.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(f);

    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    if (f.type.startsWith("image/") || ext !== ".pdf") {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  // ── Submit ─────────────────────────────────────
  const handleSubmit = async () => {
    setError("");

    if (!idType) { setError("Please select your ID type."); return; }
    if (!file)   { setError("Please upload your ID document."); return; }

    let userId = resolvedUserId || (typeof window !== "undefined" ? localStorage.getItem("userId") : null);

    if (!userId) {
      const token = useAuthStore.getState().accessToken || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          userId = payload.userId || payload.sub || payload.id || null;
        } catch {}
      }
    }

    if (!userId) {
      setError("Session expired or missing. Please sign in to upload your ID document.");
      setTimeout(() => router.push("/learn/lms"), 2000);
      return;
    }

    setLoading(true);
    try {
      const base64Str = await compressImageIfNeeded(file);
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const normalizedMime = isPdf ? "application/pdf" : "image/jpeg";

      const updatePayload = {
        idType,
        idDocument: base64Str,
        idDocumentUrl: base64Str,
        idFilename: file.name,
        idMimeType: normalizedMime,
      };

      let res = await authFetch(`/users/${userId}/id-document`, {
        method: "PATCH",
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        res = await authFetch(`/users/${userId}`, {
          method: "PATCH",
          body: JSON.stringify(updatePayload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Upload failed. Please check your file and try again.");
        setLoading(false);
        return;
      }

      // Success — redirect to dashboard
      setTimeout(() => router.push("/learn/lms/dashboard"), 500);
    } catch (err) {
      console.error("[ID Upload Error]:", err);
      setError("Upload error. Please check your connection and try again with a clear photo.");
      setLoading(false);
    }
  };

  // ── Skip (they can upload later from profile) ──
  const handleSkip = () => {
    setSkipping(true);
    router.push("/learn/lms/dashboard");
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#0f172a] text-white font-sans">

      {/* Left panel */}
      <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden">
        <img
          src="/eewyla/eewyla.png"
          alt="Livestock training"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10">
          <img src="/footer-logo.png" alt="Oriyon International" className="h-10" />
          <div className="mt-12">
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Almost there.
            </h1>
            <p className="text-gray-200 max-w-md text-sm leading-relaxed">
              We need a copy of a valid government-issued ID to verify your identity
              and keep the EEWYLA programme secure.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            {["National ID (NIN)", "Voters Card", "Drivers Licence", "International Passport"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-green-400">✓</span> {t}
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-gray-300 text-sm">
          Oyo State Programme • Cohort A <br />
          © Oriyon International
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            <StepDot step={1} label="Set Password" done />
            <div className="h-px w-8 bg-green-700" />
            <StepDot step={2} label="Upload ID" active />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Upload Your ID</h2>
            <p className="text-gray-400 text-sm">
              Upload a clear photo or scan of a valid government-issued ID
            </p>
          </div>

          <div className="bg-[#111827] border border-gray-700 rounded-xl p-8 shadow-xl space-y-6">

            {/* ID Type selector */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">
                ID Type
              </label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full bg-[#020617] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500 appearance-none"
              >
                <option value="">Select ID type...</option>
                {ID_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Drop zone */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">
                ID Document
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`relative border-2 border-dashed rounded-xl cursor-pointer transition min-h-[160px] flex flex-col items-center justify-center gap-3 p-6 ${
                  dragging
                    ? "border-green-400 bg-green-500/10"
                    : file
                      ? "border-green-600/50 bg-green-500/5"
                      : "border-slate-700 hover:border-slate-500"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.heic,.heif"
                  className="hidden"
                  onChange={onInputChange}
                />

                {/* Preview or placeholder */}
                {preview ? (
                  <img
                    src={preview}
                    alt="ID preview"
                    className="max-h-40 max-w-full rounded-lg object-contain"
                  />
                ) : file ? (
                  // PDF icon
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center text-2xl">
                      📄
                    </div>
                    <p className="text-sm text-white font-medium">{file.name}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="text-3xl">📎</div>
                    <p className="text-sm text-slate-400">
                      <span className="text-green-400 font-semibold">Click to upload</span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-slate-600">
                      JPEG, JPG, PNG, WebP or PDF · Max {MAX_SIZE_MB} MB
                    </p>
                  </div>
                )}
              </div>

              {/* File info + change button */}
              {file && (
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-slate-500 truncate max-w-[70%]">
                    {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-900/40 border border-red-500 text-red-300 text-sm px-4 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Privacy note */}
            <p className="text-xs text-slate-600 text-center">
              🔒 Your ID is stored securely and only accessible to Oriyon admins for verification purposes.
            </p>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 transition rounded-lg py-3 text-black font-semibold disabled:opacity-60"
              >
                {loading ? "Uploading..." : "Submit & Enter Portal →"}
              </button>
              <button
                onClick={handleSkip}
                disabled={skipping}
                className="w-full text-slate-500 hover:text-slate-300 transition text-sm py-2"
              >
                {skipping ? "Redirecting..." : "Skip for now — I'll upload later"}
              </button>
            </div>
          </div>

           <p className="text-center text-gray-500 text-sm mt-6">
              Need help?{" "}
              <a href="mailto:eewyla@oriyoninternational.com" className="text-green-400">
                eewyla@oriyoninternational.com
              </a>
            </p>
        </div>
      </div>
    </div>
  );
}

function StepDot({
  step,
  label,
  active,
  done,
}: {
  step: number;
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
          done
            ? "bg-green-600 border-green-600 text-white"
            : active
              ? "bg-green-500 border-green-500 text-black"
              : "border-slate-600 text-slate-500"
        }`}
      >
        {done ? "✓" : step}
      </div>
      <span className={`text-[10px] uppercase tracking-wide ${done || active ? "text-green-400" : "text-slate-600"}`}>
        {label}
      </span>
    </div>
  );
}