"use client";

import { useState } from "react";
import { getApiBase } from "@/lib/api";

interface ResumeApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResume: (data: {
    memberId?: string;
    email?: string;
    phone?: string;
    fullName?: string;
    address?: string;
    isPaymentPending?: boolean;
    draftData?: any;
  }) => void;
}

const API_BASE = getApiBase();

export default function ResumeApplicationModal({
  isOpen,
  onClose,
  onSelectResume,
}: ResumeApplicationModalProps) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState<any>(null);

  if (!isOpen) return null;

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessInfo(null);

    const query = identifier.trim();
    if (!query) {
      setError("Please enter your Phone Number or Email Address.");
      return;
    }

    setLoading(true);

    try {
      // 1. First, attempt to check via /cooperative/check-status or search endpoints
      let res = await fetch(`${API_BASE}/cooperative/check-status?identifier=${encodeURIComponent(query)}`);
      
      let data: any = null;
      if (res.ok) {
        data = await res.json();
      } else {
        // Fallback search attempt if dedicated check endpoint is unavailable
        const searchRes = await fetch(`${API_BASE}/cooperative/members?search=${encodeURIComponent(query)}`);
        if (searchRes.ok) {
          const list = await searchRes.json();
          const found = Array.isArray(list) ? list.find((m: any) => 
            (m.email && m.email.toLowerCase() === query.toLowerCase()) || 
            (m.phone && m.phone.includes(query)) ||
            (m.memberId && m.memberId.toLowerCase() === query.toLowerCase())
          ) : null;

          if (found) {
            data = {
              found: true,
              memberId: found.id || found.memberId,
              email: found.email,
              phone: found.phone,
              fullName: found.fullName,
              address: found.address,
              paymentStatus: found.registrationFeePaid === "YES" ? "PAID" : "PENDING",
            };
          }
        }
      }

      if (data && (data.found || data.memberId || data.id)) {
        const memberId = data.memberId || data.id;
        const isPending = data.paymentStatus === "PENDING" || data.registrationFeePaid !== "YES";
        
        setSuccessInfo({
          memberId,
          email: data.email || (query.includes("@") ? query : ""),
          phone: data.phone || (!query.includes("@") ? query : ""),
          fullName: data.fullName || "",
          address: data.address || "",
          paymentStatus: data.paymentStatus || (isPending ? "PENDING" : "PAID"),
          whatsappLink: data.whatsappLink || "",
        });
      } else {
        // Check local storage draft as fallback
        const localDraft = localStorage.getItem("oriyon_coop_draft");
        if (localDraft) {
          const parsed = JSON.parse(localDraft);
          const draftData = parsed.data || {};
          if (
            (draftData.email && draftData.email.toLowerCase() === query.toLowerCase()) ||
            (draftData.phone && draftData.phone.includes(query))
          ) {
            onSelectResume({
              email: draftData.email,
              phone: draftData.phone,
              fullName: draftData.fullName,
              draftData,
            });
            onClose();
            return;
          }
        }

        setError("No saved record found matching that Phone Number or Email. Please check the details or start a new application.");
      }
    } catch (err: any) {
      console.error("Error looking up application status:", err);
      // If error occurs (e.g. backend lookup fails), treat search input as resume prefill
      onSelectResume({
        email: query.includes("@") ? query : undefined,
        phone: !query.includes("@") ? query : undefined,
        isPaymentPending: true,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleProceedPayment = () => {
    if (successInfo) {
      onSelectResume({
        memberId: successInfo.memberId,
        email: successInfo.email,
        phone: successInfo.phone,
        fullName: successInfo.fullName,
        address: successInfo.address,
        isPaymentPending: successInfo.paymentStatus === "PENDING",
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative border border-green-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xl font-bold">
            📋
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Resume Application</h3>
            <p className="text-xs text-gray-500">
              Continue your progress or complete pending payment
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        {!successInfo ? (
          <form onSubmit={handleCheckStatus} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Enter your Registered Phone Number or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 08012345678 or user@gmail.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-white text-gray-900 placeholder:text-gray-400"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-lg text-sm shadow transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-lg">⏳</span> Checking status...
                </>
              ) : (
                "Lookup Application →"
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-green-800 uppercase tracking-wide">
                  Application Found
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  successInfo.paymentStatus === "PAID" 
                    ? "bg-green-200 text-green-800" 
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {successInfo.paymentStatus === "PAID" ? "✅ Payment Completed" : "⏳ Payment Pending"}
                </span>
              </div>
              
              {successInfo.fullName && (
                <p className="text-sm font-semibold text-gray-900">{successInfo.fullName}</p>
              )}
              {successInfo.email && (
                <p className="text-xs text-gray-600">Email: {successInfo.email}</p>
              )}
              {successInfo.phone && (
                <p className="text-xs text-gray-600">Phone: {successInfo.phone}</p>
              )}

              {successInfo.paymentStatus === "PAID" ? (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-xs text-green-700 mb-2">
                    Your registration payment has been verified!
                  </p>
                  {successInfo.whatsappLink && (
                    <a
                      href={successInfo.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 bg-[#25D366] text-white rounded-lg px-3 py-2 text-xs font-bold shadow hover:bg-[#20ba5a]"
                    >
                      Join WhatsApp Group
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-amber-700 mt-2">
                  Your application data is saved. Click below to launch Paystack and complete your registration payment.
                </p>
              )}
            </div>

            {successInfo.paymentStatus !== "PAID" && (
              <button
                onClick={handleProceedPayment}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-lg text-sm shadow transition duration-200"
              >
                Proceed to Payment Now 💳
              </button>
            )}

            <button
              onClick={() => setSuccessInfo(null)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg text-xs"
            >
              Search different phone/email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
