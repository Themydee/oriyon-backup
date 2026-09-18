"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Download,
  Layers,
  Search,
  RefreshCw,
  Activity,
  ChevronDown,
} from "lucide-react";
import { authFetch } from "@/lib/api";

// ─────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────
interface StatusCount {
  status: string;
  count: number;
}

interface CohortCount {
  cohortId: string | null;
  count: number;
}

interface DailyCount {
  date: string;
  count: number;
}

interface Cohort {
  id: string;
  name: string;
}

interface Application {
  id: string;
  gender?: string;
  submittedAt?: string;
}

interface AnalyticsResponse {
  byStatus: StatusCount[];
  byCohort: CohortCount[];
  daily: DailyCount[];
}

type Granularity = "days" | "weeks" | "months";
type RangePreset = "7d" | "30d" | "90d" | "all";
type ChartType = "area" | "bar";

interface AggregatedPoint {
  label: string;
  periodKey: string;
  count: number;
  males: number;
  females: number;
  others: number;
  startDateStr?: string;
  endDateStr?: string;
  rawDates: string[];
}

// Module-level cache for instant tab switches
let analyticsCache: {
  analytics: AnalyticsResponse | null;
  cohorts: Cohort[];
  applications: Application[];
  timestamp: number;
} | null = null;
const ANALYTICS_CACHE_TTL = 60 * 1000; // 60 seconds

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; ring: string; icon: any }
> = {

  pending: {
    label: "Pending",
    bg: "bg-amber-500/10",
    text: "text-amber-700 font-bold",
    border: "border-amber-200",
    ring: "bg-amber-500",
    icon: Clock,
  },
  shortlisted: {
    label: "Shortlisted",
    bg: "bg-blue-500/10",
    text: "text-blue-700 font-bold",
    border: "border-blue-200",
    ring: "bg-blue-500",
    icon: Activity,
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 font-bold",
    border: "border-emerald-200",
    ring: "bg-emerald-500",
    icon: CheckCircle2,
  },
  rejection_review: {
    label: "Under Review",
    bg: "bg-orange-500/10",
    text: "text-orange-700 font-bold",
    border: "border-orange-200",
    ring: "bg-orange-500",
    icon: Clock,
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-500/10",
    text: "text-rose-700 font-bold",
    border: "border-rose-200",
    ring: "bg-rose-500",
    icon: XCircle,
  },
  archived: {
    label: "Archived",
    bg: "bg-slate-500/10",
    text: "text-slate-700 font-bold",
    border: "border-slate-200",
    ring: "bg-slate-400",
    icon: Layers,
  },
};

