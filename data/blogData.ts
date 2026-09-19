export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  category: "News" | "Business" | "Livestock Animals" | "Oriyon International";
  readTime: string;
  author: string;
  authorTitle?: string;
  authorImg: string;
  date: string;
  image: string;
  heroImage?: string;
  featured?: boolean;
  excerpt: string;
  keyTakeaways?: string[];
  content: string[];
  tags?: string[];
  isPublished?: boolean;
  createdAt?: string;
}

export const BLOG_CATEGORIES = [
  "All",
  "News",
  "Business",
  "Livestock Animals",
  "Oriyon International",
] as const;

export const defaultBlogPosts: BlogPost[] = [
  {
    id: "blog-1",
    slug: "building-a-traceable-livestock-value-chain-in-nigeria-why-it-matters",
    title: "Building a Traceable Livestock Value Chain in Nigeria: Why It Matters",
    category: "News",
    readTime: "5 min read",
    author: "Reece James",
    authorTitle: "Head of Traceability Operations",
    authorImg: "/learn/blog/Avatar.png",
    date: "Sep 27, 2023",
    image: "/learn/blog/singleHero.png",
    heroImage: "/learn/blog/singleHero.png",
    featured: true,
    isPublished: true,
    excerpt: "Discover how digital EAR TAG identification and blockchain-inspired audit trails are revolutionizing livestock commercialization across Nigeria.",
    keyTakeaways: [
      "Digital EAR TAGs provide unique identity numbers for individual cattle and small ruminants.",
      "Traceability eliminates flat-rate buyer pricing by proving animal health, age, and vaccination history.",
      "Institutional buyers pay a 15-25% premium for verified, disease-free livestock with digital records."
    ],
    content: [
      "The traditional livestock trade in Nigeria has long been defined by fragmented supply chains and a lack of transparent pricing. For decades, pastoral farmers and commercial rearers have relied on informal physical markets, long-distance cattle trekking, and multiple intermediaries that erode farmgate profits.",
      "Digital marketplaces and EAR TAG identity systems are set to disrupt this status quo by creating a direct, verifiable link between the farm gate, cooperative processing hubs, and industrial meat buyers.",
      "Beyond simple commercial sales, these platforms introduce a layer of data-driven trust. Verified seller profiles, ear-tag RFID codes, and digital health certificates allow buyers to purchase with complete confidence, knowing the exact provenance and vaccination history of every animal.",
      "As we look toward the future, the integration of cold-chain logistics, regional abattoir tracking, and escrow payments will drastically reduce livestock theft, interstate transit mortality, and payment disputes across West Africa."
    ],
    tags: ["Traceability", "Livestock", "EAR TAG", "Nigeria Agribusiness"]
  },
  {
    id: "blog-2",
    slug: "how-cooperative-based-training-strengthens-rural-communities",
    title: "How Cooperative-Based Training Strengthens Rural Communities",
    category: "Oriyon International",
    readTime: "6 min read",
    author: "Dr. Amina Bello",
    authorTitle: "EEWYLA Lead Coordinator",
    authorImg: "/learn/blog/Avatar.png",
    date: "Oct 14, 2023",
    image: "/learn/blog/single.png",
    heroImage: "/learn/blog/single.png",
    featured: false,
    isPublished: true,
    excerpt: "EEWYLA's cooperative model empowers women and youth with practical goat farming skills, group savings, and direct off-taker access.",
    keyTakeaways: [
      "Group pooling enables smallholder farmers to access bulk feeds and veterinary services at 30% lower cost.",
      "Women and youth gain direct ownership of income-generating livestock assets.",
      "Cooperative registration unlocks formal credit lines, micro-loans, and government agricultural grants."
    ],
    content: [
      "In rural livestock farming, individual micro-producers often struggle to compete with large commercial feedlots due to limited capital, lack of bargaining power, and expensive veterinary inputs.",
      "The EEWYLA (Economic Empowerment of Women and Youth in Livestock Agriculture) programme addresses this systemic barrier by anchoring technical training within grassroots cooperative clusters across Oyo, Kwara, and surrounding states.",
      "When women and young livestock rearers form registered cooperative societies, they gain collective bargaining power. They purchase high-quality feed concentrates in bulk, share vaccination kits, and negotiate fair off-taker contracts with major urban meat processors.",
      "Through structured 12-week practical curriculum sessions at sites like LAUTECH Ogbomoso, cooperative members build lasting networks, gain financial literacy, and transform subsistence goat rearing into scalable, profitable agribusinesses."
    ],
    tags: ["EEWYLA", "Cooperatives", "Women In Agribusiness", "Ogbomoso"]
  },
  {
    id: "blog-3",
    slug: "using-data-to-reduce-losses-and-improve-livestock-quality",
    title: "Using Data to Reduce Losses and Improve Livestock Quality",
    category: "Business",
    readTime: "4 min read",
    author: "Reece James",
    authorTitle: "Agribusiness Analyst",
    authorImg: "/learn/blog/Avatar.png",
    date: "Nov 02, 2023",
    image: "/learn/blog/single2.jpg",
    heroImage: "/learn/blog/single2.jpg",
    featured: false,
    isPublished: true,
    excerpt: "How data tracking, weight monitoring, and biosecurity checklists protect herd investments and boost profit margins.",
    keyTakeaways: [
      "Regular weight measurement ensures optimal feed-to-meat conversion rates.",
      "Digital health logs enable early disease detection before herd-wide outbreaks occur.",
      "Data-driven farm management increases average kid survival rates to over 92%."
    ],
    content: [
      "Trust and quantitative measurement are the most valuable currencies in modern livestock management. Historically, farmers estimated animal weight by sight, leading to underpricing during sale and inaccurate feed rationing.",
      "By adopting digital weigh scales, growth tracking apps, and routine health logs, small ruminant farmers can precisely monitor Average Daily Gain (ADG) and optimize feed formulas for maximum muscle growth.",
      "Biosecurity checklists—such as isolation protocols for newly acquired goats, routine deworming schedules, and tick control—significantly reduce mortality rates, particularly during rainy season disease surges.",
      "Ultimately, data transforms livestock farming from a high-risk gamble into a predictable, bankable enterprise that attracts commercial investment and bank credit."
    ],
    tags: ["Livestock Data", "Farm Management", "Goat Production", "Biosecurity"]
  },
  {
    id: "blog-4",
    slug: "goat-farming-and-small-ruminant-production-best-practices-for-high-yield",
    title: "Goat Farming & Small Ruminant Production: Best Practices for High Yield",
    category: "Livestock Animals",
    readTime: "7 min read",
    author: "Samuel Oladele",
    authorTitle: "Senior Livestock Agronomist",
    authorImg: "/learn/blog/Avatar.png",
    date: "Dec 12, 2023",
    image: "/learn/blog/blog.jpg",
    heroImage: "/learn/blog/blog.jpg",
    featured: false,
    isPublished: true,
    excerpt: "Essential guide on housing design, nutrition, breeding management, and disease prevention for West African Dwarf and Red Sokoto goats.",
    keyTakeaways: [
      "Elevated slatted wooden housing prevents foot rot and respiratory infections in goats.",
      "Combining leguminous forage (Leucaena/Gliricidia) with cassava peels doubles daily growth rates.",
      "Controlled breeding cycles prevent inbreeding and ensure year-round kid production."
    ],
    content: [
      "Goats are among the most resilient and economically viable livestock assets in West Africa. However, achieving high meat yield and low mortality requires transitioning from free-range scavenging to intensive or semi-intensive management.",
      "Proper housing is the foundation of successful goat production. Elevated slatted floors (60cm above ground level) allow urine and droppings to fall through, keeping animals dry and preventing bacterial foot rot and pneumonia.",
      "Nutrition plays a pivotal role in weight gain. While goats browse on wild shrubs, supplementing their diet with high-protein leguminous leaves (such as Gliricidia sepium and Leucaena) alongside energy-rich processed cassava peels delivers rapid weight expansion.",
      "Implementing structured vaccination against PPR (Peste des Petits Ruminants) and contagious caprine pleuropneumonia ensures 95%+ herd survival, safeguarding smallholder capital."
    ],
    tags: ["Goat Farming", "Small Ruminants", "West African Dwarf", "Nutrition"]
  },
  {
    id: "blog-5",
    slug: "preserving-feed-and-fodder-during-the-dry-season-in-west-africa",
    title: "Preserving Feed & Fodder During the Dry Season in West Africa",
    category: "Livestock Animals",
    readTime: "5 min read",
    author: "Samuel Oladele",
    authorTitle: "Senior Livestock Agronomist",
    authorImg: "/learn/blog/Avatar.png",
    date: "Jan 18, 2024",
    image: "/learn/blog/single2.jpg",
    heroImage: "/learn/blog/single2.jpg",
    featured: false,
    isPublished: true,
    excerpt: "Learn how silage making, hay baling, and crop residue treatment maintain animal weight and farmer income through dry months.",
    keyTakeaways: [
      "Silage preservation locks in green forage nutrients for up to 12 months without refrigeration.",
      "Urea-treated maize stover increases feed digestibility by 40% during dry spells.",
      "Year-round fodder storage prevents seasonal livestock weight loss and distress sales."
    ],
    content: [
      "Every year between November and March, livestock rearers across Nigeria face severe forage scarcity. As natural pastures dry up, animals suffer weight loss, reduced milk yield, and higher vulnerability to infections.",
      "Fodder preservation techniques like silage making offer a proven, cost-effective solution. By harvesting green pastures or forage sorghums at peak nutrient value and compacting them in airtight plastic bags or pits, farmers create nutritious silage that lasts through dry months.",
      "Crop residues—such as maize stalks, cowpea haulms, and groundnut vines—can also be cured into high-quality hay or treated with urea solution to break down dense fibers and enhance crude protein intake.",
      "By storing dry-season feed reserves during lush rainy months, cooperative farmers eliminate seasonal income crashes and maintain peak animal market value year-round."
    ],
    tags: ["Fodder Preservation", "Silage", "Dry Season Feed", "Agronomy"]
  },
  {
    id: "blog-6",
    slug: "micro-credit-and-financial-management-for-agribusiness-cooperatives",
    title: "Micro-Credit & Financial Management for Agribusiness Cooperatives",
    category: "Business",
    readTime: "6 min read",
    author: "Dr. Amina Bello",
    authorTitle: "EEWYLA Lead Coordinator",
    authorImg: "/learn/blog/Avatar.png",
    date: "Feb 05, 2024",
    image: "/learn/blog/single.png",
    heroImage: "/learn/blog/single.png",
    featured: false,
    isPublished: true,
    excerpt: "Strategies for managing cooperative dues, revolving credit funds, and loan repayment structures for sustainable agribusiness expansion.",
    keyTakeaways: [
      "Transparent ledger accounting builds trust among cooperative members and commercial banks.",
      "Revolving credit pools enable members to purchase breeding stock without high bank interest rates.",
      "Off-taker purchase agreements act as collateral for securing institutional loans."
    ],
    content: [
      "Access to working capital remains one of the greatest obstacles facing youth and female agribusiness entrepreneurs in emerging markets. Traditional commercial banks often view small-scale livestock farming as high risk.",
      "Agricultural cooperative societies bridge this financial gap by creating self-sustaining revolving credit pools. Monthly member contributions and registration fees form a capital base from which members borrow at single-digit interest rates.",
      "Digital bookkeeping and transparent financial governance are critical. When cooperatives maintain clear digital records of member savings, loan disbursements, and repayment timelines, commercial micro-finance institutions are eager to match their capital.",
      "Furthermore, when a cooperative secures a formal off-take agreement with major meat processing companies, that contract serves as bankable security—unlocking institutional credit lines for herd expansion and processing machinery."
    ],
    tags: ["Cooperative Credit", "Micro Finance", "Agribusiness Growth", "Financial Literacy"]
  }
];

