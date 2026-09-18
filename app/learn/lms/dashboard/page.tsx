"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { authFetch, refreshAccessToken, getApiBase } from "@/lib/api";
import { popup } from "@/components/layout/PopupProvider";
import PracticalDayModal from "@/components/lms/PracticalDayModal";
import { getStoredPracticalCheckins, fetchAndSyncUserPracticalCheckins } from "@/lib/practicalData";
import {
  getPhysicalSiteById,
  inferPhysicalSiteFromInstitutionOrLga,
  getGroupPracticalDay,
  PhysicalSite,
} from "@/lib/sitesData";

const API_BASE = getApiBase();

interface ApiWeek {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  isPublished: boolean;
  requiresQuizPass: boolean;
  unlockDate?: string | null;
  lessons?: { id: string; title?: string }[];
}

interface Progress {
  lessonId: string;
  weekId: string;
  completed: boolean;
}

interface IdMeta {
  hasDocument: boolean;
  idType: string | null;
  idFilename: string | null;
  idMimeType: string | null;
  idUploadedAt: string | null;
  kycStatus: string | null;
  kycRejectionReason: string | null;
}

interface DashboardHeaderProps {
  firstName: string;
  userPassportPicture?: string;
  authPassport?: string;
  isCooperativeOnly: boolean;
  hasCohort: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  coopDetails: any;
  coordHref: string;
  idMeta: IdMeta | null;
  userRole?: string;
  unreadCount?: number;
  announcements?: any[];
  onSelectAnnouncement?: (ann: any) => void;
  readAnnouncementIds?: string[];
  handleLogout: () => void;
}