function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatMonthYear(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [granularity, setGranularity] = useState<Granularity>("days");
  const [rangePreset, setRangePreset] = useState<RangePreset>("30d");
  const [selectedCohort, setSelectedCohort] = useState<string>("all");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [tableSearch, setTableSearch] = useState("");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const fetchAnalyticsData = useCallback(async (isSilent = false) => {
    // 1. Check in-memory cache for instant render
    if (analyticsCache && (Date.now() - analyticsCache.timestamp < ANALYTICS_CACHE_TTL)) {
      setAnalytics(analyticsCache.analytics);
      setCohorts(analyticsCache.cohorts);
      setApplications(analyticsCache.applications);
      setLoading(false);
      if (!isSilent) return;
    }

    if (!isSilent && !analyticsCache) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const [analyticsRes, cohortsRes, appsRes] = await Promise.all([
        authFetch("/applications/admin/analytics"),
        authFetch("/cohorts"),
        authFetch("/applications?limit=25").catch(() => null),
      ]);

      if (!analyticsRes.ok) throw new Error("Failed to load analytics data");
      if (!cohortsRes.ok) throw new Error("Failed to load cohorts list");

      const [analyticsData, cohortsData] = await Promise.all([
        analyticsRes.json(),
        cohortsRes.json(),
      ]);

      let fetchedApps: Application[] = [];
      if (appsRes && appsRes.ok) {
        const appsData = await appsRes.json();
        fetchedApps = Array.isArray(appsData) ? appsData : Array.isArray(appsData?.applications) ? appsData.applications : Array.isArray(appsData?.data) ? appsData.data : [];
        setApplications(fetchedApps);
      }

      setAnalytics(analyticsData);
      const rawCohorts = Array.isArray(cohortsData)
        ? cohortsData
        : Array.isArray(cohortsData?.cohorts)
        ? cohortsData.cohorts
        : Array.isArray(cohortsData?.data)
        ? cohortsData.data
        : [];
      setCohorts(rawCohorts);

      // Save to cache
      analyticsCache = {
        analytics: analyticsData,
        cohorts: rawCohorts,
        applications: fetchedApps,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      setError(err.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const cohortNameMap = useMemo(() => {
    const map = new Map<string, string>();
    cohorts.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [cohorts]);

  // Gender breakdown per date
  const dailyGenderMap = useMemo(() => {
    const map = new Map<string, { males: number; females: number; others: number }>();
    if (Array.isArray(applications)) {
      applications.forEach((app) => {
        if (!app.submittedAt) return;
        const dateKey = app.submittedAt.slice(0, 10);
        const existing = map.get(dateKey) || { males: 0, females: 0, others: 0 };
        const g = (app.gender || "").toLowerCase().trim();
        if (g === "male" || g === "m") existing.males += 1;
        else if (g === "female" || g === "f") existing.females += 1;
        else existing.others += 1;
        map.set(dateKey, existing);
      });
    }
    return map;
  }, [applications]);

  const filteredDailyData = useMemo(() => {
    if (!analytics?.daily || analytics.daily.length === 0) return [];
    
    const sorted = [...analytics.daily].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (rangePreset === "all") return sorted;

    const daysCount = rangePreset === "7d" ? 7 : rangePreset === "30d" ? 30 : 90;
    return sorted.slice(-daysCount);
  }, [analytics, rangePreset]);

  const aggregatedPoints = useMemo<AggregatedPoint[]>(() => {
    if (filteredDailyData.length === 0) return [];

    if (granularity === "days") {
      return filteredDailyData.map((item) => {
        const gStats = dailyGenderMap.get(item.date) || { males: 0, females: 0, others: 0 };
        return {
          label: formatShortDate(item.date),
          periodKey: item.date,
          count: item.count,
          males: gStats.males,
          females: gStats.females,
          others: gStats.others,
          startDateStr: item.date,
          rawDates: [item.date],
        };
      });
    }

    if (granularity === "weeks") {
      const weeksMap = new Map<
        string,
        { count: number; males: number; females: number; others: number; rawDates: string[]; dates: Date[] }
      >();

      filteredDailyData.forEach((item) => {
        const d = new Date(item.date);
        if (isNaN(d.getTime())) return;

        const weekNum = getWeekNumber(d);
        const year = d.getFullYear();
        const key = `${year}-W${weekNum.toString().padStart(2, "0")}`;

        const gStats = dailyGenderMap.get(item.date) || { males: 0, females: 0, others: 0 };
        const existing = weeksMap.get(key) || { count: 0, males: 0, females: 0, others: 0, rawDates: [], dates: [] };
        existing.count += item.count;
        existing.males += gStats.males;
        existing.females += gStats.females;
        existing.others += gStats.others;
        existing.rawDates.push(item.date);
        existing.dates.push(d);
        weeksMap.set(key, existing);
      });

      return Array.from(weeksMap.entries()).map(([key, value]) => {
        const sortedDates = value.dates.sort((a, b) => a.getTime() - b.getTime());
        const start = sortedDates[0];
        const end = sortedDates[sortedDates.length - 1];

        const startLabel = start
          ? start.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "";
        const endLabel = end
          ? end.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "";

        return {
          label: `${key.split("-")[1]} (${startLabel}${startLabel !== endLabel ? ` - ${endLabel}` : ""})`,
          periodKey: key,
          count: value.count,
          males: value.males,
          females: value.females,
          others: value.others,
          startDateStr: start ? start.toISOString().split("T")[0] : undefined,
          endDateStr: end ? end.toISOString().split("T")[0] : undefined,
          rawDates: value.rawDates,
        };
      });
    }

    if (granularity === "months") {
      const monthsMap = new Map<
        string,
        { count: number; males: number; females: number; others: number; rawDates: string[]; label: string }
      >();

      filteredDailyData.forEach((item) => {
        const d = new Date(item.date);
        if (isNaN(d.getTime())) return;

        const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        const label = formatMonthYear(item.date);
        const gStats = dailyGenderMap.get(item.date) || { males: 0, females: 0, others: 0 };

        const existing = monthsMap.get(monthKey) || { count: 0, males: 0, females: 0, others: 0, rawDates: [], label };
        existing.count += item.count;
        existing.males += gStats.males;
        existing.females += gStats.females;
        existing.others += gStats.others;
        existing.rawDates.push(item.date);
        monthsMap.set(monthKey, existing);
      });

      return Array.from(monthsMap.entries()).map(([monthKey, value]) => ({
        label: value.label,
        periodKey: monthKey,
        count: value.count,
        males: value.males,
        females: value.females,
        others: value.others,
        rawDates: value.rawDates,
      }));
    }

    return [];
  }, [filteredDailyData, granularity, dailyGenderMap]);

  const totalApplications = useMemo(() => {
    return (analytics?.byStatus || []).reduce((sum, s) => sum + s.count, 0);
  }, [analytics]);

  const statusMetrics = useMemo(() => {
    const map = new Map<string, number>();
    (analytics?.byStatus || []).forEach((s) => map.set(s.status, s.count));

    const approved = map.get("approved") || 0;
    const pending = (map.get("pending") || 0) + (map.get("rejection_review") || 0);
    const rejected = map.get("rejected") || 0;
    const archived = map.get("archived") || 0;

    const approvalRate = totalApplications > 0 ? (approved / totalApplications) * 100 : 0;
    const pendingRate = totalApplications > 0 ? (pending / totalApplications) * 100 : 0;

    return {
      approved,
      pending,
      rejected,
      archived,
      approvalRate,
      pendingRate,
    };
  }, [analytics, totalApplications]);

  const velocityStats = useMemo(() => {
    if (aggregatedPoints.length === 0) return { avg: 0, max: 0, min: 0, total: 0 };
    const counts = aggregatedPoints.map((p) => p.count);
    const total = counts.reduce((a, b) => a + b, 0);
    const avg = total / counts.length;
    const max = Math.max(...counts);

    return { avg, max, min: Math.min(...counts), total };
  }, [aggregatedPoints]);

  // Sort table rows REVERSE (Most Recent to Least Recent)
  const sortedTableRows = useMemo(() => {
    const filtered = tableSearch.trim()
      ? aggregatedPoints.filter(
          (p) =>
            p.label.toLowerCase().includes(tableSearch.toLowerCase()) ||
            p.periodKey.toLowerCase().includes(tableSearch.toLowerCase()) ||
            p.count.toString().includes(tableSearch)
        )
      : aggregatedPoints;

    return [...filtered].sort((a, b) => b.periodKey.localeCompare(a.periodKey));
  }, [aggregatedPoints, tableSearch]);

  const handleExportCSV = () => {
    if (aggregatedPoints.length === 0) return;

    const headers = ["Period Key", "Label", "Total Volume", "Males", "Females", "% of Filtered Volume"];
    const rows = sortedTableRows.map((p) => {
      const share = velocityStats.total > 0 ? ((p.count / velocityStats.total) * 100).toFixed(1) : "0";
      return `"${p.periodKey}","${p.label.replace(/"/g, '""')}",${p.count},${p.males},${p.females},${share}%`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `oriyon_analytics_${granularity}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-slate-500 font-sans">
        <div className="relative flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full text-center">
          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
          <div>
            <h3 className="text-slate-900 font-bold text-base">Loading Analytics</h3>
            <p className="text-xs text-slate-500 mt-1">Fetching live application metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
        <div className="max-w-md w-full rounded-3xl border border-rose-200 bg-rose-50/80 p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-rose-900">Unable to load analytics</h3>
          <p className="mt-2 text-sm text-slate-600 font-medium">{error}</p>
          <button
            onClick={() => fetchAnalyticsData()}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition shadow-md"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans selection:bg-[#00D1C1]/20 pb-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
              Live Ecosystem Intelligence
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Application Analytics <BarChart3 className="w-7 h-7 text-[#00D1C1]" />
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Real-time trends, cohort metrics, and application volume broken down by period.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAnalyticsData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-bold transition duration-200 shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#002d25] hover:bg-[#003e33] text-white text-xs font-bold shadow-md transition duration-200 active:scale-95"
          >
            <Download className="w-4 h-4 text-[#00D1C1]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
          <span className="px-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> View:
          </span>

          {(["days", "weeks", "months"] as Granularity[]).map((g) => {
            const active = granularity === g;
            return (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`relative px-4 py-2 rounded-xl text-xs font-extrabold capitalize transition-all duration-200 ${
                  active
                    ? "bg-white text-[#002d25] shadow-xs border border-slate-200/80 font-black"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="granularityTab"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/80"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{g}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-200/60">
            {(
              [
                { key: "7d", label: "7 Days" },
                { key: "30d", label: "30 Days" },
                { key: "90d", label: "90 Days" },
                { key: "all", label: "All Time" },
              ] as { key: RangePreset; label: string }[]
            ).map((preset) => {
              const active = rangePreset === preset.key;
              return (
                <button
                  key={preset.key}
                  onClick={() => setRangePreset(preset.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-150 ${
                    active
                      ? "bg-emerald-600 text-white shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {cohorts.length > 0 && (
            <div className="relative">
              <select
                value={selectedCohort}
                onChange={(e) => setSelectedCohort(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200/80 text-slate-800 text-xs font-bold py-2 pl-3.5 pr-8 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
              >
                <option value="all">All Cohorts ({cohorts.length})</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Applications"
          value={totalApplications}
          icon={Users}
          badgeText={`Across ${aggregatedPoints.length} ${granularity}`}
          badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
          accentBg="from-emerald-500/10 to-teal-500/5"
          borderColor="border-emerald-100"
        />

        <KpiCard
          label="Approval Rate"
          value={`${statusMetrics.approvalRate.toFixed(1)}%`}
          icon={CheckCircle2}
          subtext={`${statusMetrics.approved} approved applications`}
          badgeText="High Quality"
          badgeColor="bg-blue-50 text-blue-700 border-blue-200"
          accentBg="from-blue-500/10 to-indigo-500/5"
          borderColor="border-blue-100"
        />

        <KpiCard
          label="Review Backlog"
          value={statusMetrics.pending}
          icon={Clock}
          subtext={`${statusMetrics.pendingRate.toFixed(1)}% of total queue`}
          badgeText="Action Needed"
          badgeColor="bg-amber-50 text-amber-800 border-amber-200"
          accentBg="from-amber-500/10 to-yellow-500/5"
          borderColor="border-amber-100"
        />

        <KpiCard
          label={`Avg / ${granularity.slice(0, -1)}`}
          value={Math.round(velocityStats.avg)}
          icon={TrendingUp}
          subtext={`Peak volume: ${velocityStats.max} in period`}
          badgeText="Velocity"
          badgeColor="bg-teal-50 text-teal-800 border-teal-200"
          accentBg="from-teal-500/10 to-emerald-500/5"
          borderColor="border-teal-100"
        />
      </div>

      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Application Flow Trend
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-slate-100 text-slate-600">
                Grouped by {granularity}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Volume Progression over Time
            </h2>
          </div>

          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setChartType("area")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                chartType === "area"
                  ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Area Chart
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                chartType === "bar"
                  ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Bar Chart
            </button>
          </div>
        </div>

        <ChartCanvas
          points={aggregatedPoints}
          chartType={chartType}
          velocityStats={velocityStats}
          hoveredIndex={hoveredPointIndex}
          setHoveredIndex={setHoveredPointIndex}
        />

        <AnimatePresence>
          {hoveredPointIndex !== null && aggregatedPoints[hoveredPointIndex] && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="mt-4 p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-lg border border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#00D1C1] animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-slate-300">
                    Selected Period:{" "}
                    <span className="text-white font-black">
                      {aggregatedPoints[hoveredPointIndex].label}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-[#00D1C1]">
                  {aggregatedPoints[hoveredPointIndex].count}{" "}
                  <span className="text-xs text-slate-400 font-semibold">apps</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Status Breakdown
                </p>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Applications by Status
                </h2>
              </div>
            </div>
            <div className="space-y-3.5">
              {(analytics?.byStatus || []).map((item) => {
                const config = STATUS_CONFIG[item.status] || {
                  label: item.status, bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200", ring: "bg-slate-400", icon: Layers,
                };
                const percentage = totalApplications > 0 ? ((item.count / totalApplications) * 100).toFixed(1) : "0";
                const IconComp = config.icon;
                return (
                  <div key={item.status} className={`p-4 rounded-2xl border ${config.border} ${config.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl bg-white shadow-2xs ${config.text}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-wider ${config.text}`}>
                          {config.label}
                        </span>
                      </div>
                      <span className="text-xl font-black text-slate-900">{item.count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className={`h-full rounded-full ${config.ring}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Cohort Demand
                </p>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Applications by Cohort
                </h2>
              </div>
            </div>
            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
              {(analytics?.byCohort || []).map((item) => {
                const mappedName = item.cohortId ? cohortNameMap.get(item.cohortId) : null;
                const name = mappedName
                  ? mappedName
                  : item.cohortId
                  ? `Cohort (#${item.cohortId.slice(0, 8)})`
                  : "Unassigned Cohort";
                const percentage = totalApplications > 0 ? ((item.count / totalApplications) * 100).toFixed(1) : "0";
                return (
                  <div key={item.cohortId ?? "unassigned"} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white transition duration-150">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">{name}</p>
                        {item.cohortId && !mappedName && (
                          <p className="text-[10px] text-slate-400 font-mono">ID: {item.cohortId}</p>
                        )}
                      </div>
                      <span className="text-xl font-black text-slate-900">{item.count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full rounded-full bg-emerald-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Aggregated Log</p>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">Period Volume Table ({granularity})</h2>
          </div>
          <input
            type="text"
            placeholder="Search period..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Submissions</th>
                <th className="py-3 px-4 text-blue-700">Males (🚹)</th>
                <th className="py-3 px-4 text-pink-700">Females (🚺)</th>
                <th className="py-3 px-4">% Share</th>
                <th className="py-3 px-4 min-w-[120px]">Volume Visualizer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {sortedTableRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No period records match search filter.
                  </td>
                </tr>
              ) : (
                sortedTableRows.map((row) => {
                  const share =
                    velocityStats.total > 0
                      ? ((row.count / velocityStats.total) * 100).toFixed(1)
                      : "0";
                  const barWidth =
                    velocityStats.max > 0 ? (row.count / velocityStats.max) * 100 : 0;

                  return (
                    <tr
                      key={row.periodKey}
                      className="hover:bg-slate-50/80 transition duration-150"
                    >
                      <td className="py-3.5 px-4 font-black text-slate-900">{row.label}</td>
                      <td className="py-3.5 px-4 text-emerald-800 font-extrabold text-sm">
                        {row.count}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60">
                          🚹 {row.males}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-50 text-pink-700 font-bold text-xs border border-pink-200/60">
                          🚺 {row.females}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-semibold">{share}%</td>
                      <td className="py-3.5 px-4">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, subtext, badgeText, badgeColor, accentBg, borderColor }: any) {
  return (
    <div className={`relative p-5 rounded-[2rem] bg-white border ${borderColor} shadow-2xs group`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accentBg} opacity-50 pointer-events-none`} />
      <div className="relative z-10 flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{label}</span>
          <span className="text-2xl font-black text-slate-900 block mt-1">{value}</span>
        </div>
        <div className="p-3 rounded-2xl bg-white shadow-2xs border border-slate-100"><Icon className="w-5 h-5 text-emerald-600" /></div>
      </div>
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-100/80 text-[11px] font-semibold">
        <span className="text-slate-500">{subtext}</span>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${badgeColor}`}>{badgeText}</span>
      </div>
    </div>
  );
}

function ChartCanvas({ points, chartType, velocityStats, hoveredIndex, setHoveredIndex }: any) {
  if (points.length === 0) return <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">No data available</div>;

  const svgWidth = 800, svgHeight = 260, paddingX = 40, paddingTop = 25, paddingBottom = 40;
  const maxVal = Math.max(velocityStats.max, 5);
  const chartInnerWidth = svgWidth - paddingX * 2, chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  const pointsWithCoords = points.map((p: any, index: number) => ({
    ...p, x: paddingX + (index / (points.length - 1)) * chartInnerWidth,
    y: svgHeight - paddingBottom - (p.count / maxVal) * chartInnerHeight
  }));

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
        {chartType === "area" && pointsWithCoords.map((pt: any, idx: number) => (
          <g key={idx} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer">
            <circle cx={pt.x} cy={pt.y} r={hoveredIndex === idx ? 6 : 4.5} fill={hoveredIndex === idx ? "#002d25" : "#00D1C1"} stroke="#ffffff" strokeWidth="2" />
          </g>
        ))}
        {chartType === "bar" && pointsWithCoords.map((pt: any, idx: number) => (
          <rect key={idx} x={pt.x - 10} y={pt.y} width={20} height={svgHeight - paddingBottom - pt.y} fill="#00D1C1" rx="4" onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer" />
        ))}
      </svg>
    </div>
  );
}
