"use client";

import Image from 'next/image';
import Link from 'next/link';

const partners = [
  { name: "Smallholder livestock producers", src: "/home/small.png" },
  { name: "Cooperatives", src: "/home/cooperatives.png" },
  { name: "State and Federal institutions", src: "/home/state.png" },
  { name: "Development partners", src: "/home/dev.png" },
  { name: "Buyers and processors", src: "/home/buyers.png" },
];

const Partners = () => {
  return (
    <section className="py-16 md:py-20 bg-[#F8FCFC] font-sora">
      <div className="mx-auto text-center px-4 md:px-6 max-w-7xl">
        <h2 className="text-3xl md:text-5xl font-black text-[#002d25] mb-10 md:mb-12 tracking-tight text-left md:text-center">
          Who we work with 
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
          {partners.map((person, i) => (
            <div 
              key={i} 
              className={`relative h-[200px] md:h-[380px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group shadow-sm 
                ${i === partners.length - 1 && partners.length % 2 !== 0 ? 'col-span-1 md:col-span-1' : ''}`}
            >
              <Image 
                src={person.src} 
                alt={person.name} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              
              <div className="absolute bottom-0 left-0 w-full h-1/4 bg-black/60  transition-opacity duration-300" />

              <div className="absolute bottom-0 left-0 w-full p-3 md:p-6 text-center">
                <p className="text-white text-xs md:text-lg font-bold leading-tight">
                  {person.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-20">
          <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded-full bg-[#00D1C1] px-6 py-3 font-bold text-black transition hover:bg-[#00b8aa]"
            >
              Apply for EEWYLA Training
            </Link>
        </div>
      </div>
    </section>
  );
};

export default Partners;