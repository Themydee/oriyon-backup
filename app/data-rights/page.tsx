"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const SECTIONS = [
  { id: "rights-overview", title: "1. Overview of Your Rights" },
  { id: "right-to-be-informed", title: "2. Right to be Informed" },
  { id: "right-of-access", title: "3. Right of Access" },
  { id: "right-to-rectification", title: "4. Right to Rectification" },
  { id: "right-to-erasure", title: "5. Right to Erasure (Forgotten)" },
  { id: "right-to-restrict", title: "6. Right to Restrict Processing" },
  { id: "right-to-portability", title: "7. Right to Data Portability" },
  { id: "right-to-object", title: "8. Right to Object" },
  { id: "right-automated-decision", title: "9. Automated Decision-Making" },
  { id: "right-withdraw-consent", title: "10. Right to Withdraw Consent" },
  { id: "how-to-exercise", title: "11. How to Exercise Your Rights" },
  { id: "ndpc-complaints", title: "12. Lodging a Complaint with NDPC" },
];

export default function DataRightsPage() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;

      // Find the current section
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-white min-h-screen font-sora text-gray-800">
      {/* Premium Hero Header */}
      <div className="bg-[#061e1a] text-white pt-32 pb-16 md:pb-20 relative overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#072b25_1px,transparent_1px),linear-gradient(to_bottom,#072b25_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <span className="text-[#00D1C1] text-xs font-bold tracking-widest uppercase mb-3 block">
              Legal & Compliance
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
              Your Data Rights
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Under the Nigeria Data Protection Act (NDPA) 2023, your personal data belongs to you. Here is a clear guide on the rights you hold and how to exercise them.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-gray-400">
              <span>Last updated: June 2026</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
              <span>Oriyon International Limited</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-72 lg:sticky lg:top-28 flex-shrink-0 bg-gray-50 border border-gray-100 rounded-2xl p-5 hidden lg:block">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Table of Contents
            </h2>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
                    setActiveSection(section.id);
                  }}
                  className={`text-xs py-2 px-3 rounded-lg font-medium transition-all ${
                    activeSection === section.id
                      ? "bg-[#061e1a] text-[#00D1C1] font-bold shadow-sm"
                      : "text-gray-500 hover:text-[#061e1a] hover:bg-gray-100/70"
                  }`}
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Policy content */}
          <article className="flex-1 max-w-4xl prose prose-slate prose-teal prose-sm md:prose-base text-gray-600 space-y-12">
            
            {/* 1. Overview of Your Rights */}
            <section id="rights-overview" className="scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                1. Overview of Your Rights
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                When you register on our platform, apply for the EEWYLA training, or join a cooperative through Oriyon International Limited, we collect and process your personal information. The Nigeria Data Protection Act (NDPA) 2023 guarantees you specific statutory rights to protect your privacy and personal data.
              </p>
              <p className="leading-relaxed text-sm md:text-base mt-3">
                This page explains what those rights are, how they apply to the information we hold, and how you can make a formal request to exercise them.
              </p>
            </section>

            {/* 2. Right to be Informed */}
            <section id="right-to-be-informed" className="scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                2. Right to be Informed
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                You have the right to know what personal data we collect about you, why we collect it, how we use it, how long we store it, and who we share it with. We fulfill this right through our comprehensive <Link href="/privacy" className="text-[#061e1a] hover:text-[#00D1C1] underline font-semibold transition">Privacy Policy</Link> and our <Link href="/cookies" className="text-[#061e1a] hover:text-[#00D1C1] underline font-semibold transition">Cookie Notice</Link>.
              </p>
            </section>

            {/* 3. Right of Access */}
            <section id="right-of-access" className="scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                3. Right of Access
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                You have the right to ask us whether we are processing your personal data and to request a copy of the specific data we hold. This is often referred to as a &quot;Data Subject Access Request&quot; (DSAR). We will provide this information in a clear, easy-to-understand format within 30 days.
              </p>
            </section>

            {/* 4. Right to Rectification */}
            <section id="right-to-rectification" className="scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                4. Right to Rectification
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                If you discover that any personal data we hold about you is inaccurate, out of date, or incomplete (such as a misspelled name, an old address, or incorrect cooperative details), you have the right to ask us to correct it. You may also update certain information directly through your LMS dashboard.
              </p>
            </section>

            {/* 5. Right to Erasure */}
            <section id="right-to-erasure" className="scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                5. Right to Erasure (&quot;Right to be Forgotten&quot;)
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                You may request that we delete or erase your personal data from our systems under certain circumstances, including:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-sm md:text-base">
                <li>The data is no longer necessary for the purpose it was originally collected.</li>
                <li>You withdraw your consent and there is no other legal basis for us to continue processing it.</li>
                <li>You object to the processing and there are no overriding legitimate grounds for us to continue.</li>
              </ul>
              <p className="leading-relaxed text-sm md:text-base mt-3">
                <em>Note: We may be legally required or permitted to retain certain records for regulatory, financial auditing, or legal compliance purposes, in which case we will notify you of these obligations.</em>
              </p>
            </section>

            {/* 6. Right to Restrict Processing */}
            <section id="right-to-restrict" className="scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                6. Right to Restrict Processing
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                You have the right to ask us to pause or restrict the processing of your personal data. This means we can continue storing your data but must stop active operations on it. This applies if:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-sm md:text-base">
                <li>You challenge the accuracy of the data and want us to pause processing while we verify it.</li>
                <li>The processing is unlawful, but you object to deletion and request restriction instead.</li>
                <li>We no longer need the data, but you require it to establish, exercise, or defend a legal claim.</li>
              </ul>
            </section>

            {/* 7. Right to Data Portability */}
            <section id="right-to-portability" className="scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                7. Right to Data Portability
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                You have the right to obtain your personal data in a structured, commonly used, machine-readable format (such as JSON or CSV) so that you can easily transfer it to another organization or service provider without hindrance from us.
              </p>
            </section>

            {/* 8. Right to Object */}
            <section id="right-to-object" className="scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                8. Right to Object
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                You have the right to object to us processing your personal data, including:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-sm md:text-base">
                <li>Processing for direct marketing purposes (which you can opt out of at any time).</li>
                <li>Processing based on our legitimate business interests, unless we can demonstrate compelling legitimate grounds that override your rights and freedoms.</li>
              </ul>
            </section>

            {/* 9. Automated Decision-Making */}
            <section id="right-automated-decision" className="scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                9. Rights Related to Automated Decision-Making
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                You have the right not to be subject to a decision based solely on automated processing (including profiling) that produces legal effects or similarly affects you. If automated decisions are made (such as automated grading or application scoring), you have the right to request human intervention, express your point of view, and contest the decision.
              </p>
            </section>

            {/* 10. Right to Withdraw Consent */}
            <section id="right-withdraw-consent" className="scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                10. Right to Withdraw Consent
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                Where we process your data based on your explicit consent (such as voluntary newsletter subscription or specific marketing consent), you have the right to withdraw that consent at any time. Withdrawal of consent does not affect the lawfulness of any data processing that occurred prior to your withdrawal.
              </p>
            </section>

            {/* 11. How to Exercise Your Rights */}
            <section id="how-to-exercise" className="scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                11. How to Exercise Your Rights
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                To submit a formal request to exercise any of the rights listed above, please use the following contact details:
              </p>
              <div className="my-6 bg-gray-50 border border-gray-100 rounded-2xl p-6 text-sm text-gray-600 space-y-3">
                <p><strong>Method:</strong> Email</p>
                <p><strong>Email Address:</strong> <a href="mailto:dpo@oriyoninternational.com" className="text-[#061e1a] hover:text-[#00D1C1] font-semibold transition">dpo@oriyoninternational.com</a></p>
                <p><strong>Subject Line:</strong> Data Subject Rights Request — [Your Full Name]</p>
                <p><strong>Post:</strong> Suite B5, Oando Mega Plaza, Gaduwa, Abuja, Nigeria</p>
              </div>
              <p className="leading-relaxed text-sm md:text-base">
                To protect your privacy and security, we are required to verify your identity before processing your request. Please include copy of a Nigerian government-issued ID (e.g. NIN, voter&apos;s card, or passport) or apply using the verified email address linked to your Oriyon LMS account.
              </p>
              <p className="leading-relaxed text-sm md:text-base mt-3">
                <strong>Timeline:</strong> We will acknowledge your request within 5 business days and provide a full response or action update within 30 days. For extremely complex requests, we may extend this by an additional 30 days, in which case we will notify you of the delay and the reasons for it.
              </p>
            </section>

            {/* 12. Lodging a Complaint with NDPC */}
            <section id="ndpc-complaints" className="scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                12. Lodging a Complaint with the NDPC
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                If you believe that we have not handled your personal data in compliance with the Nigeria Data Protection Act 2023, or if we fail to respond to your rights request within the statutory timeframe, you have the right to lodge a formal complaint with the Nigeria Data Protection Commission (NDPC).
              </p>
              <div className="my-6 bg-[#061e1a]/5 border border-[#061e1a]/10 rounded-2xl p-6 text-sm text-gray-700 space-y-2">
                <p className="font-bold text-[#061e1a]">Nigeria Data Protection Commission (NDPC)</p>
                <p><strong>Website:</strong> <a href="https://www.ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="text-[#061e1a] hover:text-[#00D1C1] transition underline">www.ndpc.gov.ng</a></p>
                <p><strong>Email:</strong> <a href="mailto:info@ndpc.gov.ng" className="text-[#061e1a] hover:text-[#00D1C1] transition underline">info@ndpc.gov.ng</a></p>
                <p><strong>Complaints Portal:</strong> <a href="https://services.ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="text-[#061e1a] hover:text-[#00D1C1] transition underline">services.ndpc.gov.ng</a></p>
                <p><strong>Address:</strong> No. 5 Donau Crescent, Off Amazon Street, Maitama, Abuja, Nigeria</p>
              </div>
              <p className="leading-relaxed text-sm md:text-base">
                We encourage you to contact our Data Protection Officer at <a href="mailto:dpo@oriyoninternational.com" className="text-[#061e1a] hover:text-[#00D1C1] font-semibold transition">dpo@oriyoninternational.com</a> or submit a grievance through our <Link href="/complaints" className="text-[#061e1a] hover:text-[#00D1C1] font-semibold transition underline">Grievance & Complaints Form</Link> first. We are committed to working with you directly to resolve any privacy concerns.
              </p>
            </section>

          </article>
        </div>
      </div>
    </div>
  );
}
