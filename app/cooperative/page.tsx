"use client";

import { useState, useEffect, FormEvent } from "react";
import { getSenatorialZone } from "@/lib/lgaZones";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getApiBase } from "@/lib/api";
import { saveDraft, getDraft, clearDraft } from "@/lib/draftStorage";
import ResumeApplicationModal from "@/components/ResumeApplicationModal";

const API_BASE = getApiBase();

const OYO_LGAS = [
  "Ibadan North",
  "Ibadan North-East",
  "Ibadan North-West",
  "Ibadan South-East",
  "Ibadan South-West",
  "Akinyele",
  "Oyo East",
  "Oyo West",
  "Atiba",
  "Afijio",
  "Ogbomosho North",
  "Ogbomosho South",
  "Ori Ire",
  "Ogo Oluwa",
  "Iseyin",
  "Itesiwaju",
  "Kajola",
  "Irepo",
  "Olorunsogo",
  "Orelope",
  "Saki East",
  "Saki West",
  "Ibarapa East",
  "Ibarapa Central",
  "Ibarapa North",
  "Atisbo",
  "Iwajowa",
  "Ido",
  "Egbeda",
  "Oluyole",
  "Ona-Ara",
];

// LGA_ZONE_MAP is imported from @/lib/lgaZones

const getNormalizedState = (stateStr: string) => {
  if (!stateStr) return "";
  if (stateStr.toLowerCase().includes("oyo")) return "Oyo State";
  return stateStr.replace(/,?\s*Nigeria/gi, "").trim();
};

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
}

