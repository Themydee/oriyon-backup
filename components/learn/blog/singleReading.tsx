'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ThumbsUp, ThumbsDown, Share2, Check, Copy } from 'lucide-react';

interface BlogPostProps {
  slug: string;
  title?: string;
  content?: string[];
  category?: string;
  readTime?: string;
  author?: string;
  authorTitle?: string;
  authorImg?: string;
  date?: string;
  keyTakeaways?: string[];
  tags?: string[];
}

export default function BlogPost({
  slug,
  title,
  content,
  category,
  readTime,
  author,
  authorTitle,
  authorImg,
  date,
  keyTakeaways,
  tags,
}: BlogPostProps) {
  const formattedTitle = title || (slug || '').replace(/-/g, ' ');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareOnWhatsApp = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Read this article on Oriyon International: "${formattedTitle}"`);
      window.open(`https://api.whatsapp.com/send?text=${text}%20${url}`, '_blank');
    }
  };

  const shareOnLinkedIn = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    }
  };

  const shareOnTwitter = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Read "${formattedTitle}" on Oriyon International Blog`);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }
  };

  return (
    <main className="py-10 sm:py-14 md:py-20 px-4 sm:px-6 bg-white font-sora">
      <article className="max-w-4xl mx-auto">
        
        {/* Author & Share Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8 sm:mb-10 pb-6 border-b border-slate-100">
          
          {/* Author info */}
          <div className="flex items-center gap-3.5">
            <div className="relative h-11 w-11 sm:h-12 sm:w-12 overflow-hidden rounded-full border-2 border-[#00D1C1]/40 shrink-0 shadow-2xs">
              <Image
                src={authorImg || "/learn/blog/Avatar.png"}
                alt={author || "Author"}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm sm:text-base font-black text-[#002d25]">
                {author || "Reece James"}
              </p>
              <p className="text-[11px] sm:text-xs text-[#0b4d44] font-semibold">
                {authorTitle || "Agribusiness Specialist"} · {date || "Sep 27, 2023"}
              </p>
            </div>
          </div>

          {/* Social Sharing Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Share:
            </span>
            
            <button
              onClick={shareOnWhatsApp}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Share on WhatsApp"
            >
              💬 WhatsApp
            </button>

            <button
              onClick={shareOnLinkedIn}
              className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Share on LinkedIn"
            >
              💼 LinkedIn
            </button>

            <button
              onClick={shareOnTwitter}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Share on X (Twitter)"
            >
              𝕏 Post
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Copy Article Link"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </div>

        {/* Title Heading */}
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-[#002d25] leading-snug md:leading-tight tracking-tight">
            {formattedTitle}
          </h1>
        </header>

        {/* Key Takeaways Callout Box */}
        {keyTakeaways && keyTakeaways.length > 0 && (
          <div className="mb-10 p-6 sm:p-8 bg-emerald-50/70 border border-emerald-200 rounded-3xl space-y-3 shadow-2xs font-sora">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <h3 className="text-sm font-black text-[#002d25] uppercase tracking-wider">
                Key Takeaways & Summary
              </h3>
            </div>
            <ul className="space-y-2.5 pl-2">
              {keyTakeaways.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#002d25] font-semibold leading-relaxed">
                  <span className="text-[#00D1C1] font-bold text-base mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Body Content */}
        <div className="prose prose-base md:prose-lg max-w-none text-[#002d25]/90 leading-relaxed sm:leading-relaxed space-y-6 sm:space-y-8 font-medium">
          {content && content.length > 0 ? (
            content.map((paragraph, index) => (
              <p
                key={index}
                className="text-[#002d25]/95 text-base sm:text-lg md:text-xl leading-relaxed tracking-normal"
              >
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-slate-500 italic">Post content not available.</p>
          )}
        </div>

        {/* Article Tags */}
        {tags && tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-2">
              Tags:
            </span>
            {tags.map((t) => (
              <span
                key={t}
                className="px-3.5 py-1.5 rounded-full bg-slate-100 text-[#002d25] text-xs font-extrabold border border-slate-200"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Helpful Feedback Widget */}
        <div className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-slate-100">
          <div className="bg-[#f4f9f9] border border-slate-200/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 shadow-2xs">
            <div>
              <p className="text-base sm:text-lg font-black text-[#002d25] text-center sm:text-left">
                Was this article helpful?
              </p>
              <p className="text-xs text-slate-500 font-medium text-center sm:text-left mt-0.5">
                Your feedback helps us tailor better insights for African agribusiness.
              </p>
            </div>

            {feedback ? (
              <div className="bg-emerald-100 border border-emerald-300 text-[#002d25] text-xs sm:text-sm font-bold px-6 py-3 rounded-2xl animate-in fade-in">
                ✓ Thank you for your feedback!
              </div>
            ) : (
              <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
                <button
                  onClick={() => setFeedback('yes')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 bg-white rounded-2xl border border-slate-200 hover:bg-[#00D1C1]/20 hover:border-[#00D1C1] transition-all shadow-2xs active:scale-95 text-[#002d25] font-bold cursor-pointer"
                >
                  <ThumbsUp size={18} className="text-[#002d25]" />
                  <span className="text-xs sm:text-sm">Yes</span>
                </button>
                <button
                  onClick={() => setFeedback('no')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 bg-white rounded-2xl border border-slate-200 hover:bg-rose-50 hover:border-rose-300 transition-all shadow-2xs active:scale-95 text-[#002d25] font-bold cursor-pointer"
                >
                  <ThumbsDown size={18} className="text-[#002d25]" />
                  <span className="text-xs sm:text-sm">No</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </article>
    </main>
  );
}