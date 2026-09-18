'use client';

import Image from 'next/image';

const Hero = () => {
  return (
    <section className="relative h-screen min-h-[500px] w-full flex items-center justify-center overflow-hidden font-sora">
      <Image
        src="/learn/training/hero.png" 
        alt="our Model hero background"
        fill
        priority 
        className="object-cover object-center" 
      />
      
      <div className="absolute inset-0 bg-black/40 md:bg-black/50 z-10" />
      
      <div className="relative z-20 container mx-auto px-6 text-center text-white mt-12 md:mt-0">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 md:gap-8">
          
          <button 
            className="px-6 md:px-8 py-3 md:py-4 bg-white text-[#002d25] text-sm md:text-base font-bold rounded-full transition-all shadow-xl uppercase tracking-wider"
          >
            Learn
          </button>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black md:font-extrabold tracking-tight leading-[1.15] md:leading-tight max-w-[18ch] md:max-w-none">
            Explore Our Learning Pathways
          </h1>
          
        </div>
      </div>
    </section>
  );
};

export default Hero;