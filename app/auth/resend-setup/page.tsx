"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function ResendSetupPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/resend-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // Always show success — don't reveal if email exists or not
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#0f172a] text-white font-sans">

      {/* Left Branding Section */}
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
            EEWYLA <br /> Training Platform
          </h1>
          <p className="text-gray-200 max-w-md text-sm leading-relaxed">
            Empowering youth livestock agripreneurs through structured
            training, practical farm skills, digital traceability and
            enterprise development.
          </p>
        </div>

        <div className="relative z-10 text-gray-300 text-sm">
          Oyo State Programme • Cohort A <br />
          © Oriyon International
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {!sent ? (
            <>
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🔗</div>
                <h2 className="text-2xl font-bold mb-2">Resend Account Setup Link</h2>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  If you didn't receive your setup email or the link expired,
                  enter your email below and we'll send you a new one.
                </p>
              </div>

              <div className="bg-[#111827] border border-gray-700 rounded-xl p-8 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-5">

                  <div>
                    <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-[#020617] border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500"
                    />
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
                    {loading ? "Sending..." : "Send Setup Link"}
                  </button>

                </form>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">📬</div>
                <h2 className="text-2xl font-bold mb-2">Check your email</h2>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  If <span className="text-white">{email}</span> is registered
                  and pending setup, you'll receive a new account setup link
                  shortly. Check your spam folder if you don't see it.
                </p>
              </div>

              <div className="bg-[#111827] border border-gray-700 rounded-xl p-8 shadow-xl text-center space-y-4">
                <p className="text-gray-400 text-sm">
                  The link expires in <span className="text-white">24 hours</span>.
                </p>

                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="text-green-400 text-sm hover:underline"
                >
                  Try a different email
                </button>
              </div>
            </>
          )}

          <div className="text-center mt-6 space-y-2">
            <Link
              href="/learn/lms"
              className="block text-gray-500 text-sm hover:text-gray-300 transition"
            >
              ← Back to login
            </Link>

            <p className="text-center text-gray-500 text-sm mt-4">
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
