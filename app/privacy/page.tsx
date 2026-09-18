"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const SECTIONS = [
  { id: "who-we-are", title: "1. Who We Are" },
  { id: "scope", title: "2. Scope" },
  { id: "data-we-collect", title: "3. Personal Data We Collect" },
  { id: "how-we-collect", title: "4. How We Collect Data" },
  { id: "how-we-use", title: "5. How We Use Your Data" },
  { id: "legal-basis", title: "6. Legal Basis for Processing" },
  { id: "sharing-data", title: "7. Sharing Your Data" },
  { id: "international-transfers", title: "8. International Transfers" },
  { id: "data-retention", title: "9. Data Retention" },
  { id: "your-rights", title: "10. Your Rights" },
  { id: "data-security", title: "11. Data Security" },
  { id: "childrens-data", title: "12. Children’s Data" },
  { id: "changes", title: "13. Changes to This Policy" },
  { id: "contact-us", title: "14. Contact Us" },
];

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Oriyon International Limited is committed to protecting your personal data. This policy explains our practices regarding your information and how we safeguard it.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-gray-400">
              <span>Last updated: 20 June 2026</span>
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
          <article className="flex-1 max-w-4xl prose prose-slate prose-teal prose-sm md:prose-base">
            
            {/* 1. Who We Are */}
            <section id="who-we-are" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                1. Who We Are
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                Oriyon International Limited (“Oriyon,” “we,” “us,” or “our”) is an agricultural production and aggregation company operating across Nigeria and the United Kingdom, including delivery of the EEWYLA cooperative programme for women and youth in agriculture. This Privacy Policy explains how we collect, use, disclose, and protect personal data when you visit <Link href="/" className="text-[#061e1a] hover:text-[#00D1C1] underline transition">www.oriyoninternational.com</Link> (the “Site”), register for our programmes, or otherwise interact with us.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                Oriyon International Limited is registered in Nigeria and the United Kingdom. Our registered offices are:
              </p>
              <ul className="list-disc pl-5 text-gray-600 space-y-2 mb-4 text-sm md:text-base">
                <li><strong>Nigeria:</strong> Suite B5 Oando Mega Plaza, Gaduwa, Abuja FCT, Nigeria</li>
                <li><strong>United Kingdom:</strong> [UK Registered Address]</li>
              </ul>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                For data protection queries, contact us at: <a href="mailto:dpo@oriyoninternational.com" className="text-[#061e1a] hover:text-[#00D1C1] font-medium transition underline">dpo@oriyoninternational.com</a> (Data Protection Officer)
              </p>
            </section>

            {/* 2. Scope */}
            <section id="scope" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                2. Scope
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                This Policy applies to personal data we collect through:
              </p>
              <ul className="list-disc pl-5 text-gray-600 space-y-2 text-sm md:text-base">
                <li>The Site (including contact forms, newsletter sign-ups, and the “Send a message” feature)</li>
                <li>The “Join a Cooperative” registration page</li>
                <li>EEWYLA cooperative registration and onboarding</li>
                <li>Email, WhatsApp, and other direct communications with us</li>
                <li>Partner and stakeholder engagement (investors, government agencies, financial institutions)</li>
              </ul>
            </section>

            {/* 3. Personal Data We Collect */}
            <section id="data-we-collect" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                3. Personal Data We Collect
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6 text-sm md:text-base">
                Depending on how you interact with us, we may collect different categories of personal information:
              </p>
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="min-w-full divide-y divide-gray-100 text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">Category</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Examples</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white text-xs md:text-sm text-gray-600">
                    <tr>
                      <td className="px-4 py-3.5 font-semibold text-[#061e1a]">Identity data</td>
                      <td className="px-4 py-3.5">Full name, date of birth, government ID (where required for cooperative registration)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 font-semibold text-[#061e1a]">Contact data</td>
                      <td className="px-4 py-3.5">Email address, phone number, postal/farm address</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 font-semibold text-[#061e1a]">Cooperative/programme data</td>
                      <td className="px-4 py-3.5">LGA cluster, farm coordinates, livestock/crop holdings, cooperative membership status</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 font-semibold text-[#061e1a]">Communications data</td>
                      <td className="px-4 py-3.5">Messages sent via contact forms, WhatsApp, or email</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 font-semibold text-[#061e1a]">Technical data</td>
                      <td className="px-4 py-3.5">IP address, browser type, device identifiers, pages visited (see our <Link href="/cookies" className="text-[#061e1a] hover:text-[#00D1C1] font-semibold transition underline">Cookie Notice</Link>)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 font-semibold text-[#061e1a]">Financial data</td>
                      <td className="px-4 py-3.5">Bank details where required for programme disbursements or partnership transactions (processed via authorised financial partners)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3 italic">
                We do not knowingly collect special category data (e.g., health, religious belief) unless voluntarily provided and necessary for programme delivery, in which case we will seek explicit consent.
              </p>
            </section>

            {/* 4. How We Collect Data */}
            <section id="how-we-collect" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                4. How We Collect Data
              </h2>
              <ul className="list-disc pl-5 text-gray-600 space-y-2 text-sm md:text-base">
                <li><strong>Directly from you:</strong> when you fill in a form, register via the “Join a Cooperative” page, register for EEWYLA, or message us</li>
                <li><strong>Automatically:</strong> through cookies and similar technologies when you navigate our Site</li>
                <li><strong>From third parties:</strong> such as government partners (e.g., FMLD), financial institutions, or technical delivery partners (e.g., ILRI), where you have engaged with a programme they help administer</li>
              </ul>
            </section>

            {/* 5. How We Use Your Data */}
            <section id="how-we-use" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                5. How We Use Your Data
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                We use personal data to:
              </p>
              <ol className="list-decimal pl-5 text-gray-600 space-y-2 text-sm md:text-base">
                <li>Process “Join a Cooperative” applications and register and onboard cooperative members into EEWYLA clusters</li>
                <li>Operate, maintain, and improve the Site</li>
                <li>Respond to enquiries and provide customer/programme support</li>
                <li>Administer partnerships with financial institutions, government bodies, and technical partners</li>
                <li>Send programme updates, newsletters, or marketing communications (where you have opted in)</li>
                <li>Comply with legal, regulatory, and reporting obligations in Nigeria and the UK</li>
                <li>Detect, prevent, and investigate fraud or security incidents</li>
              </ol>
            </section>

            {/* 6. Legal Basis for Processing */}
            <section id="legal-basis" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                6. Legal Basis for Processing (UK/EU Visitors)
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                Where the UK GDPR applies, we rely on the following legal bases:
              </p>
              <ul className="list-disc pl-5 text-gray-600 space-y-2 text-sm md:text-base">
                <li><strong>Consent</strong> — for marketing communications and optional data fields</li>
                <li><strong>Contract</strong> — to deliver programme services you have registered for</li>
                <li><strong>Legitimate interests</strong> — to operate and improve the Site and our programmes, provided this does not override your rights</li>
                <li><strong>Legal obligation</strong> — to comply with applicable law</li>
              </ul>
            </section>

            {/* 7. Sharing Your Data */}
            <section id="sharing-data" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                7. Sharing Your Data
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                We may share personal data with:
              </p>
              <ul className="list-disc pl-5 text-gray-600 space-y-2 text-sm md:text-base mb-4">
                <li>Technical and delivery partners (e.g., ILRI for cooperative training)</li>
                <li>Government and development partners (e.g., FMLD, AfDB, LAUTECH) for programme reporting and verification</li>
                <li>Financial institutions under signed MoU frameworks, for disbursement and payment processing</li>
                <li>Service providers (hosting, analytics, communications tools) bound by confidentiality obligations</li>
                <li>Regulators or authorities, where required by law</li>
              </ul>
              <p className="text-gray-600 font-semibold text-sm md:text-base">
                We do not sell personal data to third parties.
              </p>
            </section>

            {/* 8. International Transfers */}
            <section id="international-transfers" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                8. International Transfers
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                As we operate across Nigeria and the UK, personal data may be transferred between these jurisdictions and to service providers located elsewhere. Where data leaves the UK or EU, we rely on appropriate safeguards such as Standard Contractual Clauses or equivalent mechanisms.
              </p>
            </section>

            {/* 9. Data Retention */}
            <section id="data-retention" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                9. Data Retention
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                We retain personal data only as long as necessary for the purposes set out in this Policy, including to meet legal, accounting, or reporting requirements. Cooperative registration data is retained for the duration of programme participation plus a reasonable period thereafter for audit purposes.
              </p>
            </section>

            {/* 10. Your Rights */}
            <section id="your-rights" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                10. Your Rights
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                Under data protection laws (including the NDPA 2023 for Nigerian users), you have specific rights regarding your personal information. You can read our detailed description of these rights and how to exercise them on our <Link href="/data-rights" className="text-[#061e1a] hover:text-[#00D1C1] font-semibold transition underline">Data Subject Rights page</Link>.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                Your rights include:
              </p>
              <ul className="list-disc pl-5 text-gray-600 space-y-2 mb-4 text-sm md:text-base">
                <li>Access the personal data we hold about you</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data (Right to be Forgotten)</li>
                <li>Object to or restrict certain processing</li>
                <li>Withdraw consent at any time (where processing is based on consent)</li>
                <li>Data portability</li>
                <li>Lodge a complaint with a supervisory authority (e.g., Nigeria’s NDPC, or the UK ICO)</li>
              </ul>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                To exercise these rights, submit a request via our <Link href="/data-rights" className="text-[#061e1a] hover:text-[#00D1C1] font-medium transition underline">Data Subject Rights Request guide</Link>, or contact us directly at <a href="mailto:dpo@oriyoninternational.com" className="text-[#061e1a] hover:text-[#00D1C1] font-medium transition underline">dpo@oriyoninternational.com</a>. If you wish to file a formal privacy complaint or grievance, please visit our <Link href="/complaints" className="text-[#061e1a] hover:text-[#00D1C1] font-semibold transition underline">Grievance & Complaints page</Link>.
              </p>
            </section>

            {/* 11. Data Security */}
            <section id="data-security" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                11. Data Security
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                We implement appropriate technical and organisational measures to protect personal data against unauthorised access, loss, or misuse. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            {/* 12. Children’s Data */}
            <section id="childrens-data" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                12. Children’s Data
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                The Site is not directed at children under 16, and we do not knowingly collect personal data from them without appropriate parental/guardian consent in the context of youth-focused programme participation.
              </p>
            </section>

            {/* 13. Changes to This Policy */}
            <section id="changes" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                13. Changes to This Policy
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                We may update this Privacy Policy from time to time. The “Last updated” date at the top reflects the most recent revision. Material changes will be communicated via the Site or direct notice where appropriate.
              </p>
            </section>

            {/* 14. Contact Us */}
            <section id="contact-us" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                14. Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                If you have questions about this Privacy Policy or how we handle your data, contact:
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-sm text-gray-600 space-y-2">
                <p><strong>Company:</strong> Oriyon International Limited</p>
                <p><strong>Email:</strong> <a href="mailto:dpo@oriyoninternational.com" className="text-[#061e1a] hover:text-[#00D1C1] font-semibold transition">dpo@oriyoninternational.com</a> (Data Protection Officer)</p>
                <p><strong>Address:</strong> Suite B5 Oando Mega Plaza, Gaduwa, Abuja FCT, Nigeria</p>
              </div>
            </section>

          </article>
        </div>
      </div>
    </div>
  );
}
