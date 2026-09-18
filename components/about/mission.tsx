import Image from 'next/image';

const MissionVision = () => {
  return (
    <section className="bg-[#f4f9f9] py-16 md:py-24 px-6 md:px-16 font-sora">
      <div className="max-w-7xl mx-auto">
        {/* Core Philosophy Banner */}
        <div className="bg-gradient-to-br from-[#002d25] via-[#003d38] to-[#005a5a] text-white p-8 md:p-14 rounded-3xl shadow-xl mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D1C1]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
            <span className="inline-block px-4 py-1.5 bg-[#00D1C1]/20 border border-[#00D1C1]/30 text-[#00D1C1] text-xs font-black rounded-full uppercase tracking-widest">
              OUR CORE PHILOSOPHY
            </span>
            <blockquote className="text-lg md:text-2xl font-bold leading-relaxed text-slate-100 italic">
              “We do not see livestock development as simply putting more animals on more farms. The real opportunity is to build the ecosystem around the farmer — bringing together people, knowledge, production, finance, technology, aggregation, processing and markets so that livestock producers can grow from informal operators into sustainable businesses.”
            </blockquote>
          </div>
        </div>

        {/* Mission & Vision Grid */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 bg-[#003d38] text-white p-8 md:p-14 rounded-3xl flex flex-col justify-center text-center relative overflow-hidden shadow-lg">
            <div className="relative z-10 mb-6">
              <span className="text-[#00D1C1] text-xs font-extrabold uppercase tracking-widest mb-2 block">01 / PURPOSE</span>
              <h2 className="text-2xl md:text-3xl font-black mb-4">Our Mission</h2>
              <p className="text-sm md:text-base leading-relaxed font-light opacity-90 max-w-md mx-auto">
                We help bring smallholder livestock producers and aspiring entrepreneurs into structured cooperatives, producer networks and organised local clusters, connecting them to knowledge, finance, technology, and formal commercial markets.
              </p>
            </div>

            <div className="w-full md:w-1/2 h-[1px] bg-white/20 mx-auto my-6"></div>

            <div className="relative z-10">
              <span className="text-[#00D1C1] text-xs font-extrabold uppercase tracking-widest mb-2 block">02 / AMBITION</span>
              <h2 className="text-2xl md:text-3xl font-black mb-4">Our Vision</h2>
              <p className="text-sm md:text-base leading-relaxed font-light opacity-90 max-w-md mx-auto">
                A more efficient, circular livestock economy in which animals and their by-products create multiple streams of value rather than waste, establishing sustainable livestock businesses across Nigeria.
              </p>
            </div>
          </div>

          <div className="flex-1 relative h-[380px] md:h-auto min-h-[380px] rounded-3xl overflow-hidden shadow-lg border border-slate-200">
            <Image
              src="/about/pen.png" 
              alt="Livestock entrepreneurs working with goats"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionVision;