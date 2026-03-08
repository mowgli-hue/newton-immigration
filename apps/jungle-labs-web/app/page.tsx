import { AIDemoSection } from "./components/AIDemoSection";
import { ContactCTA } from "./components/ContactCTA";
import { EcosystemSection } from "./components/EcosystemSection";
import { HeroSection } from "./components/HeroSection";
import { MotionRibbon } from "./components/MotionRibbon";
import { Navbar } from "./components/Navbar";
import { ProductsSection } from "./components/ProductsSection";
import { RoadmapSection } from "./components/RoadmapSection";
import { ServicesSection } from "./components/ServicesSection";
import { SiteFooter } from "./components/SiteFooter";
import { StorySection } from "./components/StorySection";
import { SystemsSection } from "./components/SystemsSection";

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Jungle Labs",
  url: "https://www.junglelabsworld.ca",
  email: "admin@junglelabsworld.com",
  telephone: "+1-604-902-8699",
  address: {
    "@type": "PostalAddress",
    streetAddress: "9850 King George Blvd",
    addressLocality: "Surrey",
    addressRegion: "BC",
    postalCode: "V3T 0P9",
    addressCountry: "CA"
  },
  sameAs: [
    "https://www.linkedin.com",
    "https://www.instagram.com",
    "https://www.facebook.com"
  ],
  knowsAbout: [
    "AI Automation",
    "Custom CRM Systems",
    "Software Development",
    "Analytics Platforms",
    "Business Workflow Automation"
  ]
};

export default function HomePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <Navbar />
      <HeroSection />
      <MotionRibbon />
      <StorySection />
      <ProductsSection />
      <ServicesSection />
      <EcosystemSection />
      <SystemsSection />
      <RoadmapSection />
      <AIDemoSection />
      <ContactCTA />
      <SiteFooter />
    </main>
  );
}
