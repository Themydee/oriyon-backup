// lib/lmsData.ts

export type DeliveryType = "online" | "physical" | "exam";

export type Module = {
  type: string;
  content: string;
  hours: number;
  location: string;     // e.g. "💻 RUMER Learning Portal — self-paced online"
  videoUrl?: string;    // YouTube embed URL — overrides placeholder video in page.tsx
  body?: string;        // Rich lesson text — overrides placeholder body in page.tsx
};

export type Competency = string;

export type DeliveryPartner = {
  name: string;
  scope: string;
};

export type AssessmentWeighting = {
  area: string;
  weight: string;
  color: string;
};

export type PassingCriteria = {
  overall: number;
  theory: number;
  digitalTraceability: number;
  smeFinance: number;
  attendanceRequired: number;
  mandatoryStations: string[];
};

export type Week = {
  week: number;
  title: string;
  thematic: string;
  deliveryType: DeliveryType;
  physicalNote?: string;
  objectives: string[];
  modules: Module[];
  competencies: Competency[];
  hasQuiz: boolean;
  deliveryPartners?: DeliveryPartner[];
  assessmentWeighting?: AssessmentWeighting[];
  passingCriteria?: PassingCriteria;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getWeekByNumber(n: number): Week | null {
  return WEEKS.find((w) => w.week === n) || null;
}

export function getWeekHours(weekNum: number): number {
  const w = getWeekByNumber(weekNum);
  if (!w) return 0;
  return w.modules.reduce((sum, m) => sum + m.hours, 0);
}

export function getTotalHours(): number {
  return WEEKS.reduce(
    (sum, w) => sum + w.modules.reduce((s, m) => s + m.hours, 0),
    0
  );
}

/**
 * Determine the unlock status of a week for a given trainee.
 * @param weekNum                   Week number 1–13
 * @param completedWeeks            Array of completed online week numbers
 * @param week12Verified            Whether Week 12 physical attendance has been verified
 * @param completedPracticalWeeks   Array of completed practical attendance week numbers (1–11)
 * @returns "available" | "locked" | "completed" | "physical" | "exam"
 */
export function getWeekStatus(
  weekNum: number,
  completedWeeks: number[] = [],
  week12Verified = false,
  completedPracticalWeeks: number[] = []
): "available" | "locked" | "completed" | "physical" | "exam" {
  const done = completedWeeks.includes(weekNum);

  if (weekNum === 13) {
    if (!week12Verified) return "locked";
    return done ? "completed" : "exam";
  }
  if (weekNum === 12) {
    if (!completedWeeks.includes(11) || !completedPracticalWeeks.includes(11)) return "locked";
    return done ? "completed" : "physical";
  }
  if (weekNum === 1) return done ? "completed" : "available";
  
  // For weeks 2..11, previous week online lessons AND previous week practical attendance must be complete
  const prevOnlineDone = completedWeeks.includes(weekNum - 1);
  const prevPracticalDone = completedPracticalWeeks.includes(weekNum - 1);
  
  if (!prevOnlineDone || !prevPracticalDone) return "locked";
  return done ? "completed" : "available";
}

// ─── Full 13-week curriculum ──────────────────────────────────────────────────

export const WEEKS: Week[] = [

  // ── Week 1 ───────────────────────────────────────────────────────────────────
  {
    week: 1,
    title: "Programme Orientation, Fundamentals of Goat Husbandry & CAC Name Reservation",
    thematic: "Programme onboarding, foundational goat husbandry concepts, introduction to digital literacy, and business name collection for CAC reservation.",
    deliveryType: "online",
    objectives: [
      "Understand programme structure, expectations, assessment framework, and support systems.",
      "Demonstrate foundational knowledge of small ruminant production.",
      "Understand goat behaviour, breed characteristics, and basic health indicators.",
      "Complete CAC business name submission for regulatory compliance.",
      "Navigate introductory features of the RUMER platform.",
    ],
    modules: [
      { type: "Online Theory",         content: "Introduction to goat husbandry; goat behaviour and characteristics; basic animal care principles", location: "💻 RUMER Learning Portal — self-paced online", hours: 3, videoUrl: "https://www.youtube.com/embed/zBjJUV-lzHo" },
      { type: "Online Theory",         content: "Introduction to animal health and welfare",                                                         location: "💻 RUMER Learning Portal — self-paced online", hours: 2, videoUrl: "https://www.youtube.com/embed/zBjJUV-lzHo" },
      { type: "In-Person Integration", content: "Programme orientation; expectations; training materials distribution; overview of 13-week cycle",   location: "🏫 Training Centre — facilitated session",      hours: 2, videoUrl: "https://www.youtube.com/embed/zBjJUV-lzHo" },
      { type: "In-Person Integration", content: "CAC business name collection and registration briefing",                                            location: "🏫 Training Centre — facilitated session",      hours: 1, videoUrl: "https://www.youtube.com/embed/zBjJUV-lzHo" },
      { type: "Digital Literacy",      content: "Introduction to RUMER; account setup; navigating the interface",                                   location: "💻 RUMER Platform — guided digital session",    hours: 2, videoUrl: "https://www.youtube.com/embed/zBjJUV-lzHo" },
      { type: "Practical Training",    content: "Safe handling; restraint techniques; animal behaviour; basic hygiene routines",                    location: "🐐 Field / Farm Site — hands-on practical",     hours: 8, videoUrl: "https://www.youtube.com/embed/zBjJUV-lzHo" },
    ],
    competencies: [
      "Safely approach, handle and restrain goats.",
      "Demonstrate understanding of goat behaviour and welfare.",
      "Submit CAC business name.",
      "Navigate RUMER interface and core functions.",
    ],
    hasQuiz: true,
  },

  // ── Week 2 ───────────────────────────────────────────────────────────────────
  {
    week: 2,
    title: "Nutrition, Stress, Hydration and Immune Function",
    thematic: "Fundamentals of goat nutrition, feed types, stress management, and hydration. Understanding the link between nutrition and productivity.",
    deliveryType: "online",
    objectives: [
      "Identify nutritional needs across life stages.",
      "Recognise indicators of stress and poor health.",
      "Understand the importance of clean water and feed quality.",
      "Apply basic feed formulation principles using available resources.",
      "Begin linking husbandry practices to digital record-keeping.",
    ],
    modules: [
      { type: "Online Theory",         content: "Feed types; nutritional requirements; water importance",                    location: "💻 RUMER Learning Portal — self-paced online", hours: 3 },
      { type: "Online Theory",         content: "Stress indicators; immunity; environmental impacts on feeding",             location: "💻 RUMER Learning Portal — self-paced online", hours: 2 },
      { type: "In-Person Integration", content: "Feed formulation basics; feed quality assessment",                          location: "🏫 Training Centre — facilitated session",      hours: 2 },
      { type: "In-Person Integration", content: "Introduction to nutrition records on RUMER",                                location: "🏫 Training Centre — facilitated session",      hours: 1 },
      { type: "Digital Literacy",      content: "Recording feed logs; updating environmental factors",                      location: "💻 RUMER Platform — guided digital session",    hours: 2 },
      { type: "Practical Training",    content: "Feed mixing; water testing; stress identification; feeding station setup",  location: "🐐 Field / Farm Site — hands-on practical",     hours: 8 },
    ],
    competencies: [
      "Assess feed and water quality.",
      "Recognise stress indicators and apply mitigation techniques.",
      "Record nutrition-related data on RUMER.",
    ],
    hasQuiz: true,
  },

  // ── Week 3 ───────────────────────────────────────────────────────────────────
  {
    week: 3,
    title: "Parasite Control, FAMACHA and the Five-Point Check",
    thematic: "Internal and external parasite identification, FAMACHA scoring, and general health monitoring methods.",
    deliveryType: "online",
    objectives: [
      "Identify common parasites affecting goats.",
      "Perform FAMACHA scoring accurately.",
      "Apply the ILRI Five-Point Check methodology.",
      "Understand how parasite management contributes to productivity.",
      "Log parasite-related events in RUMER.",
    ],
    modules: [
      { type: "Online Theory",         content: "Internal and external parasites; parasite life cycles",                                              location: "💻 RUMER Learning Portal — self-paced online", hours: 3 },
      { type: "Online Theory",         content: "FAMACHA principles; anaemia assessment",                                                            location: "💻 RUMER Learning Portal — self-paced online", hours: 2 },
      { type: "In-Person Integration", content: "Five-Point Check method; parasite control strategy",                                                location: "🏫 Training Centre — facilitated session",      hours: 2 },
      { type: "Digital Literacy",      content: "Recording parasite treatments and FAMACHA scores in RUMER",                                         location: "💻 RUMER Platform — guided digital session",    hours: 2 },
      { type: "Practical Training",    content: "Hands-on FAMACHA scoring; body condition scoring; tick control; identifying clinical signs",         location: "🐐 Field / Farm Site — hands-on practical",     hours: 8 },
    ],
    competencies: [
      "Accurate FAMACHA scoring and interpretation.",
      "Conduct the Five-Point Check.",
      "Record parasite treatments in RUMER.",
    ],
    hasQuiz: true,
  },

  // ── Week 4 ───────────────────────────────────────────────────────────────────
  {
    week: 4,
    title: "Diseases, Vaccination Protocols and Safe Treatment Practices",
    thematic: "Understanding major diseases, vaccine protocols, treatment procedures and safe medicine handling.",
    deliveryType: "online",
    objectives: [
      "Recognise signs of major diseases affecting goats.",
      "Understand vaccine schedules and preventive health strategies.",
      "Demonstrate correct techniques for administering treatments.",
      "Apply basic biosecurity and hygiene standards.",
      "Record health events appropriately on RUMER.",
    ],
    modules: [
      { type: "Online Theory",         content: "Major goat diseases; symptoms and prevention",                                          location: "💻 RUMER Learning Portal — self-paced online", hours: 3   },
      { type: "Online Theory",         content: "Vaccination schedules and treatment approaches",                                        location: "💻 RUMER Learning Portal — self-paced online", hours: 2   },
      { type: "In-Person Integration", content: "Safe handling of medicines; needle safety; clinic case discussions",                    location: "🏫 Training Centre — facilitated session",      hours: 3   },
      { type: "Digital Literacy",      content: "Recording vaccinations; health events; treatment logs in RUMER",                        location: "💻 RUMER Platform — guided digital session",    hours: 1.5 },
      { type: "Practical Training",    content: "Demonstrations: SC vs IM injections; vaccination simulation; first aid",               location: "🐐 Field / Farm Site — hands-on practical",     hours: 8   },
    ],
    competencies: [
      "Identify disease symptoms accurately.",
      "Execute treatment procedures safely.",
      "Document all health activities in RUMER.",
    ],
    hasQuiz: true,
  },

  // ── Week 5 ───────────────────────────────────────────────────────────────────
  {
    week: 5,
    title: "Housing, Infrastructure, Hygiene and Environmental Management",
    thematic: "Designing and maintaining optimal goat housing, ventilation, drainage systems, and hygiene practices that promote health, welfare and productivity.",
    deliveryType: "online",
    objectives: [
      "Understand housing requirements for different goat categories.",
      "Assess environmental and structural risk factors.",
      "Apply ILRI-aligned housing and sanitation standards.",
      "Conduct routine hygiene checks and maintain waste management.",
      "Link housing management to traceability and data capture.",
    ],
    modules: [
      { type: "Online Theory",         content: "Housing requirements; ventilation; flooring; space ratios",                           location: "💻 RUMER Learning Portal — self-paced online", hours: 3 },
      { type: "Online Theory",         content: "Environmental sanitation and risk management",                                        location: "💻 RUMER Learning Portal — self-paced online", hours: 2 },
      { type: "In-Person Integration", content: "Housing evaluation checklist; structural assessment tools",                           location: "🏫 Training Centre — facilitated session",      hours: 2 },
      { type: "Digital Literacy",      content: "Linking shelter data to RUMER (location tags, condition logs)",                       location: "💻 RUMER Platform — guided digital session",    hours: 1 },
      { type: "Practical Training",    content: "Housing inspection; drainage checks; sanitation procedures; group housing design",    location: "🐐 Field / Farm Site — hands-on practical",     hours: 8 },
    ],
    competencies: [
      "Evaluate goat housing against ILRI standards.",
      "Implement appropriate sanitation routines.",
      "Record housing and environmental data on RUMER.",
    ],
    hasQuiz: true,
  },

  // ── Week 6 ───────────────────────────────────────────────────────────────────
  {
    week: 6,
    title: "Reproduction, Heat Detection and Kidding Management",
    thematic: "Reproductive physiology, heat detection, breeding management, pregnancy identification, kidding preparation and immediate newborn care.",
    deliveryType: "online",
    objectives: [
      "Understand reproductive cycles and signs of heat.",
      "Apply best practices in buck management and breeding planning.",
      "Identify stages of pregnancy and manage pre-kidding care.",
      "Provide immediate neonatal care to reduce mortality.",
      "Document reproductive events digitally with accuracy.",
    ],
    modules: [
      { type: "Online Theory",         content: "Reproductive anatomy; breeding cycles; heat detection",                                           location: "💻 RUMER Learning Portal — self-paced online", hours: 3 },
      { type: "Online Theory",         content: "Pregnancy stages; kidding risks; neonatal care",                                                  location: "💻 RUMER Learning Portal — self-paced online", hours: 2 },
      { type: "In-Person Integration", content: "Case scenarios on reproductive challenges; data interpretation for breeding",                     location: "🏫 Training Centre — facilitated session",      hours: 2 },
      { type: "Digital Literacy",      content: "Recording heat events, pregnancies, and kidding outcomes on RUMER",                               location: "💻 RUMER Platform — guided digital session",    hours: 1 },
      { type: "Practical Training",    content: "Heat detection demonstration; udder checks; kidding area preparation; mock kidding simulation",   location: "🐐 Field / Farm Site — hands-on practical",     hours: 8 },
    ],
    competencies: [
      "Identify heat, pregnancy and kidding readiness.",
      "Prepare kidding areas and execute immediate neonatal care.",
      "Accurately document reproductive events in RUMER.",
    ],
    hasQuiz: true,
  },

  // ── Week 7 ───────────────────────────────────────────────────────────────────
  {
    week: 7,
    title: "Kid Rearing, Mortality Reduction and Early-Life Management",
    thematic: "Managing kids from birth to weaning, understanding mortality risk factors, implementing preventative strategies, and strengthening early growth performance.",
    deliveryType: "online",
    objectives: [
      "Identify causes of kid mortality and preventive strategies.",
      "Implement feeding regimes (colostrum management, creep feeding, weaning).",
      "Apply health checks, temperature monitoring, and early-life hygiene.",
      "Integrate kid-level traceability from birth.",
      "Strengthen cooperative models for collective kid management.",
    ],
    modules: [
      { type: "Online Theory",         content: "Kid management; mortality causes; early nutrition",                                       location: "💻 RUMER Learning Portal — self-paced online", hours: 3 },
      { type: "Online Theory",         content: "Colostrum importance; creep feeding; weaning strategies",                                location: "💻 RUMER Learning Portal — self-paced online", hours: 2 },
      { type: "In-Person Integration", content: "Mortality case reviews; designing kid-care protocols",                                   location: "🏫 Training Centre — facilitated session",      hours: 2 },
      { type: "Digital Literacy",      content: "Recording births, weights, treatments and growth data on RUMER",                         location: "💻 RUMER Platform — guided digital session",    hours: 1 },
      { type: "Practical Training",    content: "Kid handling; weighing; creep feeding setup; disease checks; weaning demonstration",     location: "🐐 Field / Farm Site — hands-on practical",     hours: 8 },
    ],
    competencies: [
      "Implement kid management procedures.",
      "Identify mortality risks and apply interventions.",
      "Use RUMER effectively for kid-level traceability.",
    ],
    hasQuiz: true,
  },

  // ── Week 8 ───────────────────────────────────────────────────────────────────
  {
    week: 8,
    title: "Commercialisation, Market Grading and Price Determination",
    thematic: "Understanding market dynamics, grading goats for sale, quality parameters, price determinants, and basic agribusiness skills required for commercial participation.",
    deliveryType: "online",
    objectives: [
      "Understand market quality standards for goats and value-added products.",
      "Identify key price influencers: weight, condition, age, breed, season, market trends.",
      "Apply grading techniques and quality assessment tools.",
      "Conduct basic cost-benefit analysis to support pricing decisions.",
      "Prepare for SME week by integrating basic financial literacy.",
    ],
    modules: [
      { type: "Online Theory",         content: "Goat marketing systems; grading standards; pricing factors",                            location: "💻 RUMER Learning Portal — self-paced online", hours: 3 },
      { type: "Online Theory",         content: "Introduction to enterprise costing; revenue estimation",                                location: "💻 RUMER Learning Portal — self-paced online", hours: 2 },
      { type: "In-Person Integration", content: "Price simulation exercises; evaluating market-ready animals",                           location: "🏫 Training Centre — facilitated session",      hours: 2 },
      { type: "Digital Literacy",      content: "Recording sales, weights, prices and buyer details on RUMER",                           location: "💻 RUMER Platform — guided digital session",    hours: 1 },
      { type: "Practical Training",    content: "Live grading of goats; BCS for markets; negotiation practice; mock market scenarios",   location: "🐐 Field / Farm Site — hands-on practical",     hours: 8 },
    ],
    competencies: [
      "Grade goats correctly using market standards.",
      "Understand basic livestock enterprise economics.",
      "Record sales data and trace animals to market.",
    ],
    hasQuiz: true,
  },

  // ── Week 9 ───────────────────────────────────────────────────────────────────
  {
    week: 9,
    title: "Pasture, Forage Systems and Semi-Intensive Feeding Strategies",
    thematic: "Understanding grazing systems, forage development, supplementary feeding, seasonal feed planning, and sustainable feed production.",
    deliveryType: "online",
    objectives: [
      "Identify common forage and browse species suitable for small ruminants in the region.",
      "Understand grazing systems (free-range, tethering, semi-intensive, rotational grazing).",
      "Apply feed budgeting and ration planning based on seasonal availability.",
      "Strengthen knowledge of sustainable feed production and storage.",
      "Record feed-related events digitally to support traceability and market readiness.",
    ],
    modules: [
      { type: "Online Theory",         content: "Forage species; grazing systems; dry-season feeding",                                              location: "💻 RUMER Learning Portal — self-paced online", hours: 3 },
      { type: "Online Theory",         content: "Feed conservation; hay and silage basics; feed budgeting",                                         location: "💻 RUMER Learning Portal — self-paced online", hours: 2 },
      { type: "In-Person Integration", content: "Feed planning for clusters; forage utilisation mapping; case reviews",                             location: "🏫 Training Centre — facilitated session",      hours: 2 },
      { type: "Digital Literacy",      content: "Logging grazing patterns, feed plans and supplements on RUMER",                                    location: "💻 RUMER Platform — guided digital session",    hours: 1 },
      { type: "Practical Training",    content: "Forage identification walk; grazing pattern evaluation; constructing feed racks; hay inspection",   location: "🐐 Field / Farm Site — hands-on practical",     hours: 8 },
    ],
    competencies: [
      "Identify key forages and evaluate feed resources.",
      "Plan feeding budgets and dry-season strategies.",
      "Document forage-related activities in RUMER.",
    ],
    hasQuiz: true,
  },

  // ── Week 10 ──────────────────────────────────────────────────────────────────
  {
    week: 10,
    title: "Cluster Governance, Cooperative Management and Record-Keeping for Finance Access",
    thematic: "Strengthening cooperative governance, roles and responsibilities, democratic structures, collective bargaining, and financial preparedness for credit access.",
    deliveryType: "online",
    objectives: [
      "Understand governance models for livestock clusters and cooperatives.",
      "Define member responsibilities, leadership structures, and accountability mechanisms.",
      "Apply standardised record-keeping frameworks required by lenders and insurers.",
      "Understand collective aggregation, cost-sharing and risk-sharing principles.",
      "Integrate cluster-level record-keeping with RUMER to support finance access.",
    ],
    modules: [
      { type: "Online Theory",         content: "Cooperative governance basics; leadership roles; group dynamics",                                     location: "💻 RUMER Learning Portal — self-paced online", hours: 3   },
      { type: "Online Theory",         content: "Financial documentation for credit; cooperative risk-sharing; group savings systems",                  location: "💻 RUMER Learning Portal — self-paced online", hours: 2   },
      { type: "In-Person Integration", content: "Developing cluster constitutions; roles and responsibilities; conflict resolution",                    location: "🏫 Training Centre — facilitated session",      hours: 2.5 },
      { type: "Digital Literacy",      content: "Uploading cooperative-level data; linking individual records to group identity on RUMER",             location: "💻 RUMER Platform — guided digital session",    hours: 1   },
      { type: "Practical Training",    content: "Simulated cooperative meeting; group financial planning; aggregation simulation",                      location: "🐐 Field / Farm Site — hands-on practical",     hours: 8   },
    ],
    competencies: [
      "Operate within cooperative governance frameworks.",
      "Maintain and interpret financial records relevant to lenders.",
      "Link individual and group data within RUMER.",
    ],
    hasQuiz: true,
  },

  // ── Week 11 ──────────────────────────────────────────────────────────────────
  {
    week: 11,
    title: "Integrated Farm Management, Traceability Consolidation and Pre-Assessment Revision",
    thematic: "Bringing all technical, digital, and agribusiness skills together into a full-cycle farm management simulation.",
    deliveryType: "online",
    objectives: [
      "Demonstrate integrated understanding of health, feeding, reproduction, housing and marketing.",
      "Apply traceability protocols across all events: births, treatments, weights, movements, sales.",
      "Operate as a functional cluster/team using real-world farm scenarios.",
      "Prepare for the forthcoming technical, practical, and digital assessments.",
      "Identify personal learning gaps and close competency deficits before Week 13.",
    ],
    modules: [
      { type: "Online Theory",         content: "Integrated livestock systems; full-cycle production models",                                            location: "💻 RUMER Learning Portal — self-paced online", hours: 3   },
      { type: "Online Theory",         content: "Review modules: disease control, reproduction, housing, nutrition",                                    location: "💻 RUMER Learning Portal — self-paced online", hours: 2   },
      { type: "In-Person Integration", content: "Traceability deep-dive; correcting data errors; preparing for assessments",                            location: "🏫 Training Centre — facilitated session",      hours: 2.5 },
      { type: "Digital Literacy",      content: "Comprehensive RUMER simulation: entering a full production cycle",                                     location: "💻 RUMER Platform — guided digital session",    hours: 1.5 },
      { type: "Practical Training",    content: "Full-cycle farm management simulation: reproduction, feeding, health, record-keeping, grading",        location: "🐐 Field / Farm Site — hands-on practical",     hours: 8   },
    ],
    competencies: [
      "Manage a small ruminant enterprise holistically.",
      "Complete accurate records across an entire production cycle.",
      "Demonstrate readiness for Week 13 examinations.",
    ],
    hasQuiz: true,
  },

  // ── Week 12 ──────────────────────────────────────────────────────────────────
  {
    week: 12,
    title: "SME Development, Financial Literacy and Insurance Literacy",
    thematic: "Foundational SME education, financial readiness, budgeting, insurance literacy, cooperative financial systems, and digital tools for enterprise management.",
    deliveryType: "physical",
    physicalNote: "Week 12 is delivered entirely in-person. Programme admin must verify physical attendance before Week 13 unlocks for any trainee.",
    objectives: [
      "Understand key components of micro and small livestock enterprise development.",
      "Build financial literacy skills relevant to livestock production.",
      "Understand livestock insurance options, benefits, claims processes, and risk mitigation.",
      "Strengthen business management capabilities required for lenders, insurers, and investors.",
      "Integrate enterprise-level data into RUMER for traceability and compliance.",
    ],
    modules: [
      { type: "SME Development",    content: "Introduction to livestock enterprise models; business planning; cost structures; revenue forecasting (Heifer International)", location: "🏫 Training Centre — Heifer International",  hours: 3 },
      { type: "SME Development",    content: "Cooperative business systems; collective marketing; governance for enterprise sustainability (Heifer International)",         location: "🏫 Training Centre — Heifer International",  hours: 2 },
      { type: "Financial Literacy", content: "Savings and credit structures; loan readiness; understanding interest, collateral and repayment (Sterling Bank)",            location: "🏫 Training Centre — Sterling Bank",         hours: 2 },
      { type: "Financial Literacy", content: "Record-keeping requirements for finance; interpreting basic financial statements (Sterling Bank)",                           location: "🏫 Training Centre — Sterling Bank",         hours: 1 },
      { type: "Insurance Literacy", content: "Livestock insurance products; risk mitigation; premium structures; claims processes (Leadway Assurance)",                   location: "🏫 Training Centre — Leadway Assurance",     hours: 2 },
      { type: "Digital Literacy",   content: "Recording enterprise-level data; linking enterprise identity to livestock records (RUMER)",                                  location: "💻 RUMER Platform — guided digital session", hours: 2 },
    ],
    competencies: [
      "Prepare basic enterprise budgets and cash-flow projections.",
      "Understand credit requirements and cooperative savings systems.",
      "Understand livestock insurance and risk management.",
      "Maintain enterprise-level records digitally on RUMER.",
      "Prepare for formal enterprise registration post-assessment.",
    ],
    hasQuiz: true,
    deliveryPartners: [
      { name: "Heifer International", scope: "SME Development sessions"   },
      { name: "Sterling Bank",        scope: "Financial Literacy sessions" },
      { name: "Leadway Assurance",    scope: "Insurance Literacy sessions" },
    ],
  },

  // ── Week 13 ──────────────────────────────────────────────────────────────────
  {
    week: 13,
    title: "Examinations, Practical Assessments and Results Publication",
    thematic: "Comprehensive assessment of knowledge, practical skills, data accuracy, digital literacy, and enterprise readiness.",
    deliveryType: "exam",
    physicalNote: "Week 13 only unlocks after programme admin confirms Week 12 physical attendance. All practical stations must be passed.",
    objectives: [
      "Demonstrate technical proficiency across all husbandry disciplines.",
      "Show practical competence in handling, disease control, feeding, reproduction and grading.",
      "Achieve high-accuracy traceability and digital record-keeping.",
      "Demonstrate basic enterprise readiness for formalisation and financial inclusion.",
    ],
    modules: [
      { type: "Written Exam",         content: "Comprehensive theory test — 20 MCQs + 10 short-answer questions. Minimum 60% required.",                                                                    location: "🏫 Examination Hall — invigilated",           hours: 2   },
      { type: "Practical Assessment", content: "Multi-station field evaluation: FAMACHA, Five-Point Check, safe handling, feeding, reproductive checks, vaccination simulation, market grading.",            location: "🐐 Field / Farm Site — examiner-assessed",     hours: 4   },
      { type: "Digital Assessment",   content: "RUMER traceability and digital records accuracy test. Minimum 70% required.",                                                                               location: "💻 RUMER Platform — examiner-assessed",        hours: 1.5 },
      { type: "SME Assessment",       content: "Basic enterprise and financial capability test — budgeting, cooperative governance, insurance literacy. Minimum 60% required.",                             location: "🏫 Examination Hall — invigilated",           hours: 1   },
      { type: "Results Publication",  content: "Verification, moderation, scoring and trainee feedback session. Eligibility for disbursement communicated.",                                               location: "🏫 Training Centre — group feedback session", hours: 1   },
    ],
    competencies: [
      "70%+ overall score for certification.",
      "Pass mandatory requirements: FAMACHA, Five-Point Check, safe handling, 3 complete animal digital records.",
      "60%+ in theory exam and SME assessment.",
      "70%+ in digital traceability assessment.",
      "Eligibility for resource disbursement, BN registration and RUMER producer network.",
    ],
    hasQuiz: false,
    assessmentWeighting: [
      { area: "Practical Competency Assessment",         weight: "40%", color: "#a855f7" },
      { area: "Digital Traceability Assessment (RUMER)", weight: "25%", color: "#f97316" },
      { area: "Written Theory Examination",              weight: "20%", color: "#60a5fa" },
      { area: "SME / Finance / Insurance Evaluation",    weight: "15%", color: "#fbbf24" },
    ],
    passingCriteria: {
      overall:             70,
      theory:              60,
      digitalTraceability: 70,
      smeFinance:          60,
      attendanceRequired:  85,
      mandatoryStations: [
        "FAMACHA scoring",
        "Five-Point Check",
        "Safe animal handling",
        "3 complete RUMER animal records",
      ],
    },
  },

];