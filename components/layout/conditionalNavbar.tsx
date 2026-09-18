"use client"; 

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  if (pathname.startsWith("/learn/lms") || pathname.startsWith("/auth") || pathname.startsWith("/apply") || pathname.startsWith("/admin") || pathname.startsWith("/cooperative")) return null;

  return <Navbar />;
}   