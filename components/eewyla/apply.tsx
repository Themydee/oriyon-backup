import Image from 'next/image';

const who = [
  { name: "women", src: "/eewyla/women.jpg" },
  { name: "Youth", src: "/eewyla/youth.jpg" },
  { name: "Smallholder livestock producers", src: "/eewyla/small.jpeg" },
  { name: "Cooperative members", src: "/eewyla/coop.jpeg" },
];

const Apply = () => {
  return (
    <section className="py-16 md:py-24 px-6 bg-[#F8FCFC] font-sora">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-black text-[#002d25] mb-10 md:mb-16 tracking-tight text-left md:text-center">
          Who should apply
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {who.map((person, i) => (
            <div key={i} className="relative h-[220px] md:h-[380px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group">
              <Image 
                src={person.src} 
                alt={person.name} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                sizes="(max-w-768px) 50vw, 25vw"
              />
              
              <div className="absolute bottom-0 left-0 w-full h-1/4 bg-black/60  transition-opacity duration-300" />

              <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 text-left">
                <p className="text-white text-xs md:text-lg font-bold leading-tight">
                  {person.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-20">
          <button className="w-full md:w-auto bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] font-black py-4 md:py-4 px-10 rounded-full transition-all shadow-lg uppercase tracking-wider text-[10px] md:text-sm">
            Apply for EEWYLA Training
          </button>
        </div>
      </div>
    </section>
  );
};

export default Apply;