'use client';

import Image from 'next/image';

const Hero = () => {
  return (
    <section className="relative w-full flex items-center justify-center overflow-hidden font-sora" style={{ minHeight: '100vh', height: '100dvh' }}>
      <Image
        src="/contact/contact.jpg" 
        alt="Contact Us hero background"
        fill
        priority 
        className="object-cover object-center scale-200 " 
      />
      
      <div className="absolute inset-0 bg-black/50 md:bg-black/40 z-10" />
      
      <div className="relative z-20 container mx-auto px-6 text-center text-white mt-8 md:mt-0">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 md:gap-8">
          
          <button 
            className="px-6 md:px-8 py-2.5 md:py-4 bg-white text-[#002d25] text-[12px] md:text-base font-bold rounded-full transition-all shadow-xl uppercase tracking-widest"
          >
            Contact Us
          </button>

          <h1 className="text-[34px] md:text-6xl lg:text-7xl font-black md:font-extrabold tracking-tight leading-[1.2] md:leading-tight max-w-[12ch] md:max-w-none mx-auto">
            We’d Love to Hear From You
          </h1>
          
        </div>
      </div>
    </section>
  );
};

export default Hero;