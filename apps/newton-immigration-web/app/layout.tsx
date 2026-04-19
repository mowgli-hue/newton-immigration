import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.newtonimmigration.com"),
  title: {
    default: "Newton Immigration | #1 Canada Immigration Consultants Surrey BC",
    template: "%s | Newton Immigration"
  },
  description: "Newton Immigration — RCIC regulated consultants in Surrey BC. Expert help with Express Entry, PGWP, Work Permits, Study Permits, Spousal Sponsorship & PR. Free assessment available.",
  keywords: [
    "Newton Immigration",
    "immigration consultant Surrey BC",
    "RCIC consultant Surrey",
    "Canada immigration consultant",
    "Express Entry consultant",
    "PGWP consultant",
    "work permit Canada",
    "study permit Canada",
    "spousal sponsorship Canada",
    "PR Canada",
    "permanent residence Canada",
    "immigration consultant Vancouver",
    "immigration consultant BC",
    "LMIA work permit",
    "SOWP Canada",
    "Canadian immigration help",
    "CRS score calculator",
    "PNP Canada",
    "immigration consultant Delta BC",
    "Navdeep Singh Sandhu RCIC"
  ],
  authors: [{ name: "Navdeep Singh Sandhu, RCIC (R705964)", url: "https://www.newtonimmigration.com" }],
  creator: "Newton Immigration Inc.",
  publisher: "Newton Immigration Inc.",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "https://www.newtonimmigration.com",
    siteName: "Newton Immigration",
    title: "Newton Immigration | #1 Canada Immigration Consultants Surrey BC",
    description: "RCIC regulated immigration consultants in Surrey BC. Free assessment for Express Entry, PGWP, Work Permits, Study Permits & PR applications.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Newton Immigration - Canada Immigration Consultants" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Newton Immigration | Canada Immigration Consultants Surrey BC",
    description: "RCIC regulated immigration consultants. Free assessment for Express Entry, PGWP, Work Permits & PR.",
    images: ["/og-image.jpg"]
  },
  alternates: {
    canonical: "https://www.newtonimmigration.com"
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || ""
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://www.newtonimmigration.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          "name": "Newton Immigration Inc.",
          "description": "RCIC regulated Canadian immigration consulting firm specializing in Express Entry, work permits, study permits, spousal sponsorship and PR applications.",
          "url": "https://www.newtonimmigration.com",
          "telephone": "+1-778-723-6662",
          "email": "newtonimmigration@gmail.com",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "8327 120 Street",
            "addressLocality": "Delta",
            "addressRegion": "BC",
            "postalCode": "V4C 6R1",
            "addressCountry": "CA"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 49.1041,
            "longitude": -122.8675
          },
          "openingHours": "Mo-Sa 09:00-18:00",
          "priceRange": "$$",
          "servesCuisine": null,
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Immigration Services",
            "itemListElement": [
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Express Entry Consulting" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Work Permit Applications" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Study Permit Applications" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Spousal Sponsorship" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Permanent Residence Applications" } }
            ]
          },
          "sameAs": [
            "https://www.youtube.com/@NewtonImmigrationservices"
          ],
          "founder": {
            "@type": "Person",
            "name": "Navdeep Singh Sandhu",
            "jobTitle": "RCIC (R705964)",
            "worksFor": { "@type": "Organization", "name": "Newton Immigration Inc." }
          },
          "areaServed": [
            { "@type": "City", "name": "Surrey" },
            { "@type": "City", "name": "Vancouver" },
            { "@type": "City", "name": "Delta" },
            { "@type": "City", "name": "Burnaby" },
            { "@type": "City", "name": "Richmond" },
            { "@type": "City", "name": "Calgary" },
            { "@type": "Country", "name": "Canada" }
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "150"
          }
        }) }} />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
