'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const trainingSteps = [
  {
    id: 1,
    title: "Selection and onboarding",
    description: "We select qualified farmers and guide them through a simple onboarding process."
  },
  {
    id: 2,
    title: "Online theory modules",
    description: "Farmers learn the basics through easy-to-follow online lessons."
  },
  {
    id: 3,
    title: "Practical training at ILRI / IITA",
    description: "Farmers receive hands-on training from experts at ILRI and IITA facilities."
  },
  {
    id: 4,
    title: "Cooperative Integration",
    description: "Trained farmers are placed into cooperatives to work and grow together."
  },
  {
    id: 5,
    title: "Market linkage",
    description: "Farmers are connected to reliable buyers to sell their livestock."
  }
];

const slides = [
  "/eewyla/training.jpeg",
  "/eewyla/training2.jpg", 
  "/eewyla/training3.jpg",
  "/eewyla/training4.jpg",
  "/eewyla/training5.jpg"
];

const How = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); 

    return () => clearInterval(timer); 
  }, []);

  return (
    <section className="relative w-full bg-[#0E2323] py-16 md:py-24 px-6 overflow-hidden font-sora">
       <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: "url('/learn/training/greenSubtract.png')", 
          backgroundSize: '100px',
          backgroundRepeat: 'repeat'  
        }}
      />
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-10 md:mb-20">
          How the training works
        </h2>
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
  
          <div className="relative w-full aspect-[4/3] md:aspect-[4/5] lg:h-[700px] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl order-first lg:order-last">
            {slides.map((src, index) => (
              <div
                key={src}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <Image 
                  src={src} 
                  alt={`Training slide ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />

                <div className="absolute inset-0 bg-black/50 z-10" />
              </div>
            ))}
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {slides.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentSlide ? "w-8 bg-[#00D1C1]" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-10 md:space-y-12 relative lg:pl-10 w-full">
            <div className="absolute left-[20px] md:left-[26px] lg:left-[63px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-white/40 z-0"></div>
            
            {trainingSteps.map((step) => (
              <div key={step.id} className="flex items-start gap-5 md:gap-6 relative z-10 group">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-[#0E2323] flex items-center justify-center font-bold text-lg md:text-xl shrink-0 shadow-lg transition-transform group-hover:scale-110">
                  {step.id}
                </div>
                
                <div className="pt-0.5 md:pt-1">
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-2 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-white/70 text-sm md:text-lg leading-relaxed font-light">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default How;