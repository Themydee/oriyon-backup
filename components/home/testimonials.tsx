"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";

const testimonialData = [
    {
        title: "A great experience",
        text: "“It was an eye opener having to be among the first set of trainees on the Oriyon farm. We were exposed to a lot of hands on practical and also partook on onfarm activities. The training exposes us to major biosecurity issues on farms and how to deal with them.”",
        name: "Malmo Favour Samuel",
        role: "Student",
        image: "/home/testimony.png"
    },
    {
        title: "From Theory to Practice",
        text: "“The training gave me firsthand knowledge of different drug administration routes and injections, as well as hands-on practical experience with goats that reinforced the theory taught in class. Many thanks to the organizers and Oriyon International Farm”",
        name: "Malmo Favour Samuel",
        role: "Student",
        image: "/home/testimony2.jpg" 
    }
];

const Testimonials = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === testimonialData.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? testimonialData.length - 1 : prev - 1));
    };

    const current = testimonialData[currentIndex];

    return (
        <section className="bg-[#0E2323] py-20 px-6 relative overflow-hidden font-sora">
            <div className="absolute top-[-5%] right-[-10%] md:top-[-50%] md:right-[0%] w-[250px] md:w-[200px] h-[400px] md:h-[120%] pointer-events-none z-0 rotate-[15deg] md:rotate-[45deg] opacity-20 md:opacity-10 flex justify-between">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="w-full h-full bg-repeat-y" style={{ backgroundImage: "url('/home/Subtract.png')", backgroundSize: "70px" }} />
                ))}
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex justify-center md:justify-start">
                    <span className="inline-block px-4 py-2 md:py-3 rounded-lg md:rounded-full border border-[#d4bc93] bg-[#fff9eb] text-[#8a7a5f] text-xs font-bold uppercase mb-6 md:mb-4">
                        Testimonials
                    </span>
                </div>

                <h2 className="text-3xl md:text-5xl font-black text-white mb-12 md:mb-16 text-center md:text-left">
                    What Farmers are <br className="md:hidden" /> saying?
                </h2>

                <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12 items-stretch">
                    {/* Testimonial Text Card */}
                    <div className="order-1 md:order-2 relative flex flex-col justify-between rounded-3xl bg-white p-8 md:p-12 shadow-2xl overflow-hidden min-h-[400px]">
                        <div className="relative z-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="mb-4 md:mb-6 text-xl md:text-2xl font-black text-[#0b211e]">
                                {current.title}
                            </h3>
                            <p className="mb-8 md:mb-10 text-base md:text-lg font-medium leading-relaxed text-[#0b211e]/80">
                                {current.text}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 border-t border-gray-100 pt-6 md:pt-8 relative z-10">
                            <div className="relative h-12 w-12 md:h-14 md:w-14 overflow-hidden rounded-full border-2 border-[#00D1C1]">
                                <Image src={current.image} alt={current.name} fill className="object-cover" />
                            </div>
                            <div>
                                <p className="text-base md:text-lg font-black text-[#0b211e]">{current.name}</p>
                                <p className="text-xs md:text-sm text-gray-500">{current.role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial Image */}
                    <div className="order-2 md:order-1 relative h-[350px] md:h-full min-h-[300px] md:min-h-[550px] rounded-3xl overflow-hidden shadow-2xl">
                        <Image src={current.image} alt="Farmer" fill className="object-cover animate-in fade-in zoom-in-95 duration-700" />
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center mt-10 md:mt-12 gap-8 relative z-10">
                    <div className="flex gap-3">
                        {testimonialData.map((_, i) => (
                            <div
                                key={i}
                                className={`h-3 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-[#00D1C1] w-8' : 'bg-white w-3'}`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-6">
                        <button 
                            onClick={prevSlide}
                            className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
                        >
                            <ArrowLeft size={24} strokeWidth={2.5} />
                        </button>
                        <button 
                            onClick={nextSlide}
                            className="w-14 h-14 rounded-full bg-[#00D1C1] flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-all shadow-lg"
                        >
                            <ArrowRight size={24} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;