'use client';

import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative h-screen min-h-[600px] w-full flex items-center justify-center overflow-hidden">
      <Image
        src="/home/static.png"
        alt="Livestock in Africa"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-black/40 z-10" />

      <div className="relative z-20 container mx-auto  text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-4xl lg:text-4xl font-bold leading-tight mb-6 tracking-tight">
            Building  <span className="text-[#00D1C1]">traceable</span>, fair, &  <span className="text-[#00D1C1]">globally competitive</span>livestock systems across  <span className="text-[#00D1C1]">Africa</span>
          </h1>

          <p className="text-l md:text-xl text-gray-100 mb-10 leading-relaxed max-w-3xl mx-auto">
            Oriyon International works with farmers, cooperatives, governments, and global partners
            to improve livestock production, training, traceability, and market access
            starting with small ruminants.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/model"
              className="px-8 py-4 bg-[#00D1C1] hover:bg-[#00b8aa] text-black font-semibold rounded-full transition-all transform hover:-translate-y-1"
            >
              Learn How Our Model Works
            </Link>
            <Link
              href="/apply"
              className="px-8 py-4 bg-white hover:bg-gray-100 text-black font-semibold rounded-full transition-all transform hover:-translate-y-1"
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