function DashboardHeader({
  firstName,
  userPassportPicture,
  authPassport,
  isCooperativeOnly,
  hasCohort,
  activeTab,
  setActiveTab,
  coopDetails,
  coordHref,
  idMeta,
  userRole,
  unreadCount,
  announcements,
  onSelectAnnouncement,
  readAnnouncementIds,
  handleLogout,
}: DashboardHeaderProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        {/* BRAND LOGO & TITLE */}
        <div className="flex items-center gap-4">
          <Link href="/learn/lms/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-2xs group-hover:scale-105 transition">
              E
            </div>
            <div>
              <p className="text-slate-900 text-sm font-black tracking-tight leading-none">EEWYLA LMS</p>
              <p className="text-emerald-700 text-[10px] uppercase tracking-widest font-bold mt-0.5">Trainee Portal</p>
            </div>
          </Link>

          {/* TABS (DESKTOP) */}
          {hasCohort && (
            <div className="hidden lg:flex items-center gap-1 ml-6 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
              {(["overview", "curriculum", "cooperative"] as const).map((tab) => {
                if (tab === "cooperative" && !coopDetails) return null;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === tab
                        ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    <span>{tab}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-3">
          {/* NOTIFICATION BELL */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition flex items-center justify-center cursor-pointer relative shadow-2xs"
              title="Portal Notifications"
            >
              <span>🔔</span>
              {unreadCount && unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-600 text-white text-[9px] font-black rounded-full shadow-2xs animate-pulse">
                  {unreadCount}
                </span>
              ) : null}
            </button>

            {/* Dropdown Menu */}
            {showNotifDropdown && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 font-sans"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔔</span>
                    <span className="font-extrabold text-xs text-slate-900">Portal Notifications</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                    {unreadCount || 0} unread
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                  {(!announcements || announcements.length === 0) ? (
                    <div className="p-6 text-center text-xs text-slate-400 italic">No notifications yet.</div>
                  ) : (
                    announcements.slice(0, 10).map((a, idx) => {
                      const isUnread = !readAnnouncementIds?.includes(a.id || `${a.title}_${a.createdAt}`);
                      return (
                        <div
                          key={a.id || idx}
                          onClick={() => {
                            setShowNotifDropdown(false);
                            onSelectAnnouncement?.(a);
                          }}
                          className={`p-3.5 hover:bg-emerald-50/50 transition cursor-pointer flex items-start gap-2.5 ${
                            isUnread ? "bg-emerald-50/30 font-medium" : "bg-white"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isUnread ? "bg-rose-600 animate-pulse" : "bg-slate-300"}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 line-clamp-1">{a.title}</span>
                              {isUnread && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-rose-100 text-rose-700 shrink-0">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{a.content}</p>
                            <p className="text-[9px] text-slate-400 mt-1 font-semibold">
                              {new Date(a.createdAt || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} • {a.postedBy || "Admin"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setShowNotifDropdown(false);
                      setActiveTab("announcements");
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    View All Announcements →
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/learn/lms/community"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-extrabold hover:bg-emerald-800 transition shadow-2xs"
          >
            💬 <span className="hidden xs:inline">Live</span> Community Q&A
          </Link>

          <Link
            href="/learn/lms/tutorials"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
          >
            🎥 Video Guides
          </Link>

          {coordHref && (
            <Link
              href={coordHref}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
            >
              🛡️ Coordinator Panel →
            </Link>
          )}

          {(userRole === "trainer" || userRole === "lead_trainer") && (
            <Link
              href="/learn/lms/profile"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-extrabold hover:bg-purple-100 transition shadow-2xs"
            >
              🎓 Trainer Profile & Specialization
            </Link>
          )}

          {idMeta && (
            <>
              {idMeta.kycStatus === "approved" ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  ID Verified
                </span>
              ) : idMeta.kycStatus === "rejected" ? (
                <button
                  onClick={() => router.push("/learn/lms/upload-id")}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition cursor-pointer shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  ID Rejected
                </button>
              ) : idMeta.kycStatus === "pending" ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  ID Under Review
                </span>
              ) : (
                <button
                  onClick={() => router.push("/learn/lms/upload-id")}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition cursor-pointer shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Upload ID
                </button>
              )}
            </>
          )}

          {/* USER PROFILE DROPDOWN MENU */}
          <div className="relative pl-2 border-l border-slate-200/80">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100/80 transition cursor-pointer border border-transparent hover:border-slate-200/80"
            >
              {userPassportPicture || authPassport ? (
                <img
                  src={userPassportPicture || authPassport}
                  alt={firstName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500 shadow-2xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs">
                  {firstName[0]}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-slate-900 text-xs font-bold leading-tight">{firstName}</p>
                <p className="text-slate-500 text-[10px] font-semibold">
                  {userRole === "trainer" || userRole === "lead_trainer"
                    ? "Trainer"
                    : isCooperativeOnly
                    ? "Coop Member"
                    : "Trainee"}
                </p>
              </div>
              <span className="text-slate-400 text-xs hidden sm:inline">▾</span>
            </button>

            {profileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 divide-y divide-slate-100 font-sora">
                  <div className="px-4 py-2.5">
                    <p className="text-xs font-black text-slate-900">{firstName}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">{isCooperativeOnly ? "Cooperative Member" : "Trainee Account"}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/learn/lms/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                    >
                      {userRole === "trainer" || userRole === "lead_trainer"
                        ? "🎓 Trainer Profile & Specialization"
                        : "👤 My Profile & Passport Photo"}
                    </Link>

                    <Link
                      href="/learn/lms/community"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                    >
                      💬 Trainee Q&A & Live Room
                    </Link>

                    <Link
                      href="/learn/lms/tutorials"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                    >
                      🎥 Platform Tutorials
                    </Link>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function TraineeDashboardContent() {
  const router      = useRouter();

  const [firstName, setFirstName]     = useState("Trainee");
  const [userId, setUserId]           = useState("");
  const [userRole, setUserRole]       = useState("");
  const [coordHref, setCoordHref]     = useState("");
  const [cohortName, setCohortName]   = useState("");
  const [cohortState, setCohortState] = useState("");
  const [groupName, setGroupName]     = useState("");
  const [groupId, setGroupId]         = useState("");
  const [cohortId, setCohortId]       = useState("");
  const [practicalDay, setPracticalDay] = useState("");
  const [assignedSite, setAssignedSite] = useState<PhysicalSite | null>(null);
  const [weeks, setWeeks]             = useState<ApiWeek[]>([]);
  const [progress, setProgress]       = useState<Progress[]>([]);
  const [passedWeekIds, setPassedWeekIds] = useState<Set<string>>(new Set());
  const [idMeta, setIdMeta]           = useState<IdMeta | null>(null);
  const [ready, setReady]             = useState(false);
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get("tab") || "overview";
  const activeTab = ["overview", "announcements", "curriculum", "cooperative", "media"].includes(activeTabParam) ? activeTabParam : "overview";
  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };
  const [hasCohort, setHasCohort]     = useState(false);
  const [coopDetails, setCoopDetails] = useState<any>(null);
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string; allowDownload: boolean } | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [readAnnouncementIds, setReadAnnouncementIds]   = useState<string[]>([]);
  const [announcementSearchTerm, setAnnouncementSearchTerm] = useState("");
  const [announcementFilter, setAnnouncementFilter]     = useState<"all" | "unread" | "pinned">("all");
  const [trainerSchedules, setTrainerSchedules] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("oriyon_read_announcements_v1");
      if (raw) setReadAnnouncementIds(JSON.parse(raw));
    } catch {}
  }, []);

  const handleSelectAnnouncement = (item: any) => {
    setSelectedAnnouncement(item);
    const id = item.id || `${item.title}_${item.createdAt}`;
    if (!readAnnouncementIds.includes(id)) {
      const updated = [...readAnnouncementIds, id];
      setReadAnnouncementIds(updated);
      try {
        localStorage.setItem("oriyon_read_announcements_v1", JSON.stringify(updated));
      } catch {}
    }
  };

  const unreadAnnouncementsCount = useMemo(() => {
    return announcements.filter((a) => {
      const id = a.id || `${a.title}_${a.createdAt}`;
      return !readAnnouncementIds.includes(id);
    }).length;
  }, [announcements, readAnnouncementIds]);

  useEffect(() => {
    if (viewingDoc || selectedAnnouncement) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [viewingDoc, selectedAnnouncement]);

  const openDocument = (title: string, url: string, allowDownload: boolean) => {
    const isIOS = typeof window !== "undefined" && 
      (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
       (navigator.userAgent.includes("Mac") && "ontouchend" in document));

    if (isIOS) {
      window.open(url, "_blank");
    } else {
      setViewingDoc({ title, url, allowDownload });
    }
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoadingAnnouncements(true);
      let list: any[] = [];

      // 1. Fetch global/broadcast announcements from server
      try {
        const res = await authFetch("/cooperative/announcements/broadcast");
        if (res.ok) {
          const data = await res.json();
          const serverBroadcasts = Array.isArray(data) ? data : data.announcements || data.data || [];
          list = [...serverBroadcasts];
        }
      } catch (err) {
        console.error("Failed to load broadcast announcements from server", err);
      }

      // 2. Fetch cooperative-specific announcements if available
      if (coopDetails?.cooperativeId) {
        try {
          const res = await authFetch(`/cooperative/${coopDetails.cooperativeId}/announcements`);
          if (res.ok) {
            const data = await res.json();
            const coopList = Array.isArray(data) ? data : [];
            const existingIds = new Set(list.map((a) => a.id));
            for (const ca of coopList) {
              if (!existingIds.has(ca.id)) list.push(ca);
            }
          }
        } catch (err) {
          console.error("Failed to load cooperative announcements", err);
        }
      }

      // Filter list based on target audience and user role
      const authUser = useAuthStore.getState().user;
      const authToken = useAuthStore.getState().accessToken;
      const tokenPayload = authToken ? (() => {
        try { return JSON.parse(atob(authToken.split(".")[1])); } catch { return null; }
      })() : null;

      const currentUserRole = authUser?.role || tokenPayload?.role || "trainee";
      const isTrainerUser = currentUserRole === "trainer" || currentUserRole === "lead_trainer";
      const isAdminUser = currentUserRole === "admin" || currentUserRole === "sub_admin";

      const filteredList = list.filter((a) => {
        if (isAdminUser) return true;
        if (isTrainerUser) {
          return a.level === "trainers" || a.targetAudience === "trainers" || a.level === "global" || a.targetAudience === "all" || !a.targetAudience;
        }
        // Trainees see all non-trainer notices
        return a.level !== "trainers" && a.targetAudience !== "trainers";
      });

      // Sort pinned announcements first, then newest first
      filteredList.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      setAnnouncements(filteredList);
      setLoadingAnnouncements(false);
    };

    fetchAnnouncements();
  }, [coopDetails?.cooperativeId]);
  const [payments, setPayments]       = useState<any[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [coopError, setCoopError] = useState("");
  const [coopSuccess, setCoopSuccess] = useState(false);
  const [isCooperativeOnly, setIsCooperativeOnly] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const authPassport = useAuthStore((s) => s.user?.passportPicture);
  const [userPassportPicture, setUserPassportPicture] = useState("");

  const handlePrintReceipt = async (payment: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      await popup.alert("Please allow popups to download/print receipts.");
      return;
    }

    const paymentTypeLabel = payment.reference.startsWith("COOP-PAY-") 
      ? "Cooperative Registration Fee" 
      : "Monthly Contribution";

    const formattedAmount = (payment.amount / 100).toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN"
    });

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Oriyon Cooperative Receipt - ${payment.reference}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            line-height: 1.5;
            padding: 40px;
            max-width: 650px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 18px;
            font-weight: 800;
            color: #10b981;
            letter-spacing: -0.02em;
          }
          .receipt-title {
            text-align: right;
          }
          .receipt-title h1 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
          }
          .receipt-title p {
            margin: 5px 0 0 0;
            font-size: 11px;
            color: #64748b;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .details-block h3 {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin: 0 0 8px 0;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 5px;
            font-weight: 750;
          }
          .details-block p {
            margin: 4px 0;
            font-size: 12px;
          }
          .details-block .value {
            font-weight: 600;
            color: #0f172a;
          }
          .receipt-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .receipt-table th {
            background-color: #f8fafc;
            text-align: left;
            padding: 10px 14px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            border-bottom: 1px solid #e2e8f0;
          }
          .receipt-table td {
            padding: 14px;
            font-size: 12px;
            border-bottom: 1px solid #f1f5f9;
          }
          .amount-row td {
            font-weight: 700;
            font-size: 14px;
            color: #0f172a;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            border-bottom: 2px solid #e2e8f0;
          }
          .footer {
            text-align: center;
            margin-top: 60px;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
          }
          .seal {
            margin-top: 10px;
            font-weight: 700;
            color: #10b981;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-size: 11px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">ORIYON INTERNATIONAL COOPERATIVE</div>
          <div class="receipt-title">
            <h1>PAYMENT RECEIPT</h1>
            <p>Ref: ${payment.reference}</p>
          </div>
        </div>

        <div class="details-grid">
          <div class="details-block">
            <h3>Member Information</h3>
            <p><span class="value">${coopDetails.firstName || ""} ${coopDetails.lastName || ""}</span></p>
            <p>Member ID: <span class="value">${coopDetails.memberId || "Pending"}</span></p>
            <p>Email: ${coopDetails.email || "N/A"}</p>
            <p>Phone: ${coopDetails.phone || "N/A"}</p>
          </div>
          <div class="details-block">
            <h3>Cooperative Details</h3>
            <p><span class="value">${coopDetails.cooperativeName || "N/A"}</span></p>
            <p>LGA: ${coopDetails.lga || "N/A"}</p>
            <p>State: ${cohortState || "Oyo State"}</p>
            <p>Date Paid: ${new Date(payment.createdAt).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
            })}</p>
          </div>
        </div>

        <table class="receipt-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Status</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span style="font-weight: 600; color: #0f172a;">${paymentTypeLabel}</span><br/>
                <span style="font-size: 10px; color: #64748b;">Payment via Paystack Gateway</span>
              </td>
              <td>
                <span style="font-weight: 700; color: #059669; font-size: 10px; text-transform: uppercase;">SUCCESSFUL</span>
              </td>
              <td style="text-align: right; font-weight: 600;">${formattedAmount}</td>
            </tr>
            <tr class="amount-row">
              <td colspan="2">Total Paid</td>
              <td style="text-align: right;">${formattedAmount}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Thank you for your active participation and commitment to our cooperative program.</p>
          <div class="seal">✓ OFFICIAL PAYMENT RECORD</div>
          <p style="margin-top: 20px; font-size: 8px; color: #cbd5e1;">Generated on ${new Date().toLocaleString()} · This is a computer generated receipt, no signature required.</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  // Dynamically load Paystack Inline JS script on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const refresh = localStorage.getItem("refreshToken");
        if (!refresh) return router.replace("/learn/lms");

        let token =
          useAuthStore.getState().accessToken ||
          (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

        if (!token && refresh) {
          try {
            token = await refreshAccessToken();
          } catch {
            return router.replace("/learn/lms");
          }
        }

        if (!token) return router.replace("/learn/lms");
        useAuthStore.getState().setAccessToken(token);

        const payload = JSON.parse(atob(token.split(".")[1]));
        const userRole = payload.role || "trainee";
        const allowedRoles = ["trainee", "coordinator", "state_coordinator", "zonal_coordinator", "lga_coordinator", "admin", "sub_admin", "trainer", "lead_trainer", "cooperative", "corper"];
        if (payload.role && !allowedRoles.includes(payload.role)) return router.replace("/learn/lms");

        const uid = payload.userId || payload.sub || payload.id;
        if (!uid) return router.replace("/learn/lms");
        setUserId(uid);
        setUserRole(userRole);

        // Fetch initial dashboard dependencies concurrently using Promise.all to eliminate sequential waterfall
        const [userResRaw, idMetaResRaw, cohortResRaw, weeksResRaw, progressResRaw] = await Promise.all([
          authFetch(`/users/${uid}`),
          authFetch(`/users/${uid}/id-document/meta`),
          authFetch(`/cohorts`),
          authFetch(`/lms/weeks`),
          authFetch(`/lms/progress/${uid}`),
        ]);

        let userRes = userResRaw;
        let idMetaRes = idMetaResRaw;

        if (!userRes.ok && userRes.status === 401) {
          try {
            const newToken = await refreshAccessToken();
            if (newToken) {
              userRes = await authFetch(`/users/${uid}`);
              idMetaRes = await authFetch(`/users/${uid}/id-document/meta`);
            }
          } catch {
            return router.replace("/learn/lms");
          }
        }

        const user = userRes.ok ? await userRes.json() : {};
        const userFirstName = user.firstName || user.first_name || payload.firstName || payload.name || "Trainee";
        const userLastName = user.lastName || user.last_name || payload.lastName || "";
        setFirstName(userFirstName);
        setIsCooperativeOnly(user.isCooperativeOnly ?? false);
        setUserEmail(user.email || payload.email || "");
        setUserPhone(user.phone || "");
        setUserFullName(`${userFirstName} ${userLastName}`.trim());
        setUserAddress(user.address || "");
        const savedLocalPassport = typeof window !== "undefined" ? localStorage.getItem(`userPassportPicture_${uid}`) : null;
        const dbPassport = user.passportPicture || user.passportUrl || user.avatarUrl || user.photo || (user as any).passport_picture || (user as any).passport_url || (user as any).avatar_url || savedLocalPassport || "";
        if (dbPassport) {
          setUserPassportPicture(dbPassport);
          if (typeof window !== "undefined") {
            localStorage.setItem(`userPassportPicture_${uid}`, dbPassport);
          }
        }
        const resolvedPassport = dbPassport;
        let fetchedIdMeta: IdMeta | null = null;
        if (idMetaRes.ok) {
          fetchedIdMeta = await idMetaRes.json();
          setIdMeta(fetchedIdMeta);
        }

        // Resolve Physical Site (User physicalSiteId or Option A auto-matched site)
        const siteObj = getPhysicalSiteById(user.physicalSiteId || user.siteId) || inferPhysicalSiteFromInstitutionOrLga(user.institution, user.assignedLga || user.lga);
        setAssignedSite(siteObj);

        // Check if database coordinates differ from token payload (stale JWT)
        const tokenLga = payload.assignedLga || null;
        const tokenState = payload.assignedState || null;
        const tokenZone = payload.assignedZone || null;
        const tokenRole = payload.role || null;

        const dbLga = user.assignedLga || null;
        const dbState = user.assignedState || null;
        const dbZone = user.assignedZone || null;
        const dbRole = user.role || null;

        const isStale = userRes.ok && ((tokenLga !== dbLga) || (tokenState !== dbState) || (tokenZone !== dbZone) || (tokenRole !== dbRole));

        if (isStale) {
          console.log("Session token is stale, silently refreshing access token...");
          try {
            await refreshAccessToken();
          } catch (refreshErr) {
            console.error("Silent token refresh failed:", refreshErr);
          }
        }

        const hasCoordAssignment = !!(dbState || dbLga || dbZone || dbRole === "coordinator");
        if (hasCoordAssignment) {
          if (dbState) {
            setCoordHref("/admin/cooperative/state");
          } else if (dbZone) {
            setCoordHref("/admin/cooperative/zone");
          } else {
            setCoordHref("/admin/cooperative/coordinator");
          }
        }

        let resolvedCohort =
          user.cohortId ||
          (typeof user.cohort === "string" ? user.cohort : undefined) ||
          user.cohort?.id ||
          user.cohort?._id ||
          (Array.isArray(user.cohorts) && user.cohorts.length > 0
            ? typeof user.cohorts[0] === "string" ? user.cohorts[0] : user.cohorts[0]?.id || user.cohorts[0]?._id
            : undefined) ||
          (Array.isArray(user.cohortMembers) && user.cohortMembers.length > 0
            ? user.cohortMembers[0]?.cohortId || user.cohortMembers[0]?.cohort?.id
            : undefined) ||
          "";

        // All trainees (Cohort 1, 2, 3) access the first batch of online lessons immediately
        setHasCohort(true);

        const cohortRes = cohortResRaw;
        const weeksRes = weeksResRaw;
        const progressRes = progressResRaw;

        if (cohortRes.ok) {
          const cohorts = await cohortRes.json();
          if (Array.isArray(cohorts) && cohorts.length > 0) {
            const match = cohorts.find((c: any) => c.id === resolvedCohort) || cohorts[0];
            if (match) {
              setCohortName(match.name || "Cohort 1");
              setCohortState(match.state || "Oyo State");
              if (!resolvedCohort) {
                resolvedCohort = match.id;
                setCohortId(match.id);
              } else {
                setCohortId(resolvedCohort);
              }
            }
          }
        }

        if (resolvedCohort) {
          const groupsRes = await authFetch(`/cohorts/${resolvedCohort}/groups`);
          if (groupsRes.ok) {
            const allGroups = await groupsRes.json();
            if (Array.isArray(allGroups)) {
              const userGroup = allGroups.find((g: any) =>
                (g.members || []).some((m: any) => m.id === uid || m.userId === uid)
              );
              if (userGroup) {
                setGroupId(userGroup.id || "");
                setGroupName(userGroup.name || "");
                setPracticalDay(userGroup.practicalDay || getGroupPracticalDay(userGroup.name));
              }
            }
          }
        }

        if (weeksRes.ok) {
          const data = await weeksRes.json();
          const isStaff = user?.role === "admin" || user?.role === "trainer" || user?.role === "lead_trainer";
          setWeeks(
            Array.isArray(data)
              ? data
                  .filter((w) => w.isPublished)
                  .map((w) => ({
                    ...w,
                    lessons: Array.isArray(w.lessons)
                      ? w.lessons.filter((l: any) => isStaff || l.isPublished !== false)
                      : [],
                  }))
                  .sort((a, b) => a.weekNumber - b.weekNumber)
              : []
          );
        }

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setProgress(Array.isArray(progressData) ? progressData : []);
        }

        try {
          const passedRes = await authFetch(`/lms/quizzes/user/${user.id}/passed`);
          if (passedRes.ok) {
            const passedData = await passedRes.json();
            if (Array.isArray(passedData.passedWeekIds)) {
              setPassedWeekIds(new Set(passedData.passedWeekIds));
            }
          }
        } catch {}

        // Sync verified practical checkins from server
        await fetchAndSyncUserPracticalCheckins(user.id);

        // Always check cooperative membership status in the background
        if (user.email) {
          const [coopRes, paymentsRes] = await Promise.all([
            authFetch("/cooperative/members/me"),
            authFetch("/cooperative/members/me/payments"),
          ]);
          if (coopRes.ok) {
            const coopData = await coopRes.json();
            setCoopDetails(coopData);
          }
          if (paymentsRes.ok) {
            const paymentsData = await paymentsRes.json();
            setPayments(Array.isArray(paymentsData) ? paymentsData : []);
          }
        }

        // Fetch Trainer Practical Teaching Schedules if user is a Trainer
        if (userRole === "trainer" || userRole === "lead_trainer" || (user as any)?.role === "trainer" || (user as any)?.role === "lead_trainer") {
          try {
            const schedRes = await authFetch("/trainers/my-schedules");
            if (schedRes.ok) {
              const schedData = await schedRes.json();
              setTrainerSchedules(Array.isArray(schedData) ? schedData : []);
            }
          } catch (err) {
            console.warn("Trainer schedules fetch error:", err);
          }
        }

        // Check Mandatory Onboarding Steps (Government ID & Passport Photo)
        const hasGovId = fetchedIdMeta?.hasDocument || !!user?.idDocumentUrl || !!user?.idDocument || !!(user as any)?.id_document || !!(user as any)?.id_uploaded_at;
        const hasPassport = Boolean(dbPassport);

        if (!hasGovId) {
          router.replace("/learn/lms/upload-id?mandatory=true");
          return;
        }

        if (!hasPassport) {
          router.replace("/learn/lms/profile?mandatory=true");
          return;
        }
      } catch {
        router.replace("/learn/lms");
      } finally {
        setReady(true);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refreshToken");
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    useAuthStore.getState().logout();
    router.push("/learn/lms");
  };

  const handlePayCooperative = async (paymentType: "registration" | "contribution" = "registration") => {
    if (!coopDetails || !coopDetails.id) return;
    setPaymentLoading(true);
    setCoopError("");

    try {
      // 1. Initialize payment on backend
      const payInitRes = await fetch(`${API_BASE}/cooperative/payment/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: coopDetails.id, paymentType }),
      });

      const payInitData = await payInitRes.json();
      if (!payInitRes.ok) {
        throw new Error(payInitData.error || "Failed to initialize payment.");
      }

      // 2. Open Paystack Inline Pop
      if (typeof window === "undefined" || !(window as any).PaystackPop) {
        throw new Error("Payment gateway could not be loaded. Please refresh the page and try again.");
      }

      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_live_ae70c3f282f0e83f62e446d83c12ad4d7a95b40f";

      const handler = (window as any).PaystackPop.setup({
        key: paystackKey,
        email: coopDetails.email || "member@oriyoninternational.com",
        amount: payInitData.amount * 100, // in kobo
        ref: payInitData.reference,
        callback: function (response: any) {
          (async () => {
            try {
              setPaymentLoading(true);
              const verifyRes = await fetch(`${API_BASE}/cooperative/payment/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reference: response.reference }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.status === "success") {
                setCoopSuccess(true);
                // Fetch latest details and payments to update state
                const [updatedRes, paymentsRes] = await Promise.all([
                  authFetch("/cooperative/members/me"),
                  authFetch("/cooperative/members/me/payments"),
                ]);
                if (updatedRes.ok) {
                  setCoopDetails(await updatedRes.json());
                }
                if (paymentsRes.ok) {
                  const paymentsData = await paymentsRes.json();
                  setPayments(Array.isArray(paymentsData) ? paymentsData : []);
                }
              } else {
                setCoopError(verifyData.message || "Payment verification failed. Please contact support.");
              }
            } catch (err) {
              setCoopError("An error occurred during payment verification. Please contact support.");
            } finally {
              setPaymentLoading(false);
            }
          })();
        },
        onClose: function () {
          setPaymentLoading(false);
        },
      });

      handler.openIframe();
    } catch (err: any) {
      setCoopError(err.message || "Failed to initiate payment. Please try again.");
      setPaymentLoading(false);
    }
  };

  const isWeekComplete = (week: ApiWeek) => {
    const ids = (week.lessons || []).map((l) => l.id);
    if (!ids.length) return false;
    const progressArr = Array.isArray(progress) ? progress : [];
    return ids.every((id) => progressArr.some((p) => p.lessonId === id && p.completed));
  };

  const isUnlocked = (index: number) => {
    const week = weeks[index];
    if (!week) return false;

    if (week.unlockDate) {
      const now = new Date();
      const unlock = new Date(week.unlockDate);
      if (now < unlock) {
        return false;
      }
    }

    if (index === 0) return true;

    const prevWeek = weeks[index - 1];
    if (!prevWeek) return true;

    const prevOnlineDone = isWeekComplete(prevWeek);
    const prevQuizDone = !prevWeek.requiresQuizPass || passedWeekIds.has(prevWeek.id);

    return prevOnlineDone && prevQuizDone;
  };

  const completedWeeks   = useMemo(() => (Array.isArray(weeks) ? weeks : []).filter(isWeekComplete).length, [weeks, progress]);
  const completedLessons = useMemo(() => (Array.isArray(progress) ? progress : []).filter((p) => p.completed).length, [progress]);
  const progressPct      = weeks.length ? Math.round((completedWeeks / weeks.length) * 100) : 0;

  const week11Complete = useMemo(() => {
    const w = weeks.find((wk) => wk.weekNumber === 11);
    if (!w) return false;
    const ids = (w.lessons || []).map((l) => l.id);
    const progressArr = Array.isArray(progress) ? progress : [];
    return ids.length > 0 && ids.every((id) => progressArr.some((p) => p.lessonId === id && p.completed));
  }, [weeks, progress]);

  const currentWeek = useMemo(
    () => weeks.find((week, i) => isUnlocked(i) && !isWeekComplete(week)),
    [weeks, progress]
  );

  const idUploaded = idMeta?.hasDocument === true && idMeta?.kycStatus !== "rejected";

  if (!ready) return (
    <div className="min-h-screen bg-[#f4faf7] flex items-center justify-center text-green-650 flex-col gap-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#00D1C1] border-t-transparent rounded-full animate-spin" />
        <p className="text-green-600 text-sm font-mono tracking-widest uppercase font-bold">Loading portal</p>
      </div>
    </div>
  );

  const isStaffAccount = userRole === "trainer" || userRole === "lead_trainer" || userRole === "admin" || userRole === "sub_admin";

  if (!hasCohort && !isStaffAccount) {
    return (
      <div className="min-h-screen bg-[#f4faf7] text-slate-800 relative overflow-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* Subtle repeating greenSubtract background pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ 
            backgroundImage: "url('/learn/training/greenSubtract.png')", 
            backgroundSize: '120px', 
            backgroundRepeat: 'repeat' 
          }} 
        />
        {/* ── TOPBAR ── */}
        <DashboardHeader
          firstName={firstName}
          userPassportPicture={userPassportPicture}
          authPassport={authPassport}
          isCooperativeOnly={isCooperativeOnly}
          hasCohort={hasCohort}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          coopDetails={coopDetails}
          coordHref={coordHref}
          idMeta={idMeta}
          userRole={userRole}
          unreadCount={unreadAnnouncementsCount}
          announcements={announcements}
          onSelectAnnouncement={handleSelectAnnouncement}
          readAnnouncementIds={readAnnouncementIds}
          handleLogout={handleLogout}
        />

        <div className="max-w-[1400px] mx-auto px-6 py-8 relative z-10">
          <div className="max-w-2xl mx-auto my-12 space-y-6">
            <div className="p-8 rounded-3xl bg-white border border-[#e2e8f0] shadow-xl text-center space-y-6 relative overflow-hidden">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-3xl">
                📅
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#002d25]">Cohort Placement Status</h2>
                <p className="text-slate-655 text-sm leading-relaxed font-semibold">
                  We have received and approved your application! However, due to limited space in the initial cohort, you have been pushed to <span className="text-green-600 font-bold">Cohort 2</span>.
                </p>
              </div>
              
              <div className="p-5 rounded-2xl bg-green-50 border border-green-150 inline-block text-left text-xs max-w-md">
                <p className="font-bold text-green-700">What this means for you:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1.5 text-slate-655 font-medium">
                  <li>Your LMS access and lessons will unlock when Cohort 2 starts.</li>
                  <li>You do not need to reapply; your admission status is fully secured.</li>
                  <li>We will email you with dates and updates for Cohort 2.</li>
                </ul>
              </div>
              
              <p className="text-slate-500 text-xs font-medium mt-4">
                For support or questions, please contact <a href="mailto:eewyla@oriyoninternational.com" className="text-green-600 hover:underline">eewyla@oriyoninternational.com</a>
              </p>
            </div>

            {ready && !coopDetails && (
              <div className="p-8 rounded-3xl bg-gradient-to-br from-green-50 to-white border border-green-200 shadow-xl text-center space-y-6 relative overflow-hidden">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-3xl">
                  🐐
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-[#002d25]">Join the EEWYLA Cooperative</h2>
                  <p className="text-slate-600 text-sm leading-relaxed font-semibold">
                    We noticed you didn&apos;t join the cooperative yet. Even though your training cohort starts later in Cohort 2, you can join the cooperative now to access collective production, aggregated market linkages, and digital traceability platform benefits.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/cooperative?email=${encodeURIComponent(userEmail || "")}&phone=${encodeURIComponent(userPhone || "")}&fullName=${encodeURIComponent(userFullName || "")}&address=${encodeURIComponent(userAddress || "")}`}
                    className="inline-flex items-center justify-center gap-2 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] rounded-xl px-6 py-3 text-sm font-bold shadow-md transition font-mono tracking-wide uppercase cursor-pointer"
                  >
                    Join the Cooperative →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-800 relative overflow-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <PracticalDayModal
        userId={userId}
        cohortId={cohortId}
        groupId={groupId}
        groupName={groupName || "Group A"}
        practicalDay={practicalDay}
        currentWeekNumber={currentWeek?.weekNumber || 1}
      />
      {/* Subtle repeating greenSubtract background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: "url('/learn/training/greenSubtract.png')", 
          backgroundSize: '120px', 
          backgroundRepeat: 'repeat' 
        }} 
      />

      {/* ── TOPBAR ── */}
      <DashboardHeader
        firstName={firstName}
        userPassportPicture={userPassportPicture}
        authPassport={authPassport}
        isCooperativeOnly={isCooperativeOnly}
        hasCohort={hasCohort}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        coopDetails={coopDetails}
        coordHref={coordHref}
        idMeta={idMeta}
        userRole={userRole}
        unreadCount={unreadAnnouncementsCount}
        announcements={announcements}
        onSelectAnnouncement={handleSelectAnnouncement}
        readAnnouncementIds={readAnnouncementIds}
        handleLogout={handleLogout}
      />

      {/* ── MOBILE SUB-BAR (TABS & COORDINATOR LINK) ── */}
      {(hasCohort || coordHref) && (
        <div className="md:hidden sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-2.5 space-y-2">
          {coordHref && (
            <Link
              href={coordHref}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold shadow-sm active:scale-[0.99] transition"
            >
              <span className="flex items-center gap-2">
                <span>🛡️</span>
                <span>Access Coordinator Panel</span>
              </span>
              <span>→</span>
            </Link>
          )}

          {hasCohort && (
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 overflow-x-auto">
              {(["overview", "curriculum", "cooperative"] as const).map((tab) => {
                if (tab === "cooperative" && !coopDetails) return null;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all text-center cursor-pointer whitespace-nowrap px-2 ${
                      activeTab === tab
                        ? "bg-[#00D1C1] text-[#002d25] shadow-sm"
                        : "text-slate-500 hover:text-slate-850"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 py-8 relative z-10">

        {/* ── ID / KYC STATUS BANNER ── */}
        {idMeta && (
          <>
            {/* Case 1: No ID uploaded yet */}
            {!idMeta.hasDocument && (
              <div className="mb-6 flex items-center gap-4 px-5 py-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 font-bold flex-shrink-0 text-xs">
                  ID
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-800">Verify your identity</p>
                  <p className="text-xs text-amber-600/80 mt-0.5 font-semibold">Upload a government-issued ID to complete your registration.</p>
                </div>
                <button
                  onClick={() => router.push("/learn/lms/upload-id")}
                  className="flex-shrink-0 px-4 py-2 text-xs font-bold bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] rounded-xl transition cursor-pointer"
                >
                  Upload ID →
                </button>
              </div>
            )}

            {/* Case 2: Verification Pending */}
            {idMeta.hasDocument && idMeta.kycStatus === "pending" && (
              <div className="mb-6 flex items-center gap-4 px-5 py-4 rounded-2xl bg-blue-50 border border-blue-200 shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-800">Verification in progress</p>
                  <p className="text-xs text-blue-600/80 mt-0.5 font-semibold">We are currently reviewing your uploaded ID. You can still access lessons in the meantime.</p>
                </div>
                <div className="flex-shrink-0 px-4 py-2 text-xs font-bold border border-blue-250 text-blue-700 rounded-xl bg-blue-50/50">
                  Under Review
                </div>
              </div>
            )}

            {/* Case 3: Verification Rejected */}
            {idMeta.hasDocument && idMeta.kycStatus === "rejected" && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 rounded-2xl bg-red-50 border border-red-200 shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-800">ID Verification Rejected</p>
                  <p className="text-xs text-red-650/80 mt-1 font-semibold leading-relaxed">
                    Your document was rejected. <span className="font-bold">Reason:</span> {idMeta.kycRejectionReason || "Details did not match profile."}
                  </p>
                </div>
                <button
                  onClick={() => router.push("/learn/lms/upload-id")}
                  className="flex-shrink-0 px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition cursor-pointer"
                >
                  Re-upload ID →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── CODE OF CONDUCT BANNER ── */}
        {!isCooperativeOnly && hasCohort && (
          <div className="mb-8 flex items-center gap-4 px-5 py-4 rounded-2xl bg-green-50 border border-green-200 shadow-sm">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-green-800">Action required — Code of Conduct form</p>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">Download, sign, and submit by <span className="text-slate-800 font-bold">July 30, 2026</span> to remain enrolled.</p>
            </div>
            <a
              href="/downloads/EEWYLA_Code_of_Conduct.pdf"
              download
              className="flex-shrink-0 px-4 py-2 text-xs font-bold bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] rounded-xl transition"
            >
              Download →
            </a>
          </div>
        )}

        {/* ── COOPERATIVE NOTIFICATION BANNER ── */}
        {ready && !coopDetails && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-md">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0 text-sm">
              🐐
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-800">Join the EEWYLA Cooperative</p>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">We noticed you didn&apos;t join a cooperative yet. Join the cooperative now to access collective production, market linkages, and resources.</p>
            </div>
            <Link
              href={`/cooperative?email=${encodeURIComponent(userEmail || "")}&phone=${encodeURIComponent(userPhone || "")}&fullName=${encodeURIComponent(userFullName || "")}&address=${encodeURIComponent(userAddress || "")}`}
              className="flex-shrink-0 text-center px-4 py-2 text-xs font-bold bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] rounded-xl transition shadow-sm font-mono tracking-wide uppercase cursor-pointer"
            >
              Join Cooperative →
            </Link>
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">

            {/* ── SOCIAL FOLLOW BANNER ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 py-6 rounded-3xl bg-white border border-[#e2e8f0] relative overflow-hidden shadow-sm">
              <div className="flex items-start gap-4 z-10">
                
                <div>
                  <h3 className="text-sm font-bold text-[#002d25]">Join the Oriyon International Community!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed font-semibold">
                    Please follow Oriyon International on our social media platforms to stay connected, receive the latest updates, program announcements, and access global opportunities.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 z-10">
                <a
                  href="https://www.instagram.com/oriyoninternational?igsh=MXFmampwcWU2bnhlOQ%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-50 border border-slate-200 hover:border-pink-500/50 hover:bg-pink-500/10 text-slate-600 hover:text-pink-650"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  Instagram
                </a>

                <a
                  href="https://www.tiktok.com/@oriyoninternational?_r=1&_t=ZS-97MgFy4rUqf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-50 border border-slate-200 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-slate-600 hover:text-cyan-700"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.4-.43-.59-.67-.02 3.23-.01 6.46-.02 9.69-.08 2.58-1.17 5.16-3.23 6.78-2.15 1.72-5.11 2.24-7.79 1.48-2.61-.7-4.83-2.64-5.69-5.19-.94-2.73-.42-5.91 1.39-8.17 1.83-2.3 4.88-3.25 7.72-2.52v4.26c-1.63-.44-3.46-.11-4.75 1.01-1.32 1.12-1.75 3.03-1.07 4.67.63 1.59 2.37 2.66 4.09 2.56 1.7-.03 3.2-1.32 3.42-3 .08-1.08.04-2.18.05-3.27V.02z"/>
                  </svg>
                  TikTok
                </a>

                <a
                  href="https://x.com/oriyon_intl?s=11"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-50 border border-slate-200 hover:border-slate-400 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X / Twitter
                </a>
              </div>
            </div>

            {/* ── LATEST ANNOUNCEMENTS WIDGET (OVERVIEW) ── */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#e2e8f0] shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-base font-bold shadow-2xs">
                    📢
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Official Announcements & Notices
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      Important program schedules, venue updates, and practical notices.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("announcements")}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  View All Notices ({announcements.length}) →
                </button>
              </div>

              {loadingAnnouncements ? (
                <div className="text-center py-8 text-xs text-slate-400 animate-pulse">
                  Loading latest announcements...
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-medium">
                  No announcements posted yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {announcements.slice(0, 3).map((ann, idx) => {
                    const isUnread = !readAnnouncementIds.includes(ann.id || `${ann.title}_${ann.createdAt}`);

                    return (
                      <div
                        key={ann.id || idx}
                        onClick={() => handleSelectAnnouncement(ann)}
                        className="group bg-slate-50 border border-slate-200 rounded-2xl p-4.5 hover:border-emerald-400 hover:bg-emerald-50/20 transition cursor-pointer flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                              {ann.level ? `${ann.level.toUpperCase()} NOTICE` : "BROADCAST"}
                            </span>
                            {isUnread && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-rose-600 text-white shadow-2xs">
                                NEW
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-800 transition line-clamp-2 leading-snug">
                            {ann.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-medium">
                            {ann.content}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                          <span>📅 {new Date(ann.createdAt || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                          <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition">
                            Read Notice →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hero row */}
            {(userRole === "trainer" || userRole === "lead_trainer") && (
              <div className="mb-6 bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-purple-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-sora">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-2xl shrink-0">
                    🎓
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-purple-500/30 border border-purple-400/50 text-purple-200 px-2.5 py-0.5 rounded-full">
                        Trainer Portal
                      </span>
                      <span className="text-xs text-purple-300 font-medium">• EEWYLA Technical Instructor</span>
                    </div>
                    <h3 className="text-lg font-black text-white">Trainer Profile & Technical Specialization</h3>
                    <p className="text-xs text-purple-200 font-medium max-w-xl mt-0.5">
                      Upload your official profile photo and update your agricultural areas of specialization (e.g. Ruminants, Poultry, Biosecurity) so administrators can view your technical expertise.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/learn/lms/profile")}
                  className="px-5 py-3 bg-purple-500 hover:bg-purple-600 text-white font-extrabold text-xs rounded-xl transition shadow-md shrink-0 cursor-pointer flex items-center gap-2 border border-purple-300/40"
                >
                  <span>📷</span> Edit Trainer Photo & Specialization →
                </button>
              </div>
            )}

            {/* Trainer Practical Teaching Schedule Card */}
            {(userRole === "trainer" || userRole === "lead_trainer") && (
              <div className="mb-6 bg-white border border-purple-200 rounded-3xl p-6 shadow-md font-sora space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 border border-purple-300 font-extrabold flex items-center justify-center text-xl shrink-0">
                      📅
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 leading-tight">My Weekly Practical Teaching Schedule</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Groups and practical training days assigned to you by Oriyon Administration.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/admin/cohorts"
                    className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    Manage Cohorts & Groups →
                  </Link>
                </div>

                {trainerSchedules.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium text-center">
                    No practical teaching schedule assigned yet. When administrators select you for a practical day, your group assignments will appear here.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {trainerSchedules.map((sch, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 border border-purple-200 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                            {sch.cohortName || "EEWYLA Cohort"}
                          </span>
                          <span className="text-xs font-black text-purple-900 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-lg">
                            📅 {sch.practicalDay || "Practical Day"}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-900">{sch.groupName}</h4>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            👥 Enrolled Students: <strong className="text-slate-900 font-bold">{sch.studentCount || 0} trainees</strong>
                          </p>
                        </div>

                        <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-[11px] text-purple-900 font-semibold">
                          <span>📍 Physical Site: Farm Practical</span>
                          <span className="text-emerald-700 font-bold">Selected Instructor ✓</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Welcome card */}
              <div className="lg:col-span-2 relative rounded-3xl bg-gradient-to-br from-green-50 to-white border border-green-200 p-8 overflow-hidden shadow-md">
                <div className="relative">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-green-700 text-xs font-mono uppercase tracking-widest font-black">Live session</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight mb-3 text-[#002d25]">
                    Welcome back,<br />
                    <span className="text-green-600">{firstName}.</span>
                  </h1>
                  <p className="text-slate-600 text-sm leading-7 max-w-lg mb-8 font-semibold">
                    {currentWeek
                      ? `You're currently on Week ${currentWeek.weekNumber}: ${currentWeek.title}. Keep the momentum going.`
                      : completedWeeks === weeks.length && weeks.length > 0
                        ? "Congratulations — you've completed all curriculum weeks. Your final exam awaits."
                        : "You're enrolled and ready. Your first week will appear here once released."}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {currentWeek && (
                      <button
                        onClick={() => router.push(`/learn/lms/week/${currentWeek.id}`)}
                        className="px-5 py-3 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] text-sm font-black rounded-2xl transition shadow-sm cursor-pointer"
                      >
                        Continue Week {currentWeek.weekNumber} →
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab("curriculum")}
                      className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-2xl border border-slate-200 transition cursor-pointer"
                    >
                      View curriculum
                    </button>
                    {(userRole === "trainer" || userRole === "lead_trainer") && (
                      <button
                        onClick={() => router.push("/learn/lms/profile")}
                        className="px-5 py-3 bg-purple-700 hover:bg-purple-800 text-white text-sm font-extrabold rounded-2xl transition shadow-xs flex items-center gap-2 cursor-pointer"
                      >
                        <span>🎓</span> Edit Trainer Photo & Specialization
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Cohort card */}
              <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] uppercase tracking-widest text-green-600 font-bold">Your cohort</p>
                    {assignedSite && (
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-[10px] font-bold">
                        📍 {assignedSite.code}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-[#002d25] mb-1">{cohortName || "Cohort A"}</h2>
                  <p className="text-slate-500 text-sm font-semibold">{cohortState || "Oyo State"}</p>

                  {groupName && (
                    <div className="mt-5 pt-5 border-t border-slate-100">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Your group</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center text-green-600 text-[10px] font-black">
                            {groupName[0]}
                          </div>
                          <p className="text-[#002d25] text-sm font-bold">{groupName}</p>
                        </div>
                      </div>
                      {practicalDay && (
                        <div className="mt-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3">
                          <p className="text-[9px] uppercase tracking-widest text-emerald-800 font-bold mb-0.5">Physical Practical Day</p>
                          <p className="text-emerald-950 text-xs font-black">Every {practicalDay}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Overall progress</p>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-3xl font-black text-[#002d25]">{progressPct}%</span>
                    <span className="text-xs text-slate-400 font-bold">{completedWeeks}/{weeks.length} weeks</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Physical Site Card */}
            {assignedSite ? (
              <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Your Physical Training Site
                        </span>
                        {groupName && (
                          <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded">
                            {groupName} • Every {practicalDay || getGroupPracticalDay(groupName)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-[#002d25]">{assignedSite.name}</h3>
                      <p className="text-xs text-slate-600 font-semibold mt-1 max-w-2xl">
                        {assignedSite.address}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">
                        {assignedSite.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                    <a
                      href={assignedSite.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
                    >
                      Directions
                    </a>
                    {assignedSite.coordinatorPhone && (
                      <a
                        href={`tel:${assignedSite.coordinatorPhone}`}
                        className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-2"
                      >
                        <span>📞</span> Contact Site
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-amber-50/60 border border-amber-200/90 p-6 shadow-sm font-sora space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <span className="text-[10px] uppercase tracking-widest text-amber-900 font-extrabold bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-300">
                    Physical Training Site: Awaiting Assignment
                  </span>
                </div>
                <h3 className="text-base font-black text-amber-950">No Physical Site Assigned Yet</h3>
                <p className="text-xs text-amber-800 font-medium leading-relaxed max-w-3xl">
                  Your practical training venue will be assigned directly by your EEWYLA programme administrator. Please check back before your scheduled weekly practical session.
                </p>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Weeks total", value: weeks.length, icon: "📅", color: "text-slate-800" },
                { label: "Weeks done", value: completedWeeks, icon: "✅", color: "text-green-600" },
                { label: "Lessons done", value: completedLessons, icon: "📖", color: "text-green-600" },
                { label: "Remaining", value: weeks.length - completedWeeks, icon: "🎯", color: "text-slate-500" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-sm hover:border-slate-350 transition">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{s.label}</span>
                  </div>
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Week 12 */}
              <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] uppercase tracking-widest text-green-600 font-bold">Week 12</p>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${week11Complete ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
                    {week11Complete ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#002d25] mb-2">Physical Attendance</h3>
                <p className="text-slate-500 text-xs leading-6 mb-5 font-semibold">
                  Week 12 attendance check-in is gated behind completing Week 11. Ensure all lessons are marked complete before this unlocks.
                </p>
                <button
                  onClick={() => week11Complete && router.push("/learn/lms/week12")}
                  disabled={!week11Complete}
                  className={`w-full py-3 rounded-2xl text-sm font-bold transition cursor-pointer ${
                    week11Complete
                      ? "bg-[#00D1C1] text-[#002d25] hover:bg-[#00b8aa] shadow-sm"
                      : "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200"
                  }`}
                >
                  {week11Complete ? "Open check-in →" : "Complete Week 11 first"}
                </button>
              </div>

              {/* Final exam */}
              <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] uppercase tracking-widest text-cyan-700 font-bold">Final exam</p>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${completedWeeks >= 12 ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
                    {completedWeeks >= 12 ? "Ready" : "Locked"}
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#002d25] mb-2">Exam Portal</h3>
                <p className="text-slate-500 text-xs leading-6 mb-5 font-semibold">
                  Available after completing all 12 weeks. Your final assessment determines programme certification eligibility.
                </p>
                <button
                  onClick={() => router.push("/learn/lms/exams")}
                  disabled={completedWeeks < 12}
                  className={`w-full py-3 rounded-2xl text-sm font-bold transition cursor-pointer ${
                    completedWeeks >= 12
                      ? "bg-[#00D1C1] text-[#002d25] hover:bg-[#00b8aa] shadow-sm"
                      : "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200"
                  }`}
                >
                  {completedWeeks >= 12 ? "Enter exam portal →" : `Complete ${12 - completedWeeks} more weeks`}
                </button>
              </div>

              {/* Resources */}
              <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Resources</p>
                  <span className="text-[10px] text-slate-500 font-bold">3 files</span>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => openDocument("EEWYLA Livestock Training Document", "/downloads/LAC_TRAINING_DOCUMENT.pdf", false)}
                    className="w-full text-left flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-green-300 hover:bg-green-50/30 transition group cursor-pointer"
                  >
                    <div className="w-10 h-12 rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300 flex flex-col items-center justify-center gap-0.5 flex-shrink-0">
                      <span className="text-green-700 text-[8px] font-black">PDF</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-xs font-bold leading-tight group-hover:text-green-700 transition">
                       EEWYLA Livestock Training Document
                      </p>
                      <p className="text-slate-500 text-[10px] mt-0.5 font-medium">Official Edition · 14.2 MB</p>
                    </div>
                    <span className="text-slate-400 group-hover:text-green-750 transition text-sm">👁️</span>
                  </button>

                   <button
                    onClick={() => openDocument("EEWYLA Study Handbook", "/downloads/EEWYLA_Official_Course_Textbook.pdf", false)}
                    className="w-full text-left flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-green-300 hover:bg-green-50/30 transition group cursor-pointer"
                  >
                    <div className="w-10 h-12 rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300 flex flex-col items-center justify-center gap-0.5 flex-shrink-0">
                      <span className="text-green-700 text-[8px] font-black">PDF</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-xs font-bold leading-tight group-hover:text-green-700 transition">
                        EEWYLA Study Handbook
                      </p>
                      <p className="text-slate-500 text-[10px] mt-0.5 font-medium">Official Edition · 14.2 MB</p>
                    </div>
                    <span className="text-slate-400 group-hover:text-green-750 transition text-sm">👁️</span>
                  </button>

                  {!isCooperativeOnly && hasCohort && (
                    <button
                      onClick={() => openDocument("Code of Conduct", "/downloads/EEWYLA_Code_of_Conduct.pdf", true)}
                      className="w-full text-left flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition group cursor-pointer"
                    >
                      <div className="w-10 h-12 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center gap-0.5 flex-shrink-0">
                        <span className="text-amber-700 text-[8px] font-black">PDF</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-850 text-xs font-bold leading-tight group-hover:text-amber-700 transition">
                          Code of Conduct
                        </p>
                        <p className="text-amber-600 text-[10px] mt-0.5 font-semibold">Submit by Jun 30, 2026</p>
                      </div>
                      <span className="text-slate-400 group-hover:text-amber-700 transition text-sm">👁️</span>
                    </button>
                  )}
                </div>

                {idMeta && idMeta.hasDocument && (
                  <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    idMeta.kycStatus === "approved" ? "bg-green-50 border-green-200 text-green-700" :
                    idMeta.kycStatus === "rejected" ? "bg-red-50 border-red-200 text-red-700" :
                    "bg-yellow-50 border-yellow-200 text-yellow-750"
                  }`}>
                    <span className="text-xs flex-shrink-0 font-bold">
                      {idMeta.kycStatus === "approved" ? "✓" :
                       idMeta.kycStatus === "rejected" ? "✕" : "⏳"}
                    </span>
                    <p className="text-[10px] opacity-90 leading-snug font-bold">
                      {idMeta.idType} ({
                        idMeta.kycStatus === "approved" ? "Verified" :
                        idMeta.kycStatus === "rejected" ? "Rejected" : "Pending Review"
                      })
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CURRICULUM TAB ── */}
        {activeTab === "curriculum" && (
          <div className="space-y-6">

            {/* Curriculum header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-[#002d25]">Weekly Curriculum</h2>
                <p className="text-slate-500 text-sm mt-1 font-semibold">
                  {weeks.length} weeks · {completedWeeks} complete · {weeks.length - completedWeeks} remaining
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-500" /> Complete
                  <span className="w-2 h-2 rounded-full bg-slate-350 ml-2" /> Locked
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-[#002d25]">Overall progress</p>
                <span className="text-green-600 text-sm font-black">{progressPct}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000 relative"
                  style={{ width: `${progressPct}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border border-green-300" />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                <span>Start</span>
                <span>Week 12</span>
              </div>
            </div>

            {/* Week grid */}
            {weeks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 p-16 text-center bg-white shadow-sm">
                <p className="text-4xl mb-4">📅</p>
                <p className="text-slate-500 font-semibold">No weeks published yet</p>
                <p className="text-slate-400 text-sm mt-1 font-medium">Check back soon — your cohort curriculum is being prepared.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {weeks.map((week, i) => {
                  const unlocked  = isUnlocked(i);
                  const completed = isWeekComplete(week);
                  const lessons   = week.lessons || [];
                  const done = lessons.filter((l) =>
                    (Array.isArray(progress) ? progress : []).some((p) => p.lessonId === l.id && p.completed)
                  ).length;
                  const isCurrent = currentWeek?.id === week.id;
                  const isLockedByDate = week.unlockDate && new Date() < new Date(week.unlockDate);

                  return (
                    <button
                      key={week.id}
                      onClick={() => unlocked && router.push(`/learn/lms/week/${week.id}`)}
                      disabled={!unlocked}
                      className={`relative text-left rounded-3xl border p-5 transition-all duration-200 cursor-pointer ${
                        completed
                          ? "bg-white border-green-500/30 hover:border-green-500/50 shadow-md"
                          : isCurrent
                            ? "bg-white border-green-500 ring-1 ring-green-300 hover:border-green-600 shadow-md"
                            : unlocked
                              ? "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/50 shadow-sm"
                              : "bg-slate-50/50 border-slate-100 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute top-4 right-4 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[9px] text-green-600 font-bold uppercase tracking-wider">Active</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                          Week {week.weekNumber}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          completed
                            ? "bg-green-50 text-green-700"
                            : isCurrent
                              ? "bg-green-50 text-green-700"
                              : unlocked
                                ? "bg-slate-100 text-slate-500"
                                : "bg-slate-100 text-slate-400"
                        }`}>
                          {completed ? "✓ Done" : isCurrent ? "In progress" : unlocked ? "Open" : isLockedByDate ? "🔒 Locked" : "🔒"}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-800 leading-snug mb-3">{week.title}</h3>

                      {isLockedByDate && (
                        <p className="text-[11px] text-amber-700 font-bold mb-3">
                          Unlocks on {new Date(week.unlockDate!).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}

                      {lessons.length > 0 && (
                        <>
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${lessons.length > 0 ? (done / lessons.length) * 100 : 0}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold">
                            {done}/{lessons.length} lessons
                          </p>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── COOPERATIVE TAB ── */}
        {activeTab === "cooperative" && coopDetails && (
          <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn pb-12">
            {/* Cooperative Header Card */}
            <div className="relative rounded-3xl bg-gradient-to-br from-green-50 to-white border border-[#e2e8f0] p-8 overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                    <span className="text-green-700 text-xs font-mono uppercase tracking-widest font-black">Oriyon Cooperative Portal</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#002d25]">
                    {coopDetails.cooperativeName}
                  </h1>
                  <p className="text-slate-500 text-sm font-semibold">
                    State: <span className="text-[#002d25] font-bold">{cohortState || "Oyo State"}</span> &bull; LGA: <span className="text-[#002d25] font-bold">{coopDetails.lga || "Not Specified"}</span> &bull; Cluster: <span className="text-[#002d25] font-bold">{coopDetails.zoneCluster || "N/A"}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 sm:items-center">
                  <div className="space-y-1 text-left lg:text-right">
                    <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold block">Membership Status</span>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border rounded-full text-xs font-bold uppercase tracking-wider ${
                        coopDetails.status === "active"
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-red-50 border-red-200 text-red-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${coopDetails.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
                        {coopDetails.status === "active" ? "Active Member" : "Inactive"}
                      </span>
                      {coopDetails.registrationFeePaid === "YES" ? (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                          ✓ Fee Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                          ⚠ Fee Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── PAYMENT GATE: only show gate if fee not paid ── */}
            {coopDetails.registrationFeePaid !== "YES" ? (
              <div className="relative rounded-3xl overflow-hidden border border-amber-200 bg-white/70 backdrop-blur-md">
                {/* Blurred background preview */}
                <div className="pointer-events-none select-none blur-sm opacity-20 grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-3xl bg-slate-100/50 border border-slate-200 p-6 h-48" />
                    <div className="rounded-3xl bg-slate-100/50 border border-slate-200 p-6 h-36" />
                  </div>
                  <div className="space-y-6">
                    <div className="rounded-3xl bg-slate-100/50 border border-slate-200 p-6 h-48" />
                    <div className="rounded-3xl bg-slate-100/50 border border-slate-200 p-6 h-36" />
                  </div>
                </div>

                {/* Overlay modal gate */}
                <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
                  <div className="w-full max-w-md rounded-3xl bg-white border border-amber-200 p-8 shadow-2xl text-center space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl">
                      🔒
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-800">Complete Your Registration</h2>
                      <p className="text-slate-500 text-sm leading-relaxed font-semibold">
                        Your cooperative dashboard is locked until your registration fee is paid. Complete your payment below to activate your membership and unlock full access.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-1">
                      <p className="text-amber-800 text-xs font-bold uppercase tracking-widest">Registration Fee Due</p>
                      <p className="text-[#002d25] text-3xl font-black">₦{Number(coopDetails.registrationFee || 2000).toLocaleString()}</p>
                      <p className="text-slate-400 text-[11px] font-semibold">One-time fee · Unlocks full cooperative dashboard</p>
                    </div>

                    {coopError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-left">
                        {coopError}
                      </div>
                    )}

                    {coopSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 text-green-755 text-xs rounded-xl text-left">
                        🎉 Payment confirmed! Your cooperative dashboard is now active.
                      </div>
                    )}

                    <button
                      onClick={() => handlePayCooperative("registration")}
                      disabled={paymentLoading}
                      className="w-full py-4 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] text-sm font-black rounded-2xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {paymentLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#002d25] border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Pay Registration Fee (₦{Number(coopDetails.registrationFee || 2000).toLocaleString()})
                        </>
                      )}
                    </button>

                    <p className="text-slate-455 text-[10px] font-semibold">
                      Secured by Paystack · All transactions are encrypted
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* ── FULL DASHBOARD: only shown after fee is paid ── */
              <div className="space-y-8">
                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: ID & Status */}
                  <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 flex items-center gap-4 hover:border-slate-350 transition shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700 font-extrabold text-sm">
                      ID
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Cooperative ID</p>
                      <p className="text-[#002d25] font-black text-lg mt-0.5">{coopDetails.memberId || "Pending Assigned ID"}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{isCooperativeOnly ? "Cooperative-Only Partner" : "Trainee Partner"}</p>
                    </div>
                  </div>

                  {/* Card 2: Financial Stats */}
                  <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 flex items-center gap-4 hover:border-slate-350 transition shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 text-xl">
                      💰
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Total Contributions</p>
                      <p className="text-[#002d25] font-black text-lg mt-0.5">
                        ₦{(Array.isArray(payments) ? payments : []).filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount / 100, 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Rate: ₦{Number(coopDetails.monthlyContributionAmount || 2000).toLocaleString()}/month</p>
                    </div>
                  </div>

                  {/* Card 3: Livestock details */}
                  <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 flex items-center gap-4 hover:border-slate-350 transition shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-650 text-xl">
                      🐐
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Livestock & Experience</p>
                      <p className="text-[#002d25] font-black text-lg mt-0.5 truncate">{coopDetails.livestockType || "Goats / Sheep"}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{coopDetails.yearsOfExperience || "1-3 Years"} experience</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Profile and History */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Membership Profile details */}
                    <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 space-y-6 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black uppercase tracking-wider text-[#002d25]">
                          Cooperative Member Profile
                        </h3>
                        <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">Verified Member</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold block">Full Name</span>
                          <span className="text-slate-800 text-sm font-semibold block">
                            {coopDetails.firstName} {coopDetails.lastName}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold block">Email Address</span>
                          <span className="text-slate-800 text-sm font-semibold block truncate">{coopDetails.email || "N/A"}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold block">Phone Number</span>
                          <span className="text-slate-800 text-sm font-semibold block">{coopDetails.phone || "N/A"}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold block">LGA / Zone</span>
                          <span className="text-slate-800 text-sm font-semibold block">{coopDetails.lga || "N/A"} ({coopDetails.zoneCluster || "N/A"})</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold block">Monthly Contribution</span>
                          <span className="text-slate-800 text-sm font-semibold block">
                            ₦{Number(coopDetails.monthlyContributionAmount || 2000).toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold block">Membership Date</span>
                          <span className="text-slate-800 text-sm font-semibold block">
                            {coopDetails.joinedAt ? new Date(coopDetails.joinedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }) : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contribution / Payment History */}
                    <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 shadow-sm">
                      <div className="border-b border-slate-100 pb-3 mb-5">
                        <h3 className="text-sm font-black uppercase tracking-wider text-[#002d25]">
                          Payment Ledger & Receipts
                        </h3>
                      </div>

                      {!Array.isArray(payments) || payments.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-xs italic">
                          No payments or contributions recorded yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {payments.map((p: any) => (
                            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-150 rounded-2xl gap-4 hover:border-slate-350 transition duration-150">
                              <div className="min-w-0 space-y-1">
                                <p className="text-xs font-bold text-slate-800">
                                  {p.reference.startsWith("COOP-PAY-") ? "Cooperative Registration Fee" : "Monthly Contribution"}
                                </p>
                                <p className="text-[10px] text-slate-450 font-mono uppercase tracking-wider">Ref: {p.reference}</p>
                              </div>
                              
                              <div className="flex items-center justify-between sm:justify-end gap-6 flex-shrink-0">
                                <div className="text-left sm:text-right">
                                  <p className="text-xs font-black text-slate-800">₦{(p.amount / 100).toLocaleString()}</p>
                                  <p className="text-[9px] text-slate-450 mt-0.5">
                                    {new Date(p.createdAt).toLocaleDateString("en-US", {
                                      month: "short", day: "numeric", year: "numeric"
                                    })}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                    p.status === "success"
                                      ? "bg-green-50 border-green-200 text-green-755"
                                      : p.status === "failed"
                                        ? "bg-red-55/10 border-red-200 text-red-755"
                                        : "bg-amber-50 border-amber-200 text-amber-700"
                                  }`}>
                                    {p.status}
                                  </span>
                                  
                                  {p.status === "success" && (
                                    <button
                                      onClick={() => handlePrintReceipt(p)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                                      title="Download receipt as PDF"
                                    >
                                      <span>📥</span> Receipt
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions and Announcements */}
                  <div className="space-y-6">
                    
                    {/* Actions Box */}
                    <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 space-y-6 shadow-sm">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black uppercase tracking-wider text-[#002d25]">
                          Cooperative Actions
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                          Your cooperative membership is active. Join the official WhatsApp group for your cooperative to coordinate with fellow members and LGA coordinators.
                        </p>
                        {coopDetails.whatsappLink ? (
                          <a
                            href={coopDetails.whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black rounded-2xl transition shadow-md duration-200 cursor-pointer"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.034-2.837-6.87C16.656 2.159 14.237 1.15 11.728 1.15c-5.437 0-9.862 4.371-9.866 9.731-.001 1.761.47 3.481 1.362 5.017L2.16 21.8l6.094-1.597c.001 0-.007-.049-.007-.049zM17.159 14c-.284-.142-1.68-.828-1.94-.923-.26-.095-.449-.142-.638.142-.189.283-.733.923-.898 1.112-.165.189-.33.213-.614.071-.284-.142-1.2-.442-2.285-1.41-1.077-.962-1.28-1.547-1.375-1.736a.602.602 0 0 1 .189-.59c.284-.284.614-.707.756-.896.142-.189.189-.33.095-.519-.095-.189-.733-1.767-1.004-2.427-.264-.636-.53-.55-.733-.56h-.638c-.284 0-.756.142-1.134.566-.378.425-1.441 1.414-1.441 3.447s1.488 4.008 1.696 4.291c.208.283 2.93 4.475 7.1 6.273.992.427 1.767.683 2.372.875 1.001.318 1.912.273 2.632.165.803-.12 1.68-.687 1.916-1.32.236-.633.236-1.176.165-1.284-.07-.107-.26-.171-.544-.313z" />
                            </svg>
                            Join WhatsApp Group
                          </a>
                        ) : (
                          <p className="text-slate-500 text-xs italic text-center p-3 border border-dashed border-slate-200 bg-slate-50 rounded-2xl">
                            WhatsApp link not available. Contact coordinator.
                          </p>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-5 space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#002d25]">
                            Monthly Contribution
                          </h4>
                          <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                            Keep your membership active by paying your monthly contribution of <span className="text-green-700 font-bold">₦{Number(coopDetails.monthlyContributionAmount || 2000).toLocaleString()}</span>.
                          </p>
                        </div>

                        {coopError && (
                          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                            {coopError}
                          </div>
                        )}

                        <button
                          onClick={() => handlePayCooperative("contribution")}
                          disabled={paymentLoading}
                          className="w-full py-3 bg-[#00D1C1] text-[#002d25] hover:bg-[#00b8aa] border border-[#00D1C1] text-xs font-bold rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {paymentLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-[#002d25] border-t-transparent rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            `Pay Contribution (₦${Number(coopDetails.monthlyContributionAmount || 2000).toLocaleString()})`
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Announcements Box */}
                    <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 space-y-4 shadow-sm">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black uppercase tracking-wider text-[#002d25]">
                          Announcements
                        </h3>
                      </div>

                      {loadingAnnouncements ? (
                        <div className="text-center py-10 text-xs text-slate-450 animate-pulse">
                          Loading announcements...
                        </div>
                      ) : announcements.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-xs italic">
                          No announcements posted yet.
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                          {announcements.map((a: any) => {
                            const levelColors: Record<string, string> = {
                              state: "bg-emerald-50 border-emerald-250 text-emerald-800",
                              zone: "bg-blue-50 border-blue-250 text-blue-800",
                              lga: "bg-indigo-50 border-indigo-250 text-indigo-800",
                              cooperative: "bg-slate-100 border-slate-200 text-slate-600",
                            };

                            const levelLabels: Record<string, string> = {
                              state: "State Level",
                              zone: "Zonal Level",
                              lga: "LGA Level",
                              cooperative: "Cooperative Level",
                            };

                            return (
                              <div key={a.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2 hover:border-slate-350 transition">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className={`px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider ${
                                    levelColors[a.level] || levelColors.cooperative
                                  }`}>
                                    {levelLabels[a.level] || a.level}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-bold">
                                    {new Date(a.createdAt).toLocaleDateString("en-US", {
                                      month: "short", day: "numeric", year: "numeric"
                                    })}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 leading-tight">{a.title}</h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium whitespace-pre-wrap">
                                  {a.content}
                                </p>
                                <p className="text-[9px] text-slate-400 italic text-right mt-1 font-semibold">
                                  Posted by {a.postedBy}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ANNOUNCEMENTS TAB ── */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-white border border-[#e2e8f0] shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-full">
                    Official Notice Board
                  </span>
                  <h2 className="text-2xl font-black text-[#002d25] mt-2">
                    EEWYLA Announcements & Broadcasts
                  </h2>
                  <p className="text-slate-500 text-xs mt-1 font-semibold leading-relaxed">
                    Official updates regarding physical training dates, group allocations, practical venues, and program schedules.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    value={announcementSearchTerm}
                    onChange={(e) => setAnnouncementSearchTerm(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs w-full sm:w-64"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 flex-wrap">
                {(["all", "unread", "pinned"] as const).map((flt) => (
                  <button
                    key={flt}
                    onClick={() => setAnnouncementFilter(flt)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer capitalize ${
                      announcementFilter === flt
                        ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {flt === "all" ? `All Notices (${announcements.length})` : flt === "unread" ? `Unread (${unreadAnnouncementsCount})` : "Pinned Notices 📌"}
                  </button>
                ))}
              </div>

              {/* Announcements List */}
              {loadingAnnouncements ? (
                <div className="text-center py-16 text-xs text-slate-400 animate-pulse">
                  Loading official notices...
                </div>
              ) : (() => {
                const filtered = announcements.filter((a) => {
                  const matchesSearch = !announcementSearchTerm.trim() ||
                    a.title.toLowerCase().includes(announcementSearchTerm.toLowerCase()) ||
                    a.content.toLowerCase().includes(announcementSearchTerm.toLowerCase());
                  
                  const isUnread = !readAnnouncementIds.includes(a.id || `${a.title}_${a.createdAt}`);
                  if (announcementFilter === "unread" && !isUnread) return false;
                  if (announcementFilter === "pinned" && !a.isPinned) return false;

                  return matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-2xl p-8">
                      <span className="text-3xl mb-2 block">📢</span>
                      <p className="text-xs font-bold text-slate-700">No Announcements Found</p>
                      <p className="text-[11px] text-slate-400 mt-1">There are no notices matching your current filter.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((item, idx) => {
                      const isUnread = !readAnnouncementIds.includes(item.id || `${item.title}_${item.createdAt}`);
                      const imgSrc = item.imageUrl || item.image || (item.title.toLowerCase().includes("training") ? "/eewyla/eewyla.png" : null);

                      return (
                        <div
                          key={item.id || idx}
                          onClick={() => handleSelectAnnouncement(item)}
                          className="group bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between shadow-2xs"
                        >
                          {imgSrc ? (
                            <div className="aspect-[16/9] w-full bg-slate-100 overflow-hidden relative">
                              <img
                                src={imgSrc}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              />
                              <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
                                {item.level ? `${item.level.toUpperCase()} ANNOUNCEMENT` : "Broadcast"}
                              </span>
                              {isUnread && (
                                <span className="absolute top-3 right-3 px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded-full shadow-2xs">
                                  NEW
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 bg-emerald-900 text-white relative">
                              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
                                {item.level ? `${item.level.toUpperCase()} ANNOUNCEMENT` : "Broadcast"}
                              </span>
                              {isUnread && (
                                <span className="absolute top-3 right-3 px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded-full shadow-2xs">
                                  NEW
                                </span>
                              )}
                            </div>
                          )}

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                              <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-800 transition line-clamp-2 leading-snug">
                                {item.title}
                              </h3>
                              <p className="text-[11px] text-slate-600 line-clamp-3 font-medium leading-relaxed">
                                {item.content}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                              <span>Posted by {item.postedBy || "Admin"}</span>
                              <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition">
                                Read Announcement →
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── MEDIA & LAUNCH GALLERY TAB ── */}
        {activeTab === "media" && (
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-white border border-[#e2e8f0] shadow-sm space-y-6">
              <div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-[10px] font-black uppercase tracking-wider rounded-full">
                  Media & Event Gallery
                </span>
                <h2 className="text-2xl font-black text-[#002d25] mt-2">
                  EEWYLA Programme Launch & Practical Sessions
                </h2>
                <p className="text-slate-500 text-xs mt-1 font-semibold leading-relaxed">
                  Browse official launch ceremony photographs, training farm practicals, and group cooperative inaugurations across Oyo State.
                </p>
              </div>

              {announcements.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-2xl p-8">
                  <span className="text-3xl mb-2 block">📸</span>
                  <p className="text-xs font-bold text-slate-700">No Launch Media or Broadcasts Posted</p>
                  <p className="text-[11px] text-slate-400 mt-1">Check back soon for official photos, media guidelines, and notices.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {announcements.map((item, idx) => {
                    const imgSrc = item.imageUrl && item.imageUrl.trim() ? item.imageUrl : "/eewyla/eewyla.png";
                    return (
                      <div
                        key={item.id || idx}
                        onClick={() => handleSelectAnnouncement(item)}
                        className="group bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-green-300 transition cursor-pointer flex flex-col"
                      >
                        <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden relative">
                          <img
                            src={imgSrc}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
                            {item.level ? `${item.level.toUpperCase()} ANNOUNCEMENT` : "Broadcast"}
                          </span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h3 className="text-xs font-bold text-slate-800 group-hover:text-green-800 transition line-clamp-1">
                              {item.title}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 font-medium">
                              {item.content}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span>Posted by {item.postedBy || "Admin"}</span>
                            <span>Click to view notice →</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── ANNOUNCEMENT READER MODAL ── */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAnnouncement(null); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-base font-bold">📢</span>
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                    {selectedAnnouncement.level ? `${selectedAnnouncement.level.toUpperCase()} ANNOUNCEMENT` : "OFFICIAL BROADCAST"}
                  </span>
                  <h3 className="font-black text-slate-900 text-sm mt-0.5 line-clamp-1">
                    {selectedAnnouncement.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              {/* Title & Metadata */}
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {selectedAnnouncement.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mt-2.5 flex-wrap border-b border-slate-100 pb-3">
                  <span className="flex items-center gap-1">
                    👤 <strong>Posted by:</strong> {selectedAnnouncement.postedBy || "EEWYLA Admin"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    📅 <strong>Date:</strong> {new Date(selectedAnnouncement.createdAt || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Media / Image Banner if available */}
              {(selectedAnnouncement.imageUrl || selectedAnnouncement.image) && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group relative">
                  <img
                    src={selectedAnnouncement.imageUrl || selectedAnnouncement.image}
                    alt={selectedAnnouncement.title}
                    className="w-full max-h-[360px] object-cover"
                  />
                  <div className="p-2.5 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="text-[11px] text-slate-500">📷 Attached Media Banner</span>
                    <a
                      href={selectedAnnouncement.imageUrl || selectedAnnouncement.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs transition"
                    >
                      Download Image 📥
                    </a>
                  </div>
                </div>
              )}

              {/* Message Body Content */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Announcement Body & Details
                </h4>
                <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-5 text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium italic">
                EEWYLA Official Notice Board
              </span>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition shadow-2xs cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingDoc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl h-[85vh] bg-[#f4faf7] border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-green-600 font-bold tracking-wider">Document Viewer</p>
                <h3 className="text-[#002d25] font-black truncate text-sm md:text-base mt-0.5">{viewingDoc.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                {viewingDoc.allowDownload && (
                  <a
                    href={viewingDoc.url}
                    download
                    className="inline-flex items-center gap-2 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    <span>↓</span> Download Here
                  </a>
                )}
                <button
                  onClick={() => setViewingDoc(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer text-sm font-semibold"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="flex-1 bg-white overflow-y-auto -webkit-overflow-scrolling-touch">
              <iframe
                src={`${viewingDoc.url}#toolbar=0`}
                className="w-full h-full min-h-[75vh] border-none block"
                title={viewingDoc.title}
                scrolling="yes"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TraineeDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4faf7] flex items-center justify-center text-slate-500 text-sm">Loading...</div>}>
      <TraineeDashboardContent />
    </Suspense>
  );
}