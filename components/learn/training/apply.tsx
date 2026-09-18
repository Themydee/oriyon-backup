"use client";

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';

const slides = [
    "/learn/training/session.jpg",
    "/learn/training/session2.png",
    "/learn/training/session3.png",
    "/learn/training/session4.png",
    "/learn/training/session5.png"
];

export default function TrainingComponent() {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative bg-[#0e2323] p-6 md:p-12 lg:p-20 min-h-screen flex items-center justify-center overflow-hidden">
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: "url('/learn/training/greenSubtract.png')",
                    backgroundSize: '100px',
                    backgroundRepeat: 'repeat'
                }}
            />
            
            <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">

                <div className="relative bg-[#115e5e] rounded-[2.5rem] p-12 flex flex-col justify-between text-white min-h-[600px] overflow-hidden">
                    <div className="absolute top-8 right-10 opacity-90 rotate-[24deg] pointer-events-none">
                        <Image
                            src="/learn/training/greenSubtract.png"
                            alt="Africa Watermark"
                            width={290}
                            height={290}
                        />
                    </div>

                    <div className="relative z-10">
                        <div className="mb-20">
                            <Image
                                src="/learn/training/loop.png"
                                alt="Training Icon"
                                width={48}
                                height={48}
                                className="opacity-90"
                            />
                        </div>

                        <h2 className="text-3xl font-bold mb-10 tracking-tight">
                            EEWYLA Training
                        </h2>

                        <ul className="space-y-5">
                            {['Cohort-based', 'Time-bound', 'Mandatory completion rules'].map((text) => (
                                <li key={text} className="flex items-center gap-4 text-xl font-light">
                                    <span className="w-2 h-2 bg-white rounded-full" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Link
                        href="/apply"
                        className="relative z-10 bg-white text-[#115e56] font-bold py-4 px-10 rounded-full w-fit mt-12 hover:bg-gray-100 transition-all text-lg"
                    >
                        Apply for EEWYLA Training
                    </Link>
                </div>

                <div className="relative h-[500px] md:h-auto rounded-[2.5rem] overflow-hidden shadow-2xl">
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
                            <div className="absolute inset-0 bg-black/20 z-10" />
                        </div>
                    ))}

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
                        {slides.map((_, index) => (
                            <span 
                                key={index}
                                className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                                    index === currentSlide ? "bg-[#4fd1c5]" : "bg-white/40"
                                }`} 
                            />
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}