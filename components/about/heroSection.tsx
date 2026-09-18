import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative min-h-[580px] md:min-h-[640px] w-full flex items-center justify-center overflow-hidden font-sora py-24 md:py-32">
      <Image
        src="/about/we.jpg" 
        alt="Livestock in Africa - Oriyon International"
        fill
        priority 
        className="object-cover object-[center_30%]" 
      />
      
      {/* Dark Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#002d25]/80 via-[#002d25]/75 to-[#001c17]/90 z-10" />
      
      <div className="relative z-20 container mx-auto px-6 text-center text-white mt-10 md:mt-0">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 md:gap-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-[#00D1C1] text-xs md:text-sm font-extrabold rounded-full shadow-2xl uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#00D1C1] animate-pulse" />
            What We Do
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.15] text-white">
            Building the Livestock Ecosystem — <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D1C1] to-emerald-300">From Farmer to Market.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl font-normal text-slate-200 max-w-3xl leading-relaxed opacity-95">
            Oriyon International is building a more organised, productive, traceable and commercially connected livestock sector in Nigeria.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full justify-center">
            <a 
              href="#five-stages" 
              className="w-full sm:w-auto px-8 py-4 bg-[#00D1C1] hover:bg-emerald-400 text-[#002d25] font-extrabold text-sm rounded-full transition-all duration-300 shadow-xl uppercase tracking-widest hover:-translate-y-0.5"
            >
              Explore Our 5-Stage Model
            </a>
            <Link 
              href="/apply" 
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-extrabold text-sm rounded-full transition-all duration-300 uppercase tracking-widest backdrop-blur-sm"
            >
              Apply for EEWYLA
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;