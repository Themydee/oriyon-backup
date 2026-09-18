"use client"; 

import { usePathname } from "next/navigation";
import BackToTop from "./backToTop";

export default function ConditionalBackToTop() {
  const pathname = usePathname();

  if (pathname.startsWith("/learn/lms") || pathname.startsWith("/auth") || pathname.startsWith("/apply") || pathname.startsWith("/admin")) return null;

  return <BackToTop/>;
}