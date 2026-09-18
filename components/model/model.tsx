import React from 'react';
import Image from 'next/image';

const steps = [
  { id: 1, stage: "ORGANISE", text: "We Organise — Bringing smallholders & entrepreneurs into structured LGA cooperative clusters." },
  { id: 2, stage: "TRAIN", text: "We Train — EEWYLA structured training & mentorship hosted with academic partner LAUTECH." },
  { id: 3, stage: "PRODUCE", text: "We Enable Production — Modern breeding, husbandry, animal health & biosecurity standards." },
  { id: 4, stage: "AGGREGATE", text: "We Aggregate — Cooperative clusters create volume, quality & traceability for serious buyers." },
  { id: 5, stage: "TRADE", text: "We Connect to Markets — Direct commercial pathways, offtake contracts & processing infrastructure." },
];

const Model = () => {
  return (
    <section className="w-full bg-white py-16 md:py-24 px-6 overflow-hidden font-sora">

      <div className="max-w-7xl mx-auto">

        <h2 className="text-3xl md:text-5xl font-black text-[#003d38] text-center mb-10 md:mb-20">
          The Oriyon Model
        </h2>

        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-8 md:space-y-12 relative lg:pl-10">
            <div className="absolute left-[20px] md:left-[23px] lg:left-[63px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-gray-300 z-0"></div>
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-4 md:gap-6 relative z-10">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#003d38] text-white flex items-center justify-center font-bold text-lg md:text-xl shrink-0 shadow-sm">
                  {step.id}
                </div>
                <p className="text-sm md:text-xl text-[#003d38] font-medium pt-2 leading-tight md:leading-snug">
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          <div className="relative w-full aspect-square max-w-[320px] md:max-w-[550px] mx-auto">
            <div className="absolute inset-0 bg-[#E9F3F2] rounded-full blur-3xl opacity-30 scale-75"></div>
            <div className="relative w-full h-full">
              <Image
                src="/model/oriyonModel.png"
                alt="The Oriyon Model Process Cycle"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Model;