export interface ReadingMaterial {
  id: string;
  title: string;
  subtitle: string;
  category: "Livestock Management" | "Cooperative Finance" | "Digital Traceability" | "Feed & Fodder" | "Agribusiness Marketing" | "Policy & Compliance";
  author: string;
  readTime: string;
  type: "PDF Guide" | "Article" | "Research Paper" | "Handbook";
  chapterReference?: string; // e.g. "Part 1, Chapter 12 (Sections 12.1 – 12.4)"
  coverImage?: string;
  summary: string;
  content: string;
  downloadUrl?: string;
  externalUrl?: string;
  featured?: boolean;
  recommendedWeek: number; // Week 1 to Week 12
  publishedAt: string;
}

export const INITIAL_READINGS: ReadingMaterial[] = [
  {
    id: "reading-eewyla-master-manual",
    recommendedWeek: 1,
    title: "EEWYLA Programme Master Course Textbook & Field Handbook",
    subtitle: "Official 13-Week Curriculum Handbook, Partner Frameworks & Resource Disbursement Guide",
    category: "Livestock Management",
    author: "Oriyon International (ILRI · Heifer Int. · Sterling Bank · Leadway)",
    readTime: "15 min read",
    type: "Handbook",
    chapterReference: "Full Course Textbook (Parts 1–5 | Chapters 1–21)",
    coverImage: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80",
    summary: "Official Master Manual for the Economic Empowerment of Women & Youth in Livestock Agriculture (EEWYLA) Programme. Covers the complete 13-Week Curriculum roadmap, partner institution roles, and resource disbursement rules.",
    content: `
# Oriyon International Limited — EEWYLA Programme
## Economic Empowerment of Women & Youth in Livestock Agriculture

### MASTER TRAINING MANUAL
**13-Week Curriculum | Weeks 1–13**
*Cohort A — Commencing February 2026*
**Training Duration**: 13 Weeks | **Resource Disbursement**: 2 Weeks Post-Completion

---

### 📖 Textbook Reference Guide
* **Part 1**: Small Ruminant Husbandry & Housing Facilities (Chapters 1–12)
* **Part 2**: Goat Nutrition, Pasture & Feed Management (Chapters 13–15)
* **Part 3**: General Herd Health, Immunity & Biosecurity (Chapters 2–5)
* **Part 4**: Breeding Systems, Kid Rearing & Value Addition (Chapters 16–17 & 19.8)
* **Part 5**: Cooperative Economics, Farm Ledgers & Insurance (Chapters 18–21)

---

### 1. Programme Executive Summary
The **Economic Empowerment of Women & Youth in Livestock Agriculture (EEWYLA) Programme** is a flagship agribusiness initiative executed by **Oriyon International Limited** to build sustainable livestock enterprises across Nigeria. Through structured digital and practical learning, participants acquire end-to-end expertise in goat and sheep management, cooperative credit structures, biosecurity, and commercial off-taker markets.

---

### 2. Institutional & Technical Partners
Delivered in strategic partnership with leading international and financial institutions:
- **ILRI** (International Livestock Research Institute) — Technical research & livestock genetic standards
- **Heifer International** — Agribusiness empowerment & community livestock assets
- **RUMER Technologies** — Digital identification, RFID tagging & livestock traceability infrastructure
- **Sterling Bank** — Agribusiness banking, thrift accounts & low-interest credit lines
- **Leadway Assurance** — Livestock index insurance & agricultural risk mitigation

**Government Endorsements**:
- Endorsed by the **Federal Ministry of Livestock Development**
- Endorsed by the **Oyo State Ministry of Agriculture**

---

### 3. Training & Resource Disbursement Schedule
- **Curriculum Duration**: 13 Weeks of blended online LMS modules and weekly practical field check-ins.
- **Resource Disbursement**: Starter livestock assets, feed allocations, and cooperative credit access are disbursed exactly **2 Weeks Post-Completion** to verified, fully compliant graduates.
    `,
    downloadUrl: "/downloads/EEWYLA_Official_Course_Textbook.pdf",
    featured: true,
    publishedAt: "2026-02-01",
  },
  {
    id: "reading-week-1",
    recommendedWeek: 1,
    title: "Week 1: Small Ruminant Management & Housing Facilities",
    subtitle: "Housing, ventilation, slatted floor construction, and breed selection for WAD & Red Sokoto goats",
    category: "Livestock Management",
    author: "Dr. O. A. Adeleke & EEWYLA Livestock Team",
    readTime: "12 min read",
    type: "PDF Guide",
    chapterReference: "Part 1, Chapter 1 & Chapter 12 (Sections 12.1 – 12.4)",
    coverImage: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80",
    summary: "Week 1 textbook reading covering elevated slatted housing construction, breed adaptability (WAD vs Red Sokoto), stocking density, and pen ventilation.",
    content: `
# Week 1 Recommended Reading: Small Ruminant Management & Housing

### 📖 Textbook Reference: Part 1, Chapter 1 & Chapter 12 (Sections 12.1 – 12.4)
*Check Chapter 12 of the EEWYLA Official Course Textbook for detailed floor blueprints and feeder dimensions.*

---

## 1. Introduction & Breed Selection (Chapter 1)
Small ruminant production (goats and sheep) forms a critical component of rural livelihoods in Nigeria. The West African Dwarf (WAD) goat is renowned for its high resistance to trypanosomiasis and adaptability to humid forest zones, while northern breeds such as the Red Sokoto excel in drier savannah climates.

## 2. Housing & Handling Facilities (Chapter 12)
Proper housing reduces kid mortality rates by up to 40%. Key requirements include:
- **Elevated Slatted Floors (Section 12.1)**: Keep animals 0.5m to 1m off the ground to ensure urine and droppings drop through, preventing foot rot and parasite re-infection.
- **Cross Ventilation**: Open mesh side walls above 1m height ensure constant fresh airflow.
- **Stocking Density**: Provide at least 1.2 to 1.5 square meters per adult goat.
- **Feeder & Waterer Placement (Section 12.2)**: Position feed troughs outside pens with head-slots to eliminate feed trampling and waste.
    `,
    downloadUrl: "/downloads/EEWYLA_Official_Course_Textbook.pdf",
    featured: false,
    publishedAt: "2026-08-01",
  },
  {
    id: "reading-week-2",
    recommendedWeek: 2,
    title: "Week 2: Cooperative Savings, Credit & Financial Discipline",
    subtitle: "Managing weekly thrift contributions, credit eligibility ratios (3x savings), and group guarantees",
    category: "Cooperative Finance",
    author: "Oriyon International Cooperative Directorate",
    readTime: "10 min read",
    type: "Handbook",
    chapterReference: "Part 5, Chapter 18 (Sections 18.1 – 18.3)",
    coverImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    summary: "Week 2 financial handbook detailing weekly equity accumulation, member loan eligibility ratios (up to 3x savings), peer cluster cross-guarantees, and transparent record keeping.",
    content: `
# Week 2 Recommended Reading: Cooperative Savings & Financial Discipline

### 📖 Textbook Reference: Part 5, Chapter 18 (Sections 18.1 – 18.3)
*Check Chapter 18 of the EEWYLA Official Course Textbook for cooperative bylaws and loan application guidelines.*

---

## 1. The Power of Cooperative Economics (Section 18.1)
Cooperative societies aggregate individual financial strength into substantial collective capital. As an EEWYLA cooperative member, your weekly contributions build institutional trust, unlock low-interest agribusiness credit, and secure joint input purchasing power.

## 2. Weekly Thrift & Equity Accumulation (Section 18.2)
- **Minimum Weekly Contribution**: Every member contributes their designated weekly equity share into the cooperative master account.
- **Equity Ratio**: Members can access up to 3x their accumulated savings after 12 consecutive weeks of uninterrupted contributions.

## 3. Group Peer Guarantee Mechanism (Section 18.3)
- Members form **Cluster Credit Groups** of 5 to 7 members.
- Each group member cross-guarantees loan applications within their cluster, ensuring mutual accountability.
    `,
    downloadUrl: "/downloads/EEWYLA_Official_Course_Textbook.pdf",
    featured: false,
    publishedAt: "2026-08-05",
  },
  {
    id: "reading-week-3",
    recommendedWeek: 3,
    title: "Week 3: Digital Livestock Identification & Traceability Protocols",
    subtitle: "RFID ear tagging standards, mobile QR code scanning, and centralized database logging",
    category: "Digital Traceability",
    author: "National Agricultural Technology Office",
    readTime: "8 min read",
    type: "PDF Guide",
    chapterReference: "Part 1, Chapter 3 & Part 5, Chapter 20 (Sections 20.1 – 20.2)",
    coverImage: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80",
    summary: "Week 3 textbook guide on electronic RFID ear tags, mobile QR scanning, and centralized record keeping to eliminate animal theft and command premium prices with institutional off-takers.",
    content: `
# Week 3 Recommended Reading: Digital Livestock Identification & Traceability

### 📖 Textbook Reference: Part 1, Chapter 3 & Part 5, Chapter 20 (Sections 20.1 – 20.2)
*Check Chapter 20 of the EEWYLA Official Course Textbook for RUMER Technologies RFID tag application steps.*

---

## 1. Why Digital Traceability Matters (Section 20.1)
Modern livestock buyers, hotel chains, and export processors require verifiable proof of animal origin, health status, and feeding regimen. Digital traceability transforms ordinary livestock into premium, verified assets.

## 2. RFID Tagging Standards (Section 20.2)
- **Visual & Electronic Ear Tags**: Each animal receives an ISO 11784/11785 compliant RFID ear tag applied to the middle third of the left ear.
- **Unique Animal ID (UAID)**: 15-digit globally unique identifier containing country code, cooperative cluster code, and animal sequence.
    `,
    downloadUrl: "/downloads/EEWYLA_Official_Course_Textbook.pdf",
    featured: false,
    publishedAt: "2026-08-10",
  },
  {
    id: "reading-week-4",
    recommendedWeek: 4,
    title: "Week 4: Climate-Smart Feed & Fodder Conservation",
    subtitle: "Silage production, urea treatment of crop residues, and dry-season feed security",
    category: "Feed & Fodder",
    author: "Prof. K. B. Yusuf & Feed Science Unit",
    readTime: "15 min read",
    type: "Research Paper",
    chapterReference: "Part 2, Chapter 13 & Chapter 14 (Sections 13.2, 13.3 & 14.1)",
    coverImage: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80",
    summary: "Week 4 technical guide on plastic bag silage production, molasses fermentation, and urea ammoniation of rice straw to maintain goat weight during dry seasons.",
    content: `
# Week 4 Recommended Reading: Climate-Smart Feed & Fodder Conservation

### 📖 Textbook Reference: Part 2, Chapter 13 & Chapter 14 (Sections 13.2, 13.3 & 14.1)
*Check Chapter 13 & 14 of the EEWYLA Official Course Textbook for ration formulation charts and silage pit construction.*

---

## 1. Basics of Small Ruminant Nutrition (Section 13.2)
In West Africa, fodder availability drops by over 60% during the dry season (November to March). Without conserved feed, livestock experience severe weight loss and mortality.

## 2. Plastic Bag Silage Production (Section 14.1)
- **Harvesting**: Cut grass at early flowering stage (60-70% moisture content).
- **Chopping**: Chop forage into 2cm - 5cm lengths to promote compaction.
- **Molasses Addition**: Add 3% molasses solution to accelerate lactic acid fermentation.
- **Anaerobic Sealing**: Pack tightly into heavy-duty 50kg polythene bags to expel air. Ready in 21 days.
    `,
    downloadUrl: "/downloads/EEWYLA_Official_Course_Textbook.pdf",
    featured: false,
    publishedAt: "2026-08-12",
  },
  {
    id: "reading-week-5",
    recommendedWeek: 5,
    title: "Week 5: Agribusiness Marketing & Off-taker Supply Contracts",
    subtitle: "Bulk sales agreements, carcass quality grading, and floor price guarantees",
    category: "Agribusiness Marketing",
    author: "Oriyon Commercial Market Division",
    readTime: "9 min read",
    type: "Article",
    chapterReference: "Part 4, Chapter 17 (Sections 17.1 – 17.4)",
    coverImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
    summary: "Week 5 textbook guide on negotiating bulk sales contracts with off-takers, establishing floor prices, and eliminating middleman commissions through cooperative marketing.",
    content: `
# Week 5 Recommended Reading: Agribusiness Marketing & Supply Contracts

### 📖 Textbook Reference: Part 4, Chapter 17 (Sections 17.1 – 17.4)
*Check Chapter 17 of the EEWYLA Official Course Textbook for off-taker purchase agreement templates.*

---

## 1. Moving from Retail Markets to Off-taker Contracts (Section 17.1)
Selling individual animals at open roadside markets exposes farmers to price volatility. Aggregated cooperative selling via signed Off-taker Purchase Agreements guarantees buyer off-take at predetermined floor prices.

## 2. Key Contract Specifications (Section 17.2)
- Minimum 25kg live weight for WAD bucks.
- Carcass dress-out target of 48-52%.
- Scheduled harvest batches for festive peak demand.
    `,
    downloadUrl: "/downloads/EEWYLA_Official_Course_Textbook.pdf",
    featured: false,
    publishedAt: "2026-08-14",
  },
  {
    id: "reading-week-6",
    recommendedWeek: 6,
    title: "Week 6: General Herd Health, Biosecurity & Disease Prevention",
    subtitle: "Vaccination calendars, quarantine procedures, and major disease diagnosis (PPR, CPPP, Anthrax)",
    category: "Livestock Management",
    author: "Dr. A. O. Ogunmola & Veterinary Directorate",
    readTime: "11 min read",
    type: "PDF Guide",
    chapterReference: "Part 3, Chapter 2, Chapter 4 & Chapter 5 (Sections 2.1 – 2.3, 4.1)",
    coverImage: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80",
    summary: "Week 6 textbook manual covering viral and bacterial disease prevention (PPR, CPPP, Anthrax), 21-day quarantine protocols for new animals, and foot rot eradication.",
    content: `
# Week 6 Recommended Reading: Herd Health, Biosecurity & Vaccinations

### 📖 Textbook Reference: Part 3, Chapter 2, Chapter 4 & Chapter 5 (Sections 2.1 – 2.3, 4.1)
*Check Chapters 2, 4 & 5 of the EEWYLA Official Course Textbook for disease identification charts and dosage protocols.*

---

## 1. Biosecurity First Principle (Section 2.3)
Isolate all newly acquired animals for 21 days in a dedicated quarantine pen before introducing them to the main herd.

## 2. Preventive Healthcare & Vaccination Calendar (Section 4.1)
- **PPR Vaccine**: Annual administration before the onset of rains.
- **CBPP / CPPP**: Bi-annual booster shots for respiratory protection.
- **Deworming**: Strategic deworming at the start and end of rainy seasons.
    `,
    downloadUrl: "/downloads/EEWYLA_Official_Course_Textbook.pdf",
    featured: false,
    publishedAt: "2026-08-15",
  },
  {
    id: "reading-week-7",
    recommendedWeek: 7,
    title: "Week 7: Pasture Establishment & Legume Fodder Shrub Integration",
    subtitle: "Cultivating Panicum maximum, Stylosanthes, and Gliricidia browse trees",
    category: "Feed & Fodder",
    author: "Pasture Agronomy Unit",
    readTime: "10 min read",
    type: "PDF Guide",
    chapterReference: "Part 2, Chapter 13 (Section 13.3) & Chapter 14",
    coverImage: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80",
    summary: "Week 7 textbook guide on establishing high-yield grass-legume pastures, fodder bank fencing, and managing Gliricidia and Leucaena browse hedges.",
    content: `
# Week 7 Recommended Reading: Pasture & Browse Shrub Management

### 📖 Textbook Reference: Part 2, Chapter 13 (Section 13.3) & Chapter 14
*Check Chapter 13 & 14 of the EEWYLA Official Course Textbook for seed rates and pasture establishment timing.*

---

## 1. High-Yield Grass & Legume Mixes (Section 13.3)
Combining Guinea grass (Panicum maximum) with leguminous forage like Stylosanthes guianensis increases digestible protein intake by over 35%.

## 2. Fodder Bank Fencing & Browse Hedges
Establish intensive fodder plots near pens with Gliricidia sepium and Leucaena leucocephala to cut down on daily grazing labor.
    `,
    downloadUrl: "/downloads/EEWYLA_Official_Course_Textbook.pdf",
    featured: false,
    publishedAt: "2026-08-16",
  },
  {
    id: "reading-week-8",
    recommendedWeek: 8,
    title: "Week 8: Breeding Systems, Kid Rearing & Genetic Selection",
    subtitle: "Controlled breeding seasons, newborn kid colostrum protocols, and culling criteria",
    category: "Livestock Management",
    author: "Livestock Breeding Board",
    readTime: "14 min read",
    type: "Handbook",
    chapterReference: "Part 4, Chapter 15 & Chapter 16 (Sections 15.4, 16.1 & 19.8)",
    coverImage: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80",
    summary: "Week 8 textbook handbook detailing controlled breeding cycles, newborn kid resuscitation, 24-hour colostrum feeding, and genetic culling for twin traits.",
    content: `
# Week 8 Recommended Reading: Breeding Systems & Kid Rearing

### 📖 Textbook Reference: Part 4, Chapter 15 & Chapter 16 (Sections 15.4, 16.1 & 19.8)
*Check Chapter 15 & 16 of the EEWYLA Official Course Textbook for kid creep feeding designs and breeding logs.*

---

## 1. Colostrum Management & Kid Rearing (Section 15.4)
Ensure newborn kids consume colostrum within the first 6 hours of birth to receive essential maternal antibodies.

## 2. Improved Breeding Systems & Selective Culling (Section 19.8)
Cull low-performing bucks and retain high twin-rate does to rapidly upgrade herd genetic potential.
    `,
    downloadUrl: "/downloads/EEWYLA_Official_Course_Textbook.pdf",
    featured: false,
    publishedAt: "2026-08-17",
  },
  {
    id: "reading-week-9",
    recommendedWeek: 9,
    title: "Week 9: Value Addition, Meat Processing & Quality Hygiene Standards",
    subtitle: "Hygienic slaughtering, vacuum packaging, and cold-chain distribution logistics",
    category: "Agribusiness Marketing",
    author: "Food Safety & Value Addition Directorate",
    readTime: "9 min read",
    type: "PDF Guide",
    chapterReference: "Part 4, Chapter 17 (Sections 17.3 – 17.5)",
    coverImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
    summary: "Week 9 manual on humane slaughtering, hygienic meat processing, vacuum packaging, and cold-chain preservation for premium supermarket off-take.",
    content: `
# Week 9 Recommended Reading: Value Addition & Processing

### 📖 Textbook Reference: Part 4, Chapter 17 (Sections 17.3 – 17.5)
*Check Chapter 17 of the EEWYLA Official Course Textbook for sanitary meat handling procedures.*

---

## 1. Hygienic Processing Standards (Section 17.3)
Maintain strict sanitary protocols during slaughtering and deboning to comply with NAFDAC and veterinary health regulations.

## 2. Vacuum Packaging & Cold-Chain Logistics (Section 17.4)
Branded, vacuum-sealed goat meat cuts achieve 45% higher profit margins compared to live open-market sales.
    `,
    downloadUrl: "/downloads/EEWYLA_Official_Course_Textbook.pdf",
    featured: false,
    publishedAt: "2026-08-18",
  },
  {
    id: "reading-week-10",
    recommendedWeek: 10,
    title: "Week 10: Farm Accounting, Production Costing & Record Keeping",
    subtitle: "Double-entry bookkeeping, feed conversion cost accounting, and profit margin analysis",
    category: "Cooperative Finance",
    author: "Agri-Finance & Audit Department",
    readTime: "11 min read",
    type: "Handbook",
    chapterReference: "Part 5, Chapter 19 (Sections 19.1 – 19.3)",
    coverImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    summary: "Week 10 financial manual covering farm balance sheets, feed conversion cost accounting, and farm ledger record keeping.",
    content: `
# Week 10 Recommended Reading: Farm Accounting & Record Keeping

### 📖 Textbook Reference: Part 5, Chapter 19 (Sections 19.1 – 19.3)
*Check Chapter 19 of the EEWYLA Official Course Textbook for farm balance sheets and cash flow templates.*

---

## 1. Cost Accounting per Animal (Section 19.1)
Track feed, medication, and labor expenses per head to determine exact breakeven selling prices.

## 2. Financial Record Keeping (Section 19.2)
Maintain individual farm ledgers alongside your EEWYLA LMS digital dashboard.
    `,
    downloadUrl: "/downloads/EEWYLA_Official_Course_Textbook.pdf",
    featured: false,
    publishedAt: "2026-08-19",
  },
  {
    id: "reading-week-11",
    recommendedWeek: 11,
    title: "Week 11: Agricultural Policy, Environmental Protection & Data Rights",
    subtitle: "NDPA data compliance, manure waste recycling, and environmental impact rules",
    category: "Policy & Compliance",
    author: "Legal & Regulatory Compliance Unit",
    readTime: "8 min read",
    type: "Article",
    chapterReference: "Part 5, Chapter 21 (Sections 21.1 – 21.3)",
    coverImage: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80",
    summary: "Week 11 guide explaining Nigeria Data Protection Act (NDPA 2023) rights, agricultural effluent guidelines, and organic manure composting standards.",
    content: `
# Week 11 Recommended Reading: Policy, Compliance & Data Rights

### 📖 Textbook Reference: Part 5, Chapter 21 (Sections 21.1 – 21.3)
*Check Chapter 21 of the EEWYLA Official Course Textbook for NDPA data privacy rights and manure composting rules.*

---

## 1. Nigeria Data Protection Act (NDPA 2023)
Understand your rights regarding data privacy, electronic verification storage, and consent protocols within the EEWYLA portal.

## 2. Manure Composting & Environmental Standards
Convert goat manure into high-value organic fertilizer to eliminate odor and generate secondary farm income.
    `,
    downloadUrl: "/downloads/EEWYLA_Official_Course_Textbook.pdf",
    featured: false,
    publishedAt: "2026-08-20",
  },
  {
    id: "reading-week-12",
    recommendedWeek: 12,
    title: "Week 12: Leadway Livestock Insurance & Risk Management Guide",
    subtitle: "Indemnity mortality cover, Parametric Index (NDVI) forage protection, premium ratings & 24h claim reporting",
    category: "Policy & Compliance",
    author: "Leadway Assurance Agricultural Unit & Oriyon International",
    readTime: "12 min read",
    type: "PDF Guide",
    chapterReference: "Leadway Assurance Training Module (Pages 1–24)",
    coverImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    summary: "Official Leadway Assurance training module covering livestock mortality indemnity, satellite index forage drought payouts, premium rating (3.0%–6.0%), 24-hour claim reporting, and a 120-goat PPR outbreak payout case study.",
    content: `
# Leadway Livestock Insurance Training Module
*Official Agricultural Risk Management Guide for EEWYLA Trainees*

### 📖 Training Document Reference: Leadway Assurance Module (Pages 1–24)
*Check the Leadway Assurance Official PDF Module for complete underwriting workflows and claim forms.*

---

### 1. Learning Objectives
1. **Meaning of Livestock Insurance**: Structured risk management tool protecting farmers against financial loss due to animal death, disease, fire, flood, or accident.
2. **Premium & Claim Computation**: Basic premium rates range between **3.0% and 6.0%** based on farm size, biosecurity measures, and management standards.
3. **Risk Management Principles**: Farm husbandry, biosecurity protocols, quarantine, and routine vaccination.
4. **Insurance Documentation & Underwriting**: Proposal form filing, field risk certification, and policy issuance.

---

### 2. Basic Insurance Terms Every Farmer Must Know
- **Premium**: Money paid to Leadway Assurance to keep livestock covered.
- **Sum Insured**: Highest monetary value paid if an insured animal dies or is lost (calculated on market / farm gate value).
- **Insured Perils**: Covered risks including Fire, Flood, Windstorm, Accident, and Outbreak of vaccinable & treatable diseases.
- **Exclusions**: Losses not covered, such as poor feeding, willful neglect, or pre-existing illness before policy inception.
- **Indemnity**: Insurance pays the true financial value of what was lost—farmers cannot make a profit from a claim.
- **Policy Excess (Farmer's Share)**: A standard deductible (typically 10%) borne by the farmer before the insurance pays the remaining balance.

---

### 3. Mortality Insurance vs. Index-Based Livestock Insurance (IBLI)
- **Indemnity (Mortality) Insurance**: Covers cattle, sheep, goats, and pigs against direct death from covered perils.
- **Index-Based Livestock Insurance (IBLI / Forage Cover)**: Parametric insurance protecting pastoralists against drought and forage scarcity using satellite vegetation index readings (NDVI). Payouts trigger automatically when pasture greenness drops below threshold without requiring animal carcass counts.

---

### 4. Real Case Study — Commercial Goat Mortality Claim (PPR Outbreak)
- **Farm Profile**: Commercial Goat Farm in Oyo State, Nigeria (500 West African Dwarf & Red Sokoto goats).
- **Sum Insured**: ₦60,000 per goat (Total Sum Insured = **₦30,000,000**).
- **Incident**: Sudden outbreak of *Peste des Petits Ruminants (PPR)* resulting in **120 goat deaths** (24% herd mortality).
- **Claim Reporting**: Farmer notified Leadway Assurance within **24 hours** with veterinary diagnosis and photo evidence.
- **Claim Settlement Calculation**:
  - Total Goats Insured: 500
  - Deaths Recorded & Admissible: 120 goats
  - Gross Admissible Claim: 120 × ₦60,000 = **₦7,200,000**
  - Less 10% Policy Excess: **₦720,000**
  - **Net Claim Paid to Farmer**: **₦6,480,000** (Settled within 25 working days)
    `,
    downloadUrl: "/downloads/LAC_TRAINING_DOCUMENT.pdf",
    featured: true,
    publishedAt: "2026-08-20",
  },
];

export const getStoredReadings = (): ReadingMaterial[] => {
  if (typeof window === "undefined") return INITIAL_READINGS;
  try {
    const raw = localStorage.getItem("oriyon_recommended_readings");
    if (!raw) return INITIAL_READINGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_READINGS;
  } catch {
    return INITIAL_READINGS;
  }
};

export const saveStoredReadings = (readings: ReadingMaterial[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("oriyon_recommended_readings", JSON.stringify(readings));
  } catch (e) {
    console.error("Failed to save readings to localStorage", e);
  }
};
