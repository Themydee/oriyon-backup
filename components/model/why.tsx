"use client";
import Image from 'next/image';

const reasons = [
  {
    title: "Farmers Earn More",
    description: "Farmers sell their livestock at better prices and earn steady, reliable income",
    image: "/model/farmers.jpg",
    icon: "/model/frm.png", 
  },
  {
    title: "Buyers Get Trusted Supply",
    description: "Buyers receive healthy, well-documented livestock they can trust and plan with.",
    image: "/model/buyer.jpg",
    icon: "/model/sec.png",
  },
  {
    title: "Governments Get Reliable Data",
    description: "Governments have clear data on farmers, livestock numbers, and production for better planning and support.",
    image: "/model/gov.jpg",
    icon: "/model/stc.png",
  },
  {
    title: "The System Can Scale",
    description: "The system can grow to more communities, states, and markets without losing quality.",
    image: "/model/system.jpg",
    icon: "/model/fm.png",
  },
];

const WhyItWorks = () => {
  return (
    <section className="w-full bg-[#004242] py-16 md:py-24 px-6 font-sora">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-12 md:mb-20">
          Why this works
        </h2>

        <div className="space-y-6 md:space-y-8">
          {reasons.map((reason, index) => {
            const imageOnRight = index % 2 === 0;

            return (
              <div 
                key={index} 
                className="bg-[#007c7b] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex flex-col md:flex-row items-center md:gap-10 border border-white/5 shadow-2xl"
              >
                <div className={`w-full md:w-1/2 order-first ${!imageOnRight ? 'md:order-first' : 'md:order-last'}`}>
                  <div className="relative h-56 md:h-80 w-full overflow-hidden rounded-t-[1.5rem] md:rounded-[1.5rem]">
                    <Image 
                      src={reason.image} 
                      alt={reason.title} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className={`w-full md:w-1/2 flex flex-col justify-center p-8 md:p-10 ${imageOnRight ? 'md:order-first' : 'md:order-last'}`}>
                  <div className="relative w-10 h-10 md:w-16 md:h-16 mb-4 md:mb-6">
                    <div className="absolute inset-0 bg-[#E9F3F2] rounded-full p-2">
                       <Image 
                        src={reason.icon} 
                        alt="icon" 
                        fill 
                        className="object-contain p-2" 
                      />
                    </div>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">
                    {reason.title}
                  </h3>
                  <p className="text-white leading-relaxed text-sm md:text-base font-light max-w-md opacity-90">
                    {reason.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 md:mt-16 text-center">
          <button 
            onClick={() => window.open("https://docs.google.com/forms/d/e/1FAIpQLSefpVaNsexrQt6MsffNSaa-0OxpF1SUnP4K-kJELwrhm80wIw/viewform", "_blank")}
            className="w-full md:w-auto bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0E2323] font-black py-4 md:py-4 px-10 rounded-full transition-all shadow-xl uppercase tracking-widest text-[10px] md:text-xs">
            Apply for EEWYLA Training
          </button>
        </div>
      </div>
    </section>
  );
};

export default WhyItWorks;