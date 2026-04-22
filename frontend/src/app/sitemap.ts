import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://redber.in'

  // Standard routes
  const routes = [
    '',
    '/about',
    '/blog',
    '/careers',
    '/contact',
    '/capabilities',
    '/privacy-policy',
    '/terms-of-service',
    '/cookies'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Blog dynamic routes
  const blogs = [
    'ai-reshaping-customer-service',
    'hidden-cost-missed-leads',
    'introducing-redber'
  ].map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...routes, ...blogs]
}
