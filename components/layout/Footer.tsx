import Image from "next/image";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const XIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const Footer = () => {
    return (
        <footer className="bg-[#061e1a] text-white pt-16 md:pt-20 pb-20 relative overflow-hidden font-sora">
            <div className="container mx-auto px-6 relative z-10">

                <div className="mb-12 md:hidden">
                    <Image
                        src="/footer-logo.png"
                        alt="Oriyon Logo"
                        width={150}
                        height={50}
                        className="mb-6"
                    />
                    <p className="text-gray-300 text-base leading-relaxed max-w-sm">
                        Fostering growth, leadership, and lasting impact for women and youth in Agriculture across Africa.
                    </p>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 gap-y-12 gap-x-4 md:gap-12 mb-16">

                    <div className="hidden md:block col-span-1">
                        <Image
                            src="/footer-logo.png"
                            alt="Oriyon Logo"
                            width={150}
                            height={50}
                            className="mb-6"
                        />
                        <p className="text-gray-300 text-sm leading-relaxed mb-8">
                            Fostering growth, leadership, and lasting impact for women and youth in Agriculture across Africa.
                        </p>
                        <div className="h-[1px] bg-gray-200 w-full mb-6" />
                        <p className="text-xs text-gray-400">
                            Copyright © 2025 ORIYON INTERNATIONAL - All Rights Reserved.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm md:text-lg mb-6">Pages</h4>
                        <ul className="space-y-4 text-gray-400 md:text-gray-300 text-[10px] md:text-sm">
                            <li><Link href="/" className="hover:text-[#00D1C1] transition">Home</Link></li>
                            <li><Link href="/model" className="hover:text-[#00D1C1] transition">Our Model</Link></li>
                            <li><Link href="/eewyla" className="hover:text-[#00D1C1] transition">EEWYLA</Link></li>
                            <li><Link href="/learn/training" className="hover:text-[#00D1C1] transition">Learn</Link></li>
                            <li><Link href="/learn/lms/community" className="hover:text-[#00D1C1] transition">Community Q&A</Link></li>
                            <li><a href="/shop" className="hover:text-[#00D1C1] transition">Shop</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm md:text-lg mb-6">Company</h4>
                        <ul className="space-y-4 text-gray-400 md:text-gray-300 text-[10px] md:text-sm">
                            <li><Link href="/about" className="hover:text-[#00D1C1] transition">What we do</Link></li>
                            <li><Link href="/#faq" className="hover:text-[#00D1C1] transition">FAQs</Link></li>
                            <li><Link href="/teams" className="hover:text-[#00D1C1] transition">Teams</Link></li>
                            <li><Link href="/contact" className="hover:text-[#00D1C1] transition">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm md:text-lg mb-6">Legal</h4>
                        <ul className="space-y-4 text-gray-400 md:text-gray-300 text-[10px] md:text-sm">
                            <li><Link href="/privacy" className="hover:text-[#00D1C1] transition">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-[#00D1C1] transition">Terms of Use</Link></li>
                            <li><Link href="/cookies" className="hover:text-[#00D1C1] transition">Cookie Notice</Link></li>
                            <li>
                                <button
                                    onClick={() => window.dispatchEvent(new Event("open-cookie-preferences"))}
                                    className="hover:text-[#00D1C1] transition text-left cursor-pointer bg-transparent border-none p-0"
                                >
                                    Cookie Preferences
                                </button>
                            </li>
                            <li><Link href="/data-rights" className="hover:text-[#00D1C1] transition">Data Subject Rights</Link></li>
                            <li><Link href="/complaints" className="hover:text-[#00D1C1] transition">Grievance Redress</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col gap-8 md:hidden mb-12">
                    <div>
                        <h4 className="font-bold text-lg mb-6">Follow us</h4>
                        <div className="flex gap-6">
                            <Link href="#" className="text-white hover:text-[#00D1C1] transition"><Facebook size={24} /></Link>
                            <Link href="https://x.com/oriyon_intl?s=21"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white hover:text-[#00D1C1] transition"><XIcon size={20} /></Link>
                            <Link
                                href="https://www.instagram.com/oriyoninternational?igsh=MXFmampwcWU2bnhlOQ=="
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white hover:text-[#00D1C1] transition"
                            >
                                <Instagram size={24} />
                            </Link>
                            <Link 
                                href="https://www.linkedin.com/company/oriyon-international-ltd/posts/?feedView=all" 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white hover:text-[#00D1C1] transition"><Linkedin size={24} />
                            </Link>
                        </div>
                    </div>
                    <div className="h-[1px] bg-white/10 w-full" />
                    <p className="text-[10px] text-gray-400">
                        Copyright © 2025 ORIYON INTERNATIONAL - All Rights Reserved.
                    </p>
                </div>

                <div className="hidden md:block mb-16">
                    <h4 className="font-bold text-lg mb-6">Follow us</h4>
                    <div className="flex gap-5">
                        <Link href="#" className="hover:text-[#00D1C1] transition"><Facebook size={24} /></Link>
                        <Link href="https://x.com/oriyon_intl?s=21"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-[#00D1C1] transition"><XIcon size={20} />
                        </Link>
                        <Link
                            href="https://www.instagram.com/oriyoninternational?igsh=MXFmampwcWU2bnhlOQ=="
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-[#00D1C1] transition"
                        >
                            <Instagram size={24} />
                        </Link>
 <Link 
                                href="https://www.linkedin.com/company/oriyon-international-ltd/posts/?feedView=all" 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white hover:text-[#00D1C1] transition"><Linkedin size={24} />
                            </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;