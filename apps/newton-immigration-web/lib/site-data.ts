export type Program = {
  slug: string;
  title: string;
  description: string;
  eligibility: string[];
  documents: string[];
  process: string[];
  timeline: string;
};

export const companyInfo = {
  legalName: "Newton Immigration Inc.",
  tagline: "Expert Visa & Immigration Services",
  coverage: "Canada | USA | Study, Work, Visitor, PR",
  headquarters: "Surrey, BC",
  branches: ["Calgary", "Gajsinghpur (RJ 13)", "Zira"],
  emails: ["newtonimmigration@gmail.com", "services.newtonimmigration@gmail.com"]
};

export const socialLinks = {
  instagram: "https://www.instagram.com/newton_immigration/?hl=en",
  youtube: "https://www.youtube.com/@NewtonImmigrationservices",
  google: "https://share.google/BpLt3N2TYLWmiGLyX",
  linkedin: "https://www.linkedin.com"
};

export const programs: Program[] = [
  {
    slug: "express-entry",
    title: "Express Entry",
    description: "Federal pathway for skilled workers through CRS ranking and invitation rounds.",
    eligibility: ["Skilled work experience", "Language test", "Education credential evaluation"],
    documents: ["Passport", "IELTS/CELPIP results", "ECA report", "Work letters", "Proof of funds"],
    process: ["Eligibility check", "Profile creation", "CRS optimization", "ITA application", "PR submission"],
    timeline: "6 to 10 months"
  },
  {
    slug: "provincial-nominee-program",
    title: "Provincial Nominee Programs",
    description: "Province-specific nomination streams that can add +600 CRS points.",
    eligibility: ["Provincial criteria match", "Targeted occupation/experience", "Intent to reside in province"],
    documents: ["Provincial forms", "Employment proof", "Education records", "Language test", "Identity documents"],
    process: ["Profile mapping", "Province targeting", "Expression of interest", "Nomination", "Federal PR filing"],
    timeline: "8 to 14 months"
  },
  {
    slug: "work-permits",
    title: "Work Permits",
    description: "Employer-backed and open work permit support for temporary and long-term plans.",
    eligibility: ["Valid job offer or permit category", "Admissibility compliance", "Proof of qualifications"],
    documents: ["Offer letter/LMIA", "Resume", "Education records", "Passport", "Supporting letters"],
    process: ["Permit strategy", "Documentation", "Submission", "Biometrics", "Decision"],
    timeline: "2 to 6 months"
  },
  {
    slug: "study-permits",
    title: "Study Permits",
    description: "Study pathway planning with post-graduation and PR transition strategy.",
    eligibility: ["Letter of acceptance", "Financial proof", "Genuine student profile"],
    documents: ["LOA", "Statement of purpose", "Bank statements", "Academic transcripts", "Passport"],
    process: ["School selection", "Application prep", "Permit filing", "Travel readiness", "PR bridge plan"],
    timeline: "6 to 14 weeks"
  },
  {
    slug: "visitor-visas",
    title: "Visitor Visas",
    description: "Temporary resident visa and extension support with refusal-risk mitigation.",
    eligibility: ["Purpose of visit", "Ties to home country", "Financial capacity"],
    documents: ["Invitation (if applicable)", "Bank statements", "Travel plan", "Employment proof", "Passport"],
    process: ["Profile review", "Risk analysis", "Application filing", "Biometrics", "Decision and travel prep"],
    timeline: "3 to 12 weeks"
  },
  {
    slug: "citizenship",
    title: "Citizenship",
    description: "Canadian citizenship eligibility review, filing, and test/interview guidance.",
    eligibility: ["Physical presence requirement", "Tax filing compliance", "Language (if required)"],
    documents: ["PR card", "Travel history", "Tax records", "Identity documents", "Language proof"],
    process: ["Eligibility audit", "Application prep", "Submission", "Test/interview prep", "Oath ceremony"],
    timeline: "12 to 24 months"
  }
];

export const blogPosts = [
  {
    slug: "express-entry-2026-roadmap",
    title: "Express Entry in 2026: Practical Roadmap for Skilled Applicants",
    category: "Express Entry",
    summary: "How to build a stronger profile before your first draw and avoid preventable delays.",
    body: "Focus on language uplift, clean work documentation, and category-based draw fit. Early profile optimization often saves months in processing cycles."
  },
  {
    slug: "work-permit-to-pr",
    title: "From Work Permit to Permanent Residence",
    category: "Work Permits",
    summary: "Turn temporary status into long-term settlement using CEC and provincial pathways.",
    body: "Track qualifying work hours and maintain continuous compliance. Pair your employer strategy with early CRS planning to reduce transition risk."
  },
  {
    slug: "pnp-targeting-framework",
    title: "PNP Targeting Framework: Choosing the Right Province",
    category: "PNP Programs",
    summary: "How to evaluate nomination streams by occupation, timelines, and invitation trends.",
    body: "Assess occupation demand, expression-of-interest thresholds, and employer market fit. A data-led province plan improves nomination probability."
  }
];

