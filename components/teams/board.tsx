import Image from 'next/image';

const boardMembers = [
  { name: "Omamofe Boyo", role: "Board Chairman", image: "/about/boyo.png" },
  { name: "Kyari Bukar", role: "Board Member", image: "/about/kyari.png" },
  { name: "Prof. Eustace Iyayi", role: "Board Member", image: "/about/eustace.png" },
  { name: "Prof. Oyebanji Oyeyinka-Oyelaran", role: "Independent Director", image: "/about/oyebanji.png" },
];

const Board = () => {
  return (
    <section className="bg-white py-16 md:py-24 px-6 relative overflow-hidden w-full font-sora">
      
  
      <div className="absolute top-[20px] right-[-20px] md:top-[90px] md:right-[350px] pointer-events-none md:translate-x-1/4 md:-translate-y-1/4 w-[180px] md:w-[400px]">
        <Image 
          src="/about/darkSubtract.png" 
          width={400} 
          height={400} 
          alt="" 
          className="object-contain"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Responsive Heading */}
        <h2 className="text-3xl md:text-5xl font-black md:font-bold text-[#0E2323] mb-10 md:mb-16">
          Our board
        </h2>

      
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {boardMembers.map((member, index) => (
            <div 
              key={index} 
              className="group flex flex-col h-full rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-[#F8FCFC]"
            >
              <div className="relative h-48 md:h-80 w-full overflow-hidden">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-w-768px) 50vw, 25vw"
                />
              </div>

              {/* Name & Role Area - Compact for mobile */}
              <div className="p-4 md:p-8 flex-grow">
                <h3 className="text-sm md:text-xl font-black text-[#0E2323] leading-tight mb-1 md:mb-2">
                  {member.name}
                </h3>
                <p className="text-[10px] md:text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Board;
