"use client";

import { useState, FormEvent } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

import { getApiBase } from "@/lib/api";

const API_BASE = getApiBase();

export default function LMSLogin() {
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isSetupError, setIsSetupError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || "Invalid email or password.";
        setError(msg);
        setIsSetupError(msg.toLowerCase().includes("setup"));
        setLoading(false);
        return;
      }

      const { accessToken, refreshToken, role } = data;

      // Save first
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("accessToken", accessToken);

      // Zustand
      setAccessToken(accessToken);
      setUser({ role } as any);

      setLoading(false);

      // Hard redirect (best for auth)
      if (role === "admin" || role === "sub_admin") {
        window.location.href = "/admin/applications";
      } else if (role === "corper") {
        window.location.href = "/admin/corper";
      } else if (role === "trainer" || role === "lead_trainer") {
        window.location.href = "/admin/cohorts";
      } else if (role === "coordinator" || role === "state_coordinator" || role === "zonal_coordinator" || role === "lga_coordinator") {
        window.location.href = "/admin/cooperative/coordinator";
      } else {
        window.location.href = "/learn/lms/dashboard";
      }

    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };


  return (
    <>
      <Head>
        <title>EEWYLA LMS — Oriyon International</title>
      </Head>

      <div className="min-h-screen grid md:grid-cols-2 bg-[#f4faf7] text-slate-800 font-sans relative overflow-hidden">
        {/* Subtle repeating greenSubtract background pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ 
            backgroundImage: "url('/learn/training/greenSubtract.png')", 
            backgroundSize: '120px', 
            backgroundRepeat: 'repeat' 
          }} 
        />

        {/* Left Branding Section */}
        <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden bg-[#e6f2ee] border-r border-[#d1e6e0]">
          <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-10 rotate-[12deg] pointer-events-none">
            <img
              src="/learn/training/greenSubtract.png"
              alt="Africa Watermark"
              className="w-[450px] h-[450px]"
            />
          </div>

          <div className="relative z-10">
            <img src="/logo.svg" alt="Oriyon International" className="h-10 mb-30" />
            <h1 className="text-4xl font-black text-[#002d25] leading-tight mb-4">
              EEWYLA <br /> Training Platform
            </h1>
            <p className="text-slate-650 max-w-md text-sm leading-relaxed font-medium">
              Empowering youth livestock agripreneurs through structured
              training, practical farm skills, digital traceability and
              enterprise development.
            </p>
          </div>

          <div className="relative z-10 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            Oyo State Programme • Cohort A <br />
            © Oriyon International
          </div>

        </div>

        {/* Right Login Section */}
        <div className="flex items-center justify-center p-6 relative z-10">
          <div className="w-full max-w-md">

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 text-[#002d25]">Sign in to LMS Portal</h2>
              <p className="text-slate-500 text-sm">
                Use your programme issued credentials
              </p>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-xl p-8 shadow-xl">
              <form onSubmit={handleLogin} className="space-y-5">

                <div>
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wide font-bold">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00D1C1] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wide font-bold">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00D1C1] text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-3 text-slate-400 text-sm"
                    >
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="text-right">

                  <a
                    href="/auth/forgot-password"
                    className="text-xs text-green-600 font-bold hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg space-y-1.5">
                    <p>{error}</p>
                    {isSetupError && (
                      <a
                        href="/auth/resend-setup"
                        className="block text-green-600 font-semibold hover:underline text-xs"
                      >
                        → Resend my account setup email
                      </a>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] transition rounded-lg py-3 font-bold disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

              </form>
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              Need help?{" "}
              <a href="mailto:eewyla@oriyoninternational.com" className="text-green-600 font-bold hover:underline">
                eewyla@oriyoninternational.com
              </a>
            </p>

            <p className="text-center mt-4">
              <a href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#00D1C1] font-semibold transition">
                ← Back to Homepage
              </a>
            </p>

          </div>
        </div>

      </div>
    </>
  );
}