import { getApiBase } from "@/lib/api";

const STORAGE_KEY = "oriyon_blog_posts_v1";
const API_BASE = getApiBase();

export function getStoredBlogPosts(): BlogPost[] {
  if (typeof window === "undefined") return defaultBlogPosts;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBlogPosts));
      return defaultBlogPosts;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultBlogPosts;
  } catch (e) {
    console.error("Error reading blog posts from storage", e);
    return defaultBlogPosts;
  }
}

export function saveStoredBlogPosts(posts: BlogPost[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    window.dispatchEvent(new Event("oriyon_blog_posts_updated"));
  } catch (e) {
    console.error("Error saving blog posts to storage", e);
  }
}

export async function fetchBlogPostsFromApi(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE}/blog`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredBlogPosts(data);
        return data;
      }
    }
  } catch (e) {
    console.warn("Could not fetch blog posts from API gateway, using local store fallback", e);
  }
  return getStoredBlogPosts();
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  if (!slug) return undefined;
  const posts = getStoredBlogPosts();
  const target = slug.toLowerCase().replace(/-+/g, "-");
  return posts.find((post) => {
    const postSlug = post.slug.toLowerCase().replace(/-+/g, "-");
    return postSlug === target;
  });
}

export async function fetchBlogPostBySlugFromApi(slug: string): Promise<BlogPost | null> {
  if (!slug) return null;
  try {
    const res = await fetch(`${API_BASE}/blog/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return data;
      }
    }
  } catch (e) {
    console.warn("[blogData] Could not fetch blog post by slug from API:", e);
  }
  return getBlogPostBySlug(slug) || null;
}

export function getRelatedBlogPosts(currentSlug: string, category?: string, limit = 3): BlogPost[] {
  const posts = getStoredBlogPosts().filter((p) => p.isPublished !== false);
  const otherPosts = posts.filter((p) => p.slug !== currentSlug);
  if (category) {
    const sameCat = otherPosts.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    if (sameCat.length >= limit) return sameCat.slice(0, limit);
    const remaining = otherPosts.filter((p) => p.category.toLowerCase() !== category.toLowerCase());
    return [...sameCat, ...remaining].slice(0, limit);
  }
  return otherPosts.slice(0, limit);
}
