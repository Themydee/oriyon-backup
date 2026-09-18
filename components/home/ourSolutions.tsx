import Image from "next/image";
import Link from "next/link";

const Solution = () => {
  const listItems = [
    {
      icon: "/home/1.png",
      text: "We organise farmers into structured cooperatives and clusters",
    },
    {
      icon: "/home/2.png",
      text: "We combine training, production, aggregation, and traceability",
    },
    {
      icon: "/home/3.png",
      text: "We connect local producers to serious institutional and export buyers",
    },
  ];

  return (
    <section className="bg-[#004242] py-16 md:py-24 px-6 relative overflow-hidden font-sora">
      <div className="absolute top-[-40px] left-0 w-[300px] h-[300px] opacity-40 pointer-events-none md:top-10 md:left-0 md:translate-x-0 md:w-100 md:h-100">
        <Image src="/home/greenSubtract.png" alt="Africa Map" fill className="object-contain" />
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-12 md:gap-16 items-center relative z-10">

        <div className="lg:col-span-5 w-full">
          <div className="flex justify-start">
           <span className="inline-block px-4 py-2 md:py-3 rounded-lg md:rounded-full border border-[#d4bc93] bg-[#fff9eb] text-[#8a7a5f] text-xs font-bold uppercase mb-6 md:mb-4">
              Our Solutions
          </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white mb-8 md:mb-10 leading-tight text-center lg:text-left">
            What Oriyon does <br className="md:hidden" /> differently
          </h2>

          <div className="bg-[#007c7b]/30 md:bg-[#007c7b] rounded-[30px] md:rounded-[40px] p-5 md:p-10 shadow-2xl border border-white/5">
            <div className="space-y-4 md:space-y-6">
              {listItems.map((item, index) => (
                <div key={index} className="flex items-center gap-4 md:gap-6 bg-[#004242] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 transition hover:bg-[#003d33]">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <Image src={item.icon} alt="icon" width={24} height={24} className="md:w-8 md:h-8" />
                  </div>
                  <p className="text-white font-semibold text-sm md:text-xl leading-snug">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 md:mt-10 flex justify-center lg:justify-start">
              <Link
                href="/model"
                className="w-full md:w-auto text-center px-8 py-4 md:px-10 md:py-5 bg-white text-[#004242] font-black rounded-full hover:bg-gray-100 transition shadow-xl uppercase text-xs md:text-sm"
              >
                Learn How Our Model Works
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 relative flex justify-center items-center h-[400px] md:h-[650px] w-full mt-12 lg:mt-0">
        
          <div className="absolute w-[280px] h-[280px] md:w-[100%] md:h-[600px] pointer-events-none opacity-80">
            <Image src="/home/Ellipse 97.png" alt="Outer Orbit" fill className="object-contain" />
          </div>

          <div className="absolute w-[200px] h-[200px] md:w-[480px] md:h-[480px] pointer-events-none opacity-80">
            <Image src="/home/Ellipse 98.png" alt="Inner Orbit" fill className="object-contain" />
          </div>

          <div className="relative w-full h-full">
            
            <div className="absolute top-[5%] md:top-[0%] left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-16 h-16 md:w-32 md:h-32 rounded-full bg-white flex items-center justify-center shadow-xl">
                <Image src="/home/train.png" width={40} height={40} alt="Train" className="md:w-20 md:h-20" />
              </div>
              <p className="text-white text-[8px] md:text-xs font-bold mt-2 uppercase">We Train</p>
            </div>

            <div className="absolute top-[35%] right-[2%] md:right-0 flex flex-col items-center">
               <div className="w-16 h-16 md:w-32 md:h-32 rounded-full bg-white flex items-center justify-center shadow-xl">
                <Image src="/home/trace.png" width={40} height={40} alt="Trace" className="md:w-20 md:h-20" />
              </div>
              <p className="text-white text-[8px] md:text-xs font-bold mt-2 uppercase">We Trace</p>
            </div>

            <div className="absolute bottom-[5%] md:bottom-0 right-[15%] md:right-[25%] flex flex-col items-center">
               <div className="w-16 h-16 md:w-32 md:h-32 rounded-full bg-white flex items-center justify-center shadow-xl">
                <Image src="/home/track.png" width={40} height={40} alt="Track" className="md:w-20 md:h-20" />
              </div>
              <p className="text-white text-[8px] md:text-xs font-bold mt-2 uppercase">We Track</p>
            </div>

            <div className="absolute bottom-[10%] left-[5%] md:left-[5%] flex flex-col items-center">
               <div className="w-16 h-16 md:w-32 md:h-32 rounded-full bg-white flex items-center justify-center shadow-xl">
                <Image src="/home/trust.png" width={40} height={40} alt="Trust" className="md:w-20 md:h-20" />
              </div>
              <p className="text-white text-[8px] md:text-xs font-bold mt-2 uppercase text-center w-16 md:w-20">We Build Trust</p>
            </div>

            <div className="absolute top-[30%] left-[2%] md:left-[5%] -translate-y-1/2 flex flex-col items-center">
              <div className="w-16 h-16 md:w-32 md:h-32 rounded-full bg-white flex items-center justify-center shadow-xl">
                <Image src="/home/trade.png" width={40} height={40} alt="Trade" className="md:w-20 md:h-20" />
              </div>
              <p className="text-white text-[8px] md:text-xs font-bold mt-2 uppercase text-center w-20 md:w-24">We Enable Trade</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solution;