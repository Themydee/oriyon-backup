"use client"; 

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const stages = [
  {
    num: "01",
    stage: "ORGANISE",
    title: "1. We Organise",
    subtitle: "Structuring producers into connected local clusters",
    image: "/about/livestock.jpg",
    icon: "/about/turn.png",
    paragraphs: [
      "We help bring smallholder livestock producers and aspiring entrepreneurs into structured cooperatives, producer networks and organised local clusters.",
      "Through onboarding and data collection, we begin to understand who is producing, what they produce, where they are located and what support they need. This creates the foundation for coordinated production, access to services and participation in formal markets.",
      "As Oriyon expands into each state, we are working towards establishing organised cooperative clusters across every Local Government Area (LGA), creating a connected network of producers that can access support, share opportunities and participate in larger commercial value chains."
    ],
    highlights: [
      "Structured LGA Cooperative Clusters",
      "Producer Data Collection & Profiling",
      "Foundation for Coordinated Production"
    ]
  },
  {
    num: "02",
    stage: "TRAIN",
    title: "2. We Train",
    subtitle: "Turning participants into capable livestock entrepreneurs",
    image: "/about/training.jpg",
    icon: "/about/teach.png",
    paragraphs: [
      "Through EEWYLA — Economic Empowerment of Women and Youth in Livestock Agriculture — we provide structured training designed to turn participants into capable livestock entrepreneurs.",
      "The programme combines theory, practical learning, enterprise development and mentorship, with training delivered through institutional partnerships. In Oyo State, the programme was formally launched at Ladoke Akintola University of Technology (LAUTECH), Ogbomoso, with the Faculty of Agricultural Sciences serving as host institution and technical delivery partner.",
      "EEWYLA is not just another training programme. Participants do not simply complete a course and leave with a certificate. With the support of Oriyon’s financial institution partnerships and wider ecosystem partners, participants enter as trainees and are supported to emerge as beneficiaries, livestock entrepreneurs or small business owners."
    ],
    pathway: [
      { label: "TRAINEE", desc: "Structured learning & mentorship" },
      { label: "BENEFICIARY", desc: "Ecosystem & partner support" },
      { label: "ENTREPRENEUR", desc: "Connected enterprise creation" },
      { label: "BUSINESS OWNER", desc: "Sustainable commercial operation" }
    ],
    highlights: [
      "LAUTECH Academic & Technical Delivery Partner",
      "Connected to Finance, Inputs & Markets",
      "Clear Pathway to Business Ownership"
    ]
  },
  {
    num: "03",
    stage: "PRODUCE",
    title: "3. We Enable Production",
    subtitle: "Connecting training to viable livestock enterprise",
    image: "/about/goats.png",
    icon: "/about/cow.png",
    paragraphs: [
      "Training becomes meaningful when it leads to productive enterprise.",
      "Oriyon works with producers to promote better breeding, husbandry, feeding, animal health, biosecurity and record-keeping practices, while connecting them to the inputs, technical support, financial opportunities and enterprise pathways required to build viable livestock businesses.",
      "Our immediate focus is on small ruminants, particularly goats and sheep, while our wider ecosystem is designed to support the development of Nigeria’s livestock value chain."
    ],
    highlights: [
      "Breeding, Husbandry & Biosecurity Standards",
      "Immediate Focus on Goats & Sheep",
      "Input & Veterinary Support Networks"
    ]
  },
  {
    num: "04",
    stage: "AGGREGATE",
    title: "4. We Aggregate",
    subtitle: "Creating scale for institutional and commercial demand",
    image: "/about/pen.png",
    icon: "/about/basket.png",
    paragraphs: [
      "Individual farmers often struggle to meet the volume, consistency, quality and traceability requirements of serious buyers.",
      "Oriyon brings producers together through cooperatives and aggregation networks, creating the scale required to serve institutional and commercial markets.",
      "Through organised clusters established across the LGAs in the states where we operate, producers can work collectively, coordinate supply, access shared services and participate in larger commercial opportunities. Animals can be checked, documented and traced through the value chain, giving buyers greater confidence in provenance and quality."
    ],
    highlights: [
      "LGA Aggregation Networks",
      "Volume, Quality & Traceability Assurance",
      "Shared Infrastructure & Cooperative Scale"
    ]
  },
  {
    num: "05",
    stage: "TRADE",
    title: "5. We Connect Producers to Markets",
    subtitle: "Direct commercial pathways and value-added infrastructure",
    image: "/about/market.jpg",
    icon: "/about/basket.png",
    paragraphs: [
      "We are building direct commercial pathways between producers and credible buyers.",
      "Rather than leaving farmers dependent on fragmented spot markets and multiple layers of intermediaries, Oriyon is developing structured offtake relationships and market-linkage mechanisms that can give producers clearer demand signals and create more predictable routes to market.",
      "Oriyon is also developing integrated livestock and processing infrastructure — including facilities for meat, dairy and other livestock by-products, alongside logistics and value-chain services. These initiatives are being progressed through prospective partnerships and PPP structures to create a circular livestock economy."
    ],
    highlights: [
      "Structured Offtake Relationships",
      "Integrated Meat & Dairy Processing Plans",
      "Circular Economy & Value-Chain Expansion"
    ]
  }
];

