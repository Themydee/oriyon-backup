"use client";

import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative h-screen min-h-[500px] w-full flex items-center justify-center overflow-hidden font-sora">
      <Image
        src="/eewyla/eewyla.png"
        alt="EEWYLA hero background"
        fill
        priority
        className="object-cover object-[center_30%]"
      />

      <div className="absolute inset-0 bg-black/60 md:bg-black/50 z-10" />

      <div className="relative z-20 container mx-auto px-6 text-center text-white mt-12 md:mt-0">
        <div className="max-w-4xl mx-auto flex flex-col items-center">

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black md:font-bold leading-tight mb-4 md:mb-6 tracking-tight">
            What is EEWYLA
          </h1>

          <p className="text-base md:text-xl text-white/90 md:text-white mb-10 md:mb-12 leading-relaxed max-w-3xl mx-auto font-medium md:font-normal">
            The Economic Empowerment of Women and Youth in Livestock Agriculture (EEWYLA) is Oriyon’s structured training programme designed to equip participants with the skills, standards, and support required to succeed in the livestock value chain.
          </p>

          <div className="w-full sm:w-auto flex justify-center">
            <Link
              href="/apply"
              className="w-full sm:w-auto px-8 py-5 md:py-4 bg-[#00d1c1] text-[#002d25] font-black md:font-bold rounded-full transition-all transform hover:-translate-y-1 shadow-2xl uppercase tracking-wider text-sm md:text-base"
            >
              Apply for EEWYLA Training
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;