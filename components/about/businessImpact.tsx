import Image from 'next/image';
import Link from 'next/link';

const ecosystemPartners = [
  { title: "Farmers & Producers", desc: "Organised smallholders & enterprise owners" },
  { title: "Cooperatives & LGAs", desc: "Structured LGA clusters across operating states" },
  { title: "Universities & Research", desc: "LAUTECH Faculty of Agricultural Sciences partner" },
  { title: "Financial & Insurance", desc: "Financing pathways & risk mitigation" },
  { title: "Technology Providers", desc: "Rumer digital commerce & traceability" },
  { title: "Processors & Offtakers", desc: "Commercial buyers & institutional markets" }
];

const BusinessImpactSection = () => {
  return (
    <section className="bg-[#f4f9f9] py-20 md:py-28 px-6 font-sora text-slate-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Main Banner Header */}
        <div className="bg-gradient-to-br from-[#003d38] via-[#005a5a] to-[#002d25] text-white p-8 md:p-14 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            <span className="inline-block px-4 py-1.5 bg-[#00D1C1]/20 border border-[#00D1C1]/40 text-[#00D1C1] text-xs font-black rounded-full uppercase tracking-widest">
              OUR ULTIMATE OBJECTIVE
            </span>
            <h2 className="text-3xl md:text-5xl font-black leading-tight text-white">
              From Training Farmers to Building Businesses
            </h2>
            <p className="text-base md:text-xl font-light text-slate-100 leading-relaxed max-w-3xl mx-auto">
              Our ultimate objective is not to create more livestock farmers who remain small and disconnected. <strong className="text-[#00D1C1] font-bold">It is to create livestock businesses.</strong>
            </p>
            <p className="text-sm md:text-base text-slate-300 max-w-3xl mx-auto font-light">
              Businesses that can access knowledge, inputs, finance, insurance, technology, veterinary and technical services, aggregation networks and reliable markets — while creating opportunities for other businesses and professionals around them.
            </p>
          </div>
        </div>

        {/* Ecosystem Network Grid */}
        <div className="space-y-8 text-center max-w-5xl mx-auto">
          <div className="space-y-3">
            <span className="text-[#003d38] text-xs font-extrabold uppercase tracking-widest block">
              ECOSYSTEM COLLABORATION
            </span>
            <h3 className="text-2xl md:text-4xl font-black text-[#003d38]">
              Working Together Across the Ecosystem
            </h3>
            <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto">
              That is why Oriyon works across the ecosystem with farmers, cooperatives, universities and research institutions, government, financial and insurance partners, technology providers, processors and buyers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {ecosystemPartners.map((item, idx) => (
              <div 
                key={item.title} 
                className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-2"
              >
                <div className="w-8 h-8 rounded-xl bg-[#003d38]/10 text-[#003d38] flex items-center justify-center font-black text-xs">
                  0{idx + 1}
                </div>
                <h4 className="text-base font-black text-[#003d38]">{item.title}</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LGA Cluster Vision Callout */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-left max-w-2xl">
            <span className="px-3.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold rounded-full uppercase tracking-wider">
              LGA COOPERATIVE EXPANSION
            </span>
            <h4 className="text-2xl font-black text-slate-900">
              Expanding Cooperative Clusters Across Every LGA
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed font-normal">
              As Oriyon expands, these cooperative clusters will be developed across every Local Government Area in the states where we operate, creating a structured network through which women, youth and other livestock entrepreneurs can access support, finance, production opportunities and markets.
            </p>
          </div>

          <div className="flex-shrink-0 w-full md:w-auto">
            <Link
              href="/apply"
              className="w-full md:w-auto px-8 py-4 bg-[#003d38] hover:bg-[#002d25] text-white font-extrabold text-xs rounded-full transition-all uppercase tracking-widest shadow-lg inline-block text-center"
            >
              Apply to Join EEWYLA →
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default BusinessImpactSection;
