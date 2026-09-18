"use client"; 

import { usePathname } from "next/navigation";
import TaglineBar from "./TaglineBar";

export default function ConditionalTagLineBar() {
  const pathname = usePathname();

  if (pathname.startsWith("/learn/lms") || pathname.startsWith("/auth") || pathname.startsWith("/apply") || pathname.startsWith("/admin")) return null;

  return <TaglineBar />;
}