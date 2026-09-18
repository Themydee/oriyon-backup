import RelatedArticles from '@/components/learn/blog/related';
import Hero from '@/components/learn/blog/singleHero';
import BlogPost from '@/components/learn/blog/singleReading';
import Link from 'next/link';
import React from 'react';
import { fetchBlogPostBySlugFromApi } from '@/data/blogData';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const Page = async ({ params }: PageProps) => {
  const { slug } = await params;

  const currentPost = await fetchBlogPostBySlugFromApi(slug);

  if (!currentPost) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-sora bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-[#002d25] flex items-center justify-center text-3xl font-black mb-4">
          📚
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#002d25] mb-2">
          Article Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md font-medium mb-6">
          The requested blog article could not be found or may have been moved.
        </p>
        <Link
          href="/learn/blog"
          className="px-7 py-3 rounded-full bg-[#00D1C1] text-[#002d25] text-xs sm:text-sm font-black hover:bg-[#00b8aa] transition shadow-md"
        >
          ← Back to All Articles
        </Link>
      </div>
    );
  }

  const heroImage = currentPost.heroImage || currentPost.image || "/learn/blog/blog.jpg";

  return (
    <div className="bg-white">
      <Hero
        slug={currentPost.slug}
        postImage={heroImage}
        title={currentPost.title}
        category={currentPost.category}
        readTime={currentPost.readTime}
        author={currentPost.author}
        authorTitle={currentPost.authorTitle}
        date={currentPost.date}
      />
      
      <BlogPost
        slug={currentPost.slug}
        title={currentPost.title}
        content={currentPost.content}
        category={currentPost.category}
        readTime={currentPost.readTime}
        author={currentPost.author}
        authorTitle={currentPost.authorTitle}
        authorImg={currentPost.authorImg}
        date={currentPost.date}
        keyTakeaways={currentPost.keyTakeaways}
        tags={currentPost.tags}
      />

      <RelatedArticles
        currentSlug={currentPost.slug}
        category={currentPost.category}
      />
    </div>
  );
};

export default Page;