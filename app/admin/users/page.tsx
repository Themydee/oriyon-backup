"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authFetch } from "@/lib/api";
import { popup } from "@/components/layout/PopupProvider";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isBlacklisted?: boolean;
  blacklistReason?: string | null;
  cohortId: string | null;
  idType: string | null;
  idDocument?: string | null;
  idDocumentUrl?: string | null;
  idFilename: string | null;
  idMimeType: string | null;
  idUploadedAt: string | null;
  kycStatus: string | null;
  kycRejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  isCooperativeOnly?: boolean;
  assignedLga?: string | null;
  assignedState?: string | null;
  assignedZone?: string | null;
  passportPicture?: string | null;
  passportUrl?: string | null;
  avatarUrl?: string | null;
  photo?: string | null;
  specialization?: string | null;
}

export const isUserBlacklisted = (u: any): boolean => {
  if (!u) return false;
  if (u.blacklistReason && String(u.blacklistReason).trim() !== "") return true;
  if (u.isBlacklisted === true) return true;
  if (u.status === "blacklisted") return true;
  return false;
};

// ─────────────────────────────────────────────
// PASSPORT PHOTO SECTION FOR PHYSICAL ID CARD PRINTING
// ─────────────────────────────────────────────
function PassportPhotoSection({ user }: { user: User }) {
  const photoUrl = user.passportPicture || user.passportUrl || user.avatarUrl || user.photo || null;

  const handleDownloadPhoto = () => {
    if (!photoUrl) return;
    const a = document.createElement("a");
    a.href = photoUrl;
    a.download = `${user.firstName}-${user.lastName}-passport-photo.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/80 space-y-4 font-sora">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-800">
            📷 Passport Photograph for Official ID Card
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Photo used for physical PVC membership card printing
          </p>
        </div>
        {photoUrl && (
          <button
            onClick={handleDownloadPhoto}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>↓</span> Download Photo
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="w-20 h-24 rounded-2xl bg-white border-2 border-emerald-500/60 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative">
          {photoUrl ? (
            <img src={photoUrl} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-1">
              <span className="text-xl">📷</span>
              <p className="text-[8px] text-slate-400 font-bold mt-1">No Photo</p>
            </div>
          )}
        </div>

        <div className="text-xs space-y-1.5">
          <p className="font-bold text-slate-900">{user.firstName} {user.lastName}</p>
          <p className="text-slate-500 font-medium">
            Status: {photoUrl ? <span className="text-emerald-700 font-bold">✓ Passport Photo Uploaded</span> : <span className="text-amber-700 font-bold">⚠️ Photo Missing</span>}
          </p>
          {photoUrl && (
            <p className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
              Ready for PVC ID Card Batch Printing
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ID DOCUMENT SECTION
// ─────────────────────────────────────────────
function IdDocumentSection({ user, onStatusUpdate }: { user: User; onStatusUpdate: (updated: User) => void }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError]             = useState("");
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [verifying, setVerifying]     = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    if (user.idType) {
      loadPreview();
    } else {
      setPreviewUrl(null);
    }
    setShowRejectInput(false);
    setRejectionReason("");
    setError("");
  }, [user.id, user.idUploadedAt]);

  const loadPreview = async () => {
    setLoadingPreview(true);
    setError("");
    try {
      const res = await authFetch(`/users/${user.id}/id-document`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } else {
        setError("Could not load document preview");
      }
    } catch {
      setError("Error loading document preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    setDownloading(true);
    try {
      const a    = document.createElement("a");
      a.href     = previewUrl;
      a.download = user.idFilename ?? `${user.firstName}-${user.lastName}-id`;
      a.click();
    } catch {
      setError("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleVerify = async (status: "approved" | "rejected") => {
    if (status === "rejected" && !rejectionReason.trim()) {
      setError("Please specify a reason for rejecting this document.");
      return;
    }

    setVerifying(true);
    setError("");
    try {
      const res = await authFetch(`/users/${user.id}/kyc-verify`, {
        method: "POST",
        body: JSON.stringify({
          status,
          rejectionReason: status === "rejected" ? rejectionReason : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to ${status} KYC`);
        return;
      }
      onStatusUpdate({
        ...user,
        kycStatus: data.kycStatus,
        kycRejectionReason: data.kycRejectionReason,
      });
      setShowRejectInput(false);
    } catch {
      setError(`Failed to perform KYC ${status} operation`);
    } finally {
      setVerifying(false);
    }
  };

  const hasDoc = !!user.idType;
  const status = user.kycStatus || (hasDoc ? "pending" : "none");

  return (
    <div className="font-sora">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
        ID Document & KYC Status
      </p>

      {!hasDoc ? (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-800 font-medium">No ID uploaded yet</p>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
          
          {/* Status Display */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                status === "approved" ? "bg-emerald-500" :
                status === "rejected" ? "bg-red-500" : "bg-amber-500"
              }`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${
                status === "approved" ? "text-emerald-700" :
                status === "rejected" ? "text-red-700" : "text-amber-700"
              }`}>
                {status === "approved" ? "KYC Approved" :
                 status === "rejected" ? "KYC Rejected" : "Pending Review"}
              </span>
            </div>
            
            {user.idUploadedAt && (
              <span className="text-[10px] text-slate-500 font-medium">
                Uploaded: {new Date(user.idUploadedAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </span>
            )}
          </div>

          {/* Document metadata info */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">ID Type</p>
              <p className="text-slate-900 font-semibold">{user.idType}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">File Name</p>
              <p className="text-slate-900 font-semibold truncate" title={user.idFilename || ""}>{user.idFilename}</p>
            </div>
            {user.idMimeType && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Format</p>
                <p className="text-slate-900 font-semibold">{user.idMimeType.split("/")[1]?.toUpperCase() || user.idMimeType}</p>
              </div>
            )}
          </div>

          {/* Rejection reason banner */}
          {status === "rejected" && user.kycRejectionReason && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
              <span className="font-bold uppercase text-[9px] tracking-wider block mb-1">Reason for Rejection:</span>
              {user.kycRejectionReason}
            </div>
          )}

          {/* Inline Preview Container */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2 border-b border-slate-800 bg-slate-900/80">
              Document Preview
            </p>
            <div className="flex items-center justify-center p-3 min-h-[220px]">
              {loadingPreview ? (
                <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading preview...</span>
                </div>
              ) : previewUrl ? (
                user.idMimeType === "application/pdf" ? (
                  <iframe
                    src={`${previewUrl}#toolbar=0`}
                    className="w-full h-[280px] border-none rounded-lg"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="ID Document"
                    className="max-w-full max-h-[280px] object-contain rounded-lg shadow-md"
                  />
                )
              ) : (
                <div className="text-center text-slate-400 text-xs py-10">
                  <p className="text-lg mb-1">⚠️</p>
                  <p>Preview unavailable</p>
                  <button onClick={loadPreview} className="text-emerald-400 hover:text-emerald-300 font-bold mt-2 underline">
                    Retry Loading
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error text */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Verification & Action Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={downloading || !previewUrl}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-slate-200 text-slate-700 hover:bg-slate-100 transition py-2.5 rounded-xl disabled:opacity-50 font-bold cursor-pointer"
              >
                <span>⬇️</span> Download ID
              </button>

              {status !== "approved" && !showRejectInput && (
                <>
                  <button
                    onClick={() => handleVerify("approved")}
                    disabled={verifying}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>✓</span> Approve ID
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={verifying}
                    className="flex-1 border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>✕</span> Reject ID
                  </button>
                </>
              )}
            </div>

            {/* Rejection input form */}
            {showRejectInput && (
              <div className="space-y-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-[10px] text-red-700 uppercase tracking-widest font-bold">
                  Reject Document Verification
                </p>
                <textarea
                  placeholder="Specify why this document is rejected (e.g. Blurry photo, Details do not match profile)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 min-h-[60px]"
                />
                <div className="flex justify-end gap-2 text-[10px]">
                  <button
                    onClick={() => {
                      setShowRejectInput(false);
                      setRejectionReason("");
                      setError("");
                    }}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-md transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleVerify("rejected")}
                    disabled={verifying}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// BLACKLIST CONFIRMATION MODAL
// ─────────────────────────────────────────────
function BlacklistModal({
  userIds,
  userNames,
  onClose,
  onConfirm,
}: {
  userIds: string[];
  userNames: string[];
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(reason);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4 font-sora">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold text-lg">
            🚫
          </div>
          <div>
            <h3 className="text-slate-900 font-black text-base">
              {userIds.length === 1 ? "Blacklist / Deactivate User" : `Blacklist ${userIds.length} Selected Users`}
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[280px]">
              {userIds.length === 1
                ? userNames[0]
                : `${userNames.slice(0, 2).join(", ")}${userNames.length > 2 ? ` +${userNames.length - 2} others` : ""}`}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
          Blacklisted users will be immediately restricted from logging into the platform. You can provide an optional reason for audit purposes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">
              Reason for Blacklisting (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Fraudulent documentation, Duplicate account, Policy violation..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600 transition min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 text-xs border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🚫</span> {submitting ? "Blacklisting..." : "Confirm Blacklist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// USER MODAL
// ─────────────────────────────────────────────
function UserModal({
  user,
  onClose,
  onUpdate,
  uniqueLgas,
  uniqueStates,
  uniqueZones,
  onResendEmail,
  onCopyLink,
  onOpenBlacklist,
  resendingId,
  copyingId,
}: {
  user: User;
  onClose: () => void;
  onUpdate: (updated: User) => void;
  uniqueLgas: string[];
  uniqueStates: string[];
  uniqueZones: string[];
  onResendEmail?: (email: string, userId: string) => void;
  onCopyLink?: (email: string, userId: string) => void;
  onOpenBlacklist?: (userIds: string[], userNames: string[]) => void;
  resendingId?: string | null;
  copyingId?: string | null;
}) {
  const [toggling, setToggling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit states
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone || "");
  const [role, setRole] = useState(user.role);
  const [isCoord, setIsCoord] = useState(!!(user.assignedLga || user.assignedState || user.assignedZone));
  const [coordScope, setCoordScope] = useState<"lga" | "state" | "zone">(
    user.assignedState ? "state" : user.assignedZone ? "zone" : "lga"
  );
  const [assignedLga, setAssignedLga] = useState(user.assignedLga || "");
  const [assignedState, setAssignedState] = useState(user.assignedState || "");
  const [assignedZone, setAssignedZone] = useState(user.assignedZone || "");
  const [specialization, setSpecialization] = useState(user.specialization || "");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const handleToggleActive = async () => {
    setToggling(true);
    const newActiveState = !user.isActive;
    try {
      const res = await authFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ 
          isActive: newActiveState,
          blacklistReason: newActiveState ? null : user.blacklistReason
        }),
      });
      const data = await res.json();
      if (res.ok) onUpdate({ ...user, ...data });
    } finally {
      setToggling(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEditError("");
    try {
      const payload: any = {
        firstName,
        lastName,
        phone: phone || null,
        role,
        specialization: specialization.trim() || null,
        assignedLga: null,
        assignedState: null,
        assignedZone: null,
      };
      if (isCoord) {
        if (coordScope === "lga") payload.assignedLga = assignedLga || null;
        if (coordScope === "state") payload.assignedState = assignedState || null;
        if (coordScope === "zone") payload.assignedZone = assignedZone || null;
      }
      const res = await authFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update user");
        return;
      }
      onUpdate({ ...user, ...data });
      setIsEditing(false);
    } catch {
      setEditError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4 font-sora">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg flex-shrink-0">
              {(user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h2 className="text-slate-900 font-extrabold text-lg">
                  {user.firstName} {user.lastName}
                </h2>
                <RoleBadge role={user.role} />
                {user.isCooperativeOnly && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border text-amber-800 bg-amber-50 border-amber-200">
                    Coop Member
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                ✏️ Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition flex-shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl font-medium">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">First Name *</label>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Last Name *</label>
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">User Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 transition font-medium"
                >
                  <option value="trainee">Trainee</option>
                  <option value="trainer">Trainer</option>
                  <option value="lead_trainer">Lead Trainer</option>
                  <option value="coordinator">Coordinator Only</option>
                  <option value="corper">NYSC Corper / Field Officer</option>
                  <option value="admin">Admin</option>
                  <option value="sub_admin">Sub Admin (Restricted)</option>
                </select>
              </div>

              {["trainer", "lead_trainer"].includes(role) && (
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    🎓 Area(s) of Specialization / Expertise
                  </label>
                  <input
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Ruminant Nutrition, Poultry Farming & Biosecurity, Veterinary Hygiene"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition font-medium"
                  />
                </div>
              )}

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Cooperative Coordinator Assignment</span>
                  <input
                    type="checkbox"
                    checked={isCoord}
                    onChange={(e) => setIsCoord(e.target.checked)}
                    className="accent-emerald-600 h-4 w-4 border-slate-300 rounded cursor-pointer"
                  />
                </div>

                {isCoord && (
                  <>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Coordinator Scope Level</label>
                      <div className="flex gap-4">
                        {[
                          { key: "lga",   label: "LGA" },
                          { key: "state", label: "State" },
                          { key: "zone",  label: "Zone" },
                        ].map((scope) => (
                          <label key={scope.key} className="flex items-center gap-2 text-xs text-slate-800 font-bold cursor-pointer select-none">
                            <input
                              type="radio"
                              name="coordScopeModal"
                              checked={coordScope === scope.key}
                              onChange={() => setCoordScope(scope.key as any)}
                              className="accent-emerald-600 h-4 w-4 cursor-pointer"
                            />
                            {scope.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {coordScope === "lga" && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned LGA *</label>
                        {uniqueLgas.length === 0 ? (
                          <input
                            required
                            value={assignedLga}
                            onChange={(e) => setAssignedLga(e.target.value)}
                            placeholder="Type LGA name..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition font-medium"
                          />
                        ) : (
                          <select
                            required
                            value={assignedLga}
                            onChange={(e) => setAssignedLga(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 transition font-medium"
                          >
                            <option value="">-- Select LGA --</option>
                            {uniqueLgas.map((lga) => (
                              <option key={lga} value={lga}>{lga}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {coordScope === "state" && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned State *</label>
                        {uniqueStates.length === 0 ? (
                          <input
                            required
                            value={assignedState}
                            onChange={(e) => setAssignedState(e.target.value)}
                            placeholder="Type State name..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition font-medium"
                          />
                        ) : (
                          <select
                            required
                            value={assignedState}
                            onChange={(e) => setAssignedState(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 transition font-medium"
                          >
                            <option value="">-- Select State --</option>
                            {uniqueStates.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {coordScope === "zone" && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Zone *</label>
                        {uniqueZones.length === 0 ? (
                          <input
                            required
                            value={assignedZone}
                            onChange={(e) => setAssignedZone(e.target.value)}
                            placeholder="Type Senatorial Zone..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition font-medium"
                          />
                        ) : (
                          <select
                            required
                            value={assignedZone}
                            onChange={(e) => setAssignedZone(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 transition font-medium"
                          >
                            <option value="">-- Select Senatorial Zone --</option>
                            {uniqueZones.map((zn) => (
                              <option key={zn} value={zn}>{zn}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsEditing(false)}
                  className="text-xs border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition disabled:opacity-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition font-extrabold disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Setup Status badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                  isUserBlacklisted(user)
                    ? "text-red-700 bg-red-50 border-red-200"
                    : user.isActive
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-amber-700 bg-amber-50 border-amber-200"
                }`}>
                  {isUserBlacklisted(user)
                    ? "🚫 Account Blacklisted / Restricted"
                    : user.isActive
                      ? "✓ Account Active / Setup Complete"
                      : "⏳ Account Setup Pending"}
                </span>
                {user.cohortId && (
                  <span className="text-[10px] font-mono text-slate-600 font-medium">
                    Cohort: {user.cohortId.slice(0, 8)}…
                  </span>
                )}
                {(user.assignedLga || user.assignedState || user.assignedZone) && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200">
                    Coordinator Scope: {user.assignedLga || user.assignedState || user.assignedZone}
                  </span>
                )}
              </div>

              {/* Blacklisted Status Banner */}
              {isUserBlacklisted(user) && (
                <div className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-red-800">
                    <span>🚫 Account Blacklisted / Restricted</span>
                  </div>
                  <p className="text-xs text-red-700 font-medium">
                    <span className="font-bold">Reason:</span> {user.blacklistReason || "Restricted by administrator."}
                  </p>
                </div>
              )}

              {/* Pending Setup Banner */}
              {!user.isActive && !isUserBlacklisted(user) && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                    <span>⏳ Account Setup Pending</span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                    This user account has been registered. The user has not completed their password setup yet.
                  </p>
                </div>
              )}

              {/* Contact */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                  Contact Information
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Detail label="Email"  value={user.email} />
                  <Detail label="Phone"  value={user.phone} />
                </div>
              </div>

              {/* Account */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                  Account Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Detail label="Role"  value={user.role} />
                  {["trainer", "lead_trainer"].includes(user.role) && (
                    <Detail label="Specialization" value={user.specialization || "Not specified"} />
                  )}
                  <Detail
                    label="Joined"
                    value={
                      user.createdAt || (user as any).created_at
                        ? new Date(user.createdAt || (user as any).created_at).toLocaleDateString("en-GB", {
                            day: "numeric", month: "long", year: "numeric",
                          })
                        : "Recently"
                    }
                  />
                  <Detail
                    label="Last Updated"
                    value={
                      user.updatedAt || (user as any).updated_at
                        ? new Date(user.updatedAt || (user as any).updated_at).toLocaleDateString("en-GB", {
                            day: "numeric", month: "long", year: "numeric",
                          })
                        : "Recently"
                    }
                  />
                  <Detail label="User ID" value={user.id.slice(0, 16) + "…"} />
                </div>
              </div>

              {/* Passport Photograph for Physical Printing */}
              <PassportPhotoSection user={user} />

              {/* ID Document */}
              <IdDocumentSection user={user} onStatusUpdate={onUpdate} />

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100">
                {isUserBlacklisted(user) ? (
                  <button
                    onClick={handleToggleActive}
                    disabled={toggling || user.role === "admin"}
                    className="w-full text-xs font-extrabold py-2.5 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>✅</span> {toggling ? "Reactivating..." : "Reactivate / Whitelist User"}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    {!user.isActive && (
                      <button
                        onClick={handleToggleActive}
                        disabled={toggling}
                        className="w-full text-xs font-extrabold py-2 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
                      >
                        <span>✅</span> Activate Account Manually
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (onOpenBlacklist) {
                          onOpenBlacklist([user.id], [`${user.firstName} ${user.lastName}`]);
                          onClose();
                        }
                      }}
                      disabled={user.role === "admin"}
                      className="w-full text-xs font-extrabold py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🚫</span> Blacklist / Deactivate User
                    </button>
                  </div>
                )}
                {user.role === "admin" && (
                  <p className="text-center text-[10px] text-slate-500 mt-2 font-medium">
                    Admin accounts cannot be blacklisted or deactivated
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{label}</p>
      <p className="text-xs text-slate-900 font-bold leading-relaxed">{value}</p>
    </div>
  );
}

function RoleBadge({ role }: { role?: string | null }) {
  const colors: Record<string, string> = {
    admin:        "text-purple-700 bg-purple-50 border-purple-200",
    sub_admin:    "text-amber-700 bg-amber-50 border-amber-200",
    trainer:      "text-blue-700 bg-blue-50 border-blue-200",
    lead_trainer: "text-indigo-700 bg-indigo-50 border-indigo-200",
    trainee:      "text-emerald-700 bg-emerald-50 border-emerald-200",
    coordinator:  "text-teal-700 bg-teal-50 border-teal-200",
    corper:       "text-amber-900 bg-amber-100 border-amber-300",
  };
  const safeRole = String(role || "trainee");
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${colors[safeRole] ?? "text-slate-600 bg-slate-100 border-slate-200"}`}>
      {safeRole.replace(/_/g, " ")}
    </span>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
function UsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleFilter = (searchParams.get("role") || "all") as any;
  const setupFilter = (searchParams.get("setupFilter") || "all") as any;
  const idFilter = (searchParams.get("idFilter") || "all") as any;
  const locationFilter = (searchParams.get("locationFilter") || "all") as any;
  const ogbomosoPriority = searchParams.get("ogbomosoPriority") === "true";
  const search = searchParams.get("search") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const updateParams = (updates: Record<string, string | number | boolean>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value === "all" || value === false || (key === "page" && value === 1)) {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });
    router.push(`?${params.toString()}`);
  };

  const setRoleFilter = (val: string) => updateParams({ role: val, page: 1 });
  const setSetupFilter = (val: string) => updateParams({ setupFilter: val, page: 1 });
  const setIdFilter = (val: string) => updateParams({ idFilter: val, page: 1 });
  const setLocationFilter = (val: string) => updateParams({ locationFilter: val, page: 1 });
  const setOgbomosoPriority = (val: boolean) => updateParams({ ogbomosoPriority: val, page: 1 });
  const setCurrentPage = (val: number | ((prev: number) => number)) => {
    const newPage = typeof val === "function" ? val(currentPage) : val;
    updateParams({ page: newPage });
  };

  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const [totalCount, setTotalCount] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [searchInput, setSearchInput] = useState(search);
  const fetchIdRef = useRef(0);

  const [selected, setSelected]                 = useState<User | null>(null);
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);
  const [copyingLinkId, setCopyingLinkId]       = useState<string | null>(null);

  // Batch ID Modal State
  const [showBatchIdModal, setShowBatchIdModal] = useState(false);
  const [batchSubject, setBatchSubject]         = useState("Urgent Action Required: Upload ID Document for PVC Membership Card");
  const [batchBody, setBatchBody]               = useState("");
  const [batchSending, setBatchSending]         = useState(false);
  const [batchError, setBatchError]             = useState("");

  // Trainer Email Modal State
  const [showTrainerEmailModal, setShowTrainerEmailModal] = useState(false);
  const [trainerEmailSubject, setTrainerEmailSubject]     = useState("");
  const [trainerEmailBody, setTrainerEmailBody]           = useState("");
  const [trainerEmailSending, setTrainerEmailSending]     = useState(false);
  const [trainerEmailError, setTrainerEmailError]         = useState("");
  const [trainerEmailSuccess, setTrainerEmailSuccess]     = useState(false);

  // Selection & Bulk Actions State
  const [selectedUserIds, setSelectedUserIds]       = useState<string[]>([]);
  const [blacklistModalData, setBlacklistModalData] = useState<{ userIds: string[]; userNames: string[] } | null>(null);
  const [bulkProcessing, setBulkProcessing]         = useState(false);

  // Add User Modal State
  const [showAddModal, setShowAddModal]           = useState(false);
  const [cooperatives, setCooperatives]           = useState<any[]>([]);
  const [newFirstName, setNewFirstName]           = useState("");
  const [newLastName, setNewLastName]             = useState("");
  const [newEmail, setNewEmail]                   = useState("");
  const [newPhone, setNewPhone]                   = useState("");
  const [newRole, setNewRole]                     = useState<string>("trainee");
  const [newSpecialization, setNewSpecialization] = useState("");
  const [quickSpecUser, setQuickSpecUser]         = useState<User | null>(null);
  const [quickSpecValue, setQuickSpecValue]       = useState("");
  const [quickSpecSaving, setQuickSpecSaving]     = useState(false);
  const [coordScope, setCoordScope]               = useState<"lga" | "state" | "zone">("lga");
  const [newAssignedLga, setNewAssignedLga]       = useState("");
  const [newAssignedState, setNewAssignedState]   = useState("");
  const [newAssignedZone, setNewAssignedZone]     = useState("");
  const [submitting, setSubmitting]               = useState(false);
  const [addError, setAddError]                   = useState("");
  const [successLink, setSuccessLink]             = useState("");
  const [createdEmail, setCreatedEmail]           = useState("");

  // Sync search URL param to searchInput local state when URL changes externally
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounce updating URL params by 350ms while typing search term
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput, page: 1 });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, search]);

  const fetchUsers = async () => {
    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", "20");
      if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);
      if (search) params.set("search", search);

      const res = await authFetch(`/users?${params.toString()}`);
      const data = await res.json();

      if (currentFetchId !== fetchIdRef.current) return;

      if (!res.ok) {
        setError(data.error || "Failed to load users");
        return;
      }

      const list = Array.isArray(data.data) ? data.data : Array.isArray(data.users) ? data.users : Array.isArray(data) ? data : [];
      const t = typeof data.total === "number" ? data.total : data.pagination?.total ?? list.length;
      const tp = typeof data.totalPages === "number" ? data.totalPages : data.pagination?.totalPages ?? Math.ceil(t / 20);

      setUsers(list);
      setTotalCount(t);
      setServerTotalPages(tp);
      if (data.roleCounts && typeof data.roleCounts === "object") {
        setRoleCounts(data.roleCounts);
      }
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendSetupEmail = async (email: string, userId: string) => {
    setResendingEmailId(userId);
    try {
      const res = await authFetch(`/auth/admin/resend-setup`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        popup.alert(`✓ Setup link email sent successfully to ${email}`);
      } else {
        popup.alert(data.error || "Failed to send setup email.");
      }
    } catch {
      popup.alert("Network error. Failed to send setup email.");
    } finally {
      setResendingEmailId(null);
    }
  };

  const handleCopySetupLink = async (email: string, userId: string) => {
    setCopyingLinkId(userId);
    try {
      const res = await authFetch(`/auth/admin/setup-token/${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && data?.token) {
        const link = `${window.location.origin}/auth/setup?token=${data.token}`;
        await navigator.clipboard.writeText(link);
        popup.alert(`✓ Setup link copied to clipboard for ${email}`);
      } else {
        popup.alert(data.error || "Failed to generate setup link.");
      }
    } catch {
      popup.alert("Failed to copy setup link.");
    } finally {
      setCopyingLinkId(null);
    }
  };

  const openTrainerEmailModal = () => {
    setTrainerEmailSubject("[Important Notice] Orientation & Training Guidelines — EEWYLA Platform");
    setTrainerEmailBody(
      "Dear Trainer,\n\nWe appreciate your dedication to the EEWYLA program.\n\nPlease log in to your portal account to review the latest training schedules and guidelines.\n\nBest regards,\nEEWYLA Team"
    );
    setTrainerEmailError("");
    setTrainerEmailSuccess(false);
    setShowTrainerEmailModal(true);
  };

  const handleSendTrainerEmail = async () => {
    if (!trainerEmailSubject.trim() || !trainerEmailBody.trim()) {
      return setTrainerEmailError("Subject and message body are required.");
    }
    setTrainerEmailSending(true);
    setTrainerEmailError("");

    try {
      const res = await authFetch("/users/bulk-email", {
        method: "POST",
        body: JSON.stringify({
          subject: trainerEmailSubject,
          body: trainerEmailBody,
          roles: ["trainer", "lead_trainer"],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTrainerEmailError(data.error || "Failed to send trainer emails.");
        return;
      }
      setTrainerEmailSuccess(true);
      setTimeout(() => {
        setShowTrainerEmailModal(false);
        setTrainerEmailSuccess(false);
      }, 2000);
      popup.alert(`✓ Successfully sent email to ${data.count || 0} trainer(s)!`);
    } catch {
      setTrainerEmailError("Something went wrong while sending emails.");
    } finally {
      setTrainerEmailSending(false);
    }
  };
  const isOgbomosoUser = (u: any): boolean => {
    if (!u) return false;
    const combined = [
      u.address,
      u.assignedLga,
      u.assignedState,
      u.assignedZone,
      u.specialization,
      u.location,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      combined.includes("ogbomoso") ||
      combined.includes("ogbomosho") ||
      combined.includes("lautech")
    );
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("emailTrainers") === "true") {
        setRoleFilter("trainer");
        openTrainerEmailModal();
      }
    }
  }, []);

  useEffect(() => {
    const fetchCoops = async () => {
      try {
        const res = await authFetch("/cooperative");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : Array.isArray(data?.cooperatives) ? data.cooperatives : Array.isArray(data?.data) ? data.data : [];
          setCooperatives(list);
        }
      } catch (err) {
        console.error("Failed to load cooperatives", err);
      }
    };
    fetchCoops();
  }, []);

  const uniqueStates = useMemo(() => {
    const safeCoops = Array.isArray(cooperatives) ? cooperatives : [];
    const set = new Set(safeCoops.map((c) => c.state).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [cooperatives]);

  const uniqueZones = useMemo(() => {
    const safeCoops = Array.isArray(cooperatives) ? cooperatives : [];
    const set = new Set(safeCoops.map((c) => c.zone).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [cooperatives]);

  const uniqueLgas = useMemo(() => {
    const safeCoops = Array.isArray(cooperatives) ? cooperatives : [];
    const set = new Set(safeCoops.map((c) => c.lga).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [cooperatives]);

  const handleUpdate = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setSelected(updated);
  };

  const handleSaveQuickSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSpecUser) return;
    setQuickSpecSaving(true);
    try {
      const res = await authFetch(`/users/${quickSpecUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ specialization: quickSpecValue.trim() || null }),
      });
      const data = await res.json();
      if (res.ok) {
        handleUpdate({ ...quickSpecUser, specialization: data.specialization ?? (quickSpecValue.trim() || null) });
        popup.alert(`✓ Specialization updated for ${quickSpecUser.firstName} ${quickSpecUser.lastName}!`);
        setQuickSpecUser(null);
      } else {
        popup.alert(data.error || "Failed to update specialization.");
      }
    } catch {
      popup.alert("Error updating specialization.");
    } finally {
      setQuickSpecSaving(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAddError("");
    setSuccessLink("");
    setCreatedEmail("");

    try {
      const payload: any = {
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail.trim().toLowerCase(),
        phone: newPhone || null,
        role: newRole,
        specialization: newSpecialization.trim() || null,
      };

      if (newRole === "coordinator") {
        if (coordScope === "lga") {
          payload.assignedLga = newAssignedLga || null;
        } else if (coordScope === "state") {
          payload.assignedState = newAssignedState || null;
        } else if (coordScope === "zone") {
          payload.assignedZone = newAssignedZone || null;
        }
      }

      const res = await authFetch("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || "Failed to create user");
        setSubmitting(false);
        return;
      }

      setUsers((prev) => [...prev, data]);
      setCreatedEmail(payload.email);

      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewPhone("");
      setNewRole("trainee");
      setNewSpecialization("");
      setNewAssignedLga("");
      setNewAssignedState("");
      setNewAssignedZone("");
      setCoordScope("lga");

      await new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        const tokenRes = await authFetch(`/auth/admin/setup-token/${encodeURIComponent(payload.email)}`);
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          if (tokenData?.token) {
            setSuccessLink(`${window.location.origin}/auth/setup?token=${tokenData.token}`);
          }
        }
      } catch (err) {
        console.error("Failed to fetch setup token", err);
      }
    } catch {
      setAddError("Network error. Failed to submit user.");
    } finally {
      setSubmitting(false);
    }
  };

  // Multi-select & Blacklist Handlers
  const toggleSelectUser = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const selectableUserIds = filtered.filter((u: User) => u.role !== "admin").map((u: User) => u.id);
    const allSelected = selectableUserIds.length > 0 && selectableUserIds.every((id: string) => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !selectableUserIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...selectableUserIds])));
    }
  };

  const handleConfirmBlacklist = async (reason: string) => {
    if (!blacklistModalData) return;
    try {
      const res = await authFetch("/users/bulk-status", {
        method: "POST",
        body: JSON.stringify({
          userIds: blacklistModalData.userIds,
          isActive: false,
          blacklistReason: reason || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            blacklistModalData.userIds.includes(u.id)
              ? { ...u, isActive: false, blacklistReason: reason || null }
              : u
          )
        );
        setSelectedUserIds((prev) => prev.filter((id) => !blacklistModalData.userIds.includes(id)));
        popup.alert(`✓ Successfully blacklisted ${data.updatedCount || blacklistModalData.userIds.length} user(s).`);
      } else {
        popup.alert(data.error || "Failed to blacklist user(s).");
      }
    } catch {
      popup.alert("Error occurred while blacklisting user(s).");
    }
  };

  const handleBulkReactivate = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkProcessing(true);
    try {
      const res = await authFetch("/users/bulk-status", {
        method: "POST",
        body: JSON.stringify({
          userIds: selectedUserIds,
          isActive: true,
          blacklistReason: null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            selectedUserIds.includes(u.id) ? { ...u, isActive: true, blacklistReason: null } : u
          )
        );
        setSelectedUserIds([]);
        popup.alert(`✓ Successfully reactivated ${data.updatedCount || selectedUserIds.length} user(s).`);
      } else {
        popup.alert(data.error || "Failed to reactivate selected user(s).");
      }
    } catch {
      popup.alert("Error occurred while reactivating user(s).");
    } finally {
      setBulkProcessing(false);
    }
  };

  const usersArr = Array.isArray(users) ? users : [];

  // ─── COMPUTED ID & KYC METRICS ───────────────────────────
  const metrics = useMemo(() => {
    const total = usersArr.length;
    const idUploaded = usersArr.filter((u) =>
      Boolean(
        u.idType ||
        u.idFilename ||
        u.idDocument ||
        u.idDocumentUrl ||
        (u as any).id_type ||
        (u as any).id_document ||
        (u as any).id_filename ||
        u.idUploadedAt ||
        (u as any).id_uploaded_at
      )
    ).length;

    const photoUploaded = usersArr.filter((u) =>
      Boolean(
        u.passportPicture ||
        u.passportUrl ||
        u.photo ||
        u.avatarUrl ||
        (u as any).passport_picture ||
        (u as any).passport_url ||
        (u as any).avatar_url
      )
    ).length;

    const kycApproved = usersArr.filter((u) => u.kycStatus === "approved" || (u as any).kyc_status === "approved").length;
    const kycPending = usersArr.filter((u) => {
      const kyc = u.kycStatus || (u as any).kyc_status;
      const hasId = Boolean(
        u.idType ||
        u.idFilename ||
        u.idDocument ||
        u.idDocumentUrl ||
        (u as any).id_type ||
        (u as any).id_document ||
        (u as any).id_filename ||
        u.idUploadedAt ||
        (u as any).id_uploaded_at
      );
      return kyc === "pending" || (!kyc && hasId);
    }).length;

    const kycRejected = usersArr.filter((u) => u.kycStatus === "rejected" || (u as any).kyc_status === "rejected").length;
    const idMissing = total - idUploaded;
    const photoMissing = total - photoUploaded;

    return {
      total,
      idUploaded,
      idUploadedPct: total > 0 ? Math.round((idUploaded / total) * 100) : 0,
      photoUploaded,
      photoUploadedPct: total > 0 ? Math.round((photoUploaded / total) * 100) : 0,
      kycApproved,
      kycPending,
      kycRejected,
      idMissing,
      photoMissing,
    };
  }, [usersArr]);

  // Users without uploaded ID documents
  const usersWithMissingId = useMemo(() => {
    return usersArr.filter((u) =>
      !Boolean(
        u.idType ||
        u.idFilename ||
        u.idDocument ||
        u.idDocumentUrl ||
        (u as any).id_type ||
        (u as any).id_document ||
        (u as any).id_filename ||
        u.idUploadedAt ||
        (u as any).id_uploaded_at
      )
    );
  }, [usersArr]);

  const openBatchIdModal = () => {
    setBatchSubject("[Action Required] Upload Your ID Document & Passport Photograph — EEWYLA");
    setBatchBody(
      "Dear Trainee,\n\nOur records indicate that your profile is currently missing a valid ID Document (NIN, Voter's Card, Driver's License, or International Passport) or Passport Photograph.\n\nCompleting your ID document upload is mandatory for physical PVC membership card printing and cohort practical training participation.\n\nPlease log in to your portal account today and complete your document upload under Profile Settings.\n\nThank you,\nEEWYLA Administration"
    );
    setBatchError("");
    setShowBatchIdModal(true);
  };

  const handleSendBatchIdRequests = async () => {
    if (!batchSubject.trim() || !batchBody.trim()) {
      return setBatchError("Subject and message body are required.");
    }
    const targetUserIds = usersWithMissingId.map((u) => u.id);
    if (targetUserIds.length === 0) {
      return setBatchError("All users have already uploaded their ID documents!");
    }

    setBatchSending(true);
    setBatchError("");

    try {
      const res = await authFetch("/users/bulk-email", {
        method: "POST",
        body: JSON.stringify({
          subject: batchSubject,
          body: batchBody,
          targetUserIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBatchError(data.error || "Failed to send batch ID request emails.");
        return;
      }

      setShowBatchIdModal(false);
      popup.alert(`✓ Successfully sent ID Upload request email to ${data.count || targetUserIds.length} trainees!`);
    } catch {
      setBatchError("Something went wrong while sending batch ID request emails.");
    } finally {
      setBatchSending(false);
    }
  };

  // ─── FILTERING LOGIC ───────────────────────────
  const filtered = useMemo(() => {
    let result = usersArr.filter((u: User) => {
      // 1. Role filter
      if (roleFilter !== "all") {
        if (roleFilter === "cooperative" && (!u.isCooperativeOnly || u.role !== "trainee")) return false;
        if (roleFilter === "trainee" && (u.isCooperativeOnly || u.role !== "trainee")) return false;
        if (roleFilter !== "trainee" && roleFilter !== "cooperative" && u.role !== roleFilter) return false;
      }

      // 2. Setup / Active filter
      if (setupFilter === "completed" && (!u.isActive || isUserBlacklisted(u))) return false;
      if (setupFilter === "pending" && (u.isActive || isUserBlacklisted(u))) return false;
      if (setupFilter === "blacklisted" && !isUserBlacklisted(u)) return false;

      // 3. ID / Photo / KYC status filter
      const hasId = Boolean(
        u.idType ||
        u.idFilename ||
        u.idDocument ||
        (u as any).idDocumentUrl ||
        (u as any).id_type ||
        (u as any).id_document ||
        (u as any).id_filename ||
        u.idUploadedAt ||
        (u as any).id_uploaded_at
      );
      const hasPhoto = Boolean(
        u.passportPicture ||
        u.passportUrl ||
        u.photo ||
        u.avatarUrl ||
        (u as any).passport_picture ||
        (u as any).passport_url ||
        (u as any).avatar_url
      );
      const kyc = u.kycStatus || (u as any).kyc_status || (hasId ? "pending" : "none");

      if (idFilter === "id_uploaded" && !hasId) return false;
      if (idFilter === "id_missing" && hasId) return false;
      if (idFilter === "photo_uploaded" && !hasPhoto) return false;
      if (idFilter === "photo_missing" && hasPhoto) return false;
      if (idFilter === "kyc_approved" && kyc !== "approved") return false;
      if (idFilter === "kyc_pending" && kyc !== "pending") return false;
      if (idFilter === "kyc_rejected" && kyc !== "rejected") return false;

      // 4. Location filter
      if (locationFilter !== "all") {
        const isOgb = isOgbomosoUser(u);
        if (locationFilter === "ogbomoso" && !isOgb) return false;
        if (locationFilter === "outside_ogbomoso" && isOgb) return false;
      }

      return true;
    });

    if (ogbomosoPriority) {
      result = [...result].sort((a: User, b: User) => {
        const aOgb = isOgbomosoUser(a);
        const bOgb = isOgbomosoUser(b);
        if (aOgb && !bOgb) return -1;
        if (!aOgb && bOgb) return 1;
        return 0;
      });
    }

    return result;
  }, [usersArr, roleFilter, setupFilter, idFilter, locationFilter, ogbomosoPriority, search]);

  const ITEMS_PER_PAGE = 20;
  const totalPages = serverTotalPages || Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;

  const counts: Record<string, number> = {
    all:          roleCounts.all ?? (roleFilter === "all" ? totalCount : usersArr.length),
    trainee:      roleCounts.trainee ?? (roleFilter === "trainee" ? totalCount : usersArr.filter((u) => u.role === "trainee" && !u.isCooperativeOnly).length),
    cooperative:  roleCounts.cooperative ?? (roleFilter === "cooperative" ? totalCount : usersArr.filter((u) => u.role === "trainee" && u.isCooperativeOnly).length),
    trainer:      roleCounts.trainer ?? (roleFilter === "trainer" ? totalCount : usersArr.filter((u) => u.role === "trainer").length),
    lead_trainer: roleCounts.lead_trainer ?? (roleFilter === "lead_trainer" ? totalCount : usersArr.filter((u) => u.role === "lead_trainer").length),
    corper:       roleCounts.corper ?? (roleFilter === "corper" ? totalCount : usersArr.filter((u) => u.role === "corper").length),
    sub_admin:    roleCounts.sub_admin ?? (roleFilter === "sub_admin" ? totalCount : usersArr.filter((u) => u.role === "sub_admin").length),
    admin:        roleCounts.admin ?? (roleFilter === "admin" ? totalCount : usersArr.filter((u) => u.role === "admin").length),
  };

  const setupCompletedCount = usersArr.filter((u) => u.isActive && !isUserBlacklisted(u)).length;
  const pendingSetupCount   = usersArr.filter((u) => !u.isActive && !isUserBlacklisted(u)).length;
  const blacklistedCount    = usersArr.filter((u) => isUserBlacklisted(u)).length;

  const selectableFilteredUsers = filtered.filter((u: User) => u.role !== "admin");
  const isAllFilteredSelected =
    selectableFilteredUsers.length > 0 &&
    selectableFilteredUsers.every((u: User) => selectedUserIds.includes(u.id));

  const handleExportCSV = () => {
    const headers = [
      "User ID",
      "First Name",
      "Last Name",
      "Full Name",
      "Email",
      "Phone",
      "Role",
      "Area of Specialization",
      "Assigned State",
      "Assigned LGA",
      "Cohort ID",
      "ID Type",
      "KYC Document Status",
      "Passport Photo Status",
      "Passport Photo Data / Link",
    ];

    const rows = filtered.map((u: any) => {
      const passport = u.passportPicture || u.passportUrl || u.avatarUrl || u.photo || "";
      return [
        `"${u.id}"`,
        `"${u.firstName || ""}"`,
        `"${u.lastName || ""}"`,
        `"${u.firstName || ""} ${u.lastName || ""}"`,
        `"${u.email || ""}"`,
        `"${u.phone || ""}"`,
        `"${u.role || ""}"`,
        `"${(u.specialization || "").replace(/"/g, '""')}"`,
        `"${u.assignedState || ""}"`,
        `"${u.assignedLga || ""}"`,
        `"${u.cohortId || ""}"`,
        `"${u.idType || "N/A"}"`,
        `"${u.kycStatus || (u.idType ? "pending" : "missing")}"`,
        `"${passport ? "Uploaded" : "Missing"}"`,
        `"${passport.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EEWYLA_ID_Card_Printing_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sora">
      {selected && (
        <UserModal
          user={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          uniqueLgas={uniqueLgas}
          uniqueStates={uniqueStates}
          uniqueZones={uniqueZones}
          onResendEmail={handleResendSetupEmail}
          onCopyLink={handleCopySetupLink}
          onOpenBlacklist={(ids, names) => setBlacklistModalData({ userIds: ids, userNames: names })}
          resendingId={resendingEmailId}
          copyingId={copyingLinkId}
        />
      )}

      {blacklistModalData && (
        <BlacklistModal
          userIds={blacklistModalData.userIds}
          userNames={blacklistModalData.userNames}
          onClose={() => setBlacklistModalData(null)}
          onConfirm={handleConfirmBlacklist}
        />
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 md:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-lg shadow-2xs">
              👥
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Users Management
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Registered accounts, ID upload verification metrics, and physical PVC card printing export.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => openTrainerEmailModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold rounded-2xl transition shadow-2xs cursor-pointer min-h-[44px]"
          >
            <span>🎓</span> Email All Trainers ({counts.trainer + counts.lead_trainer})
          </button>
          <button
            onClick={openBatchIdModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-2xl transition shadow-2xs cursor-pointer min-h-[44px]"
          >
            <span>🆔</span> Batch Request ID Uploads ({metrics.idMissing})
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition shadow-2xs cursor-pointer min-h-[44px]"
          >
            <span>📥</span> Export ID List (CSV)
          </button>
          <button
            onClick={() => {
              setShowAddModal(true);
              setAddError("");
              setSuccessLink("");
              setCreatedEmail("");
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold rounded-2xl transition shadow-sm cursor-pointer min-h-[44px]"
          >
            <span>+</span> Create User
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          ID & KYC METRICS OVERVIEW DASHBOARD
         ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Total Users */}
        <div
          onClick={() => { setIdFilter("all"); setSetupFilter("all"); setRoleFilter("all"); }}
          className={`bg-white/90 backdrop-blur-md border rounded-2xl p-4 shadow-2xs space-y-1 transition cursor-pointer ${
            idFilter === "all" && setupFilter === "all" && roleFilter === "all"
              ? "border-slate-400 ring-2 ring-slate-400/20"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Users</p>
            <span className="text-xs">👥</span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{metrics.total}</p>
          <p className="text-[11px] font-bold text-emerald-600">
            {setupCompletedCount} Active Accounts
          </p>
        </div>

        {/* Card 2: IDs Uploaded */}
        <div
          onClick={() => setIdFilter(idFilter === "id_uploaded" ? "all" : "id_uploaded")}
          className={`bg-white/90 backdrop-blur-md border rounded-2xl p-4 shadow-2xs space-y-1 transition cursor-pointer ${
            idFilter === "id_uploaded"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20"
              : "border-slate-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">IDs Uploaded</p>
            <span className="text-xs">🆔</span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-700">{metrics.idUploaded}</p>
          <p className="text-[11px] font-bold text-emerald-600">
            {metrics.idUploadedPct}% Coverage ({metrics.idMissing} Missing)
          </p>
        </div>

        {/* Card 3: Passport Photos Uploaded */}
        <div
          onClick={() => setIdFilter(idFilter === "photo_uploaded" ? "all" : "photo_uploaded")}
          className={`bg-white/90 backdrop-blur-md border rounded-2xl p-4 shadow-2xs space-y-1 transition cursor-pointer ${
            idFilter === "photo_uploaded"
              ? "border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20"
              : "border-slate-200/80 hover:border-teal-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Passport Photos</p>
            <span className="text-xs">📷</span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-teal-700">{metrics.photoUploaded}</p>
          <p className="text-[11px] font-bold text-teal-600">
            {metrics.photoUploadedPct}% PVC Ready ({metrics.photoMissing} Pending)
          </p>
        </div>

        {/* Card 4: KYC Verification Breakdown */}
        <div
          onClick={() => setIdFilter(idFilter === "kyc_approved" ? "kyc_pending" : "kyc_approved")}
          className={`bg-white/90 backdrop-blur-md border rounded-2xl p-4 shadow-2xs space-y-1 transition cursor-pointer ${
            idFilter === "kyc_approved" || idFilter === "kyc_pending"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20"
              : "border-slate-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">KYC Status</p>
            <span className="text-xs">✓</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-black text-emerald-700">{metrics.kycApproved}</p>
            <span className="text-xs font-extrabold text-amber-600">({metrics.kycPending} Pending)</span>
          </div>
          <p className="text-[11px] font-bold text-rose-600">
            {metrics.kycRejected} Rejected Documents
          </p>
        </div>
      </div>

      {/* Role filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "trainee", "cooperative", "trainer", "lead_trainer", "corper", "sub_admin", "admin"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-extrabold transition cursor-pointer ${
              roleFilter === r
                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {r === "all" ? "All Users" : r === "cooperative" ? "Coop Members" : r === "sub_admin" ? "Sub Admin" : r.charAt(0).toUpperCase() + r.slice(1)} ({counts[r] ?? 0})
          </button>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {selectableFilteredUsers.length > 0 && (
            <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-100 transition text-xs font-bold text-slate-700 select-none shadow-2xs shrink-0">
              <input
                type="checkbox"
                checked={isAllFilteredSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
              />
              <span>Select All</span>
            </label>
          )}
          <div className="relative flex-1 md:w-80">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, phone or ID type (NIN)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium transition"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value as any)}
            className="flex-1 md:flex-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="all">📍 All Locations</option>
            <option value="ogbomoso">🟢 Ogbomoso / LAUTECH Only</option>
            <option value="outside_ogbomoso">🌐 Outside Ogbomoso</option>
          </select>

          {/* Ogbomoso Priority Toggle */}
          <button
            type="button"
            onClick={() => setOgbomosoPriority(!ogbomosoPriority)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              ogbomosoPriority
                ? "bg-emerald-600 border-emerald-700 text-white font-extrabold"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
            title="Prioritize users located in Ogbomoso / LAUTECH at the top of the list"
          >
            <span>📍</span> Priority: Ogbomoso First {ogbomosoPriority ? "✓" : ""}
          </button>

          {/* ID & Photo Filter Dropdown */}
          <select
            value={idFilter}
            onChange={(e) => setIdFilter(e.target.value as any)}
            className="flex-1 md:flex-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="all">All ID & Photo Statuses</option>
            <option value="id_uploaded">🆔 ID Document Uploaded ({metrics.idUploaded})</option>
            <option value="id_missing">⚠️ Missing ID Document ({metrics.idMissing})</option>
            <option value="photo_uploaded">📷 Passport Photo Uploaded ({metrics.photoUploaded})</option>
            <option value="photo_missing">🚫 Missing Passport Photo ({metrics.photoMissing})</option>
            <option value="kyc_approved">✅ KYC Approved ({metrics.kycApproved})</option>
            <option value="kyc_pending">⏳ KYC Pending Review ({metrics.kycPending})</option>
            <option value="kyc_rejected">❌ KYC Rejected ({metrics.kycRejected})</option>
          </select>

          {/* Setup Status Filter */}
          <select
            value={setupFilter}
            onChange={(e) => setSetupFilter(e.target.value as any)}
            className="flex-1 md:flex-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="all">All Account Statuses</option>
            <option value="completed">✓ Active Accounts ({setupCompletedCount})</option>
            <option value="pending">⏳ Pending Setup ({pendingSetupCount})</option>
            <option value="blacklisted">🚫 Blacklisted ({blacklistedCount})</option>
          </select>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="sticky top-4 z-40 bg-slate-900 text-white border border-slate-700 shadow-2xl rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 font-sora">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-lg">
              {selectedUserIds.length}
            </span>
            <p className="text-xs font-bold">
              {selectedUserIds.length === 1 ? "1 user selected" : `${selectedUserIds.length} users selected`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                const names = usersArr
                  .filter((u) => selectedUserIds.includes(u.id))
                  .map((u) => `${u.firstName} ${u.lastName}`);
                setBlacklistModalData({ userIds: selectedUserIds, userNames: names });
              }}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>🚫</span> Blacklist Selected ({selectedUserIds.length})
            </button>
            <button
              onClick={handleBulkReactivate}
              disabled={bulkProcessing}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <span>✅</span> {bulkProcessing ? "Reactivating..." : `Reactivate Selected (${selectedUserIds.length})`}
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              className="px-3 py-2 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl font-medium">
          {error}
        </div>
      )}

      {/* Users List Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white/80 rounded-2xl border border-slate-200 text-slate-400 text-xs font-semibold animate-pulse">
          Loading users directory...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/90 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold">
            👥
          </div>
          <p className="text-sm font-bold text-slate-800">No users found</p>
          <p className="text-xs text-slate-400">Try clearing filters or adjusting your search term.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((user: User) => {
            const hasIdDoc = Boolean(
              user.idType ||
              user.idFilename ||
              user.idDocument ||
              (user as any).idDocumentUrl ||
              (user as any).id_type ||
              (user as any).id_document ||
              (user as any).id_filename ||
              user.idUploadedAt ||
              (user as any).id_uploaded_at
            );
            const hasPhoto = Boolean(
              user.passportPicture ||
              user.passportUrl ||
              user.photo ||
              user.avatarUrl ||
              (user as any).passport_picture ||
              (user as any).passport_url ||
              (user as any).avatar_url
            );
            const kyc = user.kycStatus || (user as any).kyc_status || (hasIdDoc ? "pending" : "none");

            return (
              <div
                key={user.id}
                onClick={() => setSelected(user)}
                className={`bg-white border rounded-2xl p-4 md:p-5 transition cursor-pointer shadow-2xs hover:border-slate-300 ${
                  selectedUserIds.includes(user.id) ? "border-emerald-500 bg-emerald-50/20" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Multi-select Checkbox */}
                  <input
                    type="checkbox"
                    disabled={user.role === "admin"}
                    checked={selectedUserIds.includes(user.id)}
                    onChange={(e) => toggleSelectUser(user.id, e as any)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                  />

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center flex-shrink-0">
                    {(user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()}
                  </div>

                  {/* Main User Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-extrabold text-sm text-slate-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <RoleBadge role={user.role} />
                      {isOgbomosoUser(user) && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border text-emerald-900 bg-emerald-100 border-emerald-300 flex items-center gap-1 shadow-2xs">
                          📍 Ogbomoso / LAUTECH
                        </span>
                      )}
                      {user.isCooperativeOnly && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border text-amber-800 bg-amber-50 border-amber-200">
                          Coop Member
                        </span>
                      )}
                      {isUserBlacklisted(user) ? (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border text-red-700 bg-red-50 border-red-200 flex items-center gap-1">
                          🚫 Blacklisted
                        </span>
                      ) : user.isActive ? (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200 flex items-center gap-1">
                          ✓ Active User
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border text-amber-700 bg-amber-50 border-amber-200 flex items-center gap-1">
                          ⏳ Setup Pending
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span>{user.email}</span>
                      {user.phone && <span>• {user.phone}</span>}
                    </div>

                    {/* ID Document & Passport Photo Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-slate-100">
                      {/* ID Badge */}
                      {hasIdDoc ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          🆔 ID: {user.idType || "Uploaded"}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          ⚠️ ID Missing
                        </span>
                      )}

                      {/* Passport Photo Badge */}
                      {hasPhoto ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                          📷 Photo Ready
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                          📷 Photo Missing
                        </span>
                      )}

                      {/* Trainer Specialization Badge */}
                      {user.specialization && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                          🎓 Spec: {user.specialization}
                        </span>
                      )}

                      {/* KYC Status Badge */}
                      {kyc === "approved" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          ✓ KYC Approved
                        </span>
                      )}
                      {kyc === "pending" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          ⏳ KYC Pending Review
                        </span>
                      )}
                      {kyc === "rejected" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                          ✕ KYC Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side Actions */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {["trainer", "lead_trainer"].includes(user.role) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickSpecUser(user);
                            setQuickSpecValue(user.specialization || "");
                          }}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer"
                          title="Edit Trainer Specialization"
                        >
                          <span>🎓</span> {user.specialization ? "Edit Spec" : "+ Add Spec"}
                        </button>
                      )}
                      {isUserBlacklisted(user) ? (
                        <button
                          onClick={() => {
                            authFetch(`/users/${user.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ isActive: true, blacklistReason: null }),
                            }).then(() => {
                              handleUpdate({ ...user, isActive: true, blacklistReason: null });
                              popup.alert(`✓ ${user.firstName} ${user.lastName} reactivated successfully.`);
                            });
                          }}
                          disabled={user.role === "admin"}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-extrabold transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Reactivate user"
                        >
                          <span>✅</span> Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setBlacklistModalData({ userIds: [user.id], userNames: [`${user.firstName} ${user.lastName}`] })}
                          disabled={user.role === "admin"}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[10px] font-extrabold transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Blacklist user"
                        >
                          <span>🚫</span> Blacklist
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium">
                      Joined {(() => {
                        const raw = user.createdAt || (user as any).created_at;
                        if (!raw) return "Recently";
                        const d = new Date(raw);
                        return !isNaN(d.getTime())
                          ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "Recently";
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 border-t border-slate-200/80 pt-6 font-sora">
          <p className="text-xs text-slate-500 font-medium">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalCount || filtered.length)} of {totalCount || filtered.length} users
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>

            <div className="text-xs text-slate-600 font-semibold px-2">
              Page {currentPage} of {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          BATCH REQUEST ID UPLOADS MODAL
         ───────────────────────────────────────────── */}
      {showBatchIdModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => { if (e.target === e.currentTarget && !batchSending) setShowBatchIdModal(false); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 font-sora">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800 text-base font-bold">🆔</span>
                <div>
                  <h2 className="font-black text-slate-900 text-base">Batch Request ID Uploads</h2>
                  <p className="text-xs text-slate-500 font-medium">Send email reminder to trainees missing ID documents</p>
                </div>
              </div>
              <button
                onClick={() => !batchSending && setShowBatchIdModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-1">
                <p className="text-xs font-black text-amber-900">
                  Target Recipients: {usersWithMissingId.length} Trainees Missing ID Uploads
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  This bulk email message will be sent directly to all <strong>{usersWithMissingId.length} trainees</strong> who have not yet uploaded their ID document or passport photo.
                </p>
              </div>

              {batchError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl font-medium">
                  {batchError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Subject
                  </label>
                  <input
                    placeholder="Subject..."
                    value={batchSubject}
                    onChange={(e) => setBatchSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Message Body
                  </label>
                  <textarea
                    placeholder="Message content..."
                    rows={7}
                    value={batchBody}
                    onChange={(e) => setBatchBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs font-sans resize-none"
                  />
                </div>

                <button
                  onClick={handleSendBatchIdRequests}
                  disabled={batchSending || usersWithMissingId.length === 0 || !batchSubject.trim() || !batchBody.trim()}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl transition disabled:opacity-40 shadow-xs cursor-pointer min-h-[44px]"
                >
                  {batchSending ? "Sending ID Upload Request Emails..." : `Send ID Request Email to ${usersWithMissingId.length} Users`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Customized Email to Trainers Modal */}
      {showTrainerEmailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sora"
          onClick={(e) => { if (e.target === e.currentTarget && !trainerEmailSending) setShowTrainerEmailModal(false); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-purple-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg font-bold">
                  🎓
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Send Customized Email to Trainers</h3>
                  <p className="text-xs text-purple-800 font-medium">Reaches all active Trainers & Lead Trainers exclusively</p>
                </div>
              </div>
              <button
                onClick={() => !trainerEmailSending && setShowTrainerEmailModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-purple-950">
                    🎯 Target Audience: All Trainers & Lead Trainers ({counts.trainer + counts.lead_trainer} total)
                  </p>
                  <span className="px-2 py-0.5 bg-purple-200 text-purple-900 text-[10px] font-extrabold rounded-full">
                    Exclusive Route
                  </span>
                </div>
                <p className="text-[11px] text-purple-900 leading-relaxed font-medium">
                  This customized email will be delivered individually to all registered <strong>Trainers</strong> and <strong>Lead Trainers</strong>. You can use dynamic tags like <code className="bg-purple-100 px-1 py-0.5 rounded font-mono text-[10px]">{`{{firstName}}`}</code>.
                </p>
              </div>

              {trainerEmailError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl font-medium">
                  ⚠️ {trainerEmailError}
                </div>
              )}

              {trainerEmailSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-3 rounded-2xl font-medium">
                  ✅ {trainerEmailSuccess}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Subject *
                  </label>
                  <input
                    placeholder="Enter customized email subject..."
                    value={trainerEmailSubject}
                    onChange={(e) => setTrainerEmailSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 font-semibold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Customized Email Body *
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">Supports markdown/text</span>
                  </div>
                  <textarea
                    placeholder="Compose message for trainers..."
                    rows={8}
                    value={trainerEmailBody}
                    onChange={(e) => setTrainerEmailBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 leading-relaxed font-sans resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                  <span>💡</span>
                  <span>Available placeholders: <code className="bg-white border px-1 rounded text-purple-700 font-mono font-bold">{`{{firstName}}`}</code>, <code className="bg-white border px-1 rounded text-purple-700 font-mono font-bold">{`{{lastName}}`}</code>, <code className="bg-white border px-1 rounded text-purple-700 font-mono font-bold">{`{{email}}`}</code></span>
                </div>

                <button
                  onClick={handleSendTrainerEmail}
                  disabled={trainerEmailSending || !trainerEmailSubject.trim() || !trainerEmailBody.trim()}
                  className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold rounded-xl transition disabled:opacity-40 shadow-xs cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
                >
                  {trainerEmailSending ? "Dispatching Email to Trainers..." : `📧 Send Customized Email to ${counts.trainer + counts.lead_trainer} Trainers`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Specialization Modal */}
      {quickSpecUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sora"
          onClick={(e) => { if (e.target === e.currentTarget && !quickSpecSaving) setQuickSpecUser(null); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-100 text-purple-800 rounded-xl font-bold">🎓</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Trainer Specialization</h3>
                  <p className="text-xs text-slate-500 font-medium">{quickSpecUser.firstName} {quickSpecUser.lastName}</p>
                </div>
              </div>
              <button
                onClick={() => !quickSpecSaving && setQuickSpecUser(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickSpec} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">
                  Area(s) of Expertise / Specialization *
                </label>
                <input
                  required
                  value={quickSpecValue}
                  onChange={(e) => setQuickSpecValue(e.target.value)}
                  placeholder="e.g. Ruminant Nutrition, Poultry Farming & Biosecurity, Veterinary Hygiene"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-medium transition"
                />
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed font-medium">
                  Input subject areas, field skills, or core subjects taught by this trainer.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickSpecUser(null)}
                  disabled={quickSpecSaving}
                  className="px-4 py-2 text-xs border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickSpecSaving || !quickSpecValue.trim()}
                  className="px-4 py-2 text-xs bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl transition shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  {quickSpecSaving ? "Saving..." : "Save Specialization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4 font-sora">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
              <div>
                <h3 className="text-slate-900 font-black text-md">Create User & Login</h3>
                <p className="text-xs text-slate-500 font-medium">Register a new user and generate a credentials login flow</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition flex-shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form / Success view */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {createdEmail && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center text-xl mx-auto font-black">
                    ✓
                  </div>
                  <div>
                    <p className="text-emerald-800 font-extrabold text-sm">User Created Successfully</p>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      An account setup and welcome email has been sent to <span className="text-slate-900 font-bold">{createdEmail}</span>.
                    </p>
                  </div>

                  {successLink ? (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-black">
                        Direct Password Setup Link (Admin Copy)
                      </p>
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl p-2.5 gap-2">
                        <input
                          readOnly
                          value={successLink}
                          className="flex-1 bg-transparent text-xs text-slate-800 outline-none select-all truncate font-medium"
                        />
                        <button
                          onClick={async () => {
                            navigator.clipboard.writeText(successLink);
                            await popup.alert("Copied to clipboard!");
                          }}
                          className="text-xs text-emerald-700 hover:text-emerald-800 font-bold px-2 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 font-medium">
                        You can copy and open this link directly to set their password on their behalf.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-medium">Generating setup link...</p>
                  )}
                  
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setCreatedEmail("");
                        setSuccessLink("");
                      }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl transition border border-slate-200 font-bold cursor-pointer"
                    >
                      Create Another User
                    </button>
                  </div>
                </div>
              )}

              {!createdEmail && (
                <form onSubmit={handleAddUser} className="space-y-4">
                  {addError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl font-medium">
                      {addError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">First Name *</label>
                      <input
                        required
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        placeholder="e.g. John"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-medium transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Last Name *</label>
                      <input
                        required
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        placeholder="e.g. Doe"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-medium transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address *</label>
                    <input
                      required
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. johndoe@oriyon.ng"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-medium transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                    <input
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="e.g. +2348012345678"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-medium transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Role / Permissions *</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 font-medium transition"
                    >
                      <option value="trainee">Trainee</option>
                      <option value="trainer">Trainer</option>
                      <option value="lead_trainer">Lead Trainer</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="corper">NYSC Corper / Field Officer</option>
                      <option value="admin">Admin</option>
                      <option value="sub_admin">Sub Admin (Restricted)</option>
                    </select>
                  </div>

                  {["trainer", "lead_trainer"].includes(newRole) && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        🎓 Area(s) of Specialization / Expertise
                      </label>
                      <input
                        value={newSpecialization}
                        onChange={(e) => setNewSpecialization(e.target.value)}
                        placeholder="e.g. Ruminant Nutrition, Poultry Farming & Biosecurity, Veterinary Hygiene"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-medium transition"
                      />
                    </div>
                  )}

                  {newRole === "coordinator" && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Coordinator Scope Level</label>
                        <div className="flex gap-4">
                          {[
                            { key: "lga",   label: "LGA" },
                            { key: "state", label: "State" },
                            { key: "zone",  label: "Zone" },
                          ].map((scope) => (
                            <label key={scope.key} className="flex items-center gap-2 text-xs text-slate-900 font-bold cursor-pointer select-none">
                              <input
                                type="radio"
                                name="coordScope"
                                checked={coordScope === scope.key}
                                onChange={() => setCoordScope(scope.key as any)}
                                className="accent-emerald-600 h-4 w-4 border-slate-300"
                              />
                              {scope.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      {coordScope === "lga" && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Assigned LGA *</label>
                          {uniqueLgas.length === 0 ? (
                            <input
                              required
                              value={newAssignedLga}
                              onChange={(e) => setNewAssignedLga(e.target.value)}
                              placeholder="Type LGA name..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition font-medium"
                            />
                          ) : (
                            <select
                              required
                              value={newAssignedLga}
                              onChange={(e) => setNewAssignedLga(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 transition font-medium"
                            >
                              <option value="">-- Select LGA --</option>
                              {uniqueLgas.map((lga) => (
                                <option key={lga} value={lga}>{lga}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      {coordScope === "state" && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Assigned State *</label>
                          {uniqueStates.length === 0 ? (
                            <input
                              required
                              value={newAssignedState}
                              onChange={(e) => setNewAssignedState(e.target.value)}
                              placeholder="Type State name..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition font-medium"
                            />
                          ) : (
                            <select
                              required
                              value={newAssignedState}
                              onChange={(e) => setNewAssignedState(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 transition font-medium"
                            >
                              <option value="">-- Select State --</option>
                              {uniqueStates.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      {coordScope === "zone" && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Zone *</label>
                          {uniqueZones.length === 0 ? (
                            <input
                              required
                              value={newAssignedZone}
                              onChange={(e) => setNewAssignedZone(e.target.value)}
                              placeholder="Type Senatorial Zone..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition font-medium"
                            />
                          ) : (
                            <select
                              required
                              value={newAssignedZone}
                              onChange={(e) => setNewAssignedZone(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 transition font-medium"
                            >
                              <option value="">-- Select Senatorial Zone --</option>
                              {uniqueZones.map((zn) => (
                                <option key={zn} value={zn}>{zn}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowAddModal(false)}
                      className="text-xs border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition disabled:opacity-50 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition font-extrabold disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {submitting ? "Creating..." : "Create User"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-slate-500 text-sm font-medium">Loading users directory...</div>}>
      <UsersContent />
    </Suspense>
  );
}