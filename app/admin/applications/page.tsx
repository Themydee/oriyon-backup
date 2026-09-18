"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authFetch } from "@/lib/api";


interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  age?: string;
  institution?: string;
  hasID?: string;
  idUrl?: string;
  idDocumentUrl?: string;
  idUploadedAt?: string;
  idType?: string;
  idFilename?: string;
  idMimeType?: string;
  kycStatus?: "pending" | "approved" | "rejected" | "none";
  kycRejectionReason?: string;
  desiredRoleOption1?: string;
  desiredRoleOption2?: string;
  approvedRole?: string;
  status:
    | "pending"
    | "shortlisted"
    | "approved"
    | "rejection_review"
    | "rejected"
    | "archived";
  submittedAt: string;
  rejectionReason?: string;
  reviewNotes?: string;
}

// ─────────────────────────────────────────────
// VERIFY ID MODAL
// ─────────────────────────────────────────────
interface VerifyIDModalProps {
  app: Application;
  onClose: () => void;
  onStatusUpdate: (updatedApp: Application) => void;
}

function VerifyIDModal({ app, onClose, onStatusUpdate }: VerifyIDModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(app.idDocumentUrl || app.idUrl || null);
  const [fetchedIdType, setFetchedIdType] = useState<string | null>(null);
  const [fetchedIdFilename, setFetchedIdFilename] = useState<string | null>(null);
  const [fetchedIdMimeType, setFetchedIdMimeType] = useState<string | null>(null);
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [sendingIDRequest, setSendingIDRequest] = useState(false);
  const [idRequestSent, setIdRequestSent] = useState(false);

  const handleSendIDRequest = async () => {
    setSendingIDRequest(true);
    const uploadLink = `https://www.oriyoninternational.com/auth/setup/id-upload?email=${encodeURIComponent(app.email)}`;
    const subject = `Action Required: Upload Your Government ID Document - EEWYLA Programme`;
    const body = `Dear ${app.firstName},

Thank you for applying to the Empowering Experienced & Working Youth in Livestock Agriculture (EEWYLA) Programme.

Your application is currently under review. To enable the selection committee to complete your identity verification and proceed with shortlisting, please upload a clear photo or PDF copy of your Government ID document (NIN Slip/Card, Voter's Card, Driver's License, or International Passport).

Please click the secure link below to upload your document:
👉 ${uploadLink}

Important Instructions:
• Maximum file size is 10MB.
• Accepted formats: JPEG, PNG, WEBP, or PDF.
• Ensure all text and details on the document are legible.

Thank you for your prompt action.

Warm regards,

EEWYLA Selection & Admissions Committee
Oriyon International
www.oriyoninternational.com`;

    try {
      const res = await authFetch(`/applications/${app.id}/email`, {
        method: "POST",
        body: JSON.stringify({ subject, body }),
      });

      if (res.ok) {
        setIdRequestSent(true);
      } else {
        window.location.href = `mailto:${app.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    } catch {
      window.location.href = `mailto:${app.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } finally {
      setSendingIDRequest(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [app.id, app.email]);

  const loadPreview = async () => {
    if (app.idDocumentUrl || app.idUrl) {
      setPreviewUrl(app.idDocumentUrl || app.idUrl || null);
    }

    setLoadingPreview(true);
    setError("");

    try {
      // Lookup candidate in user database by email
      const searchRes = await authFetch(`/users?search=${encodeURIComponent(app.email)}`);
      if (searchRes.ok) {
        const result = await searchRes.json();
        const userList = Array.isArray(result) ? result : result.data || [];
        const matched = userList.find(
          (u: any) => u.email?.toLowerCase().trim() === app.email.toLowerCase().trim()
        );

        if (matched) {
          setMatchedUserId(matched.id);
          if (matched.idType) setFetchedIdType(matched.idType);
          if (matched.idFilename) setFetchedIdFilename(matched.idFilename);
          if (matched.idMimeType) setFetchedIdMimeType(matched.idMimeType);

          if (matched.idDocument) {
            setPreviewUrl(matched.idDocument);
            setLoadingPreview(false);
            return;
          }

          const docRes = await authFetch(`/users/${matched.id}/id-document`);
          if (docRes.ok) {
            const blob = await docRes.blob();
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setLoadingPreview(false);
            return;
          }
        }
      }
    } catch {
      // Silently catch lookup failures
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = () => {
    const targetUrl = previewUrl || app.idDocumentUrl || app.idUrl;
    if (!targetUrl) return;
    setDownloading(true);
    try {
      const a = document.createElement("a");
      a.href = targetUrl;
      a.download = fetchedIdFilename || app.idFilename || `${app.firstName}-${app.lastName}-id`;
      a.target = "_blank";
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
      const appBody: Record<string, string> = { kycStatus: status };
      if (status === "rejected" && rejectionReason.trim()) {
        appBody.kycRejectionReason = rejectionReason.trim();
      }

      let res = await authFetch(`/applications/${app.id}`, {
        method: "PATCH",
        body: JSON.stringify(appBody),
      });

      const targetUserId = matchedUserId || (app as any).userId;
      if (targetUserId) {
        const kycBody: Record<string, string> = { status };
        if (status === "rejected" && rejectionReason.trim()) {
          kycBody.rejectionReason = rejectionReason.trim();
        }
        await authFetch(`/users/${targetUserId}/kyc-verify`, {
          method: "POST",
          body: JSON.stringify(kycBody),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = Array.isArray(data.message)
          ? data.message.join("; ")
          : typeof data.message === "string"
          ? data.message
          : data.error || `Failed to ${status} ID document`;
        setError(errorMsg);
        return;
      }

      const updated = {
        ...app,
        kycStatus: status,
        kycRejectionReason: status === "rejected" ? rejectionReason.trim() : undefined,
        ...data,
      };

      onStatusUpdate(updated);
      onClose();
    } catch {
      setError(`Failed to perform ID ${status} operation.`);
    } finally {
      setVerifying(false);
    }
  };

  const kycStatus = app.kycStatus || "pending";
  const docUrl = previewUrl || app.idDocumentUrl || app.idUrl;
  const mimeType = fetchedIdMimeType || app.idMimeType;
  const isPdf = mimeType === "application/pdf" || docUrl?.toLowerCase().includes(".pdf");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-sora">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">Government ID Inspection & KYC</h3>
            <p className="text-xs text-slate-500 font-medium">Applicant: {app.firstName} {app.lastName} ({app.email})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer">✕</button>
        </div>

        {/* Status Display */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              kycStatus === "approved" ? "bg-emerald-500" :
              kycStatus === "rejected" ? "bg-rose-500" : "bg-amber-500"
            }`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${
              kycStatus === "approved" ? "text-emerald-700" :
              kycStatus === "rejected" ? "text-rose-700" : "text-amber-700"
            }`}>
              {kycStatus === "approved" ? "ID KYC Approved ✅" :
               kycStatus === "rejected" ? "ID KYC Rejected ❌" : "ID Pending Verification ⏳"}
            </span>
          </div>
          {app.idUploadedAt && (
            <span className="text-[10px] text-slate-400 font-semibold">
              Uploaded: {new Date(app.idUploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Document metadata info */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-4 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mb-0.5">ID Type</p>
            <p className="text-slate-900 font-bold">{fetchedIdType || app.idType || app.hasID || "Government ID"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mb-0.5">File Name</p>
            <p className="text-slate-900 font-bold truncate">{fetchedIdFilename || app.idFilename || `${app.firstName}_${app.lastName}_ID`}</p>
          </div>
        </div>

        {/* Rejection reason banner */}
        {kycStatus === "rejected" && app.kycRejectionReason && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl mb-4 font-medium">
            <span className="font-bold uppercase text-[9px] tracking-wider block mb-1 text-rose-900">Reason for Rejection:</span>
            {app.kycRejectionReason}
          </div>
        )}

        {/* Document Preview Container */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 mb-4">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/60">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Preview</p>
            {docUrl && (
              <a href={docUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-emerald-400 hover:underline">
                Open Full Link ↗
              </a>
            )}
          </div>
          <div className="flex items-center justify-center p-3 min-h-[220px]">
            {loadingPreview ? (
              <div className="flex flex-col items-center gap-2 text-slate-400 text-xs font-medium">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading preview...</span>
              </div>
            ) : docUrl ? (
              isPdf ? (
                <iframe src={`${docUrl}#toolbar=0`} className="w-full h-[280px] border-none rounded-xl" />
              ) : (
                <img src={docUrl} alt="ID Document" className="max-w-full max-h-[280px] object-contain rounded-xl shadow-md" />
              )
            ) : (
              <div className="text-center text-slate-300 text-xs py-6 px-4 max-w-md">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2 text-amber-400 text-lg">
                  📄
                </div>
                <p className="font-bold text-white text-sm mb-1">File Upload Pending</p>
                <p className="text-slate-400 text-xs leading-relaxed mb-4 font-medium">
                  Applicant indicated possession of a valid ID (<span className="text-slate-200 font-bold">{app.hasID || "Yes"}</span>), but the document file has not been uploaded to the portal yet.
                </p>
                <button
                  type="button"
                  onClick={handleSendIDRequest}
                  disabled={sendingIDRequest}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>📩</span> {idRequestSent ? "Upload Link Sent to Applicant! ✓" : sendingIDRequest ? "Sending Link..." : "Send ID Upload Link to Applicant"}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl mb-4 font-medium">{error}</p>
        )}

        {/* Rejection input form */}
        {showRejectInput ? (
          <div className="space-y-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl mb-4">
            <p className="text-xs font-bold text-rose-900 uppercase tracking-wider">Specify Rejection Reason</p>
            <textarea
              placeholder="e.g. Blurry document, Name mismatch, Expired card..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              className="w-full bg-white border border-rose-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 transition resize-none font-medium"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => { setShowRejectInput(false); setRejectionReason(""); setError(""); }}
                className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerify("rejected")}
                disabled={verifying}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {verifying ? "Confirming..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownload}
              disabled={downloading || !docUrl}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 rounded-xl transition disabled:opacity-50 shadow-2xs"
            >
              <span>⬇️</span> Download ID
            </button>

            <button
              onClick={() => handleVerify("approved")}
              disabled={verifying}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              <span>✓</span> Approve ID
            </button>

            <button
              onClick={() => setShowRejectInput(true)}
              disabled={verifying}
              className="flex-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 disabled:opacity-50 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>✕</span> Reject ID
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function matchInstitution(instName: string | undefined | null, filterKey: string): boolean {
  if (filterKey === "all" || !filterKey) return true;
  const name = (instName || "").toLowerCase().trim();

  if (filterKey === "lautech") {
    return name.includes("lautech") || name.includes("ladoke") || name.includes("akintola");
  }
  if (filterKey === "ui") {
    return name.includes("ibadan") || name.includes("university of ibadan") || name === "ui" || name.includes(" ui");
  }
  if (filterKey === "unilorin") {
    return name.includes("ilorin") || name.includes("unilorin");
  }
  if (filterKey === "other") {
    const isLautech = name.includes("lautech") || name.includes("ladoke") || name.includes("akintola");
    const isUI = name.includes("ibadan") || name.includes("university of ibadan") || name === "ui" || name.includes(" ui");
    const isUnilorin = name.includes("ilorin") || name.includes("unilorin");
    return !isLautech && !isUI && !isUnilorin;
  }

  return name.includes(filterKey.toLowerCase());
}

// ─────────────────────────────────────────────
// STYLES & LABELS
// ─────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  pending: "text-amber-700 bg-amber-50 border-amber-200/80",
  shortlisted: "text-blue-700 bg-blue-50 border-blue-200/80",
  approved: "text-emerald-700 bg-emerald-50 border-emerald-200/80",
  rejection_review: "text-orange-700 bg-orange-50 border-orange-200/80",
  rejected: "text-rose-700 bg-rose-50 border-rose-200/80",
  archived: "text-slate-600 bg-slate-100 border-slate-200/80",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  shortlisted: "Shortlisted",
  approved: "Approved",
  rejection_review: "Under Review",
  rejected: "Rejected",
  archived: "Archived",
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "rejection_review", label: "Under Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export const hasUploadedID = (app: Application): boolean => {
  return Boolean(app.idDocumentUrl || app.idUrl || app.idUploadedAt);
};

// ─────────────────────────────────────────────
// REJECTION MODAL
// ─────────────────────────────────────────────
interface RejectModalProps {
  app: Application;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}

function RejectModal({ app, onConfirm, onCancel, loading }: RejectModalProps) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-slate-900 font-bold text-lg mb-1">Send to Review</h2>

        <p className="text-slate-600 text-sm mb-5">
          <span className="text-slate-900 font-semibold">{app.firstName} {app.lastName}</span> will be moved to{" "}
          <span className="text-orange-600 font-semibold">Under Review</span>.
        </p>

        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Reason for review
        </label>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Missing information..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none"
        />

        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm py-2.5 rounded-xl font-semibold transition"
          >
            Cancel
          </button>

          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 bg-orange-600 text-white hover:bg-orange-700 text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 shadow-xs"
          >
            {loading ? "Moving..." : "Send to Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FINAL REJECT MODAL
// ─────────────────────────────────────────────
interface FinalRejectModalProps {
  app: Application;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}

function FinalRejectModal({ app, onConfirm, onCancel, loading }: FinalRejectModalProps) {
  const [reason, setReason] = useState(app.rejectionReason ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
      <div className="bg-white border border-rose-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-slate-900 font-bold text-lg mb-1">Final Rejection</h2>

        <p className="text-slate-600 text-sm mb-5">
          This will permanently reject <span className="text-slate-900 font-semibold">{app.firstName} {app.lastName}</span>.
        </p>

        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Rejection reason
        </label>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Provide a reason..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition resize-none"
        />

        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm py-2.5 rounded-xl font-semibold transition"
          >
            Cancel
          </button>

          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            className="flex-1 bg-rose-600 text-white hover:bg-rose-700 text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 shadow-xs"
          >
            {loading ? "Rejecting..." : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DELETE MODAL
// ─────────────────────────────────────────────
interface DeleteModalProps {
  app: Application;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function DeleteModal({ app, onConfirm, onCancel, loading }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-slate-900 font-bold text-lg mb-1">Delete Application</h2>

        <p className="text-slate-600 text-sm mb-5">
          Permanently delete <span className="text-slate-900 font-semibold">{app.firstName} {app.lastName}</span>?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm py-2.5 rounded-xl font-semibold transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-rose-600 text-white hover:bg-rose-700 text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 shadow-xs"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// REQUEST ID MODAL
// ─────────────────────────────────────────────
function RequestIDModal({ app, onClose }: { app: Application; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const uploadLink = `https://www.oriyoninternational.com/auth/setup/id-upload?email=${encodeURIComponent(app.email)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(uploadLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await authFetch(`/applications/${app.id}/email`, {
        method: "POST",
        body: JSON.stringify({
          subject: `Action Required: Upload Government ID for EEWYLA Shortlisting - ${app.firstName}`,
          body: `Dear ${app.firstName},\n\nYour application for the EEWYLA Programme is currently under review.\n\nTo proceed with shortlisting your application, we require a clear copy of a valid government-issued ID document (NIN Card, Voter's Card, Driver's License, or International Passport).\n\nPlease click the link below to upload your ID document immediately:\n${uploadLink}\n\nThank you,\nEEWYLA Selection Committee\nOriyon International`,
        }),
      });
      if (res.ok) {
        setEmailSent(true);
      } else {
        window.location.href = `mailto:${app.email}?subject=${encodeURIComponent(`Action Required: Upload Government ID for EEWYLA Shortlisting`)}&body=${encodeURIComponent(`Dear ${app.firstName},\n\nYour application for the EEWYLA Programme is under review. To complete shortlisting, please upload your Government ID here:\n\n${uploadLink}\n\nThank you,\nEEWYLA Selection Team`)}`;
      }
    } catch {
      window.location.href = `mailto:${app.email}?subject=${encodeURIComponent(`Action Required: Upload Government ID for EEWYLA Shortlisting`)}&body=${encodeURIComponent(`Dear ${app.firstName},\n\nYour application for the EEWYLA Programme is under review. To complete shortlisting, please upload your Government ID here:\n\n${uploadLink}\n\nThank you,\nEEWYLA Selection Team`)}`;
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 font-sora">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">Request Government ID Upload</h3>
            <p className="text-xs text-slate-500 font-medium">Applicant: {app.firstName} {app.lastName} ({app.email})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer">✕</button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 space-y-1.5">
          <p className="text-xs font-bold text-amber-900">Why send an ID request?</p>
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            Government ID is required for shortlisting. Sending this request provides the applicant a direct link to upload their NIN, Voter&apos;s Card, License, or Passport so they can qualify for shortlisting.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Direct ID Upload Link</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={uploadLink}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono font-medium outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 transition cursor-pointer"
              >
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          {emailSent ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3.5 rounded-xl">
              ✓ Email reminder sent successfully to {app.email}!
            </div>
          ) : (
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>✉️</span> {sendingEmail ? "Sending Email..." : "Send ID Request Email to Candidate"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE CONTENT
// ─────────────────────────────────────────────
function ApplicationsContent() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [requestIDModalApp, setRequestIDModalApp] = useState<Application | null>(null);
  const [verifyIDModalApp, setVerifyIDModalApp] = useState<Application | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const filter = searchParams.get("filter") || "all";
  const search = searchParams.get("search") || "";
  const ageFilter = searchParams.get("ageFilter") || "all";
  const genderFilter = searchParams.get("genderFilter") || "all";
  const trackFilter = searchParams.get("trackFilter") || "all";
  const institutionFilter = searchParams.get("institutionFilter") || "all";
  const idFilter = searchParams.get("idFilter") || "all";
  const locationFilter = searchParams.get("locationFilter") || "all";
  const ogbomosoPriority = searchParams.get("ogbomosoPriority") === "true";
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

  const setFilter = (val: string) => updateParams({ filter: val, page: 1 });
  const setSearch = (val: string) => updateParams({ search: val, page: 1 });
  const setAgeFilter = (val: string) => updateParams({ ageFilter: val, page: 1 });
  const setGenderFilter = (val: string) => updateParams({ genderFilter: val, page: 1 });
  const setTrackFilter = (val: string) => updateParams({ trackFilter: val, page: 1 });
  const setInstitutionFilter = (val: string) => updateParams({ institutionFilter: val, page: 1 });
  const setIdFilter = (val: string) => updateParams({ idFilter: val, page: 1 });
  const setLocationFilter = (val: string) => updateParams({ locationFilter: val, page: 1 });
  const toggleOgbomosoPriority = () => updateParams({ ogbomosoPriority: !ogbomosoPriority, page: 1 });
  const setCurrentPage = (val: number | ((prev: number) => number)) => {
    const newPage = typeof val === "function" ? val(currentPage) : val;
    updateParams({ page: newPage });
  };

  const isOgbomosoCandidate = (app: Application) => {
    if (!app) return false;
    const combined = [
      (app as any).address,
      app.institution,
      (app as any).assignedLga,
      (app as any).assignedState,
      (app as any).assignedZone,
      (app as any).location,
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

  const availableTracks = useMemo(() => {
    const tracksSet = new Set<string>();
    applications.forEach((app) => {
      if (app.desiredRoleOption1) tracksSet.add(app.desiredRoleOption1);
      if (app.desiredRoleOption2) tracksSet.add(app.desiredRoleOption2);
      if (app.approvedRole) tracksSet.add(app.approvedRole);
    });
    return Array.from(tracksSet).sort();
  }, [applications]);

  const ITEMS_PER_PAGE = 20;

  // Modals
  const [reviewModal, setReviewModal] = useState<Application | null>(null);
  const [finalRejectModal, setFinalRejectModal] = useState<Application | null>(null);
  const [deleteModal, setDeleteModal] = useState<Application | null>(null);
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);
  const [bulkEmailLoading, setBulkEmailLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [totalCount, setTotalCount] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [searchInput, setSearchInput] = useState(search);
  const [isExporting, setIsExporting] = useState(false);
  const fetchIdRef = useRef(0);

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
    fetchApplications();
  }, [currentPage, filter, search]);

  const fetchApplications = async () => {
    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", "20");
      if (filter && filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);

      const [appRes, userRes] = await Promise.all([
        authFetch(`/applications?${params.toString()}`),
        authFetch("/users?limit=100").catch(() => null),
      ]);

      const data = await appRes.json();

      if (currentFetchId !== fetchIdRef.current) {
        return; // Ignore stale out-of-order request responses
      }

      if (!appRes.ok) {
        setError(data.error || "Failed to load applications");
        return;
      }

      const rawApps = Array.isArray(data) ? data : data.applications || data.data || [];
      const t = typeof data.total === "number" ? data.total : rawApps.length;
      const tp = typeof data.totalPages === "number" ? data.totalPages : Math.ceil(t / 20);

      if (data.statusCounts && typeof data.statusCounts === "object") {
        setStatusCounts(data.statusCounts);
      }

      let mergedApps = rawApps;
      if (userRes && userRes.ok) {
        try {
          const userData = await userRes.json();
          if (userData) {
            const userList: any[] = Array.isArray(userData) ? userData : userData.data || [];
            const userMap = new Map<string, any>();
            userList.forEach((u) => {
              if (u.email) userMap.set(u.email.toLowerCase().trim(), u);
            });

            mergedApps = rawApps.map((app: any) => {
              const userObj = userMap.get(app.email.toLowerCase().trim());
              if (userObj) {
                const hasUserDoc = Boolean(userObj.idDocument || userObj.idDocumentUrl || userObj.idUploadedAt);
                if (hasUserDoc) {
                  return {
                    ...app,
                    idDocumentUrl: app.idDocumentUrl || userObj.idDocumentUrl || userObj.idDocument,
                    idType: app.idType || userObj.idType,
                    idFilename: app.idFilename || userObj.idFilename,
                    idMimeType: app.idMimeType || userObj.idMimeType,
                    idUploadedAt: app.idUploadedAt || userObj.idUploadedAt,
                    kycStatus: app.kycStatus === "VERIFIED" ? "VERIFIED" : userObj.kycStatus || app.kycStatus || "PENDING",
                    kycRejectionReason: app.kycRejectionReason || userObj.kycRejectionReason,
                    userAssignedState: userObj.assignedState || null,
                    userAssignedZone: userObj.assignedZone || null,
                    userAssignedLga: userObj.assignedLga || null,
                    userSpecialization: userObj.specialization || null,
                    userId: userObj.id,
                  };
                }
              }
              return app;
            });
          }
        } catch (e) {
          console.error("Error processing parallel user KYC merge", e);
        }
      }

      setApplications(mergedApps);
      setTotalCount(t);
      setServerTotalPages(tp);

    } catch {
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    id: string,
    status: string,
    extra: Record<string, string> = {}
  ) => {
    setActionLoading(id);
    setError("");

    const payload: Record<string, unknown> = { status };
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        payload[k] = v;
      }
    });

    try {
      const res = await authFetch(`/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = Array.isArray(data.message)
          ? data.message.join("; ")
          : typeof data.message === "string"
          ? data.message
          : typeof data.error === "string" && data.error !== "Bad Request"
          ? data.error
          : "Action failed";
        setError(errorMsg);
        return;
      }

      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...data } : a))
      );
    } catch {
      setError("Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const rescueApplication = async (id: string) => {
    setActionLoading(id);

    try {
      const res = await authFetch(`/applications/${id}/rescue`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }

      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...data } : a))
      );
    } catch {
      setError("Failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteApplication = async (id: string) => {
    setActionLoading(id);

    try {
      const res = await authFetch(`/applications/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Delete failed");
        return;
      }

      setApplications((prev) => prev.filter((a) => a.id !== id));
      setDeleteModal(null);
    } catch {
      setError("Delete failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendBulkEmail = async (status: string, subject: string, body: string) => {
    setBulkEmailLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await authFetch("/applications/bulk-email", {
        method: "POST",
        body: JSON.stringify({ status, subject, body }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send bulk email");
        return;
      }

      setSuccessMessage(data.message || `Bulk email successfully queued for ${data.count} applicants.`);
      setIsBulkEmailModalOpen(false);
    } catch {
      setError("Failed to send bulk email.");
    } finally {
      setBulkEmailLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // FILTER + SORT + PAGINATION
  // ─────────────────────────────────────────────
  const baseFiltered = applications
    .filter((a) => {
      if (trackFilter === "all" || !trackFilter) return true;
      const targetTrack = trackFilter.toLowerCase();
      return (
        a.desiredRoleOption1?.toLowerCase() === targetTrack ||
        a.desiredRoleOption2?.toLowerCase() === targetTrack ||
        a.approvedRole?.toLowerCase() === targetTrack
      );
    })
    .filter((a) => matchInstitution(a.institution, institutionFilter))
    .filter((a) => {
      if (genderFilter === "all" || !genderFilter) return true;
      return a.gender?.toLowerCase() === genderFilter.toLowerCase();
    })
    .filter((a) => {
      if (ageFilter === "all" || !ageFilter) return true;
      const ageNum = parseInt(a.age || "", 10);
      if (isNaN(ageNum)) return false;
      if (ageFilter === "18-25") return ageNum >= 18 && ageNum <= 25;
      if (ageFilter === "26-35") return ageNum >= 26 && ageNum <= 35;
      if (ageFilter === "36-40") return ageNum >= 36 && ageNum <= 40;
      if (ageFilter === "41-50") return ageNum >= 41 && ageNum <= 50;
      if (ageFilter === "51-60") return ageNum >= 51 && ageNum <= 60;
      return true;
    })
    .filter((a) => {
      if (idFilter === "all" || !idFilter) return true;
      const hasId = hasUploadedID(a);
      if (idFilter === "uploaded") return hasId;
      if (idFilter === "missing") return !hasId;
      return true;
    })
    .filter((a) => {
      if (locationFilter === "all" || !locationFilter) return true;
      const isOgb = isOgbomosoCandidate(a);
      if (locationFilter === "ogbomoso") return isOgb;
      if (locationFilter === "outside_ogbomoso") return !isOgb;
      return true;
    });

  const filtered = baseFiltered.filter(
    (a) => filter === "all" || a.status === filter
  );

  const sortedApplications = [...filtered].sort((a, b) => {
    if (ogbomosoPriority) {
      const aOgb = isOgbomosoCandidate(a);
      const bOgb = isOgbomosoCandidate(b);
      if (aOgb && !bOgb) return -1;
      if (!aOgb && bOgb) return 1;
    }
    return (
      new Date(b.submittedAt).getTime() -
      new Date(a.submittedAt).getTime()
    );
  });

  const hasActiveFilter = useMemo(() => {
    return (
      filter !== "all" ||
      Boolean(search.trim()) ||
      institutionFilter !== "all" ||
      trackFilter !== "all" ||
      genderFilter !== "all" ||
      ageFilter !== "all" ||
      locationFilter !== "all" ||
      idFilter !== "all" ||
      ogbomosoPriority
    );
  }, [
    filter,
    search,
    institutionFilter,
    trackFilter,
    genderFilter,
    ageFilter,
    locationFilter,
    idFilter,
    ogbomosoPriority,
  ]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "10000");
      if (filter && filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);

      const appRes = await authFetch(`/applications?${params.toString()}`);
      const data = await appRes.json();

      if (!appRes.ok) {
        setError(data.error || "Failed to load applications for export");
        return;
      }

      const rawApps: Application[] = Array.isArray(data)
        ? data
        : data.applications || data.data || [];

      // Apply client-side filters
      const exportFiltered = rawApps
        .filter((a) => {
          if (trackFilter === "all" || !trackFilter) return true;
          const targetTrack = trackFilter.toLowerCase();
          return (
            a.desiredRoleOption1?.toLowerCase() === targetTrack ||
            a.desiredRoleOption2?.toLowerCase() === targetTrack ||
            a.approvedRole?.toLowerCase() === targetTrack
          );
        })
        .filter((a) => matchInstitution(a.institution, institutionFilter))
        .filter((a) => {
          if (genderFilter === "all" || !genderFilter) return true;
          return a.gender?.toLowerCase() === genderFilter.toLowerCase();
        })
        .filter((a) => {
          if (ageFilter === "all" || !ageFilter) return true;
          const ageNum = parseInt(a.age || "", 10);
          if (isNaN(ageNum)) return false;
          if (ageFilter === "18-25") return ageNum >= 18 && ageNum <= 25;
          if (ageFilter === "26-35") return ageNum >= 26 && ageNum <= 35;
          if (ageFilter === "36-40") return ageNum >= 36 && ageNum <= 40;
          if (ageFilter === "41-50") return ageNum >= 41 && ageNum <= 50;
          if (ageFilter === "51-60") return ageNum >= 51 && ageNum <= 60;
          return true;
        })
        .filter((a) => {
          if (idFilter === "all" || !idFilter) return true;
          const hasId = hasUploadedID(a);
          if (idFilter === "uploaded") return hasId;
          if (idFilter === "missing") return !hasId;
          return true;
        })
        .filter((a) => {
          if (locationFilter === "all" || !locationFilter) return true;
          const isOgb = isOgbomosoCandidate(a);
          if (locationFilter === "ogbomoso") return isOgb;
          if (locationFilter === "outside_ogbomoso") return !isOgb;
          return true;
        });

      // Sort matching applications
      exportFiltered.sort((a, b) => {
        if (ogbomosoPriority) {
          const aOgb = isOgbomosoCandidate(a);
          const bOgb = isOgbomosoCandidate(b);
          if (aOgb && !bOgb) return -1;
          if (!aOgb && bOgb) return 1;
        }
        return (
          new Date(b.submittedAt).getTime() -
          new Date(a.submittedAt).getTime()
        );
      });

      if (exportFiltered.length === 0) {
        setError("No applications match the filter criteria to export.");
        return;
      }

      const headers = [
        "Application ID",
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Gender",
        "Age",
        "Status",
        "Institution",
        "Primary Track Choice",
        "Secondary Track Choice",
        "Approved Role",
        "ID Document Status",
        "KYC Status",
        "KYC Rejection Reason",
        "Ogbomoso Priority Candidate",
        "Submitted Date",
        "Rejection Reason",
        "Review Notes",
      ];

      const escapeCsv = (val: string | undefined | null) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = exportFiltered.map((a) => [
        escapeCsv(a.id),
        escapeCsv(a.firstName),
        escapeCsv(a.lastName),
        escapeCsv(a.email),
        escapeCsv(a.phone),
        escapeCsv(a.gender),
        escapeCsv(a.age),
        escapeCsv(STATUS_LABELS[a.status] || a.status),
        escapeCsv(a.institution),
        escapeCsv(a.desiredRoleOption1),
        escapeCsv(a.desiredRoleOption2),
        escapeCsv(a.approvedRole),
        escapeCsv(hasUploadedID(a) ? "Uploaded" : "Missing"),
        escapeCsv(a.kycStatus || "pending"),
        escapeCsv(a.kycRejectionReason),
        escapeCsv(isOgbomosoCandidate(a) ? "Yes" : "No"),
        escapeCsv(
          a.submittedAt
            ? new Date(a.submittedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : ""
        ),
        escapeCsv(a.rejectionReason),
        escapeCsv(a.reviewNotes),
      ]);

      const csvContent =
        "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const filterTag = filter !== "all" ? `_${filter}` : "";
      const dateTag = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `EEWYLA_Applications${filterTag}_${dateTag}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccessMessage(`Successfully exported ${exportFiltered.length} filtered application(s) to CSV.`);
    } catch {
      setError("Failed to export applications CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = serverTotalPages || Math.ceil(sortedApplications.length / ITEMS_PER_PAGE) || 1;
  const paginatedApplications = sortedApplications.length <= ITEMS_PER_PAGE 
    ? sortedApplications 
    : sortedApplications.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const counts: Record<string, number> = {
    all: statusCounts.all ?? (filter === "all" ? totalCount : baseFiltered.length),
  };

  FILTER_TABS.slice(1).forEach(({ key }) => {
    counts[key] =
      statusCounts[key] ??
      (filter === key ? totalCount : baseFiltered.filter((a) => a.status === key).length);
  });

  return (
    <div>
      {/* MODALS */}
      {reviewModal && (
        <RejectModal
          app={reviewModal}
          loading={actionLoading === reviewModal.id}
          onCancel={() => setReviewModal(null)}
          onConfirm={async (reason) => {
            await updateStatus(reviewModal.id, "rejection_review", {
              rejectionReason: reason,
            });
            setReviewModal(null);
          }}
        />
      )}

      {finalRejectModal && (
        <FinalRejectModal
          app={finalRejectModal}
          loading={actionLoading === finalRejectModal.id}
          onCancel={() => setFinalRejectModal(null)}
          onConfirm={async (reason) => {
            await updateStatus(finalRejectModal.id, "rejected", {
              rejectionReason: reason,
            });
            setFinalRejectModal(null);
          }}
        />
      )}

      {deleteModal && (
        <DeleteModal
          app={deleteModal}
          loading={actionLoading === deleteModal.id}
          onCancel={() => setDeleteModal(null)}
          onConfirm={() => deleteApplication(deleteModal.id)}
        />
      )}

      {isBulkEmailModalOpen && (
        <BulkEmailModal
          currentFilter={filter}
          applications={applications}
          onCancel={() => setIsBulkEmailModalOpen(false)}
          onConfirm={handleSendBulkEmail}
          loading={bulkEmailLoading}
        />
      )}

      {requestIDModalApp && (
        <RequestIDModal
          app={requestIDModalApp}
          onClose={() => setRequestIDModalApp(null)}
        />
      )}

      {verifyIDModalApp && (
        <VerifyIDModal
          app={verifyIDModalApp}
          onClose={() => setVerifyIDModalApp(null)}
          onStatusUpdate={(updatedApp) => {
            setApplications((prev) =>
              prev.map((a) => (a.id === updatedApp.id ? { ...a, ...updatedApp } : a))
            );
          }}
        />
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-1">
            Applications Management
          </h1>
          <p className="text-slate-500 text-sm">
            Review, shortlist, and verify EEWYLA programme applicants
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={() => {
              setIdFilter("missing");
              setIsBulkEmailModalOpen(true);
            }}
            className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            title="Filter ID missing candidates and send batch ID upload requests"
          >
            <span>📩 Batch Request ID Uploads</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting || (totalCount === 0 && sortedApplications.length === 0)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm px-4.5 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            title="Download CSV report of applications matching current filters"
          >
            <span>📥 {isExporting ? "Exporting CSV..." : "Export CSV"}</span>
            {hasActiveFilter && (
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-extrabold">
                Filtered ({sortedApplications.length})
              </span>
            )}
          </button>

          <button
            onClick={() => setIsBulkEmailModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            ✉ Send Bulk Email
          </button>
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition ${
              filter === key
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {label} · {counts[key] ?? 0}
          </button>
        ))}
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-stretch md:items-center">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="flex-1 max-w-md bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-2xs"
        />

        <div className="flex gap-3 flex-wrap">
          {/* Institution Filter */}
          <select
            value={institutionFilter}
            onChange={(e) => setInstitutionFilter(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition shadow-2xs font-bold max-w-[220px] truncate"
          >
            <option value="all">All Institutions</option>
            <option value="lautech">🏫 LAUTECH</option>
            <option value="ui">🏫 University of Ibadan (UI)</option>
            <option value="unilorin">🏫 University of Ilorin (Uni Ilorin)</option>
            <option value="other">🏛️ Other Institutions</option>
          </select>

          {/* Track Filter */}
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition shadow-2xs font-medium max-w-[200px] truncate"
          >
            <option value="all">All Tracks</option>
            {availableTracks.map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </select>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition shadow-2xs font-medium"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          {/* Age Filter */}
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition shadow-2xs font-medium"
          >
            <option value="all">All Ages</option>
            <option value="18-25">18 - 25 years</option>
            <option value="26-35">26 - 35 years</option>
            <option value="36-40">36 - 40 years</option>
            <option value="41-50">41 - 50 years</option>
            <option value="51-60">51 - 60 years</option>
          </select>

          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition shadow-2xs font-bold"
          >
            <option value="all">📍 All Locations</option>
            <option value="ogbomoso">🟢 Ogbomoso / LAUTECH Only</option>
            <option value="outside_ogbomoso">🌐 Outside Ogbomoso</option>
          </select>

          {/* Ogbomoso Priority Toggle */}
          <button
            type="button"
            onClick={toggleOgbomosoPriority}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              ogbomosoPriority
                ? "bg-emerald-600 border-emerald-700 text-white font-extrabold"
                : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50"
            }`}
            title="Prioritize applicants located in Ogbomoso / LAUTECH at the top of the list"
          >
            <span>📍</span> Priority: Ogbomoso First {ogbomosoPriority ? "✓" : ""}
          </button>

          {/* ID Status Filter */}
          <select
            value={idFilter}
            onChange={(e) => setIdFilter(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition shadow-2xs font-bold"
          >
            <option value="all">All ID Statuses</option>
            <option value="uploaded">✅ ID Uploaded Only</option>
            <option value="missing">⚠️ ID Missing Only</option>
          </select>

          {/* Export Filtered CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting || sortedApplications.length === 0}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              hasActiveFilter
                ? "bg-emerald-600 border-emerald-700 text-white font-extrabold hover:bg-emerald-700"
                : "bg-slate-800 border-slate-900 text-white hover:bg-slate-700"
            }`}
            title="Download CSV file of applications currently filtered"
          >
            <span>📥</span> {isExporting ? "Exporting CSV..." : `Export CSV (${sortedApplications.length})`}
          </button>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                router.push("/admin/applications");
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
              title="Clear all active filters"
            >
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl mb-6 flex items-center justify-between gap-4 shadow-2xs font-medium">
          <span>✓ {successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-3 rounded-xl mb-6 flex items-center justify-between gap-4 shadow-2xs font-medium">
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError("")}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* CONTENT LIST */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 text-sm font-medium">
          Loading applications...
        </div>
      ) : sortedApplications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-slate-200/80 rounded-2xl p-8">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm font-bold text-slate-700">No applications match your filter criteria</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or filters above</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3.5">
            {paginatedApplications.map((app) => {
              const isActioning = actionLoading === app.id;
              const hasIDDoc = hasUploadedID(app);

              return (
                <div
                  key={app.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-sm flex items-center justify-center shrink-0 uppercase shadow-2xs">
                        {app.firstName[0]}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-base text-slate-900">
                            {app.firstName} {app.lastName}
                          </p>

                          {/* Institution Pill */}
                          {app.institution && (
                            <span className="bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              🏫 {app.institution}
                            </span>
                          )}

                          {/* Ogbomoso Location Priority Pill */}
                          {isOgbomosoCandidate(app) && (
                            <span className="bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                              📍 Ogbomoso / LAUTECH Priority
                            </span>
                          )}

                          {/* Physical Site Pill */}
                          <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            📍 Site: Unassigned
                          </span>

                          {/* ID Status Pill */}
                          {hasIDDoc ? (
                            <button
                              type="button"
                              onClick={() => setVerifyIDModalApp(app)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition shadow-2xs ${
                                app.kycStatus === "approved"
                                  ? "bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                                  : app.kycStatus === "rejected"
                                  ? "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                                  : "bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100"
                              }`}
                              title="Click to view, inspect, approve or reject ID document"
                            >
                              {app.kycStatus === "approved"
                                ? "ID Approved ✅ (View)"
                                : app.kycStatus === "rejected"
                                ? "ID Rejected ❌ (View)"
                                : "ID Uploaded 🔍 View & Verify →"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setVerifyIDModalApp(app)}
                              className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 hover:bg-amber-100 cursor-pointer"
                              title="ID file missing. Click to inspect or request upload link from applicant."
                            >
                              📄 ID File Missing (Request Upload)
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                          {app.email} · {app.phone}
                        </p>

                        {(app.age || app.gender || app.desiredRoleOption1) && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {app.age && (
                              <span className="bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 px-2 py-0.5 rounded-md">
                                Age: {app.age}
                              </span>
                            )}
                            {app.gender && (
                              <span className="bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 px-2 py-0.5 rounded-md capitalize">
                                Gender: {app.gender}
                              </span>
                            )}
                            {app.desiredRoleOption1 && (
                              <span className="bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                                Track: {app.desiredRoleOption1}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs ${
                          STATUS_STYLES[app.status]
                        }`}
                      >
                        {STATUS_LABELS[app.status]}
                      </span>

                      <p className="text-[10px] font-semibold text-slate-400">
                        Submitted: {new Date(app.submittedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-slate-100 flex-wrap">
                    <Link
                      href={`/admin/applications/${app.id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                      className="text-xs font-semibold border border-slate-200 hover:border-slate-400 text-slate-700 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg transition"
                    >
                      View Details →
                    </Link>

                    {hasIDDoc && (
                      <button
                        type="button"
                        onClick={() => setVerifyIDModalApp(app)}
                        className="text-xs font-bold border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="View ID document, download, approve or reject KYC"
                      >
                        <span>🔍 View & Verify ID</span>
                      </button>
                    )}

                    {/* Pending Status Actions */}
                    {app.status === "pending" && (
                      <>
                        <ActionButton
                          label="Shortlist (Pre-approve)"
                          color="blue"
                          loading={isActioning}
                          title="Shortlist application"
                          onClick={() => updateStatus(app.id, "shortlisted")}
                        />

                        <ActionButton
                          label="Approve"
                          color="green"
                          loading={isActioning}
                          title="Approve application"
                          onClick={() => updateStatus(app.id, "approved")}
                        />

                        {!hasIDDoc && (
                          <button
                            onClick={() => setRequestIDModalApp(app)}
                            className="text-xs font-bold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Send ID Upload reminder link to candidate"
                          >
                            <span>📩 Request ID Upload</span>
                          </button>
                        )}

                        <ActionButton
                          label="Send to Review"
                          color="orange"
                          loading={isActioning}
                          onClick={() => setReviewModal(app)}
                        />

                        <ActionButton
                          label="Reject Application"
                          color="red"
                          loading={isActioning}
                          onClick={() => setFinalRejectModal(app)}
                        />
                      </>
                    )}

                    {/* Shortlisted Status Actions */}
                    {app.status === "shortlisted" && (
                      <>
                        <ActionButton
                          label="Approve Application"
                          color="green"
                          loading={isActioning}
                          title="Approve application"
                          onClick={() => updateStatus(app.id, "approved")}
                        />

                        {!hasIDDoc && (
                          <button
                            onClick={() => setRequestIDModalApp(app)}
                            className="text-xs font-bold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Send ID Upload reminder link to candidate"
                          >
                            <span>📩 Request ID Upload</span>
                          </button>
                        )}

                        <ActionButton
                          label="Send to Review"
                          color="orange"
                          loading={isActioning}
                          onClick={() => setReviewModal(app)}
                        />

                        <ActionButton
                          label="Reject Application"
                          color="red"
                          loading={isActioning}
                          onClick={() => setFinalRejectModal(app)}
                        />
                      </>
                    )}

                    {/* Review Status Actions */}
                    {app.status === "rejection_review" && (
                      <>
                        <ActionButton
                          label="↩ Rescue to Pending"
                          color="blue"
                          loading={isActioning}
                          onClick={() => rescueApplication(app.id)}
                        />

                        <ActionButton
                          label="Reject Finally"
                          color="red"
                          loading={isActioning}
                          onClick={() => setFinalRejectModal(app)}
                        />
                      </>
                    )}

                    {/* Rejected Status Actions */}
                    {app.status === "rejected" && (
                      <ActionButton
                        label="🗑 Delete"
                        color="red"
                        loading={isActioning}
                        onClick={() => setDeleteModal(app)}
                      />
                    )}

                    {/* Approved Status Actions */}
                    {app.status === "approved" && (
                      <>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg flex items-center gap-1">
                          ✓ Approved & Enrolled
                        </span>
                        <ActionButton
                          label="Move back to Review"
                          color="orange"
                          loading={isActioning}
                          onClick={() => setReviewModal(app)}
                        />
                        <ActionButton
                          label="Reject Application"
                          color="red"
                          loading={isActioning}
                          onClick={() => setFinalRejectModal(app)}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 border-t border-slate-200/80 pt-6">
              <p className="text-xs text-slate-500 font-medium">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalCount || sortedApplications.length)} of {totalCount || sortedApplications.length} applications
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>

                <div className="text-xs text-slate-600 font-semibold px-2">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-slate-500 text-sm font-medium">Loading applications...</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}

// ─────────────────────────────────────────────
// ACTION BUTTON
// ─────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  blue: "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100/70 font-semibold",
  green: "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 font-bold",
  orange: "border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100/70 font-semibold",
  red: "border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100/70 font-semibold",
  disabled: "border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed font-medium opacity-60",
};

function ActionButton({
  label,
  color,
  loading,
  disabled,
  title,
  onClick,
}: {
  label: string;
  color: string;
  loading: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      title={title}
      className={`text-xs border px-3.5 py-1.5 rounded-lg transition-all shadow-2xs ${COLOR_MAP[color]}`}
    >
      {loading ? "..." : label}
    </button>
  );
}

// ─────────────────────────────────────────────
// BULK EMAIL MODAL
// ─────────────────────────────────────────────
interface BulkEmailModalProps {
  currentFilter: string;
  applications: Application[];
  onConfirm: (status: string, subject: string, body: string) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

function BulkEmailModal({
  currentFilter,
  applications,
  onConfirm,
  onCancel,
  loading,
}: BulkEmailModalProps) {
  const [status, setStatus] = useState(currentFilter === "all" ? "all" : currentFilter);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const targetCount = applications.filter((app) => {
    if (status === "all") return true;
    return app.status === status;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <h2 className="text-slate-900 font-bold text-lg mb-1">Send Bulk Email</h2>
        <p className="text-slate-600 text-sm mb-5">
          Send a custom email notification to applicants matching the selected status.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Recipient Group
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition font-medium"
            >
              <option value="all">All Applicants ({applications.length})</option>
              <option value="pending">Pending ({applications.filter((a) => a.status === "pending").length})</option>
              <option value="shortlisted">Shortlisted ({applications.filter((a) => a.status === "shortlisted").length})</option>
              <option value="rejection_review">Under Review ({applications.filter((a) => a.status === "rejection_review").length})</option>
              <option value="approved">Approved ({applications.filter((a) => a.status === "approved").length})</option>
              <option value="rejected">Rejected ({applications.filter((a) => a.status === "rejected").length})</option>
              <option value="archived">Archived ({applications.filter((a) => a.status === "archived").length})</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Message Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Write your message content..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          This message will be sent to <strong>{targetCount}</strong> applicant(s).
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm py-2.5 rounded-xl font-semibold transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={() => onConfirm(status, subject, body)}
            disabled={loading || !subject.trim() || !body.trim() || targetCount === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 shadow-xs"
          >
            {loading ? "Sending..." : "Send Bulk Email"}
          </button>
        </div>
      </div>
    </div>
  );
}