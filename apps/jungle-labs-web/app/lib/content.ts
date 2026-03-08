import {
  Bot,
  BrainCircuit,
  ChartNoAxesCombined,
  Compass,
  Database,
  FileCode2,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Workflow
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type Product = {
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  status: "In Market" | "Active Build" | "Deployed";
  highlights: string[];
  href?: string;
};

export type Service = {
  title: string;
  short: string;
  details: string;
  icon: LucideIcon;
};

export type BuildSystem = {
  title: string;
  icon: LucideIcon;
};

export type SocialLink = {
  name: "LinkedIn" | "Instagram" | "Facebook";
  href: string;
};

export const navLinks = [
  { label: "Products", href: "#products" },
  { label: "Services", href: "#services" },
  { label: "Technology", href: "#ecosystem" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "#contact" }
];

export const products: Product[] = [
  {
    name: "Franco App",
    subtitle: "AI French Learning Platform",
    description:
      "Reflex-based training, adaptive coaching, and gamified drills that help learners build speaking confidence faster.",
    badge: "Education AI",
    status: "In Market",
    highlights: ["Adaptive lessons", "Pronunciation feedback", "Gamified progress engine"]
  },
  {
    name: "Amalytics",
    subtitle: "Business Budget + Growth Intelligence",
    description:
      "A live analytics workspace for business budgeting, marketing spend efficiency, and growth forecasting.",
    badge: "Analytics Platform",
    status: "Active Build",
    highlights: ["Budget tracking", "Campaign ROI intelligence", "Cashflow and growth forecasting"],
    href: "https://www.amalytics.co/"
  },
  {
    name: "Jungle Table Ordering OS",
    subtitle: "Restaurant Tablet + KDS Platform",
    description:
      "A full in-restaurant ordering system with table screens, live kitchen display workflows, and waiter call routing.",
    badge: "Hospitality Tech",
    status: "Active Build",
    highlights: ["Table-side ordering UI", "Kitchen display system", "Realtime staff call and order status"]
  }
];

export const services: Service[] = [
  {
    title: "AI Automation Systems",
    short: "Turn repetitive tasks into autonomous workflows.",
    details:
      "From lead routing to support triage, we design AI agents and action pipelines that remove operational drag.",
    icon: Bot
  },
  {
    title: "Custom CRM Systems",
    short: "Build your CRM around your exact process.",
    details:
      "We create CRM systems for sales, intake, and service delivery with role-based views and deep integrations.",
    icon: Database
  },
  {
    title: "Custom Software Development",
    short: "Production-grade platforms for web and mobile.",
    details:
      "We build scalable products with clear architecture, reliable deployment, and measurable business impact.",
    icon: FileCode2
  },
  {
    title: "Analytics Platforms",
    short: "Transform data into decisions in real time.",
    details:
      "Executive dashboards, KPI engines, and reporting systems that explain where growth is happening and why.",
    icon: ChartNoAxesCombined
  },
  {
    title: "Business Workflow Automation",
    short: "Connect tools into one intelligent system.",
    details:
      "Unify your stack across CRM, communication, marketing, and operations so work flows without manual friction.",
    icon: Workflow
  }
];

export const ecosystemNodes = [
  "AI Automation",
  "CRM Systems",
  "Analytics Dashboards",
  "Web Platforms",
  "Mobile Apps",
  "Lead Generation Systems"
];

export const systemsWeBuild: BuildSystem[] = [
  { title: "AI Lead Generation Systems", icon: Megaphone },
  { title: "Client Intake Systems", icon: Compass },
  { title: "Immigration CRM Platforms", icon: LayoutDashboard },
  { title: "Education Platforms", icon: GraduationCap },
  { title: "AI Content Systems", icon: BrainCircuit },
  { title: "Business Intelligence Dashboards", icon: ChartNoAxesCombined }
];

export const roadmap = [
  { year: "2025", title: "Franco App", detail: "Launched with AI reflex learning and structured speaking progression." },
  { year: "2026", title: "Amalytics", detail: "Rolling out business budget intelligence and decision dashboards." },
  { year: "2026-2027", title: "Jungle Table Ordering OS", detail: "Deploying tablet-based restaurant ordering and KDS workflows." }
];

export const demoSuggestions = ["Automate my business", "Build a CRM system", "Create analytics dashboard"];

export const socialLinks: SocialLink[] = [
  { name: "LinkedIn", href: "https://www.linkedin.com/company/jungle-labs-world" },
  { name: "Instagram", href: "https://www.instagram.com/junglelabsworld/" },
  { name: "Facebook", href: "https://www.facebook.com/junglelabsworld/" }
];
