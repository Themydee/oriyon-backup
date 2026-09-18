"use client";

import { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/api";
import { popup } from "@/components/layout/PopupProvider";
import {
  getGroupPracticalDay,
  MAX_GROUP_CAPACITY,
  PHYSICAL_SITES,
  getPhysicalSiteById,
} from "@/lib/sitesData";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface Cohort {
  id: string;
  name: string;
  state?: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  physicalSiteId?: string;
  siteId?: string;
  institution?: string;
  assignedLga?: string;
  lga?: string;
  cohorts?: { id: string; name: string }[];
  groups?: { id: string; name: string }[];
  cohortId?: string | null;
  [key: string]: any;
}

interface CohortMember {
  userId: string;
  cohortId?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  enrolledAt?: string;
  user?: any;
  [key: string]: any;
}

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive?: boolean;
  physicalSiteId?: string;
  siteId?: string;
  institution?: string;
  lga?: string;
  joinedAt: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  practicalDay?: string;
  memberCount: number;
  members: GroupMember[];
  trainers?: any[];
}

type ActiveModal = "groups" | "sites" | "enrol" | "email" | "notifyGroup" | null;

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const emptyForm = { name: "", startDate: "", endDate: "", isActive: true };

// ─────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────
function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalItems <= pageSize) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-2 pt-2 text-xs select-none">
      <span className="text-[11px] text-slate-500 font-semibold">
        Showing {start}–{end} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          ‹ Prev
        </button>
        <span className="px-2 py-1 text-[11px] font-extrabold text-slate-700 bg-slate-100 rounded-lg">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}

