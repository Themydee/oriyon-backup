"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "about", title: "2. About Oriyon" },
  { id: "eligibility", title: "3. Eligibility" },
  { id: "use-of-site", title: "4. Use of the Site" },
  { id: "programme-participation", title: "5. EEWYLA and Programme Participation" },
  { id: "intellectual-property", title: "6. Intellectual Property" },
  { id: "third-party-links", title: "7. Third-Party Links & Partners" },
  { id: "disclaimers", title: "8. Disclaimers" },
  { id: "liability", title: "9. Limitation of Liability" },
  { id: "indemnity", title: "10. Indemnity" },
  { id: "privacy", title: "11. Privacy and Cookies" },
  { id: "governing-law", title: "12. Governing Law & Jurisdiction" },
  { id: "changes", title: "13. Changes to These Terms" },
  { id: "termination", title: "14. Termination" },
  { id: "contact-us", title: "15. Contact Us" },
];

export default function TermsOfUsePage() {
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
              Terms of Use
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Please read these Terms of Use carefully before using our website. By accessing our services, you agree to comply with them.
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
            
            {/* 1. Acceptance of Terms */}
            <section id="acceptance" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                These Terms of Use (“Terms”) govern your access to and use of <Link href="/" className="text-[#061e1a] hover:text-[#00D1C1] underline transition">www.oriyoninternational.com</Link> (the “Site”), operated by Oriyon International Limited (“Oriyon,” “we,” “us,” “our”). By accessing or using the Site, you agree to be bound by these Terms. If you do not agree, please do not use the Site.
              </p>
            </section>

            {/* 2. About Oriyon */}
            <section id="about" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                2. About Oriyon
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                Oriyon International Limited is an agricultural production and aggregation company registered in Nigeria and the United Kingdom, delivering programmes including EEWYLA, a cooperative initiative fostering growth, leadership, and lasting impact for women and youth in agriculture across Africa. Oriyon operates as an associate company within the wider Rumer/IrisSmart Technologies ecosystem.
              </p>
            </section>

            {/* 3. Eligibility */}
            <section id="eligibility" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                3. Eligibility
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                The Site and its content are intended for users aged 18 or over, or for younger users participating in youth-focused programmes under appropriate guardian or institutional supervision. By using the Site, you confirm you meet this requirement or are accessing it through an authorised programme channel.
              </p>
            </section>

            {/* 4. Use of the Site */}
            <section id="use-of-site" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                4. Use of the Site
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                You agree to use the Site only for lawful purposes. You must not:
              </p>
              <ul className="list-disc pl-5 text-gray-600 space-y-2 text-sm md:text-base">
                <li>Use the Site in any way that breaches applicable local, national, or international law</li>
                <li>Attempt to gain unauthorised access to the Site, our servers, or any connected systems</li>
                <li>Introduce viruses, malware, or other harmful material</li>
                <li>Scrape, copy, or reproduce Site content for commercial purposes without our written consent</li>
                <li>Impersonate any person or misrepresent your affiliation with Oriyon, EEWYLA, or any partner organisation</li>
              </ul>
            </section>

            {/* 5. EEWYLA and Programme Participation */}
            <section id="programme-participation" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                5. EEWYLA and Programme Participation
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                Registration for EEWYLA or other Oriyon programmes — including submissions made via the “Join a Cooperative” page — is subject to separate programme terms and eligibility criteria communicated during onboarding. Submission of an interest form, early access registration, or cooperative application does not guarantee acceptance into a cooperative cluster. Oriyon reserves the right to verify, accept, or decline applications at its discretion.
              </p>
            </section>

            {/* 6. Intellectual Property */}
            <section id="intellectual-property" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                6. Intellectual Property
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                All content on the Site — including text, graphics, logos, the Oriyon and EEWYLA brand marks, images, and design — is the property of Oriyon International Limited or its licensors and is protected by applicable intellectual property laws. You may view and download content for personal, non-commercial use only. No other use is permitted without our prior written consent.
              </p>
            </section>

            {/* 7. Third-Party Links & Partners */}
            <section id="third-party-links" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                7. Third-Party Links & Partners
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                The Site may reference or link to third-party organisations, including government bodies (e.g., FMLD), development partners (e.g., AfDB), technical partners (e.g., ILRI), and financial institutions. We do not control these third parties and are not responsible for their content, policies, or conduct. Engagement with any linked third party is at your own discretion.
              </p>
            </section>

            {/* 8. Disclaimers */}
            <section id="disclaimers" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                8. Disclaimers
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                The Site and its content are provided “as is” and “as available” without warranties of any kind, express or implied, including but not limited to accuracy, completeness, or fitness for a particular purpose. While we strive to keep information current, Oriyon does not guarantee that Site content is free of errors or omissions.
              </p>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base font-medium">
                Nothing on the Site constitutes financial, legal, or investment advice. Any projections, figures, or programme outcomes referenced are illustrative and not guaranteed.
              </p>
            </section>

            {/* 9. Limitation of Liability */}
            <section id="liability" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                9. Limitation of Liability
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                To the fullest extent permitted by law, Oriyon International Limited shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of, or inability to use, the Site, including loss of data, revenue, or business opportunity.
              </p>
            </section>

            {/* 10. Indemnity */}
            <section id="indemnity" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                10. Indemnity
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                You agree to indemnify and hold Oriyon, its directors, employees, and affiliates harmless from any claims, damages, or expenses arising from your misuse of the Site or breach of these Terms.
              </p>
            </section>

            {/* 11. Privacy and Cookies */}
            <section id="privacy" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                11. Privacy and Cookies
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                Your use of the Site is also governed by our <Link href="/privacy" className="text-[#061e1a] hover:text-[#00D1C1] font-semibold transition underline">Privacy Policy</Link> and <Link href="/cookies" className="text-[#061e1a] hover:text-[#00D1C1] font-semibold transition underline">Cookie Notice</Link>, which form part of these Terms by reference.
              </p>
            </section>

            {/* 12. Governing Law & Jurisdiction */}
            <section id="governing-law" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                12. Governing Law & Jurisdiction
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                These Terms are governed by the laws of the Federal Republic of Nigeria. Where you access the Site from the United Kingdom or another jurisdiction, applicable local consumer protection laws may also apply and are not excluded by these Terms. Any disputes shall be subject to the non-exclusive jurisdiction of the courts of Nigeria, save where mandatory local law provides otherwise.
              </p>
            </section>

            {/* 13. Changes to These Terms */}
            <section id="changes" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                13. Changes to These Terms
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                We may revise these Terms at any time. Continued use of the Site after changes are posted constitutes acceptance of the revised Terms. The “Last updated” date reflects the most recent revision.
              </p>
            </section>

            {/* 14. Termination */}
            <section id="termination" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                14. Termination
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                We reserve the right to restrict or terminate your access to the Site, without notice, if we reasonably believe you have breached these Terms.
              </p>
            </section>

            {/* 15. Contact Us */}
            <section id="contact-us" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                15. Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                For questions about these Terms, contact:
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-sm text-gray-600 space-y-2">
                <p><strong>Company:</strong> Oriyon International Limited</p>
                <p><strong>Email:</strong> <a href="mailto:info@oriyoninternational.com" className="text-[#061e1a] hover:text-[#00D1C1] font-semibold transition">info@oriyoninternational.com</a></p>
                <p><strong>Address:</strong> Suite B5 Oando Mega Plaza, Gaduwa, Abuja FCT, Nigeria</p>
              </div>
            </section>

          </article>
        </div>
      </div>
    </div>
  );
}
