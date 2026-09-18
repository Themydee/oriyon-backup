"use client";

import { useEffect, useState } from "react";
import { ChevronDown, TextAlignStart, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [isInitiativesOpen, setIsInitiativesOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;
  const isStartsWith = (href: string) => pathname.startsWith(href);

  const linkClass = (href: string) =>
    isActive(href)
      ? "text-[12px] xl:text-[13px] 2xl:text-sm font-bold text-[#00D1C1] whitespace-nowrap transition"
      : "text-[12px] xl:text-[13px] 2xl:text-sm font-bold text-gray-900 whitespace-nowrap transition hover:text-[#00D1C1]";

  return (
    <header className="fixed top-0 left-0 w-full z-[100] font-sora transition-all duration-300 py-0">
      <div className="mx-auto transition-all duration-300 max-w-full">
        <nav className="flex items-center justify-between transition-all duration-300 bg-white shadow-md rounded-none px-6 md:px-12 py-3 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.svg"
              alt="Oriyon Logo"
              width={120}
              height={40}
              className="w-[100px] xl:w-[120px] h-auto shrink-0"
              priority
            />
          </Link>

          <ul className="hidden lg:flex items-center lg:gap-2.5 xl:gap-5 2xl:gap-8">
            <li><Link href="/" className={linkClass("/")}>Home</Link></li>
            <li><Link href="/about" className={linkClass("/about")}>What We Do</Link></li>
            <li><Link href="/model" className={linkClass("/model")}>Our Model</Link></li>

            {/* Our Initiatives Dropdown */}
            <li className="relative group cursor-pointer py-2">
              <span
                className={`flex items-center gap-1 text-[12px] xl:text-[13px] 2xl:text-sm font-bold transition whitespace-nowrap ${
                  isActive("/eewyla") || isActive("/rumer")
                    ? "text-[#00D1C1]"
                    : "text-gray-900 hover:text-[#00D1C1]"
                }`}
              >
                Our Initiatives <ChevronDown size={14} />
              </span>
              <div className="absolute left-0 top-[100%] z-50 pt-3 hidden w-56 group-hover:block">
                <div className="rounded-xl bg-white p-3 shadow-xl border border-gray-50">
                  <Link
                    href="/eewyla"
                    className={`block rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
                      isActive("/eewyla")
                        ? "bg-teal-50 text-[#00D1C1] font-bold"
                        : "text-gray-700 hover:bg-teal-50 hover:text-[#00D1C1]"
                    }`}
                  >
                    EEWYLA
                  </Link>
                  {/* <Link
                    href="/rumer"
                    className={`block rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
                      isActive("/rumer")
                        ? "bg-teal-50 text-[#00D1C1] font-bold"
                        : "text-gray-700 hover:bg-teal-50 hover:text-[#00D1C1]"
                    }`}
                  >
                    ÒYÍÍN
                  </Link> */}
                </div>
              </div>
            </li>

            {/* The Knowledge Hub Dropdown */}
            <li className="relative group cursor-pointer py-2">
              <Link
                href="/learn/training"
                className={`flex items-center gap-1 text-[#00D1C1] text-[12px] xl:text-[13px] 2xl:text-sm font-bold transition whitespace-nowrap ${isStartsWith("/learn") ? "text-[#00D1C1]" : "text-gray-900 hover:text-[#00D1C1]"}`}
              >
                The Knowledge Hub <ChevronDown size={14} />
              </Link>
              <div className="absolute left-0 top-[100%] z-50 pt-3 hidden w-56 group-hover:block">
                <div className="rounded-xl bg-white p-3 shadow-xl border border-gray-50">
                  <Link
                    href="/learn/training"
                    className={`block rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
                      isActive("/learn/training")
                        ? "bg-teal-50 text-[#00D1C1] font-bold"
                        : "text-gray-700 hover:bg-teal-50 hover:text-[#00D1C1]"
                    }`}
                  >
                    Our Training Program
                  </Link>
                  <Link
                    href="/learn/blog"
                    className={`block rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
                      isActive("/learn/blog")
                        ? "bg-teal-50 text-[#00D1C1] font-bold"
                        : "text-gray-700 hover:bg-teal-50 hover:text-[#00D1C1]"
                    }`}
                  >
                    Our Blog
                  </Link>
                  <Link
                    href="/learn/tutorials"
                    className={`block rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
                      isActive("/learn/tutorials")
                        ? "bg-teal-50 text-[#00D1C1] font-bold"
                        : "text-gray-700 hover:bg-teal-50 hover:text-[#00D1C1]"
                    }`}
                  >
                    🎥 Video Guides
                  </Link>
                  <Link
                    href="/learn/lms/community"
                    className={`block rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
                      isActive("/learn/lms/community")
                        ? "bg-teal-50 text-[#00D1C1] font-bold"
                        : "text-gray-700 hover:bg-teal-50 hover:text-[#00D1C1]"
                    }`}
                  >
                    💬 Community Q&A Hub
                  </Link>
                  <Link
                    href="/learn/lms"
                    className={`block rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
                      isActive("/learn/lms")
                        ? "bg-teal-50 text-[#00D1C1] font-bold"
                        : "text-gray-700 hover:bg-teal-50 hover:text-[#00D1C1]"
                    }`}
                  >
                    EEWYLA Programme Portal
                  </Link>
                </div>
              </div>
            </li>

            <li><Link href="/shop" className={`text-[#00D1C1] ${isStartsWith("/shop") ? "text-[12px] xl:text-[13px] 2xl:text-sm font-bold text-[#00D1C1] whitespace-nowrap transition" : "text-[12px] xl:text-[13px] 2xl:text-sm font-bold text-gray-900 whitespace-nowrap transition hover:text-[#00D1C1]"}`}>Shop</Link></li>
            <li><Link href="/contact" className={linkClass("/contact")}>Contact</Link></li>
          </ul>

          <button
            className="lg:hidden p-2 text-gray-900"
            onClick={() => setIsOpen(true)}
          >
            <TextAlignStart size={28} />
          </button>

          <div className="relative hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
            <Link
              href="/cooperative"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#00D1C1] px-3 py-1.5 xl:px-5 xl:py-2 text-[12px] xl:text-[13px] 2xl:text-sm font-bold text-gray-900 transition hover:bg-teal-50 whitespace-nowrap"
            >
              Join a Cooperative
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded-full bg-[#00D1C1] px-3 py-2 xl:px-5 xl:py-2.5 text-[12px] xl:text-[13px] 2xl:text-sm font-bold text-black transition hover:bg-[#00b8aa] whitespace-nowrap"
            >
              Apply for EEWYLA
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-[110] bg-white transition-transform duration-300 lg:hidden ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-12">
            <Image src="/logo.svg" alt="Logo" width={110} height={35} />
            <button onClick={() => setIsOpen(false)} className="text-gray-900">
              <X size={26} />
            </button>
          </div>

          <nav className="flex flex-col gap-6 text-xl font-bold text-[#002d25]">
            <Link href="/" onClick={() => setIsOpen(false)} className={`transition ${isActive("/") ? "text-[#00D1C1]" : "text-[#002d25] hover:text-[#00D1C1]"}`}>Home</Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className={`transition ${isActive("/about") ? "text-[#00D1C1]" : "text-[#002d25] hover:text-[#00D1C1]"}`}>What We Do</Link>
            <Link href="/model" onClick={() => setIsOpen(false)} className={`transition ${isActive("/model") ? "text-[#00D1C1]" : "text-[#002d25] hover:text-[#00D1C1]"}`}>Our Model</Link>

            {/* Mobile Our Initiatives Accordion */}
            <div className="flex flex-col">
              <button
                className={`flex items-center gap-2 w-full text-left transition ${
                  isActive("/eewyla") || isActive("/rumer") ? "text-[#00D1C1]" : "text-[#002d25]"
                }`}
                onClick={() => setIsInitiativesOpen(!isInitiativesOpen)}
              >
                Our Initiatives <ChevronDown className={`transition-transform ${isInitiativesOpen ? "rotate-180" : ""}`} />
              </button>
              {isInitiativesOpen && (
                <div className="flex flex-col gap-4 pl-4 mt-4 text-base font-medium">
                  <Link
                    href="/eewyla"
                    onClick={() => setIsOpen(false)}
                    className={`transition ${isActive("/eewyla") ? "text-[#00D1C1] font-bold" : "text-gray-600 hover:text-[#00D1C1]"}`}
                  >
                    EEWYLA
                  </Link>
                  {/* <Link
                    href="/rumer"
                    onClick={() => setIsOpen(false)}
                    className={`transition ${isActive("/rumer") ? "text-[#00D1C1] font-bold" : "text-gray-600 hover:text-[#00D1C1]"}`}
                  >
                    ÒYÍÍN
                  </Link> */}
                </div>
              )}
            </div>

            {/* Mobile Knowledge Hub Accordion */}
            <div className="flex flex-col">
              <button
                className={`flex items-center text-[#00D1C1] gap-2 w-full text-left transition ${isStartsWith("/learn") ? "text-[#00D1C1]" : "text-[#002d25]"}`}
                onClick={() => setIsLearnOpen(!isLearnOpen)}
              >
                The Knowledge Hub <ChevronDown className={`transition-transform ${isLearnOpen ? "rotate-180" : ""}`} />
              </button>
              {isLearnOpen && (
                <div className="flex flex-col gap-4 pl-4 mt-4 text-base font-medium">
                  <Link
                    href="/learn/training"
                    onClick={() => setIsOpen(false)}
                    className={`transition ${isActive("/learn/training") ? "text-[#00D1C1] font-bold" : "text-gray-600 hover:text-[#00D1C1]"}`}
                  >
                    Our Training Program
                  </Link>
                  <Link
                    href="/learn/blog"
                    onClick={() => setIsOpen(false)}
                    className={`transition ${isActive("/learn/blog") ? "text-[#00D1C1] font-bold" : "text-gray-600 hover:text-[#00D1C1]"}`}
                  >
                    Our Blog
                  </Link>
                  <Link
                    href="/learn/tutorials"
                    onClick={() => setIsOpen(false)}
                    className={`transition ${isActive("/learn/tutorials") ? "text-[#00D1C1] font-bold" : "text-gray-600 hover:text-[#00D1C1]"}`}
                  >
                    🎥 Video Guides
                  </Link>
                  <Link
                    href="/learn/lms/community"
                    onClick={() => setIsOpen(false)}
                    className={`transition ${isActive("/learn/lms/community") ? "text-[#00D1C1] font-bold" : "text-gray-600 hover:text-[#00D1C1]"}`}
                  >
                    💬 Community Q&A Hub
                  </Link>
                  <Link
                    href="/learn/lms"
                    onClick={() => setIsOpen(false)}
                    className={`transition ${isActive("/learn/lms") ? "text-[#00D1C1] font-bold" : "text-gray-600 hover:text-[#00D1C1]"}`}
                  >
                    EEWYLA Programme Portal
                  </Link>
                </div>
              )}
            </div>

            <Link href="/shop" onClick={() => setIsOpen(false)} className={`text-[#00D1C1] transition ${isStartsWith("/shop") ? "text-[#00D1C1]" : "text-[#002d25] hover:text-[#00D1C1]"}`}>Shop</Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className={`transition ${isActive("/contact") ? "text-[#00D1C1]" : "text-[#002d25] hover:text-[#00D1C1]"}`}>Contact</Link>
          </nav>

          <div className="flex flex-col gap-3 mt-auto">
            <Link
              href="/cooperative"
              onClick={() => setIsOpen(false)}
              className="w-full border-2 border-[#00D1C1] text-[#002d25] font-bold py-4 rounded-full text-[10px] md:text-sm uppercase tracking-wide text-center transition hover:bg-teal-50"
            >
              Join a Cooperative
            </Link>
            <Link
              href="/apply"
              onClick={() => setIsOpen(false)}
              className="w-full bg-[#00D1C1] text-[#002d25] font-bold py-4 rounded-full text-[10px] md:text-sm uppercase tracking-wide text-center transition hover:bg-[#00b8aa]"
            >
              Apply for EEWYLA Training
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}