export default function CohortsPage() {
  const [cohorts, setCohorts]           = useState<Cohort[]>([]);
  const [globalUsers, setGlobalUsers]   = useState<User[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("oriyon_cached_users");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const [groups, setGroups]             = useState<Group[]>([]);
  const [currentCohortMembers, setCurrentCohortMembers] = useState<CohortMember[]>([]);

  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  // Search & Filter state
  const [searchTerm, setSearchTerm]     = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Create / Edit cohort modal
  const [showCohortModal, setShowCohortModal] = useState(false);
  const [editingCohort, setEditingCohort]     = useState<Cohort | null>(null);
  const [form, setForm]                       = useState(emptyForm);
  const [isTbdDate, setIsTbdDate]             = useState(false);
  const [formError, setFormError]             = useState("");
  const [submitting, setSubmitting]           = useState(false);

  // Active Modal & Selected Cohort for Workspaces
  const [activeModal, setActiveModal]   = useState<ActiveModal>(null);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);

  // Detailed Group Selected inside Groups Modal
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Bulk Email states
  const [bulkSubject, setBulkSubject]     = useState("");
  const [bulkBody, setBulkBody]           = useState("");
  const [bulkSending, setBulkSending]     = useState(false);
  const [bulkError, setBulkError]         = useState("");
  const [bulkSuccess, setBulkSuccess]     = useState("");

  // Group & Physical Training Notification states
  const [notifyLocation, setNotifyLocation] = useState("LAUTECH Ogbomoso");
  const [notifyTimeRange, setNotifyTimeRange] = useState("9:00 AM – 5:00 PM");
  const [notifySending, setNotifySending] = useState(false);
  const [notifyError, setNotifyError] = useState("");
  const [notifySuccess, setNotifySuccess] = useState("");
  const [notifyDryRunResult, setNotifyDryRunResult] = useState<any>(null);

  // Enrol modal / workspace
  const [selectedUser, setSelectedUser] = useState("");
  const [enrollError, setEnrollError]   = useState("");
  const [enrolling, setEnrolling]       = useState(false);
  const [hideEnrolledInCohort, setHideEnrolledInCohort] = useState(false);
  const [enrollUserSearch, setEnrollUserSearch]         = useState("");
  const [enrolledListSearch, setEnrolledListSearch]     = useState("");
  const [enrollUserPage, setEnrollUserPage]             = useState(1);
  const [enrolledListPage, setEnrolledListPage]         = useState(1);

  // Groups workspace
  const [groupForm, setGroupForm]       = useState({ name: "", practicalDay: "" });
  const [groupError, setGroupError]     = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [autoGrouping, setAutoGrouping]   = useState(false);
  const [showAutoGroupConfirm, setShowAutoGroupConfirm] = useState(false);
  const [showAutoGroupSuccess, setShowAutoGroupSuccess] = useState(false);
  const [autoGroupSuccessMessage, setAutoGroupSuccessMessage] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [hideAssignedToGroup, setHideAssignedToGroup] = useState(true);
  const [groupMemberSearch, setGroupMemberSearch] = useState("");
  const [addGroupMemberSearch, setAddGroupMemberSearch] = useState("");
  const [addGroupPage, setAddGroupPage]                 = useState(1);
  const [groupMemberPage, setGroupMemberPage]           = useState(1);
  const [siteMemberSearch, setSiteMemberSearch] = useState("");
  const [trainerSearch, setTrainerSearch] = useState("");
  const [loadingUsers, setLoadingUsers]   = useState(false);

  // Edit group states
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupForm, setEditGroupForm]   = useState({ name: "", practicalDay: "" });

  // Group member management
  const [selectedMemberUserId, setSelectedMemberUserId]   = useState("");
  const [addingMember, setAddingMember]                   = useState(false);
  const [removingMemberId, setRemovingMemberId]           = useState<string | null>(null);
  const [exportingCohortId, setExportingCohortId]         = useState<string | null>(null);

  // Trainer Assignment states
  const [showAssignTrainerModal, setShowAssignTrainerModal]   = useState(false);
  const [selectedGroupForTrainer, setSelectedGroupForTrainer] = useState<Group | null>(null);
  const [selectedTrainerDay, setSelectedTrainerDay]           = useState<string>("Monday");
  const [allTrainers, setAllTrainers]                         = useState<any[]>([]);
  const [loadingTrainers, setLoadingTrainers]                 = useState(false);
  const [assigningTrainerId, setAssigningTrainerId]           = useState<string | null>(null);
  const [trainerAssignError, setTrainerAssignError]           = useState("");
  const [trainerAssignSuccess, setTrainerAssignSuccess]       = useState("");

  const handleOpenAssignTrainerModal = async (group: Group) => {
    setSelectedGroupForTrainer(group);
    setSelectedTrainerDay(group.practicalDay || "Monday");
    setShowAssignTrainerModal(true);
    setLoadingTrainers(true);
    setTrainerAssignError("");
    setTrainerAssignSuccess("");
    try {
      const res = await authFetch("/users?limit=500");
      if (res.ok) {
        const data = await res.json();
        const usersList = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        const filteredTrainers = usersList.filter(
          (u: any) => u.role === "trainer" || u.role === "lead_trainer"
        );
        setAllTrainers(filteredTrainers);
      }
    } catch {
      setTrainerAssignError("Failed to fetch registered trainers.");
    } finally {
      setLoadingTrainers(false);
    }
  };

  const handleAssignTrainer = async (trainerId: string) => {
    if (!selectedCohort || !selectedGroupForTrainer) return;
    setAssigningTrainerId(trainerId);
    setTrainerAssignError("");
    setTrainerAssignSuccess("");
    try {
      const res = await authFetch(`/cohorts/${selectedCohort.id}/groups/${selectedGroupForTrainer.id}/trainers`, {
        method: "POST",
        body: JSON.stringify({ trainerId, assignedDay: selectedTrainerDay }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTrainerAssignError(data.error || "Failed to assign trainer");
        return;
      }

      setTrainerAssignSuccess(`✓ Trainer assigned for ${selectedTrainerDay}! Schedule notice dispatched.`);
      await fetchGroups(selectedCohort.id);
    } catch {
      setTrainerAssignError("Failed to assign trainer.");
    } finally {
      setAssigningTrainerId(null);
    }
  };

  const handleRemoveTrainerFromGroup = async (
    cohortId: string,
    groupId: string,
    trainerId: string,
    assignmentId?: string,
    assignedDay?: string
  ) => {
    try {
      const query = assignmentId
        ? `?assignmentId=${assignmentId}`
        : assignedDay
        ? `?assignedDay=${encodeURIComponent(assignedDay)}`
        : "";
      const res = await authFetch(`/cohorts/${cohortId}/groups/${groupId}/trainers/${trainerId}${query}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchGroups(cohortId);
      }
    } catch (err) {
      console.warn("Remove trainer error:", err);
    }
  };

  // ─── CSV EXPORT ─────────────────────────────
  const handleExportCohortCSV = async (cohortToExport: Cohort, specificGroup?: Group | null) => {
    setExportingCohortId(cohortToExport.id);
    try {
      // 1. Fetch group mappings for this cohort
      const groupsRes = await authFetch(`/cohorts/${cohortToExport.id}/groups`);
      const cohortGroups: Group[] = groupsRes.ok ? await groupsRes.json() : [];

      // 2. Fetch direct members list for this cohort
      const detailsRes = await authFetch(`/cohorts/${cohortToExport.id}`);
      const cohortDetails = detailsRes.ok ? await detailsRes.json() : {};
      const cohortMemberIds: string[] = (cohortDetails.members || []).map((m: any) => m.userId || m.id);

      // 3. Collect target members
      let targetUsers: any[] = [];

      if (specificGroup) {
        // Members belonging to specific group
        const groupMemberMap = new Map<string, any>();
        (specificGroup.members || []).forEach((m) => {
          if (m.id) groupMemberMap.set(m.id, m);
          if (m.email) groupMemberMap.set(m.email, m);
        });

        targetUsers = globalUsers.filter((u) => groupMemberMap.has(u.id) || groupMemberMap.has(u.email));

        // Include any member from specificGroup not in globalUsers
        (specificGroup.members || []).forEach((m) => {
          if (!targetUsers.some((u) => u.id === m.id || u.email === m.email)) {
            targetUsers.push({
              id: m.id,
              firstName: m.firstName || "",
              lastName: m.lastName || "",
              email: m.email || "",
              phone: m.phone || "",
              role: "trainee",
              physicalSiteId: m.physicalSiteId || m.siteId,
              lga: m.lga,
              institution: m.institution,
              isActive: m.isActive,
            });
          }
        });
      } else {
        // All members in this cohort
        const cohortMemberSet = new Set<string>(cohortMemberIds);
        cohortGroups.forEach((g) => {
          (g.members || []).forEach((m) => {
            if (m.id) cohortMemberSet.add(m.id);
            if (m.email) cohortMemberSet.add(m.email);
          });
        });

        targetUsers = globalUsers.filter((u) => {
          const inCohortsList = u.cohorts?.some((c: any) => c.id === cohortToExport.id);
          const inDetailsList = cohortMemberSet.has(u.id) || cohortMemberSet.has(u.email);
          return inCohortsList || inDetailsList;
        });

        // Add any member in cohortGroups not present in globalUsers
        cohortGroups.forEach((g) => {
          (g.members || []).forEach((m) => {
            if (!targetUsers.some((u) => u.id === m.id || u.email === m.email)) {
              targetUsers.push({
                id: m.id,
                firstName: m.firstName || "",
                lastName: m.lastName || "",
                email: m.email || "",
                phone: m.phone || "",
                role: "trainee",
                physicalSiteId: m.physicalSiteId || m.siteId,
                lga: m.lga,
                institution: m.institution,
                isActive: m.isActive,
              });
            }
          });
        });
      }

      if (targetUsers.length === 0) {
        popup.alert(`No members found for ${specificGroup ? specificGroup.name : cohortToExport.name}.`);
        return;
      }

      const headers = [
        "S/N",
        "User ID",
        "First Name",
        "Last Name",
        "Full Name",
        "Email",
        "Phone Number",
        "Role",
        "Cohort Name",
        "Assigned Group(s)",
        "Practical Day(s)",
        "Assigned Practical Trainer(s)",
        "Physical Site / Training Center",
        "LGA / Region",
        "State",
        "Institution",
        "Status"
      ];

      const rows = targetUsers.map((u, idx) => {
        const userGroups = cohortGroups.filter((g) =>
          (g.members || []).some((m) => m.id === u.id || m.email === u.email)
        );

        const groupNames = userGroups.map((g) => g.name).join("; ") || "Unassigned";
        const practicalDays = userGroups
          .map((g) => g.practicalDay || getGroupPracticalDay(g.name))
          .join("; ") || "N/A";

        const physicalSiteObj = getPhysicalSiteById(u.physicalSiteId || u.siteId);
        const physicalSiteName = physicalSiteObj ? physicalSiteObj.name : "Not Assigned";
        const accountStatus = u.isActive !== false ? "Active" : "Inactive";

        return [
          `"${idx + 1}"`,
          `"${u.id || ""}"`,
          `"${(u.firstName || "").replace(/"/g, '""')}"`,
          `"${(u.lastName || "").replace(/"/g, '""')}"`,
          `"${(`${u.firstName || ""} ${u.lastName || ""}`).trim().replace(/"/g, '""')}"`,
          `"${(u.email || "").replace(/"/g, '""')}"`,
          `"${(u.phone || "").replace(/"/g, '""')}"`,
          `"${(u.role || "trainee").replace(/"/g, '""')}"`,
          `"${(cohortToExport.name || "").replace(/"/g, '""')}"`,
          `"${groupNames.replace(/"/g, '""')}"`,
          `"${practicalDays.replace(/"/g, '""')}"`,
          `"${physicalSiteName.replace(/"/g, '""')}"`,
          `"${(u.assignedLga || u.lga || "").replace(/"/g, '""')}"`,
          `"${(u.assignedState || u.state || "").replace(/"/g, '""')}"`,
          `"${(u.institution || "").replace(/"/g, '""')}"`,
          `"${accountStatus}"`,
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      const sanitizedCohort = cohortToExport.name.replace(/[^a-z0-9]/gi, "_");
      const sanitizedGroup = specificGroup ? `_${specificGroup.name.replace(/[^a-z0-9]/gi, "_")}` : "";
      const filename = `${sanitizedCohort}${sanitizedGroup}_Members_${new Date().toISOString().slice(0, 10)}.csv`;

      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      popup.alert("Failed to export cohort members CSV: " + (err.message || "Unknown error"));
    } finally {
      setExportingCohortId(null);
    }
  };

  // Physical sites workspace
  const [siteFilter, setSiteFilter]         = useState("all");
  const [updatingUserSiteId, setUpdatingUserSiteId] = useState<string | null>(null);

  // ─── DATA FETCHING ───────────────────────────

  const fetchCohorts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch("/cohorts");
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load cohorts"); return; }
      setCohorts(data);
    } catch {
      setError("Failed to load cohorts.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalUsers = async (force: boolean = false) => {
    if (globalUsers.length > 0 && !force) return;
    if (globalUsers.length === 0) setLoadingUsers(true);
    try {
      const res = await authFetch("/users?limit=300");
      if (res.ok) {
        const data = await res.json();
        const pageUsers = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.users)
          ? data.users
          : [];
        const cleanUsers = pageUsers.filter((u: any) => !u.isCooperativeOnly);
        if (cleanUsers.length > 0) {
          setGlobalUsers(cleanUsers);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("oriyon_cached_users", JSON.stringify(cleanUsers));
            } catch {}
          }
        }
      }
    } catch {}
    finally {
      setLoadingUsers(false);
    }
  };

  const fetchSingleCohortDetails = async (cohortId: string) => {
    try {
      const res = await authFetch(`/cohorts/${cohortId}`);
      const data = await res.json();
      if (res.ok && data.members) setCurrentCohortMembers(data.members);
    } catch {}
  };

  const fetchGroups = async (cohortId: string) => {
    setLoadingGroups(true);
    try {
      const res = await authFetch(`/cohorts/${cohortId}/groups`);
      if (res.ok) setGroups(await res.json());
    } catch {}
    finally { setLoadingGroups(false); }
  };

  useEffect(() => {
    fetchCohorts();
    fetchGlobalUsers();
  }, []);

  useEffect(() => {
    if (!enrollUserSearch.trim()) return;
    const timer = setTimeout(async () => {
      try {
        const res = await authFetch(`/users?search=${encodeURIComponent(enrollUserSearch.trim())}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          const searched = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
          if (searched.length > 0) {
            setGlobalUsers((prev) => {
              const map = new Map(prev.map((u) => [u.id, u]));
              searched.forEach((u: any) => {
                if (!u.isCooperativeOnly) map.set(u.id, u);
              });
              return Array.from(map.values());
            });
          }
        }
      } catch {}
    }, 250);
    return () => clearTimeout(timer);
  }, [enrollUserSearch]);

  useEffect(() => {
    if (!addGroupMemberSearch.trim()) return;
    const timer = setTimeout(async () => {
      try {
        const res = await authFetch(`/users?search=${encodeURIComponent(addGroupMemberSearch.trim())}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          const searched = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
          if (searched.length > 0) {
            setGlobalUsers((prev) => {
              const map = new Map(prev.map((u) => [u.id, u]));
              searched.forEach((u: any) => {
                if (!u.isCooperativeOnly) map.set(u.id, u);
              });
              return Array.from(map.values());
            });
          }
        }
      } catch {}
    }, 250);
    return () => clearTimeout(timer);
  }, [addGroupMemberSearch]);

  // ─── COMPUTED DATA ───────────────────────────

  const cohortlessTrainees = useMemo(() => {
    return globalUsers.filter(
      (u) => u.role === "trainee" && (!u.cohorts || u.cohorts.length === 0)
    );
  }, [globalUsers]);

  const totalEnrolledCount = useMemo(() => {
    return globalUsers.filter((u) => u.cohorts && u.cohorts.length > 0).length;
  }, [globalUsers]);

  const filteredCohorts = useMemo(() => {
    return cohorts.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        selectedStatusFilter === "all" ||
        (selectedStatusFilter === "active" ? c.isActive : !c.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [cohorts, searchTerm, selectedStatusFilter]);

  const enrolledCohortUsers = useMemo(() => {
    const globalUserMap = new Map<string, User>();
    (Array.isArray(globalUsers) ? globalUsers : []).forEach((u) => {
      if (u.id) globalUserMap.set(u.id, u);
    });

    groups.forEach((g) => {
      (g.members || []).forEach((m: any) => {
        const uId = m.id || m.userId;
        if (uId && !globalUserMap.has(uId)) {
          globalUserMap.set(uId, {
            id: uId,
            firstName: m.firstName || "Trainee",
            lastName: m.lastName || "",
            email: m.email || "",
            phone: m.phone || "",
            role: m.role || "trainee",
            isActive: m.isActive ?? true,
            cohortId: selectedCohort?.id || null,
            idType: null,
            idFilename: null,
            idMimeType: null,
            idUploadedAt: null,
            kycStatus: null,
            kycRejectionReason: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            physicalSiteId: m.physicalSiteId || null,
          });
        }
      });
    });

    const enrolledList: User[] = [];
    (Array.isArray(currentCohortMembers) ? currentCohortMembers : []).forEach((cm: any) => {
      const uId = cm.userId || cm.id;
      if (!uId) return;
      if (globalUserMap.has(uId)) {
        enrolledList.push(globalUserMap.get(uId)!);
      } else {
        enrolledList.push({
          id: uId,
          firstName: cm.firstName || cm.user?.firstName || "Trainee",
          lastName: cm.lastName || cm.user?.lastName || "",
          email: cm.email || cm.user?.email || "",
          phone: cm.phone || cm.user?.phone || "",
          role: "trainee",
          isActive: true,
          cohortId: cm.cohortId || selectedCohort?.id || null,
          cohorts: selectedCohort ? [{ id: selectedCohort.id, name: selectedCohort.name }] : [],
          createdAt: cm.enrolledAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return enrolledList;
  }, [globalUsers, currentCohortMembers, groups, selectedCohort]);

  const selectedGroupDetail = useMemo(() => {
    if (!selectedGroupId) return null;
    return groups.find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // ─── PAGINATED & FILTERED DATA ──────────────────

  const filteredEnrollCandidates = useMemo(() => {
    return globalUsers.filter((u) => {
      if (hideEnrolledInCohort && u.cohorts && u.cohorts.length > 0) return false;
      const query = enrollUserSearch.toLowerCase().trim();
      if (!query) return true;
      const terms = query.split(/\s+/).filter(Boolean);
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = String(u.phone || "").toLowerCase();
      return terms.every((term) =>
        fullName.includes(term) || email.includes(term) || phone.includes(term)
      );
    });
  }, [globalUsers, hideEnrolledInCohort, enrollUserSearch]);

  const enrollCandidateTotalPages = Math.max(1, Math.ceil(filteredEnrollCandidates.length / 15));
  const paginatedEnrollCandidates = useMemo(() => {
    const start = (enrollUserPage - 1) * 15;
    return filteredEnrollCandidates.slice(start, start + 15);
  }, [filteredEnrollCandidates, enrollUserPage]);

  const filteredEnrolledList = useMemo(() => {
    return enrolledCohortUsers.filter((member) => {
      const query = enrolledListSearch.toLowerCase().trim();
      if (!query) return true;
      const terms = query.split(/\s+/).filter(Boolean);
      const fullName = `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();
      const email = (member.email || "").toLowerCase();
      return terms.every((term) => fullName.includes(term) || email.includes(term));
    });
  }, [enrolledCohortUsers, enrolledListSearch]);

  const enrolledListTotalPages = Math.max(1, Math.ceil(filteredEnrolledList.length / 8));
  const paginatedEnrolledList = useMemo(() => {
    const start = (enrolledListPage - 1) * 8;
    return filteredEnrolledList.slice(start, start + 8);
  }, [filteredEnrolledList, enrolledListPage]);

  const filteredGroupCandidates = useMemo(() => {
    if (!selectedGroupDetail) return [];
    return enrolledCohortUsers.filter((u) => {
      if (selectedGroupDetail.members.some((m) => m.id === u.id)) return false;
      if (hideAssignedToGroup && groups.some((g) => g.members.some((m) => m.id === u.id))) return false;
      const query = addGroupMemberSearch.toLowerCase().trim();
      if (!query) return true;
      const terms = query.split(/\s+/).filter(Boolean);
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = String(u.phone || "").toLowerCase();
      return terms.every((term) =>
        fullName.includes(term) || email.includes(term) || phone.includes(term)
      );
    });
  }, [enrolledCohortUsers, selectedGroupDetail, hideAssignedToGroup, groups, addGroupMemberSearch]);

  const addGroupCandidateTotalPages = Math.max(1, Math.ceil(filteredGroupCandidates.length / 15));
  const paginatedGroupCandidates = useMemo(() => {
    const start = (addGroupPage - 1) * 15;
    return filteredGroupCandidates.slice(start, start + 15);
  }, [filteredGroupCandidates, addGroupPage]);

  const filteredGroupMembers = useMemo(() => {
    if (!selectedGroupDetail) return [];
    return selectedGroupDetail.members.filter((m) => {
      if (!groupMemberSearch) return true;
      const query = groupMemberSearch.toLowerCase().trim();
      const terms = query.split(/\s+/).filter(Boolean);
      const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
      const email = (m.email || "").toLowerCase();
      return terms.every((term) => fullName.includes(term) || email.includes(term));
    });
  }, [selectedGroupDetail, groupMemberSearch]);

  const groupMemberTotalPages = Math.max(1, Math.ceil(filteredGroupMembers.length / 8));
  const paginatedGroupMembers = useMemo(() => {
    const start = (groupMemberPage - 1) * 8;
    return filteredGroupMembers.slice(start, start + 8);
  }, [filteredGroupMembers, groupMemberPage]);

  // ─── HANDLERS ────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const openCreateCohortModal = () => {
    setEditingCohort(null);
    setForm(emptyForm);
    setIsTbdDate(false);
    setFormError("");
    setShowCohortModal(true);
  };

  const openEditCohortModal = (cohort: Cohort) => {
    setEditingCohort(cohort);
    const hasDates = Boolean(cohort.startDate && cohort.endDate);
    setIsTbdDate(!hasDates);
    setForm({
      name: cohort.name,
      startDate: cohort.startDate ? new Date(cohort.startDate).toISOString().split("T")[0] : "",
      endDate: cohort.endDate ? new Date(cohort.endDate).toISOString().split("T")[0] : "",
      isActive: cohort.isActive,
    });
    setFormError("");
    setShowCohortModal(true);
  };

  const handleSaveCohort = async () => {
    setFormError("");
    if (!form.name.trim()) {
      return setFormError("Cohort name is required.");
    }
    if (!isTbdDate) {
      if (!form.startDate || !form.endDate) {
        return setFormError("Please enter start and end dates, or check 'Dates to be decided'.");
      }
      if (form.endDate <= form.startDate) {
        return setFormError("End date must be after the start date.");
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        startDate: isTbdDate ? null : form.startDate,
        endDate: isTbdDate ? null : form.endDate,
        isActive: form.isActive,
      };

      const url = editingCohort ? `/cohorts/${editingCohort.id}` : "/cohorts";
      const method = editingCohort ? "PATCH" : "POST";

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || `Failed to ${editingCohort ? "update" : "create"} cohort.`);
        return;
      }

      setShowCohortModal(false);
      setEditingCohort(null);
      setForm(emptyForm);
      await fetchCohorts();
    } catch {
      setFormError("Something went wrong while saving cohort.");
    } finally {
      setSubmitting(false);
    }
  };

  const openModalForCohort = async (cohort: Cohort, modal: ActiveModal) => {
    setSelectedCohort(cohort);
    setActiveModal(modal);
    setSelectedGroupId(null);
    setGroupMemberSearch("");
    setAddGroupMemberSearch("");
    setEnrollUserSearch("");
    setEnrolledListSearch("");
    setSiteMemberSearch("");
    setTrainerSearch("");
    setEnrollUserPage(1);
    setEnrolledListPage(1);
    setAddGroupPage(1);
    setGroupMemberPage(1);

    if (modal === "enrol") {
      setSelectedUser("");
      setEnrollError("");
      fetchSingleCohortDetails(cohort.id);
      fetchGlobalUsers();
    } else if (modal === "groups") {
      setGroupForm({ name: "", practicalDay: "" });
      setGroupError("");
      setEditingGroupId(null);
      fetchSingleCohortDetails(cohort.id);
      fetchGroups(cohort.id);
      fetchGlobalUsers();
    } else if (modal === "sites") {
      fetchSingleCohortDetails(cohort.id);
      fetchGroups(cohort.id);
      fetchGlobalUsers();
    } else if (modal === "notifyGroup") {
      setNotifyLocation("LAUTECH Ogbomoso");
      setNotifyTimeRange("9:00 AM – 5:00 PM");
      setNotifyError("");
      setNotifySuccess("");
      setNotifyDryRunResult(null);
      await Promise.all([
        fetchSingleCohortDetails(cohort.id),
        fetchGroups(cohort.id),
      ]);
    }
  };

  const handleSendNotifyGroup = async (dryRun: boolean = false) => {
    if (!selectedCohort) return;
    setNotifySending(true);
    setNotifyError("");
    setNotifySuccess("");
    try {
      const res = await authFetch(`/cohorts/${selectedCohort.id}/notify-group-assignment`, {
        method: "POST",
        body: JSON.stringify({
          location: notifyLocation.trim() || "LAUTECH Ogbomoso",
          timeRange: notifyTimeRange.trim() || "9:00 AM – 5:00 PM",
          dryRun,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotifyError(data.error || "Failed to dispatch notifications.");
      } else {
        if (dryRun) {
          setNotifyDryRunResult(data);
          setNotifySuccess(`Dry run complete: Found ${data.count} trainees in ${selectedCohort.name}. Ready to dispatch.`);
        } else {
          setNotifySuccess(data.message || `Successfully sent physical training & group notifications to ${data.count} trainees!`);
          setNotifyDryRunResult(data);
        }
      }
    } catch (err: any) {
      setNotifyError("Something went wrong while communicating with the notification service.");
    } finally {
      setNotifySending(false);
    }
  };

  const openBulkEmailModal = () => {
    setSelectedCohort(null);
    setActiveModal("email");
    fetchGlobalUsers();
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedCohort(null);
    setSelectedGroupId(null);
  };

  const handleEnroll = async () => {
    if (!selectedCohort || !selectedUser) return setEnrollError("Please select a user.");
    setEnrolling(true);
    setEnrollError("");

    const userIdToEnrol = selectedUser;
    const cohortId = selectedCohort.id;
    const cohortName = selectedCohort.name;

    try {
      const res = await authFetch(`/cohorts/${cohortId}/enrol`, {
        method: "POST",
        body: JSON.stringify({ userId: userIdToEnrol }),
      });

      if (!res.ok) {
        const data = await res.json();
        setEnrollError(data.error || "Failed to enrol.");
        setEnrolling(false);
        return;
      }

      // 1. Immediately reset form dropdown and loading state
      setSelectedUser("");
      setEnrolling(false);

      // 2. Optimistic update of enrolled members list
      setCurrentCohortMembers((prev) => {
        if (prev.some((m) => m.userId === userIdToEnrol)) return prev;
        return [...prev, { id: crypto.randomUUID(), userId: userIdToEnrol, cohortId, enrolledAt: new Date().toISOString() }];
      });

      // 3. Optimistic update of global users cohort list
      setGlobalUsers((prev) =>
        prev.map((u) => {
          if (u.id === userIdToEnrol) {
            const existingCohorts = u.cohorts || [];
            if (!existingCohorts.some((c) => c.id === cohortId)) {
              return { ...u, cohorts: [...existingCohorts, { id: cohortId, name: cohortName }] };
            }
          }
          return u;
        })
      );

      popup.alert("✓ Trainee enrolled successfully!");

      // 4. Background sync with backend
      fetchCohorts();
      fetchGlobalUsers();
      fetchSingleCohortDetails(cohortId);
    } catch {
      setEnrollError("Something went wrong.");
      setEnrolling(false);
    }
  };

  const getUserSiteObj = (user: { physicalSiteId?: string; siteId?: string; institution?: string; assignedLga?: string; lga?: string }) => {
    const site = getPhysicalSiteById(user.physicalSiteId || user.siteId);
    if (site) {
      return { site, isCustom: true };
    }
    return { site: null, isCustom: false };
  };

  const handleUpdateUserSite = async (userId: string, physicalSiteId: string) => {
    setUpdatingUserSiteId(userId);
    try {
      const res = await authFetch(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ physicalSiteId: physicalSiteId || null }),
      });
      if (res.ok) {
        setGlobalUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, physicalSiteId: physicalSiteId || undefined } : u))
        );
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            members: (g.members || []).map((m) =>
              m.id === userId ? { ...m, physicalSiteId: physicalSiteId || undefined } : m
            ),
          }))
        );
      } else {
        const data = await res.json();
        popup.alert(data.error || "Failed to update physical site.");
      }
    } catch {
      popup.alert("Failed to update physical site.");
    } finally {
      setUpdatingUserSiteId(null);
    }
  };

  const handleBulkAssignGroupSite = async (groupId: string, physicalSiteId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group || !group.members || group.members.length === 0) return;
    const targetSite = getPhysicalSiteById(physicalSiteId);
    const targetSiteName = targetSite ? targetSite.name : "Unassigned";
    if (!(await popup.confirm(`Assign all ${group.members.length} members of ${group.name} to ${targetSiteName}?`))) return;

    setUpdatingUserSiteId(groupId);
    try {
      await Promise.all(
        group.members.map((m) =>
          authFetch(`/users/${m.id}`, {
            method: "PATCH",
            body: JSON.stringify({ physicalSiteId }),
          })
        )
      );
      if (selectedCohort) {
        await Promise.all([fetchGroups(selectedCohort.id), fetchGlobalUsers()]);
      }
    } catch {
      popup.alert("Failed during bulk physical site assignment.");
    } finally {
      setUpdatingUserSiteId(null);
    }
  };

  const createGroup = async () => {
    if (!selectedCohort || !groupForm.name.trim()) return setGroupError("Group name is required");
    setCreatingGroup(true);
    try {
      const res = await authFetch(`/cohorts/${selectedCohort.id}/groups`, {
        method: "POST",
        body: JSON.stringify(groupForm),
      });
      if (!res.ok) {
        const data = await res.json();
        setGroupError(data.error || "Failed to create group.");
        return;
      }
      setGroupForm({ name: "", practicalDay: "" });
      await fetchGroups(selectedCohort.id);
    } catch {
      setGroupError("Could not create group.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setEditGroupForm({ name: group.name, practicalDay: group.practicalDay || "" });
  };

  const handleUpdateGroup = async () => {
    if (!selectedCohort || !editingGroupId || !editGroupForm.name.trim()) return;
    try {
      const res = await authFetch(`/cohorts/${selectedCohort.id}/groups/${editingGroupId}`, {
        method: "PATCH",
        body: JSON.stringify(editGroupForm),
      });
      if (res.ok) {
        setEditingGroupId(null);
        await fetchGroups(selectedCohort.id);
      } else {
        const data = await res.json();
        setGroupError(data.error || "Failed to update group.");
      }
    } catch {
      setGroupError("Could not update group.");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!selectedCohort || !(await popup.confirm("Are you sure you want to delete this group? All group membership mappings will be lost."))) return;
    try {
      const res = await authFetch(`/cohorts/${selectedCohort.id}/groups/${groupId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedGroupId === groupId) setSelectedGroupId(null);
        await fetchGroups(selectedCohort.id);
      } else {
        const data = await res.json();
        setGroupError(data.error || "Failed to delete group.");
      }
    } catch {
      setGroupError("Could not delete group.");
    }
  };

  const handleAddMemberToGroup = async (groupId: string) => {
    if (!selectedMemberUserId || !selectedCohort) return;
    setAddingMember(true);
    try {
      const res = await authFetch(`/cohorts/${selectedCohort.id}/groups/${groupId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: selectedMemberUserId }),
      });
      if (res.ok) {
        setSelectedMemberUserId("");
        await fetchGroups(selectedCohort.id);
      } else {
        const data = await res.json();
        setGroupError(data.error || "Failed to add member.");
      }
    } catch {
      setGroupError("Could not add member.");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    if (!selectedCohort) return;
    setRemovingMemberId(userId);
    try {
      const res = await authFetch(
        `/cohorts/${selectedCohort.id}/groups/${groupId}/members/${userId}`,
        { method: "DELETE" }
      );
      if (res.ok) await fetchGroups(selectedCohort.id);
      else {
        const data = await res.json();
        setGroupError(data.error || "Failed to remove member.");
      }
    } catch {
      setGroupError("Could not remove member.");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const executeAutoGrouping = async () => {
    if (!selectedCohort) return;

    setAutoGrouping(true);
    setGroupError("");
    setShowAutoGroupConfirm(false);

    try {
      // 1. Fetch current groups
      const groupsRes = await authFetch(`/cohorts/${selectedCohort.id}/groups`);
      if (!groupsRes.ok) throw new Error("Failed to retrieve existing groups.");
      let currentGroups = await groupsRes.json();

      // 2. Ensure Group A to E exist with fixed Monday-Friday physical practical schedules
      const groupNames = ["Group A", "Group B", "Group C", "Group D", "Group E"];
      const defaultDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

      const missingNames = groupNames.filter(
        name => !currentGroups.some((g: any) => g.name.toLowerCase() === name.toLowerCase())
      );

      if (missingNames.length > 0) {
        for (const name of missingNames) {
          const dayIndex = groupNames.indexOf(name);
          const practicalDay = defaultDays[dayIndex >= 0 ? dayIndex : 0];
          const createRes = await authFetch(`/cohorts/${selectedCohort.id}/groups`, {
            method: "POST",
            body: JSON.stringify({ name, practicalDay }),
          });
          if (!createRes.ok) {
            const errData = await createRes.json();
            throw new Error(errData.error || `Failed to create group ${name}`);
          }
        }
        // Refetch groups
        const refetchRes = await authFetch(`/cohorts/${selectedCohort.id}/groups`);
        if (refetchRes.ok) {
          currentGroups = await refetchRes.json();
        }
      }

      // Sync practical days for any existing Groups A-E if missing
      for (let i = 0; i < groupNames.length; i++) {
        const gName = groupNames[i];
        const targetDay = defaultDays[i];
        const matchGroup = currentGroups.find((g: any) => g.name.toLowerCase() === gName.toLowerCase());
        if (matchGroup && (!matchGroup.practicalDay || matchGroup.practicalDay === "To be decided")) {
          await authFetch(`/cohorts/${selectedCohort.id}/groups/${matchGroup.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: matchGroup.name, practicalDay: targetDay }),
          });
        }
      }

      // Filter groups to ensure we are working with exactly 5 groups
      let targetGroups = currentGroups.filter((g: any) =>
        groupNames.some(name => g.name.toLowerCase() === name.toLowerCase())
      );
      if (targetGroups.length < 5) {
        targetGroups = currentGroups.slice(0, 5);
      }

      if (targetGroups.length < 5) {
        throw new Error(`Only ${targetGroups.length} groups found. Auto-grouping requires 5 groups.`);
      }

      // 3. Fetch ALL users across all pages
      const fetchAllUsers = async () => {
        try {
          const res = await authFetch("/users?page=1&limit=1000");
          if (!res.ok) return [];
          const data = await res.json();
          return Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        } catch {
          return [];
        }
      };

      let detailsRes = await authFetch(`/cohorts/${selectedCohort.id}`);
      if (!detailsRes.ok) throw new Error("Failed to load cohort details.");

      let allUsers = await fetchAllUsers();
      let cohortDetails = await detailsRes.json();
      let cohortMembers = cohortDetails.members || [];

      // Only include trainees that are active (have set up their account)
      // AND are already enrolled in this cohort
      let cohortTrainees = allUsers.filter((u: any) =>
        u.role === "trainee" && u.isActive === true && cohortMembers.some((m: any) => m.userId === u.id)
      );

      // 4. Reset current memberships for the 5 target groups
      for (const g of targetGroups) {
        if (g.members && g.members.length > 0) {
          for (const m of g.members) {
            await authFetch(`/cohorts/${selectedCohort.id}/groups/${g.id}/members/${m.id}`, {
              method: "DELETE"
            });
          }
        }
      }

      // 5. Partition all cohort trainees into the 5 groups evenly
      const groupAssignments = targetGroups.map((g: any) => ({
        groupId: g.id,
        userIds: [] as string[]
      }));

      cohortTrainees.forEach((trainee: any, index: number) => {
        const groupIndex = index % 5;
        if (groupAssignments[groupIndex].userIds.length < MAX_GROUP_CAPACITY) {
          groupAssignments[groupIndex].userIds.push(trainee.id);
        }
      });

      // 6. Enrol trainees into their assigned groups
      for (const assignment of groupAssignments) {
        for (const userId of assignment.userIds) {
          const enrollRes = await authFetch(`/cohorts/${selectedCohort.id}/groups/${assignment.groupId}/members`, {
            method: "POST",
            body: JSON.stringify({ userId }),
          });
          if (!enrollRes.ok) {
            console.error(`Failed to assign user ${userId} to group ${assignment.groupId}`);
          }
        }
      }

      // 7. Refresh lists
      await Promise.all([
        fetchGroups(selectedCohort.id),
        fetchSingleCohortDetails(selectedCohort.id),
        fetchGlobalUsers(),
      ]);

      setAutoGroupSuccessMessage(`Successfully distributed ${cohortTrainees.length} active trainees from this cohort into 5 groups evenly!`);
      setShowAutoGroupSuccess(true);
    } catch (err: any) {
      setGroupError(err.message || "An error occurred during auto-grouping.");
    } finally {
      setAutoGrouping(false);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!bulkSubject.trim() || !bulkBody.trim()) {
      return setBulkError("Subject and message body are required.");
    }
    setBulkSending(true);
    setBulkError("");
    setBulkSuccess("");

    try {
      const res = await authFetch("/users/bulk-email", {
        method: "POST",
        body: JSON.stringify({
          subject: bulkSubject,
          body: bulkBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBulkError(data.error || "Failed to send bulk email.");
        return;
      }

      setBulkSuccess(`Successfully sent email to ${data.count} trainees!`);
      setBulkSubject("");
      setBulkBody("");
      await fetchGlobalUsers();
    } catch {
      setBulkError("Something went wrong while sending bulk emails.");
    } finally {
      setBulkSending(false);
    }
  };

  // ─────────────────────────────────────────────
  // MAIN VIEWPORT RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sora">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 md:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-lg shadow-2xs">
              🎓
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Cohorts Management
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Organize training cohorts, practical groups (Group A–E), physical site assignments, and bulk outreach.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={openBulkEmailModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition shadow-2xs cursor-pointer min-h-[44px]"
          >
            <span>✉️</span> Bulk Email ({cohortlessTrainees.length})
          </button>
          <button
            onClick={openCreateCohortModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold rounded-2xl transition shadow-sm cursor-pointer min-h-[44px]"
          >
            <span>+</span> New Cohort
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl shadow-2xs font-medium">
          {error}
        </div>
      )}

      {/* Stats Metric Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Cohorts</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{cohorts.length}</p>
          <p className="text-[11px] font-bold text-emerald-600">
            {cohorts.filter(c => c.isActive).length} Active Cohorts
          </p>
        </div>
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Enrolled Trainees</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{totalEnrolledCount}</p>
          <p className="text-[11px] font-bold text-teal-600">Across All Cohorts</p>
        </div>
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Physical Sites</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{PHYSICAL_SITES.length}</p>
          <p className="text-[11px] font-bold text-amber-600">Ogbomoso, Iseyin, UI Ibadan</p>
        </div>
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Cohortless Trainees</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{cohortlessTrainees.length}</p>
          <p className="text-[11px] font-bold text-indigo-600">Pending Cohort Allocation</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <input
            placeholder="Search cohort by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium transition"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="flex-1 md:flex-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Cohorts Grid / List View */}
      <div className="w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white/80 rounded-2xl border border-slate-200 text-slate-400 text-xs font-semibold animate-pulse">
            Loading cohorts ecosystem...
          </div>
        ) : filteredCohorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white/90 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold">
              🎓
            </div>
            <p className="text-sm font-bold text-slate-800">No cohorts found</p>
            <p className="text-xs text-slate-400">Try clearing filters or create a new cohort.</p>
            <button
              onClick={openCreateCohortModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              + New Cohort
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCohorts.map((cohort) => {
              const isSelected = selectedCohort?.id === cohort.id;
              const isTBD = !cohort.startDate || !cohort.endDate;

              return (
                <div
                  key={cohort.id}
                  className={`bg-white border rounded-3xl p-5 md:p-6 transition-all duration-200 shadow-2xs flex flex-col justify-between space-y-4 ${
                    isSelected && activeModal
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base md:text-lg text-slate-900">
                          {cohort.name}
                        </h3>
                        <button
                          onClick={() => openEditCohortModal(cohort)}
                          className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit Cohort"
                        >
                          ✏️
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                          cohort.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {cohort.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Dates Display */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1 border-t border-slate-100">
                      {isTBD ? (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold flex items-center gap-1.5">
                          <span>📅</span> Date: To Be Decided (TBD)
                        </span>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">📅 Start:</span>
                            <span className="font-bold text-slate-800">
                              {new Date(cohort.startDate!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">🏁 End:</span>
                            <span className="font-bold text-slate-800">
                              {new Date(cohort.endDate!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
                    <button
                      onClick={() => openModalForCohort(cohort, "groups")}
                      className="flex-1 px-3.5 py-2.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xs transition flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                    >
                      <span>👥</span> Groups (A–E) ↗
                    </button>
                    <button
                      onClick={() => openModalForCohort(cohort, "sites")}
                      className="px-3 py-2.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-2xl transition flex items-center justify-center gap-1 min-h-[44px] cursor-pointer"
                    >
                      <span>📍</span> Sites
                    </button>
                    <button
                      onClick={() => openModalForCohort(cohort, "enrol")}
                      className="px-3 py-2.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl transition flex items-center justify-center gap-1 min-h-[44px] cursor-pointer"
                    >
                      <span>🎓</span> Enrol
                    </button>
                    <button
                      onClick={() => handleExportCohortCSV(cohort)}
                      disabled={exportingCohortId === cohort.id}
                      className="px-3 py-2.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-2xl transition flex items-center justify-center gap-1 min-h-[44px] cursor-pointer disabled:opacity-50"
                      title="Export cohort members and group assignments to CSV"
                    >
                      <span>📥</span> {exportingCohortId === cohort.id ? "Exporting..." : "Export CSV"}
                    </button>
                    <button
                      onClick={() => openModalForCohort(cohort, "notifyGroup")}
                      className="px-3 py-2.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-2xl transition flex items-center justify-center gap-1 min-h-[44px] cursor-pointer"
                      title="Send Group Allocation, Location (LAUTECH Ogbomoso) & Physical Training Time Email Notification"
                    >
                      <span>📧</span> Notify Groups
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────
          DEDICATED WORKSPACE MODALS
         ───────────────────────────────────────────── */}

      {/* 1. GROUPS MODAL */}
      {activeModal === "groups" && selectedCohort && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 font-sora">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {selectedGroupId ? (
                  <button
                    onClick={() => setSelectedGroupId(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition shadow-2xs shrink-0 cursor-pointer"
                  >
                    <span>←</span> Back to All Groups
                  </button>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                    👥
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-black text-slate-900 text-base truncate">
                    {selectedGroupDetail ? selectedGroupDetail.name : `${selectedCohort.name} — Groups`}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {selectedGroupDetail
                      ? `${selectedGroupDetail.memberCount} Trainees Enrolled • Practical Schedule: ${selectedGroupDetail.practicalDay || getGroupPracticalDay(selectedGroupDetail.name)}`
                      : "Manage Group A–E assignments, schedules, and members without restrictions."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleExportCohortCSV(selectedCohort)}
                  disabled={exportingCohortId === selectedCohort.id}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Export all cohort members and group assignments to CSV"
                >
                  <span>📥</span> {exportingCohortId === selectedCohort.id ? "Exporting..." : "Export Members CSV"}
                </button>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition shrink-0 ml-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              {groupError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl flex items-center justify-between font-medium">
                  <span>{groupError}</span>
                  <button onClick={() => setGroupError("")} className="text-red-500 font-bold hover:text-red-700">✕</button>
                </div>
              )}

              {/* ── SCREEN 1: GROUPS LIST VIEW (Group A - E) ── */}
              {!selectedGroupId && (
                <div className="space-y-5">

                  {/* Auto-Group Utility Card */}
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-5 space-y-3 shadow-md">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-white/20 text-sm">⚡</span>
                        <h3 className="text-sm font-black tracking-wide uppercase">Smart Auto-Grouping Utility</h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                        5 Groups (A–E)
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-emerald-50 font-medium">
                      Automatically distribute all active enrolled trainees in <strong>{selectedCohort.name}</strong> evenly across Groups A, B, C, D, and E with fixed physical practical days (Monday to Friday).
                    </p>
                    <button
                      onClick={() => setShowAutoGroupConfirm(true)}
                      disabled={autoGrouping}
                      className="w-full py-3 bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-extrabold rounded-2xl transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
                    >
                      {autoGrouping ? (
                        <span>Processing Auto-Grouping...</span>
                      ) : (
                        <>
                          <span>⚡</span> Run Auto-Group Utility Now
                        </>
                      )}
                    </button>
                  </div>

                  {/* Create New Group Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
                    <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                      Add Custom Practical Group
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        placeholder="Group Name (e.g. Group A)..."
                        value={groupForm.name}
                        onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium shadow-2xs"
                      />
                      <input
                        placeholder="Practical Day (e.g. Monday)..."
                        value={groupForm.practicalDay}
                        onChange={(e) => setGroupForm(prev => ({ ...prev, practicalDay: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && createGroup()}
                        className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium shadow-2xs"
                      />
                      <button
                        onClick={createGroup}
                        disabled={creatingGroup || !groupForm.name.trim()}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition disabled:opacity-40 shadow-xs cursor-pointer min-h-[40px]"
                      >
                        {creatingGroup ? "Creating..." : "+ Create Group"}
                      </button>
                    </div>
                  </div>

                  {/* Groups List Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        Available Groups ({groups.length})
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">Click any group card to view full member details</p>
                    </div>

                    {loadingGroups ? (
                      <p className="text-center text-xs text-slate-500 py-10 animate-pulse">Loading groups...</p>
                    ) : groups.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 text-xs font-medium bg-slate-50/50">
                        No groups configured yet. Click auto-grouping or create one above.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {groups.map((group) => {
                          const capacityPct = Math.min(100, Math.round((group.memberCount / MAX_GROUP_CAPACITY) * 100));

                          return (
                            <div
                              key={group.id}
                              onClick={() => setSelectedGroupId(group.id)}
                              className="p-4 bg-white border border-slate-200 hover:border-emerald-400 rounded-3xl shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3 group/card"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-sm font-black text-slate-900 group-hover/card:text-emerald-700 transition">
                                    {group.name}
                                  </h4>
                                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
                                    📅 {group.practicalDay || getGroupPracticalDay(group.name)}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                                  <span>Assigned Trainees</span>
                                  <span className="font-extrabold text-slate-900">{group.memberCount} / {MAX_GROUP_CAPACITY}</span>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      group.memberCount >= MAX_GROUP_CAPACITY ? "bg-rose-500" : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${capacityPct}%` }}
                                  />
                                </div>

                                {/* Assigned Teaching Trainers */}
                                <div className="pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[11px] font-extrabold uppercase text-purple-900 tracking-wider flex items-center gap-1">
                                      <span>🎓</span> Teaching Trainers ({group.trainers?.length || 0})
                                    </span>
                                    <button
                                      onClick={() => handleOpenAssignTrainerModal(group)}
                                      className="px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>+</span> Assign Trainer
                                    </button>
                                  </div>

                                  {(!group.trainers || group.trainers.length === 0) ? (
                                    <p className="text-[11px] text-slate-400 font-medium italic">No trainer assigned to this practical day yet.</p>
                                  ) : (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {group.trainers.map((tr: any, idx: number) => (
                                        <span
                                          key={tr.assignmentId || `${tr.id}-${idx}`}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs font-bold shadow-2xs"
                                        >
                                          {tr.passportPicture ? (
                                            <img src={tr.passportPicture} className="w-4 h-4 rounded-full object-cover" alt="" />
                                          ) : (
                                            <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-extrabold flex items-center justify-center">
                                              {tr.firstName?.[0] || "T"}
                                            </span>
                                          )}
                                          <span>{tr.firstName} {tr.lastName}</span>
                                          {tr.assignedDay && (
                                            <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded-md">
                                              📅 {tr.assignedDay}
                                            </span>
                                          )}
                                          {tr.specialization && (
                                            <span className="text-[9px] font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded-md">
                                              🎓 {tr.specialization}
                                            </span>
                                          )}
                                          <button
                                            onClick={() => handleRemoveTrainerFromGroup(selectedCohort.id, group.id, tr.id, tr.assignmentId, tr.assignedDay)}
                                            className="text-slate-400 hover:text-rose-600 text-[10px] font-extrabold ml-1 cursor-pointer"
                                            title="Remove trainer assignment"
                                          >
                                            ✕
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <span className="text-xs font-extrabold text-emerald-600 group-hover/card:translate-x-1 transition flex items-center gap-1">
                                  Open Group Details & Members →
                                </span>
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleEditGroup(group)}
                                    className="p-1.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                                    title="Edit group schedule"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGroup(group.id)}
                                    className="p-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-slate-200 transition"
                                    title="Delete group"
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
                  </div>
                </div>
              )}

              {/* ── SCREEN 2: FULL DETAILS OF SELECTED GROUP ── */}
              {selectedGroupId && selectedGroupDetail && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  
                  {/* Group Info Summary Header */}
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-lg font-black text-slate-900">{selectedGroupDetail.name}</h3>
                          <span className="px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full text-xs font-black">
                            📅 {selectedGroupDetail.practicalDay || getGroupPracticalDay(selectedGroupDetail.name)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Total Members: <strong className="text-slate-900 font-black">{selectedGroupDetail.memberCount}</strong> / {MAX_GROUP_CAPACITY} trainees
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleExportCohortCSV(selectedCohort, selectedGroupDetail)}
                          disabled={exportingCohortId === selectedCohort.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <span>📥</span> {exportingCohortId === selectedCohort.id ? "Exporting..." : "Export Group CSV"}
                        </button>
                        <button
                          onClick={() => handleEditGroup(selectedGroupDetail)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition"
                        >
                          ✏️ Edit Schedule
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(selectedGroupDetail.id)}
                          className="px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition"
                        >
                          🗑️ Delete Group
                        </button>
                      </div>
                    </div>

                    {/* Assigned Practical Teaching Trainers Section */}
                    <div className="pt-3 border-t border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                          <span>🎓</span> Practical Day Teaching Trainers ({selectedGroupDetail.trainers?.length || 0})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { window.location.href = "/admin/users?emailTrainers=true"; }}
                            className="px-3 py-1 rounded-xl bg-purple-100 text-purple-900 hover:bg-purple-200 text-xs font-extrabold transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>📧</span> Email All Trainers
                          </button>
                          <button
                            onClick={() => handleOpenAssignTrainerModal(selectedGroupDetail)}
                            className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <span>+</span> Assign Teaching Trainer
                          </button>
                        </div>
                      </div>

                      {(!selectedGroupDetail.trainers || selectedGroupDetail.trainers.length === 0) ? (
                        <p className="text-xs text-slate-400 font-medium italic">
                          No teaching trainers assigned to {selectedGroupDetail.name} yet. Click "+ Assign Teaching Trainer" to select a trainer for {selectedGroupDetail.practicalDay || "this practical day"}.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedGroupDetail.trainers.map((tr: any, idx: number) => (
                            <div
                              key={tr.assignmentId || `${tr.id}-${idx}`}
                              className="p-2.5 rounded-2xl bg-white border border-purple-200 flex items-center justify-between gap-3 shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {tr.passportPicture ? (
                                  <img src={tr.passportPicture} className="w-8 h-8 rounded-full object-cover shrink-0 border border-purple-300" alt="" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                                    {tr.firstName?.[0] || "T"}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">{tr.firstName} {tr.lastName}</p>
                                  <div className="flex items-center gap-1 flex-wrap text-[10px] text-purple-700 font-semibold mt-0.5">
                                    {tr.assignedDay && (
                                      <span className="bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded font-bold">
                                        📅 {tr.assignedDay}
                                      </span>
                                    )}
                                    {tr.specialization ? (
                                      <span className="bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold truncate max-w-[150px]">
                                        🎓 {tr.specialization}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-normal truncate">{tr.email}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveTrainerFromGroup(selectedCohort.id, selectedGroupDetail.id, tr.id, tr.assignmentId, tr.assignedDay)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold shrink-0 transition cursor-pointer"
                                title="Remove trainer assignment"
                              >
                                Remove ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bulk Site Assignment for entire selected Group */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t border-slate-200/80">
                      <span className="text-xs font-extrabold uppercase text-slate-500 shrink-0">
                        Bulk Assign Physical Site for All Members of {selectedGroupDetail.name}:
                      </span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBulkAssignGroupSite(selectedGroupDetail.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                      >
                        <option value="">Choose Site for all members of {selectedGroupDetail.name}...</option>
                        {PHYSICAL_SITES.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Add Trainee to Group Form */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        Add Trainee to {selectedGroupDetail.name}
                      </p>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hideAssignedToGroup}
                          onChange={(e) => setHideAssignedToGroup(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                        />
                        Hide trainees assigned to other groups
                      </label>
                    </div>

                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search trainee name, email or phone to add..."
                          value={addGroupMemberSearch}
                          onChange={(e) => {
                            setAddGroupMemberSearch(e.target.value);
                            setAddGroupPage(1);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium shadow-2xs"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                        {addGroupMemberSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setAddGroupMemberSearch("");
                              setAddGroupPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={selectedMemberUserId}
                          onChange={(e) => setSelectedMemberUserId(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">
                            {addGroupMemberSearch
                              ? `Select matching trainee to add (${filteredGroupCandidates.length})...`
                              : "Select trainee to add to group..."}
                          </option>
                          {enrolledCohortUsers.length === 0 ? (
                            <option disabled>No trainees enrolled in cohort</option>
                          ) : filteredGroupCandidates.length === 0 ? (
                            <option disabled>No trainees match "{addGroupMemberSearch}"</option>
                          ) : (
                            paginatedGroupCandidates.map((u) => {
                              const assignedGroup = groups.find((g) => g.members.some((m) => m.id === u.id));
                              const prefix = assignedGroup ? `[Assigned: ${assignedGroup.name}] ` : "";
                              return (
                                <option key={u.id} value={u.id}>
                                  {prefix}{u.firstName} {u.lastName} ({u.email})
                                </option>
                              );
                            })
                          )}
                        </select>
                        <button
                          onClick={() => handleAddMemberToGroup(selectedGroupDetail.id)}
                          disabled={addingMember || !selectedMemberUserId}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-40 shrink-0 shadow-xs cursor-pointer min-h-[40px]"
                        >
                          {addingMember ? "..." : "+ Add to Group"}
                        </button>
                      </div>

                      <PaginationControls
                        currentPage={addGroupPage}
                        totalPages={addGroupCandidateTotalPages}
                        totalItems={filteredGroupCandidates.length}
                        pageSize={15}
                        onPageChange={setAddGroupPage}
                      />
                    </div>
                  </div>

                  {/* Group Members List Header & Search */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        Members of {selectedGroupDetail.name} ({selectedGroupDetail.members.length})
                      </h4>
                      <input
                        placeholder="Search member by name or email..."
                        value={groupMemberSearch}
                        onChange={(e) => {
                          setGroupMemberSearch(e.target.value);
                          setGroupMemberPage(1);
                        }}
                        className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>

                    {/* Unrestricted Full Member List */}
                    {selectedGroupDetail.members.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 text-xs font-medium">
                        No members assigned to {selectedGroupDetail.name} yet.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[55vh] overflow-y-auto custom-scrollbar pr-1">
                        {paginatedGroupMembers.map((member) => {
                          const { isCustom } = getUserSiteObj(member);
                          const isSaving = updatingUserSiteId === member.id;

                          return (
                            <div
                              key={member.id}
                              className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2.5 hover:border-slate-300 transition"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                                    {member.firstName[0]}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-xs font-extrabold text-slate-900 truncate">
                                        {member.firstName} {member.lastName}
                                      </p>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                        member.isActive
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                      }`}>
                                        {member.isActive ? "Setup ✓" : "Pending Setup"}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{member.email}</p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleRemoveMember(selectedGroupDetail.id, member.id)}
                                  disabled={removingMemberId === member.id}
                                  className="text-xs text-red-600 hover:text-red-800 font-bold px-3 py-1.5 rounded-xl hover:bg-red-50 transition shrink-0 disabled:opacity-40 border border-slate-200"
                                >
                                  {removingMemberId === member.id ? "..." : "Remove ✕"}
                                </button>
                              </div>

                              {/* Site Selector Row */}
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                                <span className="text-slate-500 font-bold uppercase text-[10px] shrink-0">
                                  Physical Site:
                                </span>
                                <select
                                  value={member.physicalSiteId || ""}
                                  disabled={isSaving}
                                  onChange={(e) => handleUpdateUserSite(member.id, e.target.value)}
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                                >
                                  <option value="">🚫 Unassigned</option>
                                  {PHYSICAL_SITES.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                  ))}
                                </select>
                                {isCustom && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md shrink-0">
                                    Assigned
                                  </span>
                                )}
                                {isSaving && <span className="text-xs text-emerald-600 font-bold animate-pulse">Saving...</span>}
                              </div>
                            </div>
                          );
                        })}

                        <PaginationControls
                          currentPage={groupMemberPage}
                          totalPages={groupMemberTotalPages}
                          totalItems={filteredGroupMembers.length}
                          pageSize={8}
                          onPageChange={setGroupMemberPage}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PHYSICAL SITES MODAL */}
      {activeModal === "sites" && selectedCohort && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 font-sora">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800 text-base font-bold">📍</span>
                <div>
                  <h2 className="font-black text-slate-900 text-base">{selectedCohort.name} — Physical Sites</h2>
                  <p className="text-xs text-slate-500 font-medium">Manage training location assignments</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              {/* Stat Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PHYSICAL_SITES.map((site) => {
                  const count = enrolledCohortUsers.filter((u) => getUserSiteObj(u).site?.id === site.id).length;
                  return (
                    <div key={site.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center shadow-2xs">
                      <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider truncate">{site.name}</p>
                      <p className="text-xl font-black text-slate-900 mt-0.5">{count}</p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{site.code}</p>
                    </div>
                  );
                })}
              </div>

              {/* Trainee list filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Enrolled Trainees ({enrolledCohortUsers.length})
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search trainee..."
                      value={siteMemberSearch}
                      onChange={(e) => setSiteMemberSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                    {siteMemberSearch && (
                      <button
                        type="button"
                        onClick={() => setSiteMemberSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Sites</option>
                    {PHYSICAL_SITES.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    <option value="custom">Assigned Only</option>
                    <option value="auto">Unassigned Only</option>
                  </select>
                </div>
              </div>

              {/* Trainees List */}
              {enrolledCohortUsers.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 text-xs font-medium">
                  No trainees enrolled in this cohort yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[45vh] overflow-y-auto custom-scrollbar pr-1">
                  {enrolledCohortUsers
                    .filter((u) => {
                      if (siteMemberSearch) {
                        const q = siteMemberSearch.toLowerCase().trim();
                        const matchName = (u.firstName && u.firstName.toLowerCase().includes(q)) || (u.lastName && u.lastName.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q));
                        if (!matchName) return false;
                      }
                      const { site, isCustom } = getUserSiteObj(u);
                      if (siteFilter === "all") return true;
                      if (siteFilter === "custom") return isCustom;
                      if (siteFilter === "auto") return !isCustom;
                      return site?.id === siteFilter;
                    })
                    .map((member) => {
                      const { isCustom } = getUserSiteObj(member);
                      const isSaving = updatingUserSiteId === member.id;

                      return (
                        <div key={member.id} className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0">
                                {member.firstName[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-slate-900 truncate">
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{member.email}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                              isCustom
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}>
                              {isCustom ? "📍 Assigned" : "⚡ Unassigned"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">
                              Assign Site:
                            </span>
                            <select
                              value={member.physicalSiteId || ""}
                              disabled={isSaving}
                              onChange={(e) => handleUpdateUserSite(member.id, e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                            >
                              <option value="">🚫 Unassigned (Select Site)</option>
                              {PHYSICAL_SITES.map((s) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                              ))}
                            </select>
                            {isSaving && <span className="text-xs text-emerald-600 font-bold animate-pulse">Saving...</span>}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. ENROL MODAL */}
      {activeModal === "enrol" && selectedCohort && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 font-sora">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-100 text-teal-800 text-base font-bold">🎓</span>
                <div>
                  <h2 className="font-black text-slate-900 text-base">Enrol Trainee — {selectedCohort.name}</h2>
                  <p className="text-xs text-slate-500 font-medium">Add individual students to cohort</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              {enrollError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl font-medium">
                  {enrollError}
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Select Student to Enrol
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hideEnrolledInCohort}
                      onChange={(e) => {
                        setHideEnrolledInCohort(e.target.checked);
                        setEnrollUserPage(1);
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                    />
                    Hide already enrolled
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search student by name, email, or phone to enrol..."
                      value={enrollUserSearch}
                      onChange={(e) => {
                        setEnrollUserSearch(e.target.value);
                        setEnrollUserPage(1);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium shadow-2xs"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                    {enrollUserSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setEnrollUserSearch("");
                          setEnrollUserPage(1);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                  >
                    <option value="">
                      {enrollUserSearch
                        ? `Select matching student to enrol (${filteredEnrollCandidates.length})...`
                        : "Select student to enrol..."}
                    </option>
                    {globalUsers.length === 0 ? (
                      <option disabled>{loadingUsers ? "Fetching students from server..." : "No students available to enrol"}</option>
                    ) : filteredEnrollCandidates.length === 0 ? (
                      <option disabled>No students match "{enrollUserSearch}"</option>
                    ) : (
                      paginatedEnrollCandidates.map((u) => {
                        const inThisCohort = u.cohorts && u.cohorts.some((c) => c.id === selectedCohort?.id);
                        const inOtherCohort = u.cohorts && u.cohorts.length > 0 && !inThisCohort;
                        let prefix = "";
                        if (inThisCohort) {
                          prefix = "[Already Enrolled Here] ";
                        } else if (inOtherCohort) {
                          prefix = `[Enrolled: ${u.cohorts![0].name}] `;
                        }
                        return (
                          <option key={u.id} value={u.id} disabled={!!inThisCohort}>
                            {prefix}{u.firstName} {u.lastName} ({u.email})
                          </option>
                        );
                      })
                    )}
                  </select>

                  <PaginationControls
                    currentPage={enrollUserPage}
                    totalPages={enrollCandidateTotalPages}
                    totalItems={filteredEnrollCandidates.length}
                    pageSize={15}
                    onPageChange={setEnrollUserPage}
                  />
                </div>

                <button
                  onClick={handleEnroll}
                  disabled={enrolling || !selectedUser}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition disabled:opacity-40 shadow-xs cursor-pointer min-h-[44px]"
                >
                  {enrolling ? "Enrolling..." : "+ Enrol Student Now"}
                </button>
              </div>

              {/* Currently Enrolled Members List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Enrolled Trainees ({enrolledCohortUsers.length})
                  </h3>
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search enrolled trainees..."
                      value={enrolledListSearch}
                      onChange={(e) => {
                        setEnrolledListSearch(e.target.value);
                        setEnrolledListPage(1);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                    {enrolledListSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setEnrolledListSearch("");
                          setEnrolledListPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {enrolledCohortUsers.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 text-xs font-medium">
                    No trainees enrolled in this cohort yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="max-h-[40vh] overflow-y-auto custom-scrollbar pr-1 space-y-2">
                      {paginatedEnrolledList.map((member) => (
                        <div key={member.id} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center shrink-0">
                              {member.firstName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{member.email}</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold shrink-0">
                            Enrolled
                          </span>
                        </div>
                      ))}
                    </div>

                    <PaginationControls
                      currentPage={enrolledListPage}
                      totalPages={enrolledListTotalPages}
                      totalItems={filteredEnrolledList.length}
                      pageSize={8}
                      onPageChange={setEnrolledListPage}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. BULK EMAIL MODAL */}
      {activeModal === "email" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 font-sora">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-800 text-base font-bold">✉️</span>
                <div>
                  <h2 className="font-black text-slate-900 text-base">Bulk Email Outreach</h2>
                  <p className="text-xs text-slate-500 font-medium">Send notification to unassigned trainees</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Send a bulk email message to all <strong>{cohortlessTrainees.length} approved trainees</strong> currently unassigned to any training cohort.
              </p>

              {bulkError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl font-medium">
                  {bulkError}
                </div>
              )}

              {bulkSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-3 rounded-2xl font-bold">
                  {bulkSuccess}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Subject
                  </label>
                  <input
                    placeholder="e.g. Welcome to EEWYLA — Program Updates"
                    value={bulkSubject}
                    onChange={(e) => setBulkSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Message Body
                  </label>
                  <textarea
                    placeholder="Type your message content..."
                    rows={7}
                    value={bulkBody}
                    onChange={(e) => setBulkBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs font-sans resize-none"
                  />
                </div>

                <button
                  onClick={handleSendBulkEmail}
                  disabled={bulkSending || cohortlessTrainees.length === 0 || !bulkSubject.trim() || !bulkBody.trim()}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition disabled:opacity-40 shadow-xs cursor-pointer min-h-[44px]"
                >
                  {bulkSending ? "Sending Bulk Emails..." : `Send Email to ${cohortlessTrainees.length} Trainees`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4b. NOTIFY GROUPS & PHYSICAL TRAINING MODAL */}
      {activeModal === "notifyGroup" && selectedCohort && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 font-sora">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-800 text-base font-bold">📧</span>
                <div>
                  <h2 className="font-black text-slate-900 text-base">Group & Physical Training Email Notifier</h2>
                  <p className="text-xs text-slate-500 font-medium">{selectedCohort.name}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 text-xs text-indigo-950 font-medium space-y-1.5">
                <div className="font-black text-indigo-900 flex items-center gap-1.5 text-sm">
                  <span>✨</span> Send Email to Enrolled Trainees
                </div>
                <p>
                  This tool dispatches custom physical training notification emails to all trainees enrolled in <strong>{selectedCohort.name}</strong>.
                  Each trainee receives their assigned group name (Group A–E), practical training day, venue location, and schedule.
                </p>
              </div>

              {notifyError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl font-medium">
                  {notifyError}
                </div>
              )}

              {notifySuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-3 rounded-2xl font-bold">
                  {notifySuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Physical Training Location
                  </label>
                  <input
                    value={notifyLocation}
                    onChange={(e) => setNotifyLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    placeholder="e.g. LAUTECH Ogbomoso"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Training Hours / Schedule
                  </label>
                  <input
                    value={notifyTimeRange}
                    onChange={(e) => setNotifyTimeRange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    placeholder="e.g. 9:00 AM – 5:00 PM"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  Email Content Preview
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 text-slate-700 font-sans">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-2">
                    Subject: Physical Training Schedule & Group Allocation — {selectedCohort.name}
                  </div>
                  <p><strong>Hi [Trainee First Name],</strong></p>
                  <p>We are pleased to inform you of your official group assignment, physical training location, and daily schedule for <strong>{selectedCohort.name}</strong> of the EEWYLA Training Programme.</p>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1 font-mono text-[11px]">
                    <div>📍 <strong>Location:</strong> {notifyLocation}</div>
                    <div>🕒 <strong>Time:</strong> {notifyTimeRange}</div>
                    <div>👥 <strong>Group:</strong> [Assigned Group e.g. Group A (Mondays)]</div>
                  </div>
                </div>
              </div>

              {notifyDryRunResult?.recipients && notifyDryRunResult.recipients.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Recipients ({notifyDryRunResult.recipients.length} Trainees)
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white text-xs">
                    {notifyDryRunResult.recipients.map((r: any, idx: number) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{r.name}</div>
                          <div className="text-slate-400 text-[11px]">{r.email}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                          {r.group}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSendNotifyGroup(true)}
                  disabled={notifySending}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-xl transition border border-slate-200 cursor-pointer"
                >
                  {notifySending ? "Processing..." : "Preview & Verify Trainees"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSendNotifyGroup(false)}
                  disabled={notifySending}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {notifySending ? "Dispatching Emails..." : "🚀 Dispatch Emails Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCohortModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) setShowCohortModal(false); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sora">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="font-black text-slate-900 text-base">
                  {editingCohort ? "Edit Cohort Details" : "New Cohort Registration"}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {editingCohort ? `Updating ${editingCohort.name}` : "Create a new training cohort"}
                </p>
              </div>
              <button
                onClick={() => !submitting && setShowCohortModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cohort Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Cohort 1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium transition"
                />
              </div>

              {editingCohort && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-800">Cohort Active Status</label>
                    <p className="text-[10px] text-slate-500">Allow trainees to see/access this cohort</p>
                  </div>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </div>
              )}

              {/* TBD Checkbox Option */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
                <label className="flex items-center gap-2 text-xs font-extrabold text-amber-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isTbdDate}
                    onChange={(e) => setIsTbdDate(e.target.checked)}
                    className="rounded border-amber-300 text-amber-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>📅 Dates are To Be Decided (TBD)</span>
                </label>
                <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium pl-6">
                  Check this box if start and end dates are not yet finalized. You can edit this cohort to set exact dates anytime.
                </p>
              </div>

              {/* Date pickers (hidden if TBD) */}
              {!isTbdDate && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setShowCohortModal(false)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCohort}
                disabled={submitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 min-w-[110px] shadow-xs cursor-pointer"
              >
                {submitting ? "Saving..." : editingCohort ? "Save Changes" : "Create Cohort"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. AUTO GROUP CONFIRM MODAL */}
      {showAutoGroupConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowAutoGroupConfirm(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sora"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="font-black text-slate-900 text-base">Confirm Auto-Grouping</h2>
                <p className="text-xs text-slate-500 font-medium">Automated trainee allocation utility</p>
              </div>
              <button
                onClick={() => setShowAutoGroupConfirm(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                This utility will execute the following automated steps:
              </p>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
                <p className="flex gap-2">
                  <span className="text-emerald-600 font-bold">1.</span>
                  <span>Ensure 5 groups exist (Group A - E) with Monday-Friday practical schedules.</span>
                </p>
                <p className="flex gap-2">
                  <span className="text-emerald-600 font-bold">2.</span>
                  <span>Fetch all active trainees who have completed account setup in this cohort.</span>
                </p>
                <p className="flex gap-2">
                  <span className="text-emerald-600 font-bold">3.</span>
                  <span>Reset current group memberships for these 5 groups.</span>
                </p>
                <p className="flex gap-2">
                  <span className="text-emerald-600 font-bold">4.</span>
                  <span>Distribute active trainees evenly across the 5 groups (up to max capacity per group).</span>
                </p>
              </div>
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-2xl p-3 leading-relaxed font-medium">
                ⚠️ <strong>Warning:</strong> Existing group assignments for Group A–E will be reset.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setShowAutoGroupConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={executeAutoGrouping}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                ⚡ Proceed Auto-Grouping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. AUTO GROUP SUCCESS MODAL */}
      {showAutoGroupSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowAutoGroupSuccess(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200 font-sora"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto">
              ✓
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Grouping Complete</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                {autoGroupSuccessMessage}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setShowAutoGroupSuccess(false)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs min-w-[100px] cursor-pointer"
              >
                Awesome
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 5. ASSIGN TRAINER MODAL */}
      {showAssignTrainerModal && selectedGroupForTrainer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAssignTrainerModal(false); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 font-sora">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-purple-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-sm">
                  🎓
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Assign Teaching Trainer
                  </h3>
                  <p className="text-[11px] text-purple-800 font-semibold">
                    {selectedGroupForTrainer.name} • Practical Day: {selectedGroupForTrainer.practicalDay || "Scheduled Day"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignTrainerModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar max-h-[70vh] space-y-4">
              {trainerAssignError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-semibold">
                  {trainerAssignError}
                </div>
              )}
              {trainerAssignSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl font-bold">
                  {trainerAssignSuccess}
                </div>
              )}

              {/* Day Selector */}
              <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-black text-purple-950 uppercase tracking-wider">
                  📅 Select Practical Training Day
                </label>
                <p className="text-[11px] text-purple-800 font-medium leading-relaxed">
                  Assign trainers per day based on practical topic & specialization (e.g., Poultry on Mondays, Ruminants on Tuesdays).
                </p>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                    const isSelected = selectedTrainerDay === day;
                    const isGroupDefault = (selectedGroupForTrainer.practicalDay || "").toLowerCase().includes(day.toLowerCase());
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedTrainerDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? "bg-purple-700 text-white shadow-xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-purple-100"
                        }`}
                      >
                        <span>{day}</span>
                        {isGroupDefault && (
                          <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold ${isSelected ? "bg-purple-900 text-purple-100" : "bg-amber-100 text-amber-800"}`}>
                            Default
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-600 font-medium">
                  Select a registered trainer to teach <strong>{selectedGroupForTrainer.name}</strong> on <strong>{selectedTrainerDay}s</strong>. Notice will be sent to their portal.
                </p>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Search trainer by name, email or specialization..."
                    value={trainerSearch}
                    onChange={(e) => setTrainerSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-medium shadow-2xs"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                  {trainerSearch && (
                    <button
                      type="button"
                      onClick={() => setTrainerSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {loadingTrainers ? (
                <p className="text-center text-xs text-slate-500 py-8 animate-pulse">Loading registered trainers...</p>
              ) : allTrainers.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-xs font-medium">
                  No registered trainers found in system.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {allTrainers
                    .filter((tr) => {
                      const q = trainerSearch.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        (tr.firstName && tr.firstName.toLowerCase().includes(q)) ||
                        (tr.lastName && tr.lastName.toLowerCase().includes(q)) ||
                        (tr.email && tr.email.toLowerCase().includes(q)) ||
                        (tr.specialization && tr.specialization.toLowerCase().includes(q))
                      );
                    })
                    .map((tr) => {
                      const isAlreadyAssignedOnDay = selectedGroupForTrainer.trainers?.some(
                        (t: any) => t.id === tr.id && (t.assignedDay || selectedGroupForTrainer.practicalDay || "") === selectedTrainerDay
                      );

                    return (
                      <div
                        key={tr.id}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-purple-300 bg-white hover:bg-purple-50/30 transition flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {tr.passportPicture ? (
                            <img src={tr.passportPicture} className="w-10 h-10 rounded-full object-cover shrink-0 border border-purple-200 shadow-2xs" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {tr.firstName?.[0] || "T"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-slate-900 leading-tight truncate">
                              {tr.firstName} {tr.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium truncate">{tr.email}</p>
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                              {tr.specialization ? (
                                <span className="inline-block text-[9px] font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                                  🎓 Spec: {tr.specialization}
                                </span>
                              ) : (
                                <span className="inline-block text-[9px] text-slate-400 italic">
                                  General Livestock
                                </span>
                              )}
                              {(() => {
                                const siteObj = getPhysicalSiteById(tr.physicalSiteId || tr.siteId);
                                return siteObj ? (
                                  <span className="inline-block text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md truncate">
                                    📍 {siteObj.name}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAssignTrainer(tr.id)}
                          disabled={isAlreadyAssignedOnDay || assigningTrainerId === tr.id}
                          className={`px-3 py-2 rounded-xl text-xs font-extrabold transition shadow-2xs shrink-0 cursor-pointer ${
                            isAlreadyAssignedOnDay
                              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                          }`}
                        >
                          {assigningTrainerId === tr.id
                            ? "Assigning..."
                            : isAlreadyAssignedOnDay
                            ? `Assigned (${selectedTrainerDay}) ✓`
                            : `+ Assign for ${selectedTrainerDay}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}