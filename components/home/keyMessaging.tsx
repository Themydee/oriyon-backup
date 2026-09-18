import { ArrowRight } from "lucide-react";

const KeyMessaging = () => {
  const MessageSet = () => (
    <div className="flex items-center gap-4 flex-nowrap flex-shrink-0">
      <span className="bg-[#00D1C1] px-6 py-2 rounded-full text-black font-bold whitespace-nowrap">Trace it.</span>
      <span className="border border-[#00D1C1] text-[#00D1C1] px-6 py-2 rounded-full font-bold whitespace-nowrap">Track it.</span>
      <span className="bg-[#00D1C1] px-6 py-2 rounded-full text-black font-bold whitespace-nowrap">Trust it.</span>
      <div className="w-10 h-10 rounded-full bg-[#00D1C1] flex items-center justify-center text-black">
        <ArrowRight size={20} />
      </div>
      <span className="border border-[#00D1C1] text-[#00D1C1] px-6 py-2 rounded-full font-bold whitespace-nowrap">Trade it.</span>
      <div className="w-4" /> 
    </div>
  );

  return (
    <div className="bg-[#0b211e] py-6 border-y border-white/5 overflow-hidden flex">
      <div className="flex animate-infinite-scroll whitespace-nowrap">
        <MessageSet />
        <MessageSet />
        <MessageSet />
        <MessageSet />
        <MessageSet />
        <MessageSet />
        <MessageSet />
        <MessageSet />
      </div>
    </div>
  );
};

export default KeyMessaging;