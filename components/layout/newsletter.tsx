'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const Newsletter = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const confettiBg = `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10q5 0 5 5t-5 5-5-5 5-5z' fill='%2300D1C1' fill-opacity='0.4'/%3E%3Cpath d='M80 20l5 10-10-5z' fill='%23FFD700' fill-opacity='0.3'/%3E%3Cpath d='M40 60q0-5 5-5t5 5-5 5-5-5z' fill='%23FF6B6B' fill-opacity='0.3'/%3E%3Cpath d='M20 80l10-5-5 10z' fill='%234D96FF' fill-opacity='0.3'/%3E%3Cpath d='M70 70q5 5 0 10t-5-10 5-10 5 10z' fill='%236BCB77' fill-opacity='0.3'/%3E%3C/svg%3E")`;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribed(true);
  };

  return (
    <section className="relative py-20 md:py-28 px-6 overflow-hidden text-center text-white font-sora bg-gradient-to-b from-[#00423a] via-[#005a4d] to-[#00423a]">
      
      <div 
        className="absolute inset-0 w-full h-full opacity-10 pointer-events-none z-0 mix-blend-overlay"
        style={{ backgroundImage: "url('/home/Subtract.png')", backgroundRepeat: 'repeat', backgroundSize: '80px' }} 
      />
      
      <div className="max-w-5xl mx-auto relative z-10 flex items-center justify-center min-h-[400px]">
        {!isSubscribed ? (
          <div className="w-full animate-in fade-in duration-500">
            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 leading-tight tracking-tight">
              Join our network today.
            </h2>
            <p className="text-white/80 text-base md:text-lg mb-10 md:mb-16 max-w-3xl mx-auto font-medium leading-relaxed">
              Subscribe for stories, data, and updates shaping the future of livestock and fair markets.
            </p>
            
            <form onSubmit={handleSubscribe} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-x-6 gap-y-6 text-left max-w-5xl mx-auto items-end">
              <div className="md:col-span-1 lg:col-span-5 space-y-3">
                <label className="text-xs font-bold tracking-wide uppercase">First Name</label>
                <input required type="text" placeholder="Enter First name" className="w-full bg-white p-4 h-14 rounded-xl text-black focus:ring-2 focus:ring-[#00D1C1] outline-none placeholder:text-gray-400 font-medium" />
              </div>

              <div className="md:col-span-1 lg:col-span-5 space-y-3">
                <label className="text-xs font-bold tracking-wide uppercase">Last Name</label>
                <input required type="text" placeholder="Enter Last name" className="w-full bg-white p-4 h-14 rounded-xl text-black focus:ring-2 focus:ring-[#00D1C1] outline-none placeholder:text-gray-400 font-medium" />
              </div>

              <div className="md:col-span-1 lg:col-span-6 space-y-3">
                <label className="text-xs font-bold tracking-wide uppercase">Email Address</label>
                <input required type="email" placeholder="Enter Email address" className="w-full bg-white p-4 h-14 rounded-xl text-black focus:ring-2 focus:ring-[#00D1C1] outline-none placeholder:text-gray-400 font-medium" />
              </div>

              <div className="md:col-span-1 lg:col-span-4">
                <button type="submit" className="w-full bg-[#00D1C1] text-[#002d25] font-black h-14 rounded-full text-sm hover:bg-[#00b8aa] transition-all shadow-lg uppercase tracking-widest active:scale-95">
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl max-w-lg w-full text-center relative overflow-hidden animate-in zoom-in-95 duration-500">
            <div 
                className="absolute inset-0 opacity-40 pointer-events-none" 
                style={{ backgroundImage: confettiBg, backgroundSize: '120px' }} 
            />
            
            <div className="relative z-10 text-[#002d25]">
              <div className="w-20 h-20 bg-[#00423a] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                 <Image src="/home/Subtract.png" alt="Oriyon" width={40} height={40} />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black mb-4">
                Subscription Successful!
              </h2>
              
              <p className="text-[#002d25]/70 text-sm md:text-base mb-10 leading-relaxed font-medium">
                Thank you for subscribing to our newsletter. you’re now part of our community and will receive the latest updtates and insights on our programs. Stay tuned for valuable content.
              </p>
              
              <button 
                onClick={() => setIsSubscribed(false)}
                className="w-full bg-[#00D1C1] text-[#002d25] font-black py-4 rounded-full text-sm uppercase tracking-widest hover:bg-[#00b8aa] transition-all shadow-md active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Newsletter;