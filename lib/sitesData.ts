// lib/sitesData.ts

export interface PhysicalSite {
  id: string;
  name: string;
  code: string;
  institution: string;
  campus: string;
  address: string;
  city: string;
  state: string;
  description: string;
  googleMapsUrl: string;
  coordinatorName: string;
  coordinatorPhone: string;
  coordinatorEmail: string;
  badgeColor: string;
  latitude: number;
  longitude: number;
  maxRadiusMeters: number;
}

export const PHYSICAL_SITES: PhysicalSite[] = [
  {
    id: "lautech-ogbomosho",
    name: "LAUTECH Ogbomoso",
    code: "LAUTECH-OGB",
    institution: "Ladoke Akintola University of Technology",
    campus: "Main Campus, Ogbomoso",
    address: "Faculty of Agricultural Sciences, LAUTECH Main Campus, Ogbomoso",
    city: "Ogbomoso",
    state: "Oyo State",
    description: "Primary practical site for Ogbomoso North/South, Surulere, Oriire and surrounding zones.",
    googleMapsUrl: "https://maps.google.com/?q=LAUTECH+Ogbomoso",
    coordinatorName: "Site Coordinator (Ogbomoso)",
    coordinatorPhone: "+234 800 674 9661",
    coordinatorEmail: "ogbomosho.site@oriyoninternational.com",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    latitude: 8.1610,
    longitude: 4.2625,
    maxRadiusMeters: 500,
  },
  {
    id: "lautech-iseyin",
    name: "LAUTECH Iseyin",
    code: "LAUTECH-ISY",
    institution: "Ladoke Akintola University of Technology",
    campus: "Iseyin Campus",
    address: "College of Agricultural Sciences & Renewable Natural Resources, Iseyin",
    city: "Iseyin",
    state: "Oyo State",
    description: "Practical site for Oke-Ogun region including Iseyin, Kajola, Iwajowa, Itesiwaju & Saki.",
    googleMapsUrl: "https://maps.google.com/?q=LAUTECH+Iseyin+Campus",
    coordinatorName: "Site Coordinator (Iseyin)",
    coordinatorPhone: "+234 800 674 9662",
    coordinatorEmail: "iseyin.site@oriyoninternational.com",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    latitude: 7.9689,
    longitude: 3.5972,
    maxRadiusMeters: 500,
  },
  {
    id: "ui-ibadan",
    name: "University of Ibadan",
    code: "UI-IBADAN",
    institution: "University of Ibadan",
    campus: "UI Main Campus, Ibadan",
    address: "Teaching & Research Farm, Faculty of Agriculture, University of Ibadan",
    city: "Ibadan",
    state: "Oyo State",
    description: "Practical site for Ibadan metropolis, Oyo Central/South zones, Akinyele & Egbeda.",
    googleMapsUrl: "https://maps.google.com/?q=University+of+Ibadan+Faculty+of+Agriculture",
    coordinatorName: "Site Coordinator (UI Ibadan)",
    coordinatorPhone: "+234 800 674 9663",
    coordinatorEmail: "ibadan.site@oriyoninternational.com",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/30",
    latitude: 7.4447,
    longitude: 3.8997,
    maxRadiusMeters: 500,
  },
];

export const GROUP_PRACTICAL_DAYS: Record<string, string> = {
  "group a": "Monday",
  "group b": "Tuesday",
  "group c": "Wednesday",
  "group d": "Thursday",
  "group e": "Friday",
};

export const MAX_GROUP_CAPACITY = 50;

/**
 * Calculates distance in meters between two geographical coordinates (latitude & longitude)
 * using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function getPhysicalSiteById(id?: string | null): PhysicalSite | null {
  if (!id || id.trim() === "" || id === "unassigned" || id === "null" || id === "undefined") return null;
  const found = PHYSICAL_SITES.find(
    (s) => s.id.toLowerCase() === id.toLowerCase() || s.name.toLowerCase() === id.toLowerCase() || s.code.toLowerCase() === id.toLowerCase()
  );
  return found || null;
}

export function inferPhysicalSiteFromInstitutionOrLga(
  institution?: string | null,
  lga?: string | null
): PhysicalSite | null {
  return null;
}

export function getGroupPracticalDay(groupName?: string | null): string {
  if (!groupName) return "Monday";
  const normalized = groupName.trim().toLowerCase();
  for (const [gKey, day] of Object.entries(GROUP_PRACTICAL_DAYS)) {
    if (normalized.includes(gKey)) return day;
  }
  return "Monday";
}
