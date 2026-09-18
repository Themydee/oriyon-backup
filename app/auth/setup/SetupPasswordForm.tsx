"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

import { getApiBase } from "@/lib/api";

const API_BASE = getApiBase();

interface SetupPasswordFormProps {
  token: string;
}

export default function SetupPasswordForm({ token }: SetupPasswordFormProps) {
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass]           = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [error, setError]                 = useState("");
  const [loading, setLoading]             = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing setup link. Please check your email.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Your link may have expired.");
        setLoading(false);
        return;
      }

      const { accessToken, refreshToken, role } = data;
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("accessToken", accessToken);
      setAccessToken(accessToken);

      // Redirect to correct dashboard based on role
      if (role === "admin" || role === "sub_admin") {
        window.location.href = "/admin/applications";
      } else if (role === "corper") {
        window.location.href = "/admin/corper";
      } else if (role === "trainer" || role === "lead_trainer") {
        window.location.href = "/admin/cohorts";
      } else if (role === "coordinator") {
        window.location.href = "/admin/cooperative/coordinator";
      } else {
        window.location.href = "/learn/lms/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#0f172a] text-white font-sans">
      {/* Left panel */}
      <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden">
        <img
          src="/eewyla/eewyla.png"
          alt="Livestock training"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10">
          <img src="/footer-logo.png" alt="Oriyon International" className="h-10 mb-30" />
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Welcome to <br /> EEWYLA
          </h1>
          <p className="text-gray-200 max-w-md text-sm leading-relaxed">
            You have been accepted into the EEWYLA Training Programme.
            Set your password to access your learning portal.
          </p>
        </div>
        <div className="relative z-10 text-gray-300 text-sm">
          Oyo State Programme • Cohort A <br />
          © Oriyon International
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header spacer */}
          <div className="mb-8" />

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Set Your Password</h2>
            <p className="text-gray-400 text-sm">
              Create a secure password to access your LMS portal
            </p>
          </div>

          <div className="bg-[#111827] border border-gray-700 rounded-xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-[#020617] border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-3 text-gray-400 text-sm"
                  >
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full bg-[#020617] border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 text-gray-400 text-sm"
                  >
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/40 border border-red-500 text-red-300 text-sm px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 transition rounded-lg py-3 text-black font-semibold disabled:opacity-60"
              >
                {loading ? "Setting up..." : "Create Password & Sign In"}
              </button>
            </form>
          </div>

           <p className="text-center text-gray-500 text-sm mt-6">
              Need help?{" "}
              <a href="mailto:eewyla@oriyoninternational.com" className="text-green-400">
                eewyla@oriyoninternational.com
              </a>
            </p>
        </div>
      </div>
    </div>
  );
}

function StepDot({
  step,
  label,
  active,
}: {
  step: number;
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
          active
            ? "bg-green-500 border-green-500 text-black"
            : "border-slate-600 text-slate-500"
        }`}
      >
        {step}
      </div>
      <span className={`text-[10px] uppercase tracking-wide ${active ? "text-green-400" : "text-slate-600"}`}>
        {label}
      </span>
    </div>
  );
}