"use client"; 

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/learn/lms") || pathname.startsWith("/auth") || pathname.startsWith("/apply") || pathname.startsWith("/admin")) return null;

  return <Footer />;
}