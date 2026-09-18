'use client';

import React from 'react';
import Image from 'next/image';

const PARTNERS = [
  { name: 'Leadway Assurance', logo: '/eewyla/leadway.jpeg', role: 'Insurance Partner' },
  { name: 'Sterling Bank', logo: '/eewyla/sterling.jpeg', role: 'Financial Custodian' },
  { name: 'FCMB', logo: '/eewyla/fcmb.jpeg', role: 'Banking Network' },
  { name: 'Oriyon International', logo: '/eewyla/oriyon.jpeg', role: 'Strategic Advisory' },
  { name: 'Rumer Solutions', logo: '/eewyla/rumer.jpeg', role: 'Technical Integration' },
];

const Partners = () => {
  return (
    <section className="w-full bg-[#071614] py-24 px-6 border-y border-white/5 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* Left Column: Context & Trust Metrics (Takes up 5/12 cols) */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2">
              <span className="w-8 h-[1px] bg-[#00D1C1]" />
              <p className="text-[11px] font-bold text-[#00D1C1] uppercase tracking-[0.25em]">
                Strategic Alliances
              </p>
            </div>
            <h2 className="text-2xl md:text-4xl font-semibold text-white tracking-tight leading-[1.15]">
              An institutional ecosystem built on trust.
            </h2>
            <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-md">
              We collaborate with foremost financial institutions, insurance providers, and global enterprises to guarantee regulatory compliance, secure transaction pathways, and resilient scale.
            </p>
          </div>

          {/* Micro-Counter / Trust Metric */}
          <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">5/5</p>
              <p className="text-xs text-white/40 mt-1">Tier-1 Verifications</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#00D1C1] tracking-tight">100%</p>
              <p className="text-xs text-white/40 mt-1">Compliant Routing</p>
            </div>
          </div>
        </div>

        {/* Right Column: Structured Layout Cards (Takes up 7/12 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PARTNERS.map((partner, idx) => (
            <div 
              key={partner.name}
              className={`group p-6 rounded-xl border transition-all duration-300 bg-white/[0.01] border-white/5 hover:bg-white/[0.02] hover:border-white/10 ${
                idx === PARTNERS.length - 1 && PARTNERS.length % 2 !== 0 
                  ? 'sm:col-span-2 sm:flex sm:items-center sm:justify-between' 
                  : ''
              }`}
            >
              <div className="flex flex-col gap-4 justify-between h-full">
                {/* Logo Frame */}
                <div className="relative h-8 w-28 opacity-50 grayscale contrast-200 brightness-125 transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-hover:contrast-100 group-hover:brightness-100">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    className="object-contain object-left mix-blend-lighten"
                    sizes="112px"
                  />
                </div>

                {/* Meta text underneath or to the side */}
                <div className={idx === PARTNERS.length - 1 && PARTNERS.length % 2 !== 0 ? 'sm:text-right sm:pt-0 pt-4' : 'pt-2'}>
                  <h3 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                    {partner.name}
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    {partner.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Partners;