export default function CooperativePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // ── RESUME & PENDING PAYMENT STATE ──
  const [pendingMemberId, setPendingMemberId] = useState<string>("");
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [hasDraftPrompt, setHasDraftPrompt] = useState(false);

  // ── COOPERATIVE FIELDS ──
  const [memberId, setMemberId] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [lga, setLga] = useState("");
  const [locationId, setLocationId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [zoneCluster, setZoneCluster] = useState("");
  const [occupation, setOccupation] = useState("");
  const [livestockType, setLivestockType] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [registrationFeePaid, setRegistrationFeePaid] = useState("NO");
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [monthlyContributionAmount, setMonthlyContributionAmount] = useState("2000");
  const [attendanceCommitment, setAttendanceCommitment] = useState("");

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [signature, setSignature] = useState("");
  const [remarks, setRemarks] = useState("");
  const [agreesToConstitution, setAgreesToConstitution] = useState(false);
  const [willingToContribute, setWillingToContribute] = useState(false);
  const [agreesToDataProcessing, setAgreesToDataProcessing] = useState(false);

  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [selectedCoopId, setSelectedCoopId] = useState<string>("");
  const [coopStateFilter, setCoopStateFilter] = useState<string>("");

  useEffect(() => {
    const fetchCooperatives = async () => {
      try {
        const res = await fetch(`${API_BASE}/cooperative`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : Array.isArray(data?.cooperatives) ? data.cooperatives : Array.isArray(data?.data) ? data.data : [];
          setCooperatives(list);

          const states = Array.from(new Set(list.map((c: Cooperative) => getNormalizedState(c.state)))).filter(Boolean) as string[];
          // Do not auto-select state or cooperative

        }
      } catch (err) {
        console.error("Failed to fetch cooperatives:", err);
      }
    };
    fetchCooperatives();
  }, []);

  // Check for local draft on mount
  useEffect(() => {
    const draft = getDraft("oriyon_coop_draft");
    if (draft && draft.data && Object.keys(draft.data).length > 0) {
      setHasDraftPrompt(true);
    }
  }, []);

  // Save form fields to local draft on changes (debounced)
  useEffect(() => {
    if (fullName || phone || email || selectedCoopId) {
      const timer = setTimeout(() => {
        saveDraft("oriyon_coop_draft", {
          selectedCoopId,
          coopStateFilter,
          fullName,
          gender,
          dateOfBirth,
          phone,
          email,
          address,
          lga,
          zoneCluster,
          occupation,
          livestockType,
          yearsOfExperience,
          idType,
          idNumber,
          nextOfKinName,
          nextOfKinPhone,
          monthlyContributionAmount,
          attendanceCommitment,
          whatsappNumber,
          signature,
          remarks,
          agreesToConstitution,
          willingToContribute,
          agreesToDataProcessing,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    selectedCoopId,
    coopStateFilter,
    fullName,
    gender,
    dateOfBirth,
    phone,
    email,
    address,
    lga,
    zoneCluster,
    occupation,
    livestockType,
    yearsOfExperience,
    idType,
    idNumber,
    nextOfKinName,
    nextOfKinPhone,
    monthlyContributionAmount,
    attendanceCommitment,
    whatsappNumber,
    signature,
    remarks,
    agreesToConstitution,
    willingToContribute,
    agreesToDataProcessing,
  ]);

  const restoreDraft = () => {
    const draft = getDraft("oriyon_coop_draft");
    if (draft && draft.data) {
      const d: any = draft.data;
      if (d.selectedCoopId) setSelectedCoopId(d.selectedCoopId);
      if (d.coopStateFilter) setCoopStateFilter(d.coopStateFilter);
      if (d.fullName) setFullName(d.fullName);
      if (d.gender) setGender(d.gender);
      if (d.dateOfBirth) setDateOfBirth(d.dateOfBirth);
      if (d.phone) setPhone(d.phone);
      if (d.email) setEmail(d.email);
      if (d.address) setAddress(d.address);
      if (d.lga) setLga(d.lga);
      if (d.zoneCluster) setZoneCluster(d.zoneCluster);
      if (d.occupation) setOccupation(d.occupation);
      if (d.livestockType) setLivestockType(d.livestockType);
      if (d.yearsOfExperience) setYearsOfExperience(d.yearsOfExperience);
      if (d.idType) setIdType(d.idType);
      if (d.idNumber) setIdNumber(d.idNumber);
      if (d.nextOfKinName) setNextOfKinName(d.nextOfKinName);
      if (d.nextOfKinPhone) setNextOfKinPhone(d.nextOfKinPhone);
      if (d.monthlyContributionAmount) setMonthlyContributionAmount(d.monthlyContributionAmount);
      if (d.attendanceCommitment) setAttendanceCommitment(d.attendanceCommitment);
      if (d.whatsappNumber) setWhatsappNumber(d.whatsappNumber);
      if (d.signature) setSignature(d.signature);
      if (d.remarks) setRemarks(d.remarks);
      if (typeof d.agreesToConstitution === "boolean") setAgreesToConstitution(d.agreesToConstitution);
      if (typeof d.willingToContribute === "boolean") setWillingToContribute(d.willingToContribute);
      if (typeof d.agreesToDataProcessing === "boolean") setAgreesToDataProcessing(d.agreesToDataProcessing);
    }
    setHasDraftPrompt(false);
  };

  // Reusable non-destructive Paystack checkout launcher
  const launchPaystackCheckout = async (targetMemberId: string, targetEmail?: string) => {
    try {
      setPaymentLoading(true);
      setError("");

      const payInitRes = await fetch(`${API_BASE}/cooperative/payment/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: targetMemberId, email: targetEmail || email }),
      });

      const payInitData = await payInitRes.json();
      if (!payInitRes.ok) {
        throw new Error(payInitData.error || "Failed to initialize payment gateway.");
      }

      let attempts = 0;
      while (!(window as any).PaystackPop && attempts < 20) {
        await new Promise((r) => setTimeout(r, 200));
        attempts++;
      }

      if (typeof window !== "undefined" && (window as any).PaystackPop) {
        const paystackKey =
          process.env.NEXT_PUBLIC_PAYSTACK_COOPERATIVE_PUBLIC_KEY ||
          process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
          "pk_live_ae70c3f282f0e83f62e446d83c12ad4d7a95b40f";

        let paymentCompleted = false;

        const handler = (window as any).PaystackPop.setup({
          key: paystackKey,
          email: payInitData.email || targetEmail || email || "member@oriyoninternational.com",
          amount: payInitData.amount * 100,
          ref: payInitData.reference,
          callback: function (response: any) {
            paymentCompleted = true;
            (async () => {
              try {
                setPaymentLoading(true);
                setError("");
                const verifyRes = await fetch(`${API_BASE}/cooperative/payment/verify`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ reference: response.reference }),
                });
                const verifyData = await verifyRes.json();
                if (verifyRes.ok && verifyData.status === "success") {
                  clearDraft("oriyon_coop_draft");
                  setWhatsappLink(verifyData.whatsappLink);
                  setPaymentSuccess(true);
                  setSubmitted(true);
                  window.scrollTo(0, 0);
                } else {
                  setError(verifyData.message || "Payment verification failed. Please contact support.");
                }
              } catch {
                setError("An error occurred during payment verification.");
              } finally {
                setPaymentLoading(false);
              }
            })();
          },
          onClose: function () {
            if (!paymentCompleted) {
              setPaymentLoading(false);
              setPendingMemberId(targetMemberId);
              setError(
                "Payment window closed. Your registration details are safely saved! Click 'Complete Registration Payment Now' below anytime to complete payment."
              );
            }
          },
        });
        handler.openIframe();
      }
    } catch (err: any) {
      setError(err.message || "Failed to launch payment checkout.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Prefill fields or auto-trigger Live Paystack payment from URL query string
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paramEmail = params.get("email");
      const paramPhone = params.get("phone");
      const paramFullName = params.get("fullName");
      const paramAddress = params.get("address");
      const paramMemberId = params.get("memberId");
      const paramPay = params.get("pay");

      if (paramEmail) setEmail(paramEmail);
      if (paramPhone) {
        setPhone(paramPhone);
        setWhatsappNumber(paramPhone);
      }
      if (paramFullName) setFullName(paramFullName);
      if (paramAddress) setAddress(paramAddress);

      if (paramMemberId) setPendingMemberId(paramMemberId);

      // Auto-trigger live Paystack checkout if memberId or pay=true is specified
      if ((paramMemberId || paramEmail) && paramPay === "true") {
        launchPaystackCheckout(paramMemberId || "", paramEmail || undefined);
      }
    }
  }, []);

  // Dynamically load Paystack Inline JS script on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // WhatsApp group redirect countdown timer
  useEffect(() => {
    if (paymentSuccess && whatsappLink && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (paymentSuccess && whatsappLink && countdown === 0) {
      window.location.href = whatsappLink;
    }
  }, [paymentSuccess, whatsappLink, countdown]);

  const safeCooperatives = Array.isArray(cooperatives) ? cooperatives : [];
  const availableCoopStates = Array.from(
    new Set(safeCooperatives.map((c) => getNormalizedState(c.state)))
  ).filter(Boolean) as string[];

  const selectedCooperative = safeCooperatives.find(c => c.id === selectedCoopId);
  const selectedCoopName = selectedCooperative ? selectedCooperative.name : "the Cooperative";
  const selectedCoopState = selectedCooperative ? selectedCooperative.state : "Oyo State, Nigeria";

  // Auto-set LGA, IDs, and Zone when cooperative changes
  useEffect(() => {
    if (selectedCooperative) {
      setLga(selectedCooperative.lga || selectedCooperative.name);
      setLocationId(selectedCooperative.locationId || "");
      setRegionId(selectedCooperative.regionId || "");
      setZoneCluster(selectedCooperative.zone || "");
    }
  }, [selectedCooperative]);

  // ── SHARED STYLES ──
  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-white text-gray-900";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const radioClass =
    "flex items-center gap-2 text-sm text-gray-900 cursor-pointer";
  const sectionTitle =
    "text-lg font-bold text-green-800 mb-6 pb-2 border-b border-green-100";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!agreesToConstitution || !willingToContribute || !agreesToDataProcessing) {
      setError("You must agree to the constitution, financial contribution, and data processing terms to join the cooperative.");
      return;
    }

    if (!livestockType) {
      setError("Please select a livestock type.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/cooperative/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: null,
          cooperativeId: selectedCoopId,
          memberId,
          fullName,
          gender,
          dateOfBirth,
          phone,
          email: email || undefined,
          address,
          lga,
          zoneCluster,
          locationId: locationId || undefined,
          regionId: regionId || undefined,
          occupation,
          livestockType,
          yearsOfExperience,
          idType,
          idNumber,
          nextOfKinName,
          nextOfKinPhone,
          registrationFeePaid,
          monthlyContributionAmount,
          attendanceCommitment,
          whatsappNumber,
          signature,
          remarks,
          agreesToConstitution,
          willingToContribute,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = "Something went wrong. Please try again.";
        if (typeof data.error === "string") errorMessage = data.error;
        else if (data.error && typeof data.error === "object") errorMessage = JSON.stringify(data.error);
        else if (Array.isArray(data.message)) errorMessage = data.message.join(", ");
        else if (typeof data.message === "string") errorMessage = data.message;

        setError(errorMessage);
        return;
      }

      const memberObj = data.member;
      if (!memberObj || !memberObj.id) {
        throw new Error("Invalid member record returned from registration.");
      }

      if (alreadyMember) {
        setSubmitted(true);
        setPaymentSuccess(false);
        window.scrollTo(0, 0);
      } else {
        await launchPaystackCheckout(memberObj.id, email);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setPaymentLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // FINAL SUCCESS SCREEN
  // ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f9f6f0] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-lg w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-800 mb-3">
            Welcome to the Cooperative!
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            You have successfully been registered as a member of{" "}
            <strong>
              {selectedCoopName}
            </strong>
            .
          </p>

          {paymentSuccess && whatsappLink ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-left space-y-3">
              <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                <span>💬</span> WhatsApp Group Invitation
              </p>
              <p className="text-xs text-green-700 leading-relaxed">
                Your contribution fee has been successfully verified! You are being redirected to your cooperative's official WhatsApp group in <strong className="text-sm font-bold text-green-900">{countdown}s</strong>.
              </p>
              <div className="pt-2">
                <a
                  href={whatsappLink}
                  className="inline-flex w-full items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg px-4 py-3 text-sm font-bold shadow-md transition"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.118.956 11.5.956c-5.44 0-9.866 4.372-9.87 9.802 0 1.698.449 3.355 1.3 4.827l-.999 3.648 3.737-.979zm12.305-6.311c-.33-.165-1.951-.951-2.251-1.06-.3-.11-.519-.165-.737.165-.219.33-.848 1.06-1.039 1.28-.19.22-.382.247-.712.082-1.393-.699-2.29-1.127-3.197-2.684-.24-.413.24-.383.687-1.272.075-.15.038-.282-.019-.397-.057-.115-.519-1.248-.711-1.71-.188-.453-.377-.39-.519-.398-.135-.008-.29-.01-.445-.01-.156 0-.411.058-.626.292-.215.234-.818.8-.818 1.948 0 1.148.835 2.257.95 2.413.116.156 1.644 2.511 3.984 3.52 1.348.582 2.261.8 3.033.684.864-.13 1.952-.797 2.227-1.528.275-.73.275-1.357.192-1.488-.082-.13-.3-.21-.63-.375z" />
                  </svg>
                  Join WhatsApp Group
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-left space-y-3">
              <p className="text-sm text-green-800 font-semibold">
                What happens next?
              </p>
              <div className="space-y-2">
                {alreadyMember ? (
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">⏳</span>
                    <p className="text-xs text-green-700">
                      <strong>Manual Payment Pending Verification</strong> — A cooperative coordinator will verify your offline payment details. Your profile will be activated once approved.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✅</span>
                    <p className="text-xs text-green-700">
                      <strong>Membership active</strong> — you now have access to collective production and market linkages
                    </p>
                  </div>
                )}
                {email && (
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">📧</span>
                    <p className="text-xs text-green-700">
                      Check your inbox at <strong>{email}</strong> for confirmation
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-gray-500 text-xs mb-6">
            Questions? Contact us at{" "}
            <a
              href="mailto:eewyla@oriyoninternational.com"
              className="text-green-600"
            >
              eewyla@oriyoninternational.com
            </a>{" "}
            or call{" "}
            <a href="tel:+2347073433615" className="text-green-600">
              +234 707 343 3615
            </a>
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-6 py-3 text-sm font-semibold transition"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // COOPERATIVE REGISTRATION FORM
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f9f6f0] font-sans">
      {/* Header */}
      <div className="bg-green-800 text-white py-10 px-6 text-center">
        <p className="text-green-300 text-xs uppercase tracking-widest mb-2">
          Oriyon International
        </p>
        <h1 className="text-3xl font-bold mb-2">Join a Cooperative</h1>
        <p className="text-green-200 text-sm max-w-xl mx-auto">
          Select from our network of registered cooperatives in Oyo State, Nigeria
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Draft Recovery Banner */}
        {hasDraftPrompt && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <p className="text-sm font-bold text-green-900">Unsaved Application Found</p>
                <p className="text-xs text-green-700">We found saved details from your previous session.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold shadow"
              >
                Restore Saved Details
              </button>
              <button
                type="button"
                onClick={() => {
                  clearDraft("oriyon_coop_draft");
                  setHasDraftPrompt(false);
                }}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Resume Application Header Link Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">Already Started or Need to Pay?</p>
            <p className="text-xs text-blue-700">Resume your application or complete a pending payment easily.</p>
          </div>
          <button
            type="button"
            onClick={() => setResumeModalOpen(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow"
          >
            Resume Here →
          </button>
        </div>

        {/* Why join banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-amber-900 mb-2">
            Why join the cooperative?
          </p>
          <div className="space-y-1.5">
            <p className="text-xs text-amber-800 flex items-start gap-2">
              <span>🐐</span> Raise animals together and sell them as a group for more money.
            </p>
            <p className="text-xs text-amber-800 flex items-start gap-2">
              <span>📱</span> Track and record your animals easily on your mobile phone.
            </p>
            <p className="text-xs text-amber-800 flex items-start gap-2">
              <span>🤝</span> Sell your animals directly to Oriyon (no middle-men) to get paid.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">

            {/* ── SELECT COOPERATIVE & LGA ── */}
            <h2 className={sectionTitle}>Select Cooperative (LGA)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>State *</label>
                <select
                  value={coopStateFilter}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    setCoopStateFilter(selectedVal);
                    setSelectedCoopId("");
                  }}
                  className={inputClass}
                  required
                >
                  <option value="" disabled>Select State</option>
                  {availableCoopStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Cooperative</label>
                <select
                  value={selectedCoopId}
                  onChange={(e) => setSelectedCoopId(e.target.value)}
                  className={inputClass}
                  required
                  disabled={!coopStateFilter}
                >
                  <option value="" disabled>Select Cooperative</option>
                  {cooperatives
                    .filter((c) => getNormalizedState(c.state) === coopStateFilter)
                    .filter((c, index, self) =>
                      self.findIndex((co) => co.name.trim().toLowerCase() === c.name.trim().toLowerCase()) === index
                    )
                    .map((coop) => (
                      <option key={coop.id} value={coop.id}>
                        {coop.name} {coop.isActive ? "(Registered)" : "(Pending)"}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>LGA</label>
                <input
                  readOnly
                  value={lga}
                  className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                  placeholder="LGA corresponding to cooperative"
                />
              </div>
              <div>
                <label className={labelClass}>Zone</label>
                <input
                  readOnly
                  value={zoneCluster}
                  className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                  placeholder="Auto-populated Zone"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Location ID</label>
                <input
                  readOnly
                  value={locationId}
                  className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                  placeholder="Auto-populated Location ID"
                />
              </div>
              <div>
                <label className={labelClass}>Region ID</label>
                <input
                  readOnly
                  value={regionId}
                  className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                  placeholder="Auto-populated Region ID"
                />
              </div>
            </div>

            {selectedCooperative && (
              <div className="mt-1 p-4 bg-green-50/50 border border-green-100/60 rounded-xl text-xs text-gray-600 leading-relaxed space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-850">Status:</span>
                  {selectedCooperative.isActive ? (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-900 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
                      Registered Cooperative
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
                      Pending Registration
                    </span>
                  )}
                </div>
                {selectedCooperative.description && (
                  <div>
                    <p className="font-semibold text-green-800 mb-1">About this Cooperative Society:</p>
                    <p>{selectedCooperative.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── PERSONAL DETAILS ── */}
            <h2 className={sectionTitle}>Personal Details</h2>
            <div>
              <label className={labelClass}>Full Legal Name *</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Surname First Name Middle Name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Gender *</label>
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Date of Birth *</label>
                <input
                  required
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 08012345678"
                />
              </div>
              <div>
                <label className={labelClass}>WhatsApp Number *</label>
                <input
                  required
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className={inputClass}
                  placeholder="WhatsApp active number"
                />
              </div>
              <div>
                <label className={labelClass}>Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Residential Address *</label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
                rows={2}
                placeholder="House number, street name, town/city"
              />
            </div>

            {/* ── LIVESTOCK & EXPERIENCE ── */}
            <h2 className={sectionTitle}>Occupation & Livestock Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Occupation *</label>
                <input
                  required
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Farmer, Trader"
                />
              </div>
              <div>
                <label className={labelClass}>Livestock Type *</label>
                <select
                  required
                  value={livestockType}
                  onChange={(e) => setLivestockType(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select Type</option>
                  <option value="Goat">Goat</option>
                  <option value="Sheep">Sheep</option>
                  <option value="Cattle">Cattle</option>
                  <option value="Poultry">Poultry</option>
                  <option value="Mixed">Mixed (multiple types)</option>
                  <option value="None">None / Planning to start</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Years of Experience *</label>
                <input
                  required
                  type="number"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 5"
                />
              </div>
            </div>

            {/* ── MEANS OF IDENTIFICATION ── */}
            <h2 className={sectionTitle}>Identification Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Means of Identification *</label>
                <select
                  required
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select ID Type</option>
                  <option value="NIN">NIN (National Identification Number)</option>
                  <option value="Voters Card">Voter's Card</option>
                  <option value="National ID">National ID Card</option>
                  <option value="Drivers License">Driver's License</option>
                  <option value="Passport">International Passport</option>
                  <option value="None">No ID Card Available</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>ID Card Number *</label>
                <input
                  required={idType !== "None" && idType !== ""}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className={inputClass}
                  placeholder="Enter ID number"
                />
              </div>
            </div>

            {/* ── NEXT OF KIN ── */}
            <h2 className={sectionTitle}>Next of Kin Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Next of Kin Name *</label>
                <input
                  required
                  value={nextOfKinName}
                  onChange={(e) => setNextOfKinName(e.target.value)}
                  className={inputClass}
                  placeholder="Full name of next of kin"
                />
              </div>
              <div>
                <label className={labelClass}>Next of Kin Phone Number *</label>
                <input
                  required
                  type="tel"
                  value={nextOfKinPhone}
                  onChange={(e) => setNextOfKinPhone(e.target.value)}
                  className={inputClass}
                  placeholder="Phone number of next of kin"
                />
              </div>
            </div>

            {/* ── FEES, COMMITMENTS & SIGNATURE ── */}
            <h2 className={sectionTitle}>Fees, Commitments & Remarks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50/40 border border-green-100/60 col-span-2">
                <input
                  type="checkbox"
                  id="alreadyMember"
                  checked={alreadyMember}
                  onChange={(e) => setAlreadyMember(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="alreadyMember" className="text-xs text-gray-700 leading-relaxed cursor-pointer select-none">
                  <strong className="text-green-850 block font-bold mb-0.5">I am already a cooperative member (paid manually)</strong>
                  Tick this only if you have already registered and paid your registration fee manually to a cooperative coordinator.
                </label>
              </div>
              <div>
                <label className={labelClass}>Monthly Contribution Amount *</label>
                <input
                  required
                  readOnly
                  disabled
                  value={monthlyContributionAmount}
                  className={`${inputClass} !bg-gray-100 cursor-not-allowed`}
                  placeholder="e.g. ₦500.00, ₦1,000.00"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Attendance Commitment (Y/N) *</label>
              <select
                required
                value={attendanceCommitment}
                onChange={(e) => setAttendanceCommitment(e.target.value)}
                className={inputClass}
              >
                <option value="">Select Option</option>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Digital Signature *</label>
              <input
                required
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className={inputClass}
                placeholder="Type your Full Legal Name to confirm signature"
              />
            </div>

            <div>
              <label className={labelClass}>Remarks / Notes</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={inputClass}
                rows={3}
                placeholder="Enter any additional remarks or comments"
              />
            </div>

            {/* ── CONSTITUTION & CONTRIBUTION AGREEMENTS ── */}
            <h2 className={sectionTitle}>Agreements</h2>

            {/* Constitution — Section 3 */}
            <div className="bg-green-50/60 border border-green-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-3">
                Constitution Agreement — Section 3
              </p>
              <p className="text-xs text-green-700 leading-relaxed mb-4">
                Membership of {selectedCoopName} shall be open to eligible livestock producers who
                agree to abide by this Constitution, participate financially,
                and attend meetings regularly.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreesToConstitution}
                  onChange={(e) => setAgreesToConstitution(e.target.checked)}
                  className="mt-1 accent-green-700 w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm text-green-900">
                  <strong>I agree</strong> to abide by the Constitution of {selectedCoopName},
                  registered under the Cooperative Laws of {selectedCoopState}
                </span>
              </label>
            </div>

            {/* Financial contribution — Section 5 */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-3">
                Financial Participation — Section 5
              </p>
              <p className="text-xs text-amber-700 leading-relaxed mb-4">
                Members of {selectedCoopName} shall pay registration fees and regular contributions
                as agreed by the Cooperative. All funds shall be properly
                recorded and used solely for Cooperative objectives.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={willingToContribute}
                  onChange={(e) => setWillingToContribute(e.target.checked)}
                  className="mt-1 accent-amber-700 w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm text-amber-900">
                  <strong>I understand</strong> and agree to pay the required
                  registration fees and regular contributions as determined by
                  the Cooperative (Section 5)
                </span>
              </label>
            </div>

            {/* Data Processing Consent */}
            <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-3">
                Data Protection & Privacy Consent
              </p>
              <p className="text-xs text-teal-700 leading-relaxed mb-4">
                We process your personal information (including government-issued ID details) to administer your cooperative membership, conduct KYC verification, and manage payouts in compliance with the Nigeria Data Protection Act (NDPA) 2023.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreesToDataProcessing}
                  onChange={(e) => setAgreesToDataProcessing(e.target.checked)}
                  className="mt-1 accent-teal-700 w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm text-teal-900">
                  <strong>I consent</strong> to the collection, storage, and processing of my personal data (including Nigerian government-issued ID details) by Oriyon International Limited for KYC, verification, and cooperative administration, in accordance with the <Link href="/privacy" target="_blank" className="underline font-semibold text-[#061e1a] hover:text-[#00D1C1]">Privacy Policy</Link>, <Link href="/cookies" target="_blank" className="underline font-semibold text-[#061e1a] hover:text-[#00D1C1]">Cookie Policy</Link>, and <Link href="/data-rights" target="_blank" className="underline font-semibold text-[#061e1a] hover:text-[#00D1C1]">Data Subject Rights</Link>.
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 text-sm p-4 rounded-xl space-y-3">
                <p className="leading-relaxed">{error}</p>
                {pendingMemberId && (
                  <button
                    type="button"
                    onClick={() => launchPaystackCheckout(pendingMemberId, email)}
                    disabled={paymentLoading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
                  >
                    {paymentLoading ? "Launching Checkout..." : "Complete Registration Payment Now 💳"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="submit"
              disabled={
                loading || !agreesToConstitution || !willingToContribute || !agreesToDataProcessing || !livestockType
              }
              className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60"
            >
              {loading ? "Registering..." : "Join the Cooperative →"}
            </button>
            <Link
              href="/"
              className="sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-sm text-center text-gray-500 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
          </div>
        </form>

        <ResumeApplicationModal
          isOpen={resumeModalOpen}
          onClose={() => setResumeModalOpen(false)}
          onSelectResume={(resumeData) => {
            if (resumeData.memberId) {
              setPendingMemberId(resumeData.memberId);
              launchPaystackCheckout(resumeData.memberId, resumeData.email);
            } else if (resumeData.draftData) {
              restoreDraft();
            }
          }}
        />
      </div>
    </div>
  );
}
