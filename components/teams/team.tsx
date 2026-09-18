import Image from 'next/image';

const teamMembers = [
  { name: "Amina Momoh-Orimoloye", role: "CEO/Founder", image: "/about/amina.png" },
  { name: "Tolu Animashaun", role: "COO", image: "/about/tolu.png" },
  {name: "Khadijah Muhammed Ibrahim Esq.", role: "CMO/Business Developent Officer", image: "/about/cmo.png"},
   { name: "Williams Tomita", role: "Product Development Lead", image: "/about/tomita.png" },
  { name: "Dr Hammed Shittu", role: "Lead Animal Scientist", image: "/about/shittu.png" },
  { name: "Temidayo Akanbi-Bello", role: "Full Stack Engineer", image: "/about/temidayo.png" },
  { name: "Gbenga Adekunle", role: "Backend Engineer", image: "/about/gbenga.png" },
  { name: "Victor Adameji", role: "Backend Engineer", image: "/about/victor.png" },
  { name: "Ebun Teller", role: "Product Manager", image: "/about/ebun.png" },
  { name: "Peace Ojo", role: "UI/UX Designer", image: "/about/peace.png" },
  { name: "David Daramola", role: "UI/UX Designer", image: "/about/david.png" },
];

const Team = () => {
  return (
    <section className="bg-[#0E2323] py-16 md:py-24 px-6 relative overflow-hidden font-sora">
      
      <div className="absolute top-[30px] right-[-30px] md:top-[90px] md:right-[350px] opacity-50 pointer-events-none md:translate-x-1/4 md:-translate-y-1/4 w-[160px] md:w-[400px]">
        <Image 
          src="/about/greenSubtract.png"
          width={400} 
          height={400} 
          alt="" 
          className="object-contain"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-3xl md:text-5xl font-black md:font-bold text-white mb-10 md:mb-16">
          Meet the team
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {teamMembers.map((member, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="relative h-44 md:h-72 w-full overflow-hidden">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-w-768px) 50vw, 25vw"
                />
              </div>

              <div className="p-3 md:p-6 bg-[#F8FCFC] flex-grow">
                <h3 className="text-xs md:text-lg font-black text-[#0E2323] leading-tight mb-1">
                  {member.name}
                </h3>
                <p className="text-[10px] md:text-sm font-medium text-gray-500">
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

export default Team;
