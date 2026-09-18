"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ShieldCheck, Mail, Phone, MapPin, ExternalLink, HelpCircle, FileText, Upload } from "lucide-react";

export default function ComplaintsPage() {
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [natureOfComplaint, setNatureOfComplaint] = useState("");
  const [dateOfIncident, setDateOfIncident] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [agreedToProcessing, setAgreedToProcessing] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        setEvidence(null);
        e.target.value = "";
      } else {
        setError("");
        setEvidence(file);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!agreedToProcessing) {
      setError("You must consent to data processing for complaints handling.");
      setLoading(false);
      return;
    }

    try {
      let evidenceBase64: string | undefined = undefined;
      let evidenceFilename: string | undefined = undefined;
      let evidenceMimeType: string | undefined = undefined;

      if (evidence) {
        evidenceBase64 = await fileToBase64(evidence);
        evidenceFilename = evidence.name;
        evidenceMimeType = evidence.type;
      }

      const payload = {
        name,
        email,
        phone,
        natureOfComplaint,
        dateOfIncident,
        description,
        evidence: evidenceBase64,
        evidenceFilename,
        evidenceMimeType,
      };

      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit grievance.");
      }

      setTrackingCode(data.trackingCode);
      setSuccess(true);
      
      // Clear form
      setName("");
      setEmail("");
      setPhone("");
      setNatureOfComplaint("");
      setDateOfIncident("");
      setDescription("");
      setEvidence(null);
      setAgreedToProcessing(false);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fcfbf9] min-h-screen font-sora text-gray-800">
      {/* Premium Hero Header */}
      <div className="bg-[#061e1a] text-white pt-32 pb-16 md:pb-20 relative overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#072b25_1px,transparent_1px),linear-gradient(to_bottom,#072b25_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <span className="text-[#00D1C1] text-xs font-bold tracking-widest uppercase mb-3 block">
              Grievance Redress Mechanism
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
              Privacy Grievance & Complaints
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Oriyon International Limited is committed to resolving your privacy concerns transparently. Use this portal to file a formal complaint under our active NDPA 2023 compliance framework.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-gray-400">
              <span>Last updated: June 2026</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
              <span>Oriyon International Limited</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Complaints Policy (7 cols) */}
          <div className="lg:col-span-6 space-y-10 pr-0 lg:pr-6">
            
            {/* Our Commitment section */}
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] pb-2 border-b border-gray-100 flex items-center gap-2">
                <ShieldCheck className="text-[#00D1C1]" size={24} /> 1. Our Commitment
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                Oriyon International Limited is committed to handling your personal data responsibly. If you believe your data has been mishandled, or you have any concern about your privacy on our Learning Management System (LMS) or cooperative portal, we want to hear from you and resolve it promptly.
              </p>
            </div>

            {/* What you can complain about */}
            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-bold text-[#061e1a] pb-2 border-b border-gray-100 flex items-center gap-2">
                <HelpCircle className="text-[#00D1C1]" size={20} /> 2. What You Can Complain About
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                You may raise a grievance with us regarding any privacy or data protection concern, such as:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm text-gray-600">
                <li className="flex items-start gap-2 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-red-500 font-bold">▪</span> Unauthorized collection or sharing of your personal data.
                </li>
                <li className="flex items-start gap-2 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-red-500 font-bold">▪</span> Delays or refusal to honor your Data Subject Rights (Access, Erasure, etc.).
                </li>
                <li className="flex items-start gap-2 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-red-500 font-bold">▪</span> Suspected data leak, unauthorized access, or security incident.
                </li>
                <li className="flex items-start gap-2 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-red-500 font-bold">▪</span> Unsolicited marketing communication or spam.
                </li>
              </ul>
            </div>

            {/* Timelines table */}
            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-bold text-[#061e1a] pb-2 border-b border-gray-100 flex items-center gap-2">
                <FileText className="text-[#00D1C1]" size={20} /> 3. Response Timelines & Stages
              </h2>
              <div className="overflow-x-auto border border-gray-100 rounded-2xl bg-white shadow-xs">
                <table className="min-w-full text-left border-collapse text-xs md:text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[#061e1a] font-bold">
                    <tr>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Timeframe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#061e1a]">Acknowledgement</td>
                      <td className="px-4 py-3">Receipt of complaint and assignment of tracking code</td>
                      <td className="px-4 py-3 text-teal-600 font-medium">Within 5 business days</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#061e1a]">Investigation</td>
                      <td className="px-4 py-3">Internal review by the Data Protection Officer (DPO)</td>
                      <td className="px-4 py-3 text-teal-600 font-medium">Starts within 10 business days</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#061e1a]">Resolution</td>
                      <td className="px-4 py-3">Issuance of final audit response and remedial measures</td>
                      <td className="px-4 py-3 text-teal-600 font-medium">Within 30 days</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#061e1a]">Extended (Complex)</td>
                      <td className="px-4 py-3">For complex cases requiring forensics or third-party audits</td>
                      <td className="px-4 py-3 text-amber-600 font-medium">Up to 60 days (with notice)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* DPO details & escalation */}
            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-bold text-[#061e1a] pb-2 border-b border-gray-100">
                4. DPO Contact & Escalation to NDPC
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                If you are dissatisfied with our response or we do not resolve your complaint within 30 days, you have the right to escalate the matter directly to the national regulator.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2 text-xs shadow-xs">
                  <p className="font-bold text-[#061e1a] text-sm mb-1">Oriyon Data Protection Officer</p>
                  <p className="flex items-center gap-2"><Mail size={14} className="text-[#00D1C1]" /> dpo@oriyoninternational.com</p>
                  <p className="flex items-center gap-2"><MapPin size={14} className="text-[#00D1C1]" /> Suite B5, Oando Mega Plaza, Gaduwa, Abuja, Nigeria</p>
                </div>
                
                <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2 text-xs shadow-xs">
                  <p className="font-bold text-[#061e1a] text-sm mb-1">Nigeria Data Protection Commission</p>
                  <p className="flex items-center gap-2"><ExternalLink size={14} className="text-[#00D1C1]" /> <a href="https://services.ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#00D1C1]">services.ndpc.gov.ng</a></p>
                  <p className="flex items-center gap-2"><Mail size={14} className="text-[#00D1C1]" /> info@ndpc.gov.ng</p>
                  <p className="flex items-center gap-2"><MapPin size={14} className="text-[#00D1C1]" /> No. 5 Donau Crescent, Maitama, Abuja</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Complaints Form (5 cols) */}
          <div className="lg:col-span-6 bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
            
            {success ? (
              // Success Screen
              <div className="text-center py-8 space-y-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="text-[#00D1C1]" size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-[#061e1a]">Complaint Submitted!</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                    Your grievance has been successfully recorded in our NDPA compliance system. A summary has been emailed to you.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 max-w-md mx-auto space-y-3">
                  <div className="text-left space-y-1">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Tracking Reference</span>
                    <strong className="text-lg font-mono text-[#061e1a] select-all block">{trackingCode}</strong>
                  </div>
                  <div className="h-[1px] bg-gray-200" />
                  <div className="text-left text-xs text-gray-500 space-y-1">
                    <p><strong>Estimated Response:</strong> Initial review in 5 business days.</p>
                    <p><strong>Primary Investigator:</strong> Oriyon Data Protection Team.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <button
                    onClick={() => setSuccess(false)}
                    className="px-6 py-3 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
                  >
                    Submit Another Complaint
                  </button>
                  <Link
                    href="/"
                    className="px-6 py-3 bg-[#061e1a] hover:bg-[#092b25] text-[#00D1C1] rounded-xl text-xs font-bold transition shadow-xs text-center"
                  >
                    Back to Homepage
                  </Link>
                </div>
              </div>
            ) : (
              // Form screen
              <form onSubmit={handleSubmit} className="space-y-5 text-left">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#061e1a]">Privacy Redress Form</h3>
                  <p className="text-xs text-gray-400">
                    Fields marked with an asterisk (*) are mandatory.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start text-xs text-red-700 leading-normal">
                    <AlertCircle className="shrink-0 text-red-500" size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter legal name"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-[#00D1C1] text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-[#00D1C1] text-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-[#00D1C1] text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Date of Incident *
                    </label>
                    <input
                      required
                      type="date"
                      value={dateOfIncident}
                      onChange={(e) => setDateOfIncident(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-[#00D1C1] text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Nature of Complaint *
                  </label>
                  <select
                    required
                    value={natureOfComplaint}
                    onChange={(e) => setNatureOfComplaint(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-[#00D1C1] bg-white text-gray-800"
                  >
                    <option value="">Select Category</option>
                    <option value="Unauthorized Data Collection">Unauthorized Data Collection / Sharing</option>
                    <option value="Rights Refusal / Delay">Rights Refusal / Delay (Access, Erasure, etc.)</option>
                    <option value="Suspected Data Breach">Suspected Data Breach / Security Leak</option>
                    <option value="Unsolicited Marketing / Spam">Unsolicited Marketing / Spam</option>
                    <option value="Incorrect / Incomplete Data">Incorrect / Incomplete Personal Data</option>
                    <option value="Other Privacy Concerns">Other Privacy Concerns</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Detailed Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a clear description of the privacy concern, including details of the data involved and dates."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-[#00D1C1] text-gray-800"
                  />
                </div>

                {/* Evidence File Upload */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Supporting Evidence / ID (Optional)
                  </label>
                  <div className="relative border border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-[#00D1C1] transition-all bg-gray-50/50">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="text-gray-400 mb-2" size={20} />
                    <p className="text-[10px] text-gray-500 font-medium">
                      {evidence ? `Selected: ${evidence.name}` : "Click or drag to upload evidence"}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1">
                      Max file size: 5MB. Formats: PDF, PNG, JPG, JPEG.
                    </p>
                  </div>
                </div>

                {/* Consent checkbox */}
                <div className="bg-[#061e1a]/5 rounded-xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      required
                      type="checkbox"
                      checked={agreedToProcessing}
                      onChange={(e) => setAgreedToProcessing(e.target.checked)}
                      className="mt-1 accent-[#061e1a]"
                    />
                    <span className="text-[11px] text-gray-600 leading-normal text-left">
                      I confirm the information provided is accurate and true. I explicitly consent to Oriyon International Limited processing this complaint and contacting me under NDPA guidelines.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !agreedToProcessing}
                  className="w-full bg-[#061e1a] hover:bg-[#092b25] text-[#00D1C1] rounded-xl py-3.5 text-xs font-bold tracking-wider uppercase transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Submitting complaint..." : "Submit Complaint →"}
                </button>
              </form>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
