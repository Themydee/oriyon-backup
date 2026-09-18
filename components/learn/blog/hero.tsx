'use client';

import Image from 'next/image';

const Hero = () => {
  return (
    <section className="relative h-[55vh] min-h-[380px] md:h-[65vh] md:min-h-[480px] w-full flex items-center justify-center overflow-hidden font-sora">
      <Image
        src="/learn/blog/blog.jpg"
        alt="Oriyon Field Knowledge Hub"
        fill
        priority
        className="object-cover object-center scale-105"
      />
      
      {/* Premium Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#002d25] via-[#002d25]/60 to-black/40 z-10" />
      
      <div className="relative z-20 container mx-auto px-4 sm:px-6 text-center text-white mt-4 md:mt-0">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 sm:gap-5">
          
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-[#00D1C1] text-xs font-black rounded-full shadow-lg uppercase tracking-widest">
            <span>🌿</span> Oriyon Field Knowledge & Market Insights
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight md:leading-tight">
            Insights from the Field
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-200 font-medium max-w-2xl leading-relaxed">
            Empowering livestock producers, women, and youth through digital traceability, cooperative financing, and sustainable herd management in West Africa.
          </p>
          
        </div>
      </div>
    </section>
  );
};

export default Hero;