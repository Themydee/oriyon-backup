"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { isCoordinator } from "@/lib/coordinators";
import { authFetch, refreshAccessToken } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const NAV = [
  { href: "/admin/applications", icon: "📋", label: "Applications", roles: ["admin", "sub_admin"] },
  { href: "/admin/cooperative",  icon: "🤝", label: "Cooperative",  roles: ["admin"]        },
  { href: "/admin/corper",       icon: "🎖️", label: "Corper Hub",    roles: ["admin", "sub_admin", "corper", "coordinator", "trainer", "lead_trainer"] },
  { href: "/admin/announcements", icon: "📢", label: "Announcements", roles: ["admin", "trainer", "lead_trainer", "sub_admin", "corper", "coordinator"] },
  { href: "/admin/users",        icon: "👥", label: "Users",        roles: ["admin", "sub_admin"] },
  { href: "/admin/resend-link",  icon: "✉️", label: "Resend Email Links", roles: ["admin", "sub_admin"] },
  { href: "/admin/cohorts",      icon: "🎓", label: "Cohorts",      roles: ["admin", "trainer", "lead_trainer", "sub_admin", "corper"] },
  { href: "/admin/curriculum",   icon: "📚", label: "Curriculum",   roles: ["admin", "trainer", "lead_trainer", "sub_admin"] },
  { href: "/admin/blog",         icon: "📰", label: "Blog Posts",   roles: ["admin", "sub_admin", "trainer", "lead_trainer"] },
  { href: "/admin/readings",     icon: "📖", label: "Recommended Readings", roles: ["admin", "trainer", "lead_trainer"] },
  { href: "/admin/exams",        icon: "🧪", label: "Exams",        roles: ["admin", "trainer", "lead_trainer"] },
  { href: "/admin/analytics",    icon: "📈", label: "Analytics",    roles: ["admin", "trainer", "lead_trainer"] },
  { href: "/admin/results",      icon: "📊", label: "Results",      roles: ["admin", "trainer", "lead_trainer", "sub_admin", "corper"] },
  { href: "/admin/practical-attendance", icon: "🐐", label: "Weekly Practical", roles: ["admin", "trainer", "lead_trainer", "sub_admin", "corper", "coordinator"] },
  { href: "/admin/week12",       icon: "🗓️", label: "Week 12 Physical", roles: ["admin", "trainer", "lead_trainer", "sub_admin", "corper", "coordinator"] },
  { href: "/admin/appeals",      icon: "⚖️", label: "Appeals",          roles: ["admin", "trainer", "lead_trainer", "sub_admin"] },
  { href: "/admin/live-chat",    icon: "💬", label: "Live Support",     roles: ["admin", "trainer", "lead_trainer", "sub_admin"] },
  { href: "/learn/lms/community", icon: "💬", label: "Community Forum", roles: ["admin", "trainer", "lead_trainer", "sub_admin", "corper", "coordinator"] },
  { href: "/admin/tutorials",    icon: "🎥", label: "Platform Guides", roles: ["admin", "trainer", "lead_trainer", "corper"] },
  { href: "/learn/lms/profile",  icon: "👤", label: "My Profile", roles: ["admin", "trainer", "lead_trainer", "sub_admin", "corper", "coordinator"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const logout   = useAuthStore((s) => s.logout);
  const token    = useAuthStore((s) => s.accessToken);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const userPayload = token ? (() => {
    try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
  })() : null;

  const userRole = userPayload?.role || null;
  const userEmail = userPayload?.email || null;
  const userAssignedLga = userPayload?.assignedLga || null;
  const userAssignedState = userPayload?.assignedState || null;
  const userAssignedZone = userPayload?.assignedZone || null;

  const coordinator = isCoordinator(userEmail);
  const isUserCoordinator =
    userRole === "coordinator" ||
    userRole === "state_coordinator" ||
    userRole === "zonal_coordinator" ||
    userRole === "lga_coordinator" ||
    coordinator ||
    Boolean(userAssignedLga || userAssignedState || userAssignedZone);

  // Helper to determine exact coordinator portal href matching admin-assigned scope
  function getCoordinatorTargetHref(payload: any, email?: string | null): string {
    if (!payload) return "/admin/cooperative/coordinator";

    const role = payload.role;
    const state = payload.assignedState || null;
    const zone = payload.assignedZone || null;
    const lga = payload.assignedLga || null;

    // 1. State Coordinator Scope (Role or assignedState without LGA override)
    if (
      role === "state_coordinator" ||
      (state && !lga && !zone) ||
      (state && (role === "coordinator" || role === "cooperative" || role === "trainee"))
    ) {
      return "/admin/cooperative/state";
    }

    // 2. Zonal Coordinator Scope (Role or assignedZone without LGA override)
    if (
      role === "zonal_coordinator" ||
      (zone && !lga) ||
      (zone && (role === "coordinator" || role === "cooperative" || role === "trainee"))
    ) {
      return "/admin/cooperative/zone";
    }

    // 3. LGA Coordinator Scope (Role, assignedLga, or email fallback)
    if (role === "lga_coordinator" || lga || (email && isCoordinator(email))) {
      return "/admin/cooperative/coordinator";
    }

    // Fallbacks
    if (state) return "/admin/cooperative/state";
    if (zone) return "/admin/cooperative/zone";
    if (lga) return "/admin/cooperative/coordinator";

    return "/admin/cooperative/coordinator";
  }

  // Build coordinator nav link pointing at the right scoped page
  function getCoordinatorHref(): string {
    return getCoordinatorTargetHref(userPayload, userEmail);
  }

  const navItems = isUserCoordinator
    ? [
        { href: getCoordinatorHref(), icon: "🤝", label: "Cooperative Lead", roles: ["coordinator", "state_coordinator", "zonal_coordinator", "lga_coordinator", "trainee", "cooperative"] },
        { href: "/learn/lms/dashboard", icon: "🐐", label: "LMS Portal", roles: ["coordinator", "state_coordinator", "zonal_coordinator", "lga_coordinator", "trainee", "cooperative"] }
      ]
    : NAV.filter((item) => userRole && item.roles.includes(userRole));

  useEffect(() => {
    const restore = async () => {
      const refresh = localStorage.getItem("refreshToken");
      if (!refresh) {
        router.replace("/learn/lms");
        return;
      }

      let currentToken = token;
      if (!currentToken) {
        try {
          currentToken = await refreshAccessToken();
        } catch {
          router.replace("/learn/lms");
          return;
        }
      }

      if (!currentToken) {
        router.replace("/learn/lms");
        return;
      }

      // Check role permissions
      try {
        const payload = JSON.parse(atob(currentToken.split(".")[1]));
        const role  = payload.role;
        const email = payload.email;

        const isUserCoordinator =
          role === "coordinator" ||
          role === "state_coordinator" ||
          role === "zonal_coordinator" ||
          role === "lga_coordinator" ||
          ((role === "trainee" || role === "cooperative") && (payload.assignedLga || payload.assignedState || payload.assignedZone));

        if (role !== "admin" && role !== "sub_admin" && role !== "trainer" && role !== "lead_trainer" && role !== "corper" && !isUserCoordinator) {
          router.replace("/learn/lms");
          return;
        }

        if (role === "coordinator" || role === "state_coordinator" || role === "zonal_coordinator" || role === "lga_coordinator" || isUserCoordinator) {
          const allowedBase = getCoordinatorTargetHref(payload, email);

          if (!pathname.startsWith(allowedBase)) {
            router.replace(allowedBase);
            return;
          }
        } else {
          if (pathname === "/admin" || pathname === "/admin/") {
            const firstAdminNav = NAV.find((item) => item.href.startsWith("/admin/") && item.roles.includes(role));
            if (firstAdminNav) {
              router.replace(firstAdminNav.href);
            } else {
              router.replace("/admin/applications");
            }
            return;
          }

          const currentNavItem = NAV.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
          if (currentNavItem && !currentNavItem.roles.includes(role)) {
            const firstAllowed = NAV.find((item) => item.href.startsWith("/admin/") && item.roles.includes(role));
            if (firstAllowed) {
              router.replace(firstAllowed.href);
            } else {
              router.replace("/learn/lms");
            }
            return;
          }
        }

        if ((role === "trainer" || role === "lead_trainer") && pathname !== "/learn/lms/profile") {
          const uid = payload.userId || payload.sub || payload.id;
          if (uid) {
            try {
              const res = await authFetch(`/users/${uid}`);
              if (res.ok) {
                const u = await res.json();
                const hasPhoto = Boolean(u.passportPicture || u.passportUrl || u.avatarUrl || u.photo);
                const hasPhone = Boolean(u.phone && String(u.phone).trim());
                const hasAddress = Boolean(u.address && String(u.address).trim());
                const hasSpec = Boolean(u.specialization && String(u.specialization).trim());

                if (!hasPhoto || !hasPhone || !hasAddress || !hasSpec) {
                  router.replace("/learn/lms/profile?mandatory=true");
                  return;
                }
              }
            } catch (err) {
              console.warn("Trainer profile check warning:", err);
            }
          }
        }

        setReady(true);
      } catch {
        router.replace("/learn/lms");
      }
    };

    restore();
  }, [token, pathname]);

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refreshToken");
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    logout();
    router.push("/learn/lms");
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const currentNav = navItems.find((item) => isActive(item.href));

  if (!ready) return (
    <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center text-slate-500 text-sm relative overflow-hidden font-sora">
      <div 
        className="fixed inset-0 opacity-[0.14] pointer-events-none z-0" 
        style={{ 
          backgroundImage: "url('/learn/training/greenSubtract.png')", 
          backgroundSize: '150px', 
          backgroundRepeat: 'repeat',
          filter: 'hue-rotate(15deg) brightness(0.95)'
        }} 
      />
      <div className="relative z-10 flex flex-col items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-5 rounded-2xl border border-emerald-100 shadow-xl">
        <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
        <span className="font-semibold text-slate-700 text-xs tracking-wide">Loading Portal...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-800 flex relative overflow-x-hidden font-sora selection:bg-[#00D1C1]/20 selection:text-emerald-900">
      
      {/* Background White & Green Subtract Layer with subtle glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-[0.14]" 
          style={{ 
            backgroundImage: "url('/learn/training/greenSubtract.png')", 
            backgroundSize: '160px', 
            backgroundRepeat: 'repeat',
            filter: 'hue-rotate(15deg) brightness(0.95)'
          }} 
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00D1C1]/10 via-transparent to-transparent" />
      </div>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 z-40 flex flex-col transition-all duration-300 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.03)] ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>

        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 bg-white/60">
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/logo.svg" width={110} height={28} className="h-7 w-auto transition-transform group-hover:scale-105" alt="Oriyon" priority />
          </Link>
          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-50 text-[#002d25] border border-emerald-200/60 shadow-2xs">
            Admin
          </span>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-6 flex flex-col gap-1.5 overflow-y-auto relative z-10 custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-emerald-50 to-teal-50/50 text-[#002d25] font-bold border border-emerald-200/80 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#00D1C1] rounded-r-full shadow-xs" />
                )}
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-transform duration-200 ${
                  active 
                    ? "bg-white text-emerald-700 shadow-xs border border-emerald-100" 
                    : "bg-slate-50 text-slate-500 group-hover:scale-110 group-hover:bg-white group-hover:text-slate-800"
                }`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Identity & Sign Out Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          {userEmail && (
            <Link
              href="/learn/lms/profile"
              onClick={() => setSidebarOpen(false)}
              className="mb-2 p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 transition shadow-2xs flex items-center gap-3 group cursor-pointer"
              title="Click to edit profile photo and specialization"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 group-hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-xs transition">
                {userEmail.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-purple-900">{userEmail}</p>
                  <span className="text-[10px] text-purple-600 font-extrabold group-hover:underline">Edit ✏️</span>
                </div>
                <p className="text-[10px] font-semibold text-emerald-600 group-hover:text-purple-700 uppercase tracking-wide truncate mt-0.5">
                  {userRole || "Administrator"} • Edit Profile
                </p>
              </div>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200/60 border border-transparent transition-all duration-200"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 relative z-10">

        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between h-16 px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/70 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            {currentNav && (
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center text-base shadow-2xs">
                {currentNav.icon}
              </span>
            )}
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                {currentNav?.label || "Admin Portal"}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Oriyon International Ecosystem Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(userRole === "trainer" || userRole === "lead_trainer") && (
              <Link
                href="/learn/lms/profile"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-purple-900 bg-purple-100/90 hover:bg-purple-200 border border-purple-300 transition-all duration-200 shadow-2xs"
              >
                🎓 My Photo & Specialization ✏️
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Production Active
            </span>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100/80 hover:bg-emerald-50 border border-slate-200/60 hover:border-emerald-200 transition-all duration-200"
            >
              Public Site ↗
            </Link>
          </div>
        </header>

        {/* Mobile Header Bar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 lg:hidden sticky top-0 z-20 shadow-xs">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition text-lg"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" width={95} height={24} className="h-6 w-auto" alt="Oriyon" priority />
            <span className="text-xs font-extrabold text-slate-800">Admin</span>
          </div>
          <div className="w-8" />
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
