import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://redber.in'
  const now = new Date('2026-04-22')

  const corePages: MetadataRoute.Sitemap = [
    { url: baseUrl,                         lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${baseUrl}/capabilities`,       lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/contact`,            lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`,              lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/blog`,               lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/careers`,            lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/cookies`,            lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/privacy-policy`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms-of-service`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const blogPosts: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/blog/ai-reshaping-customer-service`, lastModified: new Date('2026-03-10'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/hidden-cost-missed-leads`,      lastModified: new Date('2026-03-15'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/introducing-redber`,            lastModified: new Date('2026-02-20'), changeFrequency: 'monthly', priority: 0.7 },
  ]

  return [...corePages, ...blogPosts]
}
