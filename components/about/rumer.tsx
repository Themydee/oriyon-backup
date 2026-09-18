import Image from 'next/image';

const RumerSection = () => {
  return (
    <section className="bg-gradient-to-br from-[#001c17] via-[#002d25] to-[#003d38] py-20 md:py-28 px-6 font-sora text-white relative overflow-hidden border-t border-white/10">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Visual Column - Rumer Brand Showcase Card */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="relative h-[380px] md:h-[450px] w-full rounded-3xl overflow-hidden border border-[#00D1C1]/30 shadow-2xl bg-gradient-to-br from-[#002d25] via-[#003d38] to-[#001c17] flex flex-col items-center justify-center p-8 text-center group">
              
              {/* Subtle Ambient Background Pattern */}
              {/* <div 
                className="absolute inset-0 opacity-10 pointer-events-none" 
                style={{ 
                  backgroundImage: "url('/about/greenSubtract.png')", 
                  backgroundSize: '160px', 
                  backgroundRepeat: 'repeat' 
                }} 
              /> */}
              
              <div className="absolute top-6 left-6 px-4 py-2 bg-[#00D1C1]/20 backdrop-blur-md border border-[#00D1C1]/40 rounded-full text-[#00D1C1] text-xs font-black uppercase tracking-widest flex items-center gap-2 z-10">
                <span className="w-2 h-2 rounded-full bg-[#00D1C1] animate-ping" />
                TECHNOLOGY LAYER
              </div>

              {/* Centered Rumer Brand Logo Card */}
              <div className="relative z-10 bg-white/95 px-8 py-6 rounded-3xl border border-white/20 shadow-2xl transition-transform duration-500 group-hover:scale-105 max-w-xs w-full flex items-center justify-center">
                <Image
                  src="/about/rummer-green-logo.png"
                  alt="Rumer Platform Logo"
                  width={260}
                  height={65}
                  className="h-12 md:h-14 w-auto object-contain"
                  priority
                />
              </div>

              {/* Card Title & Tagline */}
              <div className="relative z-10 mt-6 space-y-1">
                <div className="text-white text-sm font-black uppercase tracking-wider">Rumer™ Platform</div>
                <div className="text-[#00D1C1] text-xs font-semibold">Traceability & Digital Livestock Commerce</div>
              </div>
            </div>
          </div>

          {/* Right Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left order-1 lg:order-2">
            
            {/* Official Rumer Logo Badge Banner */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2 px-4 py-3 bg-[#00D1C1]/20 border border-[#00D1C1]/40 text-[#00D1C1] text-xs font-black rounded-full uppercase tracking-widest">
                WHERE RUMER FITS IN
              </div>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
              Rumer — Digital Traceability & Livestock Commerce
            </h2>

            <p className="text-slate-200 text-base md:text-lg leading-relaxed font-light">
              Behind the physical livestock ecosystem is <strong className="text-white font-semibold">Rumer</strong> — Oriyon’s technology layer for traceability and digital livestock commerce.
            </p>

            <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed font-light">
              <p>
                Rumer is being developed to help create a trusted digital record of livestock and transactions, connecting provenance, producers, movement and trade across the value chain.
              </p>
              <blockquote className="p-4 bg-[#003d38]/90 border-l-4 border-[#00D1C1] rounded-r-2xl text-slate-100 font-medium italic shadow-lg">
                “The result is simple: a livestock system where you can know where an animal came from, understand its journey and build greater trust around the transaction.”
              </blockquote>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
                <div className="text-[#00D1C1] font-black text-xs uppercase">PROVENANCE</div>
                <div className="text-slate-200 text-xs font-medium">Digital origin & movement history</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
                <div className="text-[#00D1C1] font-black text-xs uppercase">TRANSACTION LOGS</div>
                <div className="text-slate-200 text-xs font-medium">Verified commerce records</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
                <div className="text-[#00D1C1] font-black text-xs uppercase">MARKET TRUST</div>
                <div className="text-slate-200 text-xs font-medium">Traceability for buyers</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default RumerSection;
