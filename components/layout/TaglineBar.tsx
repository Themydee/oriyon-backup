import Image from "next/image";

const TaglineBar = () => {
  return (
    <div className="static flex flex-wrap justify-center sm:justify-between items-center select-none gap-2 sm:gap-3 md:gap-5 w-full px-2 sm:px-4 md:px-80 py-3 sm:py-4 md:py-6 bg-[#061e1a]">
      <span className="text-xs sm:text-sm md:text-2xl lg:text-5xl font-black text-[#00CDCA] uppercase tracking-tight whitespace-nowrap">
        Trace it
      </span>
      
      <div className="relative w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-15 lg:h-15 opacity-60 flex-shrink-0">
        <Image src="/home/Subtract.png" alt="Icon" fill className="object-contain" />
      </div>

      <span className="text-xs sm:text-sm md:text-2xl lg:text-5xl font-black text-[#004242] uppercase tracking-tight whitespace-nowrap">
        Track it
      </span>

      <div className="relative w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-15 lg:h-15 opacity-60 flex-shrink-0">
        <Image src="/home/Subtract.png" alt="Icon" fill className="object-contain" />
      </div>

      <span className="text-xs sm:text-sm md:text-2xl lg:text-5xl font-black text-[#00CDCA] uppercase tracking-tight whitespace-nowrap">
        Trust it
      </span>

      <div className="relative w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-15 lg:h-15 opacity-60 flex-shrink-0">
        <Image src="/home/Subtract.png" alt="Icon" fill className="object-contain" />
      </div>

      <span className="text-xs sm:text-sm md:text-2xl lg:text-5xl font-black text-[#004242] uppercase tracking-tight whitespace-nowrap">
        Trade it
      </span>
    </div>
  );
};

export default TaglineBar;