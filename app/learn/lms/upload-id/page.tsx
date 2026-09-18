"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authFetch, refreshAccessToken } from "@/lib/api";

const ID_TYPES = [
  "National ID (NIN)",
  "Voters Card",
  "Drivers Licence",
  "International Passport",
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".heic", ".heif"];

export default function UploadIdPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [idType, setIdType] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      let token =
        useAuthStore.getState().accessToken ||
        (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

      if (!token && typeof window !== "undefined" && localStorage.getItem("refreshToken")) {
        try {
          token = await refreshAccessToken();
        } catch {
          router.replace("/learn/lms");
          return;
        }
      }

      if (!token) {
        router.replace("/learn/lms");
        return;
      }

      useAuthStore.getState().setAccessToken(token);

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const uid = payload.userId || payload.sub || payload.id;
        if (!uid) {
          router.replace("/learn/lms");
        } else {
          setUserId(uid);
        }
      } catch {
        router.replace("/learn/lms");
      }
    };

    init();
  }, [router]);

  const isAllowedFile = (selected: File): boolean => {
    if (selected.type && (selected.type.startsWith("image/") || selected.type === "application/pdf")) {
      return true;
    }
    const ext = selected.name.substring(selected.name.lastIndexOf(".")).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!isAllowedFile(selected)) {
        setError("Invalid file type. Only JPEG, PNG, WEBP, HEIC images, and PDF are allowed.");
        setFile(null);
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        setFile(null);
        return;
      }
      setError("");
      setFile(selected);
    }
  };

  const compressFileIfNeeded = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);
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
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
      };
      img.src = url;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !idType || !file) return;

    setLoading(true);
    setError("");

    try {
      const base64Str = await compressFileIfNeeded(file);
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const updatePayload = {
        idType,
        idDocument: base64Str,
        idDocumentUrl: base64Str,
        idFilename: file.name,
        idMimeType: isPdf ? "application/pdf" : "image/jpeg",
      };

      // Try PATCH /users/${userId}/id-document first
      let res = await authFetch(`/users/${userId}/id-document`, {
        method: "PATCH",
        body: JSON.stringify(updatePayload),
      });

      // Fallback to PATCH /users/${userId} if /id-document failed
      if (!res.ok) {
        res = await authFetch(`/users/${userId}`, {
          method: "PATCH",
          body: JSON.stringify(updatePayload),
        });
      }

      if (!res.ok) {
        let errorMsg = "Failed to upload ID";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/learn/lms/profile?mandatory=true");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An error occurred during upload. Please try again with a smaller file.");
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4faf7]">
        <div className="w-8 h-8 border-2 border-[#00D1C1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sora">
      {/* Subtle repeating greenSubtract background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: "url('/learn/training/greenSubtract.png')", 
          backgroundSize: '120px', 
          backgroundRepeat: 'repeat' 
        }} 
      />

      <div className="w-full max-w-md bg-white border border-[#e2e8f0] rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold px-3.5 py-2 rounded-xl mb-6 flex items-center justify-between">
          <span>⚠️ MANDATORY STEP 1 OF 2</span>
          <span className="text-[10px] uppercase font-bold text-amber-700">Identity Verification</span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 text-xs font-black">
            ID
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Upload Government ID</h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Verify your identity to unlock portal access</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-3xl mx-auto mb-4 font-bold">
              ✓
            </div>
            <h2 className="text-lg font-bold text-emerald-700">ID Uploaded Successfully!</h2>
            <p className="text-slate-500 text-xs mt-2 font-medium">Proceeding to Step 2: Passport Photo & Profile Setup...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">ID Document Type</label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition font-medium"
                required
              >
                <option value="" disabled>Select ID Type</option>
                {ID_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Upload Document File</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-50/30 transition cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.heic,.heif"
                  required
                />
                <span className="text-2xl mb-2">📄</span>
                <span className="text-sm font-bold text-slate-700">
                  {file ? file.name : "Click to select file"}
                </span>
                {!file && (
                  <span className="text-xs text-slate-500 mt-1 font-medium">
                    JPEG, PNG, WEBP, PDF (max 10MB)
                  </span>
                )}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !idType || !file}
              className="w-full py-3.5 mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black rounded-xl transition shadow-xs cursor-pointer"
            >
              {loading ? "Uploading..." : "Submit Government ID (Step 1)"}
            </button>

            <button
              type="button"
              onClick={() => {
                useAuthStore.getState().logout();
                router.replace("/learn/lms");
              }}
              disabled={loading}
              className="w-full py-3 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition cursor-pointer mt-2"
            >
              🚪 Sign Out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
