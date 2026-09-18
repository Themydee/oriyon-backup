"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { popup } from "@/components/layout/PopupProvider";

interface CooperativeMember {
  id: string;
  applicationId: string | null;
  cooperativeId: string | null;
  cooperativeName: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  livestockType: string | null;
  agreesToConstitution: boolean;
  willingToContribute: boolean;
  status: "active" | "inactive";
  joinedAt: string;
  updatedAt: string;
  locationId?: string | null;
  regionId?: string | null;
  lga?: string | null;
  zoneCluster?: string | null;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

// ─────────────────────────────────────────────
// DETAIL MODAL
// ─────────────────────────────────────────────
function MemberModal({
  member,
  onClose,
  onUpdate,
}: {
  member: CooperativeMember;
  onClose: () => void;
  onUpdate: (updated: CooperativeMember) => void;
}) {
  const [livestockType, setLivestockType] = useState(member.livestockType ?? "");
  const [saving, setSaving]               = useState(false);
  const [toggling, setToggling]           = useState(false);
  const [saveMsg, setSaveMsg]             = useState("");

  const saveLivestock = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/cooperative/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ livestockType }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data);
        setSaveMsg("Saved!");
        setTimeout(() => setSaveMsg(""), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    setToggling(true);
    const newStatus = member.status === "active" ? "inactive" : "active";
    try {
      const res = await authFetch(`/cooperative/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#0a0f1e] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-white font-bold text-lg">
                {member.firstName} {member.lastName}
              </h2>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                member.status === "active"
                  ? "text-green-400 bg-green-500/10 border-green-700/30"
                  : "text-red-400 bg-red-500/10 border-red-700/30"
              }`}>
                {member.status}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500">{member.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Details */}
        <div className="p-6 flex flex-col gap-5">

          {/* Contact */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Contact Information
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Email" value={member.email} />
              <Detail label="Phone" value={member.phone} />
              <Detail label="Selected Cooperative" value={member.cooperativeName || "EEWYLA Cooperative"} span />
              <Detail label="LGA" value={member.lga ?? ""} />
              <Detail label="Zone / Cluster" value={member.zoneCluster ?? ""} />
              <Detail label="Location ID" value={member.locationId ?? ""} />
              <Detail label="Region ID" value={member.regionId ?? ""} />
              <Detail label="Address" value={member.address ?? ""} span />
            </div>
          </div>

          {/* Membership */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Membership Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Detail
                label="Joined"
                value={new Date(member.joinedAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              />
              <Detail
                label="Last Updated"
                value={new Date(member.updatedAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              />
              <Detail
                label="Agrees to Constitution"
                value={member.agreesToConstitution ? "Yes" : "No"}
              />
              <Detail
                label="Willing to Contribute"
                value={member.willingToContribute ? "Yes" : "No"}
              />
            </div>
          </div>

          {/* Livestock Type */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Livestock Type
            </p>
            <input
              value={livestockType}
              onChange={(e) => setLivestockType(e.target.value)}
              placeholder="e.g. Goats, Cattle, Poultry..."
              className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-green-400">{saveMsg}</p>
              <button
                onClick={saveLivestock}
                disabled={saving}
                className="text-xs border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={toggleStatus}
              disabled={toggling}
              className={`w-full text-sm font-semibold py-2.5 rounded-xl border transition disabled:opacity-50 ${
                member.status === "active"
                  ? "border-red-700/40 text-red-400 hover:bg-red-500/10"
                  : "border-green-700/40 text-green-400 hover:bg-green-500/10"
              }`}
            >
              {toggling
                ? "Updating..."
                : member.status === "active"
                  ? "Deactivate Member"
                  : "Reactivate Member"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  span,
}: {
  label: string;
  value: string;
  span?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={span ? "col-span-2" : ""}>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm text-white font-medium leading-relaxed">{value || "—"}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
interface Cooperative {
  id: string;
  name: string;
  state: string;
  description: string;
  isActive: boolean;
  locationId?: string | null;
  regionId?: string | null;
  zone?: string | null;
  lga?: string | null;
  whatsappLink?: string | null;
  registrationFee?: number | null;
  monthlyContribution?: number | null;
  registrationStatus?: "formal" | "pending";
  memberCount?: number;
}

export default function CooperativePage() {
  const router = useRouter();
  const [members, setMembers]   = useState<CooperativeMember[]>([]);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [fetchingNewPage, setFetchingNewPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const pageSize = 20;

  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [lgaFilter, setLgaFilter]     = useState("all");
  const [selected, setSelected] = useState<CooperativeMember | null>(null);

  const [activeTab, setActiveTab] = useState<"members" | "cooperatives">("members");
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [coopLoading, setCoopLoading] = useState(false);
  const [coopError, setCoopError] = useState("");
  const [coopFilter, setCoopFilter] = useState("all");
  const [coopStateFilter, setCoopStateFilter] = useState("all");

  const coopStates = useMemo(() => {
    const safeCoops = Array.isArray(cooperatives) ? cooperatives : [];
    const set = new Set(safeCoops.map((c) => c.state).filter(Boolean));
    return Array.from(set).sort();
  }, [cooperatives]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCoopName, setNewCoopName] = useState("");
  const [newCoopState, setNewCoopState] = useState("");
  const [newCoopDesc, setNewCoopDesc] = useState("");
  const [newCoopLocationId, setNewCoopLocationId] = useState("");
  const [newCoopRegionId, setNewCoopRegionId] = useState("");
  const [newCoopZone, setNewCoopZone] = useState("");
  const [newCoopLga, setNewCoopLga] = useState("");
  const [newCoopWhatsappLink, setNewCoopWhatsappLink] = useState("");
  const [newCoopRegistrationFee, setNewCoopRegistrationFee] = useState<number>(2000);
  const [newCoopMonthlyContribution, setNewCoopMonthlyContribution] = useState<number>(2000);
  const [newCoopRegistrationStatus, setNewCoopRegistrationStatus] = useState<"formal" | "pending">("formal");
  const [editingCoop, setEditingCoop] = useState<Cooperative | null>(null);
  const [submittingCoop, setSubmittingCoop] = useState(false);

  useEffect(() => {
    fetchData();
    fetchCooperatives();
  }, [currentPage, search]);

  const fetchCooperatives = async () => {
    setCoopLoading(true);
    setCoopError("");
    try {
      const res = await authFetch("/cooperative");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.cooperatives) ? data.cooperatives : Array.isArray(data?.data) ? data.data : [];
        setCooperatives(list);
      } else {
        const data = await res.json();
        setCoopError(data.error || "Failed to load cooperatives");
      }
    } catch {
      setCoopError("Failed to load cooperatives list.");
    } finally {
      setCoopLoading(false);
    }
  };

  const handleOpenEdit = (coop: Cooperative) => {
    setEditingCoop(coop);
    setNewCoopName(coop.name || "");
    setNewCoopState(coop.state || "");
    setNewCoopDesc(coop.description || "");
    setNewCoopLocationId(coop.locationId || "");
    setNewCoopRegionId(coop.regionId || "");
    setNewCoopZone(coop.zone || "");
    setNewCoopLga(coop.lga || "");
    setNewCoopWhatsappLink(coop.whatsappLink || "");
    setNewCoopRegistrationFee(coop.registrationFee || 2000);
    setNewCoopMonthlyContribution(coop.monthlyContribution || 2000);
    setNewCoopRegistrationStatus(coop.registrationStatus || "formal");
    setShowAddModal(true);
  };

  const handleOpenAdd = () => {
    setEditingCoop(null);
    setNewCoopName("");
    setNewCoopState("");
    setNewCoopDesc("");
    setNewCoopLocationId("");
    setNewCoopRegionId("");
    setNewCoopZone("");
    setNewCoopLga("");
    setNewCoopWhatsappLink("");
    setNewCoopRegistrationFee(2000);
    setNewCoopMonthlyContribution(2000);
    setNewCoopRegistrationStatus("formal");
    setShowAddModal(true);
  };

  const handleSubmitCooperative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoopName || !newCoopState) return;
    setSubmittingCoop(true);
    setCoopError("");
    try {
      const payload = {
        name: newCoopName,
        state: newCoopState,
        description: newCoopDesc || null,
        locationId: newCoopLocationId || null,
        regionId: newCoopRegionId || null,
        zone: newCoopZone || null,
        lga: newCoopLga || null,
        whatsappLink: newCoopWhatsappLink || null,
        registrationFee: Number(newCoopRegistrationFee),
        monthlyContribution: Number(newCoopMonthlyContribution),
        registrationStatus: newCoopRegistrationStatus,
      };

      if (editingCoop) {
        // Edit Flow
        const res = await authFetch(`/cooperative/${editingCoop.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updatedCoop = await res.json();
          setCooperatives((prev) =>
            prev.map((c) => (c.id === editingCoop.id ? updatedCoop : c))
          );
          setShowAddModal(false);
          setEditingCoop(null);
          // Clear
          setNewCoopName("");
          setNewCoopState("");
          setNewCoopDesc("");
          setNewCoopLocationId("");
          setNewCoopRegionId("");
          setNewCoopZone("");
          setNewCoopLga("");
          setNewCoopWhatsappLink("");
          setNewCoopRegistrationFee(2000);
          setNewCoopMonthlyContribution(2000);
          setNewCoopRegistrationStatus("formal");
        } else {
          const data = await res.json();
          setCoopError(data.error || "Failed to update cooperative");
        }
      } else {
        // Create Flow
        const res = await authFetch("/cooperative", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const newCoop = await res.json();
          setCooperatives((prev) => [...prev, newCoop]);
          setShowAddModal(false);
          // Clear
          setNewCoopName("");
          setNewCoopState("");
          setNewCoopDesc("");
          setNewCoopLocationId("");
          setNewCoopRegionId("");
          setNewCoopZone("");
          setNewCoopLga("");
          setNewCoopWhatsappLink("");
          setNewCoopRegistrationFee(2000);
          setNewCoopMonthlyContribution(2000);
          setNewCoopRegistrationStatus("formal");
        } else {
          const data = await res.json();
          setCoopError(data.error || "Failed to create cooperative");
        }
      }
    } catch {
      setCoopError(editingCoop ? "Failed to update cooperative." : "Failed to create cooperative.");
    } finally {
      setSubmittingCoop(false);
    }
  };

  const handleDeleteCooperative = async (id: string) => {
    if (!(await popup.confirm("Are you sure you want to delete this cooperative?"))) return;
    setCoopError("");
    try {
      const res = await authFetch(`/cooperative/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCooperatives((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json();
        await popup.alert(data.error || "Failed to delete cooperative");
      }
    } catch {
      await popup.alert("Failed to delete cooperative.");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [membersRes, statsRes] = await Promise.all([
        authFetch("/cooperative/members"),
        authFetch("/cooperative/stats"),
      ]);
      const membersData = await membersRes.json();
      const statsData   = await statsRes.json();
      if (!membersRes.ok) {
        setError(membersData.error || "Failed to load members");
        return;
      }
      const membersList = Array.isArray(membersData) ? membersData : Array.isArray(membersData?.members) ? membersData.members : Array.isArray(membersData?.data) ? membersData.data : [];
      setMembers(membersList);
      if (statsRes.ok) setStats(statsData);
    } catch {
      setError("Failed to load cooperative members.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (updated: CooperativeMember) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setSelected(updated);
  };

  // ── Super Admin cascade filters ───────────────────────────────
  // Unique states from all cooperatives
  const allStates = useMemo(() => {
    const safeMembers = Array.isArray(members) ? members : [];
    const safeCoops = Array.isArray(cooperatives) ? cooperatives : [];
    const set = new Set(safeMembers.map((m: any) => (m as any).cooperativeState || null).filter(Boolean) as string[]);
    // Fall back to cooperatives list if member doesn't carry state
    safeCoops.forEach((c) => { if (c.state) set.add(c.state); });
    return Array.from(set).sort();
  }, [members, cooperatives]);

  // LGAs available within the selected state
  const availableLgas = useMemo(() => {
    const safeMembers = Array.isArray(members) ? members : [];
    const safeCoops = Array.isArray(cooperatives) ? cooperatives : [];
    const source = stateFilter === "all"
      ? safeMembers
      : safeMembers.filter((m) => {
          const coopState = safeCoops.find((c) => c.name === m.cooperativeName)?.state;
          return coopState === stateFilter;
        });
    const set = new Set(source.map((m) => m.lga).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [members, cooperatives, stateFilter]);

  const filtered = useMemo(() => {
    let result = Array.isArray(members) ? members : [];

    // State filter — match via cooperatives list
    if (stateFilter !== "all") {
      const safeCoops = Array.isArray(cooperatives) ? cooperatives : [];
      result = result.filter((m) => {
        const coopState = safeCoops.find((c) => c.name === m.cooperativeName)?.state;
        return coopState === stateFilter;
      });
    }

    // LGA filter
    if (lgaFilter !== "all") {
      result = result.filter((m) => m.lga === lgaFilter);
    }

    // Status filter
    if (filter !== "all") {
      result = result.filter((m) => m.status === filter);
    }

    // Search
    if (search !== "") {
      result = result.filter((m) =>
        `${m.firstName} ${m.lastName} ${m.email} ${m.phone || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    return result;
  }, [members, cooperatives, stateFilter, lgaFilter, filter, search]);

  const filteredCooperatives = useMemo(() => {
    let result = Array.isArray(cooperatives) ? cooperatives : [];
    if (coopFilter !== "all") {
      result = result.filter((c) => c.registrationStatus === coopFilter);
    }
    if (coopStateFilter !== "all") {
      result = result.filter((c) => c.state === coopStateFilter);
    }
    return result;
  }, [cooperatives, coopFilter, coopStateFilter]);

  return (
    <div>
      {selected && (
        <MemberModal
          member={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
            Cooperative Management
          </h1>
          <p className="text-slate-500 text-sm">
            Manage dynamic cooperatives and register members database
          </p>
        </div>
        <a
          href="/admin/cooperative/coordinator"
          className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold transition flex-shrink-0"
        >
          🔍 Switch to Coordinator View
        </a>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === "members"
              ? "border-green-500 text-green-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Cooperative Members
        </button>
        <button
          onClick={() => setActiveTab("cooperatives")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === "cooperatives"
              ? "border-green-500 text-green-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Manage Cooperatives
        </button>
      </div>

      {/* Members tab view */}
      {activeTab === "members" && (
        <>
          {/* Stats — update dynamically when filters are active */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total",          value: members.length,                                    color: "text-slate-900" },
              { label: "Filtered View",  value: filtered.length,                                   color: "text-blue-700" },
              { label: "Active",         value: filtered.filter((m) => m.status === "active").length,   color: "text-emerald-700" },
              { label: "Inactive",       value: filtered.filter((m) => m.status === "inactive").length, color: "text-rose-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-xs">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Super Admin Cascade Filters ───────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* State filter */}
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setLgaFilter("all"); }}
              className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 transition shadow-2xs font-medium"
            >
              <option value="all">🗺️ All States</option>
              {allStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* LGA filter — cascades from state */}
            <select
              value={lgaFilter}
              onChange={(e) => setLgaFilter(e.target.value)}
              className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 transition shadow-2xs font-medium"
              disabled={availableLgas.length === 0}
            >
              <option value="all">{stateFilter === "all" ? "All LGAs" : `All LGAs in ${stateFilter}`}</option>
              {availableLgas.map((lga) => (
                <option key={lga} value={lga}>{lga}</option>
              ))}
            </select>

            {/* Status filter pills */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "all",      label: "All"      },
                { key: "active",   label: "Active"   },
                { key: "inactive", label: "Inactive" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition ${
                    filter === key
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                      : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset filters button — only shown when filters are active */}
          {(stateFilter !== "all" || lgaFilter !== "all" || filter !== "all" || search !== "") && (
            <div className="flex items-center gap-3 mb-4 font-medium">
              <p className="text-xs text-slate-500">
                Showing <span className="text-slate-900 font-bold">{filtered.length}</span> of {members.length} members
                {stateFilter !== "all" && <> · <span className="text-emerald-700 font-bold">{stateFilter}</span></>}
                {lgaFilter   !== "all" && <> · <span className="text-blue-700 font-bold">{lgaFilter}</span></>}
              </p>
              <button
                onClick={() => { setStateFilter("all"); setLgaFilter("all"); setFilter("all"); setSearch(""); }}
                className="text-xs text-slate-500 hover:text-rose-600 underline transition font-bold"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full max-w-md bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-2xs"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-3 rounded-xl mb-6 shadow-2xs font-medium">
              {error}
            </div>
          )}

          {/* Members list */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-5 animate-pulse space-y-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-40 bg-slate-200 rounded" />
                      <div className="h-3 w-28 bg-slate-200 rounded" />
                    </div>
                    <div className="h-6 w-16 bg-slate-200 rounded-full" />
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex gap-4">
                    <div className="h-3 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-slate-200/80 rounded-2xl p-8">
              <div className="text-4xl mb-3">🤝</div>
              <p className="text-sm font-bold text-slate-700">No cooperative members found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className={fetchingNewPage ? "opacity-60 transition-opacity flex flex-col gap-3" : "flex flex-col gap-3"}>
                {filtered.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 hover:border-emerald-300 hover:shadow-md transition cursor-pointer shadow-xs"
                    onClick={() => setSelected(member)}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">

                      {/* Avatar + info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-sm flex items-center justify-center shrink-0 uppercase shadow-2xs">
                          {member.firstName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-slate-500 truncate font-medium">{member.email}</p>
                          <p className="text-xs text-slate-500 font-medium">{member.phone}</p>
                        </div>
                      </div>

                      {/* Status + date */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          member.status === "active"
                            ? "text-green-400 bg-green-50/10 border-green-700/30"
                            : "text-red-400 bg-red-50/10 border-red-700/30"
                        }`}>
                          {member.status}
                        </span>
                        <p className="text-[10px] text-slate-600">
                          Joined{" "}
                          {new Date(member.joinedAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Extra details row */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800/60 flex-wrap">
                      <span className="text-xs text-slate-500">
                        <span className="text-slate-600">Cooperative:</span> {member.cooperativeName || "EEWYLA Cooperative"}
                      </span>
                      {member.lga && (
                        <span className="text-xs text-slate-500">
                          <span className="text-slate-600">LGA:</span> {member.lga}
                        </span>
                      )}
                      {member.livestockType && (
                        <span className="text-xs text-slate-500">
                          <span className="text-slate-600">Livestock:</span> {member.livestockType}
                        </span>
                      )}
                      {member.address && (
                        <span className="text-xs text-slate-500 truncate max-w-xs">
                          <span className="text-slate-600">Address:</span> {member.address}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 ml-auto">
                        <span className="text-slate-600">Constitution:</span>{" "}
                        {member.agreesToConstitution ? "✓ Agreed" : "Not agreed"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination bar */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80 pt-4 bg-white p-4 rounded-2xl">
                <p className="text-xs text-slate-500 font-medium">
                  Page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{serverTotalPages}</span>
                  {totalCount > 0 && <> ({totalCount} total members)</>}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1 || fetchingNewPage}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ← Previous
                  </button>
                  <button
                    disabled={currentPage >= serverTotalPages || fetchingNewPage}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Cooperatives Tab View */}
      {activeTab === "cooperatives" && (
        <div>
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-white font-bold text-lg">List of Cooperatives</h2>
              <p className="text-xs text-slate-500">Add, view, and manage dynamic cooperatives in the system</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="bg-green-700 hover:bg-green-600 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5"
            >
              ➕ Add Cooperative
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Cooperative Status filter pills */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "all",      label: "All"      },
                { key: "formal",   label: "Formally Registered"   },
                { key: "pending",  label: "Pending Registration" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCoopFilter(key)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition ${
                    coopFilter === key
                      ? "bg-green-500/15 border-green-600/40 text-green-400"
                      : "bg-[#020617] border-slate-800 text-slate-500 hover:border-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* State filter dropdown */}
            <select
              value={coopStateFilter}
              onChange={(e) => setCoopStateFilter(e.target.value)}
              className="bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-green-600 transition"
            >
              <option value="all">🗺️ All States</option>
              {coopStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {coopError && (
            <div className="bg-red-950/40 border border-red-700/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
              {coopError}
            </div>
          )}

          {/* List */}
          {coopLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
              Loading cooperatives...
            </div>
          ) : filteredCooperatives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <div className="text-4xl mb-3">🤝</div>
              <p className="text-sm font-semibold">No cooperatives found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCooperatives.map((coop) => (
                <div
                  key={coop.id}
                  onClick={() => router.push(`/admin/cooperative/${coop.id}`)}
                  className="bg-[#020617] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="font-bold text-sm text-white">{coop.name}</h3>
                      <div className="flex gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          coop.registrationStatus === "pending"
                            ? "text-yellow-400 bg-yellow-500/10 border-yellow-750/30"
                            : "text-green-400 bg-green-500/10 border-green-700/30"
                        }`}>
                          {coop.registrationStatus === "pending" ? "Pending" : "Formal"}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border text-green-400 bg-green-50/10 border-green-700/30">
                          {coop.state}
                        </span>
                      </div>
                    </div>
                    {coop.registrationStatus === "pending" && coop.memberCount !== undefined && (
                      <div className="mb-2">
                        <span className="text-xs text-slate-400">
                          Members: <span className="text-white font-bold">{coop.memberCount} / 10</span>
                        </span>
                        {coop.memberCount >= 10 && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border text-blue-400 bg-blue-500/10 border-blue-700/30">
                            Ready to Register
                          </span>
                        )}
                      </div>
                    )}
                    {coop.description && (
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">{coop.description}</p>
                    )}
                    {(coop.locationId || coop.regionId || coop.zone || coop.lga || coop.whatsappLink || coop.registrationFee) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-[11px] text-slate-500 bg-[#020617] border border-slate-800/50 p-2.5 rounded-lg">
                        {coop.lga && <span className="w-full mb-1 border-b border-slate-800/40 pb-1"><strong>LGA:</strong> {coop.lga}</span>}
                        {coop.zone && <span className="w-full mb-1 border-b border-slate-800/40 pb-1"><strong>Zone:</strong> {coop.zone}</span>}
                        {coop.locationId && <span><strong>Loc ID:</strong> {coop.locationId}</span>}
                        {coop.regionId && <span><strong>Reg ID:</strong> {coop.regionId}</span>}
                        {coop.registrationFee !== undefined && coop.registrationFee !== null && (
                          <span><strong>Fee:</strong> ₦{coop.registrationFee}</span>
                        )}
                        {coop.monthlyContribution !== undefined && coop.monthlyContribution !== null && (
                          <span><strong>Monthly:</strong> ₦{coop.monthlyContribution}</span>
                        )}
                        {coop.whatsappLink && (
                          <span className="w-full mt-1 pt-1 border-t border-slate-800/40 truncate">
                            <strong>WhatsApp:</strong>{" "}
                            <a
                              href={coop.whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:underline"
                            >
                              {coop.whatsappLink}
                            </a>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-800/60 font-sans">
                    <span className="text-[10px] text-slate-500 font-mono">ID: {coop.id}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(coop);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-2.5 py-1.5 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCooperative(coop.id);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold px-2.5 py-1.5 rounded-xl border border-red-500/20 hover:border-red-500/40 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / Edit Cooperative Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
              <div className="bg-[#0a0f1e] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-sans">
                <form onSubmit={handleSubmitCooperative}>
                  <div className="flex items-center justify-between p-5 border-b border-slate-800">
                    <h3 className="text-white font-bold text-md">
                      {editingCoop ? "Edit Cooperative" : "Add Cooperative"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="text-slate-500 hover:text-white transition text-lg"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto text-left">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cooperative Name *</label>
                      <input
                        required
                        value={newCoopName}
                        onChange={(e) => setNewCoopName(e.target.value)}
                        placeholder="e.g. Oyo Farmers Alliance"
                        className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">State / Location *</label>
                      <input
                        required
                        value={newCoopState}
                        onChange={(e) => setNewCoopState(e.target.value)}
                        placeholder="e.g. Oyo State, Nigeria"
                        className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Local Government Area (LGA) *</label>
                      <input
                        required
                        value={newCoopLga}
                        onChange={(e) => setNewCoopLga(e.target.value)}
                        placeholder="e.g. Iseyin"
                        className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Senatorial Zone / Cluster *</label>
                      <input
                        required
                        value={newCoopZone}
                        onChange={(e) => setNewCoopZone(e.target.value)}
                        placeholder="e.g. Bauchi North"
                        className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location ID *</label>
                      <input
                        required
                        value={newCoopLocationId}
                        onChange={(e) => setNewCoopLocationId(e.target.value)}
                        placeholder="e.g. EEWY-BAU-BAUNOR-JAMA"
                        className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Region ID *</label>
                      <input
                        required
                        value={newCoopRegionId}
                        onChange={(e) => setNewCoopRegionId(e.target.value)}
                        placeholder="e.g. EEWY-BAU-BAUNOR"
                        className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">WhatsApp Group Link</label>
                      <input
                        value={newCoopWhatsappLink}
                        onChange={(e) => setNewCoopWhatsappLink(e.target.value)}
                        placeholder="https://chat.whatsapp.com/..."
                        className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Registration Fee (₦)</label>
                      <input
                        type="number"
                        value={newCoopRegistrationFee}
                        onChange={(e) => setNewCoopRegistrationFee(Number(e.target.value))}
                        placeholder="2000"
                        className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Contribution (₦)</label>
                      <input
                        type="number"
                        value={newCoopMonthlyContribution}
                        onChange={(e) => setNewCoopMonthlyContribution(Number(e.target.value))}
                        placeholder="2000"
                        className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Registration Status *</label>
                      <select
                        value={newCoopRegistrationStatus}
                        onChange={(e) => setNewCoopRegistrationStatus(e.target.value as any)}
                        className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition"
                      >
                        <option value="formal">Formally Registered (with existing documents)</option>
                        <option value="pending">Pending Registration</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                      <textarea
                        value={newCoopDesc}
                        onChange={(e) => setNewCoopDesc(e.target.value)}
                        rows={3}
                        placeholder="Focus area, membership rules, etc..."
                        className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
                      />
                    </div>
                  </div>
                  <div className="p-5 border-t border-slate-800 flex justify-end gap-2 bg-[#020617]/40">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="text-xs border border-slate-700 text-slate-400 px-4 py-2 rounded-xl hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingCoop}
                      className="text-xs bg-green-700 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition font-bold disabled:opacity-50"
                    >
                      {editingCoop
                        ? (submittingCoop ? "Saving..." : "Save Changes")
                        : (submittingCoop ? "Adding..." : "Add Cooperative")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}