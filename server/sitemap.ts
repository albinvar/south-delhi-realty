import express from 'express';
import { storage } from './storage';

const router = express.Router();

// Generate XML sitemap with enhanced SEO structure
router.get('/sitemap.xml', async (req, res) => {
  try {
    const properties = await storage.getProperties();
    
    const baseUrl = process.env.CLIENT_URL || 'https://southdelhirealty.com';
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Homepage - Highest Priority -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Properties listing page - High Priority -->
  <url>
    <loc>${baseUrl}/properties</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

    // Add individual property pages with image data
    properties.forEach(property => {
      const lastModified = property.updatedAt ? new Date(property.updatedAt).toISOString() : new Date().toISOString();
      sitemap += `
  <url>
    <loc>${baseUrl}/property/${property.slug}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;
    
      // Add property images for better SEO
      if (property.media && property.media.length > 0) {
        property.media.forEach((media: any) => {
          if (media.mediaType === 'image' && media.cloudinaryUrl) {
            sitemap += `
    <image:image>
      <image:loc>${media.cloudinaryUrl}</image:loc>
      <image:title>${property.title} - South Delhi Property</image:title>
      <image:caption>Premium ${property.propertyType} property in South Delhi</image:caption>
    </image:image>`;
          }
        });
      }
      
      sitemap += `
  </url>`;
    });

    // Add category pages - Optimized for target keywords
    const categories = [
      { slug: 'apartment', name: 'Apartments in South Delhi' },
      { slug: 'independent-house', name: 'Independent Houses in South Delhi' },
      { slug: 'villa', name: 'Villas in South Delhi' },
      { slug: 'commercial', name: 'Commercial Properties in South Delhi' },
      { slug: 'luxury', name: 'Luxury Properties in South Delhi' },
      { slug: 'budget', name: 'Budget Properties in South Delhi' }
    ];
    
    categories.forEach(category => {
      sitemap += `
  <url>
    <loc>${baseUrl}/properties?type=${category.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add location-based pages for South Delhi areas
    const locations = [
      { slug: 'greater-kailash', name: 'Greater Kailash Properties' },
      { slug: 'defence-colony', name: 'Defence Colony Properties' },
      { slug: 'lajpat-nagar', name: 'Lajpat Nagar Properties' },
      { slug: 'khan-market', name: 'Khan Market Properties' },
      { slug: 'safdarjung', name: 'Safdarjung Properties' },
      { slug: 'green-park', name: 'Green Park Properties' },
      { slug: 'hauz-khas', name: 'Hauz Khas Properties' },
      { slug: 'vasant-vihar', name: 'Vasant Vihar Properties' },
      { slug: 'south-extension', name: 'South Extension Properties' },
      { slug: 'nehru-place', name: 'Nehru Place Properties' },
      { slug: 'kalkaji', name: 'Kalkaji Properties' },
      { slug: 'cr-park', name: 'CR Park Properties' }
    ];
    
    locations.forEach(location => {
      sitemap += `
  <url>
    <loc>${baseUrl}/properties?location=${location.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Add sale/rent specific pages
    const statuses = [
      { slug: 'sale', name: 'Properties for Sale in South Delhi' },
      { slug: 'rent', name: 'Properties for Rent in South Delhi' }
    ];
    
    statuses.forEach(status => {
      sitemap += `
  <url>
    <loc>${baseUrl}/properties?status=${status.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add combined category + location pages for better SEO coverage
    categories.slice(0, 4).forEach(category => {
      locations.slice(0, 6).forEach(location => {
        sitemap += `
  <url>
    <loc>${baseUrl}/properties?type=${category.slug}&location=${location.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      });
    });

    // Static pages
    const staticPages = [
      { slug: 'about', priority: '0.7', changefreq: 'monthly' },
      { slug: 'contact', priority: '0.7', changefreq: 'weekly' },
      { slug: 'services', priority: '0.7', changefreq: 'monthly' },
      { slug: 'terms', priority: '0.5', changefreq: 'yearly' },
      { slug: 'privacy', priority: '0.5', changefreq: 'yearly' },
      { slug: 'cookies', priority: '0.5', changefreq: 'yearly' }
    ];

    staticPages.forEach(page => {
      sitemap += `
  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    res.set('Content-Type', 'text/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Enhanced robots.txt with better SEO directives
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.CLIENT_URL || 'https://southdelhirealty.com';
  
  const robots = `User-agent: *
Allow: /
Allow: /properties
Allow: /property/
Allow: /about
Allow: /contact
Allow: /services

# Block admin and private areas
Disallow: /admin/
Disallow: /auth/
Disallow: /api/
Disallow: /private/
Disallow: /login
Disallow: /register

# Block unwanted query parameters
Disallow: /*?*&*
Disallow: /*?*sort=*
Disallow: /*?*page=*
Disallow: /*?*limit=*
Disallow: /*.json$
Disallow: /*.xml$
Disallow: /*_escaped_fragment_

# Allow important static assets
Allow: /assets/
Allow: /*.css$
Allow: /*.js$
Allow: /*.png$
Allow: /*.jpg$
Allow: /*.jpeg$
Allow: /*.gif$
Allow: /*.svg$
Allow: /*.webp$
Allow: /*.ico$
Allow: /sdrlogo.png
Allow: /favicon.ico

# Special directives for major search engines
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: Slurp
Allow: /
Crawl-delay: 2

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Host directive for preferred domain
Host: ${baseUrl}`;

  res.set('Content-Type', 'text/plain');
  res.send(robots);
});

export default router; 