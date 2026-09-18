'use client';

import React, { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const stats = [
  { label: "States Reached", value: 4, suffix: "+" },
  { label: "Livestock Producers & Trainees Engaged", value: 2000, suffix: "+" },
  { label: "RFID-Tagged Traceable Animals", value: 1000, suffix: "+" },
  { label: "Verified Producer Network", value: 2000, suffix: "+" },

  { 
    label: "Addressable Livestock Market Opportunity", 
    isRange: true, 
    max: 100, 
    prefix: "₦", 
    suffix: "Billion" 
  },
];

const Counter = ({ value, duration = 2, prefix = "", suffix = "" }: any) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    let animationFrameId: number;
    const end = Number(value) || 0;
    const durationMs = duration * 1000;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, value, duration]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
};

const StatsBar = () => {
  return (
    <section className="relative bg-[#004242] py-20 md:py-16 overflow-hidden font-sora">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap justify-center gap-10 md:gap-12 lg:gap-0 items-center">
          {stats.map((stat, index) => (
            <React.Fragment key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`flex flex-col items-center text-center px-4 w-full md:w-[45%] lg:w-1/5 ${
                  index !== stats.length - 1 ? 'lg:border-r border-white/20' : ''
                }`}
              >
                <h2 className="text-white text-3xl md:text-4xl font-black md:font-bold mb-2 tracking-tight whitespace-nowrap">
                  {stat.isRange ? (
                    <>
                      
                      <Counter value={stat.max} suffix={stat.suffix} />
                    </>
                  ) : (
                    <Counter value={stat.value} suffix={stat.suffix} />
                  )}
                </h2>
                <p className="text-white/80 md:text-gray-300 text-lg md:text-base font-medium capitalize md:normal-case">
                  {stat.label}
                </p>
              </motion.div>

              {index !== stats.length - 1 && (
                <div className="md:hidden w-16 h-[1px] bg-white/20" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;