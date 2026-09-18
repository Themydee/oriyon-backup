import Image from "next/image";

const ProblemSection = () => {
  const problems = [
    "Farmers operate alone and remain small",
    "Access to proper training and standards is limited",
    "Prices are controlled by middlemen.",
    "Livestock cannot be traced for premium or export markets",
  ];

  return (
    <section className="bg-[#f4f9f9] py-16 md:py-24 px-6 font-sora">
      <div className="max-w-7xl mx-auto">

        <div className="mb-12 md:mb-16">
          <span className="inline-block px-4 py-2 md:py-3 rounded-lg md:rounded-full border border-[#d4bc93] bg-[#fff9eb] text-[#8a7a5f] text-xs font-bold uppercase mb-6 md:mb-4">
            The Problem
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-[#002d25] leading-[1.15]">
            Why the livestock <br className="hidden md:block" /> system isn’t working
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 items-stretch">

          <div className="relative aspect-square md:h-full rounded-[2rem] overflow-hidden shadow-lg">
            <Image
              src="/home/problem.png"
              alt="Portrait of goats"
              fill
              className="object-cover"
              priority
            />
          </div>

      
          <div className="bg-[#0b211e] rounded-[2rem] p-8 md:p-12 lg:p-16 flex flex-col justify-center shadow-xl">
            <ul className="space-y-10 md:space-y-12">
              {problems.map((text, index) => (
                <li key={index} className="flex items-center gap-6 group">
                  <div className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-xl md:text-2xl ${
                    index % 2 !== 0 
                      ? "bg-[#00D1C1] text-black"
                      : "bg-white text-[#0b211e]"
                  }`}>
                    {index + 1}
                  </div>
                  <p className="text-white text-lg md:text-xl font-medium leading-tight opacity-90">
                    {text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;