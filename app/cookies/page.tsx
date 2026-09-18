"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const SECTIONS = [
  { id: "covers", title: "1. What This Notice Covers" },
  { id: "what-are-cookies", title: "2. What Are Cookies?" },
  { id: "types-of-cookies", title: "3. Types of Cookies We Use" },
  { id: "third-party-cookies", title: "4. Third-Party Cookies" },
  { id: "how-we-use", title: "5. How We Use Cookies" },
  { id: "managing-preferences", title: "6. Managing Your Cookie Preferences" },
  { id: "do-not-track", title: "7. Do Not Track" },
  { id: "changes", title: "8. Changes to This Notice" },
  { id: "contact-us", title: "9. Contact Us" },
];

export default function CookieNoticePage() {
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
              Cookie Notice
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              This notice describes how we use cookies and tracking technologies to optimize your experience on our website.
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
            
            {/* 1. What This Notice Covers */}
            <section id="covers" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                1. What This Notice Covers
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                This Cookie Notice explains how Oriyon International Limited (“Oriyon,” “we,” “us,” “our”) uses cookies and similar tracking technologies on <Link href="/" className="text-[#061e1a] hover:text-[#00D1C1] underline transition">www.oriyoninternational.com</Link> (the “Site”). It should be read alongside our <Link href="/privacy" className="text-[#061e1a] hover:text-[#00D1C1] font-semibold transition underline">Privacy Policy</Link>.
              </p>
            </section>

            {/* 2. What Are Cookies? */}
            <section id="what-are-cookies" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                2. What Are Cookies?
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                Cookies are small text files placed on your device when you visit a website. They help the website function properly, remember your preferences, and provide insight into how the site is used. Similar technologies include pixels, web beacons, and local storage.
              </p>
            </section>

            {/* 3. Types of Cookies We Use */}
            <section id="types-of-cookies" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                3. Types of Cookies We Use
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6 text-sm md:text-base">
                We use the following types of cookies to run and improve our Site:
              </p>
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="min-w-full divide-y divide-gray-100 text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">Type</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">Purpose</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Can Be Disabled?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white text-xs md:text-sm text-gray-600">
                    <tr>
                      <td className="px-4 py-3.5 font-semibold text-[#061e1a]">Strictly Necessary</td>
                      <td className="px-4 py-3.5">Required for core Site functionality, such as navigation, security, and load balancing.</td>
                      <td className="px-4 py-3.5 text-red-500 font-medium">No — essential for the Site to work</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 font-semibold text-[#061e1a]">Performance/Analytics</td>
                      <td className="px-4 py-3.5">Help us understand how visitors use the Site (e.g., pages visited, time on page) so we can improve content and usability.</td>
                      <td className="px-4 py-3.5 text-green-500 font-medium">Yes</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 font-semibold text-[#061e1a]">Functionality</td>
                      <td className="px-4 py-3.5">Remember choices you make (e.g., language, region) to provide a more personalised experience.</td>
                      <td className="px-4 py-3.5 text-green-500 font-medium">Yes</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 font-semibold text-[#061e1a]">Marketing/Communication</td>
                      <td className="px-4 py-3.5">Support features such as the WhatsApp “Send a message” widget and may track engagement with outbound communications.</td>
                      <td className="px-4 py-3.5 text-green-500 font-medium">Yes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. Third-Party Cookies */}
            <section id="third-party-cookies" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                4. Third-Party Cookies
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                Some cookies may be placed by third-party services we use to operate the Site, such as analytics providers, hosting infrastructure, or messaging tools (e.g., WhatsApp Business). These third parties may set their own cookies subject to their own privacy and cookie policies.
              </p>
            </section>

            {/* 5. How We Use Cookies */}
            <section id="how-we-use" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                5. How We Use Cookies
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                We use cookies to:
              </p>
              <ul className="list-disc pl-5 text-gray-600 space-y-2 text-sm md:text-base">
                <li>Keep the Site secure and functioning correctly</li>
                <li>Understand how visitors navigate and use the Site</li>
                <li>Improve Site content, structure, and EEWYLA programme communications</li>
                <li>Enable the “Send a message” / WhatsApp contact functionality</li>
                <li>Measure the effectiveness of our outreach and marketing content</li>
              </ul>
            </section>

            {/* 6. Managing Your Cookie Preferences */}
            <section id="managing-preferences" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                6. Managing Your Cookie Preferences
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                You can control or disable cookies through:
              </p>
              <ul className="list-disc pl-5 text-gray-600 space-y-3 text-sm md:text-base">
                <li>
                  <strong>Your browser settings:</strong> Most browsers allow you to block or delete cookies via their settings menu. Note that disabling strictly necessary cookies may affect Site functionality.
                </li>
                <li>
                  <strong>Cookie banner/consent tool:</strong> Where available on the Site, you can adjust your preferences for non-essential cookies at any time.
                </li>
              </ul>
            </section>

            {/* 7. Do Not Track */}
            <section id="do-not-track" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                7. Do Not Track
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                Some browsers offer a “Do Not Track” signal. As there is no universal industry standard for responding to such signals, the Site does not currently respond to them differently from standard browser settings.
              </p>
            </section>

            {/* 8. Changes to This Notice */}
            <section id="changes" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                8. Changes to This Notice
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                We may update this Cookie Notice from time to time to reflect changes in technology, regulation, or our practices. The “Last updated” date above reflects the most recent revision.
              </p>
            </section>

            {/* 9. Contact Us */}
            <section id="contact-us" className="mb-12 scroll-mt-28">
              <h2 className="text-xl md:text-2xl font-bold text-[#061e1a] mb-4 border-b border-gray-100 pb-2">
                9. Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                If you have questions about our use of cookies, contact:
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-sm text-gray-600 space-y-2">
                <p><strong>Company:</strong> Oriyon International Limited</p>
                <p><strong>Email:</strong> <a href="mailto:dpo@oriyoninternational.com" className="text-[#061e1a] hover:text-[#00D1C1] font-semibold transition">dpo@oriyoninternational.com</a></p>
                <p><strong>Address:</strong> Suite B5 Oando Mega Plaza, Gaduwa, Abuja FCT, Nigeria</p>
              </div>
            </section>

          </article>
        </div>
      </div>
    </div>
  );
}
