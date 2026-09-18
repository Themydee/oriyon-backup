'use client';

import Image from 'next/image';
import Link from 'next/link';

interface HeroProps {
  slug: string;
  postImage: string;
  title?: string;
  category?: string;
  readTime?: string;
  author?: string;
  authorTitle?: string;
  date?: string;
}

const Hero = ({
  slug,
  postImage,
  title,
  category,
  readTime,
}: HeroProps) => {
  const displayTitle = title || (slug || '').replace(/-/g, ' ');

  return (
    <section className="relative h-[50vh] min-h-[350px] md:h-[60vh] md:min-h-[460px] w-full flex items-center justify-center overflow-hidden font-sora">
      <Image
        src={postImage}
        alt={displayTitle || "Blog Post"}
        fill
        priority
        className="object-cover object-center scale-105"
      />
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#002d25] via-[#002d25]/60 to-black/40 z-10" />
      
      <div className="relative z-20 container mx-auto px-4 sm:px-6 text-center text-white">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 sm:gap-5">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 flex-wrap justify-center mb-1">
            <Link href="/" className="hover:text-[#00D1C1] transition">Home</Link>
            <span>/</span>
            <Link href="/learn/blog" className="hover:text-[#00D1C1] transition">Blog</Link>
            <span>/</span>
            <span className="text-[#00D1C1] font-bold truncate max-w-[200px]">{displayTitle}</span>
          </div>

          {/* Category & Read Time Tag */}
          <div className="inline-flex items-center w-fit bg-white/10 backdrop-blur-md border border-white/20 rounded-full overflow-hidden shadow-lg">
            <span className="bg-[#00D1C1] text-[#002d25] text-[10px] sm:text-xs font-black px-4 py-1.5 uppercase tracking-wider">
              {category || "News"}
            </span>
            <span className="text-white text-[10px] sm:text-xs font-medium px-4 py-1.5">
              {readTime || "5 min read"}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-snug md:leading-tight text-white max-w-3.5xl">
            {displayTitle}
          </h1>

          <Link
            href="/learn/blog"
            className="mt-2 text-xs sm:text-sm font-extrabold text-[#00D1C1] hover:text-white transition flex items-center gap-1.5 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to All Articles
          </Link>
          
        </div>
      </div>
    </section>
  );
};

export default Hero;