"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiBase } from "@/lib/api";

const API_BASE = getApiBase();

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset link. Please request a new one.");
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
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
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

      setSuccess(true);
      setTimeout(() => router.push("/learn/lms"), 3000);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#0f172a] text-white font-sans">
      <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden">
        <img
          src="/eewyla/eewyla.png"
          alt="Livestock training"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10">
          <img src="/footer-logo.png" alt="Oriyon International" className="h-10 mb-30" />
          <h1 className="text-4xl font-bold leading-tight mb-4">
            EEWYLA <br /> Training Platform
          </h1>
          <p className="text-gray-200 max-w-md text-sm leading-relaxed">
            Empowering youth livestock agripreneurs through structured training, practical farm skills, digital traceability and enterprise development.
          </p>
        </div>
        <div className="relative z-10 text-gray-300 text-sm">
          Oyo State Programme • Cohort A <br />
          © Oriyon International
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {!success ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Reset your password</h2>
                <p className="text-gray-400 text-sm">
                  Enter a new password for your account
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
                    disabled={loading || !token}
                    className="w-full bg-green-500 hover:bg-green-600 transition rounded-lg py-3 text-black font-semibold disabled:opacity-60"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-2xl font-bold mb-2">Password reset!</h2>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  Your password has been updated successfully. Redirecting you to the login page...
                </p>
              </div>

              <div className="bg-[#111827] border border-gray-700 rounded-xl p-8 shadow-xl text-center">
                <Link href="/learn/lms" className="text-green-400 text-sm hover:underline">
                  Go to login now →
                </Link>
              </div>
            </>
          )}

          <div className="text-center mt-6 space-y-2">
            {!success && (
              <Link href="/auth/forgot-password" className="block text-gray-500 text-sm hover:text-gray-300 transition">
                ← Request a new reset link
              </Link>
            )}

             <p className="text-center text-gray-500 text-sm mt-6">
              Need help?{" "}
              <a href="mailto:eewyla@oriyoninternational.com" className="text-green-400">
                eewyla@oriyoninternational.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
