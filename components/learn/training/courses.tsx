import Image from 'next/image';
import Link from 'next/link';

const courses = [
    {
        title: "Small Ruminant Breeding Masterclass",
        description: "Equips graduates to operate sustainable farms, access traceable stock certification, and scale their businesses to meet local and international demand.",
        image: "/learn/training/c1.png",
    },
    {
        title: "Farm Infrastructure Development Training",
        description: "Enables participants to construct facilities that enhance animal health, productivity, and long-term sustainability.",
        image: "/learn/training/c2.png",
    },
    {
        title: "Feed and Forage Optimization Course",
        description: "Provides expertise to produce healthier animals while driving down feed-related expenses, ensuring greater profitability.",
        image: "/learn/training/c3.png",
    },
    {
        title: "Veterinary Support and Disease Management Training",
        description: "Minimizes livestock losses and ensures regulatory compliance, boosting reputation and business potential.",
        image: "/learn/training/c4.png",
    },
    {
        title: "Entrepreneurship and Business Setup Program",
        description: "Prepares participants as registered business owners, ready to tap into lucrative markets and secure long-term success.",
        image: "/learn/training/c5.png",
    },
    {
        title: "Cluster Management and Cooperative Formation Workshop",
        description: "Empowers participants to lead productive clusters that attract investment and maximize profitability.",
        image: "/learn/training/c6.png",
    },
    {
        title: "Advanced Small Ruminant Processing and Value Addition Course",
        description: "Enables graduates to create premium products with international appeal, accessing high-value markets.",
        image: "/learn/training/c7.png",
    },
    {
        title: "Livestock Exportation and Trade Certification Program",
        description: "Prepares participants to export livestock and products to global markets.",
        image: "/learn/training/c8.png",
    },
];

export default function ShortCourses() {
    return (
        <section className="bg-white py-16 px-6 md:px-12 lg:px-24">
            <div className="max-w-7xl mx-auto mb-12">
                <h2 className="text-4xl font-bold text-[#0e2323] mb-4">Short Courses</h2>
                <div className="flex flex-wrap gap-6 text-gray-600 font-medium">
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-black rounded-full" /> Self-paced
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-black rounded-full" /> Paid
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-black rounded-full" /> Certificates available
                    </span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course, index) => (
                    <div
                        key={index}
                        className="bg-[#e0f7f6] rounded-[2.5rem] px-6 py-10 flex flex-col min-h-[580px] transition-transform hover:scale-[1.02]"
                    >
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-6">
                            <Image
                                src={course.image}
                                alt={course.title}
                                fill
                                className="object-cover"
                            />
                        </div>

                        <div className="flex-grow flex flex-col">
                            <h3 className="text-[#0e2323] text-xl font-bold mb-3 leading-tight">
                                {course.title}
                            </h3>
                            <p className="text-gray-700 text-2    l leading-relaxed mb-6">
                                {course.description}
                            </p>
                        </div>

                        <Link
                            href="/contact"
                            className="w-full bg-[#03d8d6] text-[#064242] font-black py-4 rounded-full hover:bg-white transition-all shadow-sm uppercase tracking-widest text-xs flex items-center justify-center mt-auto"
                        >
                            Book
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}