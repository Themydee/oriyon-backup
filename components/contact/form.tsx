'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Linkedin, Facebook, Instagram } from 'lucide-react';

const XIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Contact = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <section className="bg-[#F8FCFC] py-16 md:py-24 px-6 font-sora">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-12 items-stretch">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 flex gap-5 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#E0F7F6] flex items-center justify-center shrink-0">
                <Image src="/contact/mail.png" alt="Mail Icon" width={80} height={80} className="object-contain" />
              </div>
              <div>
                <h4 className="font-bold text-[#0E2323] mb-1">Contact us</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  For technical assistance or support-related queries, please contact our dedicated support team at info@oriyoninternational.com
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 flex gap-5 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#E0F7F6] flex items-center justify-center shrink-0">
                <Image src="/contact/phone.png" alt="Phone Icon" width={80} height={80} className="object-contain" />
              </div>
              <div>
                <h4 className="font-bold text-[#0E2323] mb-1">Phone Number</h4>
                <p className="text-sm text-gray-500">+234 810 125 2526</p>
                <p className="text-sm text-gray-500">+44 755 467 7992</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 flex gap-5 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#E0F7F6] flex items-center justify-center shrink-0">
                <Image src="/contact/social.png" alt="Social Icon" width={80} height={80} className="object-contain" />
              </div>
              <div>
                <h4 className="font-bold text-[#0E2323] mb-4">Social Media</h4>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#00D1C1] hover:text-white transition-colors cursor-pointer"><XIcon size={14} /></div>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#00D1C1] hover:text-white transition-colors cursor-pointer"><Linkedin size={14} /></div>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#00D1C1] hover:text-white transition-colors cursor-pointer"><Facebook size={14} /></div>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#00D1C1] hover:text-white transition-colors cursor-pointer"><Instagram size={14} /></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 flex gap-5 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#E0F7F6] flex items-center justify-center shrink-0">
                <Image src="/contact/mail.png" alt="Address Icon" width={80} height={80} className="object-contain" />
              </div>
              <div>
                <h4 className="font-bold text-[#0E2323] mb-1">Address</h4>
                <p className="text-sm text-gray-500">
                  Suite B5 Oando Mega Plaza, Garduwa, Abuja, Nigeria
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-50 flex items-center min-h-[450px] md:min-h-[600px]">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="p-6 md:p-12 space-y-6 w-full animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-semibold text-[#0E2323]">First Name</label>
                    <input required type="text" placeholder="Enter First name" className="w-full px-4 md:px-5 py-3.5 md:py-4 rounded-xl border border-gray-100 bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#00D1C1]/20 transition-all text-sm text-black" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-semibold text-[#0E2323]">Last Name</label>
                    <input required type="text" placeholder="Enter Last name" className="w-full px-4 md:px-5 py-3.5 md:py-4 rounded-xl border border-gray-100 bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#00D1C1]/20 transition-all text-sm text-black" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-semibold text-[#0E2323]">Phone Number</label>
                  <input required type="tel" placeholder="Enter Phone number" className="w-full px-4 md:px-5 py-3.5 md:py-4 rounded-xl border border-gray-100 bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#00D1C1]/20 transition-all text-sm text-black" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-semibold text-[#0E2323]">Email Address</label>
                  <input required type="email" placeholder="Enter Email address" className="w-full px-4 md:px-5 py-3.5 md:py-4 rounded-xl border border-gray-100 bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#00D1C1]/20 transition-all text-sm text-black" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-semibold text-[#0E2323]">Message</label>
                  <textarea required rows={4} placeholder="Type in your message" className="w-full px-4 md:px-5 py-3.5 md:py-4 rounded-xl border border-gray-100 bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#00D1C1]/20 transition-all text-sm resize-none text-black" />
                </div>

                <button type="submit" className="w-full md:w-auto px-10 md:px-12 py-4 bg-[#00D1C1] text-[#002d25] font-black rounded-full hover:bg-[#00b8aa] transition-all shadow-lg uppercase text-[10px] md:text-xs tracking-widest mt-4">
                  Send a message
                </button>
              </form>
            ) : (
              <div className="p-6 md:p-12 w-full text-center flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                <div className="relative w-40 h-40 md:w-56 md:h-56 mb-6">
                  <div className="absolute inset-0 bg-[#E0F7F6] rounded-full blur-3xl opacity-60 scale-75" />
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image 
                      src="/contact/Pages.svg" 
                      alt="Success Illustration" 
                      width={250} 
                      height={250} 
                      className="object-contain"
                    />
                  </div>
                </div>
                
                <h3 className="text-xl md:text-3xl font-black text-[#0E2323] mb-3">
                  Message Sent
                </h3>
                <p className="text-xs md:text-lg text-gray-500 max-w-[280px] md:max-w-sm mx-auto leading-relaxed">
                  Our team will get in touch within 24 hours!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;