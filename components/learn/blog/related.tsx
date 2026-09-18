import Image from 'next/image';
import Link from 'next/link';
import { getRelatedBlogPosts, BlogPost } from '@/data/blogData';

interface RelatedArticlesProps {
  currentSlug: string;
  category?: string;
  allPosts?: BlogPost[];
}

const RelatedArticles = ({ currentSlug, category }: RelatedArticlesProps) => {
  const related = getRelatedBlogPosts(currentSlug, category, 3);

  if (related.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-slate-50/50 font-sora border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#002d25] tracking-tight">
              Related Articles
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              More insights and field reports from Oriyon International
            </p>
          </div>

          <Link
            href="/learn/blog"
            className="text-xs sm:text-sm font-extrabold text-[#0b4d44] hover:text-[#00D1C1] transition hidden sm:inline-block"
          >
            View All Articles →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {related.map((post) => (
            <Link href={`/learn/blog/${post.slug}`} key={post.slug} className="group block h-full">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 hover:border-[#00D1C1]/60 transition-all duration-300 hover:shadow-md h-full flex flex-col">
                
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4 bg-slate-100">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="inline-flex items-center w-fit bg-[#002d25] rounded-full overflow-hidden mb-3">
                  <span className="bg-[#0b4d44] text-[#00D1C1] text-[10px] font-extrabold px-3 py-1 uppercase tracking-wider">
                    {post.category}
                  </span>
                  <span className="text-white text-[10px] font-medium px-3 py-1 opacity-90">
                    {post.readTime}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-[#002d25] leading-snug mb-2 group-hover:text-[#00D1C1] transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 font-medium">
                  {post.excerpt}
                </p>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 mt-auto">
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden shrink-0 border border-slate-200">
                    <Image
                      src={post.authorImg || "/learn/blog/Avatar.png"}
                      alt={post.author}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#002d25]">{post.author}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{post.date}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedArticles;