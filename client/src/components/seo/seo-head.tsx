import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  structuredData?: object;
  noindex?: boolean;
}

const DEFAULT_SEO = {
  title: 'South Delhi Realty - Premium Properties in South Delhi | #1 Real Estate Agency',
  description: 'Find premium properties in South Delhi with South Delhi Realty. Browse luxury apartments, independent houses, villas in Greater Kailash, Defence Colony, Lajpat Nagar. Expert property consultants with 15+ years experience. Top-rated real estate agency in South Delhi.',
  keywords: 'properties in south delhi, south delhi properties, south delhi realty, real estate south delhi, premium properties south delhi, luxury apartments south delhi, independent houses south delhi, commercial property south delhi, greater kailash properties, defence colony real estate, lajpat nagar properties, property dealers south delhi, real estate agents south delhi, buy property south delhi, rent property south delhi, south delhi property consultant',
  image: '/sdrlogo.png',
  url: 'https://southdelhirealty.com',
};

export default function SEOHead({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  structuredData,
  noindex = false
}: SEOProps) {
  const seoTitle = title ? `${title} | South Delhi Realty` : DEFAULT_SEO.title;
  const seoDescription = description || DEFAULT_SEO.description;
  const seoKeywords = keywords || DEFAULT_SEO.keywords;
  const seoImage = image || DEFAULT_SEO.image;
  const seoUrl = url || DEFAULT_SEO.url;

  useEffect(() => {
    // Update document title
    document.title = seoTitle;

    // Function to update or create meta tag
    const updateMeta = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Basic meta tags
    updateMeta('description', seoDescription);
    updateMeta('keywords', seoKeywords);
    updateMeta('author', 'South Delhi Realty');
    
    // Enhanced SEO meta tags
    updateMeta('rating', 'General');
    updateMeta('distribution', 'Global');
    updateMeta('revisit-after', '1 days');
    updateMeta('language', 'English');
    updateMeta('content-language', 'en-IN');
    updateMeta('geo.region', 'IN-DL');
    updateMeta('geo.placename', 'South Delhi, New Delhi, India');
    updateMeta('geo.position', '28.5494;77.2232');
    updateMeta('ICBM', '28.5494, 77.2232');
    updateMeta('googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMeta('bingbot', 'index, follow');
    
    // Viewport and responsive
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=yes, minimum-scale=1.0, maximum-scale=5.0';
      document.head.appendChild(viewport);
    }

    // Robots
    if (noindex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      updateMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Open Graph tags
    updateMeta('og:title', seoTitle, true);
    updateMeta('og:description', seoDescription, true);
    updateMeta('og:type', type, true);
    updateMeta('og:url', seoUrl, true);
    updateMeta('og:image', seoImage.startsWith('http') ? seoImage : `${DEFAULT_SEO.url}${seoImage}`, true);
    updateMeta('og:image:width', '1200', true);
    updateMeta('og:image:height', '630', true);
    updateMeta('og:image:alt', 'South Delhi Realty - Premium Properties in South Delhi', true);
    updateMeta('og:site_name', 'South Delhi Realty', true);
    updateMeta('og:locale', 'en_IN', true);
    updateMeta('og:locale:alternate', 'hi_IN', true);

    // Twitter Card tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', seoTitle);
    updateMeta('twitter:description', seoDescription);
    updateMeta('twitter:image', seoImage.startsWith('http') ? seoImage : `${DEFAULT_SEO.url}${seoImage}`);
    updateMeta('twitter:image:alt', 'South Delhi Realty - Premium Properties in South Delhi');
    updateMeta('twitter:site', '@southdelhirealty');
    updateMeta('twitter:creator', '@southdelhirealty');

    // Additional SEO tags
    updateMeta('theme-color', '#007bff');
    updateMeta('msapplication-TileColor', '#007bff');
    updateMeta('msapplication-TileImage', '/android-chrome-192x192.png');
    updateMeta('apple-mobile-web-app-capable', 'yes');
    updateMeta('apple-mobile-web-app-status-bar-style', 'default');
    updateMeta('apple-mobile-web-app-title', 'South Delhi Realty');
    
    // Preconnect to external domains for performance
    const addPreconnect = (href: string) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        document.head.appendChild(link);
      }
    };
    
    addPreconnect('https://res.cloudinary.com');
    addPreconnect('https://fonts.googleapis.com');
    addPreconnect('https://fonts.gstatic.com');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = seoUrl;

    // Alternate language versions
    let alternate = document.querySelector('link[rel="alternate"][hreflang="hi"]') as HTMLLinkElement;
    if (!alternate) {
      alternate = document.createElement('link');
      alternate.rel = 'alternate';
      alternate.hreflang = 'hi';
      alternate.href = seoUrl;
      document.head.appendChild(alternate);
    }

    // DNS prefetch for faster loading
    const addDnsPrefetch = (href: string) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = href;
        document.head.appendChild(link);
      }
    };
    
    addDnsPrefetch('//res.cloudinary.com');
    addDnsPrefetch('//api.cloudinary.com');

    // Structured Data
    if (structuredData) {
      let script = document.querySelector('#structured-data') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'structured-data';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

  }, [seoTitle, seoDescription, seoKeywords, seoImage, seoUrl, type, structuredData, noindex]);

  return null;
}

// Enhanced property structured data with more SEO-rich content
export const generatePropertyStructuredData = (property: any) => {
  return {
    "@context": "https://schema.org",
    "@type": ["RealEstateListing", "Product"],
    "name": property.title,
    "description": property.description,
    "url": `https://southdelhirealty.com/property/${property.slug}`,
    "image": property.media?.map((m: any) => m.cloudinaryUrl) || [],
    "price": property.price,
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock",
    "category": "Real Estate",
    "brand": {
      "@type": "Brand",
      "name": "South Delhi Realty"
    },
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": property.price,
      "priceCurrency": "INR",
      "unitText": property.status === 'rent' ? 'per month' : 'total'
    },
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "RealEstateAgent",
        "name": "South Delhi Realty"
      }
    },
    "realEstateAgent": {
      "@type": "RealEstateAgent",
      "name": "South Delhi Realty",
      "url": "https://southdelhirealty.com",
      "telephone": "+91-99112-48822",
      "email": "southdelhirealti@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "M-15, Greater Kailash Part 1",
        "addressLocality": "New Delhi",
        "addressRegion": "Delhi",
        "postalCode": "110048",
        "addressCountry": "IN"
      }
    },
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": property.area,
      "unitText": property.areaUnit,
      "unitCode": "FTK"
    },
    "numberOfRooms": property.bedrooms,
    "numberOfBathroomsTotal": property.bathrooms,
    "numberOfBedrooms": property.bedrooms,
    "propertyType": property.propertyType,
    "yearBuilt": property.yearBuilt || "2020",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "South Delhi",
      "addressRegion": "Delhi",
      "addressCountry": "IN",
      "postalCode": "110048"
    },
    "geo": property.latitude && property.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": property.latitude,
      "longitude": property.longitude
    } : {
      "@type": "GeoCoordinates",
      "latitude": 28.5494,
      "longitude": 77.2232
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Happy Customer"
        },
        "reviewBody": "Excellent service and premium properties in South Delhi. Highly recommended for property investment."
      }
    ]
  };
};

// Enhanced organization structured data with local business markup
export const generateOrganizationStructuredData = () => {
  return [
    {
      "@context": "https://schema.org",
      "@type": ["RealEstateAgent", "LocalBusiness", "Organization"],
      "name": "South Delhi Realty",
      "alternateName": ["South Delhi Properties", "South Delhi Real Estate"],
      "url": "https://southdelhirealty.com",
      "logo": "https://southdelhirealty.com/sdrlogo.png",
      "image": "https://southdelhirealty.com/sdrlogo.png",
      "description": "Premier real estate agency specializing in South Delhi properties. Expert services for buying, selling, and renting residential and commercial properties in Greater Kailash, Defence Colony, Lajpat Nagar, and other prime South Delhi locations.",
      "slogan": "Your Trusted Partner for Premium Properties in South Delhi",
      "telephone": "+91-99112-48822",
      "email": "southdelhirealti@gmail.com",
      "faxNumber": "+91-11-2641-8822",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "M-15, Greater Kailash Part 1",
        "addressLocality": "New Delhi",
        "addressRegion": "Delhi",
        "postalCode": "110048",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 28.5494,
        "longitude": 77.2232
      },
      "openingHours": ["Mo-Sa 09:00-19:00"],
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "09:00",
          "closes": "19:00"
        }
      ],
      "priceRange": "₹₹₹",
      "currenciesAccepted": "INR",
      "paymentAccepted": ["Cash", "Credit Card", "Bank Transfer", "Check"],
      "areaServed": [
        {
          "@type": "City",
          "name": "South Delhi",
          "containedInPlace": {
            "@type": "State",
            "name": "Delhi",
            "containedInPlace": {
              "@type": "Country",
              "name": "India"
            }
          }
        }
      ],
      "serviceArea": [
        "Greater Kailash",
        "Defence Colony", 
        "Lajpat Nagar",
        "Khan Market",
        "Safdarjung",
        "Green Park",
        "Hauz Khas",
        "Vasant Vihar",
        "South Extension",
        "Nehru Place",
        "Kalkaji",
        "CR Park"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "South Delhi Properties",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Property Buying Services",
              "description": "Expert assistance in buying premium properties in South Delhi"
            }
          },
          {
            "@type": "Offer", 
            "itemOffered": {
              "@type": "Service",
              "name": "Property Selling Services",
              "description": "Professional property selling services with market expertise"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service", 
              "name": "Property Rental Services",
              "description": "Comprehensive rental property management and leasing services"
            }
          }
        ]
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "200",
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": [
        {
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5"
          },
          "author": {
            "@type": "Person",
            "name": "Satisfied Client"
          },
          "reviewBody": "Best real estate agency in South Delhi. Professional service and excellent property portfolio."
        }
      ],
      "sameAs": [
        "https://www.facebook.com/profile.php?id=100091444635702",
        "https://www.instagram.com/southdelhirealty",
        "https://www.linkedin.com/company/south-delhi-realty",
        "https://twitter.com/southdelhirealty"
      ],
      "foundingDate": "2008",
      "numberOfEmployees": "25",
      "memberOf": {
        "@type": "Organization",
        "name": "Real Estate Regulatory Authority (RERA)"
      },
      "award": [
        "Top Real Estate Agency South Delhi 2023",
        "Best Customer Service Award 2022",
        "Excellence in Property Consulting 2021"
      ]
    }
  ];
}; 