export const newsItems = [
  {
    title: "Express Entry Draw - CRS 508",
    category: "Express Entry Draw Updates",
    text: "Higher cutoffs signal stronger competition. Applicants below threshold should prioritize language and additional points strategies."
  },
  {
    title: "IRCC Processing Policy Refresh",
    category: "IRCC policy changes",
    text: "Updated verification sequencing may impact document readiness expectations. Early-quality submissions matter more than ever."
  },
  {
    title: "Alberta PNP Draw Focuses on In-Demand Occupations",
    category: "PNP draws",
    text: "Occupation-specific targeting creates new openings for strategic applicants with relevant profiles."
  },
  {
    title: "Work Permit Stream Update",
    category: "Work permit updates",
    text: "Recent adjustments emphasize employer compliance documentation and timely profile updates."
  }
];

export const locations = [
  {
    city: "Surrey, Canada",
    address: "9850 King George Blvd, Surrey, BC",
    phone: "604-653-5031 / 604-897-5894",
    email: "newtonimmigration@gmail.com",
    map: "https://www.google.com/maps?q=9850+King+George+Blvd+Surrey+BC&output=embed"
  },
  {
    city: "Calgary, Canada",
    address: "4715 88 Ave NE, Calgary, AB T3J 4C5",
    phone: "604-907-0218 / 604-907-0314",
    email: "services.newtonimmigration@gmail.com",
    map: "https://www.google.com/maps?q=4715+88+Ave+NE+Calgary+AB+T3J+4C5&output=embed"
  },
  {
    city: "India Branches",
    address: "Gajsinghpur (RJ 13) and Zira",
    phone: "Contact via Surrey HQ",
    email: "newtonimmigration@gmail.com / services.newtonimmigration@gmail.com",
    map: "https://www.google.com/maps?q=Gajsinghpur+Rajasthan+India&output=embed"
  }
];

export const youtubeVideos = [
  "https://www.youtube.com/@NewtonImmigrationservices/videos",
  "https://www.youtube.com/@NewtonImmigrationservices/shorts",
  "https://www.youtube.com/@NewtonImmigrationservices"
];

export const immigrationTypes = [
  {
    title: "Express Entry",
    text: "Fast-track PR pathway for skilled workers with CRS ranking.",
    tone: "from-rose-700/40 to-slate-900"
  },
  {
    title: "Study Permits",
    text: "Build long-term immigration strategy through Canada education.",
    tone: "from-blue-700/40 to-slate-900"
  },
  {
    title: "Work Permits",
    text: "Employer and open permit options with PR transition planning.",
    tone: "from-emerald-700/40 to-slate-900"
  },
  {
    title: "PNP Programs",
    text: "Province-targeted nominations that can unlock +600 CRS points.",
    tone: "from-orange-700/40 to-slate-900"
  }
];

export const testimonials = [
  {
    name: "Aman S.",
    location: "Surrey",
    text: "Newton Immigration helped me move from work permit planning to a clear PR strategy with realistic milestones."
  },
  {
    name: "Navpreet K.",
    location: "Calgary",
    text: "The CRS strategy report was practical and specific. I improved my language score and received better pathway options."
  },
  {
    name: "Harleen G.",
    location: "Punjab",
    text: "Their team explained PNP and study pathways in simple steps. The process felt structured from day one."
  }
];

export const faqs = [
  {
    q: "Can I apply for PR with CRS around 460?",
    a: "Yes, depending on draw type and category fit. You should also evaluate PNP options and score improvement levers."
  },
  {
    q: "Is Alberta PNP possible without a job offer?",
    a: "In some streams it can be possible, but eligibility depends on your profile, occupation alignment, and current provincial priorities."
  },
  {
    q: "How much can French improve my profile?",
    a: "French can add significant CRS points and open category-based invitations for eligible candidates."
  },
  {
    q: "Do I need Canadian experience for CEC?",
    a: "Yes. CEC requires qualifying skilled Canadian work experience and language level criteria."
  }
];

export const advisorQuickQuestions = [
  "Can I apply for PR with CRS 460?",
  "Is Alberta PNP possible for me?",
  "Do I qualify for CEC?",
  "How can I increase my CRS quickly?"
];
