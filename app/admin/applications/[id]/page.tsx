"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import { useNavigationHistory } from "@/components/NavigationHistoryProvider";

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  address: string;
  hasID: string;
  idUrl?: string;
  idDocumentUrl?: string;
  idUploadedAt?: string;
  idType?: string;
  idFilename?: string;
  idMimeType?: string;
  kycStatus?: "pending" | "approved" | "rejected" | "none";
  kycRejectionReason?: string;
  businessName: string;
  isCoop: string;
  isCommunityMember: string;
  joinCoop: string;
  educationLevel: string;
  fieldOfStudy: string;
  graduationYear: string;
  institution: string;
  hasGoatExperience: string;
  goatExperienceRating: string;
  ownsGoatFarm: string;
  yearsOperated: string;
  highestAnimals: string;
  isDigitallyLiterate: string;
  digitalLiteracyRating: string;
  internetUsage: string;
  devices: string[];
  onlineTraining: string;
  platformExperience: string;
  toolConfidence: string;
  isBreadwinner: string;
  hasDependants: string;
  dependantsDetail: string;
  dependantsSchoolAge: string;
  hasDisabledInHousehold: string;
  disabledDetail: string;
  benefitedBefore: string;
  benefitedDetail: string;
  biggestChallenge: string[];
  whyJoin: string;
  hopesToAchieve: string;
  willingTraceability: string;
  hasAccess: string[];
  willingChampion: string;
  willingDonate: string;
  committedFullTraining: string;
  reference1: string;
  reference2: string;
  understandsCredit: boolean;
  declarationConfirmed: boolean;
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
  reviewNotes: string;
  rejectionReason: string;
  submittedAt: string;
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
    try {
      const res = await authFetch(`/applications/${app.id}/email`, {
        method: "POST",
        body: JSON.stringify({
          subject: `Action Required: Upload Government ID Document - ${app.firstName}`,
          body: `Dear ${app.firstName},\n\nYour application for the EEWYLA Programme is currently under review.\n\nTo complete your verification and shortlisting, please upload a clear copy of your Government ID document (NIN Card, Voter's Card, Driver's License, or International Passport) using the link below:\n\n${uploadLink}\n\nThank you,\nEEWYLA Selection Team\nOriyon International`,
        }),
      });

      if (res.ok) {
        setIdRequestSent(true);
      } else {
        window.location.href = `mailto:${app.email}?subject=${encodeURIComponent(`Action Required: Upload Government ID Document`)}&body=${encodeURIComponent(`Dear ${app.firstName},\n\nYour application for the EEWYLA Programme is under review. Please upload your Government ID document here:\n\n${uploadLink}\n\nThank you,\nEEWYLA Selection Team`)}`;
      }
    } catch {
      window.location.href = `mailto:${app.email}?subject=${encodeURIComponent(`Action Required: Upload Government ID Document`)}&body=${encodeURIComponent(`Dear ${app.firstName},\n\nYour application for the EEWYLA Programme is under review. Please upload your Government ID document here:\n\n${uploadLink}\n\nThank you,\nEEWYLA Selection Team`)}`;
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

export const hasUploadedID = (app: Application): boolean => {
  return Boolean(app.idDocumentUrl || app.idUrl || app.idUploadedAt);
};

// ─────────────────────────────────────────────
// LAYOUT COMPONENTS
// ─────────────────────────────────────────────
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-2xs">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-100">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | string[] | boolean | null | undefined;
}) {
  if (value === null || value === undefined || value === "") return null;
  const display = Array.isArray(value)
    ? value.join(", ") || "—"
    : typeof value === "boolean"
      ? value ? "Yes" : "No"
      : value;
  return (
    <div>
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-sm text-slate-800 font-semibold leading-relaxed">
        {display || "—"}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────
function ReviewModal({
  app, onConfirm, onCancel, loading,
}: {
  app: Application;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-slate-900 font-bold text-lg mb-1">Send to Review</h2>
        <p className="text-slate-600 text-sm mb-5">
          <span className="text-slate-900 font-semibold">{app.firstName} {app.lastName}</span>{" "}
          will be moved to <span className="text-orange-600 font-semibold">Under Review</span>.
        </p>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Reason for review
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Missing information, needs follow-up..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition resize-none"
        />
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm py-2.5 rounded-xl font-semibold transition">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 shadow-xs"
          >
            {loading ? "Moving..." : "Send to Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FinalRejectModal({
  app, onConfirm, onCancel, loading,
}: {
  app: Application;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
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
          placeholder="Provide a reason for rejection..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 transition resize-none"
        />
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm py-2.5 rounded-xl font-semibold transition">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 shadow-xs"
          >
            {loading ? "Rejecting..." : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  app, onConfirm, onCancel, loading,
}: {
  app: Application;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-slate-900 font-bold text-lg mb-1">Delete Application</h2>
        <p className="text-slate-600 text-sm mb-5">
          Permanently delete <span className="text-slate-900 font-semibold">{app.firstName} {app.lastName}</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm py-2.5 rounded-xl font-semibold transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 shadow-xs"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DirectEmailModalProps {
  app: Application;
  onConfirm: (subject: string, body: string) => void;
  onCancel: () => void;
  loading: boolean;
}

function DirectEmailModal({ app, onConfirm, onCancel, loading }: DirectEmailModalProps) {
  const [subject, setSubject] = useState(`Update regarding your EEWYLA Application - ${app.firstName}`);
  const [body, setBody]       = useState(`Dear ${app.firstName},\n\nWe are writing to update you regarding your application for the EEWYLA Programme...\n\nBest regards,\nEEWYLA Selection Team`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4 font-sora">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <h2 className="text-slate-900 font-bold text-lg mb-1">Send Direct Email</h2>
        <p className="text-slate-500 text-xs mb-4 font-medium">To: {app.email}</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition resize-none font-medium"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm py-2.5 rounded-xl font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(subject, body)}
            disabled={loading || !subject.trim() || !body.trim()}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 shadow-xs"
          >
            {loading ? "Sending..." : "Send Email"}
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
        setEmailSent(true);
      } else {
        window.location.href = `mailto:${app.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    } catch {
      window.location.href = `mailto:${app.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 font-sora text-left">
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
// MAIN DETAIL PAGE
// ─────────────────────────────────────────────
function ApplicationDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { goBack } = useNavigationHistory();
  const id = params?.id as string;
  const backFallback = `/admin/applications${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const [cohorts, setCohorts] = useState<{ id: string; name: string; state: string }[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedApprovedRole, setSelectedApprovedRole] = useState("");

  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFinalRejectModal, setShowFinalRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDirectEmailModal, setShowDirectEmailModal] = useState(false);
  const [showRequestIDModal, setShowRequestIDModal] = useState(false);
  const [showVerifyIDModal, setShowVerifyIDModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!selectedCohortId) {
      setGroups([]);
      setSelectedGroupId("");
      return;
    }
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const res = await authFetch(`/cohorts/${selectedCohortId}/groups`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.groups || [];
          setGroups(list);
        }
      } catch {} finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, [selectedCohortId]);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const [appRes, cohortsRes] = await Promise.all([
          authFetch(`/applications/${id}`),
          authFetch("/cohorts"),
        ]);
        if (!appRes.ok) {
          setError("Application not found");
          return;
        }
        const data = await appRes.json();
        
        let mergedApp = data;
        try {
          const userRes = await authFetch(`/users?search=${encodeURIComponent(data.email)}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            const userList = Array.isArray(userData) ? userData : userData.data || [];
            const matched = userList.find((u: any) => u.email?.toLowerCase().trim() === data.email.toLowerCase().trim());
            if (matched && (matched.idDocument || matched.idDocumentUrl || matched.idUploadedAt)) {
              mergedApp = {
                ...data,
                idDocumentUrl: data.idDocumentUrl || matched.idDocumentUrl || matched.idDocument,
                idType: data.idType || matched.idType,
                idFilename: data.idFilename || matched.idFilename,
                idMimeType: data.idMimeType || matched.idMimeType,
                idUploadedAt: data.idUploadedAt || matched.idUploadedAt,
                kycStatus: data.kycStatus || matched.kycStatus || "pending",
                userId: matched.id,
              };
            }
          }
        } catch {}

        setApp(mergedApp);
        setNotes(mergedApp.reviewNotes || "");

        if (cohortsRes.ok) {
          const cData = await cohortsRes.json();
          const cList = Array.isArray(cData) ? cData : cData.cohorts || [];
          setCohorts(cList);
        }
      } catch {
        setError("Failed to load application details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (app) {
      setSelectedApprovedRole(app.approvedRole || app.desiredRoleOption1 || "");
    }
  }, [app]);

  const updateStatus = async (status: string, extra: Record<string, string> = {}) => {
    if (!app) return;

    setActionLoading(true);
    setError("");

    const payload: Record<string, unknown> = { status };
    if (notes && notes.trim()) payload.reviewNotes = notes.trim();
    if (status === "approved") {
      if (selectedApprovedRole && selectedApprovedRole.trim()) payload.approvedRole = selectedApprovedRole.trim();
      if (selectedCohortId) payload.cohortId = selectedCohortId;
      if (selectedGroupId) payload.groupId = selectedGroupId;
    }
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
          : "Failed to update status";
        setError(errorMsg);
        return;
      }

      setApp((prev) => (prev ? { ...prev, ...data } : prev));
    } catch {
      setError("Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const rescueApplication = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/applications/${id}/rescue`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to rescue"); return; }
      setApp((prev) => (prev ? { ...prev, ...data } : prev));
    } catch {
      setError("Failed to rescue application.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteApplication = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/applications/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Delete failed");
        return;
      }
      goBack(backFallback);
    } catch {
      setError("Delete failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendDirectEmail = async (subject: string, body: string) => {
    setSendingEmail(true);
    setError("");
    setEmailSuccess("");

    try {
      const res = await authFetch(`/applications/${id}/email`, {
        method: "POST",
        body: JSON.stringify({ subject, body }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send email");
        return;
      }

      setEmailSuccess("Direct email sent successfully!");
      setShowDirectEmailModal(false);
    } catch {
      setError("Failed to send direct email.");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500 text-sm font-medium">Loading details...</div>;
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <p className="text-lg font-bold mb-2">Application not found</p>
        <button onClick={() => goBack(backFallback)} className="text-xs text-emerald-600 hover:underline">
          ← Back to applications
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto font-sora">
      {/* MODALS */}
      {showReviewModal && (
        <ReviewModal
          app={app}
          loading={actionLoading}
          onCancel={() => setShowReviewModal(false)}
          onConfirm={async (reason) => {
            await updateStatus("rejection_review", { rejectionReason: reason });
            setShowReviewModal(false);
          }}
        />
      )}

      {showFinalRejectModal && (
        <FinalRejectModal
          app={app}
          loading={actionLoading}
          onCancel={() => setShowFinalRejectModal(false)}
          onConfirm={async (reason) => {
            await updateStatus("rejected", { rejectionReason: reason });
            setShowFinalRejectModal(false);
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          app={app}
          loading={actionLoading}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={deleteApplication}
        />
      )}

      {showDirectEmailModal && (
        <DirectEmailModal
          app={app}
          loading={sendingEmail}
          onCancel={() => setShowDirectEmailModal(false)}
          onConfirm={handleSendDirectEmail}
        />
      )}

      {showRequestIDModal && (
        <RequestIDModal
          app={app}
          onClose={() => setShowRequestIDModal(false)}
        />
      )}

      {showVerifyIDModal && (
        <VerifyIDModal
          app={app}
          onClose={() => setShowVerifyIDModal(false)}
          onStatusUpdate={(updatedApp) => setApp(updatedApp)}
        />
      )}

      {/* HEADER BANNER */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <button onClick={() => goBack(backFallback)} className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition mb-2 inline-flex items-center gap-1">
            ← Back to Applications List
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {app.firstName} {app.lastName}
            </h1>
          </div>
          <p className="text-slate-500 text-sm mt-1 font-medium">{app.email} · {app.phone}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-2xs ${STATUS_STYLES[app.status]}`}>
            {STATUS_LABELS[app.status]}
          </span>
          {hasUploadedID(app) ? (
            <button
              type="button"
              onClick={() => setShowVerifyIDModal(true)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-2xs transition cursor-pointer ${
                app.kycStatus === "approved"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                  : app.kycStatus === "rejected"
                  ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                  : "bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100"
              }`}
              title="Click to view ID document, inspect, approve or reject KYC"
            >
              {app.kycStatus === "approved"
                ? "ID KYC Approved ✅ (View)"
                : app.kycStatus === "rejected"
                ? "ID KYC Rejected ❌ (View)"
                : "ID Uploaded 🔍 View & Verify →"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-2xs bg-rose-50 border-rose-200 text-rose-700">
                ID Missing ❌
              </span>
              <button
                type="button"
                onClick={() => setShowRequestIDModal(true)}
                className="bg-amber-50 border border-amber-300 text-amber-950 hover:bg-amber-100 text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1"
                title="Send ID Upload request link to candidate"
              >
                <span>📩 Request ID Upload</span>
              </button>
            </div>
          )}
          <button
            onClick={() => setShowDirectEmailModal(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-2xs"
          >
            ✉ Send Direct Email
          </button>
        </div>
      </div>

      {/* NOTIFICATION BANNERS */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-3 rounded-xl mb-6 flex items-center justify-between shadow-2xs font-medium">
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} className="text-rose-700 hover:text-rose-900 text-xs font-bold ml-4">
            Dismiss
          </button>
        </div>
      )}

      {emailSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl mb-6 flex items-center justify-between shadow-2xs font-medium">
          <span>✓ {emailSuccess}</span>
          <button onClick={() => setEmailSuccess("")} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* ACTIONS WORKSPACE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 mb-8 shadow-xs">
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-100">
          Admin Action Workspace
        </p>

        {/* Cohort and Track selectors */}
        {(app.status === "pending" || app.status === "shortlisted") && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Assign Cohort <span className="text-slate-400 font-normal">(required for approval)</span>
              </label>
              <select
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition w-full font-medium"
              >
                <option value="">— Select Cohort —</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Assign Group <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition w-full font-medium"
                disabled={loadingGroups || !selectedCohortId}
              >
                <option value="">
                  {loadingGroups ? "Loading..." : "— Select Group —"}
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Approved Track <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={selectedApprovedRole}
                onChange={(e) => setSelectedApprovedRole(e.target.value)}
                placeholder="e.g. Lead Livestock Trainer"
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition w-full font-medium"
              />
            </div>
          </div>
        )}

        {/* Notes textarea */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Internal Review Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Add internal notes about this applicant..."
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition w-full resize-none font-medium"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {app.status === "pending" && (
            <>
              <button
                onClick={() => updateStatus("shortlisted")}
                disabled={!!actionLoading}
                title="Shortlist application"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? "Processing..." : "Shortlist (Pre-approve)"}
              </button>

              <button
                onClick={() => updateStatus("approved")}
                disabled={!!actionLoading}
                title="Approve application"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? "Processing..." : "Approve Application"}
              </button>

              {!hasUploadedID(app) && (
                <button
                  type="button"
                  onClick={() => {
                    const uploadLink = `https://www.oriyoninternational.com/auth/setup/id-upload?email=${encodeURIComponent(app.email)}`;
                    const subject = encodeURIComponent(`Action Required: Upload Government ID for EEWYLA Shortlisting`);
                    const body = encodeURIComponent(`Dear ${app.firstName},\n\nYour application for the EEWYLA Programme is currently under review.\n\nTo proceed with shortlisting your application, please upload a valid copy of your Government ID (NIN, Voter's Card, License, or Passport) here:\n${uploadLink}\n\nThank you,\nEEWYLA Selection Team`);
                    window.location.href = `mailto:${app.email}?subject=${subject}&body=${body}`;
                  }}
                  className="bg-amber-50 border border-amber-300 text-amber-950 hover:bg-amber-100 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                  title="Send ID Upload reminder email to candidate"
                >
                  <span>📩 Request ID Upload from Candidate</span>
                </button>
              )}

              <button
                onClick={() => setShowReviewModal(true)}
                disabled={!!actionLoading}
                className="bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-2xs"
              >
                Send to Review
              </button>

              <button
                onClick={() => setShowFinalRejectModal(true)}
                disabled={!!actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                Reject Application
              </button>
            </>
          )}

          {app.status === "shortlisted" && (
            <>
              <button
                onClick={() => updateStatus("approved")}
                disabled={!!actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Approve Application"}
              </button>

              <button
                onClick={() => setShowReviewModal(true)}
                disabled={!!actionLoading}
                className="bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-2xs"
              >
                Send to Review
              </button>

              <button
                onClick={() => setShowFinalRejectModal(true)}
                disabled={!!actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                Reject Application
              </button>
            </>
          )}

          {app.status === "rejection_review" && (
            <>
              <button
                onClick={rescueApplication}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs"
              >
                ↩ Rescue to Pending
              </button>

              <button
                onClick={() => setShowFinalRejectModal(true)}
                disabled={actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs"
              >
                Reject Finally
              </button>
            </>
          )}

          {app.status === "rejected" && (
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={actionLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs"
            >
              🗑 Delete Application
            </button>
          )}

          {app.status === "approved" && (
            <>
              <button
                onClick={() => setShowReviewModal(true)}
                disabled={actionLoading}
                className="bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-2xs"
              >
                Move back to Review
              </button>
              <button
                onClick={() => setShowFinalRejectModal(true)}
                disabled={!!actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                Reject Application
              </button>
            </>
          )}
        </div>
      </div>

      {/* DETAIL SECTIONS */}
      <div className="flex flex-col gap-5">
        <Section title="ID & Verification Details">
          <Field label="Self-Declared ID Status" value={app.hasID} />
          <Field label="ID Document Verification" value={hasUploadedID(app) ? "Uploaded & Verified ✅" : "Document Missing ❌"} />
          {!hasUploadedID(app) && (
            <div className="mt-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-amber-950 uppercase tracking-wider">⚠️ Government ID Document Missing</p>
                <p className="text-xs text-amber-800 font-medium mt-0.5 leading-relaxed">
                  This applicant cannot be shortlisted until their Government ID document is uploaded. Send an instant upload request link to {app.firstName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestIDModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>📩 Request ID Upload</span>
              </button>
            </div>
          )}
          {hasUploadedID(app) && (
            <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Government ID Verification & KYC
                </p>
                <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                  Status: <span className="font-bold text-slate-800">{app.kycStatus === "approved" ? "Approved ✅" : app.kycStatus === "rejected" ? "Rejected ❌" : "Pending Verification ⏳"}</span>
                  {app.kycRejectionReason && ` · Reason: ${app.kycRejectionReason}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyIDModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>🔍 View, Approve or Reject ID Document →</span>
              </button>
            </div>
          )}
        </Section>

        <Section title="Personal Information">
          <Field label="Full Name" value={`${app.firstName} ${app.lastName}`} />
          <Field label="Age" value={app.age} />
          <Field label="Gender" value={app.gender} />
          <Field label="Phone" value={app.phone} />
          <Field label="Email" value={app.email} />
          <Field label="Address" value={app.address} />
          <Field label="Business Name" value={app.businessName} />
          <Field label="Co-op Member" value={app.isCoop} />
          <Field label="Community Member" value={app.isCommunityMember} />
          <Field label="Join EEWYLA Co-op" value={app.joinCoop} />
          {app.desiredRoleOption1 && <Field label="Desired Track Option 1" value={app.desiredRoleOption1} />}
          {app.desiredRoleOption2 && <Field label="Desired Track Option 2" value={app.desiredRoleOption2} />}
          {app.approvedRole && <Field label="Approved Track" value={app.approvedRole} />}
        </Section>

        <Section title="Education">
          <Field label="Education Level" value={app.educationLevel} />
          <Field label="Field of Study" value={app.fieldOfStudy} />
          <Field label="Graduation Year" value={app.graduationYear} />
          <Field label="Institution" value={app.institution} />
        </Section>

        <Section title="Livestock & Farm Experience">
          <Field label="Has Goat Experience" value={app.hasGoatExperience} />
          <Field label="Experience Rating" value={app.goatExperienceRating} />
          <Field label="Owns Goat Farm" value={app.ownsGoatFarm} />
          <Field label="Years Operated" value={app.yearsOperated} />
          <Field label="Highest Herd Size" value={app.highestAnimals} />
        </Section>

        <Section title="Digital Readiness">
          <Field label="Digitally Literate" value={app.isDigitallyLiterate} />
          <Field label="Literacy Rating" value={app.digitalLiteracyRating} />
          <Field label="Internet Usage Frequency" value={app.internetUsage} />
          <Field label="Accessible Devices" value={app.devices} />
          <Field label="Completed Online Training Before" value={app.onlineTraining} />
          <Field label="Platform Experience" value={app.platformExperience} />
          <Field label="Tool Confidence" value={app.toolConfidence} />
        </Section>

        <Section title="Socioeconomic Context">
          <Field label="Primary Household Breadwinner" value={app.isBreadwinner} />
          <Field label="Has Dependants" value={app.hasDependants} />
          <Field label="Dependants Details" value={app.dependantsDetail} />
          <Field label="School-Age Dependants" value={app.dependantsSchoolAge} />
          <Field label="Disabled Household Members" value={app.hasDisabledInHousehold} />
          <Field label="Disability Details" value={app.disabledDetail} />
          <Field label="Benefited from Similar Project" value={app.benefitedBefore} />
          <Field label="Previous Project Details" value={app.benefitedDetail} />
        </Section>

        <Section title="Program Motivation & Commitment">
          <Field label="Key Challenges Experienced" value={app.biggestChallenge} />
          <Field label="Why Join EEWYLA" value={app.whyJoin} />
          <Field label="Hopes to Achieve" value={app.hopesToAchieve} />
          <Field label="Willing to Participate in Traceability" value={app.willingTraceability} />
          <Field label="Resources / Infrastructure Access" value={app.hasAccess} />
          <Field label="Willing to Champion Community Group" value={app.willingChampion} />
          <Field label="Willing to Donate Time / Space" value={app.willingDonate} />
          <Field label="Committed to Full Training Schedule" value={app.committedFullTraining} />
          <Field label="Understands Credit Structure" value={app.understandsCredit} />
          <Field label="Declaration Confirmed" value={app.declarationConfirmed} />
        </Section>

        {(app.reference1 || app.reference2) && (
          <Section title="References">
            <Field label="Reference 1" value={app.reference1} />
            <Field label="Reference 2" value={app.reference2} />
          </Section>
        )}
      </div>
    </div>
  );
}

export default function ApplicationDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-slate-500 text-sm font-medium">Loading details...</div>}>
      <ApplicationDetailContent />
    </Suspense>
  );
}