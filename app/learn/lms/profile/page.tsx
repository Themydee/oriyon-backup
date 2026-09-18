"use client";

import { useState, useEffect, ChangeEvent, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { authFetch, refreshAccessToken } from "@/lib/api";

interface UserProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  passportPicture?: string;
  idDocumentUrl?: string;
  role?: string;
  institution?: string;
  assignedLga?: string;
  assignedState?: string;
  cohortId?: string;
  approvedRole?: string;
  desiredRoleOption1?: string;
  memberId?: string;
  specialization?: string;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser, updateUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [passportPicture, setPassportPicture] = useState("");
  const [passportFileError, setPassportFileError] = useState("");

  // ID Card Detail States
  const [cohortName, setCohortName] = useState("Cohort 1");
  const [groupName, setGroupName] = useState("Group A");
  const [trackName, setTrackName] = useState("Livestock Trainer");
  const [lgaStateCoop, setLgaStateCoop] = useState("Oyo State · Ibadan North (Oriyon Coop)");

  const isTrainerRole =
    profile?.role === "trainer" ||
    profile?.role === "lead_trainer" ||
    user?.role === "trainer" ||
    user?.role === "lead_trainer";

  const isMandatory =
    searchParams.get("mandatory") === "true" ||
    !passportPicture ||
    !phone ||
    !address ||
    (isTrainerRole && !specialization);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
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

      const payload = JSON.parse(atob(token.split(".")[1]));
      const uid = payload.userId || payload.sub || payload.id;

      if (!uid) {
        setError("User session invalid. Please log in again.");
        setLoading(false);
        return;
      }

      const res = await authFetch(`/users/${uid}`);

      if (!res.ok) {
        setError("Failed to load profile details");
        setLoading(false);
        return;
      }

      const data: UserProfileData = await res.json();
      setProfile(data);
      const resolvedFirstName = data.firstName || (data as any).first_name || payload.firstName || payload.name || "";
      const resolvedLastName = data.lastName || (data as any).last_name || payload.lastName || "";
      setFirstName(resolvedFirstName);
      setLastName(resolvedLastName);
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setSpecialization(data.specialization || (data as any).specialization || "");
      const dbPassport = data.passportPicture || (data as any).passportUrl || (data as any).avatarUrl || (data as any).photo || (data as any).passport_picture || (data as any).passport_url || "";
      if (!dbPassport && typeof window !== "undefined") {
        localStorage.removeItem(`userPassportPicture_${uid}`);
      }
      setPassportPicture(dbPassport);

      // Resolve Cohort (Cohort 1, Cohort 2, Cohort 3)
      let resolvedCohortName = "Cohort 1";
      const resolvedCohortId = data.cohortId || (data as any).cohort?.id;

      try {
        const cohortRes = await authFetch("/cohorts");
        if (cohortRes.ok) {
          const cohorts = await cohortRes.json();
          if (Array.isArray(cohorts) && cohorts.length > 0) {
            const match = cohorts.find((c: any) => c.id === resolvedCohortId) || cohorts[0];
            if (match && match.name) resolvedCohortName = match.name;
          }
        }
      } catch {}

      // Resolve Group
      let resolvedGroupName = "Group A";
      if (resolvedCohortId) {
        try {
          const groupRes = await authFetch(`/cohorts/${resolvedCohortId}/groups`);
          if (groupRes.ok) {
            const groups = await groupRes.json();
            if (Array.isArray(groups)) {
              const match = groups.find((g: any) =>
                (g.members || []).some((m: any) => m.id === uid || m.userId === uid)
              );
              if (match && match.name) resolvedGroupName = match.name;
            }
          }
        } catch {}
      }

      // Resolve Coop, LGA, State
      let coopName = "Oriyon Coop";
      let userLga = data.assignedLga || (data as any).lga || "Ibadan North";
      let userState = data.assignedState || (data as any).state || "Oyo State";

      try {
        const coopRes = await authFetch("/cooperative/members/me");
        if (coopRes.ok) {
          const coopData = await coopRes.json();
          if (coopData.cooperativeName) coopName = coopData.cooperativeName;
          if (coopData.lga) userLga = coopData.lga;
          if (coopData.state) userState = coopData.state;
        }
      } catch {}

      const resolvedTrack = (data as any).approvedRole || (data as any).desiredRoleOption1 || "Livestock Trainer";

      setCohortName(resolvedCohortName);
      setGroupName(resolvedGroupName);
      setTrackName(resolvedTrack);
      setLgaStateCoop(`${userState} · ${userLga} LGA (${coopName})`);

      setUser({
        id: data.id || uid,
        email: data.email,
        role: (data.role as any) || "trainee",
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        specialization: data.specialization || (data as any).specialization || "",
        passportPicture: data.passportPicture,
        idDocumentUrl: data.idDocumentUrl,
      });
    } catch (err) {
      setError("Failed to load user profile.");
    } finally {
      setLoading(false);
    }
  };

  const ALLOWED_PASSPORT_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

  const compressPassportPhoto = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

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
          resolve(canvas.toDataURL("image/jpeg", 0.85));
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

  const handlePassportUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isImage = file.type ? file.type.startsWith("image/") : true;
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      const isAllowedExt = ALLOWED_PASSPORT_EXTENSIONS.includes(ext);

      if (!isImage && !isAllowedExt) {
        setPassportFileError("Invalid file type. Only JPEG, PNG, WEBP, and HEIC images are allowed.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setPassportFileError("Image size exceeds 10MB limit.");
        return;
      }

      setPassportFileError("");
      try {
        const compressedBase64 = await compressPassportPhoto(file);
        setPassportPicture(compressedBase64);
      } catch {
        setPassportFileError("Failed to process passport image. Please try another photo.");
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!passportPicture) {
      setError("A passport photograph / profile picture is required to save your profile.");
      setSaving(false);
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("First Name and Last Name are required.");
      setSaving(false);
      return;
    }

    if (!phone.trim()) {
      setError("Phone Number is required.");
      setSaving(false);
      return;
    }

    if (!address.trim()) {
      setError("Residential Address is required.");
      setSaving(false);
      return;
    }

    if (isTrainerRole && !specialization.trim()) {
      setError("Area(s) of Specialization is mandatory for trainers before saving.");
      setSaving(false);
      return;
    }

    const updatePayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      specialization: specialization.trim(),
      passportPicture,
      passportUrl: passportPicture,
      avatarUrl: passportPicture,
      photo: passportPicture,
    };

    try {
      let token = useAuthStore.getState().accessToken;
      if (!token) {
        token = await refreshAccessToken();
      }
      const payload = JSON.parse(atob(token!.split(".")[1]));
      const uid = profile?.id || payload.userId || payload.sub || payload.id;

      const res = await authFetch(`/users/${uid}`, {
        method: "PATCH",
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const updated = await res.json();

      if (uid && typeof window !== "undefined") {
        localStorage.setItem(`userPassportPicture_${uid}`, passportPicture);
      }

      setSuccess(
        isTrainerRole
          ? "Trainer Profile & Technical Specialization saved successfully! Activating portal access..."
          : "Profile & Passport Photograph saved successfully! Unlocking portal access..."
      );
      updateUser({
        firstName: updated.firstName || firstName,
        lastName: updated.lastName || lastName,
        phone: updated.phone || phone,
        address: updated.address || address,
        specialization: updated.specialization || specialization,
        passportPicture: updated.passportPicture || passportPicture,
        avatarUrl: passportPicture,
      });

      setTimeout(() => {
        if (isTrainerRole) {
          router.push("/admin/cohorts");
        } else {
          router.push("/learn/lms/dashboard");
        }
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500 font-medium text-sm font-sora">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8 font-sora">
      <div className="max-w-4xl mx-auto">
        {/* MANDATORY STEP 2 BANNER */}
        {isMandatory ? (
          <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-5 mb-8 text-amber-950 text-xs font-bold flex items-center justify-between shadow-xs gap-4 font-sora">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎓</span>
              <div>
                <p className="font-extrabold uppercase tracking-wider text-amber-900 text-xs">
                  {isTrainerRole ? "MANDATORY TRAINER PROFILE & SPECIALIZATION SETUP" : "MANDATORY STEP 2 OF 2: PASSPORT PHOTO & DETAILS"}
                </p>
                <p className="font-medium text-slate-700 mt-1 leading-relaxed">
                  {isTrainerRole
                    ? "As an EEWYLA Trainer, you must upload your passport photo and fill all profile fields (Phone, Address, and Area of Specialization) to activate your trainer portal."
                    : "Upload your passport photograph and verify your details below for your official ID card to unlock your LMS portal."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                useAuthStore.getState().logout();
                router.replace("/learn/lms");
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer"
            >
              🚪 Sign Out
            </button>
          </div>
        ) : (
          /* TOP HEADER NAV */
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2.5">
              {(profile?.role === "trainer" || profile?.role === "lead_trainer" || user?.role === "trainer" || user?.role === "lead_trainer") ? (
                <>
                  <Link
                    href="/admin/cohorts"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#002d25] hover:text-emerald-700 transition bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl shadow-2xs"
                  >
                    ← Back to Admin Portal
                  </Link>
                  <Link
                    href="/learn/lms/dashboard"
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-2xs"
                  >
                    LMS Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  href="/learn/lms/dashboard"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-2xs"
                >
                  ← Back to LMS Dashboard
                </Link>
              )}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
              {profile?.role === "trainer" || profile?.role === "lead_trainer" || user?.role === "trainer" || user?.role === "lead_trainer"
                ? "🎓 Trainer Profile & Specialization Settings"
                : "EEWYLA Profile & ID Settings"}
            </span>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-2xl mb-6 flex items-center justify-between shadow-2xs font-medium">
            <span>✓ {success}</span>
            <button onClick={() => setSuccess("")} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-3 rounded-2xl mb-6 flex items-center justify-between shadow-2xs font-medium">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")} className="text-rose-700 hover:text-rose-900 text-xs font-bold">
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* PASSPORT PICTURE CARD FOR ID CARDS */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                  Profile & Official ID Card Photograph
                </h2>
                <p className="text-xs text-slate-500 max-w-md font-medium leading-relaxed">
                  Upload a clear passport photograph. This photograph will be displayed on your profile and printed on your official EEWYLA Membership & Trainer ID card.
                </p>
              </div>

              {/* LIVE ID CARD PREVIEW STUB */}
              <div className="relative bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-5 w-full md:w-80 border-2 border-emerald-500/40 shadow-2xl shrink-0 font-sora overflow-hidden">
                {/* Background Accent Glow */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2.5 mb-3.5">
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-emerald-300 uppercase">EEWYLA ID CARD</p>
                    <p className="text-[8px] text-slate-300 font-medium">Oriyon International Coop</p>
                  </div>
                  <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {profile?.role || user?.role || "Trainee"}
                  </span>
                </div>

                <div className="flex items-start gap-3.5">
                  {/* Photo Frame */}
                  <div className="w-20 h-24 rounded-2xl bg-slate-900 border-2 border-emerald-400/80 overflow-hidden flex items-center justify-center shrink-0 shadow-lg relative">
                    {passportPicture ? (
                      <img src={passportPicture} alt="Passport Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-1">
                        <span className="text-xl">👤</span>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">Passport</p>
                      </div>
                    )}
                  </div>

                  {/* Field Labels & Data */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Full Name */}
                    <div>
                      <p className="text-[7.5px] font-extrabold uppercase text-emerald-400 tracking-wider">
                        {profile?.role === "trainer" || profile?.role === "lead_trainer" || user?.role === "trainer" || user?.role === "lead_trainer"
                          ? "Trainer Full Name"
                          : "Trainee Full Name"}
                      </p>
                      <p className="text-xs font-black text-white leading-tight truncate">{firstName || "First"} {lastName || "Last"}</p>
                    </div>

                    {/* Cohort & Group Grid */}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <div>
                        <p className="text-[7.5px] font-extrabold uppercase text-emerald-400 tracking-wider">Cohort</p>
                        <p className="text-[10px] font-black text-emerald-100">{cohortName}</p>
                      </div>
                      <div>
                        <p className="text-[7.5px] font-extrabold uppercase text-emerald-400 tracking-wider">Group</p>
                        <p className="text-[10px] font-black text-emerald-100">{groupName}</p>
                      </div>
                    </div>

                    {/* Track */}
                    <div>
                      <p className="text-[7.5px] font-extrabold uppercase text-emerald-400 tracking-wider">Track</p>
                      <p className="text-[9.5px] font-bold text-slate-200 truncate">{trackName}</p>
                    </div>

                    {/* LGA, Coop & State */}
                    <div>
                      <p className="text-[7.5px] font-extrabold uppercase text-emerald-400 tracking-wider">LGA / Coop / State</p>
                      <p className="text-[8.5px] font-semibold text-slate-300 leading-tight truncate">
                        {lgaStateCoop}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* UPLOAD CONTROLS */}
            <div className="mt-6 flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                {passportPicture ? (
                  <img src={passportPicture} alt="Passport" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-slate-400">👤</span>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Upload Passport Image (JPEG, PNG, WEBP, HEIC up to 10MB)
                </label>
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handlePassportUpload}
                  className="w-full text-xs text-slate-700 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />
                {passportFileError && (
                  <p className="text-xs font-semibold text-rose-600 mt-1.5">⚠️ {passportFileError}</p>
                )}
                {passportPicture && !passportFileError && (
                  <p className="text-xs font-bold text-emerald-700 mt-1.5">✓ Passport photo ready for saving</p>
                )}
              </div>
            </div>
          </div>

          {/* PERSONAL DETAILS FORM */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-6 pb-3 border-b border-slate-100">
              Personal Information & Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 transition"
                  placeholder="First name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 transition"
                  placeholder="Last name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 transition"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(read-only)</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ""}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 font-semibold cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Residential Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 transition resize-none"
                  placeholder="Full street address..."
                />
              </div>

              {isTrainerRole && (
                <div className="md:col-span-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎓</span> Area(s) of Specialization / Expertise
                    </label>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      Trainer Field
                    </span>
                  </div>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 transition"
                    placeholder="e.g. Ruminant Nutrition, Poultry Farming & Biosecurity, Pasture Management, Artificial Insemination"
                  />
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Specify your core agricultural or technical areas of specialization so administrators can view your expertise.
                  </p>
                </div>
              )}
            </div>

            {/* SAVE BUTTON */}
            {(() => {
              const missingList: string[] = [];
              if (!passportPicture) missingList.push("Passport Photo");
              if (!firstName.trim()) missingList.push("First Name");
              if (!lastName.trim()) missingList.push("Last Name");
              if (!phone.trim()) missingList.push("Phone Number");
              if (!address.trim()) missingList.push("Residential Address");
              if (isTrainerRole && !specialization.trim()) missingList.push("Area(s) of Specialization");

              const canSave = missingList.length === 0;

              return (
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                  {!canSave ? (
                    <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl">
                      ⚠️ Complete mandatory fields to enable saving: <span className="underline">{missingList.join(", ")}</span>
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                      ✓ All required fields completed
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={saving || !canSave}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-8 py-3 rounded-xl transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    {saving ? "Saving Changes..." : "Save Profile & Specialization"}
                  </button>
                </div>
              );
            })()}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500 font-medium text-sm font-sora">
          Loading profile...
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
