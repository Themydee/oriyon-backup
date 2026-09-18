"use client";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    question: "Who is Oriyon International Limited?",
    answer: "Oriyon International is a vertically integrated agribusiness company transforming Nigeria’s livestock sector through modern production, processing, technology-enabled traceability, and inclusive economic empowerment."
  },
  {
    question: "What problem does Oriyon solve?",
    answer: "Nigeria’s livestock industry is informal and inefficient. Oriyon formalises the value chain, improves quality and trust, and unlocks access to premium local and international markets via their commitment to production standards and exemplary efforts in meeting global compliance regulations."
  },
  {
    question: "What makes Oriyon different?",
    answer: "We operate a vertically integrated, zero-waste model—combining exemplary breeding, processing, logistics, traceability, and market access under one ecosystem."
  },
  {
    question: "Which livestock does Oriyon focus on?",
    answer: "Primarily goats and sheep (small ruminants), due to their fast growth cycles, resilience, and strong domestic and export demand but above all high return on investment."
  },
  {
    question: "How does Oriyon ensure quality and traceability?",
    answer: "Through controlled breeding, veterinary oversight, standardised processes, and digital traceability systems that track livestock from farm to market."
  },
  {
    question: "What is EEWYLA?",
    answer: "EEWYLA is Oriyon’s women and youth empowerment programme, providing training, starter livestock, cooperative support, and access to formal markets."
  },
  {
    question: "Why focus on women and youth?",
    answer: "Because empowering women and youth drives faster economic growth, stronger communities, and long-term food security and financial prosperity."
  },
  {
    question: "Does Oriyon work with governments and partners?",
    answer: "Yes. Oriyon partners with governments, DFIs, research institutions, off-takers, and technology providers through structured PPP and commercial models."
  },
  {
    question: "Is Oriyon open to investors and partners?",
    answer: "Yes. We welcome strategic and impact-aligned partners who share our vision for sustainable livestock transformation."
  },
  {
    question: "Where does oriyon operate?",
    answer: "Oriyon operates in Nigeria, with expansion plans across Africa and into intercontinental markets."
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(4);

  return (
    <section className="py-16 md:py-24 px-6 bg-white font-sora">
  
      <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-10 lg:gap-16">
        
        <div className="lg:col-span-4 text-left">
          <h2 className="text-3xl md:text-5xl font-black md:font-bold text-[#002d25] leading-tight mb-4 md:mb-6">
            Got questions? <br className="hidden md:block" /> We’ve got answers
          </h2>
          <p className="text-gray-500 text-sm md:text-lg mb-8 md:mb-10 max-w-sm md:max-w-none">
            Find the answers to frequently asked questions here.
          </p>
          
          <div className="hidden md:flex items-center gap-2 mb-6 text-[#002d25] font-medium">
            <HelpCircle size={20} className="text-[#00D1C1]" />
            <span>Need further support?</span>
          </div>
          
          <Link 
            href="/contact" 
            className="inline-block bg-[#00D1C1] text-[#002d25] font-black md:font-bold py-3 md:py-4 px-8 md:px-10 rounded-full hover:bg-[#00b8aa] transition-all shadow-md text-sm md:text-base"
          >
            Contact Us
          </Link>
        </div>

        {/* Right Column: Accordion List */}
        <div className="lg:col-span-8 space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index}
                className={`border rounded-2xl transition-all duration-300 ${
                  isOpen ? 'border-[#002d25] shadow-lg' : 'border-gray-100 shadow-sm'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none"
                >
                  <span className={`text-base md:text-xl font-black md:font-bold pr-4 ${isOpen ? 'text-[#002d25]' : 'text-[#002d25]'}`}>
                    {faq.question}
                  </span>
                  
                  <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOpen ? 'bg-[#c5ae86] rotate-180 text-white shadow-inner' : 'bg-[#c5ac69] text-[#002d25]'
                  }`}>
                    <ChevronDown size={24} />
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-5 md:px-6 pb-6 md:pb-8 text-gray-500 md:text-gray-600 text-sm md:text-lg leading-relaxed font-medium">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FAQ;