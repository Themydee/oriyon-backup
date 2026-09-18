import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const services = [
  {
    title: "Breeding Contract",
    time: "1 hr | Available Upon Request",
    description: "Breeding Contract Service. Unlock the Potential of Your Livestock with Our Breeding Contract Service",
    image: "/about/breeding.png", 
  },
  {
    title: "Farm 'Health Check' Consultation",
    time: "4 hrs | Available Upon Request",
    description: "A comprehensive on-site assessment of your farm's overall health and efficiency.",
    image: "/about/health.png",
  },
  {
    title: "Farm 'Set-Up' Service",
    time: "1 hr | Available Upon Request",
    description: "Start your farm on the right track with our end-to-end farm set-up solutions. From site evaluation and infrastructure design to livestock sourcing",
    image: "/about/setup.png",
  },
  {
    title: "Veterinary Consultation",
    time: "1 hr | Available Upon Request",
    description: "Ensure the health and well-being of your livestock with expert veterinary care. Our consultations include diagnosis and treatment plans.",
    image: "/about/vet.jpg",
  }
];

const FarmServices = () => {
  return (
    <section className="bg-[#064242] py-24 px-6 relative overflow-hidden font-sora">
      
      <div className="absolute top-0 left-40 w-70 h-70 opacity-70 pointer-events-none">
        <Image src="/about/greenSubtract.png" alt="" fill className="object-contain" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-16">
          Farm services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="bg-[#005a5a] rounded-[2.5rem] p-8 lg:p-10 flex flex-col h-full shadow-2xl transition-transform hover:-translate-y-2"
            >
              <div className="relative h-80 w-full rounded-[1.5rem] overflow-hidden mb-8">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover object-center"
                />
              </div>

              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-white mb-4">
                  {service.title}
                </h3>
                
                <div className="flex items-center gap-2 text-white/90 text-sm mb-6 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {service.time}
                </div>

                <p className="text-white/80 leading-relaxed text-base mb-10 font-light">
                  {service.description}
                </p>
              </div>

              <Link href="/contact" className="w-full py-4 bg-[#f1fdfd] text-[#064242] font-black rounded-full hover:bg-white transition-all uppercase tracking-widest text-xs text-center">
                Book
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FarmServices;