const Model = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="five-stages" className="w-full bg-[#002d25] py-20 md:py-28 px-6 font-sora text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-block px-4 py-1.5 bg-[#00D1C1]/20 border border-[#00D1C1]/40 text-[#00D1C1] text-xs font-black rounded-full uppercase tracking-widest">
            OUR ECOSYSTEM MODEL
          </span>
          <h2 className="text-3xl md:text-5xl font-black leading-tight text-white">
            Connecting Five Critical Stages
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-light">
            Our integrated approach brings together people, knowledge, technology, and market pathways to transform smallholders into commercial enterprise owners.
          </p>
        </div>

        {/* Stage Progress Bar / Flow Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-16 max-w-4xl mx-auto">
          {stages.map((stg, index) => {
            const isActive = activeTab === index;
            return (
              <div key={stg.stage} className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab(index)}
                  className={`px-4 md:px-6 py-3 rounded-2xl text-xs md:text-sm font-black transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
                    isActive
                      ? "bg-[#00D1C1] text-[#002d25] scale-105 ring-2 ring-[#00D1C1]/50"
                      : "bg-[#003d38] text-slate-300 hover:bg-[#005a5a] hover:text-white"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isActive ? "bg-[#002d25] text-[#00D1C1]" : "bg-white/10 text-white"
                  }`}>
                    {stg.num}
                  </span>
                  {stg.stage}
                </button>
                {index < stages.length - 1 && (
                  <span className="text-slate-500 font-bold hidden sm:inline text-xs">→</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Stage Detail Card */}
        <div className="bg-gradient-to-br from-[#003d38] via-[#004a44] to-[#003430] border border-white/10 rounded-3xl p-8 md:p-14 shadow-2xl transition-all duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 bg-[#00D1C1]/20 text-[#00D1C1] text-xs font-black rounded-lg uppercase tracking-wider">
                  STAGE {stages[activeTab].num} OF 05
                </span>
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                  {stages[activeTab].stage}
                </span>
              </div>

              <h3 className="text-2xl md:text-4xl font-black text-white leading-tight">
                {stages[activeTab].title}
              </h3>
              <p className="text-[#00D1C1] font-semibold text-sm md:text-base">
                {stages[activeTab].subtitle}
              </p>

              <div className="space-y-4 text-slate-200 text-sm md:text-base leading-relaxed font-light">
                {stages[activeTab].paragraphs.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}
              </div>

              {/* Pathway Flow Diagram for Stage 2 (TRAIN) */}
              {stages[activeTab].pathway && (
                <div className="pt-4 border-t border-white/10">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#00D1C1] mb-3 block">
                    EEWYLA PARTICIPANT PATHWAY
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {stages[activeTab].pathway.map((pw, pwIdx) => (
                      <div key={pw.label} className="bg-[#002d25]/80 border border-white/10 rounded-xl p-3 text-center space-y-1">
                        <div className="text-[#00D1C1] font-black text-xs">{pw.label}</div>
                        <div className="text-[10px] text-slate-300 font-medium leading-tight">{pw.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bullet Highlights */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                {stages[activeTab].highlights.map((hl, hlIdx) => (
                  <div key={hlIdx} className="flex items-center gap-3 text-xs md:text-sm font-semibold text-slate-100">
                    <span className="w-2 h-2 rounded-full bg-[#00D1C1]" />
                    {hl}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Media Column */}
            <div className="lg:col-span-5 relative">
              <div className="relative h-[340px] md:h-[420px] w-full rounded-3xl overflow-hidden border border-white/15 shadow-2xl group">
                <Image
                  src={stages[activeTab].image}
                  alt={stages[activeTab].title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#002d25]/90 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00D1C1] flex items-center justify-center text-[#002d25] font-black text-lg flex-shrink-0">
                    {stages[activeTab].num}
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-black uppercase">{stages[activeTab].stage} STAGE</h4>
                    <p className="text-slate-300 text-xs font-medium">Oriyon Livestock Ecosystem</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Action Button */}
        <div className="mt-16 text-center">
          <Link
            href="/apply" 
            className="inline-block bg-[#00D1C1] hover:bg-emerald-400 text-[#002d25] font-black py-4 px-10 rounded-full transition-all duration-300 uppercase tracking-widest text-xs shadow-2xl hover:-translate-y-1"
          >
            Become a Part of the Ecosystem →
          </Link>
        </div>

      </div>
    </section>
  );
};

export default Model;